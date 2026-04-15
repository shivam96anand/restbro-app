/**
 * Collections State Persistence Module
 * Handles saving and loading of collections UI state (expanded folders)
 */

interface CollectionsUIState {
  expandedFolderIds: string[];
}

export class CollectionsStatePersistence {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 500; // ms

  /**
   * Load the persisted expanded folder IDs from main process
   */
  async loadExpandedFolders(): Promise<Set<string>> {
    try {
      const uiState = await window.restbro.collectionsState.get();
      return new Set(uiState.expandedFolderIds || []);
    } catch (error) {
      console.error('Failed to load collections UI state:', error);
      return new Set();
    }
  }

  /**
   * Save the expanded folder IDs to main process (debounced)
   */
  saveExpandedFolders(expandedFolders: Set<string>): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce the save operation
    this.debounceTimer = setTimeout(async () => {
      try {
        const uiState: CollectionsUIState = {
          expandedFolderIds: Array.from(expandedFolders),
        };
        await window.restbro.collectionsState.set(uiState);
      } catch (error) {
        console.error('Failed to save collections UI state:', error);
      }
      this.debounceTimer = null;
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Immediately flush any pending save operation
   */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
