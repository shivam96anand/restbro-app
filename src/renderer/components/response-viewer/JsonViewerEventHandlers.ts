/**
 * Event handlers for JsonViewer component
 */

import { ViewerTab } from './types';
import { ViewerStateManager } from './viewerState';
import { RawEditorHandle } from './RawEditor';
import { JsonTreeHandle } from './JsonTree';
import { SearchBarHandle } from './SearchBar';

export class JsonViewerEventHandlers {
  private stateManager: ViewerStateManager;
  private rawEditor: RawEditorHandle | null;
  private jsonTree: JsonTreeHandle | null;
  private searchBar: SearchBarHandle | null;
  private onContentChange?: (content: string) => void;

  constructor(
    stateManager: ViewerStateManager,
    rawEditor: RawEditorHandle | null,
    jsonTree: JsonTreeHandle | null,
    searchBar: SearchBarHandle | null,
    onContentChange?: (content: string) => void
  ) {
    this.stateManager = stateManager;
    this.rawEditor = rawEditor;
    this.jsonTree = jsonTree;
    this.searchBar = searchBar;
    this.onContentChange = onContentChange;
  }

  public handleContentChange(content: string): void {
    this.onContentChange?.(content);
  }

  public handleCursorChange(line: number, column: number): void {
    // Could be used for status display or breadcrumb updates
  }

  public handleNodeToggle(nodeId: string, expanded: boolean): void {
    // Node expansion is handled by the state manager
  }

  public handleNodeSelect(nodeId: string): void {
    // Node selection is handled by the state manager
  }

  public handleNodeAction(
    nodeId: string,
    action: string,
    copyHelpers: {
      copyNodeKey: (nodeId: string) => void;
      copyNodeValue: (nodeId: string) => void;
      copyNodePath: (nodeId: string) => void;
      copyNodeJsonPath: (nodeId: string) => void;
    }
  ): void {
    switch (action) {
      case 'copy-key':
        copyHelpers.copyNodeKey(nodeId);
        break;
      case 'copy-value':
        copyHelpers.copyNodeValue(nodeId);
        break;
      case 'copy-path':
        copyHelpers.copyNodePath(nodeId);
        break;
      case 'copy-jsonpath':
        copyHelpers.copyNodeJsonPath(nodeId);
        break;
    }
  }

  public handleSearchMatches(matches: any[]): void {
    const currentIndex = this.stateManager.getState().search.currentIndex;
    this.searchBar?.updateResults(currentIndex + 1, matches.length);
  }

  public handleSearch(query: string): void {
    const activeTab = this.stateManager.getState().activeTab;

    if (activeTab === 'pretty' && this.jsonTree) {
      this.jsonTree.search(query);
    } else if (activeTab === 'raw' && this.rawEditor) {
      this.rawEditor.find(query);
    }
  }

  public handleSearchNavigate(direction: 1 | -1): void {
    const activeTab = this.stateManager.getState().activeTab;

    if (activeTab === 'pretty' && this.jsonTree) {
      this.jsonTree.navigateSearch(direction);
    } else if (activeTab === 'raw' && this.rawEditor) {
      this.rawEditor.find('', direction);
    }
  }

  public handleSearchClose(): void {
    const activeTab = this.stateManager.getState().activeTab;

    if (activeTab === 'pretty' && this.jsonTree) {
      this.jsonTree.clearSearch();
    }
  }

  public handleResize(): void {
    // Handle container resize events
    // Could be used to update virtualization or layout
  }
}
