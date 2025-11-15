/**
 * ToolbarStyles - Manages all CSS styling for the toolbar
 * Contains all visual styles for tabs, buttons, dropdowns, and responsive design
 */

export class ToolbarStyles {
  /**
   * Apply all toolbar styles to the document
   */
  static applyStyles(): void {
    if (document.querySelector('#toolbar-styles')) {
      return; // Styles already applied
    }

    const style = document.createElement('style');
    style.id = 'toolbar-styles';
    style.textContent = `
      .json-viewer-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--bg-secondary, #f8f9fa);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        user-select: none;
      }

      .toolbar-section {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .toolbar-tabs {
        display: flex;
        gap: 2px;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        overflow: hidden;
      }

      .toolbar-tab {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }

      .toolbar-tab:hover {
        background: var(--bg-secondary, #f8f9fa);
      }

      .toolbar-tab.active {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .tab-icon {
        font-size: 14px;
      }

      .toolbar-actions {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .toolbar-button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 8px;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
      }

      .toolbar-button:hover {
        background: var(--bg-secondary, #f8f9fa);
        border-color: var(--border-hover, #ccc);
      }

      .toolbar-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .button-icon {
        font-size: 12px;
      }

      .font-size-controls {
        display: flex;
        align-items: center;
        gap: 2px;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        overflow: hidden;
      }

      .font-size-btn {
        padding: 4px 6px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 10px;
        font-weight: bold;
      }

      .font-size-btn:hover {
        background: var(--bg-secondary, #f8f9fa);
      }

      .font-size-display {
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 500;
        border-left: 1px solid var(--border-color, #e0e0e0);
        border-right: 1px solid var(--border-color, #e0e0e0);
        min-width: 32px;
        text-align: center;
      }

      .toggle-controls {
        display: flex;
        gap: 2px;
      }

      .toolbar-toggle {
        padding: 6px 8px;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .toolbar-toggle:hover {
        background: var(--bg-secondary, #f8f9fa);
      }

      .toolbar-toggle.active {
        background: var(--primary-color, #007bff);
        color: white;
        border-color: var(--primary-color, #007bff);
      }

      .more-actions-container {
        position: relative;
      }

      .more-trigger {
        font-weight: bold;
      }

      .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 2px;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 160px;
        overflow: hidden;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
      }

      .dropdown-item:hover {
        background: var(--bg-secondary, #f8f9fa);
      }

      .item-icon {
        font-size: 14px;
      }

      .item-label {
        flex: 1;
      }

      .item-shortcut {
        font-size: 10px;
        color: var(--text-secondary, #666);
      }

      /* Responsive adjustments */
      @media (max-width: 900px) {
        .toolbar-actions {
          gap: 2px;
        }

        .toolbar-button {
          padding: 4px 6px;
          font-size: 10px;
        }

        .button-label {
          display: none;
        }

        .button-icon {
          font-size: 14px;
        }
      }

      /* Make Ask AI button more prominent */
      .toolbar-button[data-action="ask-ai"] {
        background: var(--primary-color, #007bff);
        color: white;
        border-color: var(--primary-color, #007bff);
      }

      .toolbar-button[data-action="ask-ai"]:hover {
        background: var(--primary-dark, #0056b3);
        border-color: var(--primary-dark, #0056b3);
      }
    `;

    document.head.appendChild(style);
  }
}
