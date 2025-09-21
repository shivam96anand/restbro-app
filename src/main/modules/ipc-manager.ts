import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc';
import { storeManager } from './store-manager';
import { requestManager } from './request-manager';
import { Collection, ApiRequest, AppState } from '../../shared/types';
import { randomUUID } from 'crypto';

class IpcManager {
  initialize(): void {
    ipcMain.handle(IPC_CHANNELS.STORE_GET, (): AppState => {
      return storeManager.getState();
    });

    ipcMain.handle(IPC_CHANNELS.STORE_SET, (_, updates: Partial<AppState>): void => {
      storeManager.setState(updates);
    });

    ipcMain.handle(IPC_CHANNELS.REQUEST_SEND, async (_, request: ApiRequest) => {
      return await requestManager.sendRequest(request);
    });

    ipcMain.handle(IPC_CHANNELS.COLLECTION_CREATE, (_, collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Collection => {
      const newCollection: Collection = {
        ...collection,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // If this is a request collection and no request is provided, create a default ApiRequest
      if (collection.type === 'request' && !collection.request) {
        const defaultRequest: ApiRequest = {
          id: randomUUID(),
          name: collection.name,
          method: 'GET',
          url: '',
          params: {},
          headers: {},
        };
        newCollection.request = defaultRequest;
      } else if (collection.type === 'request' && collection.request) {
        // Use the provided request data but ensure it has a unique ID
        newCollection.request = {
          ...collection.request,
          id: randomUUID()
        };
      }

      const state = storeManager.getState();
      const updatedCollections = [...state.collections, newCollection];
      storeManager.setState({ collections: updatedCollections });

      return newCollection;
    });

    ipcMain.handle(IPC_CHANNELS.COLLECTION_UPDATE, (_, id: string, updates: Partial<Collection>): void => {
      const state = storeManager.getState();
      const updatedCollections = state.collections.map(col =>
        col.id === id ? { ...col, ...updates, updatedAt: new Date() } : col
      );
      storeManager.setState({ collections: updatedCollections });
    });

    ipcMain.handle(IPC_CHANNELS.COLLECTION_DELETE, (_, id: string): void => {
      const state = storeManager.getState();
      const updatedCollections = state.collections.filter(col => col.id !== id);
      storeManager.setState({ collections: updatedCollections });
    });
  }
}

export const ipcManager = new IpcManager();