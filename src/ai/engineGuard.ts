import { AI_CONFIG } from './askAiService';

export interface EngineStatus {
  isRunning: boolean;
  error?: string;
  lastChecked: Date;
  model?: string;
  version?: string;
}

export interface EngineCheckResult {
  success: boolean;
  status?: EngineStatus;
  error?: string;
}

/**
 * Engine Guard - manages LLM engine health checks and status
 */
export class EngineGuard {
  private status: EngineStatus = {
    isRunning: false,
    lastChecked: new Date(),
  };

  private checkInProgress = false;
  private listeners: Array<(status: EngineStatus) => void> = [];
  private autoCheckInterval: number | null = null;

  constructor() {
    // Initial check when created
    this.checkEngine();
  }

  /**
   * Subscribe to engine status changes
   */
  subscribe(listener: (status: EngineStatus) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.status);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Check if the engine is running
   */
  async checkEngine(): Promise<EngineCheckResult> {
    if (this.checkInProgress) {
      return { success: false, error: 'Check already in progress' };
    }

    this.checkInProgress = true;

    try {
      // Try to ping the health endpoint first
      const healthUrl = AI_CONFIG.LLM_URL.replace('/v1/chat/completions', '/health');

      let response: Response;
      try {
        response = await fetch(healthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
      } catch (healthError) {
        // If health endpoint fails, try the main endpoint with a simple request
        response = await fetch(AI_CONFIG.LLM_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AI_CONFIG.DEFAULT_MODEL,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout for actual request
        });
      }

      if (response.ok) {
        // Try to extract some info from the response
        let engineInfo: any = {};
        try {
          const responseText = await response.text();
          // Try to parse as JSON first
          try {
            engineInfo = JSON.parse(responseText);
          } catch {
            // If not JSON, treat as plain text (some servers return just "ok")
            engineInfo = { status: responseText.trim() };
          }
        } catch {
          // Ignore parse errors
          engineInfo = { status: 'running' };
        }

        // Check if the response indicates the engine is actually running
        const isActuallyRunning = response.status === 200 && (
          engineInfo.status === 'ok' ||
          engineInfo.status === 'running' ||
          engineInfo.model ||
          response.url.includes('/health')
        );

        if (isActuallyRunning) {
          this.status = {
            isRunning: true,
            lastChecked: new Date(),
            model: engineInfo.model || AI_CONFIG.DEFAULT_MODEL,
            version: engineInfo.version || 'unknown',
          };

          this.notifyListeners();
          return { success: true, status: this.status };
        }
      }

      // If we get here, the response was not successful or didn't indicate running status
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        this.status = {
          isRunning: false,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${errorText}`,
        };

        this.notifyListeners();
        return { success: false, error: this.status.error };
      }

      // Fallback: response was OK but didn't pass our engine check
      this.status = {
        isRunning: false,
        lastChecked: new Date(),
        error: 'Engine responded but status unclear',
      };

      this.notifyListeners();
      return { success: false, error: this.status.error };
    } catch (error) {
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Connection timeout - engine may be starting up';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to engine. Is llama-server running on port 8080?';
        } else {
          errorMessage = error.message;
        }
      }

      this.status = {
        isRunning: false,
        lastChecked: new Date(),
        error: errorMessage,
      };

      this.notifyListeners();
      return { success: false, error: errorMessage };
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Get the current engine status
   */
  getStatus(): EngineStatus {
    return { ...this.status };
  }

  /**
   * Check if engine is currently running
   */
  isEngineUp(): boolean {
    return this.status.isRunning;
  }

  /**
   * Force a fresh engine check
   */
  async refreshStatus(): Promise<EngineCheckResult> {
    return this.checkEngine();
  }

  /**
   * Start periodic engine checks
   */
  startPeriodicChecks(intervalMs: number = 30000): void {
    this.stopPeriodicChecks();

    this.autoCheckInterval = window.setInterval(() => {
      this.checkEngine();
    }, intervalMs);
  }

  /**
   * Stop periodic engine checks
   */
  stopPeriodicChecks(): void {
    if (this.autoCheckInterval !== null) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
    }
  }

  /**
   * Get time since last check
   */
  getTimeSinceLastCheck(): number {
    return Date.now() - this.status.lastChecked.getTime();
  }

  /**
   * Check if status is stale and needs refresh
   */
  isStatusStale(staleThresholdMs: number = 60000): boolean {
    return this.getTimeSinceLastCheck() > staleThresholdMs;
  }

  /**
   * Ensure engine is running before proceeding
   */
  async ensureEngine(): Promise<EngineCheckResult> {
    // If we think it's running and status is fresh, return immediately
    if (this.status.isRunning && !this.isStatusStale()) {
      return { success: true, status: this.status };
    }

    // Otherwise, do a fresh check
    return this.checkEngine();
  }

  /**
   * Get user-friendly status text
   */
  getStatusText(): string {
    if (this.checkInProgress) {
      return 'Checking engine status...';
    }

    if (this.status.isRunning) {
      return `Engine running (${this.status.model || 'unknown model'})`;
    }

    if (this.status.error) {
      return `Engine offline: ${this.status.error}`;
    }

    return 'Engine status unknown';
  }

  /**
   * Get suggested action based on current status
   */
  getSuggestedAction(): string | null {
    if (this.status.isRunning) {
      return null;
    }

    if (this.status.error?.includes('timeout')) {
      return 'Engine may be starting up. Wait a moment and try again.';
    }

    if (this.status.error?.includes('connect')) {
      return 'Start llama-server with: llama-server --model your-model.gguf --port 8080';
    }

    return 'Check that llama-server is running on localhost:8080';
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPeriodicChecks();
    this.listeners.length = 0;
  }
}

// Global instance
export const engineGuard = new EngineGuard();