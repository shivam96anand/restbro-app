import { RequestTab, ApiRequest } from '../../shared/types';

export class TabsManager {
  private tabs: RequestTab[] = [];
  private activeTabId?: string;

  initialize(): void {
    this.setupTabEvents();
    this.setupEventListeners();
    this.renderTabs();
  }

  private setupTabEvents(): void {
    const tabList = document.getElementById('request-tab-list');
    if (!tabList) return;

    tabList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle close button clicks first (highest priority)
      if (target.classList.contains('tab-close')) {
        const tabId = target.dataset.tabId;
        if (tabId) {
          this.closeTab(tabId);
        }
        return; // Don't proceed with tab switching if close button was clicked
      }

      // Find the closest parent element with 'request-tab' class
      const tabElement = target.closest('.request-tab') as HTMLElement;
      if (tabElement) {
        const tabId = tabElement.dataset.tabId;

        if (tabId === 'new') {
          this.createNewTab();
        } else if (tabId) {
          this.switchToTab(tabId);
        }
      }
    });
  }

  private setupEventListeners(): void {
    // Listen for request updates to save them to the active tab
    document.addEventListener('request-updated', (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedRequest = customEvent.detail.request;
      if (this.activeTabId && updatedRequest) {
        this.updateActiveTab({ request: updatedRequest }, true); // Mark as modified for user changes
      }
    });

    // Listen for responses to save them to the active tab
    document.addEventListener('response-received', (e: Event) => {
      const customEvent = e as CustomEvent;
      const response = customEvent.detail.response;
      if (this.activeTabId && response) {
        this.updateActiveTab({ response }, false); // Don't mark as modified for responses
      }
    });

    // Listen for request deletions to close corresponding tabs
    document.addEventListener('request-deleted', (e: Event) => {
      const customEvent = e as CustomEvent;
      const requestId = customEvent.detail.requestId;
      if (requestId) {
        this.closeTabsByRequestId(requestId);
      }
    });
  }

  private createNewTab(): void {
    const tabNumber = this.tabs.length + 1;
    const newRequest: ApiRequest = {
      id: this.generateId(),
      name: `Untitled Request ${tabNumber}`,
      method: 'GET',
      url: '',
      params: {},
      headers: {},
    };

    const newTab: RequestTab = {
      id: this.generateId(),
      name: newRequest.name,
      request: newRequest,
      isModified: false,
    };

    this.tabs.push(newTab);
    this.activeTabId = newTab.id;
    this.renderTabs();
    this.notifyTabChange();
    this.saveState();
  }

  private switchToTab(tabId: string): void {
    this.activeTabId = tabId;
    this.renderTabs();
    this.notifyTabChange();
    this.saveState();
  }

  private closeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    this.tabs.splice(tabIndex, 1);

    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
        this.activeTabId = this.tabs[newActiveIndex].id;
      } else {
        this.activeTabId = undefined;
      }
    }

    this.renderTabs();
    this.notifyTabChange();
    this.saveState();
  }

  private renderTabs(): void {
    const tabList = document.getElementById('request-tab-list');
    if (!tabList) return;

    tabList.innerHTML = '';

    // Add "New Request" button first (fixed position on left)
    const newTabButton = document.createElement('button');
    newTabButton.className = 'request-tab new-tab-button';
    newTabButton.dataset.tabId = 'new';
    newTabButton.textContent = '+ New Request';
    newTabButton.title = 'Create new request';
    tabList.appendChild(newTabButton);

    // Render existing tabs after the "New Request" button (to the right)
    this.tabs.forEach(tab => {
      const tabElement = document.createElement('button');
      tabElement.className = `request-tab ${tab.id === this.activeTabId ? 'active' : ''}`;
      tabElement.dataset.tabId = tab.id;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = tab.name + (tab.isModified ? ' •' : '');
      nameSpan.className = 'tab-name';

      const closeButton = document.createElement('span');
      closeButton.className = 'tab-close';
      closeButton.dataset.tabId = tab.id;
      closeButton.textContent = '×';
      closeButton.title = 'Close tab';

      tabElement.appendChild(nameSpan);
      tabElement.appendChild(closeButton);
      tabList.appendChild(tabElement);
    });
  }

  private notifyTabChange(): void {
    const activeTab = this.getActiveTab();
    const event = new CustomEvent('tab-changed', {
      detail: { activeTab }
    });
    document.dispatchEvent(event);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  setTabs(tabs: RequestTab[], activeTabId?: string): void {
    this.tabs = tabs;
    this.activeTabId = activeTabId;
    this.renderTabs();
  }

  getTabs(): RequestTab[] {
    return this.tabs;
  }

  getActiveTab(): RequestTab | undefined {
    return this.tabs.find(tab => tab.id === this.activeTabId);
  }

  getActiveTabId(): string | undefined {
    return this.activeTabId;
  }

  updateActiveTab(updates: Partial<RequestTab>, markAsModified: boolean = true): void {
    if (!this.activeTabId) return;

    const tabIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
    if (tabIndex !== -1) {
      const currentTab = this.tabs[tabIndex];
      this.tabs[tabIndex] = {
        ...currentTab,
        ...updates,
        isModified: markAsModified ? true : currentTab.isModified
      };
      this.renderTabs();
      this.saveState();
    }
  }

  private saveState(): void {
    // Trigger a state save by dispatching an event
    const event = new CustomEvent('tabs-changed', {
      detail: {
        tabs: this.tabs,
        activeTabId: this.activeTabId
      }
    });
    document.dispatchEvent(event);
  }

  openRequestInTab(request: ApiRequest): void {
    // Check if request is already open in a tab
    const existingTab = this.tabs.find(tab => tab.request.id === request.id);

    if (existingTab) {
      // Switch to existing tab
      this.activeTabId = existingTab.id;
      this.renderTabs();
      this.notifyTabChange();
      this.saveState();
    } else {
      // Create new tab for this request
      const newTab: RequestTab = {
        id: this.generateId(),
        name: request.name,
        request: { ...request }, // Clone the request
        isModified: false,
      };

      this.tabs.push(newTab);
      this.activeTabId = newTab.id;
      this.renderTabs();
      this.notifyTabChange();
      this.saveState();
    }
  }

  closeTabsByRequestId(requestId: string): void {
    // Find all tabs with this request ID
    const tabsToClose = this.tabs.filter(tab => tab.request.id === requestId);

    if (tabsToClose.length === 0) return;

    // Remove all matching tabs
    this.tabs = this.tabs.filter(tab => tab.request.id !== requestId);

    // If the active tab was one of the closed tabs, update the active tab
    const wasActiveTabClosed = tabsToClose.some(tab => tab.id === this.activeTabId);
    if (wasActiveTabClosed) {
      if (this.tabs.length > 0) {
        this.activeTabId = this.tabs[0].id;
      } else {
        this.activeTabId = undefined;
      }
    }

    this.renderTabs();
    this.notifyTabChange();
    this.saveState();
  }
}