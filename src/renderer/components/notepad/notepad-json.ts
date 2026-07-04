/**
 * Pure JSON transform helpers used by the Notepad JSON actions and the
 * "open JSON in Notepad" flow (which replaced the standalone JSON Viewer).
 *
 * Both helpers never throw: on invalid JSON they return the original text
 * unchanged with `ok: false` so callers can open the raw text and surface a
 * non-blocking warning.
 */

export interface JsonTransformResult {
  /** Transformed text, or the original input when parsing failed. */
  text: string;
  /** True when the input parsed as JSON and was transformed. */
  ok: boolean;
  /** Parser error message when `ok` is false. */
  error?: string;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Invalid JSON';
}

/**
 * Pretty-print JSON with the given indent (default 2 spaces), matching the
 * old JSON Viewer's "Format" behaviour.
 */
export function formatJson(text: string, indent = 2): JsonTransformResult {
  try {
    return { text: JSON.stringify(JSON.parse(text), null, indent), ok: true };
  } catch (e) {
    return { text, ok: false, error: errorMessage(e) };
  }
}

/** Collapse JSON to a single line with no insignificant whitespace. */
export function minifyJson(text: string): JsonTransformResult {
  try {
    return { text: JSON.stringify(JSON.parse(text)), ok: true };
  } catch (e) {
    return { text, ok: false, error: errorMessage(e) };
  }
}
