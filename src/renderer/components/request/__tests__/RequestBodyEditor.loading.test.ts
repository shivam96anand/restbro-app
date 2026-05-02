/**
 * @vitest-environment jsdom
 *
 * Regression tests for the request-body mutation bug:
 *
 * When switching tabs, `clearEditors()` was called after `setCurrentRequest(tabB)`
 * had already pointed `currentRequest` at the new tab's request.  The body
 * editor fired `onBodyChange` (with Tab A's stale content) during the clear,
 * causing the new request's collection entry to be overwritten with Tab A's body.
 *
 * Fix: `beginLoad()` / `endLoad()` suppress all `onBodyChange` /
 * `onContentTypeChange` callbacks during programmatic loading (`setBody`,
 * `clear`, `clearEditors`).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal DOM environment – jsdom is configured globally in vitest.config.ts.

// We import the class directly so no Monaco / Electron mocks are needed.
// The Monaco editor paths are guarded by the JSDOM environment (they won't
// be reachable from the unit test) but we still need to stub the imports.

vi.mock('../MonacoJsonEditor', () => ({
  MonacoJsonEditor: vi.fn().mockImplementation(() => ({
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    focus: vi.fn(),
    dispose: vi.fn(),
    saveViewState: vi.fn(() => null),
    restoreViewState: vi.fn(),
  })),
}));

vi.mock('../MonacoXmlEditor', () => ({
  MonacoXmlEditor: vi.fn().mockImplementation(() => ({
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    focus: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('../variable-helper', () => ({
  addVariableTooltips: vi.fn(),
  detectVariables: vi.fn(() => []),
}));

vi.mock('../variable-autocomplete', () => ({
  setupAutocomplete: vi.fn(),
}));

import { RequestBodyEditor } from '../RequestBodyEditor';

function makeContainer(): HTMLElement {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

describe('RequestBodyEditor – programmatic loading suppresses onBodyChange', () => {
  let container: HTMLElement;
  let onBodyChange: ReturnType<typeof vi.fn>;
  let onContentTypeChange: ReturnType<typeof vi.fn>;
  let editor: RequestBodyEditor;

  beforeEach(() => {
    container = makeContainer();
    onBodyChange = vi.fn();
    onContentTypeChange = vi.fn();

    editor = new RequestBodyEditor(container, {
      onBodyChange,
      onContentTypeChange,
      onStatusUpdate: vi.fn(),
    });

    // Clear call count from construction
    onBodyChange.mockClear();
    onContentTypeChange.mockClear();
  });

  it('setBody() does not fire onBodyChange', () => {
    editor.setBody({ type: 'raw', content: '{"foo":"bar"}', format: 'json' });
    expect(onBodyChange).not.toHaveBeenCalled();
  });

  it('clear() does not fire onBodyChange', () => {
    editor.setBody({ type: 'raw', content: '{"foo":"bar"}', format: 'json' });
    onBodyChange.mockClear();

    editor.clear();
    expect(onBodyChange).not.toHaveBeenCalled();
  });

  it('setForcedContentType inside beginLoad/endLoad does not fire onBodyChange', () => {
    editor.beginLoad();
    editor.setForcedContentType('application/json');
    editor.endLoad();
    expect(onBodyChange).not.toHaveBeenCalled();
  });

  it('isLoadingBody is false when not inside beginLoad/endLoad', () => {
    // Verify the guard flag is off by default so user edits can fire normally
    expect(editor['loadingDepth']).toBe(0);
    expect(editor['isLoadingBody']).toBe(false);
  });

  it('nested beginLoad/endLoad depth is tracked correctly', () => {
    editor.beginLoad();
    editor.beginLoad();
    expect(editor['loadingDepth']).toBe(2);

    editor.endLoad();
    expect(editor['loadingDepth']).toBe(1);
    expect(editor['isLoadingBody']).toBe(true);

    editor.endLoad();
    expect(editor['loadingDepth']).toBe(0);
    expect(editor['isLoadingBody']).toBe(false);
  });

  it('endLoad() never goes below 0', () => {
    editor.endLoad(); // called without matching beginLoad
    expect(editor['loadingDepth']).toBe(0);
  });

  it('sequential setBody calls do not leak loading state', () => {
    editor.setBody({ type: 'raw', content: '{}', format: 'json' });
    editor.setBody({ type: 'none', content: '' });

    // After both calls loadingDepth must be 0 so user edits can fire
    expect(editor['loadingDepth']).toBe(0);
    expect(editor['isLoadingBody']).toBe(false);
  });
});
