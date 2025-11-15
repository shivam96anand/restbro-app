/**
 * ToolbarKeyboardHandler - Manages keyboard shortcuts for the toolbar
 * Handles shortcut registration and key event processing
 */

export interface KeyboardShortcutCallbacks {
  onSearch: () => void;
  onFormat: () => void;
  onMinify: () => void;
  onToggleWrap: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onFontSizeIncrease: () => void;
  onFontSizeDecrease: () => void;
  onScrollTop: () => void;
  onScrollBottom: () => void;
  onFullscreen: () => void;
}

export class ToolbarKeyboardHandler {
  private keyboardShortcuts: Map<string, () => void> = new Map();
  private callbacks: KeyboardShortcutCallbacks;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor(callbacks: KeyboardShortcutCallbacks) {
    this.callbacks = callbacks;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.setupKeyboardShortcuts();
    this.attachEventListeners();
  }

  /**
   * Setup keyboard shortcut mappings
   */
  private setupKeyboardShortcuts(): void {
    const shortcuts = [
      { key: 'Control+f', mac: 'Meta+f', action: () => this.callbacks.onSearch() },
      { key: 'Control+b', mac: 'Meta+b', action: () => this.callbacks.onFormat() },
      { key: 'Control+m', mac: 'Meta+m', action: () => this.callbacks.onMinify() },
      { key: 'Control+w', mac: 'Meta+w', action: () => this.callbacks.onToggleWrap() },
      { key: 'Control+e', mac: 'Meta+e', action: () => this.callbacks.onExpandAll() },
      { key: 'Control+Shift+e', mac: 'Meta+Shift+e', action: () => this.callbacks.onCollapseAll() },
      { key: 'Control+=', mac: 'Meta+=', action: () => this.callbacks.onFontSizeIncrease() },
      { key: 'Control+-', mac: 'Meta+-', action: () => this.callbacks.onFontSizeDecrease() },
      { key: 'Control+Home', mac: 'Meta+Home', action: () => this.callbacks.onScrollTop() },
      { key: 'Control+End', mac: 'Meta+End', action: () => this.callbacks.onScrollBottom() },
      { key: 'F11', action: () => this.callbacks.onFullscreen() },
    ];

    shortcuts.forEach(shortcut => {
      const key = navigator.platform.includes('Mac') ? (shortcut.mac || shortcut.key) : shortcut.key;
      this.keyboardShortcuts.set(key.toLowerCase(), shortcut.action);
    });
  }

  /**
   * Attach keyboard event listeners
   */
  private attachEventListeners(): void {
    document.addEventListener('keydown', this.boundHandleKeydown);
  }

  /**
   * Handle keydown events and execute shortcuts
   */
  private handleKeydown(e: KeyboardEvent): void {
    const key = this.getKeyString(e);
    const handler = this.keyboardShortcuts.get(key);

    if (handler) {
      e.preventDefault();
      handler();
    }
  }

  /**
   * Convert keyboard event to normalized key string
   */
  private getKeyString(e: KeyboardEvent): string {
    const parts = [];

    if (e.ctrlKey || e.metaKey) parts.push(navigator.platform.includes('Mac') ? 'Meta' : 'Control');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    parts.push(e.key);

    return parts.join('+').toLowerCase();
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeydown);
  }
}
