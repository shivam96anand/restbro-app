import { TargetAdHocTemplates } from './TargetAdHocTemplates';
import { TargetAdHocDataExtractor } from './TargetAdHocDataExtractor';
import { TargetAdHocPrefill } from './TargetAdHocPrefill';

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

export class TargetAdHocEditor {
  private container: HTMLElement | null = null;
  private activeTab = 'params';

  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = TargetAdHocTemplates.getMainTemplate();
    this.setupEventListeners();
    this.setupAuthConfig();
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Tab switching
    const tabs = this.container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const section = target.dataset.section;
        if (section) {
          this.switchTab(section);
        }
      });
    });

    // Add parameter button
    const addParamBtn = this.container.querySelector('.add-param-btn');
    addParamBtn?.addEventListener('click', () => {
      this.addKeyValueRow('target-params-editor');
    });

    // Add header button
    const addHeaderBtn = this.container.querySelector('.add-header-btn');
    addHeaderBtn?.addEventListener('click', () => {
      this.addKeyValueRow('target-headers-editor');
    });

    // Auth type change
    const authType = this.container.querySelector('#target-auth-type');
    authType?.addEventListener('change', () => {
      this.setupAuthConfig();
    });

    // Body type change
    const bodyTypeRadios = this.container.querySelectorAll('input[name="target-body-type"]');
    bodyTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.toggleBodyEditor(target.value);
      });
    });

    // Remove button delegation
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('remove-btn')) {
        const row = target.closest('.kv-row');
        if (row) {
          row.remove();
        }
      }
    });
  }

  private switchTab(section: string): void {
    if (!this.container) return;

    this.activeTab = section;

    // Update tab active state
    this.container.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    this.container.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    // Show appropriate section
    this.container.querySelectorAll('.section').forEach(sec => {
      sec.classList.remove('active');
    });
    this.container.querySelector(`#target-${section}-section`)?.classList.add('active');
  }

  private addKeyValueRow(editorId: string): void {
    if (!this.container) return;

    const editor = this.container.querySelector(`#${editorId}`);
    if (!editor) return;
    editor.insertAdjacentHTML('beforeend', TargetAdHocTemplates.getKeyValueRow());
  }

  private setupAuthConfig(): void {
    if (!this.container) return;

    const authType = this.container.querySelector('#target-auth-type') as HTMLSelectElement;
    const authConfig = this.container.querySelector('#target-auth-config') as HTMLElement;

    authConfig.innerHTML = '';

    switch (authType.value) {
      case 'basic':
        authConfig.innerHTML = TargetAdHocTemplates.getBasicAuthTemplate();
        break;
      case 'bearer':
        authConfig.innerHTML = TargetAdHocTemplates.getBearerAuthTemplate();
        break;
      case 'apikey':
        authConfig.innerHTML = TargetAdHocTemplates.getApiKeyAuthTemplate();
        break;
      case 'oauth2':
        authConfig.innerHTML = TargetAdHocTemplates.getOAuth2AuthTemplate();
        this.setupOAuth2Listeners();
        break;
    }
  }

  private setupOAuth2Listeners(): void {
    if (!this.container) return;
    const grantType = this.container.querySelector('#target-oauth-grant-type') as HTMLSelectElement | null;
    const authCodeFields = this.container.querySelector('#target-oauth-auth-code-fields') as HTMLElement | null;
    if (!grantType || !authCodeFields) return;

    const updateVisibility = () => {
      authCodeFields.style.display = grantType.value === 'authorization_code' ? 'block' : 'none';
    };

    grantType.addEventListener('change', updateVisibility);
    updateVisibility();
  }

  private toggleBodyEditor(type: string): void {
    if (!this.container) return;

    const bodyEditor = this.container.querySelector('#target-request-body') as HTMLTextAreaElement;

    if (type === 'none') {
      bodyEditor.style.display = 'none';
      bodyEditor.value = '';
    } else {
      bodyEditor.style.display = 'block';
      if (type === 'json' && !bodyEditor.value) {
        bodyEditor.value = '{\n  \n}';
      }
    }
  }

  getTarget(): LoadTestTargetAdHoc {
    if (!this.container) throw new Error('Editor not rendered');
    return TargetAdHocDataExtractor.getTarget(this.container);
  }

  validate(): string[] {
    const target = this.getTarget();
    return TargetAdHocDataExtractor.validate(target);
  }

  prefillTarget(target: LoadTestTargetAdHoc): void {
    if (!this.container) return;

    const methodSelect = this.container.querySelector('#target-method') as HTMLSelectElement;
    const urlInput = this.container.querySelector('#target-url') as HTMLInputElement;

    methodSelect.value = target.method;
    urlInput.value = target.url;

    // Prefill params
    if (target.params) {
      TargetAdHocPrefill.prefillKeyValuePairs(
        this.container,
        'target-params-editor',
        target.params,
        (id) => this.addKeyValueRow(id)
      );
    }

    // Prefill headers
    if (target.headers) {
      TargetAdHocPrefill.prefillKeyValuePairs(
        this.container,
        'target-headers-editor',
        target.headers,
        (id) => this.addKeyValueRow(id)
      );
    }

    // Prefill auth
    if (target.auth) {
      TargetAdHocPrefill.prefillAuth(
        this.container,
        target.auth,
        () => this.setupAuthConfig()
      );
    }

    // Prefill body
    if (target.body) {
      TargetAdHocPrefill.prefillBody(
        this.container,
        target.body,
        (type) => this.toggleBodyEditor(type)
      );
    }
  }
}
