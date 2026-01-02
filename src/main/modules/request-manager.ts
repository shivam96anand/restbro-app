import { ApiRequest, ApiResponse } from '../../shared/types';
import { oauthManager } from './oauth';
import { composeFinalRequest, buildFolderVars, scanUnresolvedVars } from './variables';
import { storeManager } from './store-manager';
import * as http from 'http';
import * as https from 'https';
import * as zlib from 'zlib';
import { URL } from 'url';
import { RequestBuilder } from './request-builder';
import { RequestErrorFormatter } from './request-error-formatter';

class RequestManager {
  private activeRequests = new Map<string, { req: http.ClientRequest; reject: (err: Error) => void }>();

  async sendRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();
    const requestId = request.id || `request-${Date.now()}`;

    // Resolve variables first
    const state = storeManager.getState();
    const activeEnv = state.activeEnvironmentId
      ? state.environments.find((e) => e.id === state.activeEnvironmentId)
      : undefined;

    // Fix collectionId if it points to a request-type collection
    // buildFolderVars() only processes folder-type collections, so we need the parent folder ID
    let collectionIdForVars = request.collectionId;
    if (collectionIdForVars) {
      const collection = state.collections.find(c => c.id === collectionIdForVars);
      if (collection) {
        console.log('[Request Manager] Collection info:', {
          collectionId: collection.id,
          collectionName: collection.name,
          collectionType: collection.type,
          parentId: collection.parentId
        });
        if (collection.type === 'request' && collection.parentId) {
          console.log('[Request Manager] Using parentId for variable resolution:', collection.parentId);
          collectionIdForVars = collection.parentId;
        }
      } else {
        console.warn('[Request Manager] Collection not found:', collectionIdForVars);
      }
    }

    // Build folder variables from ancestor chain
    const folderVars = buildFolderVars(
      collectionIdForVars,
      state.collections
    );

    // Debug logging for variable resolution
    console.log('[Request Manager] Variable resolution context:', {
      requestId: request.id,
      originalCollectionId: request.collectionId,
      resolvedCollectionId: collectionIdForVars,
      requestVars: Object.keys(request.variables || {}),
      folderVarsKeys: Object.keys(folderVars),
      folderVarsValues: folderVars, // Show actual values to confirm resolution
      envVars: Object.keys(activeEnv?.variables || {}),
      globalVars: Object.keys(state.globals?.variables || {}),
    });
    console.log('[Request Manager] URL before resolution:', request.url);

    const resolvedRequest = composeFinalRequest(
      request,
      activeEnv,
      state.globals,
      folderVars
    );
    console.log('[Request Manager] URL after resolution:', resolvedRequest.url);

    // Create a request object with resolved values
    const requestWithResolved: ApiRequest = {
      ...request,
      url: resolvedRequest.url,
      params: resolvedRequest.params,
      headers: resolvedRequest.headers,
      body: resolvedRequest.body as any,
      auth: resolvedRequest.auth,
    };

    // Handle OAuth token refresh if needed
    const updatedRequest = await this.handleOAuthRefresh(requestWithResolved);

    // Check for unresolved variables in URL before attempting request
    const opts = {
      requestVars: request.variables || {},
      folderVars: folderVars || {},
      envVars: activeEnv?.variables || {},
      globalVars: state.globals?.variables || {},
    };
    const unresolvedVars = scanUnresolvedVars(updatedRequest.url, opts);
    if (unresolvedVars.length > 0) {
      const endTime = Date.now();
      const errorBody = RequestErrorFormatter.formatUnresolvedVariablesError(
        updatedRequest.url,
        unresolvedVars
      );
      return Promise.resolve({
        status: 400,
        statusText: 'Unresolved Variables',
        headers: { 'Content-Type': 'application/json' },
        body: errorBody,
        time: endTime - startTime,
        size: Buffer.byteLength(errorBody),
        timestamp: endTime,
      });
    }

    return new Promise<ApiResponse>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        this.activeRequests.delete(requestId);
      };

      const safeResolve = (response: ApiResponse): void => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(response);
      };

      const safeReject = (error: Error): void => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      try {
        // Build URL with query parameters
        const urlString = RequestBuilder.buildUrlWithParams(
          updatedRequest.url,
          updatedRequest.params
        );

        const parsedUrl = new URL(urlString);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        // Build headers
        let cleanHeaders = RequestBuilder.buildHeaders(updatedRequest);

        // Build body
        const { bodyData, contentType } =
          RequestBuilder.buildBody(updatedRequest);

        // Add default headers
        cleanHeaders = RequestBuilder.addDefaultHeaders(
          cleanHeaders,
          bodyData,
          contentType
        );

        const options: http.RequestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: updatedRequest.method,
          headers: cleanHeaders,
        };

        const req = httpModule.request(options, (res) => {
          this.handleResponse(res, startTime, safeResolve);
        });

        req.on('error', (error) => {
          this.handleRequestError(error, urlString, startTime, safeResolve);
        });

        this.activeRequests.set(requestId, { req, reject: safeReject });

        // Write body data if present
        if (bodyData) {
          req.write(bodyData);
        }

        req.end();
      } catch (error) {
        this.handleGeneralError(error, updatedRequest.url, startTime, safeResolve);
      }
    });
  }

  cancelRequest(requestId: string): boolean {
    const active = this.activeRequests.get(requestId);

    if (!active) {
      return false;
    }

    active.req.destroy(new Error('Request cancelled by user'));
    active.reject(new Error('Request cancelled by user'));
    return true;
  }

  private handleResponse(
    res: http.IncomingMessage,
    startTime: number,
    resolve: (value: ApiResponse) => void
  ): void {
    const chunks: Buffer[] = [];
    const rawChunks: Buffer[] = [];

    // Handle compressed responses
    const encoding = res.headers['content-encoding'];
    let responseStream: NodeJS.ReadableStream = res;

    // Collect raw compressed data for accurate size calculation
    res.on('data', (chunk: Buffer) => {
      rawChunks.push(chunk);
    });

    if (encoding === 'gzip') {
      responseStream = res.pipe(zlib.createGunzip());
    } else if (encoding === 'deflate') {
      responseStream = res.pipe(zlib.createInflate());
    } else if (encoding === 'br') {
      responseStream = res.pipe(zlib.createBrotliDecompress());
    }

    responseStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    responseStream.on('end', () => {
      const endTime = Date.now();
      const body = Buffer.concat(chunks).toString();

      const responseHeaders: Record<string, string> = {};
      Object.entries(res.headers).forEach(([key, value]) => {
        responseHeaders[key] = Array.isArray(value)
          ? value.join(', ')
          : value || '';
      });

      // Calculate correct size
      const compressedSize = Buffer.concat(rawChunks).length;
      const uncompressedSize = Buffer.byteLength(body);
      const actualTransferSize = encoding ? compressedSize : uncompressedSize;

      resolve({
        status: res.statusCode || 0,
        statusText: res.statusMessage || '',
        headers: responseHeaders,
        body,
        time: endTime - startTime,
        size: actualTransferSize,
        timestamp: endTime,
      });
    });

    responseStream.on('error', (error) => {
      const endTime = Date.now();
      const errorBody =
        RequestErrorFormatter.formatDecompressionError(error);
      resolve({
        status: 422,
        statusText: 'Decompression Error',
        headers: { 'Content-Type': 'application/json' },
        body: errorBody,
        time: endTime - startTime,
        size: Buffer.byteLength(errorBody),
        timestamp: endTime,
      });
    });
  }

  private handleRequestError(
    error: any,
    url: string,
    startTime: number,
    resolve: (value: ApiResponse) => void
  ): void {
    const endTime = Date.now();
    const errorBody = RequestErrorFormatter.formatNetworkError(error, url);
    resolve({
      status: RequestErrorFormatter.getErrorStatusCode(error),
      statusText: RequestErrorFormatter.getErrorTitle(error),
      headers: { 'Content-Type': 'application/json' },
      body: errorBody,
      time: endTime - startTime,
      size: Buffer.byteLength(errorBody),
      timestamp: endTime,
    });
  }

  private handleGeneralError(
    error: any,
    url: string,
    startTime: number,
    resolve: (value: ApiResponse) => void
  ): void {
    const endTime = Date.now();
    const statusCode = RequestErrorFormatter.getErrorStatusCode(error);
    const errorBody = RequestErrorFormatter.formatGeneralError(error, url);
    resolve({
      status: statusCode,
      statusText: 'Request Failed',
      headers: { 'Content-Type': 'application/json' },
      body: errorBody,
      time: endTime - startTime,
      size: Buffer.byteLength(errorBody),
      timestamp: endTime,
    });
  }

  private async handleOAuthRefresh(
    request: ApiRequest
  ): Promise<ApiRequest> {
    if (!request.auth || request.auth.type !== 'oauth2') {
      return request;
    }

    const tokenInfo = oauthManager.getTokenInfo(
      request.auth.config as any
    );

    if (tokenInfo.isValid) {
      return request;
    }

    if (request.auth.config.refreshToken) {
      try {
        const refreshResult = await oauthManager.refreshToken(
          request.auth.config as any
        );

        if (refreshResult.success && refreshResult.data) {
          return {
            ...request,
            auth: {
              ...request.auth,
              config: {
                ...request.auth.config,
                accessToken: refreshResult.data.accessToken,
                refreshToken:
                  refreshResult.data.refreshToken ||
                  request.auth.config.refreshToken,
                expiresAt: new Date(
                  Date.now() + refreshResult.data.expiresIn * 1000
                ).toISOString(),
              },
            },
          };
        }
      } catch (error) {
        console.warn('Failed to refresh OAuth token:', error);
      }
    }

    return request;
  }
}

export const requestManager = new RequestManager();
