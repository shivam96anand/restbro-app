/**
 * Styles and colors for JSON node rendering
 */

import { JsonValueType } from './types';

export class JsonNodeStyles {
  static getValueColor(type: JsonValueType): string {
    const colors = {
      string: 'var(--json-string-color, #d73a49)',
      number: 'var(--json-number-color, #005cc5)',
      boolean: 'var(--json-boolean-color, #d73a49)',
      null: 'var(--json-null-color, #6f42c1)',
      object: 'var(--json-bracket-color, #24292e)',
      array: 'var(--json-bracket-color, #24292e)',
    };
    return colors[type] || 'var(--text-primary, #333)';
  }

  static getTypeBadgeColor(type: JsonValueType): string {
    const colors = {
      string: '#28a745',
      number: '#007bff',
      boolean: '#ffc107',
      null: '#6c757d',
      object: '#17a2b8',
      array: '#e83e8c',
    };
    return colors[type] || '#6c757d';
  }

  static readonly actionContainer = `
    display: inline-block;
    margin-left: 8px;
    position: relative;
    opacity: 0;
    transition: opacity 0.2s;
  `;

  static readonly actionTrigger = `
    background: none;
    border: none;
    padding: 2px 6px;
    cursor: pointer;
    border-radius: 3px;
    font-size: 12px;
    color: var(--text-secondary, #666);
  `;

  static readonly actionMenu = `
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--bg-primary, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    min-width: 150px;
    padding: 4px 0;
  `;

  static readonly actionItem = `
    display: block;
    width: 100%;
    padding: 6px 12px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-primary, #333);
  `;

  static getTypeBadgeStyle(type: JsonValueType): string {
    return `
      margin-left: 8px;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      background: ${this.getTypeBadgeColor(type)};
      color: #fff;
      text-transform: uppercase;
    `;
  }
}
