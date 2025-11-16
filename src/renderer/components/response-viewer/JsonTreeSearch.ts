/**
 * Search functionality for JSON tree
 */

import { JsonNode, SearchMatch } from './types';
import { ViewerStateManager } from './viewerState';
import { JsonUtils } from './utils/json';
import { VirtualScroller } from './VirtualScroller';

export interface SearchOptions {
  stateManager: ViewerStateManager;
  onSearchMatches?: (matches: SearchMatch[]) => void;
}

export class JsonTreeSearch {
  private nodes: JsonNode[] = [];
  private visibleNodes: JsonNode[] = [];
  private searchMatches: SearchMatch[] = [];
  private currentSearchIndex = -1;
  private stateManager: ViewerStateManager;
  private onSearchMatches?: (matches: SearchMatch[]) => void;

  constructor(options: SearchOptions) {
    this.stateManager = options.stateManager;
    this.onSearchMatches = options.onSearchMatches;
  }

  public setNodes(nodes: JsonNode[], visibleNodes: JsonNode[]): void {
    this.nodes = nodes;
    this.visibleNodes = visibleNodes;
  }

  public getNodeSearchMatches(nodeId: string): SearchMatch[] {
    return this.searchMatches.filter(match => match.nodeId === nodeId);
  }

  public search(query: string): SearchMatch[] {
    if (!query.trim()) {
      this.clearSearch();
      return [];
    }

    const expandedNodes = this.stateManager.getExpandedNodes();
    this.searchMatches = JsonUtils.searchInNodes(this.nodes, query, expandedNodes);
    this.currentSearchIndex = this.searchMatches.length > 0 ? 0 : -1;

    this.stateManager.updateSearch({
      query,
      totalMatches: this.searchMatches.length,
      currentIndex: this.currentSearchIndex
    });

    this.onSearchMatches?.(this.searchMatches);

    return this.searchMatches;
  }

  public clearSearch(): void {
    this.searchMatches = [];
    this.currentSearchIndex = -1;

    this.stateManager.updateSearch({
      query: '',
      totalMatches: 0,
      currentIndex: -1
    });

    this.onSearchMatches?.([]);
  }

  public navigateSearch(direction: 1 | -1): { nodeId: string; matchIndex: number } | null {
    if (this.searchMatches.length === 0) return null;

    if (direction === 1) {
      this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchMatches.length;
    } else {
      this.currentSearchIndex = this.currentSearchIndex <= 0
        ? this.searchMatches.length - 1
        : this.currentSearchIndex - 1;
    }

    this.stateManager.updateSearch({
      currentIndex: this.currentSearchIndex
    });

    const match = this.searchMatches[this.currentSearchIndex];
    return match ? { nodeId: match.nodeId, matchIndex: this.currentSearchIndex } : null;
  }

  public getCurrentSearchMatch(): SearchMatch | null {
    if (this.currentSearchIndex < 0 || this.currentSearchIndex >= this.searchMatches.length) {
      return null;
    }
    return this.searchMatches[this.currentSearchIndex];
  }

  public findNodeIndex(nodeId: string): number {
    return this.visibleNodes.findIndex(node => node.id === nodeId);
  }

  public scrollToSearchMatch(
    index: number,
    isLargeDataset: boolean,
    virtualScroller: VirtualScroller,
    scrollToNodeFn: (nodeId: string) => void
  ): void {
    if (index < 0 || index >= this.searchMatches.length) return;

    const match = this.searchMatches[index];
    const nodeIndex = this.findNodeIndex(match.nodeId);

    if (nodeIndex >= 0) {
      if (isLargeDataset) {
        virtualScroller.scrollToItem(nodeIndex);
      } else {
        scrollToNodeFn(match.nodeId);
      }
    }
  }
}
