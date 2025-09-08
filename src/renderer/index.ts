import './styles/main.scss';
import { UIManager } from './components/ui-manager';
import { CollectionsManager } from './components/collections-manager';
import { RequestManager } from './components/request-manager';
import { ResponseManager } from './components/response-manager';
import { ThemeManager } from './utils/theme-manager';
import { EventBus } from './utils/event-bus';

class ApiCourierRenderer {
  private uiManager: UIManager;
  private collectionsManager: CollectionsManager;
  private requestManager: RequestManager;
  private responseManager: ResponseManager;
  private themeManager: ThemeManager;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.themeManager = new ThemeManager();
    this.uiManager = new UIManager(this.eventBus);
    this.collectionsManager = new CollectionsManager(this.eventBus);
    this.requestManager = new RequestManager(this.eventBus);
    this.responseManager = new ResponseManager(this.eventBus);
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize theme
    await this.themeManager.initialize();
    
    // Initialize UI components
    this.uiManager.initialize();
    this.collectionsManager.initialize();
    this.requestManager.initialize();
    this.responseManager.initialize();
    
    // Load initial data
    await this.loadInitialData();
    
    console.log('API Courier initialized successfully');
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Load collections
      const collections = await window.electronAPI.getCollections();
      this.eventBus.emit('collections:loaded', collections);
      
      // Load settings
      const settings = await window.electronAPI.getSettings();
      this.eventBus.emit('settings:loaded', settings);
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ApiCourierRenderer();
});
