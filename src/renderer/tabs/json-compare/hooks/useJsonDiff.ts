/**
 * Hook to manage JSON diff computation via Web Worker
 * Handles debouncing, worker lifecycle, and result caching
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DiffResult, DiffStats, WorkerRequest, WorkerResponse } from '../types';

interface UseJsonDiffOptions {
  debounceMs?: number;
}

interface UseJsonDiffResult {
  status: 'idle' | 'computing' | 'success' | 'error';
  result: DiffResult | null;
  error: string | null;
  compute: () => void;
}

export function useJsonDiff(
  leftJson: string,
  rightJson: string,
  leftValid: boolean,
  rightValid: boolean,
  options: UseJsonDiffOptions = {}
): UseJsonDiffResult {
  const { debounceMs = 300 } = options;

  const [status, setStatus] = useState<'idle' | 'computing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputRef = useRef({ leftJson: '', rightJson: '' });

  // Initialize worker
  useEffect(() => {
    // Create worker from separate file
    workerRef.current = new Worker(
      new URL('../worker/diffWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, result: workerResult, error: workerError } = e.data;

      if (type === 'diff-result' && workerResult) {
        setResult(workerResult);
        setStatus('success');
        setError(null);
      } else if (type === 'error') {
        setError(workerError || 'Unknown error');
        setStatus('error');
        setResult(null);
      }
    };

    workerRef.current.onerror = (err) => {
      setError(err.message);
      setStatus('error');
    };

    return () => {
      workerRef.current?.terminate();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Compute diff function
  const compute = useCallback(() => {
    if (!leftValid || !rightValid) {
      setResult(null);
      setStatus('idle');
      return;
    }

    if (!leftJson.trim() || !rightJson.trim()) {
      setResult(null);
      setStatus('idle');
      return;
    }

    // Check if inputs actually changed
    if (lastInputRef.current.leftJson === leftJson && lastInputRef.current.rightJson === rightJson) {
      return;
    }

    lastInputRef.current = { leftJson, rightJson };

    setStatus('computing');
    setError(null);

    const request: WorkerRequest = {
      type: 'diff',
      leftJson,
      rightJson
    };

    workerRef.current?.postMessage(request);
  }, [leftJson, rightJson, leftValid, rightValid]);

  // Auto-compute with debounce
  useEffect(() => {
    if (!leftValid || !rightValid) {
      setResult(null);
      setStatus('idle');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      compute();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [leftJson, rightJson, leftValid, rightValid, debounceMs, compute]);

  return {
    status,
    result,
    error,
    compute
  };
}