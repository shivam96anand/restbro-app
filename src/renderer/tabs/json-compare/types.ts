/**
 * Core type definitions for JSON Compare feature
 */

export type DiffChangeType = 'added' | 'removed' | 'changed';

export interface DiffRow {
  path: string;
  type: DiffChangeType;
  leftValue?: unknown;
  rightValue?: unknown;
}

export interface DiffDecoration {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  type: DiffChangeType;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
  totalTime: number;
}

export interface DiffResult {
  rows: DiffRow[];
  leftDecorations: DiffDecoration[];
  rightDecorations: DiffDecoration[];
  stats: DiffStats;
}

export interface CompareState {
  leftJson: string;
  rightJson: string;
  tableFilter: string;
  selectedTypes: DiffChangeType[];
}

export interface WorkerRequest {
  type: 'diff';
  leftJson: string;
  rightJson: string;
}

export interface WorkerResponse {
  type: 'diff-result' | 'error';
  result?: DiffResult;
  error?: string;
}