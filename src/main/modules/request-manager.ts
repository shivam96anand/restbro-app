import { ApiRequest, ApiResponse } from '../../shared/types';
import * as http from 'http';
import * as https from 'https';
import * as zlib from 'zlib';
import { URL } from 'url';

class RequestManager {
  async sendRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();

    return new Promise<ApiResponse>((resolve) => {
      try {
        // Build URL with query parameters
        let urlString = request.url;
        if (request.params && Object.keys(request.params).length > 0) {
          const urlObj = new URL(urlString);
          Object.entries(request.params).forEach(([key, value]) => {
            if (key.trim() && value.trim()) {
              urlObj.searchParams.set(key.trim(), value.trim());
            }
          });
          urlString = urlObj.toString();
        }

        const parsedUrl = new URL(urlString);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        // Build clean headers object - only include what the user specified
        const cleanHeaders: Record<string, string> = {};

        // Add user-specified headers
        Object.entries(request.headers || {}).forEach(([key, value]) => {
          if (key.trim() && value.trim()) {
            cleanHeaders[key.trim()] = value.trim();
          }
        });

        // Headers are already filtered by the UI based on checkbox state
        // No need to add default headers here as they're managed in the frontend

        // Handle request body and Content-Type
        let bodyData: string | Buffer | undefined;
        if (request.body && request.body.type !== 'none') {
          if (request.body.type === 'json') {
            bodyData = request.body.content;
            // Only set Content-Type if not already specified by user
            if (!cleanHeaders['Content-Type'] && !cleanHeaders['content-type']) {
              cleanHeaders['Content-Type'] = 'application/json';
            }
          } else if (request.body.type === 'raw') {
            bodyData = request.body.content;
          } else if (request.body.type === 'form-urlencoded') {
            bodyData = request.body.content;
            // Only set Content-Type if not already specified by user
            if (!cleanHeaders['Content-Type'] && !cleanHeaders['content-type']) {
              cleanHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
            }
          }

          // Set Content-Length if body exists
          if (bodyData && !cleanHeaders['Content-Length'] && !cleanHeaders['content-length']) {
            cleanHeaders['Content-Length'] = Buffer.byteLength(bodyData).toString();
          }
        }

        const options: http.RequestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: request.method,
          headers: cleanHeaders,
        };

        const req = httpModule.request(options, (res) => {
          const chunks: Buffer[] = [];

          // Handle compressed responses
          const encoding = res.headers['content-encoding'];
          let responseStream: NodeJS.ReadableStream = res;

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
              responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value || '';
            });

            resolve({
              status: res.statusCode || 0,
              statusText: res.statusMessage || '',
              headers: responseHeaders,
              body,
              time: endTime - startTime,
              size: Buffer.byteLength(body),
            });
          });

          responseStream.on('error', (error) => {
            const endTime = Date.now();
            resolve({
              status: 0,
              statusText: `Decompression error: ${error.message}`,
              headers: {},
              body: '',
              time: endTime - startTime,
              size: 0,
            });
          });
        });

        req.on('error', (error) => {
          const endTime = Date.now();
          resolve({
            status: 0,
            statusText: error.message,
            headers: {},
            body: '',
            time: endTime - startTime,
            size: 0,
          });
        });

        // Write body data if present
        if (bodyData) {
          req.write(bodyData);
        }

        req.end();
      } catch (error) {
        const endTime = Date.now();
        resolve({
          status: 0,
          statusText: error instanceof Error ? error.message : 'Request failed',
          headers: {},
          body: '',
          time: endTime - startTime,
          size: 0,
        });
      }
    });
  }
}

export const requestManager = new RequestManager();