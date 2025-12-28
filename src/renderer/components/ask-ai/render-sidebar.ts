// Ask AI Render Functions - Sessions and Sidebar

import { AiSession, AskAiState } from './types';
import { iconHtml } from '../../utils/icons';
import { escapeHtml, escapeAttr, formatDate } from './utils';

/**
 * Render the sessions list in the sidebar
 */
export function renderSessionsList(state: AskAiState): string {
  const filtered = state.sessions.filter(s =>
    s.title.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return `
      <div class="empty-sessions">
        <p>${state.searchQuery ? 'No matching conversations' : 'No conversations yet'}</p>
        <p>Start a new chat or use Ask AI from an API response</p>
      </div>
    `;
  }

  return filtered.map(session => `
    <div class="session-item ${session.id === state.activeSessionId ? 'active' : ''}" data-session-id="${session.id}">
      <div class="session-main">
        ${state.renamingSessionId === session.id ? `
          <input
            type="text"
            class="session-title-input"
            value="${escapeAttr(session.title)}"
            data-session-id="${session.id}"
            autofocus
          />
        ` : `
          <div class="session-title" title="${escapeAttr(session.title)}">${escapeHtml(session.title)}</div>
        `}
        <div class="session-meta">
          <span>${session.messages.length} messages</span>
          <span>${formatDate(session.updatedAt)}</span>
        </div>
      </div>
      <div class="session-actions">
        <button class="session-rename" data-session-id="${session.id}" title="Rename">${iconHtml('edit')}</button>
        <button class="session-delete" data-session-id="${session.id}" title="Delete">${iconHtml('trash')}</button>
      </div>
    </div>
  `).join('');
}

/**
 * Render the engine status banner
 */
export function renderEngineStatusBanner(state: AskAiState): string {
  if (state.engineStatus === 'available') return '';

  const isUnknown = state.engineStatus === 'unknown';
  return `
    <div class="engine-status-banner">
      <div class="status-content">
        <span class="status-icon">${isUnknown ? iconHtml('clock', 'ui-icon--spin') : iconHtml('warning')}</span>
        <div class="status-text">
          <div class="status-title">${isUnknown ? 'Checking AI Engine...' : 'AI Engine Unavailable'}</div>
          <div class="status-subtitle">${state.engineError || 'Make sure your local LLM server is running on port 9999'}</div>
        </div>
      </div>
      <div class="status-actions">
        <button class="btn-check-engine">Retry</button>
      </div>
    </div>
  `;
}

/**
 * Render the welcome message when no session is active
 */
export function renderWelcome(): string {
  return `
    <div class="welcome-message">
      <div class="welcome-icon">${iconHtml('bot', 'ui-icon--xl')}</div>
      <h3>Welcome to AI Assistant</h3>
      <p>Start a new conversation or click "Ask AI" from an API response to get insights and help debugging your APIs.</p>
    </div>
  `;
}

/**
 * Render quick suggestion buttons
 */
export function renderQuickSuggestions(session: AiSession | undefined): string {
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

/**
 * Render the input area
 */
export function renderInputArea(state: AskAiState): string {
  const disabled = state.engineStatus !== 'available' || state.isSending;
  const placeholder = state.engineStatus !== 'available'
    ? 'AI engine unavailable...'
    : 'Ask a question about your API...';

  return `
    <div class="input-area">
      <div class="input-container">
        <div class="file-upload-zone" id="file-upload-zone" title="Drop a file here or click to upload">
          ${iconHtml('paperclip')}
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
            ${state.isSending ? iconHtml('clock', 'ui-icon--spin') : iconHtml('send')} Send
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
