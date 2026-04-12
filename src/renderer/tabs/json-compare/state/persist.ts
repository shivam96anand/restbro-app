/**
 * Persistence layer for JSON Compare state
 * Uses localStorage with versioning
 */

import type { CompareState } from '../types';

const STORAGE_KEY = 'apiCourier.jsonCompare.v1';

const DEFAULT_STATE: CompareState = {
  leftJson: '',
  rightJson: '',
  tableFilter: '',
  selectedTypes: ['added', 'removed', 'changed'],
};

/**
 * Load compare state from localStorage
 */
export function loadCompareState(): CompareState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;

    const parsed = JSON.parse(stored) as CompareState;

    // Validate structure
    if (
      typeof parsed.leftJson === 'string' &&
      typeof parsed.rightJson === 'string' &&
      typeof parsed.tableFilter === 'string' &&
      Array.isArray(parsed.selectedTypes)
    ) {
      return parsed;
    }

    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Save compare state to localStorage
 */
export function saveCompareState(state: CompareState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save compare state:', error);
  }
}

/**
 * Clear persisted state
 */
export function clearCompareState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear compare state:', error);
  }
}
