export class ResizeManager {
  private isResizing = false;
  private currentHandle: HTMLElement | null = null;
  private startX = 0;
  private startWidth = 0;

  initialize(): void {
    this.setupResizeHandles();
    window.addEventListener('resize', () => this.rebalanceLayoutWidths());
  }

  private setupResizeHandles(): void {
    const handles = document.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        this.startResize(e as MouseEvent, handle as HTMLElement);
      });
    });

    document.addEventListener('mousemove', (e) => {
      this.doResize(e);
    });

    document.addEventListener('mouseup', () => {
      this.stopResize();
    });
  }

  private startResize(e: MouseEvent, handle: HTMLElement): void {
    e.preventDefault();
    this.isResizing = true;
    this.currentHandle = handle;
    this.startX = e.clientX;

    const panel = handle.closest('.collections-panel, .request-panel, .json-input-panel') as HTMLElement;
    if (panel) {
      this.startWidth = panel.offsetWidth;
    }

    handle.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private doResize(e: MouseEvent): void {
    if (!this.isResizing || !this.currentHandle) return;

    const deltaX = e.clientX - this.startX;
    const newWidth = this.startWidth + deltaX;

    const panel = this.currentHandle.closest('.collections-panel, .request-panel, .json-input-panel') as HTMLElement;
    if (!panel) return;

    const panelType = this.currentHandle.dataset.panel;

    if (panelType === 'collections') {
      const minWidth = this.getMinWidth(panel, 200);
      const cssMaxWidth = this.getMaxWidth(panel, 400);
      const layout = panel.closest('.api-layout') as HTMLElement | null;
      const requestPanel = layout?.querySelector('.request-panel') as HTMLElement | null;
      const responsePanel = layout?.querySelector('.response-panel') as HTMLElement | null;
      const requestMinWidth = this.getMinWidth(requestPanel, 300);
      const responseMinWidth = this.getMinWidth(responsePanel, 300);
      const dynamicMaxWidth = layout
        ? layout.clientWidth - requestMinWidth - responseMinWidth
        : cssMaxWidth;
      const maxWidth = Math.min(cssMaxWidth, dynamicMaxWidth);
      const clampedWidth = this.clamp(newWidth, minWidth, Math.max(minWidth, maxWidth));
      panel.style.width = clampedWidth + 'px';
      panel.style.flex = 'none';
    } else if (panelType === 'request') {
      const minWidth = this.getMinWidth(panel, 300);
      const layout = panel.closest('.api-layout') as HTMLElement | null;
      const collectionsPanel = layout?.querySelector('.collections-panel') as HTMLElement | null;
      const responsePanel = layout?.querySelector('.response-panel') as HTMLElement | null;
      const collectionsWidth = collectionsPanel?.offsetWidth ?? 200;
      const responseMinWidth = this.getMinWidth(responsePanel, 300);
      const maxWidth = layout
        ? layout.clientWidth - collectionsWidth - responseMinWidth
        : window.innerWidth - 200 - 300;
      const clampedWidth = this.clamp(newWidth, minWidth, Math.max(minWidth, maxWidth));
      panel.style.width = clampedWidth + 'px';
      panel.style.flex = 'none'; // Override flex when manually resized
    } else if (panelType === 'json-input') {
      const minWidth = this.getMinWidth(panel, 250);
      const layout = panel.parentElement as HTMLElement | null;
      const viewerPanel = panel.parentElement?.querySelector('.json-viewer-panel') as HTMLElement | null;
      const viewerMinWidth = this.getMinWidth(viewerPanel, 300);
      const maxWidth = layout
        ? layout.clientWidth - viewerMinWidth
        : window.innerWidth - 300;
      const clampedWidth = this.clamp(newWidth, minWidth, Math.max(minWidth, maxWidth));
      panel.style.width = clampedWidth + 'px';
      panel.style.flex = 'none'; // Override flex when manually resized

      // Update the viewer panel to take remaining space
      if (viewerPanel) {
        viewerPanel.style.width = `calc(100% - ${clampedWidth}px)`;
        viewerPanel.style.flex = 'none';
      }
    }
  }

  private stopResize(): void {
    if (!this.isResizing) return;

    this.isResizing = false;

    if (this.currentHandle) {
      this.currentHandle.classList.remove('resizing');
      this.currentHandle = null;
    }

    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Trigger a final relayout for editors/viewers after drag ends.
    window.dispatchEvent(new Event('resize'));
  }

  private rebalanceLayoutWidths(): void {
    const layout = document.querySelector('.api-layout') as HTMLElement | null;
    if (!layout) return;

    const collectionsPanel = layout.querySelector('.collections-panel') as HTMLElement | null;
    const requestPanel = layout.querySelector('.request-panel') as HTMLElement | null;
    const responsePanel = layout.querySelector('.response-panel') as HTMLElement | null;
    if (!collectionsPanel || !requestPanel || !responsePanel) return;

    const layoutWidth = layout.clientWidth;
    const collectionsMinWidth = this.getMinWidth(collectionsPanel, 200);
    const collectionsMaxWidth = this.getMaxWidth(collectionsPanel, 500);
    const requestMinWidth = this.getMinWidth(requestPanel, 300);
    const responseMinWidth = this.getMinWidth(responsePanel, 300);

    const maxCollectionsByLayout = layoutWidth - requestMinWidth - responseMinWidth;
    const collectionsMax = Math.max(
      collectionsMinWidth,
      Math.min(collectionsMaxWidth, maxCollectionsByLayout)
    );
    if (collectionsPanel.offsetWidth > collectionsMax) {
      collectionsPanel.style.width = `${collectionsMax}px`;
      collectionsPanel.style.flex = 'none';
    }

    const requestMax = Math.max(
      requestMinWidth,
      layoutWidth - collectionsPanel.offsetWidth - responseMinWidth
    );
    if (requestPanel.offsetWidth > requestMax) {
      requestPanel.style.width = `${requestMax}px`;
      requestPanel.style.flex = 'none';
    }
  }

  private getMinWidth(element: HTMLElement | null, fallback: number): number {
    if (!element) return fallback;
    const value = parseFloat(getComputedStyle(element).minWidth);
    return Number.isFinite(value) ? value : fallback;
  }

  private getMaxWidth(element: HTMLElement | null, fallback: number): number {
    if (!element) return fallback;
    const rawMaxWidth = getComputedStyle(element).maxWidth;
    if (rawMaxWidth === 'none') {
      return Number.POSITIVE_INFINITY;
    }
    const value = parseFloat(rawMaxWidth);
    return Number.isFinite(value) ? value : fallback;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export const resizeManager = new ResizeManager();
