/**
 * Worker manager for offloading heavy JSON operations
 */

import {
  JsonParseResult,
  FormatResult,
  WorkerMessage,
  WorkerResponse,
} from '../types';
import { JsonUtils } from './json';

export class JsonWorkerManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: number;
    }
  >();

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      const workerScript = this.getWorkerScript();
      const blob = new Blob([workerScript], {
        type: 'application/javascript',
      });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = (event) => {
        const response: WorkerResponse = event.data;
        const pending = this.pendingMessages.get(response.id);

        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingMessages.delete(response.id);

          if (response.success) {
            pending.resolve(response.result);
          } else {
            pending.reject(
              new Error(response.error || 'Worker operation failed')
            );
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.fallbackToMainThread();
      };
    } catch (error) {
      console.warn('Failed to create worker, falling back to main thread:', error);
      this.fallbackToMainThread();
    }
  }

  private getWorkerScript(): string {
    return `
      function safeJsonParse(text) {
        try {
          const parsed = JSON.parse(text);
          return { success: true, data: parsed };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      function formatJson(data, indent = 2) {
        try {
          const formatted = JSON.stringify(data, null, indent);
          return { success: true, formatted };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      function minifyJson(data) {
        try {
          const minified = JSON.stringify(data);
          return { success: true, formatted: minified };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      function validateJson(text) {
        try {
          JSON.parse(text);
          return { success: true, valid: true };
        } catch (error) {
          return { success: true, valid: false, error: error.message };
        }
      }

      function evaluateJsonPath(data, path) {
        try {
          const matches = [];
          if (path === '$') {
            matches.push({ path: '$', value: data, jsonPath: '$' });
            return { success: true, matches };
          }

          const parts = path.replace(/^\\$\\./, '').split('.');

          function traverse(obj, currentPath, jsonPath) {
            if (typeof obj !== 'object' || obj === null) return;

            Object.keys(obj).forEach(key => {
              const value = obj[key];
              const fullPath = currentPath ? currentPath + '.' + key : key;
              const fullJsonPath = jsonPath + '.' + key;

              if (parts.some(part => key.includes(part) || part === '*')) {
                matches.push({ path: fullPath, value: value, jsonPath: fullJsonPath });
              }

              if (typeof value === 'object' && value !== null) {
                traverse(value, fullPath, fullJsonPath);
              }
            });
          }

          traverse(data, '', '$');
          return { success: true, matches };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      self.onmessage = function(event) {
        const message = event.data;
        let result;

        try {
          switch (message.type) {
            case 'parse':
              result = safeJsonParse(message.payload.text);
              break;
            case 'format':
              result = formatJson(message.payload.data, message.payload.indent);
              break;
            case 'minify':
              result = minifyJson(message.payload.data);
              break;
            case 'validate':
              result = validateJson(message.payload.text);
              break;
            case 'jsonpath':
              result = evaluateJsonPath(message.payload.data, message.payload.path);
              break;
            default:
              result = { success: false, error: 'Unknown operation type' };
          }
        } catch (error) {
          result = { success: false, error: error.message };
        }

        self.postMessage({
          id: message.id,
          success: result.success,
          result: result.success ? result : undefined,
          error: result.success ? undefined : result.error
        });
      };
    `;
  }

  private fallbackToMainThread(): void {
    this.worker = null;
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('Worker failed, using main thread'));
    });
    this.pendingMessages.clear();
  }

  private sendMessage<T>(
    type: string,
    payload: any,
    timeout = 10000
  ): Promise<T> {
    const id = (++this.messageId).toString();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(id);
        reject(new Error(`Worker operation timed out after ${timeout}ms`));
      }, timeout) as unknown as number;

      this.pendingMessages.set(id, { resolve, reject, timeout: timeoutId });

      const message: WorkerMessage = { id, type, payload };

      if (this.worker) {
        this.worker.postMessage(message);
      } else {
        this.handleMainThread(message).then(resolve).catch(reject);
      }
    });
  }

  private async handleMainThread(message: WorkerMessage): Promise<any> {
    switch (message.type) {
      case 'parse':
        return JsonUtils.parseJsonSync(message.payload.text);
      case 'format':
        return JsonUtils.formatJsonSync(
          message.payload.data,
          message.payload.indent
        );
      case 'minify':
        return JsonUtils.minifyJsonSync(message.payload.data);
      case 'validate':
        return JsonUtils.validateJsonSync(message.payload.text);
      case 'jsonpath':
        return { success: true, matches: [] };
      default:
        throw new Error('Unknown operation type');
    }
  }

  public async parseJson(text: string): Promise<JsonParseResult> {
    return this.sendMessage('parse', { text });
  }

  public async formatJson(data: any, indent = 2): Promise<FormatResult> {
    return this.sendMessage('format', { data, indent });
  }

  public async minifyJson(data: any): Promise<FormatResult> {
    return this.sendMessage('minify', { data });
  }

  public async validateJson(
    text: string
  ): Promise<{ valid: boolean; error?: string }> {
    return this.sendMessage('validate', { text });
  }

  public async evaluateJsonPath(data: any, path: string): Promise<any> {
    return this.sendMessage('jsonpath', { data, path });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingMessages.clear();
  }
}
