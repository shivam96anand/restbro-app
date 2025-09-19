import { app, BrowserWindow } from 'electron';
import { windowManager } from './modules/window-manager';
import { storeManager } from './modules/store-manager';
import { ipcManager } from './modules/ipc-manager';

class ApiCourierApp {
  private isQuitting = false;

  async initialize(): Promise<void> {
    await app.whenReady();
    await storeManager.initialize();
    ipcManager.initialize();
    this.createWindow();
    this.setupEventHandlers();
  }

  private createWindow(): void {
    windowManager.createMainWindow();
  }

  private setupEventHandlers(): void {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('will-quit', async (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        await this.gracefulShutdown();
        this.isQuitting = true;
        app.quit();
      }
    });
  }

  private async gracefulShutdown(): Promise<void> {
    await storeManager.flush();
    windowManager.closeAllWindows();
  }

  private quit(): void {
    this.isQuitting = true;
    app.quit();
  }
}

const apiCourierApp = new ApiCourierApp();

if (require.main === module) {
  apiCourierApp.initialize().catch(console.error);
}