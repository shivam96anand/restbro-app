import { Collection } from '../../shared/types';
import { modal } from '../utils/modal';

export class CollectionsManager {
  private collections: Collection[] = [];
  private selectedCollectionId?: string;

  initialize(): void {
    this.setupCollectionEvents();
    this.renderCollections();
  }

  private setupCollectionEvents(): void {
    const addButton = document.getElementById('add-collection');
    const collectionsTree = document.getElementById('collections-tree');

    if (addButton) {
      addButton.addEventListener('click', () => {
        this.showCreateDialog();
      });
    }

    if (collectionsTree) {
      collectionsTree.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        if (target.classList.contains('collection-item')) {
          const collectionId = target.dataset.collectionId;
          if (collectionId) {
            this.selectCollection(collectionId);
          }
        }

        if (target.classList.contains('collection-add-folder')) {
          const parentId = target.dataset.parentId;
          this.showCreateDialog('folder', parentId);
        }

        if (target.classList.contains('collection-add-request')) {
          const parentId = target.dataset.parentId;
          this.showCreateDialog('request', parentId);
        }
      });

      collectionsTree.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;

        if (target.classList.contains('collection-item')) {
          const collectionId = target.dataset.collectionId;
          if (collectionId) {
            this.showContextMenu(e, collectionId);
          }
        }
      });
    }
  }

  private async showCreateDialog(type: 'folder' | 'request' = 'folder', parentId?: string): Promise<void> {
    const name = await modal.show(`Create ${type}`, `Enter ${type} name`);
    if (!name) return;

    try {
      const newCollection = await window.apiCourier.collection.create({
        name,
        type,
        parentId,
      });

      this.collections.push(newCollection);
      this.renderCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
      this.showError('Failed to create collection');
    }
  }

  private showContextMenu(event: MouseEvent, collectionId: string): void {
    const collection = this.findCollectionById(collectionId);
    if (!collection) return;

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.style.backgroundColor = 'var(--bg-tertiary)';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.borderRadius = '4px';
    menu.style.padding = '8px 0';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '150px';

    const actions = [
      { label: 'Add Folder', action: () => this.showCreateDialog('folder', collectionId) },
      { label: 'Add Request', action: () => this.showCreateDialog('request', collectionId) },
      { label: 'Rename', action: () => this.renameCollection(collectionId) },
      { label: 'Delete', action: () => this.deleteCollection(collectionId) },
    ];

    actions.forEach(action => {
      const item = document.createElement('div');
      item.textContent = action.label;
      item.style.padding = '8px 16px';
      item.style.cursor = 'pointer';
      item.style.fontSize = '12px';

      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = 'var(--hover-color)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });

      item.addEventListener('click', () => {
        action.action();
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const handleClickOutside = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
        document.removeEventListener('click', handleClickOutside);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }

  private async renameCollection(collectionId: string): Promise<void> {
    const collection = this.findCollectionById(collectionId);
    if (!collection) return;

    const newName = await modal.show('Rename', collection.name);
    if (!newName || newName === collection.name) return;

    try {
      await window.apiCourier.collection.update(collectionId, { name: newName });
      collection.name = newName;
      this.renderCollections();
    } catch (error) {
      console.error('Failed to rename collection:', error);
      this.showError('Failed to rename collection');
    }
  }

  private async deleteCollection(collectionId: string): Promise<void> {
    const collection = this.findCollectionById(collectionId);
    if (!collection) return;

    const confirmed = await this.showConfirm(`Delete "${collection.name}"?`, 'This action cannot be undone.');
    if (!confirmed) return;

    try {
      await window.apiCourier.collection.delete(collectionId);

      // If this was a request collection, notify tabs to close any open tabs for this request
      if (collection.type === 'request' && collection.request) {
        const event = new CustomEvent('request-deleted', {
          detail: { requestId: collection.request.id }
        });
        document.dispatchEvent(event);
      }

      this.collections = this.collections.filter(c => c.id !== collectionId);
      this.renderCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      this.showError('Failed to delete collection');
    }
  }

  private selectCollection(collectionId: string): void {
    this.selectedCollectionId = collectionId;
    this.renderCollections();

    const collection = this.findCollectionById(collectionId);
    if (collection && collection.type === 'request' && collection.request) {
      // Notify that a collection request should be opened in a tab
      const event = new CustomEvent('open-request-in-tab', {
        detail: { request: collection.request }
      });
      document.dispatchEvent(event);
    }
  }

  private renderCollections(): void {
    const tree = document.getElementById('collections-tree');
    if (!tree) return;

    const rootCollections = this.collections.filter(c => !c.parentId);

    if (rootCollections.length === 0) {
      tree.innerHTML = '<div class="empty-state">No collections yet. Click + to create one.</div>';
      return;
    }

    tree.innerHTML = '';
    rootCollections.forEach(collection => {
      const element = this.createCollectionElement(collection, 0);
      tree.appendChild(element);
    });
  }

  private createCollectionElement(collection: Collection, depth: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'collection-item';
    element.style.paddingLeft = (depth * 20 + 8) + 'px';
    element.dataset.collectionId = collection.id;

    if (collection.id === this.selectedCollectionId) {
      element.classList.add('selected');
    }

    const icon = document.createElement('span');
    icon.className = 'collection-icon';
    icon.textContent = collection.type === 'folder' ? '📁' : '📄';

    const name = document.createElement('span');
    name.textContent = collection.name;

    element.appendChild(icon);
    element.appendChild(name);

    const container = document.createElement('div');
    container.appendChild(element);

    // Add children if it's a folder
    if (collection.type === 'folder') {
      const children = this.collections.filter(c => c.parentId === collection.id);
      children.forEach(child => {
        const childElement = this.createCollectionElement(child, depth + 1);
        container.appendChild(childElement);
      });
    }

    return container;
  }

  private findCollectionById(id: string): Collection | undefined {
    return this.collections.find(c => c.id === id);
  }

  setCollections(collections: Collection[]): void {
    this.collections = collections;
    this.renderCollections();
  }

  getCollections(): Collection[] {
    return this.collections;
  }

  getSelectedCollection(): Collection | undefined {
    return this.findCollectionById(this.selectedCollectionId || '');
  }

  private showError(message: string): void {
    // Simple error notification - could be enhanced with a toast system
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--error-color);
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
    `;

    document.body.appendChild(errorDiv);
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 3000);
  }

  private async showConfirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 24px;
        min-width: 300px;
        max-width: 500px;
      `;

      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      titleEl.style.cssText = `
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      `;

      const messageEl = document.createElement('p');
      messageEl.textContent = message;
      messageEl.style.cssText = `
        margin: 0 0 20px 0;
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.4;
      `;

      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      `;

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.cssText = `
        padding: 8px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 14px;
      `;

      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'Delete';
      confirmButton.style.cssText = `
        padding: 8px 16px;
        background: var(--error-color);
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 14px;
      `;

      const cleanup = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      };

      cancelButton.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      confirmButton.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });

      buttonsContainer.appendChild(cancelButton);
      buttonsContainer.appendChild(confirmButton);
      content.appendChild(titleEl);
      content.appendChild(messageEl);
      content.appendChild(buttonsContainer);
      overlay.appendChild(content);
      document.body.appendChild(overlay);
    });
  }
}