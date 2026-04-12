/**
 * Data prefilling utilities for AdHoc target editor
 */

export class TargetAdHocPrefill {
  /**
   * Prefill key-value pairs in editor
   */
  static prefillKeyValuePairs(
    container: HTMLElement,
    editorId: string,
    data: Record<string, any>,
    addRowFn: (editorId: string) => void
  ): void {
    const editor = container.querySelector(`#${editorId}`);
    if (!editor) return;

    // Clear existing rows except the first one
    const rows = editor.querySelectorAll('.kv-row');
    for (let i = 1; i < rows.length; i++) {
      rows[i].remove();
    }

    // Fill data
    const entries = Object.entries(data);
    entries.forEach((entry, index) => {
      let row: Element;
      if (index === 0) {
        row = rows[0];
      } else {
        // Add new row
        addRowFn(editorId);
        const allRows = editor.querySelectorAll('.kv-row');
        row = allRows[allRows.length - 1];
      }

      const keyInput = row.querySelector('.key-input') as HTMLInputElement;
      const valueInput = row.querySelector('.value-input') as HTMLInputElement;
      const checkbox = row.querySelector('.kv-checkbox') as HTMLInputElement;

      keyInput.value = entry[0];
      valueInput.value = String(entry[1]);
      checkbox.checked = true;
    });
  }

  /**
   * Prefill auth configuration
   */
  static prefillAuth(
    container: HTMLElement,
    auth: any,
    setupAuthConfigFn: () => void
  ): void {
    const authType = container.querySelector(
      '#target-auth-type'
    ) as HTMLSelectElement;
    authType.value = auth.type;
    setupAuthConfigFn();

    if (auth.data) {
      setTimeout(() => {
        switch (auth.type) {
          case 'basic':
            const username = container.querySelector(
              '#auth-username'
            ) as HTMLInputElement;
            const password = container.querySelector(
              '#auth-password'
            ) as HTMLInputElement;
            if (username) username.value = auth.data.username || '';
            if (password) password.value = auth.data.password || '';
            break;
          case 'bearer':
            const token = container.querySelector(
              '#auth-token'
            ) as HTMLInputElement;
            if (token) token.value = auth.data.token || '';
            break;
          case 'apikey':
            const key = container.querySelector(
              '#auth-key'
            ) as HTMLInputElement;
            const value = container.querySelector(
              '#auth-value'
            ) as HTMLInputElement;
            const location = container.querySelector(
              '#auth-location'
            ) as HTMLSelectElement;
            if (key) key.value = auth.data.key || '';
            if (value) value.value = auth.data.value || '';
            if (location) location.value = auth.data.location || 'header';
            break;
          case 'oauth2':
            const grantType = container.querySelector(
              '#target-oauth-grant-type'
            ) as HTMLSelectElement;
            const tokenUrl = container.querySelector(
              '#target-oauth-token-url'
            ) as HTMLInputElement;
            const clientId = container.querySelector(
              '#target-oauth-client-id'
            ) as HTMLInputElement;
            const clientSecret = container.querySelector(
              '#target-oauth-client-secret'
            ) as HTMLInputElement;
            const authUrl = container.querySelector(
              '#target-oauth-auth-url'
            ) as HTMLInputElement;
            const redirectUri = container.querySelector(
              '#target-oauth-redirect-uri'
            ) as HTMLInputElement;
            const scope = container.querySelector(
              '#target-oauth-scope'
            ) as HTMLInputElement;
            const resource = container.querySelector(
              '#target-oauth-resource'
            ) as HTMLInputElement;
            const audience = container.querySelector(
              '#target-oauth-audience'
            ) as HTMLInputElement;
            const headerPrefix = container.querySelector(
              '#target-oauth-header-prefix'
            ) as HTMLInputElement;
            const credentials = container.querySelector(
              '#target-oauth-credentials'
            ) as HTMLSelectElement;
            const accessToken = container.querySelector(
              '#target-oauth-access-token'
            ) as HTMLInputElement;
            const refreshToken = container.querySelector(
              '#target-oauth-refresh-token'
            ) as HTMLInputElement;
            const expiresAt = container.querySelector(
              '#target-oauth-expires-at'
            ) as HTMLInputElement;
            if (grantType)
              grantType.value = auth.data.grantType || 'client_credentials';
            if (tokenUrl) tokenUrl.value = auth.data.tokenUrl || '';
            if (clientId) clientId.value = auth.data.clientId || '';
            if (clientSecret) clientSecret.value = auth.data.clientSecret || '';
            if (authUrl) authUrl.value = auth.data.authUrl || '';
            if (redirectUri)
              redirectUri.value =
                auth.data.redirectUri || 'http://localhost:8080/callback';
            if (scope) scope.value = auth.data.scope || '';
            if (resource) resource.value = auth.data.resource || '';
            if (audience) audience.value = auth.data.audience || '';
            if (headerPrefix)
              headerPrefix.value = auth.data.headerPrefix || 'Bearer';
            if (credentials)
              credentials.value = auth.data.credentials || 'headers';
            if (accessToken) accessToken.value = auth.data.accessToken || '';
            if (refreshToken) refreshToken.value = auth.data.refreshToken || '';
            if (expiresAt) expiresAt.value = auth.data.expiresAt || '';
            if (grantType) {
              grantType.dispatchEvent(new Event('change'));
            }
            break;
        }
      }, 0);
    }
  }

  /**
   * Prefill body configuration
   */
  static prefillBody(
    container: HTMLElement,
    body: any,
    toggleBodyEditorFn: (type: string) => void
  ): void {
    const bodyTypeRadio = container.querySelector(
      `input[name="target-body-type"][value="${body.type}"]`
    ) as HTMLInputElement;
    const bodyContent = container.querySelector(
      '#target-request-body'
    ) as HTMLTextAreaElement;

    if (bodyTypeRadio) {
      bodyTypeRadio.checked = true;
      toggleBodyEditorFn(body.type);
    }

    if (bodyContent) {
      bodyContent.value = body.content || '';
    }
  }
}
