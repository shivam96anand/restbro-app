import { describe, expect, it } from 'vitest';
import {
  buildFolderVars,
  resolveKeyValueArray,
  resolveObject,
  resolveTemplate,
  scanUnresolvedVars,
} from '../variables';

describe('variables.ts', () => {
  describe('resolveTemplate', () => {
    it('resolves variables using source precedence and defaults', () => {
      const result = resolveTemplate(
        '{{shared}} {{envOnly}} {{folderOnly}} {{globalOnly}} {{missing:fallback}} {{missing}}',
        {
          requestVars: { shared: 'request' },
          envVars: { shared: 'env', envOnly: 'env-value' },
          folderVars: { shared: 'folder', folderOnly: 'folder-value' },
          globalVars: { shared: 'global', globalOnly: 'global-value' },
        }
      );

      expect(result).toBe(
        'request env-value folder-value global-value fallback {{missing}}'
      );
    });

    it('resolves repeated placeholders and whitespace inside braces', () => {
      const result = resolveTemplate('{{ name }} -> {{name}}', {
        requestVars: { name: 'restbro' },
      });

      expect(result).toBe('restbro -> restbro');
    });

    it('supports nested resolution up to the default max depth', () => {
      const result = resolveTemplate('{{a}}', {
        requestVars: {
          a: '{{b}}',
          b: '{{c}}',
          c: 'done',
        },
      });

      expect(result).toBe('done');
    });

    it('stops resolving when maxDepth is reached', () => {
      const result = resolveTemplate('{{a}}', {
        requestVars: {
          a: '{{b}}',
          b: '{{c}}',
          c: 'done',
        },
        maxDepth: 2,
      });

      expect(result).toBe('{{c}}');
    });

    it('prevents infinite self-references from looping forever', () => {
      const result = resolveTemplate('{{loop}}', {
        requestVars: { loop: '{{loop}}' },
      });

      expect(result).toBe('{{loop}}');
    });

    it('URL-encodes resolved values when requested', () => {
      const encoded = resolveTemplate('{{term}}', {
        requestVars: { term: 'hello world/yes' },
        urlEncodeValues: true,
      });
      const plain = resolveTemplate('{{term}}', {
        requestVars: { term: 'hello world/yes' },
      });

      expect(encoded).toBe('hello%20world%2Fyes');
      expect(plain).toBe('hello world/yes');
    });

    it('handles nullish, empty, and plain string input gracefully', () => {
      expect(resolveTemplate(undefined as unknown as string)).toBe('');
      expect(resolveTemplate(null as unknown as string)).toBe('');
      expect(resolveTemplate('')).toBe('');
      expect(resolveTemplate('plain text')).toBe('plain text');
    });
  });

  describe('buildFolderVars', () => {
    const collections = [
      {
        id: 'root',
        type: 'folder',
        variables: { shared: 'root', rootOnly: 'root' },
      },
      {
        id: 'parent',
        type: 'folder',
        parentId: 'root',
        variables: { shared: 'parent', parentOnly: 'parent' },
      },
      {
        id: 'child',
        type: 'folder',
        parentId: 'parent',
        variables: { shared: 'child', childOnly: 'child' },
      },
      {
        id: 'request',
        type: 'request',
        parentId: 'child',
        variables: { ignored: 'request-var' },
      },
    ];

    it('returns an empty object when no collection id is provided or found', () => {
      expect(buildFolderVars(undefined, collections)).toEqual({});
      expect(buildFolderVars('missing', collections)).toEqual({});
    });

    it('merges ancestor folder variables from root to child', () => {
      expect(buildFolderVars('child', collections)).toEqual({
        shared: 'child',
        rootOnly: 'root',
        parentOnly: 'parent',
        childOnly: 'child',
      });
    });

    it('ignores variables on request items while still walking folder ancestors', () => {
      expect(buildFolderVars('request', collections)).toEqual({
        shared: 'child',
        rootOnly: 'root',
        parentOnly: 'parent',
        childOnly: 'child',
      });
    });

    it('stops traversal cleanly when a parent folder is missing', () => {
      expect(
        buildFolderVars('orphan', [
          {
            id: 'orphan',
            type: 'folder',
            parentId: 'missing-parent',
            variables: { only: 'value' },
          },
        ])
      ).toEqual({ only: 'value' });
    });
  });

  describe('resolveObject', () => {
    it('resolves template placeholders in keys and values', () => {
      expect(
        resolveObject(
          {
            'X-{{scope}}': '{{token}}',
            static: 'plain',
          },
          {
            envVars: { scope: 'Env' },
            requestVars: { token: 'secret' },
          }
        )
      ).toEqual({
        'X-Env': 'secret',
        static: 'plain',
      });
    });

    it('returns an empty object unchanged', () => {
      expect(resolveObject({})).toEqual({});
    });
  });

  describe('resolveKeyValueArray', () => {
    it('resolves key/value placeholders and preserves enabled flags', () => {
      expect(
        resolveKeyValueArray(
          [
            { key: 'X-{{name}}', value: '{{value}}', enabled: true },
            { key: 'Static', value: 'plain', enabled: false },
          ],
          {
            requestVars: { name: 'Trace', value: '123' },
          }
        )
      ).toEqual([
        { key: 'X-Trace', value: '123', enabled: true },
        { key: 'Static', value: 'plain', enabled: false },
      ]);
    });

    it('returns an empty array unchanged', () => {
      expect(resolveKeyValueArray([])).toEqual([]);
    });
  });

  describe('scanUnresolvedVars', () => {
    it('returns an empty array when all placeholders resolve', () => {
      expect(
        scanUnresolvedVars('https://{{host}}/{{path}}', {
          envVars: { host: 'example.com', path: 'users' },
        })
      ).toEqual([]);
    });

    it('returns unresolved variable names that remain after resolution', () => {
      expect(
        scanUnresolvedVars('{{known}} {{missingOne}} {{missingTwo}}', {
          requestVars: { known: 'value' },
        })
      ).toEqual(['missingOne', 'missingTwo']);
    });

    it('does not report variables that fall back to defaults', () => {
      expect(scanUnresolvedVars('{{missing:fallback}}')).toEqual([]);
    });

    it('returns an empty array for strings without placeholders', () => {
      expect(scanUnresolvedVars('plain text')).toEqual([]);
    });
  });
});
