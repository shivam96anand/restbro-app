import { storeManager } from '../store-manager';
import { MockServersState } from '../../../shared/types';

/**
 * Get the mock servers state from the store
 */
export function getMockServersState(): MockServersState {
  const state = storeManager.getState();
  return (state as any).mockServers || { servers: [] };
}

/**
 * Save mock servers state to the store
 */
export function saveMockServersState(mockServers: MockServersState): void {
  storeManager.setState({ mockServers } as any);
}
