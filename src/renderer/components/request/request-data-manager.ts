import { ApiRequest } from '../../../shared/types';
import { RequestEditorsManager } from './request-editors-manager';

export class RequestDataManager {
  private currentRequest: ApiRequest | null = null;
  private onShowError: (message: string) => void;
  private editorsManager?: RequestEditorsManager;
  private isSending = false;
  private cancelRequested = false;
  private hasEmittedCancellation = false;

  constructor(onShowError: (message: string) => void, editorsManager?: RequestEditorsManager) {
    this.onShowError = onShowError;
    this.editorsManager = editorsManager;
  }

  setupSendButton(): void {
    const sendBtn = document.getElementById('send-request');

    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        await this.sendRequest();
      });
    }

    // Ensure buttons start in idle state
    this.toggleRequestButtons(false);
  }

  setupCancelButton(): void {
    const cancelBtn = document.getElementById('cancel-request');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', async () => {
        await this.cancelRequest();
      });
    }
  }

  setupCancelEventListener(): void {
    document.addEventListener('request-cancel-trigger', async () => {
      await this.cancelRequest();
    });
  }

  setupTabChangeListener(): void {
    document.addEventListener('tab-changed', (e: Event) => {
      const customEvent = e as CustomEvent;
      const activeTab = customEvent.detail.activeTab;
      if (activeTab) {
        this.setCurrentRequest(activeTab.request);
      } else {
        this.setCurrentRequest(null);
      }
    });
  }

  setCurrentRequest(request: ApiRequest | null): void {
    this.currentRequest = request;
  }

  getCurrentRequest(): ApiRequest | null {
    return this.currentRequest;
  }

  updateCurrentRequest(updates: Partial<ApiRequest>): void {
    if (!this.currentRequest) return;

    this.currentRequest = { ...this.currentRequest, ...updates };

    const event = new CustomEvent('request-updated', {
      detail: { request: this.currentRequest }
    });
    document.dispatchEvent(event);
  }

  private async sendRequest(): Promise<void> {
    if (!this.currentRequest) return;

    this.isSending = true;
    this.cancelRequested = false;
    this.hasEmittedCancellation = false;
    this.toggleRequestButtons(true);

    // Dispatch event to show loading state in response panel
    const sendingEvent = new CustomEvent('request-sending', {
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(sendingEvent);

    try {
      // Check and refresh OAuth token if needed
      let requestToSend = { ...this.currentRequest };

      if (this.editorsManager && requestToSend.auth && requestToSend.auth.type === 'oauth2') {
        // Check if we need to get a new token (no token exists)
        if (!requestToSend.auth.config.accessToken) {
          // Auto-generate token if none exists
          const newAuth = await this.editorsManager.autoGetOAuthToken(requestToSend.auth);
          if (newAuth) {
            requestToSend.auth = { ...newAuth, type: 'oauth2' };
            // Update the current request with new token
            this.updateCurrentRequest({ auth: { ...newAuth, type: 'oauth2' } });
            // Update the UI to show the new token
            this.editorsManager.updateTokenInfo(newAuth.config);
            this.editorsManager.updateOAuthStatus('Token obtained successfully', 'success');
          }
        } else {
          // Check if token is expired first
          const isExpired = this.editorsManager.isOAuthTokenExpired(requestToSend.auth);
          
          if (isExpired) {
            // Try to refresh if token is expired/expiring
            const refreshedAuth = await this.editorsManager.autoRefreshOAuthToken(requestToSend.auth);
            if (refreshedAuth) {
              requestToSend.auth = { ...refreshedAuth, type: 'oauth2' };
              // Update the current request with refreshed token
              this.updateCurrentRequest({ auth: { ...refreshedAuth, type: 'oauth2' } });
              // Update the UI to show the new token and clear expired status
              this.editorsManager.updateTokenInfo(refreshedAuth.config);
              this.editorsManager.updateOAuthStatus('Token refreshed successfully', 'success');
            } else {
              // If refresh failed (no refresh token), get a new token
              const newAuth = await this.editorsManager.autoGetOAuthToken(requestToSend.auth);
              if (newAuth) {
                requestToSend.auth = { ...newAuth, type: 'oauth2' };
                // Update the current request with new token
                this.updateCurrentRequest({ auth: { ...newAuth, type: 'oauth2' } });
                // Update the UI to show the new token and clear expired status
                this.editorsManager.updateTokenInfo(newAuth.config);
                this.editorsManager.updateOAuthStatus('New token obtained successfully', 'success');
              }
            }
          }
        }
      }

      const response = await window.apiCourier.request.send(requestToSend);

      if (this.cancelRequested) {
        this.emitCancellationEvent();
        return;
      }

      const event = new CustomEvent('response-received', {
        detail: { response, request: requestToSend }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Request failed:', error);
      const message = (error as Error).message || '';

      if (message.toLowerCase().includes('cancel')) {
        this.emitCancellationEvent();
      } else {
        this.onShowError('Request failed: ' + message);

        // Dispatch event to hide loading state
        const failedEvent = new CustomEvent('request-failed', {
          detail: { error: message }
        });
        document.dispatchEvent(failedEvent);
      }
    } finally {
      this.isSending = false;
      this.cancelRequested = false;
      this.toggleRequestButtons(false);
    }
  }

  private async cancelRequest(): Promise<void> {
    if (!this.currentRequest || !this.isSending || this.cancelRequested) return;

    this.cancelRequested = true;
    this.toggleRequestButtons(true);

    try {
      const cancelled = await window.apiCourier.request.cancel(this.currentRequest.id);
      if (cancelled) {
        this.emitCancellationEvent();
      } else {
        this.cancelRequested = false;
        this.toggleRequestButtons(true);
      }
    } catch (error) {
      console.error('Failed to cancel request:', error);
      this.cancelRequested = false;
      this.toggleRequestButtons(true);
    }
  }

  private toggleRequestButtons(isSending: boolean): void {
    const sendBtn = document.getElementById('send-request') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('cancel-request') as HTMLButtonElement | null;

    if (sendBtn) {
      sendBtn.textContent = isSending ? 'Sending...' : 'Send';
      sendBtn.disabled = isSending;
    }

    if (cancelBtn) {
      cancelBtn.style.display = isSending ? 'inline-flex' : 'none';
      cancelBtn.classList.toggle('visible', isSending);
      cancelBtn.textContent = this.cancelRequested ? 'Cancelling...' : 'Cancel';
      cancelBtn.disabled = this.cancelRequested;
    }
  }

  private emitCancellationEvent(): void {
    if (this.hasEmittedCancellation) return;

    const cancelledEvent = new CustomEvent('request-cancelled', {
      detail: { requestId: this.currentRequest?.id }
    });
    document.dispatchEvent(cancelledEvent);
    this.hasEmittedCancellation = true;
  }
}
