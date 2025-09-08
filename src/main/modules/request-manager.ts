import https from 'https';
import http from 'http';
import { URL } from 'url';
import { Request, Response } from '../../shared/types';

export class RequestManager {
  private activeRequests: Map<string, AbortController> = new Map();

  async sendRequest(request: Request): Promise<Response> {
    const requestId = `${Date.now()}_${Math.random()}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    
    try {
      const response = await this.makeHttpRequest(request, controller.signal);
      const endTime = Date.now();
      
      this.activeRequests.delete(requestId);
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.body,
        size: response.size,
        time: endTime - startTime,
        url: request.url
      };
    } catch (error: any) {
      this.activeRequests.delete(requestId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      
      throw error;
    }
  }

  cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }

  private async makeHttpRequest(request: Request, signal: AbortSignal): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    size: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.buildUrl(request));
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: request.method,
          headers: this.buildHeaders(request),
          signal
        };

        const req = httpModule.request(options, (res) => {
          let data = '';
          let size = 0;
          
          res.on('data', (chunk) => {
            data += chunk;
            size += chunk.length;
          });
          
          res.on('end', () => {
            try {
              let parsedBody: any;
              
              const contentType = res.headers['content-type'] || '';
              if (contentType.includes('application/json')) {
                parsedBody = JSON.parse(data);
              } else {
                parsedBody = data;
              }
              
              resolve({
                status: res.statusCode || 0,
                statusText: res.statusMessage || '',
                headers: res.headers as Record<string, string>,
                body: parsedBody,
                size
              });
            } catch (parseError) {
              resolve({
                status: res.statusCode || 0,
                statusText: res.statusMessage || '',
                headers: res.headers as Record<string, string>,
                body: data,
                size
              });
            }
          });
        });

        req.on('error', reject);
        
        // Add request body if present
        if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const bodyData = this.buildRequestBody(request);
          if (bodyData) {
            req.write(bodyData);
          }
        }
        
        req.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildUrl(request: Request): string {
    let url = request.url;
    
    if (request.params && Object.keys(request.params).length > 0) {
      const urlObj = new URL(url);
      Object.entries(request.params).forEach(([key, value]) => {
        if (value) {
          urlObj.searchParams.set(key, value);
        }
      });
      url = urlObj.toString();
    }
    
    return url;
  }

  private buildHeaders(request: Request): Record<string, string> {
    const headers: Record<string, string> = { ...request.headers };
    
    // Add auth headers
    if (request.auth && request.auth.type !== 'none') {
      switch (request.auth.type) {
        case 'basic':
          const { username, password } = request.auth.credentials;
          if (username && password) {
            headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
          }
          break;
        case 'bearer':
          const { token } = request.auth.credentials;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          break;
        case 'api-key':
          const { key, value, location } = request.auth.credentials;
          if (key && value) {
            if (location === 'header') {
              headers[key] = value;
            }
          }
          break;
      }
    }
    
    // Set content type for body requests
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (!headers['Content-Type']) {
        switch (request.body.type) {
          case 'json':
            headers['Content-Type'] = 'application/json';
            break;
          case 'form-data':
            headers['Content-Type'] = 'multipart/form-data';
            break;
          case 'x-www-form-urlencoded':
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            break;
        }
      }
    }
    
    return headers;
  }

  private buildRequestBody(request: Request): string | null {
    if (!request.body) return null;
    
    switch (request.body.type) {
      case 'json':
        return JSON.stringify(request.body.data);
      case 'raw':
        return request.body.data;
      case 'x-www-form-urlencoded':
        if (typeof request.body.data === 'object') {
          return new URLSearchParams(request.body.data).toString();
        }
        return request.body.data;
      default:
        return request.body.data;
    }
  }
}
