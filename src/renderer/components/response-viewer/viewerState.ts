/**
 * Request-scoped state management for the JSON viewer
 * Handles persistence to localStorage with automatic restoration
 */

import { ViewerState, ViewerTab, VIEWER_CONSTANTS } from './types';
import { ViewerStateStorage } from './ViewerStateStorage';
import { ViewerGlobalSettings, GlobalSettings } from './ViewerGlobalSettings';

export class ViewerStateManager {
  private state: ViewerState;
  private requestId: string;
  private storageKey: string;
  private saveTimeout: number | null = null;

  constructor(requestId: string) {
    this.requestId = requestId;
    this.storageKey = ViewerStateStorage.getStorageKey(requestId);
    this.state = this.loadState();
  }

  /**
   * Load state from localStorage or create default state
   */
  private loadState(): ViewerState {
    const stored = ViewerStateStorage.loadState(this.storageKey);
    const globalSettings = ViewerGlobalSettings.getSettings();

    if (stored) {
      // Apply global settings if they've changed
      stored.rawEditor.fontSize = globalSettings.fontSize;
      stored.prettyView.fontSize = globalSettings.fontSize;
      stored.rawEditor.theme = globalSettings.theme;
      stored.rawEditor.wrapText = globalSettings.wrapText;
      stored.prettyView.showTypes = globalSettings.showTypes;
      return stored;
    }

    return this.createDefaultState();
  }

  /**
   * Create default state with global settings applied
   */
  private createDefaultState(): ViewerState {
    const globalSettings = ViewerGlobalSettings.getSettings();

    return {
      requestId: this.requestId,
      activeTab: 'pretty',
      rawEditor: {
        wrapText: globalSettings.wrapText,
        fontSize: globalSettings.fontSize,
        theme: globalSettings.theme,
        scrollPosition: 0,
        cursorPosition: 0,
      },
      prettyView: {
        expandedNodes: new Set<string>(),
        fontSize: globalSettings.fontSize,
        showTypes: globalSettings.showTypes,
        scrollPosition: 0,
      },
      search: {
        query: '',
        isVisible: false,
        currentIndex: -1,
        totalMatches: 0,
      },
    };
  }

  /**
   * Save global settings that apply to all viewers
   */
  public saveGlobalSettings(settings: Partial<GlobalSettings>): void {
    const updated = ViewerGlobalSettings.saveSettings(settings);

    // Apply to current state
    if (settings.fontSize !== undefined) {
      this.state.rawEditor.fontSize = updated.fontSize;
      this.state.prettyView.fontSize = updated.fontSize;
    }
    if (settings.theme !== undefined) {
      this.state.rawEditor.theme = updated.theme;
    }
    if (settings.wrapText !== undefined) {
      this.state.rawEditor.wrapText = updated.wrapText;
    }
    if (settings.showTypes !== undefined) {
      this.state.prettyView.showTypes = updated.showTypes;
    }

    this.scheduleSave();
  }

  /**
   * Get current state
   */
  public getState(): ViewerState {
    return this.state;
  }

  /**
   * Update state and schedule save
   */
  public updateState(updates: Partial<ViewerState>): void {
    this.state = { ...this.state, ...updates };
    this.scheduleSave();
  }

  /**
   * Update active tab
   */
  public setActiveTab(tab: ViewerTab): void {
    this.updateState({ activeTab: tab });
  }

  /**
   * Update raw editor settings
   */
  public updateRawEditor(updates: Partial<ViewerState['rawEditor']>): void {
    this.state.rawEditor = { ...this.state.rawEditor, ...updates };
    this.scheduleSave();
  }

  /**
   * Update pretty view settings
   */
  public updatePrettyView(updates: Partial<ViewerState['prettyView']>): void {
    this.state.prettyView = { ...this.state.prettyView, ...updates };
    this.scheduleSave();
  }

  /**
   * Update search state
   */
  public updateSearch(updates: Partial<ViewerState['search']>): void {
    this.state.search = { ...this.state.search, ...updates };
    this.scheduleSave();
  }

  /**
   * Toggle node expansion
   */
  public toggleNodeExpansion(nodeId: string): boolean {
    const expanded = this.state.prettyView.expandedNodes;
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
      this.scheduleSave();
      return false;
    } else {
      expanded.add(nodeId);
      this.scheduleSave();
      return true;
    }
  }

  /**
   * Expand all nodes (with warning for large datasets)
   */
  public expandAll(nodeIds: string[]): boolean {
    if (nodeIds.length > VIEWER_CONSTANTS.MAX_EXPAND_WARNING) {
      const confirmed = confirm(
        `This will expand ${nodeIds.length} nodes, which may impact performance. Continue?`
      );
      if (!confirmed) return false;
    }

    nodeIds.forEach(id => this.state.prettyView.expandedNodes.add(id));
    this.scheduleSave();
    return true;
  }

  /**
   * Collapse all nodes
   */
  public collapseAll(): void {
    this.state.prettyView.expandedNodes.clear();
    this.scheduleSave();
  }

  /**
   * Check if node is expanded
   */
  public isNodeExpanded(nodeId: string): boolean {
    return this.state.prettyView.expandedNodes.has(nodeId);
  }

  /**
   * Get all expanded node IDs
   */
  public getExpandedNodes(): Set<string> {
    return new Set(this.state.prettyView.expandedNodes);
  }

  /**
   * Schedule a debounced save operation
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveState();
      this.saveTimeout = null;
    }, VIEWER_CONSTANTS.DEBOUNCE_DELAY) as unknown as number;
  }

  /**
   * Immediately save state to localStorage
   */
  public saveState(): void {
    const success = ViewerStateStorage.saveState(this.storageKey, this.state);
    if (!success) {
      // If save failed, try to clean up old states and retry
      ViewerStateStorage.cleanupOldStates(this.storageKey);
    }
  }

  /**
   * Reset state to defaults
   */
  public resetState(): void {
    this.state = this.createDefaultState();
    this.saveState();
  }

  /**
   * Remove state from storage
   */
  public clearState(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    ViewerStateStorage.clearState(this.storageKey);
  }

  /**
   * Check if localStorage is available
   */
  public static isStorageAvailable(): boolean {
    return ViewerStateStorage.isStorageAvailable();
  }

  /**
   * Export state for debugging
   */
  public exportState(): string {
    return JSON.stringify({
      ...this.state,
      prettyView: {
        ...this.state.prettyView,
        expandedNodes: Array.from(this.state.prettyView.expandedNodes),
      },
    }, null, 2);
  }

  /**
   * Get current theme
   */
  public getTheme(): 'light' | 'dark' {
    return this.state.rawEditor.theme;
  }

  /**
   * Get current font size
   */
  public getFontSize(): number {
    return this.state.rawEditor.fontSize;
  }

  /**
   * Update font size for both raw and pretty views
   */
  public setFontSize(size: number): void {
    const clampedSize = Math.max(
      VIEWER_CONSTANTS.MIN_FONT_SIZE,
      Math.min(VIEWER_CONSTANTS.MAX_FONT_SIZE, size)
    );

    this.updateRawEditor({ fontSize: clampedSize });
    this.updatePrettyView({ fontSize: clampedSize });
    this.saveGlobalSettings({ fontSize: clampedSize });
  }

  /**
   * Toggle text wrapping
   */
  public toggleTextWrap(): boolean {
    const newWrap = !this.state.rawEditor.wrapText;
    this.updateRawEditor({ wrapText: newWrap });
    this.saveGlobalSettings({ wrapText: newWrap });
    return newWrap;
  }

  /**
   * Toggle type badges visibility
   */
  public toggleTypesBadges(): boolean {
    const newShow = !this.state.prettyView.showTypes;
    this.updatePrettyView({ showTypes: newShow });
    this.saveGlobalSettings({ showTypes: newShow });
    return newShow;
  }
}