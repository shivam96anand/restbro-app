/**
 * Main JsonViewer component with public API
 * This replaces the existing JsonViewer.ts with a modern, performant implementation
 */

import {
  JsonViewerHandle,
  JsonViewerOptions,
  ViewerTab,
  VIEWER_CONSTANTS,
} from './types';
import { ViewerStateManager } from './viewerState';
import { RawEditor, RawEditorHandle } from './RawEditor';
import { JsonTree, JsonTreeHandle } from './JsonTree';
import { Toolbar, ToolbarHandle } from './Toolbar';
import { SearchBar, SearchBarHandle } from './SearchBar';
import { FullscreenViewer, FullscreenViewerHandle } from './FullscreenViewer';
import { JsonUtils } from './utils/json';
import { JsonViewerEventHandlers } from './JsonViewerEventHandlers';
import { JsonViewerContentManager } from './JsonViewerContentManager';
import { JsonViewerLayout } from './JsonViewerLayout';

export class JsonViewer implements JsonViewerHandle {
  private container: HTMLElement;
  private stateManager: ViewerStateManager;
  private options: JsonViewerOptions;
  private rawEditor: RawEditorHandle | null = null;
  private jsonTree: JsonTreeHandle | null = null;
  private toolbar: ToolbarHandle | null = null;
  private searchBar: SearchBarHandle | null = null;
  private fullscreenViewer: FullscreenViewerHandle | null = null;
  private eventHandlers: JsonViewerEventHandlers | null = null;
  private contentManager: JsonViewerContentManager | null = null;
  private layout: JsonViewerLayout | null = null;
  private currentContent = '';
  private parsedData: any = null;
  private isInitialized = false;

  constructor(containerId: string, options: Partial<JsonViewerOptions> = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.container = container;
    this.options = {
      requestId: 'default',
      theme: 'light',
      fontSize: VIEWER_CONSTANTS.DEFAULT_FONT_SIZE,
      showLineNumbers: false,
      enableVirtualization: true,
      maxFileSize: VIEWER_CONSTANTS.MAX_FILE_SIZE,
      ...options,
    };

    this.stateManager = new ViewerStateManager(this.options.requestId);
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    this.layout = new JsonViewerLayout(this.container, this.options.requestId);
    this.layout.setupContainer();
    const containers = this.layout.createLayout();

    this.initializeComponents(containers);
    this.setupEventListeners();
    this.applyInitialContent();
    this.layout.applyStyles();

    this.isInitialized = true;
  }

  private initializeComponents(containers: {
    toolbarContainer: HTMLElement;
    prettyContainer: HTMLElement;
    rawContainer: HTMLElement;
    searchContainer: HTMLElement;
  }): void {
    // Initialize toolbar
    this.toolbar = new Toolbar({
      container: containers.toolbarContainer,
      stateManager: this.stateManager,
      onTabChange: (tab) => this.handleTabChange(tab),
      onFormat: () => this.format(),
      onMinify: () => this.minifyContent(),
      onExpandAll: () => this.expandAll(),
      onCollapseAll: () => this.collapseAll(),
      onToggleWrap: () => this.toggleWrap(),
      onToggleTypes: () => this.toggleTypes(),
      onSearch: () => this.showSearch(),
      onFullscreen: () => this.openFullscreen(),
      onCopy: () => this.copyContent(),
      onExport: () => this.exportData(),
      onFontSizeChange: (size) => this.setFontSize(size),
    });

    // Initialize raw editor
    this.rawEditor = new RawEditor({
      container: containers.rawContainer,
      stateManager: this.stateManager,
      onChange: (content) => this.handleContentChange(content),
      onCursorChange: (line, column) =>
        this.eventHandlers?.handleCursorChange(line, column),
    });

    // Initialize JSON tree
    this.jsonTree = new JsonTree({
      container: containers.prettyContainer,
      stateManager: this.stateManager,
      onNodeToggle: (nodeId, expanded) =>
        this.eventHandlers?.handleNodeToggle(nodeId, expanded),
      onNodeSelect: (nodeId) => this.eventHandlers?.handleNodeSelect(nodeId),
      onNodeAction: (nodeId, action, data) =>
        this.handleNodeAction(nodeId, action, data),
      onSearchMatches: (matches) =>
        this.eventHandlers?.handleSearchMatches(matches),
    });

    // Initialize search bar
    this.searchBar = new SearchBar({
      container: containers.searchContainer,
      stateManager: this.stateManager,
      onSearch: (query) => this.eventHandlers?.handleSearch(query),
      onNavigate: (direction) =>
        this.eventHandlers?.handleSearchNavigate(direction),
      onClose: () => this.eventHandlers?.handleSearchClose(),
      supportJsonPath: true,
    });

    // Initialize helpers
    this.eventHandlers = new JsonViewerEventHandlers(
      this.stateManager,
      this.rawEditor,
      this.jsonTree,
      this.searchBar,
      (content) => this.handleContentChange(content)
    );

    this.contentManager = new JsonViewerContentManager(
      this.jsonTree,
      this.toolbar,
      this.container
    );

    // Set initial tab
    const initialTab =
      this.options.initialTab || this.stateManager.getState().activeTab;
    this.setActiveTab(initialTab);
  }

  private setupEventListeners(): void {
    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      this.eventHandlers?.handleResize();
    });
    resizeObserver.observe(this.container);

    // Handle window beforeunload for cleanup
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private applyInitialContent(): void {
    if (this.options.initialContent) {
      this.setContent(this.options.initialContent);
    }
  }

  // Event handlers
  private handleTabChange(tab: ViewerTab): void {
    this.setActiveTab(tab);
  }

  private async handleContentChange(content: string): Promise<void> {
    this.currentContent = content;
    await this.updatePrettyView();
  }

  private handleNodeAction(nodeId: string, action: string, data?: any): void {
    this.eventHandlers?.handleNodeAction(nodeId, action, {
      copyNodeKey: (id) => this.copyNodeKey(id),
      copyNodeValue: (id) => this.copyNodeValue(id),
      copyNodePath: (id) => this.copyNodePath(id),
      copyNodeJsonPath: (id) => this.copyNodeJsonPath(id),
    });
  }

  // Content management
  private async updatePrettyView(): Promise<void> {
    if (!this.contentManager) return;

    const result = await this.contentManager.updatePrettyView(
      this.currentContent
    );
    if (result.success && result.data !== undefined) {
      this.parsedData = result.data;
    } else {
      this.parsedData = null;
    }
  }

  private setActiveTab(tab: ViewerTab): void {
    this.stateManager.setActiveTab(tab);
    this.toolbar?.setActiveTab(tab);
    this.layout?.setActiveTab(tab);
  }

  // Node action helpers
  private copyNodeKey(nodeId: string): void {
    console.log('Copy key for node:', nodeId);
  }

  private copyNodeValue(nodeId: string): void {
    console.log('Copy value for node:', nodeId);
  }

  private copyNodePath(nodeId: string): void {
    console.log('Copy path for node:', nodeId);
  }

  private copyNodeJsonPath(nodeId: string): void {
    console.log('Copy JSONPath for node:', nodeId);
  }

  // Utility methods
  private async minifyContent(): Promise<void> {
    if (this.rawEditor) {
      await this.rawEditor.minify();
    }
  }

  private showSearch(): void {
    this.searchBar?.show();
  }

  private copyContent(): void {
    const content = this.rawEditor?.getValue() || this.currentContent;
    JsonUtils.copyToClipboard(content);
  }

  private setFontSize(size: number): void {
    this.rawEditor?.setFontSize(size);
    this.jsonTree?.setFontSize(size);
  }

  private toggleTypes(): void {
    this.stateManager.toggleTypesBadges();
    this.jsonTree?.refresh();
  }

  private cleanup(): void {
    JsonUtils.cleanup();
    this.stateManager.saveState();
  }

  // Public API Implementation
  public setContent(text: string): void {
    this.currentContent = text;
    this.rawEditor?.setValue(text);
    this.updatePrettyView();
  }

  public getContent(): string {
    return this.rawEditor?.getValue() || this.currentContent;
  }

  public async format(): Promise<void> {
    if (this.rawEditor) {
      await this.rawEditor.format();
    }
  }

  public goToLine(line: number): void {
    if (this.rawEditor) {
      this.rawEditor.goToLine(line);
    }
  }

  public find(query: string, direction: 1 | -1 = 1): void {
    const activeTab = this.stateManager.getState().activeTab;

    if (activeTab === 'raw' && this.rawEditor) {
      this.rawEditor.find(query, direction);
    } else if (activeTab === 'pretty' && this.jsonTree) {
      this.jsonTree.search(query);
    }
  }

  public toggleWrap(): void {
    if (this.rawEditor) {
      this.rawEditor.toggleWrap();
    }
  }

  public openFullscreen(tab?: ViewerTab): void {
    if (!this.fullscreenViewer) {
      this.fullscreenViewer = new FullscreenViewer({
        requestId: this.options.requestId,
        initialTab: tab || this.stateManager.getState().activeTab,
        initialContent: this.currentContent,
        onClose: () => {
          if (this.fullscreenViewer) {
            this.fullscreenViewer.destroy();
            this.fullscreenViewer = null;
          }
        },
      });
    }

    this.fullscreenViewer.show();
  }

  public expandAll(): void {
    this.jsonTree?.expandAll();
  }

  public collapseAll(): void {
    this.jsonTree?.collapseAll();
  }

  public exportData(): void {
    if (!this.currentContent) return;

    const blob = new Blob([this.currentContent], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `json-export-${Date.now()}.json`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Legacy API compatibility
  public setData(jsonData: any): void {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      this.setContent(jsonString);
    } catch (error) {
      console.error('Failed to serialize data:', error);
    }
  }

  public performSearch(query: string): void {
    this.find(query);
  }

  public navigateSearch(direction: number): void {
    this.find('', direction as 1 | -1);
  }

  public clearSearch(): void {
    this.searchBar?.hide();
    this.eventHandlers?.handleSearchClose();
  }

  public clear(): void {
    this.setContent('');
  }

  public destroy(): void {
    this.cleanup();

    this.rawEditor?.destroy();
    this.jsonTree?.destroy();
    this.toolbar?.destroy();
    this.searchBar?.destroy();
    this.fullscreenViewer?.destroy();

    this.container.innerHTML = '';
  }
}
