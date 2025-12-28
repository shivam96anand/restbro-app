// Ask AI Types and State Definitions

import { AiSession, AiMessage, AiContext, ApiRequest, ApiResponse } from '../../../shared/types';

declare global {
  const apiCourier: {
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
        requestId?: string;
      }>;
      onMessageStream: (callback: (data: { requestId: string; chunk: string }) => void) => () => void;
      checkEngine: () => Promise<{ available: boolean; error?: string }>;
    };
  };
}

export interface AskAiState {
  sessions: AiSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  isSending: boolean;
  engineStatus: 'unknown' | 'available' | 'unavailable';
  engineError?: string;
  searchQuery: string;
  showContextPanel: boolean;
  activeContextTab: 'params' | 'headers' | 'body' | 'auth' | 'response';
  renamingSessionId: string | null;
  streamingContent: string;
  currentRequestId: string | null;
}

export function createInitialState(): AskAiState {
  return {
    sessions: [],
    activeSessionId: null,
    isLoading: true,
    isSending: false,
    engineStatus: 'unknown',
    searchQuery: '',
    showContextPanel: false,
    activeContextTab: 'body',
    renamingSessionId: null,
    streamingContent: '',
    currentRequestId: null,
  };
}

export type { AiSession, AiMessage, AiContext, ApiRequest, ApiResponse };
