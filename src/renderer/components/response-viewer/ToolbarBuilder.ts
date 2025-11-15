/**
 * Builds toolbar UI elements
 */

import { ViewerTab } from './types';
import { ToolbarStateManager } from './ToolbarStateManager';
import { ToolbarOptions } from './Toolbar';

export interface ActionDefinition {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  handler: () => void;
}

export class ToolbarBuilder {
  private toolbarStateManager: ToolbarStateManager;
  private options: ToolbarOptions;

  constructor(
    toolbarStateManager: ToolbarStateManager,
    options: ToolbarOptions
  ) {
    this.toolbarStateManager = toolbarStateManager;
    this.options = options;
  }

  public createTabButton(tab: {
    id: ViewerTab;
    label: string;
    icon: string;
  }): HTMLElement {
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
      this.toolbarStateManager.setActiveTab(tab.id, this.options.container);
      this.options.onTabChange?.(tab.id);
    });

    return button;
  }

  public createActionButton(action: ActionDefinition): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.dataset.action = action.id;
    button.title = action.shortcut
      ? `${action.label} (${action.shortcut})`
      : action.label;

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

  public createActionsGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'toolbar-actions';

    const actions: ActionDefinition[] = [
      {
        id: 'format',
        label: 'Format',
        icon: '✨',
        shortcut: 'Ctrl+B',
        handler: () => this.options.onFormat?.(),
      },
      {
        id: 'minify',
        label: 'Minify',
        icon: '📦',
        shortcut: 'Ctrl+M',
        handler: () => this.options.onMinify?.(),
      },
      {
        id: 'expand',
        label: 'Expand All',
        icon: '📂',
        shortcut: 'Ctrl+E',
        handler: () => this.options.onExpandAll?.(),
      },
      {
        id: 'collapse',
        label: 'Collapse All',
        icon: '📁',
        shortcut: 'Ctrl+Shift+E',
        handler: () => this.options.onCollapseAll?.(),
      },
      {
        id: 'search',
        label: 'Search',
        icon: '🔍',
        shortcut: 'Ctrl+F',
        handler: () => this.options.onSearch?.(),
      },
      {
        id: 'scroll-top',
        label: 'Top',
        icon: '⬆️',
        shortcut: 'Ctrl+Home',
        handler: () => this.options.onScrollTop?.(),
      },
      {
        id: 'scroll-bottom',
        label: 'Bottom',
        icon: '⬇️',
        shortcut: 'Ctrl+End',
        handler: () => this.options.onScrollBottom?.(),
      },
    ];

    actions.forEach((action) => {
      const button = this.createActionButton(action);
      group.appendChild(button);
      this.toolbarStateManager.registerElement(action.id, button);
    });

    return group;
  }

  public createFontSizeControls(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'font-size-controls';

    const decreaseButton = document.createElement('button');
    decreaseButton.className = 'font-size-btn';
    decreaseButton.textContent = 'A-';
    decreaseButton.title = 'Decrease font size';
    decreaseButton.addEventListener('click', () =>
      this.toolbarStateManager.changeFontSize(-1, this.options.onFontSizeChange)
    );

    const sizeDisplay = document.createElement('span');
    sizeDisplay.className = 'font-size-display';
    sizeDisplay.textContent = `${this.options.stateManager.getFontSize()}px`;
    this.toolbarStateManager.registerElement('font-size-display', sizeDisplay);

    const increaseButton = document.createElement('button');
    increaseButton.className = 'font-size-btn';
    increaseButton.textContent = 'A+';
    increaseButton.title = 'Increase font size';
    increaseButton.addEventListener('click', () =>
      this.toolbarStateManager.changeFontSize(1, this.options.onFontSizeChange)
    );

    container.appendChild(decreaseButton);
    container.appendChild(sizeDisplay);
    container.appendChild(increaseButton);

    return container;
  }

  public createToggleButton(
    id: string,
    icon: string,
    title: string,
    active: boolean,
    handler: () => void
  ): HTMLElement {
    const button = document.createElement('button');
    button.className = `toolbar-toggle ${active ? 'active' : ''}`;
    button.dataset.toggle = id;
    button.title = title;
    button.textContent = icon;
    button.addEventListener('click', handler);

    this.toolbarStateManager.registerElement(`toggle-${id}`, button);
    return button;
  }

  public createToggleControls(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'toggle-controls';

    // Word wrap toggle
    const wrapToggle = this.createToggleButton(
      'wrap',
      '🔄',
      'Toggle word wrap (Ctrl+W)',
      this.options.stateManager.getState().rawEditor.wrapText,
      () => {
        this.options.onToggleWrap?.();
        this.toolbarStateManager.updateToggleState(
          'wrap',
          this.options.stateManager.getState().rawEditor.wrapText
        );
      }
    );

    // Type badges toggle
    const typesToggle = this.createToggleButton(
      'types',
      '🏷️',
      'Toggle type badges',
      this.options.stateManager.getState().prettyView.showTypes,
      () => {
        this.options.onToggleTypes?.();
        this.toolbarStateManager.updateToggleState(
          'types',
          this.options.stateManager.getState().prettyView.showTypes
        );
      }
    );

    container.appendChild(wrapToggle);
    container.appendChild(typesToggle);

    return container;
  }

  public createMoreActionsDropdown(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'more-actions';

    const trigger = document.createElement('button');
    trigger.className = 'toolbar-button more-trigger';
    trigger.textContent = '⋯';
    trigger.title = 'More actions';

    const dropdown = document.createElement('div');
    dropdown.className = 'more-dropdown';
    dropdown.style.display = 'none';

    const actions: ActionDefinition[] = [
      {
        id: 'copy',
        label: 'Copy JSON',
        icon: '📋',
        handler: () => this.options.onCopy?.(),
      },
      {
        id: 'export',
        label: 'Export...',
        icon: '💾',
        handler: () => this.options.onExport?.(),
      },
      {
        id: 'fullscreen',
        label: 'Fullscreen',
        icon: '🔍',
        handler: () => this.options.onFullscreen?.(),
      },
      {
        id: 'ask-ai',
        label: 'Ask AI',
        icon: '🤖',
        handler: () => this.options.onAskAI?.(),
      },
    ];

    actions.forEach((action) => {
      const item = document.createElement('button');
      item.className = 'dropdown-item';
      item.innerHTML = `<span class="item-icon">${action.icon}</span><span class="item-label">${action.label}</span>`;
      item.addEventListener('click', () => {
        action.handler();
        this.toolbarStateManager.hideDropdown();
      });
      dropdown.appendChild(item);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toolbarStateManager.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () =>
      this.toolbarStateManager.hideDropdown()
    );

    container.appendChild(trigger);
    container.appendChild(dropdown);
    this.toolbarStateManager.registerElement('more-dropdown', dropdown);

    return container;
  }

  public createSettingsGroup(): HTMLElement {
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
}
