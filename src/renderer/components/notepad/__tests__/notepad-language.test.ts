import { describe, it, expect } from 'vitest';
import {
  defaultFileName,
  detectLanguageFromContent,
  detectLanguageFromPath,
  extensionForLanguage,
  languageLabel,
  PICKABLE_LANGUAGES,
} from '../notepad-language';

describe('detectLanguageFromPath', () => {
  it('detects common extensions', () => {
    expect(detectLanguageFromPath('/x/foo.json')).toBe('json');
    expect(detectLanguageFromPath('foo.MD')).toBe('markdown');
    expect(detectLanguageFromPath('a/b/c.ts')).toBe('typescript');
    expect(detectLanguageFromPath('script.py')).toBe('python');
  });

  it('returns undefined for unknown or missing extensions', () => {
    expect(detectLanguageFromPath('README')).toBeUndefined();
    expect(detectLanguageFromPath(undefined)).toBeUndefined();
    expect(detectLanguageFromPath('mystery.qqq')).toBeUndefined();
  });
});

describe('detectLanguageFromContent', () => {
  it('returns undefined for empty / whitespace-only input', () => {
    expect(detectLanguageFromContent('')).toBeUndefined();
    expect(detectLanguageFromContent('   \n\n  ')).toBeUndefined();
  });

  it('detects valid JSON objects', () => {
    expect(detectLanguageFromContent('{"a":1,"b":[2,3]}')).toBe('json');
    expect(detectLanguageFromContent('  {\n  "x": "y"\n}\n')).toBe('json');
  });

  it('detects valid JSON arrays', () => {
    expect(detectLanguageFromContent('[1, 2, 3]')).toBe('json');
  });

  it('does not classify malformed JSON-looking text as JSON', () => {
    expect(detectLanguageFromContent('{ not json at all')).not.toBe('json');
  });

  it('detects HTML doctype / common tags', () => {
    expect(detectLanguageFromContent('<!doctype html><html></html>')).toBe(
      'html'
    );
    expect(detectLanguageFromContent('<html><body>Hi</body></html>')).toBe(
      'html'
    );
    expect(detectLanguageFromContent('<div class="x">hi</div>')).toBe('html');
  });

  it('detects XML declarations', () => {
    expect(detectLanguageFromContent('<?xml version="1.0"?><root/>')).toBe(
      'xml'
    );
  });

  it('detects YAML document marker', () => {
    expect(detectLanguageFromContent('---\nfoo: bar\n')).toBe('yaml');
  });

  it('detects Markdown with YAML frontmatter as markdown', () => {
    const withFrontmatter =
      '---\ntitle: My Doc\nauthor: Jane\n---\n\n# Hello\n\nSome content here.';
    expect(detectLanguageFromContent(withFrontmatter)).toBe('markdown');
  });

  it('keeps pure YAML (no markdown body after closing ---) as yaml', () => {
    expect(detectLanguageFromContent('---\nfoo: bar\nbaz: qux\n---\n')).toBe(
      'yaml'
    );
  });

  it('detects markdown headings and lists', () => {
    expect(detectLanguageFromContent('# Hello\n\nworld')).toBe('markdown');
    expect(detectLanguageFromContent('- item 1\n- item 2')).toBe('markdown');
    expect(detectLanguageFromContent('```js\nfoo\n```')).toBe('markdown');
  });

  it('detects shebangs', () => {
    expect(detectLanguageFromContent('#!/usr/bin/env bash\necho hi')).toBe(
      'shell'
    );
    expect(detectLanguageFromContent('#!/usr/bin/env python\nprint(1)')).toBe(
      'python'
    );
  });

  it('returns undefined for plain prose', () => {
    expect(
      detectLanguageFromContent('Just some notes I am writing today.')
    ).toBeUndefined();
  });

  it('does not parse multi-megabyte JSON payloads', () => {
    // Build a syntactically valid JSON longer than the parser cap.
    const big = '[' + '"x",'.repeat(60_000) + '"x"]';
    expect(big.length).toBeGreaterThan(200_000);
    // Should bail out instead of parsing — returns undefined, not 'json'.
    expect(detectLanguageFromContent(big)).toBeUndefined();
  });
});

describe('languageLabel', () => {
  it('falls back to Plain Text for undefined', () => {
    expect(languageLabel(undefined)).toBe('Plain Text');
  });

  it('returns the matching label for a known id', () => {
    expect(languageLabel('json')).toBe(
      PICKABLE_LANGUAGES.find((l) => l.id === 'json')!.label
    );
  });

  it('returns the id itself when not in PICKABLE_LANGUAGES', () => {
    expect(languageLabel('made-up')).toBe('made-up');
  });
});

describe('extensionForLanguage', () => {
  it('falls back to txt for undefined / unknown languages', () => {
    expect(extensionForLanguage(undefined)).toBe('txt');
    expect(extensionForLanguage('made-up')).toBe('txt');
  });

  it('maps common languages to their preferred extension', () => {
    expect(extensionForLanguage('markdown')).toBe('md');
    expect(extensionForLanguage('json')).toBe('json');
    expect(extensionForLanguage('yaml')).toBe('yaml');
    expect(extensionForLanguage('javascript')).toBe('js');
    expect(extensionForLanguage('typescript')).toBe('ts');
    expect(extensionForLanguage('python')).toBe('py');
    expect(extensionForLanguage('plaintext')).toBe('txt');
  });

  it('returns a non-empty extension for every pickable language', () => {
    for (const { id } of PICKABLE_LANGUAGES) {
      expect(extensionForLanguage(id)).toMatch(/^[a-z0-9]+$/);
    }
  });
});

describe('defaultFileName', () => {
  it('appends the language extension to an untitled tab', () => {
    expect(defaultFileName('Untitled', 'markdown')).toBe('Untitled.md');
    expect(defaultFileName('Untitled', 'json')).toBe('Untitled.json');
    expect(defaultFileName('Untitled', 'yaml')).toBe('Untitled.yaml');
  });

  it('defaults to .txt for plaintext / unknown / missing language', () => {
    expect(defaultFileName('Untitled', 'plaintext')).toBe('Untitled.txt');
    expect(defaultFileName('Untitled', undefined)).toBe('Untitled.txt');
    expect(defaultFileName('Untitled', 'made-up')).toBe('Untitled.txt');
  });

  it('does not duplicate an extension the title already has', () => {
    expect(defaultFileName('response.json', 'json')).toBe('response.json');
    expect(defaultFileName('README.MD', 'markdown')).toBe('README.MD');
  });

  it('falls back to Untitled for empty / whitespace titles', () => {
    expect(defaultFileName('', 'markdown')).toBe('Untitled.md');
    expect(defaultFileName('   ', undefined)).toBe('Untitled.txt');
  });
});
