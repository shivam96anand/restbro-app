/**
 * Editor operations for RawEditor (format, minify, search, navigation)
 */

import { EditorView } from '@codemirror/view';
import { JsonUtils } from './utils/json';

export class RawEditorOperations {
  /**
   * Format JSON content
   */
  static async format(currentContent: string, setValueFn: (content: string) => void): Promise<void> {
    try {
      const parseResult = await JsonUtils.parseJson(currentContent);
      if (parseResult.success && parseResult.data !== undefined) {
        const formatResult = await JsonUtils.formatJson(parseResult.data, 2);
        if (formatResult.success && formatResult.formatted) {
          setValueFn(formatResult.formatted);
        } else {
          console.error('Format failed:', formatResult.error);
        }
      } else {
        console.error('Parse failed:', parseResult.error);
      }
    } catch (error) {
      console.error('Format operation failed:', error);
    }
  }

  /**
   * Minify JSON content
   */
  static async minify(currentContent: string, setValueFn: (content: string) => void): Promise<void> {
    try {
      const parseResult = await JsonUtils.parseJson(currentContent);
      if (parseResult.success && parseResult.data !== undefined) {
        const minifyResult = await JsonUtils.minifyJson(parseResult.data);
        if (minifyResult.success && minifyResult.formatted) {
          setValueFn(minifyResult.formatted);
        } else {
          console.error('Minify failed:', minifyResult.error);
        }
      } else {
        console.error('Parse failed:', parseResult.error);
      }
    } catch (error) {
      console.error('Minify operation failed:', error);
    }
  }

  /**
   * Go to specific line
   */
  static goToLine(view: EditorView, line: number): void {
    const doc = view.state.doc;
    if (line < 1 || line > doc.lines) return;

    const lineInfo = doc.line(line);
    view.dispatch({
      selection: { anchor: lineInfo.from, head: lineInfo.from },
      effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' })
    });
  }

  /**
   * Find text in editor
   */
  static find(view: EditorView, query: string, direction: 1 | -1 = 1): void {
    if (!query) return;

    // Simple text search implementation
    const doc = view.state.doc.toString();
    const currentPos = view.state.selection.main.head;

    let searchPos = direction === 1 ? currentPos : currentPos - query.length;
    let found = -1;

    if (direction === 1) {
      found = doc.indexOf(query, searchPos);
      if (found === -1) {
        // Wrap around to beginning
        found = doc.indexOf(query, 0);
      }
    } else {
      found = doc.lastIndexOf(query, searchPos);
      if (found === -1) {
        // Wrap around to end
        found = doc.lastIndexOf(query);
      }
    }

    if (found !== -1) {
      view.dispatch({
        selection: { anchor: found, head: found + query.length },
        effects: EditorView.scrollIntoView(found, { y: 'center' })
      });
    }
  }
}
