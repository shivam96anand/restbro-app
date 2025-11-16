/**
 * State management utilities for RawEditor
 */

import { EditorView } from '@codemirror/view';
import { ViewerStateManager } from './viewerState';

export class RawEditorState {
  /**
   * Save editor state to state manager
   */
  static saveEditorState(view: EditorView, stateManager: ViewerStateManager): void {
    const selection = view.state.selection.main;
    const scrollPosition = view.scrollDOM.scrollTop;

    stateManager.updateRawEditor({
      scrollPosition,
      cursorPosition: selection.head,
      selection: selection.from !== selection.to ? {
        from: selection.from,
        to: selection.to
      } : undefined,
    });
  }

  /**
   * Restore editor state from state manager
   */
  static restoreEditorState(view: EditorView, stateManager: ViewerStateManager): void {
    const state = stateManager.getState();
    const rawState = state.rawEditor;

    // Restore scroll position
    if (rawState.scrollPosition > 0) {
      setTimeout(() => {
        view.scrollDOM.scrollTo({
          top: rawState.scrollPosition,
          behavior: 'instant'
        });
      }, 100);
    }

    // Restore cursor and selection
    if (rawState.cursorPosition > 0) {
      const doc = view.state.doc;
      const cursorPos = Math.min(rawState.cursorPosition, doc.length);

      let selection;
      if (rawState.selection) {
        const from = Math.min(rawState.selection.from, doc.length);
        const to = Math.min(rawState.selection.to, doc.length);
        selection = { anchor: from, head: to };
      } else {
        selection = { anchor: cursorPos, head: cursorPos };
      }

      view.dispatch({
        selection: selection
      });
    }
  }

  /**
   * Get serializable editor state
   */
  static getState(view: EditorView): any {
    return {
      doc: view.state.doc.toString(),
      selection: view.state.selection.toJSON(),
      scrollTop: view.scrollDOM.scrollTop,
    };
  }

  /**
   * Restore editor state from serialized data
   */
  static restoreState(view: EditorView, state: any, setValueFn: (content: string) => void): void {
    // Restore document
    if (state.doc) {
      setValueFn(state.doc);
    }

    // Restore scroll and selection
    if (state.scrollTop) {
      view.scrollDOM.scrollTop = state.scrollTop;
    }

    if (state.selection) {
      try {
        // Simple selection restoration
        view.dispatch({
          selection: { anchor: state.selection.anchor || 0, head: state.selection.head || 0 }
        });
      } catch (error) {
        console.warn('Failed to restore selection state:', error);
      }
    }
  }
}
