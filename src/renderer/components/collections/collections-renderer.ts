import { Collection } from '../../../shared/types';
import { CollectionTreeState } from './collections-search';

export class CollectionsRenderer {
  private findCollectionById: (id: string) => Collection | undefined;

  constructor(findCollectionById: (id: string) => Collection | undefined) {
    this.findCollectionById = findCollectionById;
  }

  renderCollections(
    collections: Collection[],
    treeState: CollectionTreeState,
    selectedCollectionId: string | undefined,
    filteredCollections?: Collection[]
  ): void {
    const tree = document.getElementById('collections-tree');
    if (!tree) return;

    let collectionsToShow = filteredCollections || collections;

    const rootCollections = collectionsToShow.filter(c => !c.parentId);

    if (rootCollections.length === 0) {
      const message = treeState.searchTerm
        ? 'No collections match your search.'
        : 'No collections yet. Click + to create one.';
      tree.innerHTML = `<div class="empty-state">${message}</div>`;
      return;
    }

    tree.innerHTML = '';
    rootCollections.forEach(collection => {
      const element = this.createCollectionElement(
        collection,
        0,
        collections,
        treeState,
        selectedCollectionId,
        filteredCollections
      );
      tree.appendChild(element);
    });
  }

  createCollectionElement(
    collection: Collection,
    depth: number,
    allCollections: Collection[],
    treeState: CollectionTreeState,
    selectedCollectionId: string | undefined,
    filteredCollections?: Collection[]
  ): HTMLElement {
    const element = document.createElement('div');
    element.className = 'collection-item';
    element.dataset.collectionId = collection.id;
    element.draggable = true;

    const baseIndent = 12;
    const indentPerLevel = 20;
    element.style.paddingLeft = (depth * indentPerLevel + baseIndent) + 'px';

    if (collection.id === selectedCollectionId) {
      element.classList.add('selected');
    }

    if (collection.type === 'folder') {
      element.classList.add('folder');
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'collection-content';

    if (collection.type === 'folder') {
      const toggle = document.createElement('span');
      toggle.className = 'folder-toggle';
      toggle.dataset.folderId = collection.id;
      const isExpanded = treeState.expandedFolders.has(collection.id);
      toggle.textContent = isExpanded ? '▼' : '▶';
      toggle.title = isExpanded ? 'Collapse folder' : 'Expand folder';
      contentWrapper.appendChild(toggle);
    } else {
      if (depth > 0) {
        const spacer = document.createElement('span');
        spacer.className = 'folder-spacer';
        contentWrapper.appendChild(spacer);
      }
    }

    const icon = document.createElement('span');
    icon.className = 'collection-icon';

    if (collection.type === 'folder') {
      const isExpanded = treeState.expandedFolders.has(collection.id);
      icon.textContent = isExpanded ? '📂' : '📁';
    } else {
      const method = collection.request?.method || 'GET';
      const methodIcons: Record<string, string> = {
        'GET': '📄',
        'POST': '📝',
        'PUT': '✏️',
        'PATCH': '🔧',
        'DELETE': '🗑️',
        'HEAD': '👁️',
        'OPTIONS': '⚙️'
      };
      icon.textContent = methodIcons[method] || '📄';
    }

    contentWrapper.appendChild(icon);

    const name = document.createElement('span');
    name.className = 'collection-name';
    name.textContent = collection.name;

    if (treeState.searchTerm && collection.name.toLowerCase().includes(treeState.searchTerm)) {
      name.classList.add('search-highlight');
    }

    contentWrapper.appendChild(name);

    if (collection.type === 'folder') {
      const actions = document.createElement('div');
      actions.className = 'collection-actions';

      const addFolder = document.createElement('button');
      addFolder.className = 'action-btn collection-add-folder';
      addFolder.dataset.parentId = collection.id;
      addFolder.title = 'Add folder';
      addFolder.textContent = '📁+';

      const addRequest = document.createElement('button');
      addRequest.className = 'action-btn collection-add-request';
      addRequest.dataset.parentId = collection.id;
      addRequest.title = 'Add request';
      addRequest.textContent = '📄+';

      actions.appendChild(addFolder);
      actions.appendChild(addRequest);
      contentWrapper.appendChild(actions);
    }

    element.appendChild(contentWrapper);

    const container = document.createElement('div');
    container.className = 'collection-container';
    container.appendChild(element);

    if (collection.type === 'folder') {
      const isExpanded = treeState.expandedFolders.has(collection.id);
      const isSearching = treeState.searchTerm.length > 0;

      if (isExpanded || isSearching) {
        const children = allCollections.filter(c => c.parentId === collection.id);

        let childrenToShow = children;
        if (isSearching && filteredCollections) {
          childrenToShow = children.filter(child =>
            filteredCollections.some(fc => fc.id === child.id)
          );
        }

        if (childrenToShow.length > 0) {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'collection-children';

          childrenToShow.forEach(child => {
            const childElement = this.createCollectionElement(
              child,
              depth + 1,
              allCollections,
              treeState,
              selectedCollectionId,
              filteredCollections
            );
            childrenContainer.appendChild(childElement);
          });

          container.appendChild(childrenContainer);
        }
      }
    }

    return container;
  }

  showCreateMenu(event: MouseEvent, onCreateFolder: () => void, onCreateRequest: () => void): void {
    const button = event.target as HTMLElement;
    const rect = button.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.className = 'create-menu';
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.backgroundColor = 'var(--bg-tertiary)';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.borderRadius = '6px';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '150px';
    menu.style.overflow = 'hidden';

    const createOptions = [
      {
        label: '📁 New Folder',
        action: onCreateFolder,
        description: 'Create a new folder'
      },
      {
        label: '📄 New Request',
        action: onCreateRequest,
        description: 'Create a new API request'
      }
    ];

    createOptions.forEach((option) => {
      const item = document.createElement('div');
      item.className = 'create-menu-item';
      item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.15s ease;
      `;

      const label = document.createElement('span');
      label.textContent = option.label;
      label.style.fontWeight = '500';

      item.appendChild(label);
      item.title = option.description;

      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = 'var(--primary-color)';
        item.style.color = 'white';
      });

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
        item.style.color = 'var(--text-primary)';
      });

      item.addEventListener('click', () => {
        option.action();
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const handleClickOutside = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node) && e.target !== button) {
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

  showContextMenu(
    event: MouseEvent,
    collection: Collection,
    actions: Array<{ label: string; action: (() => void) | null }>
  ): void {
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

    actions.forEach(action => {
      const item = document.createElement('div');

      if (action.label === '---') {
        item.className = 'context-menu-separator';
        item.style.cssText = `
          height: 1px;
          background: var(--border-color);
          margin: 4px 0;
        `;
      } else {
        item.textContent = action.label;
        item.className = 'context-menu-item';
        item.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        `;

        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = 'var(--hover-color)';
        });

        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'transparent';
        });

        if (action.action) {
          item.addEventListener('click', () => {
            action.action!();
            if (document.body.contains(menu)) {
              document.body.removeChild(menu);
            }
          });
        }
      }

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
}