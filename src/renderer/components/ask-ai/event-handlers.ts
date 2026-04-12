// Ask AI Event Handlers

import { AskAiState, AiContext } from './types';
import { AI_MAX_CONTEXT_CHARS } from '../../../shared/types';
import { showSizeWarning, formatMessageContent } from './utils';
import { iconHtml } from '../../utils/icons';

export interface EventHandlerDeps {
  container: HTMLElement;
  state: AskAiState;
  render: () => void;
  getActiveSession: () =>
    | ReturnType<typeof import('./types').createInitialState>['sessions'][0]
    | undefined;
  scrollToBottom: () => void;
  checkEngineStatus: () => Promise<void>;
  createNewSession: () => Promise<void>;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  startRenameSession: (sessionId: string) => void;
  finishRenameSession: (sessionId: string, newTitle: string) => Promise<void>;
  cancelRenameSession: () => void;
  handleFileUpload: (file: File) => Promise<void>;
  sendMessage: () => Promise<void>;
  renderSessionsList: () => string;
}

/**
 * Set up all event listeners for the Ask AI tab
 */
export function setupEventListeners(deps: EventHandlerDeps): void {
  const { container } = deps;

  container.addEventListener('click', (e) => handleClick(e, deps));
  container.addEventListener('input', (e) => handleInput(e, deps));
  container.addEventListener('keydown', (e) => handleKeydown(e, deps));
  container.addEventListener('blur', (e) => handleBlur(e, deps), true);

  // File drop zone
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const zone = container.querySelector('#file-upload-zone');
    zone?.classList.add('dragover');
  });

  container.addEventListener('dragleave', () => {
    const zone = container.querySelector('#file-upload-zone');
    zone?.classList.remove('dragover');
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    const zone = container.querySelector('#file-upload-zone');
    zone?.classList.remove('dragover');
    const file = (e as DragEvent).dataTransfer?.files[0];
    if (file) deps.handleFileUpload(file);
  });
}

/**
 * Handle click events
 */
function handleClick(e: Event, deps: EventHandlerDeps): void {
  const { container, state } = deps;
  const target = e.target as HTMLElement;

  // New session button
  if (target.classList.contains('btn-new-session')) {
    deps.createNewSession();
    return;
  }

  // Session item (but not delete or rename button)
  const sessionItem = target.closest('.session-item') as HTMLElement;
  if (
    sessionItem &&
    !target.classList.contains('session-delete') &&
    !target.classList.contains('session-rename') &&
    !target.classList.contains('session-title-input')
  ) {
    const sessionId = sessionItem.dataset.sessionId;
    if (sessionId && state.renamingSessionId !== sessionId)
      deps.selectSession(sessionId);
    return;
  }

  // Session rename
  if (target.classList.contains('session-rename')) {
    e.stopPropagation();
    const sessionId = (target as HTMLElement).dataset.sessionId;
    if (sessionId) deps.startRenameSession(sessionId);
    return;
  }

  // Session delete
  if (target.classList.contains('session-delete')) {
    e.stopPropagation();
    const sessionId = (target as HTMLElement).dataset.sessionId;
    if (sessionId) deps.deleteSession(sessionId);
    return;
  }

  // Engine check button
  if (target.classList.contains('btn-check-engine')) {
    deps.checkEngineStatus();
    return;
  }

  // Toggle context panel
  if (target.classList.contains('btn-toggle-context')) {
    state.showContextPanel = !state.showContextPanel;
    deps.render();
    return;
  }

  // Context tabs
  if (target.classList.contains('tab-button')) {
    const tab = target.dataset.tab as AskAiState['activeContextTab'];
    if (tab) {
      state.activeContextTab = tab;
      deps.render();
    }
    return;
  }

  // Send button
  if (target.classList.contains('btn-send')) {
    deps.sendMessage();
    return;
  }

  // Suggestion button
  if (target.classList.contains('suggestion-btn')) {
    const input = container.querySelector(
      '#message-input'
    ) as HTMLTextAreaElement;
    if (input) {
      input.value = target.textContent || '';
      deps.sendMessage();
    }
    return;
  }

  // Copy message
  if (
    target.classList.contains('copy-message') ||
    target.closest('.copy-message')
  ) {
    const btn = target.classList.contains('copy-message')
      ? target
      : (target.closest('.copy-message') as HTMLElement);
    const content = btn?.dataset.content;
    if (content) {
      navigator.clipboard.writeText(content);
      btn.classList.add('copied');
      setTimeout(() => {
        btn.classList.remove('copied');
      }, 2000);
    }
    return;
  }

  // File upload zone click
  if (target.id === 'file-upload-zone' || target.closest('#file-upload-zone')) {
    const fileInput = container.querySelector(
      '#file-input'
    ) as HTMLInputElement;
    fileInput?.click();
    return;
  }
}

/**
 * Handle input events
 */
function handleInput(e: Event, deps: EventHandlerDeps): void {
  const { container, state } = deps;
  const target = e.target as HTMLElement;

  // Search input
  if (target.closest('.sessions-search')) {
    state.searchQuery = (target as HTMLInputElement).value;
    const listEl = container.querySelector('.sessions-list');
    if (listEl) listEl.innerHTML = deps.renderSessionsList();
    return;
  }

  // File input
  if (target.id === 'file-input') {
    const file = (target as HTMLInputElement).files?.[0];
    if (file) deps.handleFileUpload(file);
    return;
  }

  // Auto-resize textarea
  if (target.id === 'message-input') {
    const textarea = target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
}

/**
 * Handle keydown events
 */
function handleKeydown(e: KeyboardEvent, deps: EventHandlerDeps): void {
  const { state } = deps;
  const target = e.target as HTMLElement;

  if (target.id === 'message-input') {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      deps.sendMessage();
    }
  }

  // Handle rename input
  if (target.classList.contains('session-title-input')) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = target as HTMLInputElement;
      const sessionId = input.dataset.sessionId;
      if (sessionId) deps.finishRenameSession(sessionId, input.value.trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      deps.cancelRenameSession();
    }
  }
}

/**
 * Handle blur events
 */
function handleBlur(e: FocusEvent, deps: EventHandlerDeps): void {
  const { state } = deps;
  const target = e.target as HTMLElement;

  // Handle rename input blur
  if (target.classList.contains('session-title-input')) {
    const input = target as HTMLInputElement;
    const sessionId = input.dataset.sessionId;
    if (sessionId && state.renamingSessionId === sessionId) {
      deps.finishRenameSession(sessionId, input.value.trim());
    }
  }
}

/**
 * Update the streaming message in the DOM
 */
export function updateStreamingMessage(
  container: HTMLElement,
  content: string,
  scrollToBottom: () => void
): void {
  const chatMessages = container.querySelector('.chat-messages');
  if (!chatMessages) return;

  const streamingMsg = chatMessages.querySelector('.message.streaming');
  if (streamingMsg) {
    const messageText = streamingMsg.querySelector('.message-text');
    if (messageText) {
      const formattedContent = formatMessageContent(content);
      messageText.innerHTML =
        formattedContent + '<span class="streaming-cursor">▋</span>';
      scrollToBottom();
    }
  }
}

/**
 * Show error message in the chat
 */
export function showError(
  container: HTMLElement,
  message: string,
  scrollToBottom: () => void
): void {
  const chatArea = container.querySelector('.chat-messages');
  if (chatArea) {
    const div = document.createElement('div');
    div.textContent = message;
    const escapedMessage = div.innerHTML;

    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
      <div class="error-content">
        <span class="error-icon">${iconHtml('warning')}</span>
        <span>${escapedMessage}</span>
      </div>
    `;
    chatArea.appendChild(errorEl);
    scrollToBottom();
  }
}

/**
 * Update engine status banner
 */
export function updateEngineStatusBanner(
  container: HTMLElement,
  state: AskAiState,
  renderBanner: () => string
): void {
  const banner = container.querySelector('.engine-status-banner');
  if (banner) {
    banner.outerHTML = renderBanner();
  } else if (state.engineStatus !== 'available') {
    const main = container.querySelector('.ask-ai-main');
    if (main) {
      main.insertAdjacentHTML('afterbegin', renderBanner());
    }
  }

  // Update input disabled state
  const input = container.querySelector(
    '#message-input'
  ) as HTMLTextAreaElement;
  const sendBtn = container.querySelector('.btn-send') as HTMLButtonElement;
  if (input) input.disabled = state.engineStatus !== 'available';
  if (sendBtn) sendBtn.disabled = state.engineStatus !== 'available';
}
