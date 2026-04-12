import { Collection, ApiRequest } from '../../shared/types';
import { CollectionsCore } from './collections/collections-core';

export class CollectionsManager {
  private core: CollectionsCore;

  constructor() {
    this.core = new CollectionsCore();
  }

  initialize(): void {
    this.core.initialize();
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
