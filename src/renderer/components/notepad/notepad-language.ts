/**
 * Map a file path to a Monaco language id based on extension.
 * Conservative — falls back to `plaintext` for unknown extensions.
 */
const EXT_TO_LANGUAGE: Record<string, string> = {
  json: 'json',
  jsonc: 'json',
  json5: 'json',
  md: 'markdown',
  markdown: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  sql: 'sql',
  ini: 'ini',
  toml: 'ini',
  conf: 'ini',
  env: 'ini',
  dockerfile: 'dockerfile',
  graphql: 'graphql',
  gql: 'graphql',
  proto: 'proto',
  log: 'plaintext',
  txt: 'plaintext',
  csv: 'plaintext',
};

export const PICKABLE_LANGUAGES: Array<{ id: string; label: string }> = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'swagger', label: 'Swagger/OpenAPI' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'xml', label: 'XML' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'shell', label: 'Shell' },
  { id: 'sql', label: 'SQL' },
  { id: 'ini', label: 'INI / TOML' },
  { id: 'graphql', label: 'GraphQL' },
];

/**
 * Preferred file extension for each pickable language. Used to pick a sensible
 * default file name in the Save dialog for a never-saved tab (e.g. a Markdown
 * tab defaults to `.md` instead of `.txt`).
 */
const LANGUAGE_TO_EXT: Record<string, string> = {
  plaintext: 'txt',
  markdown: 'md',
  swagger: 'yaml',
  json: 'json',
  yaml: 'yaml',
  xml: 'xml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  shell: 'sh',
  sql: 'sql',
  ini: 'ini',
  graphql: 'graphql',
};

/**
 * Map a Monaco language id to its preferred file extension (without the dot).
 * Falls back to `txt` for unknown or missing languages.
 */
export function extensionForLanguage(languageId: string | undefined): string {
  if (!languageId) return 'txt';
  return LANGUAGE_TO_EXT[languageId] ?? 'txt';
}

/**
 * Build a default Save-dialog file name from a tab title and its language.
 * The extension is derived from the language (see {@link extensionForLanguage})
 * so, e.g., a Markdown tab defaults to `Untitled.md` instead of `Untitled.txt`.
 * If the title already ends with that extension it is kept as-is, avoiding
 * duplicated suffixes like `response.json.json`.
 */
export function defaultFileName(
  title: string | undefined,
  language: string | undefined
): string {
  const ext = extensionForLanguage(language);
  const base = title?.trim() || 'Untitled';
  if (base.toLowerCase().endsWith(`.${ext}`)) return base;
  return `${base}.${ext}`;
}

export function detectLanguageFromPath(
  filePath: string | undefined
): string | undefined {
  if (!filePath) return undefined;
  const lower = filePath.toLowerCase();
  // Special filenames without an extension.
  if (lower.endsWith('/dockerfile') || lower === 'dockerfile') {
    return 'dockerfile';
  }
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return undefined;
  const ext = lower.slice(dot + 1);
  return EXT_TO_LANGUAGE[ext];
}

export function languageLabel(languageId: string | undefined): string {
  if (!languageId) return 'Plain Text';
  const found = PICKABLE_LANGUAGES.find((l) => l.id === languageId);
  return found?.label ?? languageId;
}

/**
 * Best-effort language detection from the document body. Conservative — only
 * returns a language when the heuristic is reasonably confident, otherwise
 * returns `undefined` (leave the current language untouched).
 *
 * Used to auto-detect after a paste so the user sees JSON/HTML/XML highlighting
 * without manually picking from the dropdown.
 */
export function detectLanguageFromContent(text: string): string | undefined {
  if (!text) return undefined;
  // Cap the slice we inspect — we only need a peek for structural cues.
  const head = text.trimStart().slice(0, 512);
  if (!head) return undefined;
  const tail = text.trimEnd().slice(-1);
  const first = head[0];

  // JSON: starts with { or [ AND parses cleanly. Use a length cap so we don't
  // try to parse multi-megabyte buffers on every keystroke.
  if ((first === '{' || first === '[') && (tail === '}' || tail === ']')) {
    if (text.length < 200_000) {
      try {
        JSON.parse(text);
        return 'json';
      } catch {
        // Fall through.
      }
    }
  }

  // XML / HTML
  if (first === '<') {
    if (/^<\?xml\b/i.test(head)) return 'xml';
    if (/^<!doctype\s+html\b|^<html\b|^<head\b|^<body\b/i.test(head)) {
      return 'html';
    }
    // Generic tag at the start — bias toward HTML for common tag names.
    if (
      /^<(?:div|span|p|a|h[1-6]|table|ul|ol|li|section|article|nav|header|footer|main|form|input|button|svg|img|script|style|link|meta|title)\b/i.test(
        head
      )
    ) {
      return 'html';
    }
    if (/^<[a-z][\w:-]*[\s>]/i.test(head)) return 'xml';
  }

  // Swagger/OpenAPI YAML or JSON
  if (
    /^\s*(openapi|swagger|info|paths|servers|components|definitions)\s*:/m.test(
      head
    )
  ) {
    // Check if it's an OpenAPI/Swagger spec by looking for common top-level keys
    if (
      /(openapi|swagger|info|paths)\s*:/m.test(head) ||
      (first === '{' && /["\'](?:openapi|swagger|paths|info)["\']/.test(head))
    ) {
      return 'swagger';
    }
  }

  // YAML document marker — but check first whether this is Markdown with YAML
  // frontmatter (opening ---, then key-value pairs, then closing ---, then Markdown).
  if (/^---\s*$/m.test(head.split('\n').slice(0, 3).join('\n'))) {
    const afterOpen = text.trimStart().slice(3); // skip the opening ---
    const closingMatch = afterOpen.match(/\n---\s*(\n|$)/);
    if (closingMatch && closingMatch.index !== undefined) {
      const afterFrontmatter = afterOpen
        .slice(closingMatch.index + closingMatch[0].length)
        .trimStart();
      if (/^(#{1,6}\s|\*\s|-\s|\d+\.\s|```)/m.test(afterFrontmatter)) {
        return 'markdown';
      }
    }
    return 'yaml';
  }

  // Markdown — headings, lists, fenced code blocks
  if (/^(#{1,6}\s|\*\s|-\s|\d+\.\s|```)/m.test(head)) return 'markdown';

  // Shell shebang
  if (/^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?(?:bash|sh|zsh)/.test(head)) {
    return 'shell';
  }
  if (/^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?python/.test(head)) return 'python';

  return undefined;
}
