import { EventBus } from '../utils/event-bus';
import { Collection, Request } from '../../shared/types';

export class CollectionsManager {
  private collections: Collection[] = [];
  private selectedRequest: Request | null = null;

  constructor(private eventBus: EventBus) {}

  initialize(): void {
    this.setupEventListeners();
    this.setupImportButton();
    this.setupNewCollectionButton();
  }

  private setupEventListeners(): void {
    this.eventBus.on('collections:loaded', (collections: Collection[]) => {
      this.collections = collections;
      this.renderCollections();
    });

    this.eventBus.on('collection:created', (collection: Collection) => {
      this.collections.push(collection);
      this.renderCollections();
      this.saveCollection(collection);
    });

    this.eventBus.on('request:selected', (request: Request) => {
      this.selectedRequest = request;
      this.highlightSelectedRequest(request);
    });
  }

  private setupImportButton(): void {
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', async () => {
        try {
          const collection = await window.electronAPI.importCollection();
          if (collection) {
            this.collections.push(collection);
            this.renderCollections();
            await this.saveCollection(collection);
            this.eventBus.emit('toast:show', {
              message: `Collection "${collection.name}" imported successfully`,
              type: 'success'
            });
          }
        } catch (error) {
          console.error('Failed to import collection:', error);
          this.eventBus.emit('toast:show', {
            message: 'Failed to import collection',
            type: 'error'
          });
        }
      });
    }
  }

  private setupNewCollectionButton(): void {
    const newCollectionBtn = document.getElementById('newCollectionBtn');
    if (newCollectionBtn) {
      newCollectionBtn.addEventListener('click', () => {
        this.createNewCollection();
      });
    }
  }

  private createNewCollection(): void {
    const name = prompt('Enter collection name:');
    if (name && name.trim()) {
      const collection: Collection = {
        id: this.generateId(),
        name: name.trim(),
        children: [],
        requests: []
      };
      
      this.eventBus.emit('collection:created', collection);
    }
  }

  private renderCollections(): void {
    const container = document.getElementById('collectionsTree');
    if (!container) return;

    container.innerHTML = '';

    if (this.collections.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span>📁</span>
          <p>No collections yet</p>
          <small>Import or create a new collection to get started</small>
        </div>
      `;
      return;
    }

    this.collections.forEach(collection => {
      const element = this.createCollectionElement(collection);
      container.appendChild(element);
    });
  }

  private createCollectionElement(collection: Collection): HTMLElement {
    const div = document.createElement('div');
    div.className = 'collection-item';
    div.innerHTML = `
      <div class="collection-header">
        <span class="collection-icon">📁</span>
        <span class="collection-name">${collection.name}</span>
        <div class="collection-actions">
          <button class="btn btn-sm" data-action="export" data-id="${collection.id}">Export</button>
          <button class="btn btn-sm" data-action="delete" data-id="${collection.id}">Delete</button>
        </div>
      </div>
      <div class="collection-children">
        ${this.renderCollectionContent(collection)}
      </div>
    `;

    // Add event listeners
    const exportBtn = div.querySelector('[data-action="export"]');
    const deleteBtn = div.querySelector('[data-action="delete"]');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCollection(collection));
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteCollection(collection.id));
    }

    return div;
  }

  private renderCollectionContent(collection: Collection): string {
    let html = '';

    // Render child collections
    if (collection.children && collection.children.length > 0) {
      collection.children.forEach(child => {
        html += `<div class="collection-item">${this.createCollectionElement(child).innerHTML}</div>`;
      });
    }

    // Render requests
    if (collection.requests && collection.requests.length > 0) {
      collection.requests.forEach(request => {
        const isSelected = this.selectedRequest?.id === request.id;
        html += `
          <div class="request-item ${isSelected ? 'active' : ''}" data-request-id="${request.id}">
            <span class="request-method method-${request.method.toLowerCase()}">${request.method}</span>
            <span class="request-name">${request.name}</span>
          </div>
        `;
      });
    }

    return html;
  }

  private highlightSelectedRequest(request: Request): void {
    // Remove previous selection
    document.querySelectorAll('.request-item').forEach(item => {
      item.classList.remove('active');
    });

    // Highlight selected request
    const requestElement = document.querySelector(`[data-request-id="${request.id}"]`);
    if (requestElement) {
      requestElement.classList.add('active');
    }
  }

  private async exportCollection(collection: Collection): Promise<void> {
    try {
      const success = await window.electronAPI.exportCollection(collection);
      if (success) {
        this.eventBus.emit('toast:show', {
          message: `Collection "${collection.name}" exported successfully`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to export collection:', error);
      this.eventBus.emit('toast:show', {
        message: 'Failed to export collection',
        type: 'error'
      });
    }
  }

  private async deleteCollection(id: string): Promise<void> {
    const collection = this.collections.find(c => c.id === id);
    if (!collection) return;

    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      try {
        await window.electronAPI.deleteCollection(id);
        this.collections = this.collections.filter(c => c.id !== id);
        this.renderCollections();
        
        this.eventBus.emit('toast:show', {
          message: `Collection "${collection.name}" deleted`,
          type: 'success'
        });
      } catch (error) {
        console.error('Failed to delete collection:', error);
        this.eventBus.emit('toast:show', {
          message: 'Failed to delete collection',
          type: 'error'
        });
      }
    }
  }

  private async saveCollection(collection: Collection): Promise<void> {
    try {
      await window.electronAPI.saveCollection(collection);
    } catch (error) {
      console.error('Failed to save collection:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCollections(): Collection[] {
    return [...this.collections];
  }

  getSelectedRequest(): Request | null {
    return this.selectedRequest;
  }
}
