import { EventBus } from '../utils/event-bus';
import { Request, HttpMethod, AuthType } from '../../shared/types';

export class RequestManager {
  private currentRequest: Request | null = null;
  private keyValueEditors: Map<string, KeyValueEditor> = new Map();

  constructor(private eventBus: EventBus) {}

  initialize(): void {
    this.setupEventListeners();
    this.setupSendButton();
    this.setupMethodSelector();
    this.setupUrlInput();
    this.setupAuthSelector();
    this.initializeKeyValueEditors();
  }

  private setupEventListeners(): void {
    this.eventBus.on('request:selected', (request: Request) => {
      this.currentRequest = request;
      this.populateRequestForm(request);
    });

    this.eventBus.on('request:display', (request: Request | null) => {
      if (request) {
        this.currentRequest = request;
        this.populateRequestForm(request);
      } else {
        this.clearRequestForm();
      }
    });

    this.eventBus.on('request:new', () => {
      this.createNewRequest();
    });
  }

  private setupSendButton(): void {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        if (this.currentRequest) {
          await this.sendRequest();
        }
      });
    }
  }

  private setupMethodSelector(): void {
    const methodSelect = document.getElementById('requestMethod') as HTMLSelectElement;
    if (methodSelect) {
      methodSelect.addEventListener('change', () => {
        if (this.currentRequest) {
          this.currentRequest.method = methodSelect.value as HttpMethod;
          this.eventBus.emit('request:changed', this.currentRequest);
        }
      });
    }
  }

  private setupUrlInput(): void {
    const urlInput = document.getElementById('requestUrl') as HTMLInputElement;
    if (urlInput) {
      urlInput.addEventListener('input', () => {
        if (this.currentRequest) {
          this.currentRequest.url = urlInput.value;
          this.eventBus.emit('request:changed', this.currentRequest);
        }
      });
    }
  }

  private setupAuthSelector(): void {
    const authSelect = document.getElementById('authType') as HTMLSelectElement;
    if (authSelect) {
      authSelect.addEventListener('change', () => {
        this.updateAuthConfig(authSelect.value as AuthType);
      });
    }
  }

  private initializeKeyValueEditors(): void {
    // Initialize params editor
    const paramsEditor = new KeyValueEditor('paramsEditor', 'params');
    this.keyValueEditors.set('params', paramsEditor);

    // Initialize headers editor
    const headersEditor = new KeyValueEditor('headersEditor', 'headers');
    this.keyValueEditors.set('headers', headersEditor);

    // Setup body type selector
    this.setupBodyTypeSelector();
  }

  private setupBodyTypeSelector(): void {
    const bodyTypeRadios = document.querySelectorAll('input[name="bodyType"]');
    bodyTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (this.currentRequest && this.currentRequest.body) {
          this.currentRequest.body.type = target.value as any;
          this.eventBus.emit('request:changed', this.currentRequest);
        }
      });
    });

    // Setup body content textarea
    const bodyContent = document.getElementById('bodyContent') as HTMLTextAreaElement;
    if (bodyContent) {
      bodyContent.addEventListener('input', () => {
        if (this.currentRequest) {
          if (!this.currentRequest.body) {
            this.currentRequest.body = { type: 'json', data: '' };
          }
          this.currentRequest.body.data = bodyContent.value;
          this.eventBus.emit('request:changed', this.currentRequest);
        }
      });
    }
  }

  private createNewRequest(): void {
    this.currentRequest = {
      id: this.generateId(),
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      auth: { type: 'none', credentials: {} }
    };

    this.populateRequestForm(this.currentRequest);
    this.eventBus.emit('request:created', this.currentRequest);
  }

  private populateRequestForm(request: Request): void {
    // Method
    const methodSelect = document.getElementById('requestMethod') as HTMLSelectElement;
    if (methodSelect) {
      methodSelect.value = request.method;
    }

    // URL
    const urlInput = document.getElementById('requestUrl') as HTMLInputElement;
    if (urlInput) {
      urlInput.value = request.url;
    }

    // Params
    const paramsEditor = this.keyValueEditors.get('params');
    if (paramsEditor) {
      paramsEditor.setData(request.params || {});
    }

    // Headers
    const headersEditor = this.keyValueEditors.get('headers');
    if (headersEditor) {
      headersEditor.setData(request.headers || {});
    }

    // Body
    if (request.body) {
      const bodyTypeRadio = document.querySelector(`input[name="bodyType"][value="${request.body.type}"]`) as HTMLInputElement;
      if (bodyTypeRadio) {
        bodyTypeRadio.checked = true;
      }

      const bodyContent = document.getElementById('bodyContent') as HTMLTextAreaElement;
      if (bodyContent) {
        bodyContent.value = typeof request.body.data === 'string' ? request.body.data : JSON.stringify(request.body.data, null, 2);
      }
    }

    // Auth
    if (request.auth) {
      const authSelect = document.getElementById('authType') as HTMLSelectElement;
      if (authSelect) {
        authSelect.value = request.auth.type;
      }
      this.updateAuthConfig(request.auth.type);
    }
  }

  private clearRequestForm(): void {
    // Method
    const methodSelect = document.getElementById('requestMethod') as HTMLSelectElement;
    if (methodSelect) {
      methodSelect.value = 'GET';
    }

    // URL
    const urlInput = document.getElementById('requestUrl') as HTMLInputElement;
    if (urlInput) {
      urlInput.value = '';
    }

    // Params
    const paramsEditor = this.keyValueEditors.get('params');
    if (paramsEditor) {
      paramsEditor.setData({});
    }

    // Headers
    const headersEditor = this.keyValueEditors.get('headers');
    if (headersEditor) {
      headersEditor.setData({});
    }

    // Body
    const bodyContent = document.getElementById('bodyContent') as HTMLTextAreaElement;
    if (bodyContent) {
      bodyContent.value = '';
    }

    // Clear body type radio
    const jsonRadio = document.querySelector('input[name="bodyType"][value="json"]') as HTMLInputElement;
    if (jsonRadio) {
      jsonRadio.checked = true;
    }

    // Auth
    const authSelect = document.getElementById('authType') as HTMLSelectElement;
    if (authSelect) {
      authSelect.value = 'none';
    }
    this.updateAuthConfig('none');
    
    this.currentRequest = null;
  }

  private updateAuthConfig(authType: AuthType): void {
    const authConfig = document.getElementById('authConfig');
    if (!authConfig) return;

    authConfig.innerHTML = '';

    if (!this.currentRequest) {
      this.currentRequest = this.createEmptyRequest();
    }

    this.currentRequest.auth = { type: authType, credentials: {} };

    switch (authType) {
      case 'basic':
        authConfig.innerHTML = `
          <div class="auth-field">
            <label>Username</label>
            <input type="text" id="authUsername" placeholder="Enter username">
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" id="authPassword" placeholder="Enter password">
          </div>
        `;
        
        const usernameInput = document.getElementById('authUsername') as HTMLInputElement;
        const passwordInput = document.getElementById('authPassword') as HTMLInputElement;
        
        if (usernameInput) {
          usernameInput.addEventListener('input', () => {
            if (this.currentRequest && this.currentRequest.auth) {
              this.currentRequest.auth.credentials.username = usernameInput.value;
            }
          });
        }
        
        if (passwordInput) {
          passwordInput.addEventListener('input', () => {
            if (this.currentRequest && this.currentRequest.auth) {
              this.currentRequest.auth.credentials.password = passwordInput.value;
            }
          });
        }
        break;

      case 'bearer':
        authConfig.innerHTML = `
          <div class="auth-field">
            <label>Token</label>
            <input type="text" id="authToken" placeholder="Enter bearer token">
          </div>
        `;
        
        const tokenInput = document.getElementById('authToken') as HTMLInputElement;
        if (tokenInput) {
          tokenInput.addEventListener('input', () => {
            if (this.currentRequest && this.currentRequest.auth) {
              this.currentRequest.auth.credentials.token = tokenInput.value;
            }
          });
        }
        break;

      case 'api-key':
        authConfig.innerHTML = `
          <div class="auth-field">
            <label>Key</label>
            <input type="text" id="authKey" placeholder="Enter API key name">
          </div>
          <div class="auth-field">
            <label>Value</label>
            <input type="text" id="authValue" placeholder="Enter API key value">
          </div>
          <div class="auth-field">
            <label>Add to</label>
            <select id="authLocation">
              <option value="header">Header</option>
              <option value="query">Query Parameter</option>
            </select>
          </div>
        `;
        
        const keyInput = document.getElementById('authKey') as HTMLInputElement;
        const valueInput = document.getElementById('authValue') as HTMLInputElement;
        const locationSelect = document.getElementById('authLocation') as HTMLSelectElement;
        
        [keyInput, valueInput, locationSelect].forEach(input => {
          if (input) {
            input.addEventListener('input', () => {
              if (this.currentRequest && this.currentRequest.auth) {
                this.currentRequest.auth.credentials = {
                  key: keyInput?.value || '',
                  value: valueInput?.value || '',
                  location: locationSelect?.value || 'header'
                };
              }
            });
          }
        });
        break;

      case 'oauth1':
      case 'oauth2':
        authConfig.innerHTML = `
          <div class="auth-field">
            <p>OAuth authentication coming soon...</p>
          </div>
        `;
        break;
    }
  }

  private async sendRequest(): Promise<void> {
    if (!this.currentRequest) return;

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.textContent = 'Sending...';
      sendBtn.setAttribute('disabled', 'true');
    }

    try {
      // Collect current form data
      this.collectFormData();

      // Send request
      const response = await window.electronAPI.sendRequest(this.currentRequest);
      
      // Emit response received event
      this.eventBus.emit('response:received', response);
      
    } catch (error) {
      console.error('Failed to send request:', error);
      this.eventBus.emit('toast:show', {
        message: `Request failed: ${error}`,
        type: 'error'
      });
    } finally {
      if (sendBtn) {
        sendBtn.textContent = 'Send';
        sendBtn.removeAttribute('disabled');
      }
    }
  }

  private collectFormData(): void {
    if (!this.currentRequest) return;

    // Collect params
    const paramsEditor = this.keyValueEditors.get('params');
    if (paramsEditor) {
      this.currentRequest.params = paramsEditor.getData();
    }

    // Collect headers
    const headersEditor = this.keyValueEditors.get('headers');
    if (headersEditor) {
      this.currentRequest.headers = headersEditor.getData();
    }

    // Collect body
    const bodyContent = document.getElementById('bodyContent') as HTMLTextAreaElement;
    const bodyTypeRadio = document.querySelector('input[name="bodyType"]:checked') as HTMLInputElement;
    
    if (bodyContent && bodyContent.value.trim()) {
      const bodyType = bodyTypeRadio?.value || 'json';
      let bodyData: any = bodyContent.value;

      if (bodyType === 'json') {
        try {
          bodyData = JSON.parse(bodyContent.value);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      this.currentRequest.body = {
        type: bodyType as any,
        data: bodyData
      };
    }
  }

  private createEmptyRequest(): Request {
    return {
      id: this.generateId(),
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      auth: { type: 'none', credentials: {} }
    };
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class KeyValueEditor {
  private data: Record<string, string> = {};
  private container: HTMLElement;

  constructor(private containerId: string, private type: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }
    this.container = container;
    this.setupAddButton();
    this.render();
  }

  private setupAddButton(): void {
    const parent = this.container.parentElement;
    if (!parent) return;

    const addButton = parent.querySelector('.add-row-btn');
    if (addButton) {
      addButton.addEventListener('click', () => {
        this.addRow();
      });
    }
  }

  setData(data: Record<string, string>): void {
    this.data = { ...data };
    this.render();
  }

  getData(): Record<string, string> {
    return { ...this.data };
  }

  private addRow(key: string = '', value: string = ''): void {
    const id = `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    if (key) {
      this.data[key] = value;
    }

    this.render();

    // Focus on the new row
    setTimeout(() => {
      const newKeyInput = this.container.querySelector(`input[data-id="${id}"][data-field="key"]`) as HTMLInputElement;
      if (newKeyInput) {
        newKeyInput.focus();
      }
    }, 10);
  }

  private removeRow(key: string): void {
    delete this.data[key];
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    // Render existing data
    Object.entries(this.data).forEach(([key, value]) => {
      this.renderRow(key, value);
    });

    // Always have one empty row
    if (Object.keys(this.data).length === 0 || !this.hasEmptyRow()) {
      this.renderRow('', '');
    }
  }

  private renderRow(key: string, value: string): void {
    const id = `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const row = document.createElement('div');
    row.className = 'key-value-row';
    
    row.innerHTML = `
      <input type="text" placeholder="Key" value="${key}" data-id="${id}" data-field="key">
      <input type="text" placeholder="Value" value="${value}" data-id="${id}" data-field="value">
      <button class="delete-btn" data-id="${id}">×</button>
    `;

    const keyInput = row.querySelector('input[data-field="key"]') as HTMLInputElement;
    const valueInput = row.querySelector('input[data-field="value"]') as HTMLInputElement;
    const deleteBtn = row.querySelector('.delete-btn') as HTMLButtonElement;

    keyInput.addEventListener('input', () => {
      const oldKey = key;
      const newKey = keyInput.value;
      
      if (oldKey && oldKey !== newKey) {
        delete this.data[oldKey];
      }
      
      if (newKey.trim()) {
        this.data[newKey] = valueInput.value;
      }
    });

    valueInput.addEventListener('input', () => {
      const currentKey = keyInput.value;
      if (currentKey.trim()) {
        this.data[currentKey] = valueInput.value;
      }
    });

    deleteBtn.addEventListener('click', () => {
      const currentKey = keyInput.value;
      if (currentKey) {
        this.removeRow(currentKey);
      } else {
        row.remove();
      }
    });

    this.container.appendChild(row);
  }

  private hasEmptyRow(): boolean {
    const rows = this.container.querySelectorAll('.key-value-row');
    return Array.from(rows).some(row => {
      const keyInput = row.querySelector('input[data-field="key"]') as HTMLInputElement;
      const valueInput = row.querySelector('input[data-field="value"]') as HTMLInputElement;
      return !keyInput.value.trim() && !valueInput.value.trim();
    });
  }
}
