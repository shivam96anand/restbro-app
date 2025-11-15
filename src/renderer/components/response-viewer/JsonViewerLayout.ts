/**
 * Layout and UI setup for JsonViewer
 */

import { ViewerTab, VIEWER_CLASSES } from './types';

export class JsonViewerLayout {
  private container: HTMLElement;
  private requestId: string;

  constructor(container: HTMLElement, requestId: string) {
    this.container = container;
    this.requestId = requestId;
  }

  public setupContainer(): void {
    this.container.className = `${VIEWER_CLASSES.container} json-viewer-main`;
    this.container.innerHTML = '';
  }

  public createLayout(): {
    toolbarContainer: HTMLElement;
    prettyContainer: HTMLElement;
    rawContainer: HTMLElement;
    headersContainer: HTMLElement;
    searchContainer: HTMLElement;
  } {
    // Main toolbar
    const toolbarContainer = document.createElement('div');
    toolbarContainer.className = 'json-viewer-toolbar-container';
    this.container.appendChild(toolbarContainer);

    // Content area with tab panels
    const contentContainer = document.createElement('div');
    contentContainer.className = 'json-viewer-content-container';

    // Pretty view
    const prettyContainer = document.createElement('div');
    prettyContainer.className = 'json-viewer-panel pretty-panel';
    prettyContainer.id = `${this.requestId}-pretty-view`;
    contentContainer.appendChild(prettyContainer);

    // Raw view
    const rawContainer = document.createElement('div');
    rawContainer.className = 'json-viewer-panel raw-panel';
    rawContainer.id = `${this.requestId}-raw-view`;
    contentContainer.appendChild(rawContainer);

    // Headers view (simple table for now)
    const headersContainer = document.createElement('div');
    headersContainer.className = 'json-viewer-panel headers-panel';
    headersContainer.innerHTML =
      '<div class="panel-placeholder">Response headers will be shown here</div>';
    contentContainer.appendChild(headersContainer);

    this.container.appendChild(contentContainer);

    // Search bar (absolute positioned)
    const searchContainer = document.createElement('div');
    searchContainer.className = 'json-viewer-search-container';
    this.container.appendChild(searchContainer);

    return {
      toolbarContainer,
      prettyContainer,
      rawContainer,
      headersContainer,
      searchContainer,
    };
  }

  public setActiveTab(tab: ViewerTab): void {
    // Show/hide panels
    const panels = this.container.querySelectorAll('.json-viewer-panel');
    panels.forEach((panel) => {
      const panelElement = panel as HTMLElement;
      const isPretty = panelElement.classList.contains('pretty-panel');
      const isRaw = panelElement.classList.contains('raw-panel');
      const isHeaders = panelElement.classList.contains('headers-panel');

      const shouldShow =
        (tab === 'pretty' && isPretty) ||
        (tab === 'raw' && isRaw) ||
        (tab === 'headers' && isHeaders);

      panelElement.classList.toggle('active', shouldShow);
    });
  }

  public applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .json-viewer-main {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .json-viewer-toolbar-container {
        flex-shrink: 0;
      }

      .json-viewer-content-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }

      .json-viewer-panel {
        flex: 1;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .json-viewer-panel.active {
        display: flex;
      }

      .panel-placeholder {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary, #666);
        font-size: 14px;
      }

      .json-viewer-search-container {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 100;
      }

      .raw-panel {
        background: var(--bg-primary, #fff);
      }

      .pretty-panel {
        background: var(--bg-primary, #fff);
        overflow: hidden;
      }

      .headers-panel {
        padding: 16px;
        background: var(--bg-primary, #fff);
      }

      @media (max-width: 768px) {
        .json-viewer-search-container {
          position: static;
          padding: 8px;
          background: var(--bg-secondary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
      }

      @media (prefers-color-scheme: dark) {
        .json-viewer-main {
          background: var(--bg-primary, #1e1e1e);
          border-color: var(--border-color, #333);
        }

        .raw-panel,
        .pretty-panel,
        .headers-panel {
          background: var(--bg-primary, #1e1e1e);
        }

        .panel-placeholder {
          color: var(--text-secondary, #ccc);
        }
      }

      .json-viewer-main.loading {
        pointer-events: none;
      }

      .json-viewer-main.loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      @media (prefers-color-scheme: dark) {
        .json-viewer-main.loading::after {
          background: rgba(30, 30, 30, 0.8);
        }
      }

      .json-viewer-error {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 20px;
        color: var(--text-secondary, #666);
      }

      .json-viewer-error h3 {
        margin: 0 0 8px 0;
        color: var(--error-color, #dc3545);
      }

      .json-viewer-error p {
        margin: 0;
        text-align: center;
        line-height: 1.5;
      }
    `;

    if (!document.querySelector('#json-viewer-main-styles')) {
      style.id = 'json-viewer-main-styles';
      document.head.appendChild(style);
    }
  }
}
