import { BrowserWindow, screen } from 'electron';
import path from 'path';

export class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map();

  createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    const mainWindow = new BrowserWindow({
      width: Math.max(1200, Math.floor(width * 0.8)),
      height: Math.max(800, Math.floor(height * 0.8)),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/index.js'),
        webSecurity: true,
        sandbox: false,
      },
      show: false,
      titleBarStyle: 'default',
      frame: true,
      icon: this.getAppIcon(),
    });

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.on('closed', () => {
      this.windows.delete('main');
    });

    this.windows.set('main', mainWindow);
    return mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.windows.get('main') || null;
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  private getAppIcon(): string | undefined {
    // Return path to app icon based on platform
    const iconName = process.platform === 'win32' ? 'icon.ico' : 
                     process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
    
    const iconPath = path.join(__dirname, '../../assets/icons/', iconName);
    return iconPath;
  }
}
