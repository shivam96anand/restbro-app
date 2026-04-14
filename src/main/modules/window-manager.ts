import { BrowserWindow, app } from 'electron';
import { join } from 'path';

class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: join(__dirname, '../../../preload/index.js'),
      },
      titleBarStyle: 'hiddenInset',
      show: false,
    });

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.maximize();
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.loadFile(join(__dirname, '../../../renderer/index.html'));

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  closeAllWindows(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }
}

export const windowManager = new WindowManager();
