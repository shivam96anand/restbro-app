/**
 * Global settings management for viewer (applies to all viewers)
 */

import { VIEWER_CONSTANTS } from './types';

const GLOBAL_SETTINGS_KEY = 'viewer:settings';

export interface GlobalSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  wrapText: boolean;
  showTypes: boolean;
}

export class ViewerGlobalSettings {
  /**
   * Get global settings that apply to all viewers
   */
  static getSettings(): GlobalSettings {
    try {
      const stored = localStorage.getItem(GLOBAL_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load global settings:', error);
    }

    return this.getDefaultSettings();
  }

  /**
   * Get default global settings
   */
  static getDefaultSettings(): GlobalSettings {
    return {
      theme: 'light',
      fontSize: VIEWER_CONSTANTS.DEFAULT_FONT_SIZE,
      wrapText: true,
      showTypes: true,
    };
  }

  /**
   * Save global settings
   */
  static saveSettings(settings: Partial<GlobalSettings>): GlobalSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };

    try {
      localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Failed to save global settings:', error);
      return current;
    }
  }

  /**
   * Update theme setting
   */
  static setTheme(theme: 'light' | 'dark'): void {
    this.saveSettings({ theme });
  }

  /**
   * Update font size setting
   */
  static setFontSize(fontSize: number): void {
    const clampedSize = Math.max(
      VIEWER_CONSTANTS.MIN_FONT_SIZE,
      Math.min(VIEWER_CONSTANTS.MAX_FONT_SIZE, fontSize)
    );
    this.saveSettings({ fontSize: clampedSize });
  }

  /**
   * Update text wrap setting
   */
  static setWrapText(wrapText: boolean): void {
    this.saveSettings({ wrapText });
  }

  /**
   * Update show types setting
   */
  static setShowTypes(showTypes: boolean): void {
    this.saveSettings({ showTypes });
  }
}
