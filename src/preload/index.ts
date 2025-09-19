import { contextBridge, ipcRenderer } from 'electron';

// Inline IPC channels to avoid module resolution issues in sandbox
const IPC_CHANNELS = {
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  REQUEST_SEND: 'request:send',
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_DELETE: 'collection:delete',
} as const;

// Define types inline to avoid import issues
interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body?: {
    type: 'none' | 'json' | 'raw' | 'form-data' | 'form-urlencoded';
    content: string;
  };
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    config: Record<string, string>;
  };
}

interface Collection {
  id: string;
  name: string;
  type: 'folder' | 'request';
  parentId?: string;
  children?: Collection[];
  request?: ApiRequest;
  createdAt: Date;
  updatedAt: Date;
}

interface AppTheme {
  name: string;
  primaryColor: string;
  accentColor: string;
}

interface AppState {
  collections: Collection[];
  openTabs: any[];
  activeTabId?: string;
  selectedCollectionId?: string;
  theme: AppTheme;
}

const apiCourierAPI = {
  store: {
    get: (): Promise<AppState> => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET),
    set: (updates: Partial<AppState>): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.STORE_SET, updates),
  },

  request: {
    send: (request: ApiRequest) => ipcRenderer.invoke(IPC_CHANNELS.REQUEST_SEND, request),
  },

  collection: {
    create: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> =>
      ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_CREATE, collection),
    update: (id: string, updates: Partial<Collection>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_UPDATE, id, updates),
    delete: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_DELETE, id),
  },
};

contextBridge.exposeInMainWorld('apiCourier', apiCourierAPI);

export type ApiCourierAPI = typeof apiCourierAPI;