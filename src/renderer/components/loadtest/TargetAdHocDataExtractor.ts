/**
 * Data extraction utilities for AdHoc target editor
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

interface LoadTestTargetAdHoc {
  kind: 'adhoc';
  method: HttpMethod;
  url: string;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  auth?: { type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2'; data?: unknown };
  body?: {
    type: 'none' | 'json' | 'raw' | 'form-data' | 'form-urlencoded';
    content: string;
  };
}

export class TargetAdHocDataExtractor {
  /**
   * Extract key-value pairs from editor
   */
  static getKeyValuePairs(container: HTMLElement, editorId: string): Record<string, string> {
    const editor = container.querySelector(`#${editorId}`);
    if (!editor) return {};

    const pairs: Record<string, string> = {};
    const rows = editor.querySelectorAll('.kv-row');

    rows.forEach(row => {
      const checkbox = row.querySelector('.kv-checkbox') as HTMLInputElement;
      const keyInput = row.querySelector('.key-input') as HTMLInputElement;
      const valueInput = row.querySelector('.value-input') as HTMLInputElement;

      if (checkbox.checked && keyInput.value.trim() && valueInput.value.trim()) {
        pairs[keyInput.value.trim()] = valueInput.value.trim();
      }
    });

    return pairs;
  }

  /**
   * Extract auth configuration
   */
  static getAuthConfig(container: HTMLElement): { type: 'none' | 'basic' | 'bearer' | 'apikey'; data?: any } {
    const authType = (container.querySelector('#target-auth-type') as HTMLSelectElement).value;

    if (authType === 'none') {
      return { type: 'none' };
    }

    const data: any = {};

    switch (authType) {
      case 'basic':
        const username = container.querySelector('#auth-username') as HTMLInputElement;
        const password = container.querySelector('#auth-password') as HTMLInputElement;
        data.username = username?.value || '';
        data.password = password?.value || '';
        break;
      case 'bearer':
        const token = container.querySelector('#auth-token') as HTMLInputElement;
        data.token = token?.value || '';
        break;
      case 'apikey':
        const key = container.querySelector('#auth-key') as HTMLInputElement;
        const value = container.querySelector('#auth-value') as HTMLInputElement;
        const location = container.querySelector('#auth-location') as HTMLSelectElement;
        data.key = key?.value || '';
        data.value = value?.value || '';
        data.location = location?.value || 'header';
        break;
    }

    return { type: authType as any, data };
  }

  /**
   * Extract body configuration
   */
  static getBodyConfig(container: HTMLElement): { type: 'none' | 'json' | 'raw' | 'form-urlencoded'; content: string } {
    const bodyType = container.querySelector('input[name="target-body-type"]:checked') as HTMLInputElement;
    const bodyContent = container.querySelector('#target-request-body') as HTMLTextAreaElement;

    return {
      type: bodyType.value as any,
      content: bodyContent.value || ''
    };
  }

  /**
   * Extract complete target configuration
   */
  static getTarget(container: HTMLElement): LoadTestTargetAdHoc {
    const method = (container.querySelector('#target-method') as HTMLSelectElement).value as HttpMethod;
    const url = (container.querySelector('#target-url') as HTMLInputElement).value;

    const target: LoadTestTargetAdHoc = {
      kind: 'adhoc',
      method,
      url
    };

    // Get params
    target.params = this.getKeyValuePairs(container, 'target-params-editor');

    // Get headers
    target.headers = this.getKeyValuePairs(container, 'target-headers-editor');

    // Get auth
    target.auth = this.getAuthConfig(container);

    // Get body
    target.body = this.getBodyConfig(container);

    return target;
  }

  /**
   * Validate target configuration
   */
  static validate(target: LoadTestTargetAdHoc): string[] {
    const errors: string[] = [];

    if (!target.url.trim()) {
      errors.push('URL is required');
    } else {
      try {
        new URL(target.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }

    return errors;
  }
}
