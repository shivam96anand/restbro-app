/**
 * Manages content operations for JsonViewer
 */

import { JsonTreeHandle } from './JsonTree';
import { ToolbarHandle } from './Toolbar';
import { JsonUtils } from './utils/json';

export class JsonViewerContentManager {
  private jsonTree: JsonTreeHandle | null;
  private toolbar: ToolbarHandle | null;
  private container: HTMLElement;

  constructor(
    jsonTree: JsonTreeHandle | null,
    toolbar: ToolbarHandle | null,
    container: HTMLElement
  ) {
    this.jsonTree = jsonTree;
    this.toolbar = toolbar;
    this.container = container;
  }

  public async updatePrettyView(
    content: string
  ): Promise<{ success: boolean; data?: any }> {
    if (!this.jsonTree) {
      return { success: false };
    }

    if (!content.trim()) {
      this.jsonTree.setData([]);
      this.updateFormatButtonState(false);
      return { success: true, data: null };
    }

    try {
      this.setLoadingState(true);

      const parseResult = await JsonUtils.parseJson(content);
      if (parseResult.success && parseResult.data !== undefined) {
        // Check file size and warn user
        if (parseResult.isLargeFile) {
          this.showLargeFileWarning();
        }

        const nodes = JsonUtils.buildJsonTree(parseResult.data);
        this.jsonTree.setData(nodes);
        this.updateFormatButtonState(true);
        return { success: true, data: parseResult.data };
      } else {
        this.jsonTree.setData([]);
        this.updateFormatButtonState(false);

        if (parseResult.error) {
          this.showParseError(parseResult.error);
        }
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to update pretty view:', error);
      this.jsonTree.setData([]);
      this.updateFormatButtonState(false);
      return { success: false };
    } finally {
      this.setLoadingState(false);
    }
  }

  private updateFormatButtonState(canFormat: boolean): void {
    this.toolbar?.setFormatEnabled(canFormat);
  }

  private setLoadingState(loading: boolean): void {
    this.container.classList.toggle('loading', loading);
  }

  private showLargeFileWarning(): void {
    console.warn('Large JSON file detected. Performance may be impacted.');
  }

  private showParseError(error: string): void {
    const activePanel = this.container.querySelector(
      '.json-viewer-panel.active'
    );
    if (activePanel) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'json-viewer-error';
      errorDiv.innerHTML = `
        <h3>Invalid JSON</h3>
        <p>${this.escapeHtml(error)}</p>
      `;
      activePanel.innerHTML = '';
      activePanel.appendChild(errorDiv);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
