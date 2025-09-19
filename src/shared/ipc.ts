export const IPC_CHANNELS = {
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  REQUEST_SEND: 'request:send',
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_DELETE: 'collection:delete',
} as const;

export type IpcChannelKey = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];