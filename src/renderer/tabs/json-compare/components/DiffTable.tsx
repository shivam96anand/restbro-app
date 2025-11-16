/**
 * Virtualized table component for displaying JSON differences
 */

import React, { useMemo, useState } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import type { DiffRow, DiffChangeType } from '../types';
import './DiffTable.css';

interface DiffTableProps {
  rows: DiffRow[];
  onNavigate: (path: string, side: 'left' | 'right') => void;
}

const DiffTable: React.FC<DiffTableProps> = ({ rows, onNavigate }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<DiffChangeType[]>(['added', 'removed', 'changed']);

  const normalizeSearch = (value: string) => value.toLowerCase();
  const stringifyValue = (value: unknown): string => {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Type filter
      if (!selectedTypes.includes(row.type)) return false;

      // Search filter
      if (searchFilter) {
        const lower = normalizeSearch(searchFilter);
        const matchPath = (row.path || '').toLowerCase().includes(lower);
        const matchLeft = stringifyValue(row.leftValue).toLowerCase().includes(lower);
        const matchRight = stringifyValue(row.rightValue).toLowerCase().includes(lower);
        return matchPath || matchLeft || matchRight;
      }

      return true;
    });
  }, [rows, searchFilter, selectedTypes]);

  const toggleType = (type: DiffChangeType) => {
    if (selectedTypes.includes(type)) {
      // Don't allow deselecting all
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const copyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
  };

  const formatValue = (value: unknown): string => {
    if (value === undefined) return '(empty)';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  // Render value with syntax highlighting
  const renderValue = (value: unknown) => {
    const formatted = formatValue(value);

    // Apply syntax highlighting for JSON objects/arrays
    if (typeof value === 'object' && value !== null) {
      return (
        <pre
          className="value-text"
          dangerouslySetInnerHTML={{
            __html: highlightJSON(formatted)
          }}
        />
      );
    }

    return <pre className="value-text">{formatted}</pre>;
  };

  // Simple JSON syntax highlighter
  const highlightJSON = (json: string): string => {
    return json
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:') // Keys
      .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>') // String values
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>') // Numbers
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>') // Booleans
      .replace(/: (null)/g, ': <span class="json-null">$1</span>'); // Null
  };

  const getTypeLabel = (type: DiffChangeType): string => {
    switch (type) {
      case 'added': return 'Added';
      case 'removed': return 'Removed';
      case 'changed': return 'Changed';
    }
  };

  const getTypeBadgeClass = (type: DiffChangeType): string => {
    switch (type) {
      case 'added': return 'type-badge-added';
      case 'removed': return 'type-badge-removed';
      case 'changed': return 'type-badge-changed';
    }
  };

  // Virtualized row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = filteredRows[index];
    const leftDisabled = row.type === 'added';
    const rightDisabled = row.type === 'removed';

    const handleKeyJump = (e: React.KeyboardEvent, disabled: boolean, side: 'left' | 'right') => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavigate(row.path, side);
      }
    };

    return (
      <div
        style={style}
        className="diff-row"
      >
        <div className="diff-cell path-cell">
          <span className="path-text">{row.path || '/'}</span>
          <button
            className="copy-path-btn"
            onClick={(e) => copyPath(row.path, e)}
            title="Copy path"
          >
            ⧉
          </button>
        </div>
        <div className="diff-cell type-cell">
          <span className={`type-badge ${getTypeBadgeClass(row.type)}`}>
            {getTypeLabel(row.type)}
          </span>
        </div>
        <div
          className={`diff-cell value-cell left ${leftDisabled ? 'disabled' : 'clickable'}`}
          role={leftDisabled ? undefined : 'button'}
          tabIndex={leftDisabled ? -1 : 0}
          onClick={() => !leftDisabled && onNavigate(row.path, 'left')}
          onKeyDown={(e) => handleKeyJump(e, leftDisabled, 'left')}
        >
          {renderValue(row.leftValue)}
          {!leftDisabled && <span className="jump-pill">Navigate</span>}
        </div>
        <div
          className={`diff-cell value-cell right ${rightDisabled ? 'disabled' : 'clickable'}`}
          role={rightDisabled ? undefined : 'button'}
          tabIndex={rightDisabled ? -1 : 0}
          onClick={() => !rightDisabled && onNavigate(row.path, 'right')}
          onKeyDown={(e) => handleKeyJump(e, rightDisabled, 'right')}
        >
          {renderValue(row.rightValue)}
          {!rightDisabled && <span className="jump-pill">Navigate</span>}
        </div>
      </div>
    );
  };

  const estimatedHeight = filteredRows.length * 82;
  const rowHeight = 66;
  const maxVisibleRows = 5;
  const visibleRows = Math.min(filteredRows.length, maxVisibleRows);
  const listHeight = (visibleRows > 0 ? visibleRows : maxVisibleRows) * rowHeight;

  return (
    <div className="diff-table-wrapper">
      {/* Controls */}
      <div className="diff-table-controls">
        <input
          type="text"
          placeholder="Filter by path or value..."
          className="filter-input"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <div className="type-filters">
          <button
            className={`type-filter-btn ${selectedTypes.includes('added') ? 'active' : ''}`}
            onClick={() => toggleType('added')}
          >
            ADDED
          </button>
          <button
            className={`type-filter-btn ${selectedTypes.includes('removed') ? 'active' : ''}`}
            onClick={() => toggleType('removed')}
          >
            REMOVED
          </button>
          <button
            className={`type-filter-btn ${selectedTypes.includes('changed') ? 'active' : ''}`}
            onClick={() => toggleType('changed')}
          >
            CHANGED
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="diff-table-header">
        <div className="header-cell path-header">Path</div>
        <div className="header-cell type-header">Change Type</div>
        <div className="header-cell value-header">Left Value</div>
        <div className="header-cell value-header">Right Value</div>
      </div>

      {/* Virtualized Table Body */}
      {filteredRows.length > 0 ? (
        <VirtualList height={listHeight} itemCount={filteredRows.length} itemSize={rowHeight} width="100%" overscanCount={5}>
          {Row}
        </VirtualList>
      ) : (
        <div className="empty-table-state">
          <p>{rows.length === 0 ? 'No differences found' : 'No matches for current filters'}</p>
        </div>
      )}
    </div>
  );
};

export default DiffTable;
