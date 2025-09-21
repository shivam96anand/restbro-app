import { ApiRequest } from '../../../shared/types';

export class RequestEditorsManager {
  private onRequestUpdate: (updates: Partial<ApiRequest>) => void;

  constructor(onRequestUpdate: (updates: Partial<ApiRequest>) => void) {
    this.onRequestUpdate = onRequestUpdate;
  }

  setupParamsEditor(): void {
    const addParamBtn = document.querySelector('.add-param-btn');
    const paramsEditor = document.getElementById('params-editor');

    if (addParamBtn && paramsEditor) {
      addParamBtn.addEventListener('click', () => {
        this.addParamRow();
      });

      paramsEditor.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('remove-btn')) {
          const row = target.closest('.kv-row');
          if (row && paramsEditor.children.length > 1) {
            row.remove();
            this.updateParamsFromDOM();
          }
        }
      });

      paramsEditor.addEventListener('input', () => {
        this.updateParamsFromDOM();
      });
    }
  }

  setupHeadersEditor(): void {
    const addHeaderBtn = document.querySelector('.add-header-btn');
    const headersEditor = document.getElementById('headers-editor');

    if (addHeaderBtn && headersEditor) {
      addHeaderBtn.addEventListener('click', () => {
        this.addHeaderRow();
      });

      headersEditor.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('remove-btn')) {
          const row = target.closest('.kv-row');
          if (row && headersEditor.children.length > 1) {
            row.remove();
            this.updateHeadersFromDOM();
          }
        }
      });

      headersEditor.addEventListener('input', () => {
        this.updateHeadersFromDOM();
      });
    }
  }

  setupBodyEditor(): void {
    const bodyTypeInputs = document.querySelectorAll('input[name="body-type"]');
    const bodyEditor = document.getElementById('request-body') as HTMLTextAreaElement;

    bodyTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const bodyType = target.value;

        if (bodyEditor) {
          bodyEditor.style.display = bodyType === 'none' ? 'none' : 'block';
        }

        this.onRequestUpdate({
          body: {
            type: bodyType as any,
            content: bodyEditor ? bodyEditor.value : ''
          }
        });
      });
    });

    if (bodyEditor) {
      bodyEditor.addEventListener('input', () => {
        const bodyType = (document.querySelector('input[name="body-type"]:checked') as HTMLInputElement)?.value || 'none';

        this.onRequestUpdate({
          body: {
            type: bodyType as any,
            content: bodyEditor.value
          }
        });
      });
    }
  }

  setupAuthEditor(): void {
    const authTypeSelect = document.getElementById('auth-type') as HTMLSelectElement;

    if (authTypeSelect) {
      authTypeSelect.addEventListener('change', () => {
        this.renderAuthConfig(authTypeSelect.value);
      });
    }
  }

  private addParamRow(): void {
    const paramsEditor = document.getElementById('params-editor');
    if (!paramsEditor) return;

    const row = document.createElement('div');
    row.className = 'kv-row';
    row.innerHTML = `
      <input type="text" placeholder="Key" class="key-input">
      <input type="text" placeholder="Value" class="value-input">
      <button class="remove-btn">×</button>
    `;

    paramsEditor.appendChild(row);
  }

  private addHeaderRow(): void {
    const headersEditor = document.getElementById('headers-editor');
    if (!headersEditor) return;

    const row = document.createElement('div');
    row.className = 'kv-row';
    row.innerHTML = `
      <input type="text" placeholder="Key" class="key-input">
      <input type="text" placeholder="Value" class="value-input">
      <button class="remove-btn">×</button>
    `;

    headersEditor.appendChild(row);
  }

  private updateParamsFromDOM(): void {
    const paramsEditor = document.getElementById('params-editor');
    if (!paramsEditor) return;

    const params: Record<string, string> = {};
    const rows = paramsEditor.querySelectorAll('.kv-row');

    rows.forEach(row => {
      const keyInput = row.querySelector('.key-input') as HTMLInputElement;
      const valueInput = row.querySelector('.value-input') as HTMLInputElement;

      if (keyInput && valueInput && keyInput.value.trim()) {
        params[keyInput.value.trim()] = valueInput.value.trim();
      }
    });

    this.onRequestUpdate({ params });
  }

  private updateHeadersFromDOM(): void {
    const headersEditor = document.getElementById('headers-editor');
    if (!headersEditor) return;

    const headers: Record<string, string> = {};
    const rows = headersEditor.querySelectorAll('.kv-row');

    rows.forEach(row => {
      const keyInput = row.querySelector('.key-input') as HTMLInputElement;
      const valueInput = row.querySelector('.value-input') as HTMLInputElement;

      if (keyInput && valueInput && keyInput.value.trim()) {
        headers[keyInput.value.trim()] = valueInput.value.trim();
      }
    });

    this.onRequestUpdate({ headers });
  }

  private renderAuthConfig(authType: string): void {
    const authConfig = document.getElementById('auth-config');
    if (!authConfig) return;

    authConfig.innerHTML = '';

    const configs: Record<string, string[]> = {
      basic: ['username', 'password'],
      bearer: ['token'],
      'api-key': ['key', 'value', 'location'],
    };

    const fields = configs[authType] || [];

    fields.forEach(field => {
      const input = document.createElement('input');
      input.type = field === 'password' ? 'password' : 'text';
      input.placeholder = field.charAt(0).toUpperCase() + field.slice(1);
      input.dataset.field = field;

      if (field === 'location') {
        const select = document.createElement('select');
        select.dataset.field = field;
        select.innerHTML = '<option value="header">Header</option><option value="query">Query</option>';
        authConfig.appendChild(select);
      } else {
        authConfig.appendChild(input);
      }
    });

    authConfig.addEventListener('input', () => {
      this.updateAuthFromDOM(authType);
    });
  }

  private updateAuthFromDOM(authType: string): void {
    const authConfig = document.getElementById('auth-config');
    if (!authConfig) return;

    const config: Record<string, string> = {};
    const inputs = authConfig.querySelectorAll('input, select');

    inputs.forEach(input => {
      const field = (input as HTMLElement).dataset.field;
      const value = (input as HTMLInputElement | HTMLSelectElement).value;

      if (field) {
        config[field] = value;
      }
    });

    this.onRequestUpdate({
      auth: {
        type: authType as any,
        config
      }
    });
  }

  loadParams(params: Record<string, string>): void {
    const paramsEditor = document.getElementById('params-editor');
    if (!paramsEditor) return;

    paramsEditor.innerHTML = '';

    Object.entries(params).forEach(([key, value]) => {
      const row = document.createElement('div');
      row.className = 'kv-row';
      row.innerHTML = `
        <input type="text" placeholder="Key" class="key-input" value="${key}">
        <input type="text" placeholder="Value" class="value-input" value="${value}">
        <button class="remove-btn">×</button>
      `;
      paramsEditor.appendChild(row);
    });

    if (paramsEditor.children.length === 0) {
      this.addParamRow();
    }
  }

  loadHeaders(headers: Record<string, string>): void {
    const headersEditor = document.getElementById('headers-editor');
    if (!headersEditor) return;

    headersEditor.innerHTML = '';

    Object.entries(headers).forEach(([key, value]) => {
      const row = document.createElement('div');
      row.className = 'kv-row';
      row.innerHTML = `
        <input type="text" placeholder="Key" class="key-input" value="${key}">
        <input type="text" placeholder="Value" class="value-input" value="${value}">
        <button class="remove-btn">×</button>
      `;
      headersEditor.appendChild(row);
    });

    if (headersEditor.children.length === 0) {
      this.addHeaderRow();
    }
  }

  loadBody(body: { type: string; content: string }): void {
    const bodyTypeInput = document.querySelector(`input[name="body-type"][value="${body.type}"]`) as HTMLInputElement;
    const bodyEditor = document.getElementById('request-body') as HTMLTextAreaElement;

    if (bodyTypeInput) {
      bodyTypeInput.checked = true;
    }

    if (bodyEditor) {
      bodyEditor.value = body.content;
      bodyEditor.style.display = body.type === 'none' ? 'none' : 'block';
    }
  }

  loadAuth(auth: { type: string; config: Record<string, string> }): void {
    const authTypeSelect = document.getElementById('auth-type') as HTMLSelectElement;

    if (authTypeSelect) {
      authTypeSelect.value = auth.type;
      this.renderAuthConfig(auth.type);

      setTimeout(() => {
        const authConfig = document.getElementById('auth-config');
        if (authConfig) {
          Object.entries(auth.config).forEach(([field, value]) => {
            const input = authConfig.querySelector(`[data-field="${field}"]`) as HTMLInputElement;
            if (input) {
              input.value = value;
            }
          });
        }
      }, 0);
    }
  }

  clearEditors(): void {
    const bodyEditor = document.getElementById('request-body') as HTMLTextAreaElement;
    if (bodyEditor) bodyEditor.value = '';

    const paramsEditor = document.getElementById('params-editor');
    if (paramsEditor) {
      paramsEditor.innerHTML = '';
      this.addParamRow();
    }

    const headersEditor = document.getElementById('headers-editor');
    if (headersEditor) {
      headersEditor.innerHTML = '';
      this.addHeaderRow();
    }

    const noneBodyType = document.querySelector('input[name="body-type"][value="none"]') as HTMLInputElement;
    if (noneBodyType) {
      noneBodyType.checked = true;
    }

    const authTypeSelect = document.getElementById('auth-type') as HTMLSelectElement;
    if (authTypeSelect) {
      authTypeSelect.value = 'none';
      this.renderAuthConfig('none');
    }
  }
}