import { Theme } from '../../shared/types';

const themes: Record<string, Theme> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: '#007acc',
      secondary: '#6c757d',
      background: '#1e1e1e',
      surface: '#252526',
      accent: '#0e639c',
      text: '#cccccc',
      textSecondary: '#9d9d9d',
      border: '#3c3c3c',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    }
  },
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      primary: '#0066cc',
      secondary: '#6c757d',
      background: '#ffffff',
      surface: '#f8f9fa',
      accent: '#0052a3',
      text: '#333333',
      textSecondary: '#666666',
      border: '#dee2e6',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    }
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    colors: {
      primary: '#9c27b0',
      secondary: '#6c757d',
      background: '#1a1a2e',
      surface: '#16213e',
      accent: '#7b1fa2',
      text: '#e1bee7',
      textSecondary: '#ba68c8',
      border: '#512da8',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    }
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    colors: {
      primary: '#2196f3',
      secondary: '#6c757d',
      background: '#0d1421',
      surface: '#1e2933',
      accent: '#1976d2',
      text: '#bbdefb',
      textSecondary: '#90caf9',
      border: '#1565c0',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    }
  }
};

export class ThemeManager {
  private currentTheme: string = 'dark';

  async initialize(): Promise<void> {
    try {
      const settings = await window.electronAPI.getSettings();
      this.setTheme(settings.theme || 'dark');
    } catch (error) {
      console.warn('Failed to load theme settings, using default:', error);
      this.setTheme('dark');
    }

    this.setupThemeSelector();
  }

  setTheme(themeId: string): void {
    if (!themes[themeId]) {
      console.warn(`Theme ${themeId} not found, using dark theme`);
      themeId = 'dark';
    }

    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Update theme selector
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.value = themeId;
    }

    // Save theme preference
    this.saveThemePreference(themeId);
  }

  getCurrentTheme(): Theme {
    return themes[this.currentTheme];
  }

  getAvailableThemes(): Theme[] {
    return Object.values(themes);
  }

  private setupThemeSelector(): void {
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        this.setTheme(target.value);
      });
    }
  }

  private async saveThemePreference(themeId: string): Promise<void> {
    try {
      await window.electronAPI.saveSettings({ theme: themeId });
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }
}
