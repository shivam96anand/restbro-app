/**
 * Node rendering utilities for JSON tree
 */

import { JsonNode, SearchMatch, VIEWER_CONSTANTS } from './types';
import { ViewerStateManager } from './viewerState';
import { JsonNodeRenderer } from './JsonNode';
import { VirtualScroller } from './VirtualScroller';
import { JsonTreeSearch } from './JsonTreeSearch';

export interface RenderOptions {
  stateManager: ViewerStateManager;
  virtualScroller: VirtualScroller;
  nodeRenderer: JsonNodeRenderer;
  search: JsonTreeSearch;
}

export class JsonTreeRenderer {
  private stateManager: ViewerStateManager;
  private virtualScroller: VirtualScroller;
  private nodeRenderer: JsonNodeRenderer;
  private search: JsonTreeSearch;

  constructor(options: RenderOptions) {
    this.stateManager = options.stateManager;
    this.virtualScroller = options.virtualScroller;
    this.nodeRenderer = options.nodeRenderer;
    this.search = options.search;
  }

  public renderVisibleNodes(items: JsonNode[], startIndex: number): void {
    const viewport = this.virtualScroller.getViewport();
    const content = viewport.querySelector('.json-tree-content') as HTMLElement;
    if (!content) return;

    const container = document.createElement('div');
    container.className = 'visible-nodes-container';

    items.forEach((node, index) => {
      const element = this.nodeRenderer.render(node, {
        searchMatches: this.search.getNodeSearchMatches(node.id),
        isSelected: this.stateManager.getState().prettyView.selectedNode === node.id,
        showTypes: this.stateManager.getState().prettyView.showTypes,
      });

      element.style.position = 'relative';
      element.style.height = `${this.virtualScroller.itemHeight}px`;
      element.dataset.nodeIndex = (startIndex + index).toString();

      container.appendChild(element);
    });

    // Replace content
    const existingContainer = content.querySelector('.visible-nodes-container');
    if (existingContainer) {
      content.replaceChild(container, existingContainer);
    } else {
      content.appendChild(container);
    }
  }

  public renderAllNodes(visibleNodes: JsonNode[]): void {
    const viewport = this.virtualScroller.getViewport();
    const content = viewport.querySelector('.json-tree-content') as HTMLElement;
    if (!content) return;

    content.innerHTML = '';
    content.style.height = 'auto';

    const container = document.createElement('div');
    container.className = 'all-nodes-container';

    visibleNodes.forEach((node, index) => {
      const element = this.nodeRenderer.render(node, {
        searchMatches: this.search.getNodeSearchMatches(node.id),
        isSelected: this.stateManager.getState().prettyView.selectedNode === node.id,
        showTypes: this.stateManager.getState().prettyView.showTypes,
      });

      element.dataset.nodeIndex = index.toString();
      container.appendChild(element);
    });

    content.appendChild(container);
  }

  public scrollToNode(nodeId: string): void {
    const viewport = this.virtualScroller.getViewport();
    const nodeElement = viewport.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;

    if (nodeElement) {
      nodeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
}
