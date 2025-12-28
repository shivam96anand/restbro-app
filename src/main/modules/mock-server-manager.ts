import * as http from 'http';
import { readFile } from 'fs/promises';
import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import { IPC_CHANNELS } from '../../shared/ipc';
import {
  MockServerDefinition,
  MockRoute,
  MockServerRuntimeStatus,
  MockServerIpcResponse,
  MockServerListResponse,
  MockServerCreateParams,
  MockServerUpdateParams,
  MockRouteCreateParams,
  MockRouteUpdateParams,
  MockRouteDeleteParams,
  MockRouteToggleParams,
  MockServerStatusChangedEvent,
  MockServersState,
} from '../../shared/types';
import { storeManager } from './store-manager';

interface RunningServerInfo {
  server: http.Server;
  serverId: string;
}

/**
 * Redact authorization/token values from headers for logging
 */
function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'authorization' || lowerKey.includes('token') || lowerKey.includes('secret')) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

class MockServerManager {
  private runningServers = new Map<string, RunningServerInfo>();

  /**
   * Get the mock servers state from the store
   */
  private getMockServersState(): MockServersState {
    const state = storeManager.getState();
    return (state as any).mockServers || { servers: [] };
  }

  /**
   * Save mock servers state to the store
   */
  private saveMockServersState(mockServers: MockServersState): void {
    storeManager.setState({ mockServers } as any);
  }

  /**
   * Emit status changed event to all renderer windows
   */
  private emitStatusChanged(event: MockServerStatusChangedEvent): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(IPC_CHANNELS.MOCKSERVER_STATUS_CHANGED, event);
    });
  }

  /**
   * List all server definitions with runtime status
   */
  list(): MockServerIpcResponse<MockServerListResponse> {
    const state = this.getMockServersState();
    const runtimeStatus: MockServerRuntimeStatus[] = state.servers.map((server) => ({
      serverId: server.id,
      isRunning: this.runningServers.has(server.id),
    }));
    return {
      success: true,
      data: { servers: state.servers, runtimeStatus },
    };
  }

  /**
   * Create a new mock server definition
   */
  createServer(params: MockServerCreateParams): MockServerIpcResponse<MockServerDefinition> {
    const state = this.getMockServersState();
    const now = Date.now();
    const newServer: MockServerDefinition = {
      id: randomUUID(),
      name: params.name || 'New Server',
      host: params.host || '127.0.0.1',
      port: params.port ?? null,
      routes: [],
      createdAt: now,
      updatedAt: now,
    };
    state.servers.push(newServer);
    this.saveMockServersState(state);
    return { success: true, data: newServer };
  }

  /**
   * Update an existing mock server definition
   */
  updateServer(params: MockServerUpdateParams): MockServerIpcResponse<MockServerDefinition> {
    const state = this.getMockServersState();
    const serverIndex = state.servers.findIndex((s) => s.id === params.serverId);
    if (serverIndex === -1) {
      return { success: false, error: 'Server not found' };
    }
    const server = state.servers[serverIndex];
    if (params.name !== undefined) server.name = params.name;
    if (params.host !== undefined) server.host = params.host;
    if (params.port !== undefined) server.port = params.port;
    server.updatedAt = Date.now();
    this.saveMockServersState(state);
    return { success: true, data: server };
  }

  /**
   * Delete a mock server definition
   */
  deleteServer(serverId: string): MockServerIpcResponse<void> {
    // Stop server if running
    if (this.runningServers.has(serverId)) {
      this.stopServer(serverId);
    }
    const state = this.getMockServersState();
    const serverIndex = state.servers.findIndex((s) => s.id === serverId);
    if (serverIndex === -1) {
      return { success: false, error: 'Server not found' };
    }
    state.servers.splice(serverIndex, 1);
    this.saveMockServersState(state);
    return { success: true };
  }

  /**
   * Start a mock server
   */
  startServer(serverId: string): Promise<MockServerIpcResponse<void>> {
    if (this.runningServers.has(serverId)) {
      return Promise.resolve({ success: false, error: 'Server is already running' });
    }
    const state = this.getMockServersState();
    const serverDef = state.servers.find((s) => s.id === serverId);
    if (!serverDef) {
      return Promise.resolve({ success: false, error: 'Server not found' });
    }
    if (serverDef.port === null || serverDef.port === undefined) {
      return Promise.resolve({ success: false, error: 'Port is not configured' });
    }

    const server = http.createServer((req, res) => {
      this.handleRequest(serverId, req, res);
    });

    const port = serverDef.port;
    const host = serverDef.host;

    return new Promise<MockServerIpcResponse<void>>((resolve) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        let errorMessage = err.message;
        if (err.code === 'EADDRINUSE') {
          errorMessage = `Port ${port} is already in use`;
        } else if (err.code === 'EACCES') {
          errorMessage = `Permission denied to bind to port ${port}`;
        }
        this.emitStatusChanged({ serverId, isRunning: false, error: errorMessage });
        resolve({ success: false, error: errorMessage });
      });

      server.listen(port, host, () => {
        this.runningServers.set(serverId, { server, serverId });
        console.log(`[MockServer] Started server "${serverDef.name}" on ${host}:${port}`);
        this.emitStatusChanged({ serverId, isRunning: true });
        resolve({ success: true });
      });
    });
  }

  /**
   * Stop a running mock server
   */
  stopServer(serverId: string): Promise<MockServerIpcResponse<void>> {
    const runningInfo = this.runningServers.get(serverId);
    if (!runningInfo) {
      return Promise.resolve({ success: false, error: 'Server is not running' });
    }
    return new Promise<MockServerIpcResponse<void>>((resolve) => {
      runningInfo.server.close((err) => {
        this.runningServers.delete(serverId);
        if (err) {
          console.error(`[MockServer] Error stopping server ${serverId}:`, err.message);
        }
        console.log(`[MockServer] Stopped server ${serverId}`);
        this.emitStatusChanged({ serverId, isRunning: false });
        resolve({ success: true });
      });
    });
  }

  /**
   * Add a route to a server
   */
  addRoute(params: MockRouteCreateParams): MockServerIpcResponse<MockRoute> {
    const state = this.getMockServersState();
    const server = state.servers.find((s) => s.id === params.serverId);
    if (!server) {
      return { success: false, error: 'Server not found' };
    }
    const newRoute: MockRoute = {
      ...params.route,
      id: randomUUID(),
    };
    server.routes.push(newRoute);
    server.updatedAt = Date.now();
    this.saveMockServersState(state);
    return { success: true, data: newRoute };
  }

  /**
   * Update an existing route
   */
  updateRoute(params: MockRouteUpdateParams): MockServerIpcResponse<MockRoute> {
    const state = this.getMockServersState();
    const server = state.servers.find((s) => s.id === params.serverId);
    if (!server) {
      return { success: false, error: 'Server not found' };
    }
    const routeIndex = server.routes.findIndex((r) => r.id === params.routeId);
    if (routeIndex === -1) {
      return { success: false, error: 'Route not found' };
    }
    const route = server.routes[routeIndex];
    Object.assign(route, params.updates);
    server.updatedAt = Date.now();
    this.saveMockServersState(state);
    return { success: true, data: route };
  }

  /**
   * Delete a route from a server
   */
  deleteRoute(params: MockRouteDeleteParams): MockServerIpcResponse<void> {
    const state = this.getMockServersState();
    const server = state.servers.find((s) => s.id === params.serverId);
    if (!server) {
      return { success: false, error: 'Server not found' };
    }
    const routeIndex = server.routes.findIndex((r) => r.id === params.routeId);
    if (routeIndex === -1) {
      return { success: false, error: 'Route not found' };
    }
    server.routes.splice(routeIndex, 1);
    server.updatedAt = Date.now();
    this.saveMockServersState(state);
    return { success: true };
  }

  /**
   * Toggle a route's enabled status
   */
  toggleRoute(params: MockRouteToggleParams): MockServerIpcResponse<MockRoute> {
    const state = this.getMockServersState();
    const server = state.servers.find((s) => s.id === params.serverId);
    if (!server) {
      return { success: false, error: 'Server not found' };
    }
    const route = server.routes.find((r) => r.id === params.routeId);
    if (!route) {
      return { success: false, error: 'Route not found' };
    }
    route.enabled = params.enabled;
    server.updatedAt = Date.now();
    this.saveMockServersState(state);
    return { success: true, data: route };
  }

  /**
   * Get runtime status for all servers
   */
  getRuntimeStatus(): MockServerRuntimeStatus[] {
    const state = this.getMockServersState();
    return state.servers.map((server) => ({
      serverId: server.id,
      isRunning: this.runningServers.has(server.id),
    }));
  }

  /**
   * Stop all running servers (for graceful shutdown)
   */
  async stopAllServers(): Promise<void> {
    const promises: Promise<MockServerIpcResponse<void>>[] = [];
    for (const serverId of this.runningServers.keys()) {
      promises.push(Promise.resolve(this.stopServer(serverId)));
    }
    await Promise.all(promises);
  }

  /**
   * Handle an incoming HTTP request
   */
  private async handleRequest(
    serverId: string,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const state = this.getMockServersState();
    const serverDef = state.servers.find((s) => s.id === serverId);

    if (!serverDef) {
      this.sendJsonResponse(res, 500, { error: 'Server configuration not found' });
      return;
    }

    const urlPath = new URL(req.url || '/', `http://${req.headers.host}`).pathname;
    const method = (req.method || 'GET').toUpperCase();

    console.log(`[MockServer] ${serverDef.name} - ${method} ${urlPath}`, {
      headers: redactHeaders(req.headers as Record<string, string>),
    });

    // Find matching route (first enabled route with exact path and method match)
    const matchedRoute = serverDef.routes.find(
      (route) => route.enabled && route.method === method && route.path === urlPath
    );

    if (!matchedRoute) {
      this.sendJsonResponse(res, 404, {
        error: 'No mock matched',
        method,
        path: urlPath,
      });
      return;
    }

    // Apply delay if configured
    if (matchedRoute.delayMs && matchedRoute.delayMs > 0) {
      await this.delay(matchedRoute.delayMs);
    }

    try {
      await this.sendRouteResponse(res, matchedRoute);
    } catch (err) {
      console.error(`[MockServer] Error sending response:`, err);
      this.sendJsonResponse(res, 500, {
        error: 'Internal mock server error',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Send the response based on route configuration
   */
  private async sendRouteResponse(res: http.ServerResponse, route: MockRoute): Promise<void> {
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

  private async sendJsonRouteResponse(res: http.ServerResponse, route: MockRoute): Promise<void> {
    // Validate JSON before sending
    try {
      JSON.parse(route.body || '{}');
    } catch (parseError) {
      this.sendJsonResponse(res, 500, {
        error: 'Invalid mock JSON',
        details: parseError instanceof Error ? parseError.message : String(parseError),
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
      res.setHeader('Content-Type', route.contentType || 'text/plain; charset=utf-8');
    }
    const body = route.body || '';
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
    res.statusCode = route.statusCode;
    res.end(body);
  }

  private sendBinaryResponse(res: http.ServerResponse, route: MockRoute): void {
    if (!res.hasHeader('Content-Type')) {
      res.setHeader('Content-Type', route.contentType || 'application/octet-stream');
    }
    const buffer = Buffer.from(route.body || '', 'base64');
    res.setHeader('Content-Length', buffer.length);
    res.statusCode = route.statusCode;
    res.end(buffer);
  }

  private async sendFileResponse(res: http.ServerResponse, route: MockRoute): Promise<void> {
    const filePath = route.body;
    if (!filePath) {
      this.sendJsonResponse(res, 500, { error: 'File path not configured' });
      return;
    }
    try {
      const fileContent = await readFile(filePath);
      if (!res.hasHeader('Content-Type')) {
        res.setHeader('Content-Type', route.contentType || 'application/octet-stream');
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

  private sendJsonResponse(res: http.ServerResponse, statusCode: number, body: object): void {
    const jsonBody = JSON.stringify(body);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(jsonBody, 'utf8'));
    res.statusCode = statusCode;
    res.end(jsonBody);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockServerManager = new MockServerManager();
