/**
 * Main JSON Compare Tab component
 * Layout: editors on top (split), diff table below
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import JsonEditor, { JsonEditorRef } from './components/JsonEditor';
import DiffTable from './components/DiffTable';
import { useJsonDiff } from './hooks/useJsonDiff';
import { loadCompareState, saveCompareState } from './state/persist';
import type { DiffChangeType } from './types';
import './styles.css';

const JsonCompareTab: React.FC = () => {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [leftValid, setLeftValid] = useState(true);
  const [rightValid, setRightValid] = useState(true);
  const [leftError, setLeftError] = useState<string>('');
  const [rightError, setRightError] = useState<string>('');

  const leftEditorRef = useRef<JsonEditorRef>(null);
  const rightEditorRef = useRef<JsonEditorRef>(null);

  const { status, result, error, compute } = useJsonDiff(leftJson, rightJson, leftValid, rightValid);

  // Load persisted state on mount
  useEffect(() => {
    const state = loadCompareState();
    setLeftJson(state.leftJson);
    setRightJson(state.rightJson);
  }, []);

  // Save state on changes (debounced via effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCompareState({
        leftJson,
        rightJson,
        tableFilter: '',
        selectedTypes: ['added', 'removed', 'changed']
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [leftJson, rightJson]);

  // Handlers
  const handleSwap = () => {
    const temp = leftJson;
    setLeftJson(rightJson);
    setRightJson(temp);
  };

  const handleClear = () => {
    setLeftJson('');
    setRightJson('');
  };

  const handleCopyLeft = () => {
    navigator.clipboard.writeText(leftJson);
  };

  const handleCopyRight = () => {
    navigator.clipboard.writeText(rightJson);
  };

  const handleRowClick = useCallback((path: string, type: DiffChangeType) => {
    if (type === 'removed' || type === 'changed') {
      leftEditorRef.current?.revealPath(path);
    }
    if (type === 'added' || type === 'changed') {
      rightEditorRef.current?.revealPath(path);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Enter to force compare
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        compute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [compute]);

  const diffCount = result?.rows.length || 0;
  const diffTime = result?.stats.totalTime || 0;

  return (
    <div className="json-compare-container">
      {/* Header */}
      <div className="json-compare-header">
        <div className="header-top">
          <h3 className="header-title">JSON Compare</h3>
          <div className="header-status">
            {status === 'success' && (
              <span className="status-info">
                Compared {diffCount} differences in {diffTime.toFixed(0)} ms
              </span>
            )}
            {status === 'computing' && (
              <span className="status-computing">Computing...</span>
            )}
            {status === 'error' && (
              <span className="status-error">Error: {error}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="response-actions">
          <button className="response-action-btn" onClick={handleSwap} title="Swap sides">
            SWAP
          </button>
          <button className="response-action-btn" onClick={handleClear} title="Clear both editors">
            CLEAR
          </button>
          <button className="response-action-btn" onClick={handleCopyLeft} title="Copy left JSON">
            COPY LEFT
          </button>
          <button className="response-action-btn" onClick={handleCopyRight} title="Copy right JSON">
            COPY RIGHT
          </button>
          <span className="actions-hint">
            Auto-compare enabled • Cmd/Ctrl+Enter to force
          </span>
        </div>
      </div>

      {/* Editors */}
      <div className="editors-container">
        <div className="editor-pane">
          <JsonEditor
            ref={leftEditorRef}
            value={leftJson}
            onChange={setLeftJson}
            label="Left JSON"
            decorations={result?.leftDecorations || []}
            onValidityChange={(valid, err) => {
              setLeftValid(valid);
              setLeftError(err || '');
            }}
          />
        </div>
        <div className="editor-pane">
          <JsonEditor
            ref={rightEditorRef}
            value={rightJson}
            onChange={setRightJson}
            label="Right JSON"
            decorations={result?.rightDecorations || []}
            onValidityChange={(valid, err) => {
              setRightValid(valid);
              setRightError(err || '');
            }}
          />
        </div>
      </div>

      {/* Diff Table */}
      <div className="diff-table-container">
        {(!leftValid || !rightValid) ? (
          <div className="empty-state">
            <p>Fix JSON errors to see differences</p>
          </div>
        ) : (
          <DiffTable rows={result?.rows || []} onRowClick={handleRowClick} />
        )}
      </div>
    </div>
  );
};

export default JsonCompareTab;