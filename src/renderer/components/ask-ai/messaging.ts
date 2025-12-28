// Ask AI Messaging Functions

import { AiSession, AiContext, AskAiState } from './types';
import { showError } from './event-handlers';

declare const apiCourier: {
  ai: {
    createSession: (context?: AiContext) => Promise<AiSession>;
    sendMessage: (params: { sessionId: string; message: string; context?: AiContext }) => Promise<{
      success: boolean;
      message?: { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number };
      error?: string;
      tokenLimitExceeded?: boolean;
      requestId?: string;
    }>;
  };
};

/**
 * Send a message to the AI
 */
export async function sendMessageToAI(
  container: HTMLElement,
  state: AskAiState,
  getActiveSession: () => AiSession | undefined,
  createNewSession: () => Promise<void>,
  render: () => void,
  scrollToBottom: () => void
): Promise<void> {
  const input = container.querySelector('#message-input') as HTMLTextAreaElement;
  const message = input?.value.trim();
  if (!message || state.isSending) return;

  if (!state.activeSessionId) await createNewSession();
  const sessionId = state.activeSessionId;
  if (!sessionId) return;

  input.value = '';
  input.style.height = 'auto';
  state.isSending = true;
  state.streamingContent = '';
  state.currentRequestId = null;

  const session = getActiveSession();
  if (session) {
    session.messages.push({
      id: 'temp-' + Date.now(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });
  }
  render();
  scrollToBottom();

  try {
    const result = await apiCourier.ai.sendMessage({ sessionId, message });
    if (result.success && result.message && session) {
      session.messages = session.messages.filter(m => !m.id.startsWith('temp-'));
      session.messages.push({
        id: 'user-' + Date.now(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      });
      session.messages.push(result.message);
    } else if (session) {
      session.messages = session.messages.filter(m => !m.id.startsWith('temp-'));
      showError(container, result.error || 'Failed to get AI response', scrollToBottom);
    }
  } catch (error) {
    if (session) {
      session.messages = session.messages.filter(m => !m.id.startsWith('temp-'));
    }
    showError(
      container,
      error instanceof Error ? error.message : 'Failed to send message',
      scrollToBottom
    );
  } finally {
    state.isSending = false;
    state.streamingContent = '';
    state.currentRequestId = null;
    render();
    scrollToBottom();
  }
}

/**
 * Setup stream listener for AI responses
 */
export function setupStreamListener(
  state: AskAiState,
  container: HTMLElement,
  onChunk: (chunk: string) => void
): () => void {
  return apiCourier.ai.onMessageStream((data: { requestId: string; chunk: string }) => {
    if (state.isSending) {
      if (!state.currentRequestId && data.requestId) {
        state.currentRequestId = data.requestId;
      }
      if (data.requestId === state.currentRequestId) {
        state.streamingContent += data.chunk;
        onChunk(state.streamingContent);
      }
    }
  });
}

// Re-declare for setupStreamListener
declare global {
  interface Window {
    apiCourier: {
      ai: {
        onMessageStream: (callback: (data: { requestId: string; chunk: string }) => void) => () => void;
      };
    };
  }
}

// Use the actual API
const apiCourierExt = (window as any).apiCourier || apiCourier;
export function createStreamListener(
  state: AskAiState,
  onChunk: (chunk: string) => void
): () => void {
  return apiCourierExt.ai.onMessageStream((data: { requestId: string; chunk: string }) => {
    if (state.isSending) {
      if (!state.currentRequestId && data.requestId) {
        state.currentRequestId = data.requestId;
      }
      if (data.requestId === state.currentRequestId) {
        state.streamingContent += data.chunk;
        onChunk(state.streamingContent);
      }
    }
  });
}
