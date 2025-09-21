import { ApiRequest } from '../../../shared/types';

export class RequestDataManager {
  private currentRequest: ApiRequest | null = null;
  private onShowError: (message: string) => void;

  constructor(onShowError: (message: string) => void) {
    this.onShowError = onShowError;
  }

  setupSendButton(): void {
    const sendBtn = document.getElementById('send-request');

    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        await this.sendRequest();
      });
    }
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

    const sendBtn = document.getElementById('send-request');
    if (sendBtn) {
      sendBtn.textContent = 'Sending...';
      (sendBtn as HTMLButtonElement).disabled = true;
    }

    try {
      const response = await window.apiCourier.request.send(this.currentRequest);

      const event = new CustomEvent('response-received', {
        detail: { response, request: this.currentRequest }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Request failed:', error);
      this.onShowError('Request failed: ' + (error as Error).message);
    } finally {
      if (sendBtn) {
        sendBtn.textContent = 'Send';
        (sendBtn as HTMLButtonElement).disabled = false;
      }
    }
  }
}