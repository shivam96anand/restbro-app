/**
 * Toolbar component with all viewer controls and keyboard shortcuts
 */

import { ViewerTab } from './types';
import { ViewerStateManager } from './viewerState';
import { ToolbarUI, ToolbarUICallbacks } from './ToolbarUI';
import {
  ToolbarKeyboardHandler,
  KeyboardShortcutCallbacks,
} from './ToolbarKeyboardHandler';
import { ToolbarStyles } from './ToolbarStyles';
import { ToolbarStateManager } from './ToolbarStateManager';
import { ToolbarBuilder } from './ToolbarBuilder';

export interface ToolbarOptions {
  container: HTMLElement;
  stateManager: ViewerStateManager;
  onTabChange?: (tab: ViewerTab) => void;
  onFormat?: () => void;
  onMinify?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onToggleWrap?: () => void;
  onToggleTypes?: () => void;
  onSearch?: () => void;
  onFullscreen?: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onFontSizeChange?: (size: number) => void;
  onScrollTop?: () => void;
  onScrollBottom?: () => void;
  onAskAI?: () => void;
}

export interface ToolbarHandle {
  setActiveTab: (tab: ViewerTab) => void;
  updateSearchResults: (current: number, total: number) => void;
  setFormatEnabled: (enabled: boolean) => void;
  destroy: () => void;
}

export class Toolbar implements ToolbarHandle {
  private container: HTMLElement;
  private stateManager: ViewerStateManager;
  private options: ToolbarOptions;
  private toolbarUI: ToolbarUI;
  private keyboardHandler: ToolbarKeyboardHandler;
  private toolbarStateManager: ToolbarStateManager;
  private toolbarBuilder: ToolbarBuilder;

  constructor(options: ToolbarOptions) {
    this.options = options;
    this.container = options.container;
    this.stateManager = options.stateManager;

    // Initialize state manager
    this.toolbarStateManager = new ToolbarStateManager(this.stateManager);

    // Initialize builder
    this.toolbarBuilder = new ToolbarBuilder(
      this.toolbarStateManager,
      this.options
    );

    // Setup UI callbacks
    const uiCallbacks: ToolbarUICallbacks = this.createUICallbacks();

    // Setup keyboard callbacks
    const keyboardCallbacks: KeyboardShortcutCallbacks =
      this.createKeyboardCallbacks();

    // Initialize modules
    this.toolbarUI = new ToolbarUI(uiCallbacks);
    this.keyboardHandler = new ToolbarKeyboardHandler(keyboardCallbacks);

    // Render
    this.render();
  }

  private createUICallbacks(): ToolbarUICallbacks {
    return {
      onTabChange: (tab) => {
        this.setActiveTab(tab);
        this.options.onTabChange?.(tab);
      },
      onFormat: () => this.options.onFormat?.(),
      onMinify: () => this.options.onMinify?.(),
      onExpandAll: () => this.options.onExpandAll?.(),
      onCollapseAll: () => this.options.onCollapseAll?.(),
      onSearch: () => this.options.onSearch?.(),
      onScrollTop: () => this.options.onScrollTop?.(),
      onScrollBottom: () => this.options.onScrollBottom?.(),
      onToggleWrap: () => this.options.onToggleWrap?.(),
      onToggleTypes: () => this.options.onToggleTypes?.(),
      onFullscreen: () => this.options.onFullscreen?.(),
      onCopy: () => this.options.onCopy?.(),
      onExport: () => this.options.onExport?.(),
      onAskAI: () => this.options.onAskAI?.(),
      onFontSizeChange: (delta) =>
        this.toolbarStateManager.changeFontSize(
          delta,
          this.options.onFontSizeChange
        ),
      onToggleDropdown: () => this.toolbarStateManager.toggleDropdown(),
      onHideDropdown: () => this.toolbarStateManager.hideDropdown(),
    };
  }

  private createKeyboardCallbacks(): KeyboardShortcutCallbacks {
    return {
      onSearch: () => this.options.onSearch?.(),
      onFormat: () => this.options.onFormat?.(),
      onMinify: () => this.options.onMinify?.(),
      onToggleWrap: () => this.options.onToggleWrap?.(),
      onExpandAll: () => this.options.onExpandAll?.(),
      onCollapseAll: () => this.options.onCollapseAll?.(),
      onFontSizeIncrease: () =>
        this.toolbarStateManager.changeFontSize(
          1,
          this.options.onFontSizeChange
        ),
      onFontSizeDecrease: () =>
        this.toolbarStateManager.changeFontSize(
          -1,
          this.options.onFontSizeChange
        ),
      onScrollTop: () => this.options.onScrollTop?.(),
      onScrollBottom: () => this.options.onScrollBottom?.(),
      onFullscreen: () => this.options.onFullscreen?.(),
    };
  }

  private render(): void {
    this.toolbarUI.render(this.container);
    ToolbarStyles.applyStyles();

    // Set initial font size display
    const currentSize = this.stateManager.getFontSize();
    this.toolbarStateManager.updateFontSizeDisplay(currentSize);
  }

  // Public API
  public setActiveTab(tab: ViewerTab): void {
    this.toolbarStateManager.setActiveTab(tab, this.container);
  }

  public updateSearchResults(current: number, total: number): void {
    // This could be used to update a search results indicator
    // For now, we'll just store it in case we want to display it
  }

  public setFormatEnabled(enabled: boolean): void {
    this.toolbarStateManager.setFormatEnabled(enabled);
  }

  public destroy(): void {
    this.keyboardHandler.destroy();
    this.toolbarStateManager.hideDropdown();
  }
}
