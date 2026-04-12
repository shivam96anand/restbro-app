/**
 * Web Worker for JSON diff computation
 * Runs jsondiffpatch in background to avoid blocking UI
 */

import { create, DiffPatcher } from 'jsondiffpatch';
import { buildDiffRows } from '../utils/diffMap';
import type {
  WorkerRequest,
  WorkerResponse,
  DiffResult,
  DiffStats,
} from '../types';

function computeObjectHash(obj: unknown): string {
  if (!obj || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  const record = obj as Record<string, unknown>;
  const directId = record.id ?? record._id ?? record.uuid ?? record.guid;
  if (typeof directId === 'string' || typeof directId === 'number') {
    return String(directId);
  }

  const product = record.product as Record<string, unknown> | undefined;
  const nestedProductId = product?.id;
  if (
    typeof nestedProductId === 'string' ||
    typeof nestedProductId === 'number'
  ) {
    return String(nestedProductId);
  }

  return JSON.stringify(obj);
}

const differ: DiffPatcher = create({
  objectHash: computeObjectHash,
  arrays: { detectMove: true },
  textDiff: { minLength: Infinity },
});

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, leftJson, rightJson } = e.data;

  if (type !== 'diff') return;

  const startTime = performance.now();

  try {
    // Parse both JSONs
    let leftParsed: unknown;
    let rightParsed: unknown;

    try {
      leftParsed = JSON.parse(leftJson);
    } catch (err) {
      throw new Error(`Left JSON invalid: ${(err as Error).message}`);
    }

    try {
      rightParsed = JSON.parse(rightJson);
    } catch (err) {
      throw new Error(`Right JSON invalid: ${(err as Error).message}`);
    }

    // Compute diff
    const delta = differ.diff(leftParsed, rightParsed);

    // Build rows
    const rows = buildDiffRows(delta);

    // Compute stats
    const stats: DiffStats = {
      added: rows.filter((r) => r.type === 'added').length,
      removed: rows.filter((r) => r.type === 'removed').length,
      changed: rows.filter((r) => r.type === 'changed').length,
      totalTime: performance.now() - startTime,
    };

    const result: DiffResult = {
      rows,
      leftDecorations: [],
      rightDecorations: [],
      stats,
    };

    const response: WorkerResponse = {
      type: 'diff-result',
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      error: (error as Error).message,
    };
    self.postMessage(response);
  }
};
