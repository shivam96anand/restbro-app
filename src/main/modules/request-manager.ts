import { ApiRequest, ApiResponse } from '../../shared/types';

class RequestManager {
  async sendRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: request.headers,
      };

      if (request.body && request.body.type !== 'none') {
        if (request.body.type === 'json') {
          fetchOptions.body = request.body.content;
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          };
        } else if (request.body.type === 'raw') {
          fetchOptions.body = request.body.content;
        } else if (request.body.type === 'form-urlencoded') {
          fetchOptions.body = request.body.content;
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/x-www-form-urlencoded',
          };
        }
      }

      const response = await fetch(request.url, fetchOptions);
      const body = await response.text();
      const endTime = Date.now();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body,
        time: endTime - startTime,
        size: new Blob([body]).size,
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        status: 0,
        statusText: error instanceof Error ? error.message : 'Request failed',
        headers: {},
        body: '',
        time: endTime - startTime,
        size: 0,
      };
    }
  }
}

export const requestManager = new RequestManager();