/**
 * localStorage operations for viewer state persistence
 */

import { ViewerState } from './types';

const STORAGE_PREFIX = 'viewer:';

export class ViewerStateStorage {
  /**
   * Load state from localStorage
   */
  static loadState(storageKey: string): ViewerState | null {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedState = JSON.parse(stored) as ViewerState;
        // Ensure expandedNodes is a Set
        if (parsedState.prettyView.expandedNodes) {
          parsedState.prettyView.expandedNodes = new Set(
            Array.isArray(parsedState.prettyView.expandedNodes)
              ? parsedState.prettyView.expandedNodes
              : Array.from(parsedState.prettyView.expandedNodes)
          );
        }
        return parsedState;
      }
    } catch (error) {
      console.warn('Failed to load viewer state:', error);
    }
    return null;
  }

  /**
   * Save state to localStorage
   */
  static saveState(storageKey: string, state: ViewerState): boolean {
    try {
      // Convert Set to Array for JSON serialization
      const stateToSave = {
        ...state,
        prettyView: {
          ...state.prettyView,
          expandedNodes: Array.from(state.prettyView.expandedNodes),
        },
      };

      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      return true;
    } catch (error) {
      console.error('Failed to save viewer state:', error);
      return false;
    }
  }

  /**
   * Remove state from storage
   */
  static clearState(storageKey: string): void {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear viewer state:', error);
    }
  }

  /**
   * Clean up old viewer states to free storage space
   */
  static cleanupOldStates(currentStorageKey: string): void {
    try {
      const keysToRemove: string[] = [];
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX) && key !== currentStorageKey) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              // If no timestamp or very old, mark for removal
              if (!parsed.timestamp || parsed.timestamp < cutoffTime) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to cleanup old states:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage key for a request
   */
  static getStorageKey(requestId: string): string {
    return `${STORAGE_PREFIX}${requestId}`;
  }
}
