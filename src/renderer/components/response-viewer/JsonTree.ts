/**
 * Virtualized JSON tree for Pretty view with high performance
 */

import { JsonNode, SearchMatch, VIEWER_CONSTANTS, VIEWER_CLASSES } from './types';
import { ViewerStateManager } from './viewerState';
import { JsonUtils } from './utils/json';
import { JsonNodeRenderer } from './JsonNode';
import { VirtualScroller } from './VirtualScroller';
import { JsonTreeSearch } from './JsonTreeSearch';
import { JsonTreeRenderer } from './JsonTreeRenderer';

export interface JsonTreeOptions {
  container: HTMLElement;
  stateManager: ViewerStateManager;
  onNodeToggle?: (nodeId: string, expanded: boolean) => void;
  onNodeSelect?: (nodeId: string) => void;
  onNodeAction?: (nodeId: string, action: string, data?: any) => void;
  onSearchMatches?: (matches: SearchMatch[]) => void;
}

export interface JsonTreeHandle {
  setData: (nodes: JsonNode[]) => void;
  getData: () => JsonNode[];
  expandAll: () => void;
  collapseAll: () => void;
  search: (query: string) => SearchMatch[];
  clearSearch: () => void;
  navigateSearch: (direction: 1 | -1) => void;
  goToNode: (nodeId: string) => void;
  refresh: () => void;
  setFontSize: (size: number) => void;
  destroy: () => void;
}

export class JsonTree implements JsonTreeHandle {
  private container: HTMLElement;
  private stateManager: ViewerStateManager;
  private options: JsonTreeOptions;
  private nodes: JsonNode[] = [];
  private visibleNodes: JsonNode[] = [];
  private virtualScroller: VirtualScroller;
  private nodeRenderer: JsonNodeRenderer;
  private search: JsonTreeSearch;
  private renderer: JsonTreeRenderer;
  private isLargeDataset = false;

  constructor(options: JsonTreeOptions) {
    this.options = options;
    this.container = options.container;
    this.stateManager = options.stateManager;

    this.setupContainer();
    this.virtualScroller = new VirtualScroller(this.container);
    this.nodeRenderer = new JsonNodeRenderer({
      stateManager: this.stateManager,
      onToggle: this.handleNodeToggle.bind(this),
      onSelect: this.handleNodeSelect.bind(this),
      onAction: this.handleNodeAction.bind(this),
    });

    this.search = new JsonTreeSearch({
      stateManager: this.stateManager,
      onSearchMatches: options.onSearchMatches,
    });

    this.renderer = new JsonTreeRenderer({
      stateManager: this.stateManager,
      virtualScroller: this.virtualScroller,
      nodeRenderer: this.nodeRenderer,
      search: this.search,
    });

    this.setupVirtualScroller();
    this.restoreScrollPosition();
  }

  private setupContainer(): void {
    this.container.className = `${VIEWER_CLASSES.prettyTree} json-tree-container`;
    this.container.style.cssText = `
      height: 100%;
      font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: ${this.stateManager.getFontSize()}px;
      line-height: 1.4;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #333);
      overflow: hidden;
    `;
  }

  private setupVirtualScroller(): void {
    this.virtualScroller.setRenderCallback((items, startIndex) => {
      this.renderer.renderVisibleNodes(items, startIndex);
    });

    // Update item height based on font size
    const fontSize = this.stateManager.getFontSize();
    const lineHeight = Math.ceil(fontSize * 1.4);
    this.virtualScroller.setItemHeight(lineHeight);
  }

  private handleNodeToggle(nodeId: string): void {
    const expanded = this.stateManager.toggleNodeExpansion(nodeId);
    this.options.onNodeToggle?.(nodeId, expanded);
    this.updateVisibleNodes();
    this.render();
  }

  private handleNodeSelect(nodeId: string): void {
    this.stateManager.updatePrettyView({ selectedNode: nodeId });
    this.options.onNodeSelect?.(nodeId);
    this.render();
  }

  private handleNodeAction(nodeId: string, action: string, data?: any): void {
    this.options.onNodeAction?.(nodeId, action, data);
  }

  private updateVisibleNodes(): void {
    const expandedNodes = this.stateManager.getExpandedNodes();
    this.visibleNodes = JsonUtils.getVisibleNodes(this.nodes, expandedNodes);
    this.isLargeDataset = this.visibleNodes.length > VIEWER_CONSTANTS.VIRTUALIZATION_THRESHOLD;
    this.search.setNodes(this.nodes, this.visibleNodes);
  }

  private render(): void {
    if (this.isLargeDataset) {
      // Use virtualization for large datasets
      this.virtualScroller.setItems(this.visibleNodes);
    } else {
      // Render all items for small datasets
      this.renderer.renderAllNodes(this.visibleNodes);
    }
  }

  private restoreScrollPosition(): void {
    const state = this.stateManager.getState();
    if (state.prettyView.scrollPosition > 0) {
      setTimeout(() => {
        const viewport = this.virtualScroller.getViewport();
        viewport.scrollTop = state.prettyView.scrollPosition;
      }, 100);
    }
  }

  private saveScrollPosition(): void {
    const viewport = this.virtualScroller.getViewport();
    this.stateManager.updatePrettyView({
      scrollPosition: viewport.scrollTop
    });
  }

  // Public API

  public setData(nodes: JsonNode[]): void {
    this.nodes = nodes;
    this.updateVisibleNodes();
    this.render();
  }

  public getData(): JsonNode[] {
    return this.nodes;
  }

  public expandAll(): void {
    const allNodeIds = this.getAllNodeIds(this.nodes);
    const success = this.stateManager.expandAll(allNodeIds);

    if (success) {
      this.updateVisibleNodes();
      this.render();
    }
  }

  private getAllNodeIds(nodes: JsonNode[]): string[] {
    const ids: string[] = [];

    const traverse = (node: JsonNode) => {
      if (node.hasChildren) {
        ids.push(node.id);
      }
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };

    nodes.forEach(node => traverse(node));
    return ids;
  }

  public collapseAll(): void {
    this.stateManager.collapseAll();
    this.updateVisibleNodes();
    this.render();
  }

  public search(query: string): SearchMatch[] {
    const matches = this.search.search(query);
    this.render();

    const currentMatch = this.search.getCurrentSearchMatch();
    if (currentMatch) {
      this.search.scrollToSearchMatch(
        0,
        this.isLargeDataset,
        this.virtualScroller,
        (nodeId) => this.renderer.scrollToNode(nodeId)
      );
    }

    return matches;
  }

  public clearSearch(): void {
    this.search.clearSearch();
    this.render();
  }

  public navigateSearch(direction: 1 | -1): void {
    const result = this.search.navigateSearch(direction);
    if (result) {
      this.search.scrollToSearchMatch(
        result.matchIndex,
        this.isLargeDataset,
        this.virtualScroller,
        (nodeId) => this.renderer.scrollToNode(nodeId)
      );
    }
    this.render();
  }

  public goToNode(nodeId: string): void {
    const nodeIndex = this.search.findNodeIndex(nodeId);
    if (nodeIndex >= 0) {
      if (this.isLargeDataset) {
        this.virtualScroller.scrollToItem(nodeIndex);
      } else {
        this.renderer.scrollToNode(nodeId);
      }
    }
  }

  public refresh(): void {
    this.updateVisibleNodes();
    this.render();
  }

  public setFontSize(size: number): void {
    this.container.style.fontSize = `${size}px`;

    // Update virtualization item height
    const lineHeight = Math.ceil(size * 1.4);
    this.virtualScroller.setItemHeight(lineHeight);

    this.render();
  }

  public destroy(): void {
    this.virtualScroller.destroy();
    this.nodeRenderer.destroy();
  }
}