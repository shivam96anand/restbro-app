/**
 * Insomnia import type definitions
 */

export interface InsomniaExport {
  __export_format: number;
  __export_date?: string;
  __export_source?: string;
  resources: InsomniaResource[];
}

export type InsomniaResource =
  | InsomniaWorkspace
  | InsomniaEnvironment
  | InsomniaRequestGroup
  | InsomniaRequest;

export interface InsomniaWorkspace {
  _id: string;
  _type: 'workspace';
  name: string;
  description?: string;
  scope?: string;
}

export interface InsomniaEnvironment {
  _id: string;
  _type: 'environment';
  name: string;
  data: Record<string, any>;
  parentId: string;
}

export interface InsomniaRequestGroup {
  _id: string;
  _type: 'request_group';
  name: string;
  parentId: string;
  environment?: Record<string, any>;
}

export interface InsomniaRequest {
  _id: string;
  _type: 'request';
  name: string;
  url: string;
  method: string;
  headers?: Array<{ name: string; value: string; disabled?: boolean }>;
  parameters?: Array<{ name: string; value: string; disabled?: boolean }>;
  body?: InsomniaBody;
  authentication?: any;
  parentId: string;
}

export interface InsomniaBody {
  mimeType?: string;
  text?: string;
  params?: Array<{ name: string; value: string; disabled?: boolean }>;
}

export interface InsomniaV5Export {
  type: string;
  collection: {
    info: {
      name: string;
      schema: string;
    };
    item: any[];
  };
  variable?: Array<{ key: string; value: string }>;
}
