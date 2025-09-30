/**
 * Virtualized table component for displaying JSON differences
 */

import React, { useMemo, useState } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import type { DiffRow, DiffChangeType } from '../types';
import './DiffTable.css';

interface DiffTableProps {
  rows: DiffRow[];
  onRowClick: (path: string, type: DiffChangeType) => void;
}

const DiffTable: React.FC<DiffTableProps> = ({ rows, onRowClick }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<DiffChangeType[]>(['added', 'removed', 'changed']);

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Type filter
      if (!selectedTypes.includes(row.type)) return false;

      // Search filter
      if (searchFilter) {
        const lower = searchFilter.toLowerCase();
        const matchPath = row.path.toLowerCase().includes(lower);
        const matchLeft = JSON.stringify(row.leftValue).toLowerCase().includes(lower);
        const matchRight = JSON.stringify(row.rightValue).toLowerCase().includes(lower);
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

    return (
      <div
        style={style}
        className="diff-row"
        onClick={() => onRowClick(row.path, row.type)}
      >
        <div className="diff-cell path-cell">
          <span className="path-text">{row.path || '/'}</span>
          <button
            className="copy-path-btn"
            onClick={(e) => copyPath(row.path, e)}
            title="Copy path"
          >
            📋
          </button>
        </div>
        <div className="diff-cell type-cell">
          <span className={`type-badge ${getTypeBadgeClass(row.type)}`}>
            {getTypeLabel(row.type)}
          </span>
        </div>
        <div className={`diff-cell value-cell ${row.type === 'added' ? 'disabled' : ''}`}>
          {renderValue(row.leftValue)}
        </div>
        <div className={`diff-cell value-cell ${row.type === 'removed' ? 'disabled' : ''}`}>
          {renderValue(row.rightValue)}
        </div>
      </div>
    );
  };

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
            className={`response-action-btn ${selectedTypes.includes('added') ? 'active' : ''}`}
            onClick={() => toggleType('added')}
          >
            ADDED
          </button>
          <button
            className={`response-action-btn ${selectedTypes.includes('removed') ? 'active' : ''}`}
            onClick={() => toggleType('removed')}
          >
            REMOVED
          </button>
          <button
            className={`response-action-btn ${selectedTypes.includes('changed') ? 'active' : ''}`}
            onClick={() => toggleType('changed')}
          >
            CHANGED
          </button>
        </div>
        <span className="diff-count">
          {filteredRows.length} of {rows.length} differences
        </span>
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
        <VirtualList
          height={400}
          itemCount={filteredRows.length}
          itemSize={80}
          width="100%"
          overscanCount={5}
        >
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