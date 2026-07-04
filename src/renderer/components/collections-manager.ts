import { Collection, ApiRequest } from '../../shared/types';
import { CollectionsCore } from './collections/collections-core';

export class CollectionsManager {
  private core: CollectionsCore;

  constructor() {
    this.core = new CollectionsCore();
  }

  initialize(): void {
    this.core.initialize();
    this.setupSaveTabListener();
  }

  /**
   * Listen for the Save / Save As shortcut dispatched by tabs-manager.
   * - If the tab has a `collectionId`, write the current request back to the
   *   collection (Save).
   * - Otherwise (or when forceSaveAs=true) we just emit a notification — a
   *   full destination picker is left for a follow-up; this still surfaces
   *   to the user that nothing was persisted, instead of silently dropping
   *   their Cmd+S.
   */
  private setupSaveTabListener(): void {
    document.addEventListener('request-save-tab', ((e: CustomEvent) => {
      const { request, collectionId, forceSaveAs } = e.detail || {};
      if (!request) return;
      if (!forceSaveAs && collectionId) {
        this.core.updateCollectionRequest(collectionId, request);
        document.dispatchEvent(
          new CustomEvent('request-saved', {
            detail: { requestId: request.id, collectionId },
          })
        );
        return;
      }
      // Save As / unsaved tab: surface a notification. A future PR can open
      // a destination-picker modal here.
      document.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            type: 'info',
            message: forceSaveAs
              ? 'Save As — drag this tab into a collection to save (picker coming soon).'
              : 'This tab is not part of any collection yet.',
          },
        })
      );
    }) as EventListener);
  }

  async setCollections(collections: Collection[]): Promise<void> {
    await this.core.setCollections(collections);
  }

  getCollections(): Collection[] {
    return this.core.getCollections();
  }

  getSelectedCollection(): Collection | undefined {
    return this.core.getSelectedCollection();
  }

  updateCollectionRequest(
    collectionId: string,
    updatedRequest: ApiRequest
  ): void {
    this.core.updateCollectionRequest(collectionId, updatedRequest);
  }

  setSelectedCollection(collectionId: string): void {
    this.core.setSelectedCollection(collectionId);
  }

  setActiveRequest(requestId?: string): void {
    this.core.setActiveRequest(requestId);
  }

  clearSelection(): void {
    this.core.clearSelection();
  }
}
