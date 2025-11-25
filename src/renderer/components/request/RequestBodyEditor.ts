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
      <div class="body-type-row">
        <div class="body-type-selector">
          <label><input type="radio" name="body-type" value="none" checked> None</label>
          <label><input type="radio" name="body-type" value="json"> JSON</label>
          <label><input type="radio" name="body-type" value="raw"> Raw</label>
          <label><input type="radio" name="body-type" value="form-urlencoded"> Form URL Encoded</label>
        </div>
      </div>
      <div class="body-editor-container" id="body-editor-container" style="display: none;">
        <div class="body-editor-header">
          <div class="body-editor-heading">
            <div class="title">Request Body</div>
          </div>
          <div class="body-editor-actions">
            <button id="format-body-btn" class="btn btn-secondary" style="display: none;">Format</button>
            <div class="body-status" id="body-status"></div>
          </div>
        </div>
        <div class="body-editor-wrapper">
          <textarea 
            id="request-body" 
            class="body-editor enhanced-json-editor" 
            placeholder="Request body"
            spellcheck="false"
          ></textarea>
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
      bodyEditor.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    // Action buttons
    this.container.querySelector('#format-body-btn')?.addEventListener('click', () => this.formatJson());
  }

  private handleBodyTypeChange(bodyType: string): void {
    this.currentBodyType = bodyType as BodyType;
    const bodyEditorContainer = this.container.querySelector('#body-editor-container') as HTMLElement;
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const formatBtn = this.container.querySelector('#format-body-btn') as HTMLElement;

    if (bodyType === 'none') {
      bodyEditorContainer.style.display = 'none';
      this.events.onBodyChange({ type: bodyType as BodyType, content: '' });
    } else {
      bodyEditorContainer.style.display = 'block';
      
      // Show/hide JSON-specific actions
      if (formatBtn) {
        formatBtn.style.display = bodyType === 'json' ? 'inline-block' : 'none';
      }

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

      this.updateStatus();
      this.events.onBodyChange({ type: bodyType as BodyType, content: bodyEditor.value });
    }
  }

  private handleBodyContentChange(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
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

  private updateStatus(): void {
    const bodyEditor = this.container.querySelector('#request-body') as HTMLTextAreaElement;
    const statusElement = this.container.querySelector('#body-status') as HTMLElement;
    const text = bodyEditor.value.trim();

    if (!statusElement) return;

    if (this.currentBodyType === 'json') {
      try {
        JSON.parse(text || '{}');
        statusElement.textContent = '';
        statusElement.className = 'body-status';
      } catch (error) {
        statusElement.textContent = 'Invalid JSON';
        statusElement.className = 'body-status invalid';
      }
    } else {
      statusElement.textContent = '';
      statusElement.className = 'body-status';
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
