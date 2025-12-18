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

    console.log('[RequestDataManager] Updating request with:', {
      hasAuth: !!updates.auth,
      authType: updates.auth?.type,
      hasAccessToken: !!(updates.auth as any)?.config?.accessToken
    });

    this.currentRequest = { ...this.currentRequest, ...updates };

    console.log('[RequestDataManager] Current request after update has token:', !!(this.currentRequest.auth as any)?.config?.accessToken);

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
      const response = await this.sendRequestWithAuth(this.currentRequest, false);

      if (this.cancelRequested) {
        this.emitCancellationEvent();
        return;
      }

      const event = new CustomEvent('response-received', {
        detail: { response, request: this.currentRequest }
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

  private async sendRequestWithAuth(request: ApiRequest, isRetry: boolean): Promise<any> {
    let requestToSend = { ...request };

    // Proactive token management for OAuth2
    if (this.editorsManager && requestToSend.auth && requestToSend.auth.type === 'oauth2') {
      requestToSend = await this.ensureValidOAuthToken(requestToSend, isRetry);
    }

    try {
      const response = await window.apiCourier.request.send(requestToSend);
      return response;
    } catch (error) {
      const message = (error as Error).message || '';

      // Check if this is an auth error (401/403) and we have OAuth2 configured
      const isAuthError = message.includes('401') ||
                         message.includes('403') ||
                         message.toLowerCase().includes('unauthorized') ||
                         message.toLowerCase().includes('forbidden') ||
                         message.toLowerCase().includes('token') && message.toLowerCase().includes('expir');

      // Only retry once for auth errors with OAuth2
      if (!isRetry && isAuthError && this.editorsManager && requestToSend.auth && requestToSend.auth.type === 'oauth2') {
        console.log('Auth error detected, attempting token refresh and retry...');

        // Force token refresh/regeneration
        const newRequest = await this.forceTokenRefresh(requestToSend);

        if (newRequest) {
          // Retry the request with the new token
          return await this.sendRequestWithAuth(newRequest, true);
        }
      }

      // Re-throw if not retryable or retry failed
      throw error;
    }
  }

  private async ensureValidOAuthToken(request: ApiRequest, forceFresh: boolean): Promise<ApiRequest> {
    if (!this.editorsManager || !request.auth || request.auth.type !== 'oauth2') {
      return request;
    }

    // Ensure the OAuth2Manager has the current collectionId for variable resolution
    if (request.collectionId) {
      await this.editorsManager.loadAuth(request.auth, request.collectionId);
    }

    let requestToUpdate = { ...request };

    // Case 1: No token exists at all
    if (!requestToUpdate.auth.config.accessToken) {
      const newAuth = await this.editorsManager.autoGetOAuthToken(requestToUpdate.auth);
      if (newAuth) {
        requestToUpdate.auth = { ...newAuth, type: 'oauth2' };
        this.updateCurrentRequest({ auth: { ...newAuth, type: 'oauth2' } });
        this.editorsManager.updateTokenInfo(newAuth.config);
        this.editorsManager.updateOAuthStatus('Token obtained successfully', 'success');
      } else {
        throw new Error('Failed to obtain OAuth token. Please check your configuration.');
      }
      return requestToUpdate;
    }

    // Case 2: Token exists but might be expired (check locally)
    const isExpired = this.editorsManager.isOAuthTokenExpired(requestToUpdate.auth);

    if (isExpired || forceFresh) {
      // Try to refresh first if we have a refresh token
      const refreshedAuth = await this.editorsManager.autoRefreshOAuthToken(requestToUpdate.auth);

      if (refreshedAuth) {
        requestToUpdate.auth = { ...refreshedAuth, type: 'oauth2' };
        this.updateCurrentRequest({ auth: { ...refreshedAuth, type: 'oauth2' } });
        this.editorsManager.updateTokenInfo(refreshedAuth.config);
        this.editorsManager.updateOAuthStatus('Token refreshed successfully', 'success');
      } else {
        // Refresh failed or no refresh token - get a new token
        const newAuth = await this.editorsManager.autoGetOAuthToken(requestToUpdate.auth);
        if (newAuth) {
          requestToUpdate.auth = { ...newAuth, type: 'oauth2' };
          this.updateCurrentRequest({ auth: { ...newAuth, type: 'oauth2' } });
          this.editorsManager.updateTokenInfo(newAuth.config);
          this.editorsManager.updateOAuthStatus('New token obtained successfully', 'success');
        } else {
          throw new Error('Failed to refresh or obtain new OAuth token.');
        }
      }
    }

    return requestToUpdate;
  }

  private async forceTokenRefresh(request: ApiRequest): Promise<ApiRequest | null> {
    if (!this.editorsManager || !request.auth || request.auth.type !== 'oauth2') {
      return null;
    }

    console.log('Forcing token refresh after auth error...');

    // Ensure the OAuth2Manager has the current collectionId for variable resolution
    if (request.collectionId) {
      await this.editorsManager.loadAuth(request.auth, request.collectionId);
    }

    // Try refresh first
    const refreshedAuth = await this.editorsManager.autoRefreshOAuthToken(request.auth);

    if (refreshedAuth) {
      const updatedRequest = {
        ...request,
        auth: { ...refreshedAuth, type: 'oauth2' }
      };
      this.updateCurrentRequest({ auth: { ...refreshedAuth, type: 'oauth2' } });
      this.editorsManager.updateTokenInfo(refreshedAuth.config);
      this.editorsManager.updateOAuthStatus('Token refreshed after auth error', 'success');
      return updatedRequest;
    }

    // If refresh failed, get new token
    const newAuth = await this.editorsManager.autoGetOAuthToken(request.auth);

    if (newAuth) {
      const updatedRequest = {
        ...request,
        auth: { ...newAuth, type: 'oauth2' }
      };
      this.updateCurrentRequest({ auth: { ...newAuth, type: 'oauth2' } });
      this.editorsManager.updateTokenInfo(newAuth.config);
      this.editorsManager.updateOAuthStatus('New token obtained after auth error', 'success');
      return updatedRequest;
    }

    return null;
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
