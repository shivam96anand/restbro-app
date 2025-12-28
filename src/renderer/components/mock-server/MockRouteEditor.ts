/**
 * Mock Route Editor Component
 * Form for creating/editing a mock route
 */
import {
  MockRoute,
  MockHttpMethod,
  MockResponseType,
  MockRouteHeader,
} from '../MockServerTabManager';

type RouteSaveFn = (route: Partial<Omit<MockRoute, 'id'>>) => void;
type RouteCancelFn = () => void;

export class MockRouteEditor {
  onSave: RouteSaveFn | null = null;
  onCancel: RouteCancelFn | null = null;

  render(container: HTMLElement, route: MockRoute | null): void {
    const isNew = route === null;
    const method = route?.method ?? 'GET';
    const path = route?.path ?? '/';
    const statusCode = route?.statusCode ?? 200;
    const delayMs = route?.delayMs ?? 0;
    const responseType = route?.responseType ?? 'json';
    const body = route?.body ?? '';
    const contentType = route?.contentType ?? '';
    const headers = route?.headers ?? [];

    container.innerHTML = `
      <div class="mock-route-editor">
        <div class="mock-route-editor-header">
          <h4>${isNew ? 'Add Route' : 'Edit Route'}</h4>
          <button class="btn-close-editor" id="close-editor-btn">×</button>
        </div>
        <div class="mock-route-editor-body">
          <div class="mock-route-row">
            <div class="mock-route-field">
              <label>Method</label>
              <select id="route-method" class="mock-select">
                ${(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as MockHttpMethod[])
                  .map((m) => `<option value="${m}" ${m === method ? 'selected' : ''}>${m}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="mock-route-field flex-grow">
              <label>Path (exact match)</label>
              <input type="text" id="route-path" class="mock-input" value="${this.escapeAttr(path)}" placeholder="/api/users" />
            </div>
          </div>
          <div class="mock-route-row">
            <div class="mock-route-field">
              <label>Status Code</label>
              <input type="number" id="route-status" class="mock-input" value="${statusCode}" min="100" max="599" />
            </div>
            <div class="mock-route-field">
              <label>Delay (ms)</label>
              <input type="number" id="route-delay" class="mock-input" value="${delayMs}" min="0" placeholder="0" />
            </div>
            <div class="mock-route-field">
              <label>Response Type</label>
              <select id="route-response-type" class="mock-select">
                ${(['json', 'text', 'binary', 'file'] as MockResponseType[])
                  .map((t) => `<option value="${t}" ${t === responseType ? 'selected' : ''}>${t}</option>`)
                  .join('')}
              </select>
            </div>
          </div>

          <div class="mock-route-field" id="content-type-field" style="display: ${responseType !== 'json' ? 'block' : 'none'}">
            <label>Content-Type (optional override)</label>
            <input type="text" id="route-content-type" class="mock-input" value="${this.escapeAttr(contentType)}" placeholder="e.g. application/xml" />
          </div>

          <div class="mock-route-field" id="body-field">
            <label id="body-label">${this.getBodyLabel(responseType)}</label>
            ${responseType === 'file' ? `
              <div class="file-picker-row">
                <input type="text" id="route-body" class="mock-input" value="${this.escapeAttr(body)}" placeholder="Select a file..." readonly />
                <button class="btn-mock btn-pick-file" id="pick-file-btn">Browse...</button>
              </div>
            ` : `
              <textarea id="route-body" class="mock-textarea" rows="8" placeholder="${this.getBodyPlaceholder(responseType)}">${this.escapeHtml(body)}</textarea>
            `}
          </div>

          <div class="mock-route-field">
            <label>Custom Headers</label>
            <div id="headers-editor" class="mock-headers-editor">
              ${this.renderHeadersEditor(headers)}
            </div>
            <button class="btn-mock btn-add-header" id="add-header-btn">+ Add Header</button>
          </div>
        </div>
        <div class="mock-route-editor-footer">
          <button class="btn-mock btn-cancel" id="cancel-btn">Cancel</button>
          <button class="btn-mock btn-save" id="save-btn">Save</button>
        </div>
      </div>
    `;

    this.setupEventListeners(container, route?.enabled ?? true);
  }

  private renderHeadersEditor(headers: MockRouteHeader[]): string {
    if (headers.length === 0) {
      return `<div class="mock-headers-empty">No custom headers</div>`;
    }

    return headers
      .map(
        (header, index) => `
        <div class="mock-header-row" data-index="${index}">
          <input type="checkbox" class="header-enabled" ${header.enabled ? 'checked' : ''} />
          <input type="text" class="mock-input header-key" value="${this.escapeAttr(header.key)}" placeholder="Header name" />
          <input type="text" class="mock-input header-value" value="${this.escapeAttr(header.value)}" placeholder="Value" />
          <button class="btn-icon btn-remove-header" data-index="${index}">×</button>
        </div>
      `
      )
      .join('');
  }

  private setupEventListeners(container: HTMLElement, enabled: boolean): void {
    let currentEnabled = enabled;
    let currentHeaders: MockRouteHeader[] = this.collectHeaders(container);

    // Response type change
    const responseTypeSelect = container.querySelector('#route-response-type') as HTMLSelectElement;
    responseTypeSelect?.addEventListener('change', () => {
      const type = responseTypeSelect.value as MockResponseType;
      this.updateBodyFieldForType(container, type);
    });

    // Pick file button
    container.querySelector('#pick-file-btn')?.addEventListener('click', async () => {
      const result = await window.apiCourier.mockServer.pickFile();
      if (result.success && result.data && !result.data.canceled && result.data.filePath) {
        const bodyInput = container.querySelector('#route-body') as HTMLInputElement;
        if (bodyInput) {
          bodyInput.value = result.data.filePath;
        }
      }
    });

    // Add header button
    container.querySelector('#add-header-btn')?.addEventListener('click', () => {
      currentHeaders.push({ key: '', value: '', enabled: true });
      this.rerenderHeaders(container, currentHeaders);
    });

    // Close/Cancel buttons
    container.querySelector('#close-editor-btn')?.addEventListener('click', () => {
      this.onCancel?.();
    });

    container.querySelector('#cancel-btn')?.addEventListener('click', () => {
      this.onCancel?.();
    });

    // Save button
    container.querySelector('#save-btn')?.addEventListener('click', () => {
      const routeData = this.collectRouteData(container, currentEnabled);
      if (this.validateRoute(routeData)) {
        this.onSave?.(routeData);
      }
    });

    // Header removal - use event delegation
    container.querySelector('#headers-editor')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('btn-remove-header')) {
        const index = parseInt(target.dataset.index || '-1', 10);
        if (index >= 0) {
          currentHeaders.splice(index, 1);
          this.rerenderHeaders(container, currentHeaders);
        }
      }
    });
  }

  private updateBodyFieldForType(container: HTMLElement, type: MockResponseType): void {
    const contentTypeField = container.querySelector('#content-type-field') as HTMLElement;
    const bodyLabel = container.querySelector('#body-label') as HTMLElement;
    const bodyField = container.querySelector('#body-field') as HTMLElement;

    if (contentTypeField) {
      contentTypeField.style.display = type !== 'json' ? 'block' : 'none';
    }

    if (bodyLabel) {
      bodyLabel.textContent = this.getBodyLabel(type);
    }

    // Re-render body input based on type
    const currentBody = (container.querySelector('#route-body') as HTMLInputElement | HTMLTextAreaElement)?.value || '';

    if (bodyField) {
      const existingLabel = bodyField.querySelector('label')?.outerHTML || `<label id="body-label">${this.getBodyLabel(type)}</label>`;
      bodyField.innerHTML = existingLabel;

      if (type === 'file') {
        bodyField.innerHTML += `
          <div class="file-picker-row">
            <input type="text" id="route-body" class="mock-input" value="${this.escapeAttr(currentBody)}" placeholder="Select a file..." readonly />
            <button class="btn-mock btn-pick-file" id="pick-file-btn">Browse...</button>
          </div>
        `;
        // Re-attach file picker event
        bodyField.querySelector('#pick-file-btn')?.addEventListener('click', async () => {
          const result = await window.apiCourier.mockServer.pickFile();
          if (result.success && result.data && !result.data.canceled && result.data.filePath) {
            const bodyInput = bodyField.querySelector('#route-body') as HTMLInputElement;
            if (bodyInput) {
              bodyInput.value = result.data.filePath;
            }
          }
        });
      } else {
        bodyField.innerHTML += `
          <textarea id="route-body" class="mock-textarea" rows="8" placeholder="${this.getBodyPlaceholder(type)}">${this.escapeHtml(currentBody)}</textarea>
        `;
      }
    }
  }

  private rerenderHeaders(container: HTMLElement, headers: MockRouteHeader[]): void {
    // Collect current values before re-rendering
    this.collectHeaderValues(container, headers);

    const headersEditor = container.querySelector('#headers-editor');
    if (headersEditor) {
      headersEditor.innerHTML = this.renderHeadersEditor(headers);
    }
  }

  private collectHeaders(container: HTMLElement): MockRouteHeader[] {
    const headers: MockRouteHeader[] = [];
    container.querySelectorAll('.mock-header-row').forEach((row) => {
      const enabled = (row.querySelector('.header-enabled') as HTMLInputElement)?.checked ?? true;
      const key = (row.querySelector('.header-key') as HTMLInputElement)?.value || '';
      const value = (row.querySelector('.header-value') as HTMLInputElement)?.value || '';
      headers.push({ key, value, enabled });
    });
    return headers;
  }

  private collectHeaderValues(container: HTMLElement, headers: MockRouteHeader[]): void {
    container.querySelectorAll('.mock-header-row').forEach((row, index) => {
      if (headers[index]) {
        headers[index].enabled = (row.querySelector('.header-enabled') as HTMLInputElement)?.checked ?? true;
        headers[index].key = (row.querySelector('.header-key') as HTMLInputElement)?.value || '';
        headers[index].value = (row.querySelector('.header-value') as HTMLInputElement)?.value || '';
      }
    });
  }

  private collectRouteData(container: HTMLElement, enabled: boolean): Partial<Omit<MockRoute, 'id'>> {
    const method = (container.querySelector('#route-method') as HTMLSelectElement)?.value as MockHttpMethod;
    const path = (container.querySelector('#route-path') as HTMLInputElement)?.value || '/';
    const statusCode = parseInt((container.querySelector('#route-status') as HTMLInputElement)?.value || '200', 10);
    const delayMs = parseInt((container.querySelector('#route-delay') as HTMLInputElement)?.value || '0', 10);
    const responseType = (container.querySelector('#route-response-type') as HTMLSelectElement)?.value as MockResponseType;
    const body = (container.querySelector('#route-body') as HTMLInputElement | HTMLTextAreaElement)?.value || '';
    const contentType = (container.querySelector('#route-content-type') as HTMLInputElement)?.value || '';
    const headers = this.collectHeaders(container).filter((h) => h.key.trim() !== '');

    return {
      enabled,
      method,
      path,
      statusCode,
      headers,
      delayMs: delayMs || undefined,
      responseType,
      body,
      contentType: contentType || undefined,
    };
  }

  private validateRoute(route: Partial<Omit<MockRoute, 'id'>>): boolean {
    if (!route.path || !route.path.startsWith('/')) {
      alert('Path must start with /');
      return false;
    }

    if (route.responseType === 'json' && route.body) {
      try {
        JSON.parse(route.body);
      } catch {
        alert('Invalid JSON in response body');
        return false;
      }
    }

    return true;
  }

  private getBodyLabel(type: MockResponseType): string {
    switch (type) {
      case 'json':
        return 'Response Body (JSON)';
      case 'text':
        return 'Response Body (Plain Text)';
      case 'binary':
        return 'Response Body (Base64)';
      case 'file':
        return 'File Path';
      default:
        return 'Response Body';
    }
  }

  private getBodyPlaceholder(type: MockResponseType): string {
    switch (type) {
      case 'json':
        return '{"message": "Hello World"}';
      case 'text':
        return 'Plain text response...';
      case 'binary':
        return 'Base64 encoded data...';
      default:
        return '';
    }
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  private escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}
