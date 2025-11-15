/**
 * SearchBar component with next/prev navigation and JSONPath support
 */

import { VIEWER_CONSTANTS, VIEWER_CLASSES } from './types';
import { ViewerStateManager } from './viewerState';
import { SearchBarUI } from './SearchBarUI';
import { SearchBarStyles } from './SearchBarStyles';

export interface SearchBarOptions {
  container: HTMLElement;
  stateManager: ViewerStateManager;
  onSearch?: (query: string) => void;
  onNavigate?: (direction: 1 | -1) => void;
  onClose?: () => void;
  onJsonPathEvaluate?: (path: string) => void;
  supportJsonPath?: boolean;
}

export interface SearchBarHandle {
  show: () => void;
  hide: () => void;
  focus: () => void;
  setQuery: (query: string) => void;
  updateResults: (current: number, total: number) => void;
  setMode: (mode: 'search' | 'jsonpath') => void;
  destroy: () => void;
}

export class SearchBar implements SearchBarHandle {
  private container: HTMLElement;
  private stateManager: ViewerStateManager;
  private options: SearchBarOptions;
  private ui: SearchBarUI;
  private searchTimeout: number | null = null;
  private isVisible = false;
  private currentMode: 'search' | 'jsonpath' = 'search';
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: SearchBarOptions) {
    this.options = options;
    this.container = options.container;
    this.stateManager = options.stateManager;
    this.ui = new SearchBarUI();

    this.render();
    this.attachEventListeners();
    SearchBarStyles.applyStyles();
  }

  private render(): void {
    this.container.className = `${VIEWER_CLASSES.searchBar} json-viewer-search`;
    this.container.style.display = 'none';

    const searchBar = document.createElement('div');
    searchBar.className = 'search-bar-container';

    // Mode selector (if JSONPath is supported)
    if (this.options.supportJsonPath) {
      const modeSelector = this.ui.createModeSelector((mode) =>
        this.switchMode(mode)
      );
      searchBar.appendChild(modeSelector);
    }

    // Main search input container
    const inputContainer = this.ui.createInputContainer(
      this.getPlaceholderText()
    );
    searchBar.appendChild(inputContainer);

    // Navigation controls
    const navigation = this.ui.createNavigationControls(
      () => this.navigate(-1),
      () => this.navigate(1)
    );
    searchBar.appendChild(navigation);

    // Close button
    const closeButton = this.ui.createCloseButton(() => this.hide());
    searchBar.appendChild(closeButton);

    this.container.appendChild(searchBar);
  }

  private attachEventListeners(): void {
    const input = this.ui.getInput();
    if (!input) return;

    // Search input handling
    input.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.handleSearch(query);
    });

    input.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this.navigate(e.shiftKey ? -1 : 1);
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
        case 'F3':
          e.preventDefault();
          this.navigate(e.shiftKey ? -1 : 1);
          break;
      }
    });

    // Global keyboard shortcuts
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isVisible) return;

      if (e.key === 'F3') {
        e.preventDefault();
        this.navigate(e.shiftKey ? -1 : 1);
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    // Restore previous search query when showing
    this.container.addEventListener('show', () => {
      const state = this.stateManager.getState();
      if (state.search.query) {
        input.value = state.search.query;
        this.updateResults(
          state.search.currentIndex + 1,
          state.search.totalMatches
        );
      }
    });
  }

  private handleSearch(query: string): void {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, VIEWER_CONSTANTS.SEARCH_DEBOUNCE) as unknown as number;
  }

  private performSearch(query: string): void {
    this.stateManager.updateSearch({ query });

    if (this.currentMode === 'search') {
      this.options.onSearch?.(query);
    } else {
      this.options.onJsonPathEvaluate?.(query);
    }
  }

  private navigate(direction: 1 | -1): void {
    this.options.onNavigate?.(direction);
  }

  private switchMode(mode: 'search' | 'jsonpath'): void {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    this.ui.updateModeButtons(mode);

    // Update input placeholder
    const input = this.ui.getInput();
    if (input) {
      input.placeholder = this.getPlaceholderText();
      input.value = '';
    }

    // Clear results
    this.updateResults(0, 0);
  }

  private getPlaceholderText(): string {
    return this.currentMode === 'search'
      ? 'Search in JSON...'
      : 'Enter JSONPath (e.g., $.users[0].name)';
  }

  // Public API
  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
    this.container.dispatchEvent(new Event('show'));
    this.focus();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.options.onClose?.();
  }

  public focus(): void {
    const input = this.ui.getInput();
    if (input) {
      input.focus();
      input.select();
    }
  }

  public setQuery(query: string): void {
    const input = this.ui.getInput();
    if (input) {
      input.value = query;
      this.performSearch(query);
    }
  }

  public updateResults(current: number, total: number): void {
    this.ui.updateResults(current, total);
    this.stateManager.updateSearch({ currentIndex: current - 1, totalMatches: total });
  }

  public setMode(mode: 'search' | 'jsonpath'): void {
    this.switchMode(mode);
  }

  public destroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }

    this.container.innerHTML = '';
  }
}
