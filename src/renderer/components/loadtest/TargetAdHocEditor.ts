import { TargetAdHocTemplates } from './TargetAdHocTemplates';
import { TargetAdHocDataExtractor } from './TargetAdHocDataExtractor';
import { TargetAdHocPrefill } from './TargetAdHocPrefill';
import { addVariableHighlighting } from '../request/variable-helper';
import { MonacoJsonEditor } from '../request/MonacoJsonEditor';
import { Environment } from '../../../shared/types';

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

interface LoadTestTargetAdHoc {
  kind: 'adhoc';
  method: HttpMethod;
  url: string;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2';
    data?: unknown;
  };
  body?: {
    type: 'none' | 'json' | 'raw' | 'form-data' | 'form-urlencoded';
    content: string;
  };
  collectionId?: string;
}

export class TargetAdHocEditor {
  private container: HTMLElement | null = null;
  private activeTab = 'params';

  // Variable highlighting context (mirrors the API tab). The active environment
  // is the one chosen in the load test form's Environment dropdown so colors and
  // hover tooltips reflect the values the run will actually use.
  private varEnv: Environment | undefined;
  private varGlobals: { variables: Record<string, string> } = {
    variables: {},
  };
  private varFolderVars: Record<string, string> = {};
  private bodyJsonEditor: MonacoJsonEditor | null = null;

  render(container: HTMLElement): void {
    this.disposeBodyJsonEditor();
    this.container = container;
    container.innerHTML = TargetAdHocTemplates.getMainTemplate();
    this.setupEventListeners();
    this.setupAuthConfig();
    this.refreshHighlighting();
  }

  /**
   * Sets the variable-resolution context used for coloring {{variables}} and
   * their hover tooltips, then re-applies highlighting to every input.
   */
  setVariableContext(
    env: Environment | undefined,
    globals: { variables: Record<string, string> },
    folderVars: Record<string, string>
  ): void {
    this.varEnv = env;
    this.varGlobals = globals || { variables: {} };
    this.varFolderVars = folderVars || {};
    this.refreshHighlighting();
  }

  /**
   * Applies variable highlighting + hover tooltips to all text inputs in the
   * editor (URL, params, headers, basic/bearer/api-key auth, and OAuth fields).
   * Safe to call repeatedly — listeners are attached once per input.
   */
  refreshHighlighting(): void {
    if (!this.container) return;

    const inputs = this.container.querySelectorAll<HTMLInputElement>(
      '#target-url, input.key-input, input.value-input, input.auth-input, .oauth-config input[type="text"], .oauth-config input[type="password"]'
    );
    inputs.forEach((input) => this.enhanceInput(input));
  }

  private enhanceInput(input: HTMLInputElement): void {
    const marker = '__ltVariableSupport';
    if (!(input as unknown as Record<string, boolean>)[marker]) {
      (input as unknown as Record<string, boolean>)[marker] = true;
      input.addEventListener('input', () => {
        addVariableHighlighting(
          input,
          this.varEnv,
          this.varGlobals,
          this.varFolderVars
        );
      });
    }
    addVariableHighlighting(
      input,
      this.varEnv,
      this.varGlobals,
      this.varFolderVars
    );
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Tab switching
    const tabs = this.container.querySelectorAll('.tab');
    tabs.forEach((tab) => {
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
    const bodyTypeRadios = this.container.querySelectorAll(
      'input[name="target-body-type"]'
    );
    bodyTypeRadios.forEach((radio) => {
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
    this.container.querySelectorAll('.tab').forEach((tab) => {
      tab.classList.remove('active');
    });
    this.container
      .querySelector(`[data-section="${section}"]`)
      ?.classList.add('active');

    // Show appropriate section
    this.container.querySelectorAll('.section').forEach((sec) => {
      sec.classList.remove('active');
    });
    this.container
      .querySelector(`#target-${section}-section`)
      ?.classList.add('active');

    // Re-align overlays now that the section is visible (hidden inputs report a
    // zero rect, so their highlight would otherwise be mispositioned).
    this.refreshHighlighting();

    // Monaco renders at zero size while its section is hidden; force a relayout
    // once the Body tab becomes visible.
    if (section === 'body') {
      this.bodyJsonEditor?.getEditor()?.layout();
    }
  }

  private addKeyValueRow(editorId: string): void {
    if (!this.container) return;

    const editor = this.container.querySelector(`#${editorId}`);
    if (!editor) return;
    editor.insertAdjacentHTML(
      'beforeend',
      TargetAdHocTemplates.getKeyValueRow()
    );
    this.refreshHighlighting();
  }

  private setupAuthConfig(): void {
    if (!this.container) return;

    const authType = this.container.querySelector(
      '#target-auth-type'
    ) as HTMLSelectElement;
    const authConfig = this.container.querySelector(
      '#target-auth-config'
    ) as HTMLElement;

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

    this.refreshHighlighting();
  }

  private setupOAuth2Listeners(): void {
    if (!this.container) return;
    const grantType = this.container.querySelector(
      '#target-oauth-grant-type'
    ) as HTMLSelectElement | null;
    const authCodeFields = this.container.querySelector(
      '#target-oauth-auth-code-fields'
    ) as HTMLElement | null;
    if (!grantType || !authCodeFields) return;

    const updateVisibility = () => {
      authCodeFields.style.display =
        grantType.value === 'authorization_code' ? 'block' : 'none';
      this.refreshHighlighting();
    };

    grantType.addEventListener('change', updateVisibility);
    updateVisibility();
  }

  private toggleBodyEditor(type: string): void {
    if (!this.container) return;

    const textarea = this.container.querySelector(
      '#target-request-body'
    ) as HTMLTextAreaElement;
    const monacoContainer = this.container.querySelector(
      '#target-body-monaco'
    ) as HTMLElement;
    if (!textarea || !monacoContainer) return;

    if (type === 'json') {
      // Show the Monaco JSON editor (syntax highlighting + validation) like the
      // API tab. The textarea stays in the DOM as the source of truth and is
      // kept in sync from Monaco's onChange, so data extraction is unchanged.
      const content =
        textarea.value && textarea.value.trim() ? textarea.value : '{\n  \n}';
      textarea.value = content;
      textarea.style.display = 'none';
      monacoContainer.style.display = 'block';

      if (!this.bodyJsonEditor) {
        this.bodyJsonEditor = new MonacoJsonEditor({
          container: monacoContainer,
          value: content,
          onChange: (value) => {
            textarea.value = value;
          },
        });
      } else {
        this.bodyJsonEditor.setValue(content);
      }
    } else if (type === 'none') {
      monacoContainer.style.display = 'none';
      textarea.style.display = 'none';
      textarea.value = '';
    } else {
      // raw / form-urlencoded → plain textarea (Monaco kept hidden for reuse)
      monacoContainer.style.display = 'none';
      textarea.style.display = 'block';
    }
  }

  private disposeBodyJsonEditor(): void {
    if (this.bodyJsonEditor) {
      this.bodyJsonEditor.dispose();
      this.bodyJsonEditor = null;
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

    const methodSelect = this.container.querySelector(
      '#target-method'
    ) as HTMLSelectElement;
    const urlInput = this.container.querySelector(
      '#target-url'
    ) as HTMLInputElement;

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
      TargetAdHocPrefill.prefillAuth(this.container, target.auth, () =>
        this.setupAuthConfig()
      );
    }

    // Prefill body
    if (target.body) {
      TargetAdHocPrefill.prefillBody(this.container, target.body, (type) =>
        this.toggleBodyEditor(type)
      );
    }

    this.refreshHighlighting();
  }
}
