/**
 * Unit tests for diff mapping utilities
 */

import { describe, it, expect } from 'vitest';
import { buildDiffRows, toJsonPointer, findTextRangeForPath } from '../utils/diffMap';

describe('toJsonPointer', () => {
  it('should convert empty path to empty string', () => {
    expect(toJsonPointer([])).toBe('');
  });

  it('should convert simple path', () => {
    expect(toJsonPointer(['user', 'name'])).toBe('/user/name');
  });

  it('should escape special characters', () => {
    expect(toJsonPointer(['path/with/slash'])).toBe('/path~1with~1slash');
    expect(toJsonPointer(['path~with~tilde'])).toBe('/path~0with~0tilde');
  });

  it('should handle numeric array indices', () => {
    expect(toJsonPointer(['items', '0', 'id'])).toBe('/items/0/id');
  });
});

describe('buildDiffRows', () => {
  it('should handle empty delta', () => {
    expect(buildDiffRows(undefined)).toEqual([]);
    expect(buildDiffRows({})).toEqual([]);
  });

  it('should detect added values', () => {
    const delta = {
      newField: ['value']
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: '/newField',
      type: 'added',
      rightValue: 'value'
    });
  });

  it('should detect removed values', () => {
    const delta = {
      oldField: ['oldValue', 0, 0]
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: '/oldField',
      type: 'removed',
      leftValue: 'oldValue'
    });
  });

  it('should detect changed values', () => {
    const delta = {
      field: ['oldValue', 'newValue']
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: '/field',
      type: 'changed',
      leftValue: 'oldValue',
      rightValue: 'newValue'
    });
  });

  it('should handle nested objects', () => {
    const delta = {
      user: {
        name: ['Alice', 'Bob']
      }
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: '/user/name',
      type: 'changed',
      leftValue: 'Alice',
      rightValue: 'Bob'
    });
  });

  it('should handle multiple changes', () => {
    const delta = {
      added: ['newValue'],
      removed: ['oldValue', 0, 0],
      changed: [10, 20]
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(3);
    expect(rows.map(r => r.type).sort()).toEqual(['added', 'changed', 'removed']);
  });

  it('should handle number vs string changes', () => {
    const delta = {
      id: [123, '123']
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: '/id',
      type: 'changed',
      leftValue: 123,
      rightValue: '123'
    });
  });

  it('should handle null vs undefined', () => {
    const delta = {
      field1: [null, 'value'],
      field2: [undefined, 'value']
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(2);
    expect(rows[0].leftValue).toBe(null);
    expect(rows[1].leftValue).toBe(undefined);
  });

  it('should handle array changes', () => {
    const delta = {
      items: {
        '0': ['item1', 'item1-modified'],
        '2': ['item3']
      }
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(2);
    expect(rows[0].path).toBe('/items/0');
    expect(rows[0].type).toBe('changed');
    expect(rows[1].path).toBe('/items/2');
    expect(rows[1].type).toBe('added');
  });

  it('should skip jsondiffpatch meta keys', () => {
    const delta = {
      _t: 'a',
      field: ['value']
    };
    const rows = buildDiffRows(delta);
    expect(rows).toHaveLength(1);
    expect(rows[0].path).toBe('/field');
  });
});

describe('findTextRangeForPath', () => {
  it('should return null for invalid JSON', () => {
    const result = findTextRangeForPath('invalid json', '/field');
    expect(result).toBeNull();
  });

  it('should find root path', () => {
    const json = '{"a": 1}';
    const result = findTextRangeForPath(json, '');
    expect(result).not.toBeNull();
    expect(result?.startLine).toBe(1);
  });

  it('should approximate field position', () => {
    const json = '{"name": "Alice", "age": 30}';
    const result = findTextRangeForPath(json, '/name');
    // Approximate matching - just verify it returns something
    expect(result).not.toBeNull();
  });

  it('should handle nested paths', () => {
    const json = '{"user": {"name": "Alice"}}';
    const result = findTextRangeForPath(json, '/user/name');
    expect(result).not.toBeNull();
  });

  it('should handle multiline JSON', () => {
    const json = `{
  "user": {
    "name": "Alice"
  }
}`;
    const result = findTextRangeForPath(json, '/user/name');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.startLine).toBeGreaterThan(1);
    }
  });
});