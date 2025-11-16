/**
 * CodeMirror extensions configuration for RawEditor
 */

import { Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';
import { search, highlightSelectionMatches } from '@codemirror/search';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

export interface ExtensionBuilderOptions {
  theme: 'light' | 'dark';
  fontSize: number;
  wrapText: boolean;
  onFormat: () => void;
  onMinify: () => void;
  onToggleWrap: () => void;
  onOpenSearch: () => void;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  onScroll?: (scrollTop: number) => void;
}

export class RawEditorExtensions {
  /**
   * Build all CodeMirror extensions
   */
  static buildExtensions(options: ExtensionBuilderOptions): Extension[] {
    return [
      // Basic editor features
      lineNumbers(),
      drawSelection(),

      // Language support
      json(),

      // Keymaps
      this.buildKeymaps(options),

      // Search features
      search(),
      highlightSelectionMatches(),

      // Theme
      options.theme === 'dark' ? oneDark : [],

      // Word wrap
      options.wrapText ? EditorView.lineWrapping : [],

      // Custom theme styling
      this.buildTheme(options),

      // Update listeners
      this.buildUpdateListener(options),

      // Scroll handler
      this.buildScrollHandler(options),
    ];
  }

  /**
   * Build keymap configuration
   */
  private static buildKeymaps(options: ExtensionBuilderOptions): Extension {
    return keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: 'Ctrl-f',
        mac: 'Cmd-f',
        run: () => {
          options.onOpenSearch();
          return true;
        }
      },
      {
        key: 'Ctrl-b',
        mac: 'Cmd-b',
        run: () => {
          options.onFormat();
          return true;
        }
      },
      {
        key: 'Ctrl-m',
        mac: 'Cmd-m',
        run: () => {
          options.onMinify();
          return true;
        }
      },
      {
        key: 'Ctrl-w',
        mac: 'Cmd-w',
        run: () => {
          options.onToggleWrap();
          return true;
        }
      }
    ]);
  }

  /**
   * Build custom theme styling
   */
  private static buildTheme(options: ExtensionBuilderOptions): Extension {
    return EditorView.theme({
      '&': {
        fontSize: `${options.fontSize}px`,
        fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      },
      '.cm-content': {
        padding: '12px 8px 60px 8px', // Add bottom padding to prevent cut-off
        minHeight: '300px',
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-scroller': {
        height: '100%',
      },
      '.cm-lineNumbers': {
        paddingRight: '8px',
        paddingLeft: '8px',
        backgroundColor: options.theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
        borderRight: `1px solid ${options.theme === 'dark' ? '#333' : '#e0e0e0'}`,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        textAlign: 'right',
        color: options.theme === 'dark' ? '#858585' : '#6c757d',
        fontWeight: '400',
      },
      '.cm-gutters': {
        backgroundColor: options.theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
        borderRight: `1px solid ${options.theme === 'dark' ? '#333' : '#e0e0e0'}`,
      },
      '.cm-searchMatch': {
        backgroundColor: '#ffeb3b !important',
        color: '#000 !important',
      },
      '.cm-searchMatch-selected': {
        backgroundColor: '#ff9800 !important',
        color: '#fff !important',
      }
    });
  }

  /**
   * Build update listener
   */
  private static buildUpdateListener(options: ExtensionBuilderOptions): Extension {
    let isUpdating = false;

    return EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdating) {
        const content = update.state.doc.toString();
        options.onChange?.(content);
      }

      if (update.selectionSet) {
        const selection = update.state.selection.main;
        const line = update.state.doc.lineAt(selection.head);
        const column = selection.head - line.from;

        options.onCursorChange?.(line.number, column);

        if (selection.from !== selection.to) {
          options.onSelectionChange?.({
            from: selection.from,
            to: selection.to
          });
        }
      }
    });
  }

  /**
   * Build scroll handler
   */
  private static buildScrollHandler(options: ExtensionBuilderOptions): Extension {
    return EditorView.scrollHandler.of((view) => {
      const scrollTop = view.scrollDOM.scrollTop;
      options.onScroll?.(scrollTop);
      return false;
    });
  }
}
