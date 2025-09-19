import './styles/main.scss';
import { ApiCourierAPI } from '../preload/index';
import { AppManager } from './components/app-manager';
import { TabsManager } from './components/tabs-manager';
import { CollectionsManager } from './components/collections-manager';
import { RequestManager } from './components/request-manager';
import { ResponseManager } from './components/response-manager';
import { ThemeManager } from './utils/theme-manager';
import { resizeManager } from './utils/resize-manager';

declare global {
  interface Window {
    apiCourier: ApiCourierAPI;
  }
}

class ApiCourierRenderer {
  private appManager: AppManager;
  private tabsManager: TabsManager;
  private collectionsManager: CollectionsManager;
  private requestManager: RequestManager;
  private responseManager: ResponseManager;
  private themeManager: ThemeManager;

  constructor() {
    this.themeManager = new ThemeManager();
    this.appManager = new AppManager();
    this.tabsManager = new TabsManager();
    this.collectionsManager = new CollectionsManager();
    this.requestManager = new RequestManager();
    this.responseManager = new ResponseManager();
  }

  async initialize(): Promise<void> {
    await this.loadInitialState();
    this.setupEventListeners();
    this.themeManager.initialize();
    this.appManager.initialize();
    this.tabsManager.initialize();
    this.collectionsManager.initialize();
    this.requestManager.initialize();
    this.responseManager.initialize();
    resizeManager.initialize();
    this.setupAutoSave();
  }

  private async loadInitialState(): Promise<void> {
    try {
      const state = await window.apiCourier.store.get();
      this.themeManager.setTheme(state.theme);
      this.collectionsManager.setCollections(state.collections);
      this.tabsManager.setTabs(state.openTabs, state.activeTabId);
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveState();
      }
    });

    // Listen for requests to be opened in tabs
    document.addEventListener('open-request-in-tab', (e: Event) => {
      const customEvent = e as CustomEvent;
      const request = customEvent.detail.request;
      if (request) {
        this.tabsManager.openRequestInTab(request);
      }
    });

    // Listen for tab changes to trigger state saves
    document.addEventListener('tabs-changed', () => {
      this.saveState();
    });
  }

  private setupAutoSave(): void {
    // Auto-save every 30 seconds to ensure no data loss
    setInterval(() => {
      this.saveState();
    }, 30000);
  }

  private async saveState(): Promise<void> {
    try {
      const state = {
        collections: this.collectionsManager.getCollections(),
        openTabs: this.tabsManager.getTabs(),
        activeTabId: this.tabsManager.getActiveTabId(),
        theme: this.themeManager.getCurrentTheme(),
      };
      await window.apiCourier.store.set(state);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new ApiCourierRenderer();
  await app.initialize();
});