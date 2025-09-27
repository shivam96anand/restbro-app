import { ChatMessage, RequestContext, ResponseContext } from './askAiService';

export interface AiSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  requestCtx: RequestContext;
  responseCtx: ResponseContext;
  messages: ChatMessage[];
  isActive?: boolean;
  // Context messages (not displayed in chat but sent to AI)
  systemPrompt?: string;
  contextMessage?: string;
}

export interface AiSessionSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

const STORAGE_KEY = 'ai-sessions';
const MAX_STORED_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 100;

/**
 * AI Session Store - manages chat sessions with persistence to localStorage
 */
export class AskAiStore {
  private sessions: Map<string, AiSession> = new Map();
  private activeSessionId: string | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Subscribe to store changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Generate a session title from request context
   */
  private generateTitle(requestCtx: RequestContext): string {
    const url = new URL(requestCtx.url);
    const endpoint = url.pathname || '/';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${requestCtx.method} ${endpoint} - ${timestamp}`;
  }

  /**
   * Create a new session from request/response context
   */
  createFromContext(requestCtx: RequestContext, responseCtx: ResponseContext): AiSession {
    const session: AiSession = {
      id: this.generateId(),
      title: this.generateTitle(requestCtx),
      createdAt: new Date(),
      updatedAt: new Date(),
      requestCtx,
      responseCtx,
      messages: [],
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    this.saveToStorage();
    this.notifyListeners();

    return session;
  }

  /**
   * Add a message to a session
   */
  appendMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const message: ChatMessage = { role, content };
    session.messages.push(message);
    session.updatedAt = new Date();

    // Limit messages per session to prevent memory bloat
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): AiSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions as summaries (for sidebar)
   */
  getSessionSummaries(): AiSessionSummary[] {
    return Array.from(this.sessions.values())
      .map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length,
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Set the active session
   */
  setActiveSession(sessionId: string | null): void {
    if (sessionId && !this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.activeSessionId = sessionId;
    this.notifyListeners();
  }

  /**
   * Get the active session ID
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  /**
   * Get the active session
   */
  getActiveSession(): AiSession | null {
    return this.activeSessionId ? this.getSession(this.activeSessionId) : null;
  }

  /**
   * Update session title
   */
  updateSessionTitle(sessionId: string, title: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.title = title.trim() || this.generateTitle(session.requestCtx);
    session.updatedAt = new Date();
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    if (!this.sessions.has(sessionId)) {
      return;
    }

    this.sessions.delete(sessionId);

    // If this was the active session, clear it
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.activeSessionId = null;
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `ai-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save sessions to localStorage
   */
  private saveToStorage(): void {
    try {
      const sessionsArray = Array.from(this.sessions.values());

      // Limit the number of stored sessions
      const limitedSessions = sessionsArray
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, MAX_STORED_SESSIONS);

      const storageData = {
        sessions: limitedSessions.map(session => ({
          ...session,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        })),
        activeSessionId: this.activeSessionId,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save AI sessions to localStorage:', error);
    }
  }

  /**
   * Load sessions from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored);

      if (data.sessions && Array.isArray(data.sessions)) {
        this.sessions.clear();

        data.sessions.forEach((sessionData: any) => {
          const session: AiSession = {
            ...sessionData,
            createdAt: new Date(sessionData.createdAt),
            updatedAt: new Date(sessionData.updatedAt),
          };
          this.sessions.set(session.id, session);
        });
      }

      if (data.activeSessionId && this.sessions.has(data.activeSessionId)) {
        this.activeSessionId = data.activeSessionId;
      }
    } catch (error) {
      console.error('Failed to load AI sessions from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Get sessions filtered by search term
   */
  searchSessions(searchTerm: string): AiSessionSummary[] {
    if (!searchTerm.trim()) {
      return this.getSessionSummaries();
    }

    const term = searchTerm.toLowerCase();
    return this.getSessionSummaries().filter(session =>
      session.title.toLowerCase().includes(term)
    );
  }

  /**
   * Export session data (for debugging or backup)
   */
  exportSessions(): any {
    return {
      sessions: Array.from(this.sessions.values()),
      activeSessionId: this.activeSessionId,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Get memory usage stats
   */
  getStats(): { sessionCount: number; totalMessages: number; storageSize: number } {
    const totalMessages = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.messages.length, 0);

    const storageSize = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size;

    return {
      sessionCount: this.sessions.size,
      totalMessages,
      storageSize,
    };
  }
}

// Global instance
export const askAiStore = new AskAiStore();