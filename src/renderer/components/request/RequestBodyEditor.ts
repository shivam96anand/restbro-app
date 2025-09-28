type BodyType = 'none' | 'json' | 'raw' | 'form-urlencoded';

export interface RequestBodyEditorEvents {
  onBodyChange: (body: { type: BodyType; content: string }) => void;
  onStatusUpdate: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

export class RequestBodyEditor {
  private container: HTMLElement;
  private events: RequestBodyEditorEvents;
  private currentBodyType: BodyType = 'none';

  constructor(container: HTMLElement, events: RequestBodyEditorEvents) {
    this.container = container;
    this.events = events;
    this.initialize();
  }

  private initialize(): void {
    this.setupDOM();
    this.setupEventListeners();
  }

  private setupDOM(): void {
    this.container.innerHTML = `
      <div class="body-type-selector">
        <label><input type="radio" name="body-type" value="none" checked> None</label>
        <label><input type="radio" name="body-type" value="json"> JSON</label>
        <label><input type="radio" name="body-type" value="raw"> Raw</label>
        <label><input type="radio" name="body-type" value="form-urlencoded"> Form URL Encoded</label>
      </div>
      <div class="body-editor-container" id="body-editor-container" style="display: none;">
        <div class="body-editor-header">
          <div class="body-editor-actions">
            <button id="format-body-btn" class="btn btn-secondary" style="display: none;">Format JSON</button>
            <button id="minify-body-btn" class="btn btn-secondary" style="display: none;">Minify</button>
            <button id="validate-body-btn" class="btn btn-secondary" style="display: none;">Validate</button>
            <button id="clear-body-btn" class="btn btn-secondary">Clear</button>
          </div>
          <div class="body-status" id="body-status"></div>
        </div>
        <div class="body-editor-wrapper">
          <textarea 
            id="request-body" 
            class="body-editor enhanced-json-editor" 
            placeholder="Request body"
            spellcheck="false"
          ></textarea>
          <div class="line-numbers" id="body-line-numbers"></div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Body type radio buttons
    const bodyTypeInputs = this.container.querySelectorAll('input[name="body-type"]');
    bodyTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.handleBodyTypeChange(target.value);
      });
    });

    // Body editor textarea
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    if (bodyEditor) {
      bodyEditor.addEventListener('input', () => this.handleBodyContentChange());
      bodyEditor.addEventListener('scroll', () => this.syncLineNumbers());
      bodyEditor.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    // Action buttons
    this.container.querySelector('#format-body-btn')?.addEventListener('click', () => this.formatJson());
    this.container.querySelector('#minify-body-btn')?.addEventListener('click', () => this.minifyJson());
    this.container.querySelector('#validate-body-btn')?.addEventListener('click', () => this.validateJson());
    this.container.querySelector('#clear-body-btn')?.addEventListener('click', () => this.clearBody());
  }

  private handleBodyTypeChange(bodyType: string): void {
    this.currentBodyType = bodyType as BodyType;
    const bodyEditorContainer = this.container.querySelector('#body-editor-container') as HTMLElement;
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const jsonActions = this.container.querySelectorAll('#format-body-btn, #minify-body-btn, #validate-body-btn');

    if (bodyType === 'none') {
      bodyEditorContainer.style.display = 'none';
      this.events.onBodyChange({ type: bodyType as BodyType, content: '' });
    } else {
      bodyEditorContainer.style.display = 'block';
      
      // Show/hide JSON-specific actions
      jsonActions.forEach(btn => {
        (btn as HTMLElement).style.display = bodyType === 'json' ? 'inline-block' : 'none';
      });

      // Set placeholder and initial content based on type
      if (bodyType === 'json') {
        bodyEditor.placeholder = 'Enter JSON data...';
        bodyEditor.classList.add('json-mode');
        if (!bodyEditor.value.trim()) {
          bodyEditor.value = '{\n  \n}';
          setTimeout(() => {
            bodyEditor.focus();
            bodyEditor.setSelectionRange(4, 4); // Position cursor inside the object
          }, 0);
        }
      } else if (bodyType === 'raw') {
        bodyEditor.placeholder = 'Enter raw data...';
        bodyEditor.classList.remove('json-mode');
      } else if (bodyType === 'form-urlencoded') {
        bodyEditor.placeholder = 'key1=value1&key2=value2';
        bodyEditor.classList.remove('json-mode');
      }

      this.updateLineNumbers();
      this.updateStatus();
      this.events.onBodyChange({ type: bodyType as BodyType, content: bodyEditor.value });
    }
  }

  private handleBodyContentChange(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    this.updateLineNumbers();
    this.updateStatus();
    this.events.onBodyChange({ 
      type: this.currentBodyType, 
      content: bodyEditor.value 
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    const textarea = e.target as HTMLTextAreaElement;
    
    // Auto-indent for JSON
    if (this.currentBodyType === 'json' && e.key === 'Enter') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const beforeCursor = textarea.value.substring(0, start);
      const afterCursor = textarea.value.substring(start);
      
      // Calculate indentation
      const currentLineMatch = beforeCursor.match(/^.*$/m);
      const currentLine = currentLineMatch ? currentLineMatch[0] : '';
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      // Add extra indent if we're inside an object/array
      const lastChar = beforeCursor.trim().slice(-1);
      const nextChar = afterCursor.trim().charAt(0);
      const extraIndent = (lastChar === '{' || lastChar === '[') && (nextChar === '}' || nextChar === ']') ? '  ' : '';
      
      const newText = beforeCursor + '\n' + indent + extraIndent + (extraIndent ? '\n' + indent : '') + afterCursor;
      textarea.value = newText;
      textarea.setSelectionRange(start + 1 + indent.length + extraIndent.length, start + 1 + indent.length + extraIndent.length);
      
      this.handleBodyContentChange();
    }
    
    // Tab handling for JSON
    if (this.currentBodyType === 'json' && e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indent
        const beforeCursor = textarea.value.substring(0, start);
        const lines = beforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        if (currentLine.startsWith('  ')) {
          const newValue = textarea.value.substring(0, start - 2) + textarea.value.substring(start);
          textarea.value = newValue;
          textarea.setSelectionRange(start - 2, end - 2);
        }
      } else {
        // Tab: Add indent
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.setSelectionRange(start + 2, start + 2);
      }
      
      this.handleBodyContentChange();
    }
  }

  private formatJson(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const text = bodyEditor.value.trim();

    if (!text) {
      this.events.onStatusUpdate('warning', 'No JSON to format');
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      bodyEditor.value = formatted;
      this.handleBodyContentChange();
      this.events.onStatusUpdate('success', 'JSON formatted successfully');
    } catch (error) {
      this.events.onStatusUpdate('error', `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private minifyJson(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const text = bodyEditor.value.trim();

    if (!text) {
      this.events.onStatusUpdate('warning', 'No JSON to minify');
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const minified = JSON.stringify(parsed);
      bodyEditor.value = minified;
      this.handleBodyContentChange();
      this.events.onStatusUpdate('success', 'JSON minified successfully');
    } catch (error) {
      this.events.onStatusUpdate('error', `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateJson(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const text = bodyEditor.value.trim();

    if (!text) {
      this.events.onStatusUpdate('warning', 'No JSON to validate');
      return;
    }

    try {
      JSON.parse(text);
      const size = text.length;
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
      this.events.onStatusUpdate('success', `Valid JSON (${sizeStr})`);
    } catch (error) {
      this.events.onStatusUpdate('error', `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private clearBody(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    bodyEditor.value = this.currentBodyType === 'json' ? '{\n  \n}' : '';
    this.handleBodyContentChange();
    this.events.onStatusUpdate('info', 'Body cleared');
  }

  private updateLineNumbers(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const lineNumbers = this.container.querySelector('#body-line-numbers') as HTMLElement;
    
    if (!lineNumbers || !bodyEditor) return;
    
    const lines = bodyEditor.value.split('\n');
    const lineNumbersHtml = lines.map((_, index) => 
      `<div class="line-number">${index + 1}</div>`
    ).join('');
    
    lineNumbers.innerHTML = lineNumbersHtml;
  }

  private syncLineNumbers(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const lineNumbers = this.container.querySelector('#body-line-numbers') as HTMLElement;
    
    if (lineNumbers && bodyEditor) {
      lineNumbers.scrollTop = bodyEditor.scrollTop;
    }
  }

  private updateStatus(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const statusElement = this.container.querySelector('#body-status') as HTMLElement;
    const text = bodyEditor.value.trim();

    if (!statusElement) return;

    if (!text) {
      statusElement.textContent = '';
      statusElement.className = 'body-status';
      return;
    }

    if (this.currentBodyType === 'json') {
      try {
        JSON.parse(text);
        const size = text.length;
        const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
        statusElement.textContent = `Valid JSON (${sizeStr})`;
        statusElement.className = 'body-status valid';
      } catch (error) {
        statusElement.textContent = 'Invalid JSON';
        statusElement.className = 'body-status invalid';
      }
    } else {
      const size = text.length;
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
      statusElement.textContent = `${this.currentBodyType.toUpperCase()} (${sizeStr})`;
      statusElement.className = 'body-status info';
    }
  }

  // Public methods for external control
  public setBody(body: { type: BodyType; content: string }): void {
    const bodyTypeInput = this.container.querySelector(`input[name="body-type"][value="${body.type}"]`) as HTMLInputElement;
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;

    if (bodyTypeInput) {
      bodyTypeInput.checked = true;
      this.handleBodyTypeChange(body.type);
    }

    if (bodyEditor) {
      bodyEditor.value = body.content;
      this.handleBodyContentChange();
    }
  }

  public getBody(): { type: BodyType; content: string } {
    const bodyTypeInput = this.container.querySelector('input[name="body-type"]:checked') as HTMLInputElement;
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    
    return {
      type: (bodyTypeInput?.value as BodyType) || 'none',
      content: bodyEditor?.value || ''
    };
  }

  public clear(): void {
    const noneTypeInput = this.container.querySelector('input[name="body-type"][value="none"]') as HTMLInputElement;
    if (noneTypeInput) {
      noneTypeInput.checked = true;
      this.handleBodyTypeChange('none');
    }
  }
}