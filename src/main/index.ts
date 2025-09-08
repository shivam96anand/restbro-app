import { app } from 'electron';
import { WindowManager } from './modules/window-manager';
import { IPCManager } from './modules/ipc-manager';
import { StoreManager } from './modules/store-manager';
import { RequestManager } from './modules/request-manager';

class ApiCourierApp {
  private windowManager: WindowManager;
  private ipcManager: IPCManager;
  private storeManager: StoreManager;
  private requestManager: RequestManager;

  constructor() {
    this.storeManager = new StoreManager();
    this.requestManager = new RequestManager();
    this.windowManager = new WindowManager();
    this.ipcManager = new IPCManager(this.storeManager, this.requestManager);
    
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.windowManager.createMainWindow();
      
      app.on('activate', () => {
        if (this.windowManager.getAllWindows().length === 0) {
          this.windowManager.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', async () => {
      await this.storeManager.flush();
    });
  }
}

// Initialize the application
new ApiCourierApp();
