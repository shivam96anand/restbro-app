/**
 * Manages toolbar state and updates
 */

import { ViewerTab, VIEWER_CONSTANTS } from './types';
import { ViewerStateManager } from './viewerState';

export class ToolbarStateManager {
  private stateManager: ViewerStateManager;
  private elements: Map<string, HTMLElement> = new Map();

  constructor(stateManager: ViewerStateManager) {
    this.stateManager = stateManager;
  }

  public registerElement(id: string, element: HTMLElement): void {
    this.elements.set(id, element);
  }

  public getElement(id: string): HTMLElement | undefined {
    return this.elements.get(id);
  }

  public setActiveTab(tab: ViewerTab, container: HTMLElement): void {
    // Update state
    this.stateManager.setActiveTab(tab);

    // Update UI
    const tabs = container.querySelectorAll('.toolbar-tab');
    tabs.forEach((tabElement) => {
      const tabButton = tabElement as HTMLElement;
      const isActive = tabButton.dataset.tab === tab;
      tabButton.classList.toggle('active', isActive);
    });

    // Update button states based on active tab
    this.updateButtonStates(tab);
  }

  public updateButtonStates(activeTab: ViewerTab): void {
    const formatEnabled = activeTab === 'raw';
    const expandEnabled = activeTab === 'pretty';

    const formatBtn = this.elements.get('format') as HTMLButtonElement;
    const minifyBtn = this.elements.get('minify') as HTMLButtonElement;
    const expandBtn = this.elements.get('expand') as HTMLButtonElement;
    const collapseBtn = this.elements.get('collapse') as HTMLButtonElement;

    if (formatBtn) formatBtn.disabled = !formatEnabled;
    if (minifyBtn) minifyBtn.disabled = !formatEnabled;
    if (expandBtn) expandBtn.disabled = !expandEnabled;
    if (collapseBtn) collapseBtn.disabled = !expandEnabled;
  }

  public updateFontSizeDisplay(size: number): void {
    const display = this.elements.get('font-size-display');
    if (display) {
      display.textContent = `${size}px`;
    }
  }

  public updateToggleState(toggleId: string, active: boolean): void {
    const toggle = this.elements.get(`toggle-${toggleId}`);
    if (toggle) {
      toggle.classList.toggle('active', active);
    }
  }

  public toggleDropdown(): void {
    const dropdown = this.elements.get('more-dropdown');
    if (dropdown) {
      const isVisible = dropdown.style.display !== 'none';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  }

  public hideDropdown(): void {
    const dropdown = this.elements.get('more-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  public changeFontSize(
    delta: number,
    onFontSizeChange?: (size: number) => void
  ): void {
    const currentSize = this.stateManager.getFontSize();
    const newSize = Math.max(
      VIEWER_CONSTANTS.MIN_FONT_SIZE,
      Math.min(VIEWER_CONSTANTS.MAX_FONT_SIZE, currentSize + delta)
    );

    if (newSize !== currentSize) {
      this.stateManager.setFontSize(newSize);
      this.updateFontSizeDisplay(newSize);
      onFontSizeChange?.(newSize);
    }
  }

  public setFormatEnabled(enabled: boolean): void {
    const formatBtn = this.elements.get('format') as HTMLButtonElement;
    const minifyBtn = this.elements.get('minify') as HTMLButtonElement;

    if (formatBtn) formatBtn.disabled = !enabled;
    if (minifyBtn) minifyBtn.disabled = !enabled;
  }
}
