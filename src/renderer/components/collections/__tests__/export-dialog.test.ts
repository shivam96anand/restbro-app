import { describe, expect, it } from 'vitest';
import { getExportRootIds } from '../export-dialog';
import type { Collection } from '../../../../shared/types';

function folder(id: string, name: string, parentId: string | undefined, children: Collection[]): Collection {
  return {
    id,
    name,
    type: 'folder',
    parentId,
    children,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function request(id: string, name: string, parentId: string | undefined): Collection {
  return {
    id,
    name,
    type: 'request',
    parentId,
    request: { id: `req-${id}`, name, method: 'GET' as const, url: 'https://example.com', headers: {} },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('export-dialog getExportRootIds', () => {
  it('returns only top-level checked ids when no ancestors are checked', () => {
    const collections: Collection[] = [
      folder('f1', 'F1', undefined, []),
      folder('f2', 'F2', undefined, []),
      request('r1', 'R1', undefined),
    ];
    const checked = new Set(['f1', 'r1']);

    expect(getExportRootIds(collections, checked)).toEqual(['f1', 'r1']);
  });

  it('returns only the root when a whole subtree is checked', () => {
    const collections: Collection[] = [
      folder('f1', 'F1', undefined, []),
      folder('f2', 'F2', 'f1', []),
      request('r1', 'R1', 'f2'),
    ];
    const checked = new Set(['f1', 'f2', 'r1']);

    expect(getExportRootIds(collections, checked)).toEqual(['f1']);
  });

  it('returns multiple roots when disjoint subtrees are checked', () => {
    const collections: Collection[] = [
      folder('f1', 'F1', undefined, []),
      folder('f2', 'F2', 'f1', []),
      request('r1', 'R1', 'f2'),
      folder('f3', 'F3', undefined, []),
      request('r2', 'R2', 'f3'),
    ];
    const checked = new Set(['f2', 'r1', 'f3', 'r2']);

    const roots = getExportRootIds(collections, checked);
    expect(roots).toContain('f2');
    expect(roots).toContain('f3');
    expect(roots).toHaveLength(2);
  });

  it('returns empty array when nothing is checked', () => {
    const collections: Collection[] = [
      folder('f1', 'F1', undefined, []),
    ];
    expect(getExportRootIds(collections, new Set())).toEqual([]);
  });

  it('returns single request as root when only that request is checked', () => {
    const collections: Collection[] = [
      folder('f1', 'F1', undefined, []),
      request('r1', 'R1', 'f1'),
    ];
    const checked = new Set(['r1']);

    expect(getExportRootIds(collections, checked)).toEqual(['r1']);
  });
});
