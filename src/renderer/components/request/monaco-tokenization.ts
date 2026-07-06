/**
 * Shared helper to eliminate Monaco's "white then colored" syntax-highlight flash.
 *
 * Monaco defers syntactic tokenization to a background scheduler, so a freshly
 * created editor paints its text with the default (white) foreground until that
 * async pass runs. Under main-thread contention (e.g. switching requests, or a
 * large response arriving) that pass can be queued behind other work and lag by
 * up to ~1s, producing a visible flash where JSON/XML keys start white and only
 * later pick up the theme color.
 *
 * Forcing tokenization of the initial viewport synchronously — in the same task
 * as editor creation, before the browser paints — makes the first paint already
 * colored. It is bounded so very large documents don't block the UI thread; the
 * remaining lines tokenize lazily in the background as the user scrolls.
 */

import type * as monaco from 'monaco-editor';

/**
 * `forceTokenization` lives on Monaco's runtime model (ITokenizationTextModelPart)
 * but is intentionally omitted from the public `monaco.d.ts`. Narrow the shape so
 * we stay type-safe (and feature-detect it) at this boundary instead of `any`.
 */
type TokenizableModel = monaco.editor.ITextModel & {
  tokenization?: {
    forceTokenization?: (lineNumber: number) => void;
  };
};

/**
 * Upper bound on lines tokenized synchronously. A viewport is only tens of lines;
 * a few hundred covers the initial view plus scroll headroom without freezing the
 * UI thread on very large payloads.
 */
const MAX_SYNC_TOKENIZE_LINES = 500;

/**
 * Synchronously tokenize the initial viewport of a just-created editor so its
 * first paint is already themed. Safe no-op if the runtime API is unavailable.
 */
export function forceInitialViewportTokenization(
  editor: monaco.editor.IStandaloneCodeEditor | null
): void {
  const model = editor?.getModel() as TokenizableModel | null | undefined;
  if (!model?.tokenization?.forceTokenization) return;

  const lines = Math.min(model.getLineCount(), MAX_SYNC_TOKENIZE_LINES);
  model.tokenization.forceTokenization(lines);
}
