type LayoutMode = 'horizontal' | 'vertical';

const ICON_HORIZONTAL = `<rect x="1" y="2" width="8" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="8" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
const ICON_VERTICAL = `<rect x="2" y="1" width="16" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="16" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>`;

export class LayoutToggleManager {
  private mode: LayoutMode = 'horizontal';
  private btn: HTMLElement | null = null;
  private workspaceArea: HTMLElement | null = null;

  initialize(layoutMode?: LayoutMode): void {
    this.mode = layoutMode || 'horizontal';
    this.btn = document.getElementById('layout-toggle-btn');
    this.workspaceArea = document.querySelector('.workspace-area');

    this.applyLayout();
    this.btn?.addEventListener('click', () => this.toggle());
  }

  private toggle(): void {
    this.mode = this.mode === 'horizontal' ? 'vertical' : 'horizontal';
    this.applyLayout();
    this.persist();
  }

  private applyLayout(): void {
    if (!this.workspaceArea) return;

    // Reset inline styles from resize so panels reflow naturally
    const requestPanel = this.workspaceArea.querySelector(
      '.request-panel'
    ) as HTMLElement | null;
    if (requestPanel) {
      requestPanel.style.width = '';
      requestPanel.style.height = '';
      requestPanel.style.flex = '';
    }

    if (this.mode === 'vertical') {
      this.workspaceArea.classList.add('layout-vertical');
    } else {
      this.workspaceArea.classList.remove('layout-vertical');
    }

    this.updateIcon();
    this.updateTooltip();
  }

  private updateIcon(): void {
    const svg = this.btn?.querySelector('svg');
    if (!svg) return;
    // Show the icon for the CURRENT layout (so user sees what they have)
    svg.innerHTML =
      this.mode === 'horizontal' ? ICON_HORIZONTAL : ICON_VERTICAL;
  }

  private updateTooltip(): void {
    if (!this.btn) return;
    const next = this.mode === 'horizontal' ? 'stacked' : 'side-by-side';
    this.btn.title = `Switch to ${next} layout`;
  }

  private async persist(): Promise<void> {
    await window.restbro.store.set({ layoutMode: this.mode });
  }

  public getMode(): LayoutMode {
    return this.mode;
  }
}
