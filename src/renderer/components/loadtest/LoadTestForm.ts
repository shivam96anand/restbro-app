import { TargetAdHocEditor } from './TargetAdHocEditor';
import { ApiRequest, Collection } from '../../../shared/types';
import { iconHtml } from '../../utils/icons';

interface LoadTestConfig {
  rpm: number;
  durationSec: number;
  target: any;
  followRedirects?: boolean;
  insecureTLS?: boolean;
  requestTimeoutMs?: number;
}

export class LoadTestForm {
  private container: HTMLElement | null = null;
  private targetEditor: TargetAdHocEditor;
  private collections: Collection[] = [];
  private expandedFolders = new Set<string>();
  private selectedRequestId: string | null = null;
  private selectedCollectionId: string | null = null;

  public onStart: ((config: LoadTestConfig) => void) | null = null;

  constructor() {
    this.targetEditor = new TargetAdHocEditor();
  }

  async loadCollections(): Promise<void> {
    try {
      const state = await window.restbro.store.get();
      this.collections = state.collections || [];
      this.renderCollectionTree();
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  private renderCollectionTree(): void {
    if (!this.container) return;

    const tree = this.container.querySelector(
      '#collection-tree'
    ) as HTMLElement | null;
    if (!tree) return;

    const rootCollections = this.collections
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (rootCollections.length === 0) {
      tree.innerHTML = `
        <div class="loadtest-collections-empty">
          No collections found. Create a folder or request to get started.
        </div>
      `;
      return;
    }

    tree.innerHTML = '';
    rootCollections.forEach((collection) => {
      const element = this.createCollectionElement(collection, 0);
      tree.appendChild(element);
    });
  }

  private createCollectionElement(
    collection: Collection,
    depth: number
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'loadtest-collection-container';

    const item = document.createElement('div');
    item.className = 'loadtest-collection-item';
    item.dataset.collectionId = collection.id;
    item.dataset.collectionType = collection.type;

    if (collection.type === 'folder') {
      item.classList.add('folder');
    }

    if (
      collection.type === 'request' &&
      collection.request?.id === this.selectedRequestId
    ) {
      item.classList.add('selected');
    }

    const baseIndent = 10;
    const indentPerLevel = 18;
    item.style.paddingLeft = `${depth * indentPerLevel + baseIndent}px`;

    const content = document.createElement('div');
    content.className = 'loadtest-collection-content';

    if (collection.type === 'folder') {
      const isExpanded = this.expandedFolders.has(collection.id);
      const toggle = document.createElement('span');
      toggle.className = 'loadtest-folder-toggle';
      toggle.dataset.folderId = collection.id;
      toggle.innerHTML = iconHtml(
        isExpanded ? 'chevron-down' : 'chevron-right'
      );
      content.appendChild(toggle);

      const icon = document.createElement('span');
      icon.className = 'loadtest-collection-icon';
      icon.innerHTML = iconHtml(isExpanded ? 'folder-open' : 'folder-closed');
      content.appendChild(icon);
    } else if (depth > 0) {
      const spacer = document.createElement('span');
      spacer.className = 'loadtest-folder-spacer';
      content.appendChild(spacer);
    }

    if (collection.type === 'request' && collection.request) {
      const methodBadge = document.createElement('span');
      methodBadge.className = 'method-badge';
      methodBadge.textContent = collection.request.method;
      content.appendChild(methodBadge);
      item.dataset.requestId = collection.request.id;
    }

    const name = document.createElement('span');
    name.className = 'loadtest-collection-name';
    name.textContent = collection.name;
    content.appendChild(name);

    item.appendChild(content);
    container.appendChild(item);

    if (
      collection.type === 'folder' &&
      this.expandedFolders.has(collection.id)
    ) {
      const children = this.collections
        .filter((child) => child.parentId === collection.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'loadtest-collection-children';
        children.forEach((child) => {
          const childElement = this.createCollectionElement(child, depth + 1);
          childrenContainer.appendChild(childElement);
        });
        container.appendChild(childrenContainer);
      }
    }

    return container;
  }

  async render(container: HTMLElement): Promise<void> {
    this.container = container;

    container.innerHTML = `
      <div class="load-test-form">
        <div class="form-main-grid">
          <div class="form-column">
            <div class="form-section compact">
              <h3>Test Configuration</h3>
              <div class="form-grid">
                <div class="form-field">
                  <label for="rpm-input">Requests per Minute</label>
                  <input type="number" id="rpm-input" min="1" max="10000" value="60" class="form-input">
                  <small class="form-help">Maximum 10,000 RPM</small>
                </div>

                <div class="form-field">
                  <label for="duration-input">Duration</label>
                  <div class="duration-input-group">
                    <input type="number" id="duration-value" min="1" value="5" class="form-input duration-value">
                    <select id="duration-unit" class="form-input duration-unit">
                      <option value="seconds">Seconds</option>
                      <option value="minutes" selected>Minutes</option>
                    </select>
                  </div>
                  <small class="form-help">1 second to 24 hours maximum</small>
                </div>
              </div>
            </div>

            <div class="form-section compact compact-advanced">
              <h3>Advanced Options</h3>
              <div class="form-grid two-column">
                <div class="form-field">
                  <label class="checkbox-label">
                    <input type="checkbox" id="follow-redirects" checked>
                    <span class="checkbox-text">Follow Redirects</span>
                  </label>
                </div>

                <div class="form-field">
                  <label class="checkbox-label">
                    <input type="checkbox" id="insecure-tls">
                    <span class="checkbox-text">Allow Insecure TLS</span>
                  </label>
                </div>

                <div class="form-field">
                  <label for="timeout-input">Request Timeout (ms)</label>
                  <input type="number" id="timeout-input" min="1000" max="300000" value="30000" class="form-input">
                  <small class="form-help">1-300 seconds</small>
                </div>
              </div>
            </div>
          </div>

          <div class="form-column">
            <div class="form-section compact">
              <h3>Target Request</h3>
              <div class="target-selector">
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" name="target-type" value="collection" class="target-radio">
                    <span class="radio-text">From Collections</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="target-type" value="adhoc" class="target-radio" checked>
                    <span class="radio-text">Ad-hoc Request</span>
                  </label>
                </div>

                <div id="collection-selector" class="target-option" style="display: none;">
                  <div class="loadtest-collection-picker">
                    <div class="loadtest-collection-header">
                      <div class="loadtest-collection-title">Select a request</div>
                      <div class="loadtest-collection-hint">Expand a folder to browse requests.</div>
                    </div>
                    <div id="collection-tree" class="loadtest-collections-tree"></div>
                  </div>
                </div>

                <div id="adhoc-editor" class="target-option">
                  <!-- Target editor will be rendered here -->
                </div>
              </div>
            </div>

            <div class="form-actions form-actions-inline">
              <button id="start-test-btn" class="btn btn-primary" type="button">Start Load Test</button>
            </div>
          </div>
        </div>

        <div id="validation-errors" class="validation-errors" style="display: none;"></div>
      </div>
    `;

    this.setupEventListeners();
    this.renderTargetEditor();

    // Load collections after DOM is ready
    await this.loadCollections();
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Target type radio buttons
    const targetRadios = this.container.querySelectorAll('.target-radio');
    targetRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.toggleTargetSelector(target.value);
      });
    });

    // Start test button
    const startBtn = this.container.querySelector('#start-test-btn');
    startBtn?.addEventListener('click', () => {
      this.handleStart();
    });

    const collectionTree = this.container.querySelector('#collection-tree');
    collectionTree?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const item = target.closest(
        '.loadtest-collection-item'
      ) as HTMLElement | null;
      if (!item) return;

      const collectionId = item.dataset.collectionId;
      const collectionType = item.dataset.collectionType;
      const requestId = item.dataset.requestId;

      if (!collectionId || !collectionType) return;

      if (collectionType === 'folder') {
        if (this.expandedFolders.has(collectionId)) {
          this.expandedFolders.delete(collectionId);
        } else {
          this.expandedFolders.add(collectionId);
        }
        this.renderCollectionTree();
        return;
      }

      if (collectionType === 'request' && requestId) {
        this.selectRequestFromCollections(requestId, collectionId);
      }
    });

    const collectionHeader = this.container.querySelector(
      '.loadtest-collection-header'
    );
    collectionHeader?.addEventListener('click', () => {
      this.toggleCollectionPicker();
    });

    // Form validation on input
    const inputs = this.container.querySelectorAll('input, select');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        this.clearValidationErrors();
      });
    });
  }

  private toggleTargetSelector(type: string): void {
    if (!this.container) return;

    const collectionSelector = this.container.querySelector(
      '#collection-selector'
    );
    const adhocEditor = this.container.querySelector('#adhoc-editor');

    if (type === 'collection') {
      collectionSelector?.setAttribute('style', 'display: block;');
      adhocEditor?.setAttribute('style', 'display: block;');
    } else {
      collectionSelector?.setAttribute('style', 'display: none;');
      adhocEditor?.setAttribute('style', 'display: block;');
    }
  }

  private renderTargetEditor(): void {
    if (!this.container) return;

    const editorContainer = this.container.querySelector('#adhoc-editor');
    if (editorContainer) {
      this.targetEditor.render(editorContainer as HTMLElement);
    }
  }

  private selectRequestFromCollections(
    requestId: string,
    collectionId: string
  ): void {
    const collection = this.collections.find((col) => col.id === collectionId);
    if (!collection || !collection.request) return;

    this.selectedRequestId = requestId;
    this.selectedCollectionId = collection.parentId || collection.id;

    // Update the header to show selected request
    if (this.container) {
      const titleEl = this.container.querySelector(
        '.loadtest-collection-title'
      );
      const hintEl = this.container.querySelector('.loadtest-collection-hint');
      if (titleEl && hintEl) {
        titleEl.textContent = collection.name;
        hintEl.textContent = `${collection.request.method} ${collection.request.url}`;
      }
    }

    // Prefill the target editor (for preview only, won't be used when building config)
    const target = this.requestToTarget(
      collection.request,
      this.selectedCollectionId
    );
    this.targetEditor.prefillTarget(target);
    this.setCollectionPickerCollapsed(true);
    this.renderCollectionTree();
  }

  private toggleCollectionPicker(): void {
    if (!this.container) return;
    const picker = this.container.querySelector('.loadtest-collection-picker');
    if (!picker) return;
    picker.classList.toggle('is-collapsed');
  }

  private setCollectionPickerCollapsed(isCollapsed: boolean): void {
    if (!this.container) return;
    const picker = this.container.querySelector('.loadtest-collection-picker');
    if (!picker) return;
    picker.classList.toggle('is-collapsed', isCollapsed);
  }

  private requestToTarget(request: ApiRequest, collectionId?: string): any {
    const toRecord = (
      pairs?: ApiRequest['params'] | ApiRequest['headers']
    ): Record<string, string> => {
      if (!pairs) return {};
      if (Array.isArray(pairs)) {
        return pairs.reduce<Record<string, string>>((acc, pair) => {
          if (pair.enabled && pair.key.trim() && pair.value.trim()) {
            acc[pair.key.trim()] = pair.value.trim();
          }
          return acc;
        }, {});
      }
      return Object.entries(pairs).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          if (key.trim() && value.trim()) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        },
        {}
      );
    };

    const auth = request.auth
      ? {
          type: request.auth.type === 'api-key' ? 'apikey' : request.auth.type,
          data: { ...request.auth.config },
        }
      : { type: 'none' };

    return {
      kind: 'adhoc',
      method: request.method,
      url: request.url,
      params: toRecord(request.params),
      headers: toRecord(request.headers),
      auth,
      body: request.body ? { ...request.body } : { type: 'none', content: '' },
      collectionId,
    };
  }

  private handleStart(): void {
    const config = this.buildConfig();
    const errors = this.validateConfig(config);

    if (errors.length > 0) {
      this.showValidationErrors(errors);
      return;
    }

    if (this.onStart) {
      this.onStart(config);
    }
  }

  private buildConfig(): LoadTestConfig {
    if (!this.container) throw new Error('Form not rendered');

    const rpmInput = this.container.querySelector(
      '#rpm-input'
    ) as HTMLInputElement;
    const durationValue = this.container.querySelector(
      '#duration-value'
    ) as HTMLInputElement;
    const durationUnit = this.container.querySelector(
      '#duration-unit'
    ) as HTMLSelectElement;
    const targetType = this.container.querySelector(
      'input[name="target-type"]:checked'
    ) as HTMLInputElement;
    const followRedirects = this.container.querySelector(
      '#follow-redirects'
    ) as HTMLInputElement;
    const insecureTLS = this.container.querySelector(
      '#insecure-tls'
    ) as HTMLInputElement;
    const timeout = this.container.querySelector(
      '#timeout-input'
    ) as HTMLInputElement;

    const rpm = parseInt(rpmInput.value);
    const duration = parseInt(durationValue.value);
    const durationSec =
      durationUnit.value === 'minutes' ? duration * 60 : duration;

    let target: any;
    if (targetType.value === 'collection' && this.selectedRequestId) {
      // Use proper collection target that will be resolved from saved request
      target = {
        kind: 'collection',
        requestId: this.selectedRequestId,
      };
    } else {
      // Use ad-hoc target from the editor
      target = this.targetEditor.getTarget();
    }

    return {
      rpm,
      durationSec,
      target,
      followRedirects: followRedirects.checked,
      insecureTLS: insecureTLS.checked,
      requestTimeoutMs: parseInt(timeout.value),
    };
  }

  private validateConfig(config: LoadTestConfig): string[] {
    const errors: string[] = [];

    if (!config.rpm || config.rpm < 1 || config.rpm > 10000) {
      errors.push('RPM must be between 1 and 10,000');
    }

    if (
      !config.durationSec ||
      config.durationSec < 1 ||
      config.durationSec > 86400
    ) {
      errors.push('Duration must be between 1 second and 24 hours');
    }

    if (this.container) {
      const targetType = this.container.querySelector(
        'input[name="target-type"]:checked'
      ) as HTMLInputElement;
      if (targetType?.value === 'collection' && !this.selectedRequestId) {
        errors.push('Please select a request from collections');
      }
    }

    if (config.target.kind === 'adhoc') {
      const adhocErrors = this.targetEditor.validate();
      errors.push(...adhocErrors);
    }

    if (
      !config.requestTimeoutMs ||
      config.requestTimeoutMs < 1000 ||
      config.requestTimeoutMs > 300000
    ) {
      errors.push('Request timeout must be between 1 and 300 seconds');
    }

    return errors;
  }

  private showValidationErrors(errors: string[]): void {
    if (!this.container) return;

    const errorContainer = this.container.querySelector(
      '#validation-errors'
    ) as HTMLElement;
    errorContainer.innerHTML = `
      <div class="error-list">
        ${errors.map((error) => `<div class="error-item">• ${error}</div>`).join('')}
      </div>
    `;
    errorContainer.style.display = 'block';
  }

  private clearValidationErrors(): void {
    if (!this.container) return;

    const errorContainer = this.container.querySelector(
      '#validation-errors'
    ) as HTMLElement;
    errorContainer.style.display = 'none';
  }

  prefillConfig(config: LoadTestConfig): void {
    if (!this.container) return;

    const rpmInput = this.container.querySelector(
      '#rpm-input'
    ) as HTMLInputElement;
    const durationValue = this.container.querySelector(
      '#duration-value'
    ) as HTMLInputElement;
    const durationUnit = this.container.querySelector(
      '#duration-unit'
    ) as HTMLSelectElement;
    const followRedirects = this.container.querySelector(
      '#follow-redirects'
    ) as HTMLInputElement;
    const insecureTLS = this.container.querySelector(
      '#insecure-tls'
    ) as HTMLInputElement;
    const timeout = this.container.querySelector(
      '#timeout-input'
    ) as HTMLInputElement;

    rpmInput.value = config.rpm.toString();

    if (config.durationSec >= 60 && config.durationSec % 60 === 0) {
      durationValue.value = (config.durationSec / 60).toString();
      durationUnit.value = 'minutes';
    } else {
      durationValue.value = config.durationSec.toString();
      durationUnit.value = 'seconds';
    }

    followRedirects.checked = config.followRedirects !== false;
    insecureTLS.checked = config.insecureTLS === true;
    timeout.value = (config.requestTimeoutMs || 30000).toString();

    if (config.target.kind === 'collection') {
      const collectionRadio = this.container.querySelector(
        'input[value="collection"]'
      ) as HTMLInputElement;
      collectionRadio.checked = true;
      this.toggleTargetSelector('collection');

      // Restore the selected request
      const requestId = config.target.requestId;
      if (requestId) {
        const collection = this.findRequestCollectionById(requestId);
        if (collection) {
          this.selectRequestFromCollections(requestId, collection.id);
        }
      }
    } else {
      const adhocRadio = this.container.querySelector(
        'input[value="adhoc"]'
      ) as HTMLInputElement;
      adhocRadio.checked = true;
      this.toggleTargetSelector('adhoc');
      this.targetEditor.prefillTarget(config.target);
    }
  }

  private findRequestCollectionById(requestId: string): any {
    const findInCollections = (collections: any[]): any => {
      for (const col of collections) {
        if (col.request?.id === requestId) {
          return col;
        }
        if (col.children) {
          const found = findInCollections(col.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInCollections(this.collections);
  }
}
