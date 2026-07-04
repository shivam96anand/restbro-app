import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson } from '../notepad-json';

describe('formatJson', () => {
  it('pretty-prints valid JSON with 2-space indent by default', () => {
    const result = formatJson('{"a":1,"b":[2,3]}');
    expect(result.ok).toBe(true);
    expect(result.text).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('honours a custom indent', () => {
    const result = formatJson('{"a":1}', 4);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('{\n    "a": 1\n}');
  });

  it('returns the raw text and ok:false on invalid JSON', () => {
    const raw = '{ not json }';
    const result = formatJson(raw);
    expect(result.ok).toBe(false);
    expect(result.text).toBe(raw);
    expect(result.error).toBeTruthy();
  });

  it('treats an empty string as invalid and preserves it', () => {
    const result = formatJson('');
    expect(result.ok).toBe(false);
    expect(result.text).toBe('');
  });
});

describe('minifyJson', () => {
  it('collapses valid JSON to a single line', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": [2, 3]\n}');
    expect(result.ok).toBe(true);
    expect(result.text).toBe('{"a":1,"b":[2,3]}');
  });

  it('returns the raw text and ok:false on invalid JSON', () => {
    const raw = 'nope';
    const result = minifyJson(raw);
    expect(result.ok).toBe(false);
    expect(result.text).toBe(raw);
  });
});
