/**
 * Raw JSON editor with CodeMirror 6 and perfect line number alignment
 */

import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { ViewerStateManager } from './viewerState';
import { RawEditorExtensions } from './RawEditorExtensions';
import { RawEditorState } from './RawEditorState';
import { RawEditorOperations } from './RawEditorOperations';

export interface RawEditorOptions {
  container: HTMLElement;
  stateManager: ViewerStateManager;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  onSearch?: (query: string, matches: number) => void;
}

export interface RawEditorHandle {
  setValue: (content: string) => void;
  getValue: () => string;
  format: () => Promise<void>;
  minify: () => Promise<void>;
  goToLine: (line: number) => void;
  find: (query: string, direction?: 1 | -1) => void;
  toggleWrap: () => boolean;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  focus: () => void;
  getState: () => any;
  restoreState: (state: any) => void;
  destroy: () => void;
}

export class RawEditor implements RawEditorHandle {
  private view: EditorView | null = null;
  private container: HTMLElement;
  private stateManager: ViewerStateManager;
  private options: RawEditorOptions;
  private currentContent = '';
  private isUpdating = false;

  constructor(options: RawEditorOptions) {
    this.options = options;
    this.container = options.container;
    this.stateManager = options.stateManager;
    this.setupEditor();
  }

  private setupEditor(): void {
    const state = this.stateManager.getState();
    const extensions = RawEditorExtensions.buildExtensions({
      theme: state.rawEditor.theme,
      fontSize: state.rawEditor.fontSize,
      wrapText: state.rawEditor.wrapText,
      onFormat: () => this.format(),
      onMinify: () => this.minify(),
      onToggleWrap: () => this.toggleWrap(),
      onOpenSearch: () => this.openSearch(),
      onChange: (content) => {
        if (!this.isUpdating) {
          this.currentContent = content;
          RawEditorState.saveEditorState(this.view!, this.stateManager);
          this.options.onChange?.(content);
        }
      },
      onCursorChange: (line, column) => {
        this.options.onCursorChange?.(line, column);
        RawEditorState.saveEditorState(this.view!, this.stateManager);
      },
      onSelectionChange: (selection) => {
        this.options.onSelectionChange?.(selection);
        RawEditorState.saveEditorState(this.view!, this.stateManager);
      },
      onScroll: (scrollTop) => {
        this.stateManager.updateRawEditor({ scrollPosition: scrollTop });
      },
    });

    const editorState = EditorState.create({
      doc: this.currentContent,
      extensions,
    });

    this.view = new EditorView({
      state: editorState,
      parent: this.container,
    });

    RawEditorState.restoreEditorState(this.view, this.stateManager);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle resize events
    const resizeObserver = new ResizeObserver(() => {
      if (this.view) {
        this.view.requestMeasure();
      }
    });
    resizeObserver.observe(this.container);
  }

  private rebuildEditor(): void {
    if (!this.view) return;

    const currentDoc = this.view.state.doc.toString();
    const currentSelection = this.view.state.selection;

    this.view.destroy();

    const state = this.stateManager.getState();
    const extensions = RawEditorExtensions.buildExtensions({
      theme: state.rawEditor.theme,
      fontSize: state.rawEditor.fontSize,
      wrapText: state.rawEditor.wrapText,
      onFormat: () => this.format(),
      onMinify: () => this.minify(),
      onToggleWrap: () => this.toggleWrap(),
      onOpenSearch: () => this.openSearch(),
      onChange: (content) => {
        if (!this.isUpdating) {
          this.currentContent = content;
          RawEditorState.saveEditorState(this.view!, this.stateManager);
          this.options.onChange?.(content);
        }
      },
      onCursorChange: (line, column) => {
        this.options.onCursorChange?.(line, column);
        RawEditorState.saveEditorState(this.view!, this.stateManager);
      },
      onSelectionChange: (selection) => {
        this.options.onSelectionChange?.(selection);
        RawEditorState.saveEditorState(this.view!, this.stateManager);
      },
      onScroll: (scrollTop) => {
        this.stateManager.updateRawEditor({ scrollPosition: scrollTop });
      },
    });

    const newState = EditorState.create({
      doc: currentDoc,
      extensions,
      selection: currentSelection
    });

    this.view = new EditorView({
      state: newState,
      parent: this.container,
    });
  }

  private openSearch(): void {
    // Simple search implementation - focus will be handled by external search bar
    console.log('Search functionality will be handled by external search bar');
  }

  // Public API methods

  public setValue(content: string): void {
    if (this.currentContent === content) return;

    this.isUpdating = true;
    this.currentContent = content;

    if (this.view) {
      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: content
        }
      });
    }
    this.isUpdating = false;
  }

  public getValue(): string {
    return this.currentContent;
  }

  public async format(): Promise<void> {
    await RawEditorOperations.format(this.currentContent, (content) => this.setValue(content));
  }

  public async minify(): Promise<void> {
    await RawEditorOperations.minify(this.currentContent, (content) => this.setValue(content));
  }

  public goToLine(line: number): void {
    if (!this.view) return;
    RawEditorOperations.goToLine(this.view, line);
  }

  public find(query: string, direction: 1 | -1 = 1): void {
    if (!this.view) return;
    RawEditorOperations.find(this.view, query, direction);
  }

  public toggleWrap(): boolean {
    const newWrapState = this.stateManager.toggleTextWrap();
    this.rebuildEditor();
    return newWrapState;
  }

  public setFontSize(size: number): void {
    this.stateManager.setFontSize(size);
    this.rebuildEditor();
  }

  public setTheme(theme: 'light' | 'dark'): void {
    this.stateManager.updateRawEditor({ theme });
    this.stateManager.saveGlobalSettings({ theme });
    this.rebuildEditor();
  }

  public focus(): void {
    if (this.view) {
      this.view.focus();
    }
  }

  public getState(): any {
    if (!this.view) return null;
    return RawEditorState.getState(this.view);
  }

  public restoreState(state: any): void {
    if (!this.view || !state) return;
    RawEditorState.restoreState(this.view, state, (content) => this.setValue(content));
  }

  public destroy(): void {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  }
}
