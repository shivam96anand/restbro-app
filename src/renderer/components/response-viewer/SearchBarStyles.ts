/**
 * SearchBar CSS styles
 */

export class SearchBarStyles {
  public static applyStyles(): void {
    if (document.querySelector('#search-bar-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'search-bar-styles';
    style.textContent = `
      .json-viewer-search {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 100;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
      }

      .search-bar-container {
        display: flex;
        align-items: center;
        padding: 8px;
        gap: 8px;
        min-width: 300px;
      }

      .search-mode-selector {
        display: flex;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 4px;
        overflow: hidden;
      }

      .mode-button {
        padding: 4px 8px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
      }

      .mode-button:hover {
        background: var(--bg-primary, #fff);
      }

      .mode-button.active {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .search-input-container {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 8px;
        color: var(--text-secondary, #666);
        font-size: 12px;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 6px 8px 6px 28px;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        font-size: 12px;
        background: var(--bg-primary, #fff);
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
      }

      .search-navigation {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .search-results {
        font-size: 11px;
        color: var(--text-secondary, #666);
        min-width: 40px;
        text-align: center;
      }

      .nav-button {
        width: 24px;
        height: 24px;
        padding: 0;
        background: var(--bg-secondary, #f8f9fa);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .nav-button:hover:not(:disabled) {
        background: var(--bg-primary, #fff);
        border-color: var(--primary-color, #007bff);
      }

      .nav-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .search-close {
        width: 24px;
        height: 24px;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 18px;
        color: var(--text-secondary, #666);
        transition: color 0.2s;
      }

      .search-close:hover {
        color: var(--text-primary, #000);
      }

      @media (prefers-color-scheme: dark) {
        .json-viewer-search {
          background: var(--bg-primary, #1e1e1e);
          border-color: var(--border-color, #333);
        }

        .search-input {
          background: var(--bg-secondary, #2a2a2a);
          color: var(--text-primary, #fff);
        }
      }

      @media (max-width: 768px) {
        .json-viewer-search {
          position: static;
          width: 100%;
          border-radius: 0;
          box-shadow: none;
        }

        .search-bar-container {
          min-width: 0;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
