/**
 * Virtual scroller for large lists with smooth scrolling
 */

import { JsonNode, VIEWER_CONSTANTS } from './types';

export interface VirtualScrollerOptions {
  container: HTMLElement;
  itemHeight?: number;
  buffer?: number;
}

/**
 * Simple virtualization manager for large lists
 */
export class VirtualScroller {
  private container: HTMLElement;
  private viewport: HTMLElement;
  private items: JsonNode[] = [];
  private visibleItems: JsonNode[] = [];
  public itemHeight: number = VIEWER_CONSTANTS.LINE_HEIGHT;
  private containerHeight = 0;
  private scrollTop = 0;
  private startIndex = 0;
  private endIndex = 0;
  private renderCallback?: (items: JsonNode[], startIndex: number) => void;
  private buffer = 5; // Render extra items for smooth scrolling

  constructor(container: HTMLElement, options?: { itemHeight?: number; buffer?: number }) {
    this.container = container;
    if (options?.itemHeight) this.itemHeight = options.itemHeight;
    if (options?.buffer) this.buffer = options.buffer;

    this.viewport = this.createViewport();
    this.setupEventListeners();
  }

  private createViewport(): HTMLElement {
    const viewport = document.createElement('div');
    viewport.className = 'json-tree-viewport';
    viewport.style.cssText = `
      position: relative;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    `;

    const content = document.createElement('div');
    content.className = 'json-tree-content';
    content.style.cssText = `
      position: relative;
      width: 100%;
    `;

    viewport.appendChild(content);
    this.container.appendChild(viewport);

    return viewport;
  }

  private setupEventListeners(): void {
    this.viewport.addEventListener('scroll', () => {
      this.scrollTop = this.viewport.scrollTop;
      this.updateVisibleRange();
      this.render();
    });

    const resizeObserver = new ResizeObserver(() => {
      this.containerHeight = this.viewport.clientHeight;
      this.updateVisibleRange();
      this.render();
    });

    resizeObserver.observe(this.viewport);
  }

  private updateVisibleRange(): void {
    if (!this.items.length) {
      this.startIndex = 0;
      this.endIndex = 0;
      return;
    }

    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    this.startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
    this.endIndex = Math.min(this.items.length, this.startIndex + visibleCount + this.buffer * 2);

    this.visibleItems = this.items.slice(this.startIndex, this.endIndex);
  }

  private render(): void {
    if (!this.renderCallback) return;

    const content = this.viewport.querySelector('.json-tree-content') as HTMLElement;
    if (!content) return;

    // Set total height for scrollbar with extra padding at the bottom
    const totalHeight = this.items.length * this.itemHeight + 60; // Add 60px bottom padding
    content.style.height = `${totalHeight}px`;

    // Clear current content
    content.innerHTML = '';

    // Render visible items with offset
    const offset = this.startIndex * this.itemHeight;
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: ${offset}px;
      width: 100%;
    `;

    this.renderCallback(this.visibleItems, this.startIndex);
    content.appendChild(container);
  }

  public setItems(items: JsonNode[]): void {
    this.items = items;
    this.updateVisibleRange();
    this.render();
  }

  public setItemHeight(height: number): void {
    this.itemHeight = height;
    this.updateVisibleRange();
    this.render();
  }

  public setRenderCallback(callback: (items: JsonNode[], startIndex: number) => void): void {
    this.renderCallback = callback;
  }

  public scrollToItem(index: number): void {
    if (index < 0 || index >= this.items.length) return;

    const targetScrollTop = index * this.itemHeight;
    this.viewport.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }

  public getViewport(): HTMLElement {
    return this.viewport;
  }

  public destroy(): void {
    this.container.removeChild(this.viewport);
  }
}
