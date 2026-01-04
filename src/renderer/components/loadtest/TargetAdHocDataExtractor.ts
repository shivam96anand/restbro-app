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
  collectionId?: string;
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
  static getAuthConfig(container: HTMLElement): { type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2'; data?: any } {
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
      case 'oauth2':
        data.grantType = (container.querySelector('#target-oauth-grant-type') as HTMLSelectElement | null)?.value || 'client_credentials';
        data.tokenUrl = (container.querySelector('#target-oauth-token-url') as HTMLInputElement | null)?.value || '';
        data.clientId = (container.querySelector('#target-oauth-client-id') as HTMLInputElement | null)?.value || '';
        data.clientSecret = (container.querySelector('#target-oauth-client-secret') as HTMLInputElement | null)?.value || '';
        data.authUrl = (container.querySelector('#target-oauth-auth-url') as HTMLInputElement | null)?.value || '';
        data.redirectUri = (container.querySelector('#target-oauth-redirect-uri') as HTMLInputElement | null)?.value || '';
        data.scope = (container.querySelector('#target-oauth-scope') as HTMLInputElement | null)?.value || '';
        data.resource = (container.querySelector('#target-oauth-resource') as HTMLInputElement | null)?.value || '';
        data.audience = (container.querySelector('#target-oauth-audience') as HTMLInputElement | null)?.value || '';
        data.headerPrefix = (container.querySelector('#target-oauth-header-prefix') as HTMLInputElement | null)?.value || '';
        data.credentials = (container.querySelector('#target-oauth-credentials') as HTMLSelectElement | null)?.value || '';
        data.accessToken = (container.querySelector('#target-oauth-access-token') as HTMLInputElement | null)?.value || '';
        data.refreshToken = (container.querySelector('#target-oauth-refresh-token') as HTMLInputElement | null)?.value || '';
        data.expiresAt = (container.querySelector('#target-oauth-expires-at') as HTMLInputElement | null)?.value || '';
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

    if (target.auth?.type === 'oauth2') {
      const data = target.auth.data as Record<string, string> | undefined;
      const hasToken = !!data?.accessToken;
      const hasConfig = !!data?.tokenUrl && !!data?.clientId;
      if (!hasToken && !hasConfig) {
        errors.push('OAuth2 requires an access token or token URL and client ID');
      }
    }

    return errors;
  }
}
