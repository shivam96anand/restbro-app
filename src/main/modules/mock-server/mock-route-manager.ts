import { randomUUID } from 'crypto';
import {
  MockRoute,
  MockServerIpcResponse,
  MockRouteCreateParams,
  MockRouteUpdateParams,
  MockRouteDeleteParams,
  MockRouteToggleParams,
} from '../../../shared/types';
import { getMockServersState, saveMockServersState } from './mock-server-store';

/**
 * Handles CRUD operations for mock routes
 */
export class MockRouteManager {
  /**
   * Add a route to a server
   */
  addRoute(params: MockRouteCreateParams): MockServerIpcResponse<MockRoute> {
    const state = getMockServersState();
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
    saveMockServersState(state);
    return { success: true, data: newRoute };
  }

  /**
   * Update an existing route
   */
  updateRoute(params: MockRouteUpdateParams): MockServerIpcResponse<MockRoute> {
    const state = getMockServersState();
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
    saveMockServersState(state);
    return { success: true, data: route };
  }

  /**
   * Delete a route from a server
   */
  deleteRoute(params: MockRouteDeleteParams): MockServerIpcResponse<void> {
    const state = getMockServersState();
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
    saveMockServersState(state);
    return { success: true };
  }

  /**
   * Toggle a route's enabled status
   */
  toggleRoute(params: MockRouteToggleParams): MockServerIpcResponse<MockRoute> {
    const state = getMockServersState();
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
    saveMockServersState(state);
    return { success: true, data: route };
  }
}

export const mockRouteManager = new MockRouteManager();
