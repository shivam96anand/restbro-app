import * as http from 'http';
import { readFile } from 'fs/promises';
import { MockRoute } from '../../../shared/types';

/**
 * Handles sending HTTP responses for mock routes
 */
export class MockServerResponseHandler {
  /**
   * Send the response based on route configuration
   */
  async sendRouteResponse(
    res: http.ServerResponse,
    route: MockRoute
  ): Promise<void> {
    // Set custom headers first
    for (const header of route.headers) {
      if (header.enabled && header.key) {
        res.setHeader(header.key, header.value);
      }
    }

    switch (route.responseType) {
      case 'json':
        await this.sendJsonRouteResponse(res, route);
        break;
      case 'text':
        this.sendTextResponse(res, route);
        break;
      case 'binary':
        this.sendBinaryResponse(res, route);
        break;
      case 'file':
        await this.sendFileResponse(res, route);
        break;
      default:
        this.sendJsonResponse(res, 500, { error: 'Unknown response type' });
    }
  }

  private async sendJsonRouteResponse(
    res: http.ServerResponse,
    route: MockRoute
  ): Promise<void> {
    // Validate JSON before sending
    try {
      JSON.parse(route.body || '{}');
    } catch (parseError) {
      this.sendJsonResponse(res, 500, {
        error: 'Invalid mock JSON',
        details:
          parseError instanceof Error ? parseError.message : String(parseError),
      });
      return;
    }

    if (!res.hasHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    const body = route.body || '{}';
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
    res.statusCode = route.statusCode;
    res.end(body);
  }

  private sendTextResponse(res: http.ServerResponse, route: MockRoute): void {
    if (!res.hasHeader('Content-Type')) {
      res.setHeader(
        'Content-Type',
        route.contentType || 'text/plain; charset=utf-8'
      );
    }
    const body = route.body || '';
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
    res.statusCode = route.statusCode;
    res.end(body);
  }

  private sendBinaryResponse(res: http.ServerResponse, route: MockRoute): void {
    if (!res.hasHeader('Content-Type')) {
      res.setHeader(
        'Content-Type',
        route.contentType || 'application/octet-stream'
      );
    }
    const buffer = Buffer.from(route.body || '', 'base64');
    res.setHeader('Content-Length', buffer.length);
    res.statusCode = route.statusCode;
    res.end(buffer);
  }

  private async sendFileResponse(
    res: http.ServerResponse,
    route: MockRoute
  ): Promise<void> {
    const filePath = route.body;
    if (!filePath) {
      this.sendJsonResponse(res, 500, { error: 'File path not configured' });
      return;
    }
    try {
      const fileContent = await readFile(filePath);
      if (!res.hasHeader('Content-Type')) {
        res.setHeader(
          'Content-Type',
          route.contentType || 'application/octet-stream'
        );
      }
      res.setHeader('Content-Length', fileContent.length);
      res.statusCode = route.statusCode;
      res.end(fileContent);
    } catch (err) {
      this.sendJsonResponse(res, 500, {
        error: 'Failed to read file',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Send a JSON error/response
   */
  sendJsonResponse(
    res: http.ServerResponse,
    statusCode: number,
    body: object
  ): void {
    const jsonBody = JSON.stringify(body);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(jsonBody, 'utf8'));
    res.statusCode = statusCode;
    res.end(jsonBody);
  }
}

export const mockServerResponseHandler = new MockServerResponseHandler();
