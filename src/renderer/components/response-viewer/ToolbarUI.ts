/**
 * ToolbarUI - Handles UI creation for the toolbar
 * Creates tabs, action buttons, settings controls, and dropdowns
 */

import { ViewerTab, VIEWER_CLASSES } from './types';

export interface ToolbarUICallbacks {
  onTabChange: (tab: ViewerTab) => void;
  onFormat: () => void;
  onMinify: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearch: () => void;
  onScrollTop: () => void;
  onScrollBottom: () => void;
  onToggleWrap: () => void;
  onToggleTypes: () => void;
  onFullscreen: () => void;
  onCopy: () => void;
  onExport: () => void;
  onAskAI: () => void;
  onFontSizeChange: (delta: number) => void;
  onToggleDropdown: () => void;
  onHideDropdown: () => void;
}

export class ToolbarUI {
  private elements: Map<string, HTMLElement> = new Map();
  private callbacks: ToolbarUICallbacks;

  constructor(callbacks: ToolbarUICallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Get stored element by ID
   */
  getElement(id: string): HTMLElement | undefined {
    return this.elements.get(id);
  }

  /**
   * Render the complete toolbar structure
   */
  render(container: HTMLElement): void {
    container.className = `${VIEWER_CLASSES.toolbar} json-viewer-toolbar`;
    container.innerHTML = '';

    // Create toolbar sections
    const leftSection = this.createSection('toolbar-left');
    const centerSection = this.createSection('toolbar-center');
    const rightSection = this.createSection('toolbar-right');

    // Tab selector
    leftSection.appendChild(this.createTabSelector());

    // Main actions (center)
    centerSection.appendChild(this.createActionsGroup());

    // Settings and utilities (right)
    rightSection.appendChild(this.createSettingsGroup());

    container.appendChild(leftSection);
    container.appendChild(centerSection);
    container.appendChild(rightSection);
  }

  private createSection(className: string): HTMLElement {
    const section = document.createElement('div');
    section.className = `toolbar-section ${className}`;
    return section;
  }

  private createTabSelector(): HTMLElement {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'toolbar-tabs';

    const tabs: Array<{ id: ViewerTab; label: string; icon: string }> = [
      { id: 'pretty', label: 'Pretty', icon: '🌳' },
      { id: 'raw', label: 'Raw', icon: '📝' },
      { id: 'headers', label: 'Headers', icon: '📋' },
    ];

    tabs.forEach(tab => {
      const button = this.createTabButton(tab);
      tabContainer.appendChild(button);
      this.elements.set(`tab-${tab.id}`, button);
    });

    return tabContainer;
  }

  private createTabButton(tab: { id: ViewerTab; label: string; icon: string }): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-tab';
    button.dataset.tab = tab.id;

    const icon = document.createElement('span');
    icon.className = 'tab-icon';
    icon.textContent = tab.icon;

    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = tab.label;

    button.appendChild(icon);
    button.appendChild(label);

    button.addEventListener('click', () => {
      this.callbacks.onTabChange(tab.id);
    });

    return button;
  }

  private createActionsGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'toolbar-actions';

    const actions = [
      { id: 'format', label: 'Format', icon: '✨', shortcut: 'Ctrl+B', handler: () => this.callbacks.onFormat() },
      { id: 'minify', label: 'Minify', icon: '📦', shortcut: 'Ctrl+M', handler: () => this.callbacks.onMinify() },
      { id: 'expand', label: 'Expand All', icon: '📂', shortcut: 'Ctrl+E', handler: () => this.callbacks.onExpandAll() },
      { id: 'collapse', label: 'Collapse All', icon: '📁', shortcut: 'Ctrl+Shift+E', handler: () => this.callbacks.onCollapseAll() },
      { id: 'search', label: 'Search', icon: '🔍', shortcut: 'Ctrl+F', handler: () => this.callbacks.onSearch() },
      { id: 'scroll-top', label: 'Top', icon: '⬆️', shortcut: 'Ctrl+Home', handler: () => this.callbacks.onScrollTop() },
      { id: 'scroll-bottom', label: 'Bottom', icon: '⬇️', shortcut: 'Ctrl+End', handler: () => this.callbacks.onScrollBottom() },
    ];

    actions.forEach(action => {
      const button = this.createActionButton(action);
      group.appendChild(button);
      this.elements.set(action.id, button);
    });

    return group;
  }

  private createActionButton(action: {
    id: string;
    label: string;
    icon: string;
    shortcut: string;
    handler: () => void;
  }): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.dataset.action = action.id;
    button.title = `${action.label} (${action.shortcut})`;

    const icon = document.createElement('span');
    icon.className = 'button-icon';
    icon.textContent = action.icon;

    const label = document.createElement('span');
    label.className = 'button-label';
    label.textContent = action.label;

    button.appendChild(icon);
    button.appendChild(label);

    button.addEventListener('click', action.handler);

    return button;
  }

  private createSettingsGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'toolbar-settings';

    // Font size controls
    const fontSizeContainer = this.createFontSizeControls();
    group.appendChild(fontSizeContainer);

    // Toggle controls
    const togglesContainer = this.createToggleControls();
    group.appendChild(togglesContainer);

    // More actions dropdown
    const moreActionsContainer = this.createMoreActionsDropdown();
    group.appendChild(moreActionsContainer);

    return group;
  }

  private createFontSizeControls(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'font-size-controls';

    const decreaseButton = document.createElement('button');
    decreaseButton.className = 'toolbar-button font-size-btn';
    decreaseButton.textContent = 'A-';
    decreaseButton.title = 'Decrease font size (Ctrl+-)';
    decreaseButton.addEventListener('click', () => this.callbacks.onFontSizeChange(-1));

    const display = document.createElement('span');
    display.className = 'font-size-display';
    display.textContent = '14px';
    this.elements.set('font-size-display', display);

    const increaseButton = document.createElement('button');
    increaseButton.className = 'toolbar-button font-size-btn';
    increaseButton.textContent = 'A+';
    increaseButton.title = 'Increase font size (Ctrl++)';
    increaseButton.addEventListener('click', () => this.callbacks.onFontSizeChange(1));

    container.appendChild(decreaseButton);
    container.appendChild(display);
    container.appendChild(increaseButton);

    return container;
  }

  private createToggleControls(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'toggle-controls';

    const toggles = [
      { id: 'wrap', label: 'Wrap', icon: '↩️', shortcut: 'Ctrl+W', handler: () => this.callbacks.onToggleWrap() },
      { id: 'types', label: 'Types', icon: '🏷️', shortcut: '', handler: () => this.callbacks.onToggleTypes() },
    ];

    toggles.forEach(toggle => {
      const button = this.createToggleButton(toggle);
      container.appendChild(button);
      this.elements.set(`toggle-${toggle.id}`, button);
    });

    return container;
  }

  private createToggleButton(toggle: {
    id: string;
    label: string;
    icon: string;
    shortcut: string;
    handler: () => void;
  }): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button toolbar-toggle';
    button.dataset.toggle = toggle.id;
    button.title = toggle.shortcut ? `${toggle.label} (${toggle.shortcut})` : toggle.label;

    const icon = document.createElement('span');
    icon.className = 'button-icon';
    icon.textContent = toggle.icon;

    const label = document.createElement('span');
    label.className = 'button-label';
    label.textContent = toggle.label;

    button.appendChild(icon);
    button.appendChild(label);

    button.addEventListener('click', toggle.handler);

    return button;
  }

  private createMoreActionsDropdown(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'more-actions-container';

    const trigger = document.createElement('button');
    trigger.className = 'toolbar-button more-trigger';
    trigger.innerHTML = `<span class="button-icon">⋮</span>`;
    trigger.title = 'More actions';

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';
    dropdown.style.display = 'none';

    const actions = [
      { id: 'fullscreen', label: 'Fullscreen', icon: '⛶', shortcut: 'F11', handler: () => this.callbacks.onFullscreen() },
      { id: 'copy', label: 'Copy', icon: '📋', shortcut: 'Ctrl+C', handler: () => this.callbacks.onCopy() },
      { id: 'export', label: 'Export', icon: '💾', shortcut: '', handler: () => this.callbacks.onExport() },
      { id: 'ask-ai', label: 'Ask AI', icon: '🤖', shortcut: '', handler: () => this.callbacks.onAskAI() },
    ];

    actions.forEach(action => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';

      const icon = document.createElement('span');
      icon.className = 'item-icon';
      icon.textContent = action.icon;

      const label = document.createElement('span');
      label.className = 'item-label';
      label.textContent = action.label;

      const shortcut = document.createElement('span');
      shortcut.className = 'item-shortcut';
      shortcut.textContent = action.shortcut;

      item.appendChild(icon);
      item.appendChild(label);
      item.appendChild(shortcut);

      item.addEventListener('click', () => {
        action.handler();
        this.callbacks.onHideDropdown();
      });
      dropdown.appendChild(item);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onToggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => this.callbacks.onHideDropdown());

    container.appendChild(trigger);
    container.appendChild(dropdown);
    this.elements.set('more-dropdown', dropdown);

    return container;
  }
}
