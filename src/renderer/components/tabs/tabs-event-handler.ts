import { RequestTab } from '../../../shared/types';

export class TabsEventHandler {
  private onCreateNewTab: () => void;
  private onSwitchToTab: (tabId: string) => void;
  private onCloseTab: (tabId: string) => void;
  private onShowTabContextMenu: (event: MouseEvent, tabId: string) => void;
  private onUpdateActiveTab: (updates: Partial<RequestTab>, markAsModified: boolean) => void;
  private onCloseTabsByRequestId: (requestId: string) => void;
  private onUpdateTabNameForRequest: (requestId: string, newName: string) => void;

  constructor(
    onCreateNewTab: () => void,
    onSwitchToTab: (tabId: string) => void,
    onCloseTab: (tabId: string) => void,
    onShowTabContextMenu: (event: MouseEvent, tabId: string) => void,
    onUpdateActiveTab: (updates: Partial<RequestTab>, markAsModified: boolean) => void,
    onCloseTabsByRequestId: (requestId: string) => void,
    onUpdateTabNameForRequest: (requestId: string, newName: string) => void
  ) {
    this.onCreateNewTab = onCreateNewTab;
    this.onSwitchToTab = onSwitchToTab;
    this.onCloseTab = onCloseTab;
    this.onShowTabContextMenu = onShowTabContextMenu;
    this.onUpdateActiveTab = onUpdateActiveTab;
    this.onCloseTabsByRequestId = onCloseTabsByRequestId;
    this.onUpdateTabNameForRequest = onUpdateTabNameForRequest;
  }

  setupTabEvents(): void {
    const tabList = document.getElementById('request-tab-list');
    if (!tabList) return;

    tabList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('tab-close')) {
        const tabId = target.dataset.tabId;
        if (tabId) {
          this.onCloseTab(tabId);
        }
        return;
      }

      const tabElement = target.closest('.request-tab') as HTMLElement;
      if (tabElement) {
        const tabId = tabElement.dataset.tabId;

        if (tabId === 'new') {
          this.onCreateNewTab();
        } else if (tabId) {
          this.onSwitchToTab(tabId);
        }
      }
    });

    tabList.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const tabElement = target.closest('.request-tab') as HTMLElement;

      if (tabElement) {
        const tabId = tabElement.dataset.tabId;
        if (tabId && tabId !== 'new') {
          this.onShowTabContextMenu(e, tabId);
        }
      }
    });
  }

  setupEventListeners(): void {
    document.addEventListener('request-updated', (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedRequest = customEvent.detail.request;
      if (updatedRequest) {
        this.onUpdateActiveTab({ request: updatedRequest }, true);
      }
    });

    document.addEventListener('response-received', (e: Event) => {
      const customEvent = e as CustomEvent;
      const response = customEvent.detail.response;
      if (response) {
        this.onUpdateActiveTab({ response }, false);
      }
    });

    document.addEventListener('request-deleted', (e: Event) => {
      const customEvent = e as CustomEvent;
      const requestId = customEvent.detail.requestId;
      if (requestId) {
        this.onCloseTabsByRequestId(requestId);
      }
    });

    document.addEventListener('collection-renamed', (e: Event) => {
      const customEvent = e as CustomEvent;
      const collection = customEvent.detail.collection;
      const newName = customEvent.detail.newName;

      if (collection && collection.type === 'request' && collection.request) {
        this.onUpdateTabNameForRequest(collection.request.id, newName);
      }
    });
  }

  showTabContextMenu(
    event: MouseEvent,
    tab: RequestTab,
    onDuplicateTab: (tabId: string) => void,
    onCopyRequestUrl: (tabId: string) => void,
    onCloseAllTabs: () => void,
    onCloseOtherTabs: (keepTabId: string) => void
  ): void {
    const menu = document.createElement('div');
    menu.className = 'tab-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.style.backgroundColor = 'var(--bg-tertiary)';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.borderRadius = '6px';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '180px';
    menu.style.overflow = 'hidden';
    menu.style.backdropFilter = 'blur(8px)';

    const menuOptions = [
      {
        label: '🔄 Duplicate Tab',
        action: () => onDuplicateTab(tab.id),
        description: 'Create a copy of this tab'
      },
      {
        label: '📋 Copy Request URL',
        action: () => onCopyRequestUrl(tab.id),
        description: 'Copy the request URL to clipboard'
      },
      {
        label: '---',
        action: null,
        description: ''
      },
      {
        label: '❌ Close Tab',
        action: () => this.onCloseTab(tab.id),
        description: 'Close this tab'
      },
      {
        label: '🗑️ Close All Tabs',
        action: () => onCloseAllTabs(),
        description: 'Close all open tabs'
      },
      {
        label: '↩️ Close Other Tabs',
        action: () => onCloseOtherTabs(tab.id),
        description: 'Close all tabs except this one'
      }
    ];

    menuOptions.forEach(option => {
      const item = document.createElement('div');

      if (option.label === '---') {
        item.className = 'tab-context-menu-separator';
        item.style.cssText = `
          height: 1px;
          background: var(--border-color);
          margin: 4px 0;
        `;
      } else {
        item.className = 'tab-context-menu-item';
        item.textContent = option.label;
        item.title = option.description;
        item.style.cssText = `
          padding: 10px 16px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-primary);
          transition: background-color 0.15s ease;
        `;

        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = 'var(--primary-color)';
          item.style.color = 'white';
        });

        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'transparent';
          item.style.color = 'var(--text-primary)';
        });

        if (option.action) {
          item.addEventListener('click', () => {
            option.action!();
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

  showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}