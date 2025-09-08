export interface IPCChannels {
  // Store channels
  'store:get-collections': () => Collection[];
  'store:save-collection': (collection: Collection) => void;
  'store:delete-collection': (id: string) => void;
  'store:get-settings': () => AppSettings;
  'store:save-settings': (settings: Partial<AppSettings>) => void;
  
  // File channels
  'file:import-collection': () => Collection | null;
  'file:export-collection': (collection: Collection) => boolean;
  
  // Request channels
  'request:send': (request: Request) => Promise<Response>;
  'request:cancel': (requestId: string) => void;
  
  // Window channels
  'window:minimize': () => void;
  'window:maximize': () => void;
  'window:close': () => void;
}

import { Collection, Request, Response, AppSettings } from './types';

export type IPCInvoke<T extends keyof IPCChannels> = IPCChannels[T] extends (...args: any[]) => infer R ? R : never;
export type IPCArgs<T extends keyof IPCChannels> = IPCChannels[T] extends (...args: infer A) => any ? A : never;
