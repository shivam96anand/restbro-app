import { Collection } from '../../../shared/types';
import { CollectionTreeState } from './collections-search';

export class CollectionsUIHandler {
  private onToggleFolder: (folderId: string) => void;
  private onSelectCollection: (collectionId: string) => void;
  private onShowCreateMenu: (event: MouseEvent) => void;
  private onShowCreateDialog: (type: 'folder' | 'request', parentId?: string) => void;
  private onShowContextMenu: (event: MouseEvent, collectionId: string) => void;
  private onMoveCollection: (draggedId: string, targetFolderId: string) => void;
  private findCollectionById: (id: string) => Collection | undefined;

  constructor(
    onToggleFolder: (folderId: string) => void,
    onSelectCollection: (collectionId: string) => void,
    onShowCreateMenu: (event: MouseEvent) => void,
    onShowCreateDialog: (type: 'folder' | 'request', parentId?: string) => void,
    onShowContextMenu: (event: MouseEvent, collectionId: string) => void,
    onMoveCollection: (draggedId: string, targetFolderId: string) => void,
    findCollectionById: (id: string) => Collection | undefined
  ) {
    this.onToggleFolder = onToggleFolder;
    this.onSelectCollection = onSelectCollection;
    this.onShowCreateMenu = onShowCreateMenu;
    this.onShowCreateDialog = onShowCreateDialog;
    this.onShowContextMenu = onShowContextMenu;
    this.onMoveCollection = onMoveCollection;
    this.findCollectionById = findCollectionById;
  }

  setupCollectionEvents(treeState: CollectionTreeState): void {
    const addButton = document.getElementById('add-collection');
    const collectionsTree = document.getElementById('collections-tree');

    if (addButton) {
      addButton.addEventListener('click', (e) => {
        this.onShowCreateMenu(e);
      });
    }

    if (collectionsTree) {
      this.setupClickEvents(collectionsTree);
      this.setupContextMenuEvents(collectionsTree);
      this.setupDragDropEvents(collectionsTree, treeState);
    }
  }

  private setupClickEvents(collectionsTree: HTMLElement): void {
    collectionsTree.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('folder-toggle')) {
        const folderId = target.dataset.folderId;
        if (folderId) {
          this.onToggleFolder(folderId);
        }
        return;
      }

      if (target.classList.contains('collection-item') || target.closest('.collection-item')) {
        const collectionElement = target.classList.contains('collection-item')
          ? target
          : target.closest('.collection-item') as HTMLElement;
        const collectionId = collectionElement?.dataset.collectionId;
        if (collectionId) {
          const collection = this.findCollectionById(collectionId);

          const isActionButton = target.classList.contains('action-btn') ||
                               target.closest('.action-btn') ||
                               target.closest('.collection-actions');

          if (collection && collection.type === 'folder' && !isActionButton) {
            this.onToggleFolder(collectionId);
          }

          this.onSelectCollection(collectionId);
        }
      }

      // Check if target or parent is an add folder button
      const addFolderBtn = target.classList.contains('collection-add-folder')
        ? target
        : target.closest('.collection-add-folder');
      if (addFolderBtn) {
        const parentId = (addFolderBtn as HTMLElement).dataset.parentId;
        if (parentId) {
          e.stopPropagation();
          this.onShowCreateDialog('folder', parentId);
          return;
        }
      }

      // Check if target or parent is an add request button
      const addRequestBtn = target.classList.contains('collection-add-request')
        ? target
        : target.closest('.collection-add-request');
      if (addRequestBtn) {
        const parentId = (addRequestBtn as HTMLElement).dataset.parentId;
        if (parentId) {
          e.stopPropagation();
          this.onShowCreateDialog('request', parentId);
          return;
        }
      }
    });
  }

  private setupContextMenuEvents(collectionsTree: HTMLElement): void {
    collectionsTree.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const collectionElement = target.closest('.collection-item') as HTMLElement;

      if (collectionElement) {
        const collectionId = collectionElement.dataset.collectionId;
        if (collectionId) {
          this.onShowContextMenu(e, collectionId);
        }
      }
    });
  }

  private setupDragDropEvents(collectionsTree: HTMLElement, treeState: CollectionTreeState): void {
    collectionsTree.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;
      const collectionElement = target.closest('.collection-item') as HTMLElement;
      if (collectionElement) {
        const collectionId = collectionElement.dataset.collectionId;
        if (collectionId) {
          treeState.draggedItem = collectionId;
          e.dataTransfer?.setData('text/plain', collectionId);
          collectionElement.classList.add('dragging');
        }
      }
    });

    collectionsTree.addEventListener('dragend', (e) => {
      const target = e.target as HTMLElement;
      const collectionElement = target.closest('.collection-item') as HTMLElement;
      if (collectionElement) {
        collectionElement.classList.remove('dragging');
      }
      treeState.draggedItem = undefined;
    });

    collectionsTree.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const collectionElement = target.closest('.collection-item') as HTMLElement;
      if (collectionElement) {
        const collection = this.findCollectionById(collectionElement.dataset.collectionId || '');
        if (collection && collection.type === 'folder') {
          collectionElement.classList.add('drag-over');
        }
      }
    });

    collectionsTree.addEventListener('dragleave', (e) => {
      const target = e.target as HTMLElement;
      const collectionElement = target.closest('.collection-item') as HTMLElement;
      if (collectionElement) {
        collectionElement.classList.remove('drag-over');
      }
    });

    collectionsTree.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const collectionElement = target.closest('.collection-item') as HTMLElement;
      if (collectionElement) {
        collectionElement.classList.remove('drag-over');
        const targetId = collectionElement.dataset.collectionId;
        const draggedId = treeState.draggedItem;
        if (targetId && draggedId && targetId !== draggedId) {
          this.onMoveCollection(draggedId, targetId);
        }
      }
    });
  }

  showKeyboardShortcuts(): void {
    const shortcuts = [
      { key: 'Ctrl/Cmd + N', description: 'New folder' },
      { key: 'Ctrl/Cmd + Shift + N', description: 'New request' },
      { key: 'Ctrl/Cmd + F', description: 'Search collections' },
      { key: 'Ctrl/Cmd + D', description: 'Duplicate selected' },
      { key: 'Ctrl/Cmd + E', description: 'Export selected' },
      { key: 'F2', description: 'Rename selected' },
      { key: 'Delete', description: 'Delete selected' },
      { key: '↑/↓', description: 'Navigate up/down' },
      { key: '→', description: 'Expand folder' },
      { key: '←', description: 'Collapse folder' },
      { key: 'Escape', description: 'Clear search' }
    ];

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
      min-width: 350px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Keyboard Shortcuts';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      text-align: center;
    `;

    const shortcutsList = document.createElement('div');
    shortcutsList.style.cssText = `
      display: grid;
      gap: 8px;
    `;

    shortcuts.forEach(shortcut => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        font-size: 12px;
      `;

      const keySpan = document.createElement('span');
      keySpan.textContent = shortcut.key;
      keySpan.style.cssText = `
        font-family: monospace;
        background: var(--bg-primary);
        color: var(--primary-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 600;
      `;

      const descSpan = document.createElement('span');
      descSpan.textContent = shortcut.description;
      descSpan.style.color = 'var(--text-secondary)';

      item.appendChild(keySpan);
      item.appendChild(descSpan);
      shortcutsList.appendChild(item);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      width: 100%;
      margin-top: 16px;
      padding: 8px 16px;
      background: var(--primary-color);
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

    closeButton.addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
      }
    });

    content.appendChild(title);
    content.appendChild(shortcutsList);
    content.appendChild(closeButton);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }

  showError(message: string): void {
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
}