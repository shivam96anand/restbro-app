import { AiSession, AiMessage, AiContext, ApiRequest, ApiResponse, AI_MAX_CONTEXT_CHARS } from '../../shared/types';

declare const apiCourier: {
  ai: {
    getSessions: () => Promise<{ sessions: AiSession[] }>;
    createSession: (context?: AiContext) => Promise<AiSession>;
    deleteSession: (sessionId: string) => Promise<boolean>;
    updateSession: (sessionId: string, updates: { title?: string; context?: AiContext }) => Promise<AiSession | null>;
    sendMessage: (params: { sessionId: string; message: string; context?: AiContext }) => Promise<{
      success: boolean;
      message?: AiMessage;
      error?: string;
      tokenLimitExceeded?: boolean;
    }>;
    checkEngine: () => Promise<{ available: boolean; error?: string }>;
  };
};

interface AskAiState {
  sessions: AiSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  isSending: boolean;
  engineStatus: 'unknown' | 'available' | 'unavailable';
  engineError?: string;
  searchQuery: string;
  showContextPanel: boolean;
  activeContextTab: 'params' | 'headers' | 'body' | 'auth' | 'response';
}

export class AskAiTab {
  private container: HTMLElement;
  private isInitialized = false;
  private eventListenersAttached = false;
  private state: AskAiState = {
    sessions: [],
    activeSessionId: null,
    isLoading: true,
    isSending: false,
    engineStatus: 'unknown',
    searchQuery: '',
    showContextPanel: false,
    activeContextTab: 'response',
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeComponents();
  }

  private async initializeComponents(): Promise<void> {
    this.render();
    await this.loadSessions();
    await this.checkEngineStatus();
    if (!this.eventListenersAttached) {
      this.setupEventListeners();
      this.eventListenersAttached = true;
    }
    this.isInitialized = true;
  }

  initialize(): void {
    if (!this.isInitialized) {
      this.initializeComponents();
    }
  }

  async openWithContext(request?: ApiRequest, response?: ApiResponse): Promise<void> {
    const context: AiContext = {};
    if (request) context.request = request;
    if (response) context.response = response;

    // Check size limit before proceeding
    const size = this.calculateContextSize(context);
    if (size > AI_MAX_CONTEXT_CHARS) {
      this.showSizeWarning(size);
      return;
    }

    // Create new session with context
    try {
      const session = await apiCourier.ai.createSession(context);
      this.state.sessions.unshift(session);
      this.state.activeSessionId = session.id;
      this.state.showContextPanel = true;
      this.render();
      this.scrollToBottom();
    } catch (error) {
      console.error('Failed to create session with context:', error);
    }

    // Switch to Ask AI tab
    const event = new CustomEvent('switch-to-tab', { detail: { tabName: 'ask-ai' } });
    document.dispatchEvent(event);
  }

  private calculateContextSize(context: AiContext): number {
    let size = 0;
    if (context.request) size += JSON.stringify(context.request).length;
    if (context.response) {
      size += (context.response.body?.length || 0) + JSON.stringify(context.response.headers).length + 200;
    }
    if (context.fileContent) size += context.fileContent.length;
    return size;
  }

  private showSizeWarning(size: number): void {
    const sizeKb = Math.round(size / 1000);
    const maxKb = AI_MAX_CONTEXT_CHARS / 1000;
    alert(`Content too large (${sizeKb}K chars). Maximum allowed: ${maxKb}K chars.\n\nThe response or file is too big for AI analysis. Try with a smaller dataset.`);
  }

  private async loadSessions(): Promise<void> {
    try {
      const result = await apiCourier.ai.getSessions();
      this.state.sessions = result.sessions;
      this.state.isLoading = false;
      this.render();
    } catch (error) {
      console.error('Failed to load AI sessions:', error);
      this.state.isLoading = false;
      this.render();
    }
  }

  private async checkEngineStatus(): Promise<void> {
    try {
      const result = await apiCourier.ai.checkEngine();
      this.state.engineStatus = result.available ? 'available' : 'unavailable';
      this.state.engineError = result.error;
      this.updateEngineStatusBanner();
    } catch (error) {
      this.state.engineStatus = 'unavailable';
      this.state.engineError = error instanceof Error ? error.message : 'Unknown error';
      this.updateEngineStatusBanner();
    }
  }

  private render(): void {
    const activeSession = this.getActiveSession();

    this.container.innerHTML = `
      <div class="ask-ai-layout">
        <aside class="ask-ai-sidebar">
          <div class="sidebar-header">
            <h3>Conversations</h3>
            <button class="btn-new-session" title="New Chat">➕</button>
          </div>
          <div class="sessions-search">
            <input type="text" placeholder="Search conversations..." value="${this.escapeHtml(this.state.searchQuery)}" />
          </div>
          <div class="sessions-list">
            ${this.renderSessionsList()}
          </div>
        </aside>
        <main class="ask-ai-main">
          ${this.renderEngineStatusBanner()}
          ${activeSession ? this.renderContextPanel(activeSession) : ''}
          <div class="chat-area">
            ${activeSession ? this.renderChatMessages(activeSession) : this.renderWelcome()}
          </div>
          ${activeSession ? this.renderQuickSuggestions() : ''}
          ${this.renderInputArea()}
        </main>
      </div>
    `;
  }

  private renderSessionsList(): string {
    const filtered = this.state.sessions.filter(s =>
      s.title.toLowerCase().includes(this.state.searchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
      return `
        <div class="empty-sessions">
          <p>${this.state.searchQuery ? 'No matching conversations' : 'No conversations yet'}</p>
          <p>Start a new chat or use Ask AI from an API response</p>
        </div>
      `;
    }

    return filtered.map(session => `
      <div class="session-item ${session.id === this.state.activeSessionId ? 'active' : ''}" data-session-id="${session.id}">
        <div class="session-main">
          <div class="session-title">${this.escapeHtml(session.title)}</div>
          <div class="session-meta">
            <span>${session.messages.length} messages</span>
            <span>${this.formatDate(session.updatedAt)}</span>
          </div>
        </div>
        <button class="session-delete" data-session-id="${session.id}" title="Delete">🗑️</button>
      </div>
    `).join('');
  }

  private renderEngineStatusBanner(): string {
    if (this.state.engineStatus === 'available') return '';

    const isUnknown = this.state.engineStatus === 'unknown';
    return `
      <div class="engine-status-banner">
        <div class="status-content">
          <span class="status-icon">${isUnknown ? '⏳' : '⚠️'}</span>
          <div class="status-text">
            <div class="status-title">${isUnknown ? 'Checking AI Engine...' : 'AI Engine Unavailable'}</div>
            <div class="status-subtitle">${this.state.engineError || 'Make sure your local LLM server is running on port 9999'}</div>
          </div>
        </div>
        <div class="status-actions">
          <button class="btn-check-engine">Retry</button>
        </div>
      </div>
    `;
  }

  private renderContextPanel(session: AiSession): string {
    if (!session.context || (!session.context.request && !session.context.response && !session.context.fileContent)) {
      return '';
    }

    const ctx = session.context;
    const req = ctx.request;
    const res = ctx.response;

    return `
      <div class="context-panel ${this.state.showContextPanel ? 'expanded' : 'collapsed'}">
        <div class="context-header">
          <h4>📋 Request Context</h4>
          <button class="btn-toggle-context">
            ${this.state.showContextPanel ? '▼ Hide' : '▶ Show'}
          </button>
        </div>
        ${this.state.showContextPanel ? `
          <div class="context-content">
            ${req ? `
              <div class="request-line">
                <span class="method-badge method-${req.method.toLowerCase()}">${req.method}</span>
                <span class="request-url">${this.escapeHtml(req.url)}</span>
              </div>
              <div class="request-tabs">
                <div class="tab-group">
                  <button class="tab-button ${this.state.activeContextTab === 'params' ? 'active' : ''}" data-tab="params">Params</button>
                  <button class="tab-button ${this.state.activeContextTab === 'headers' ? 'active' : ''}" data-tab="headers">Headers</button>
                  <button class="tab-button ${this.state.activeContextTab === 'body' ? 'active' : ''}" data-tab="body">Body</button>
                  <button class="tab-button ${this.state.activeContextTab === 'auth' ? 'active' : ''}" data-tab="auth">Auth</button>
                  ${res ? `<button class="tab-button ${this.state.activeContextTab === 'response' ? 'active' : ''}" data-tab="response">Response</button>` : ''}
                </div>
                <div class="tab-contents">
                  ${this.renderContextTabContent(ctx)}
                </div>
              </div>
            ` : ''}
            ${ctx.fileContent ? `
              <div class="context-section">
                <h5>📄 Uploaded File: ${this.escapeHtml(ctx.fileName || 'file')}</h5>
                <div class="details-content">
                  <pre>${this.escapeHtml(ctx.fileContent.slice(0, 500))}${ctx.fileContent.length > 500 ? '...' : ''}</pre>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderContextTabContent(ctx: AiContext): string {
    const req = ctx.request;
    const res = ctx.response;
    const tab = this.state.activeContextTab;

    if (tab === 'params' && req) {
      const params = this.formatKeyValuePairs(req.params);
      return `<div class="tab-content"><pre>${params || '<span class="empty-content">No params</span>'}</pre></div>`;
    }
    if (tab === 'headers' && req) {
      const headers = this.formatKeyValuePairs(req.headers);
      return `<div class="tab-content"><pre>${headers || '<span class="empty-content">No headers</span>'}</pre></div>`;
    }
    if (tab === 'body' && req) {
      const body = req.body?.content;
      return `<div class="tab-content"><pre>${body ? this.escapeHtml(body) : '<span class="empty-content">No body</span>'}</pre></div>`;
    }
    if (tab === 'auth' && req) {
      const auth = req.auth;
      if (!auth || auth.type === 'none') {
        return `<div class="tab-content"><div class="empty-content">No auth</div></div>`;
      }
      return `<div class="tab-content"><pre>Type: ${auth.type}\n${JSON.stringify(auth.config, null, 2)}</pre></div>`;
    }
    if (tab === 'response' && res) {
      return `
        <div class="tab-content">
          <div class="summary-line">
            <span class="status-badge status-${res.status < 400 ? 'success' : 'error'}">${res.status} ${res.statusText}</span>
            <span>${res.time}ms</span>
            <span>${this.formatBytes(res.size)}</span>
          </div>
          <pre>${this.escapeHtml(res.body?.slice(0, 1000) || '')}${(res.body?.length || 0) > 1000 ? '\n...(truncated)' : ''}</pre>
        </div>
      `;
    }
    return '<div class="tab-content"><div class="empty-content">No data</div></div>';
  }

  private renderChatMessages(session: AiSession): string {
    if (session.messages.length === 0) {
      return this.renderEmptyChat();
    }

    const messagesHtml = session.messages.map(msg => this.renderMessage(msg)).join('');
    const typingHtml = this.state.isSending ? this.renderTypingIndicator() : '';

    return `<div class="chat-messages">${messagesHtml}${typingHtml}</div>`;
  }

  private renderEmptyChat(): string {
    return `
      <div class="welcome-message">
        <div class="welcome-icon">💬</div>
        <h3>Start the Conversation</h3>
        <p>Ask questions about your API request or response. The AI has access to the full context shown above.</p>
      </div>
    `;
  }

  private renderMessage(msg: AiMessage): string {
    const formattedContent = this.formatMessageContent(msg.content);
    return `
      <div class="message ${msg.role}">
        <div class="message-content">
          <div class="message-text">${formattedContent}</div>
        </div>
        <div class="message-actions">
          <button class="copy-message" data-content="${this.escapeAttr(msg.content)}">📋 Copy</button>
        </div>
      </div>
    `;
  }

  private renderTypingIndicator(): string {
    return `
      <div class="typing-indicator">
        <div class="message-content">
          <span class="typing-text">AI is thinking</span>
          <div class="typing-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    `;
  }

  private renderWelcome(): string {
    return `
      <div class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h3>Welcome to AI Assistant</h3>
        <p>Start a new conversation or click "Ask AI" from an API response to get insights and help debugging your APIs.</p>
      </div>
    `;
  }

  private renderQuickSuggestions(): string {
    const session = this.getActiveSession();
    if (!session || session.messages.length > 0) return '';

    const suggestions = [
      'Explain this response',
      'What does this status code mean?',
      'Are there any issues?',
      'Summarize the data',
    ];

    return `
      <div class="quick-suggestions">
        <div class="suggestions-header">Quick questions:</div>
        <div class="suggestions-buttons">
          ${suggestions.map(s => `<button class="suggestion-btn">${s}</button>`).join('')}
        </div>
      </div>
    `;
  }

  private renderInputArea(): string {
    const disabled = this.state.engineStatus !== 'available' || this.state.isSending;
    const placeholder = this.state.engineStatus !== 'available'
      ? 'AI engine unavailable...'
      : 'Ask a question about your API...';

    return `
      <div class="input-area">
        <div class="input-container">
          <div class="file-upload-zone" id="file-upload-zone" title="Drop a file here or click to upload">
            📎
          </div>
          <input type="file" id="file-input" style="display: none;" accept=".json,.yaml,.yml,.txt,.md,.xml" />
          <textarea
            id="message-input"
            placeholder="${placeholder}"
            ${disabled ? 'disabled' : ''}
            rows="1"
          ></textarea>
          <div class="input-actions">
            <button class="btn-send" ${disabled ? 'disabled' : ''}>
              ${this.state.isSending ? '⏳' : '📤'} Send
            </button>
          </div>
        </div>
        <div class="input-help">
          <span><kbd>Enter</kbd> to send</span>
          <span><kbd>Shift+Enter</kbd> for new line</span>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (e) => this.handleClick(e));
    this.container.addEventListener('input', (e) => this.handleInput(e));
    this.container.addEventListener('keydown', (e) => this.handleKeydown(e));

    // File drop zone
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const zone = this.container.querySelector('#file-upload-zone');
      zone?.classList.add('dragover');
    });

    this.container.addEventListener('dragleave', () => {
      const zone = this.container.querySelector('#file-upload-zone');
      zone?.classList.remove('dragover');
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      const zone = this.container.querySelector('#file-upload-zone');
      zone?.classList.remove('dragover');
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file) this.handleFileUpload(file);
    });
  }

  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;

    // New session button
    if (target.classList.contains('btn-new-session')) {
      this.createNewSession();
      return;
    }

    // Session item (but not delete button)
    const sessionItem = target.closest('.session-item') as HTMLElement;
    if (sessionItem && !target.classList.contains('session-delete')) {
      const sessionId = sessionItem.dataset.sessionId;
      if (sessionId) this.selectSession(sessionId);
      return;
    }

    // Session delete
    if (target.classList.contains('session-delete')) {
      e.stopPropagation();
      const sessionId = (target as HTMLElement).dataset.sessionId;
      if (sessionId) this.deleteSession(sessionId);
      return;
    }

    // Engine check button
    if (target.classList.contains('btn-check-engine')) {
      this.checkEngineStatus();
      return;
    }

    // Toggle context panel
    if (target.classList.contains('btn-toggle-context')) {
      this.state.showContextPanel = !this.state.showContextPanel;
      this.render();
      return;
    }

    // Context tabs
    if (target.classList.contains('tab-button')) {
      const tab = target.dataset.tab as AskAiState['activeContextTab'];
      if (tab) {
        this.state.activeContextTab = tab;
        this.render();
      }
      return;
    }

    // Send button
    if (target.classList.contains('btn-send')) {
      this.sendMessage();
      return;
    }

    // Suggestion button
    if (target.classList.contains('suggestion-btn')) {
      const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
      if (input) {
        input.value = target.textContent || '';
        this.sendMessage();
      }
      return;
    }

    // Copy message
    if (target.classList.contains('copy-message')) {
      const content = target.dataset.content;
      if (content) {
        navigator.clipboard.writeText(content);
        target.textContent = '✓ Copied';
        setTimeout(() => { target.textContent = '📋 Copy'; }, 2000);
      }
      return;
    }

    // File upload zone click
    if (target.id === 'file-upload-zone' || target.closest('#file-upload-zone')) {
      const fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
      fileInput?.click();
      return;
    }
  }

  private handleInput(e: Event): void {
    const target = e.target as HTMLElement;

    // Search input
    if (target.closest('.sessions-search')) {
      this.state.searchQuery = (target as HTMLInputElement).value;
      this.renderSessionsList();
      const listEl = this.container.querySelector('.sessions-list');
      if (listEl) listEl.innerHTML = this.renderSessionsList();
      return;
    }

    // File input
    if (target.id === 'file-input') {
      const file = (target as HTMLInputElement).files?.[0];
      if (file) this.handleFileUpload(file);
      return;
    }

    // Auto-resize textarea
    if (target.id === 'message-input') {
      const textarea = target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;

    if (target.id === 'message-input') {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    }
  }

  private async handleFileUpload(file: File): Promise<void> {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    try {
      const content = await file.text();

      // Check content size against AI limit
      if (content.length > AI_MAX_CONTEXT_CHARS) {
        this.showSizeWarning(content.length);
        return;
      }

      // Create or update session with file context
      const context: AiContext = {
        fileContent: content,
        fileName: file.name,
      };

      if (this.state.activeSessionId) {
        // Update existing session
        await apiCourier.ai.updateSession(this.state.activeSessionId, { context });
        const session = this.getActiveSession();
        if (session) session.context = context;
      } else {
        // Create new session
        const session = await apiCourier.ai.createSession(context);
        this.state.sessions.unshift(session);
        this.state.activeSessionId = session.id;
      }

      this.state.showContextPanel = true;
      this.render();
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('Failed to read file');
    }
  }

  private async createNewSession(): Promise<void> {
    try {
      const session = await apiCourier.ai.createSession();
      this.state.sessions.unshift(session);
      this.state.activeSessionId = session.id;
      this.state.showContextPanel = false;
      this.render();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }

  private selectSession(sessionId: string): void {
    this.state.activeSessionId = sessionId;
    const session = this.getActiveSession();
    this.state.showContextPanel = !!(session?.context?.request || session?.context?.response || session?.context?.fileContent);
    this.render();
    this.scrollToBottom();
  }

  private async deleteSession(sessionId: string): Promise<void> {
    if (!confirm('Delete this conversation?')) return;

    try {
      await apiCourier.ai.deleteSession(sessionId);
      this.state.sessions = this.state.sessions.filter(s => s.id !== sessionId);
      if (this.state.activeSessionId === sessionId) {
        this.state.activeSessionId = this.state.sessions[0]?.id || null;
      }
      this.render();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  private async sendMessage(): Promise<void> {
    const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    const message = input?.value.trim();
    if (!message || this.state.isSending) return;

    // Ensure we have an active session
    if (!this.state.activeSessionId) {
      await this.createNewSession();
    }

    const sessionId = this.state.activeSessionId;
    if (!sessionId) return;

    // Clear input and show sending state
    input.value = '';
    input.style.height = 'auto';
    this.state.isSending = true;

    // Add user message to UI immediately
    const session = this.getActiveSession();
    if (session) {
      session.messages.push({
        id: 'temp-' + Date.now(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      });
    }
    this.render();
    this.scrollToBottom();

    try {
      const result = await apiCourier.ai.sendMessage({ sessionId, message });

      if (result.success && result.message && session) {
        // Remove temp message and add real ones
        session.messages = session.messages.filter(m => !m.id.startsWith('temp-'));
        session.messages.push({
          id: 'user-' + Date.now(),
          role: 'user',
          content: message,
          timestamp: Date.now(),
        });
        session.messages.push(result.message);
      } else if (session) {
        // Remove temp message on error
        session.messages = session.messages.filter(m => !m.id.startsWith('temp-'));
        // Show error
        this.showError(result.error || 'Failed to get AI response');
      }
    } catch (error) {
      if (session) {
        session.messages = session.messages.filter(m => !m.id.startsWith('temp-'));
      }
      this.showError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      this.state.isSending = false;
      this.render();
      this.scrollToBottom();
    }
  }

  private showError(message: string): void {
    // Temporarily add error to chat
    const chatArea = this.container.querySelector('.chat-messages');
    if (chatArea) {
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.innerHTML = `
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span>${this.escapeHtml(message)}</span>
        </div>
      `;
      chatArea.appendChild(errorEl);
      this.scrollToBottom();
    }
  }

  private updateEngineStatusBanner(): void {
    const banner = this.container.querySelector('.engine-status-banner');
    if (banner) {
      banner.outerHTML = this.renderEngineStatusBanner();
    } else if (this.state.engineStatus !== 'available') {
      // Insert banner if needed
      const main = this.container.querySelector('.ask-ai-main');
      if (main) {
        main.insertAdjacentHTML('afterbegin', this.renderEngineStatusBanner());
      }
    }

    // Update input disabled state
    const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    const sendBtn = this.container.querySelector('.btn-send') as HTMLButtonElement;
    if (input) input.disabled = this.state.engineStatus !== 'available';
    if (sendBtn) sendBtn.disabled = this.state.engineStatus !== 'available';
  }

  private getActiveSession(): AiSession | undefined {
    return this.state.sessions.find(s => s.id === this.state.activeSessionId);
  }

  private scrollToBottom(): void {
    const chatArea = this.container.querySelector('.chat-messages');
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }

  private formatMessageContent(content: string): string {
    // Handle code blocks
    let formatted = content.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return `<div class="code-block"><code>${this.escapeHtml(code.trim())}</code></div>`;
    });

    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  private formatKeyValuePairs(data: unknown): string {
    if (!data) return '';
    if (Array.isArray(data)) {
      return data
        .filter((p: { enabled?: boolean }) => p.enabled !== false)
        .map((p: { key: string; value: string }) => `${p.key}: ${p.value}`)
        .join('\n');
    }
    return Object.entries(data as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join('\n');
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  private escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  destroy(): void {
    this.isInitialized = false;
  }
}
