export declare const IPC_CHANNELS: {
    readonly STORE_GET: "store:get";
    readonly STORE_SET: "store:set";
    readonly REQUEST_SEND: "request:send";
    readonly COLLECTION_CREATE: "collection:create";
    readonly COLLECTION_UPDATE: "collection:update";
    readonly COLLECTION_DELETE: "collection:delete";
};
export type IpcChannelKey = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
