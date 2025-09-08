import { EventBus } from '../utils/event-bus';
import { Response } from '../../shared/types';

export class ResponseManager {
  private currentResponse: Response | null = null;

  constructor(private eventBus: EventBus) {}

  initialize(): void {
    this.setupEventListeners();
    this.resetResponseUI();
  }

  private setupEventListeners(): void {
    this.eventBus.on('response:received', (response: Response) => {
      this.currentResponse = response;
      this.displayResponse(response);
    });

    this.eventBus.on('request:sending', () => {
      this.showLoadingState();
    });

    this.eventBus.on('request:error', (error: any) => {
      this.showErrorState(error);
    });

    this.eventBus.on('request:display', (request: any) => {
      // Clear response when switching to a different request
      if (request) {
        this.resetResponseUI();
      }
    });

    this.eventBus.on('request:selected', (request: any) => {
      // Clear response when selecting a different request
      if (request) {
        this.resetResponseUI();
      }
    });
  }

  private displayResponse(response: Response): void {
    this.updateResponseInfo(response);
    this.updateResponseBody(response);
    this.updateResponseHeaders(response);
  }

  private updateResponseInfo(response: Response): void {
    // Status
    const statusElement = document.getElementById('responseStatus');
    if (statusElement) {
      statusElement.textContent = `${response.status} ${response.statusText}`;
      
      // Remove previous status classes
      statusElement.classList.remove('success', 'error', 'warning');
      
      // Add appropriate status class
      if (response.status >= 200 && response.status < 300) {
        statusElement.classList.add('success');
      } else if (response.status >= 400) {
        statusElement.classList.add('error');
      } else if (response.status >= 300) {
        statusElement.classList.add('warning');
      }
    }

    // Time
    const timeElement = document.getElementById('responseTime');
    if (timeElement) {
      timeElement.textContent = `${response.time}ms`;
    }

    // Size
    const sizeElement = document.getElementById('responseSize');
    if (sizeElement) {
      sizeElement.textContent = this.formatBytes(response.size);
    }
  }

  private updateResponseBody(response: Response): void {
    const bodyElement = document.getElementById('responseBody');
    if (!bodyElement) return;

    try {
      let formattedBody: string;
      
      if (typeof response.body === 'string') {
        // Try to parse as JSON for pretty formatting
        try {
          const parsed = JSON.parse(response.body);
          formattedBody = JSON.stringify(parsed, null, 2);
        } catch {
          formattedBody = response.body;
        }
      } else if (typeof response.body === 'object') {
        formattedBody = JSON.stringify(response.body, null, 2);
      } else {
        formattedBody = String(response.body);
      }

      bodyElement.textContent = formattedBody;
      bodyElement.classList.remove('empty-state');
      
      // Add syntax highlighting class based on content type
      const contentType = this.getResponseContentType(response);
      this.applySyntaxHighlighting(bodyElement, contentType);
      
    } catch (error) {
      bodyElement.textContent = 'Error displaying response body';
      console.error('Error formatting response body:', error);
    }
  }

  private updateResponseHeaders(response: Response): void {
    const headersContainer = document.getElementById('responseHeaders');
    if (!headersContainer) return;

    headersContainer.innerHTML = '';

    if (!response.headers || Object.keys(response.headers).length === 0) {
      headersContainer.innerHTML = `
        <div class="empty-state">
          <span>📋</span>
          <p>No headers received</p>
        </div>
      `;
      return;
    }

    Object.entries(response.headers).forEach(([name, value]) => {
      const headerItem = document.createElement('div');
      headerItem.className = 'header-item';
      headerItem.innerHTML = `
        <span class="header-name">${name}:</span>
        <span class="header-value">${value}</span>
      `;
      headersContainer.appendChild(headerItem);
    });
  }

  private showLoadingState(): void {
    // Status
    const statusElement = document.getElementById('responseStatus');
    if (statusElement) {
      statusElement.textContent = 'Sending...';
      statusElement.classList.remove('success', 'error', 'warning');
    }

    // Time
    const timeElement = document.getElementById('responseTime');
    if (timeElement) {
      timeElement.textContent = '...';
    }

    // Size
    const sizeElement = document.getElementById('responseSize');
    if (sizeElement) {
      sizeElement.textContent = '...';
    }

    // Body
    const bodyElement = document.getElementById('responseBody');
    if (bodyElement) {
      bodyElement.innerHTML = `
        <div class="loading-state">
          <span>⏳</span>
          <p>Sending request...</p>
        </div>
      `;
    }

    // Headers
    const headersContainer = document.getElementById('responseHeaders');
    if (headersContainer) {
      headersContainer.innerHTML = `
        <div class="loading-state">
          <span>⏳</span>
          <p>Loading headers...</p>
        </div>
      `;
    }
  }

  private showErrorState(error: any): void {
    // Status
    const statusElement = document.getElementById('responseStatus');
    if (statusElement) {
      statusElement.textContent = 'Error';
      statusElement.classList.remove('success', 'warning');
      statusElement.classList.add('error');
    }

    // Time
    const timeElement = document.getElementById('responseTime');
    if (timeElement) {
      timeElement.textContent = '0ms';
    }

    // Size
    const sizeElement = document.getElementById('responseSize');
    if (sizeElement) {
      sizeElement.textContent = '0 B';
    }

    // Body
    const bodyElement = document.getElementById('responseBody');
    if (bodyElement) {
      bodyElement.innerHTML = `
        <div class="error-state">
          <span>❌</span>
          <p>Request failed</p>
          <pre>${error.message || error}</pre>
        </div>
      `;
    }

    // Headers
    const headersContainer = document.getElementById('responseHeaders');
    if (headersContainer) {
      headersContainer.innerHTML = `
        <div class="empty-state">
          <span>📋</span>
          <p>No headers available</p>
        </div>
      `;
    }
  }

  private resetResponseUI(): void {
    // Status
    const statusElement = document.getElementById('responseStatus');
    if (statusElement) {
      statusElement.textContent = 'Ready';
      statusElement.classList.remove('success', 'error', 'warning');
    }

    // Time
    const timeElement = document.getElementById('responseTime');
    if (timeElement) {
      timeElement.textContent = '0ms';
    }

    // Size
    const sizeElement = document.getElementById('responseSize');
    if (sizeElement) {
      sizeElement.textContent = '0 B';
    }

    // Body
    const bodyElement = document.getElementById('responseBody');
    if (bodyElement) {
      bodyElement.innerHTML = `
        <div class="empty-state">
          <span>👋</span>
          <p>Send a request to see the response</p>
        </div>
      `;
    }

    // Headers
    const headersContainer = document.getElementById('responseHeaders');
    if (headersContainer) {
      headersContainer.innerHTML = `
        <div class="empty-state">
          <span>📋</span>
          <p>Response headers will appear here</p>
        </div>
      `;
    }
  }

  private getResponseContentType(response: Response): string {
    if (!response.headers) return 'text';
    
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    
    if (contentType.includes('application/json')) return 'json';
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
    if (contentType.includes('text/html')) return 'html';
    if (contentType.includes('text/css')) return 'css';
    if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) return 'javascript';
    
    return 'text';
  }

  private applySyntaxHighlighting(element: HTMLElement, contentType: string): void {
    // Remove previous syntax classes
    element.classList.remove('language-json', 'language-xml', 'language-html', 'language-css', 'language-javascript');
    
    // Add appropriate syntax class
    switch (contentType) {
      case 'json':
        element.classList.add('language-json');
        break;
      case 'xml':
        element.classList.add('language-xml');
        break;
      case 'html':
        element.classList.add('language-html');
        break;
      case 'css':
        element.classList.add('language-css');
        break;
      case 'javascript':
        element.classList.add('language-javascript');
        break;
      default:
        element.classList.add('language-text');
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  getCurrentResponse(): Response | null {
    return this.currentResponse;
  }

  exportResponse(): void {
    if (!this.currentResponse) {
      this.eventBus.emit('toast:show', {
        message: 'No response to export',
        type: 'warning'
      });
      return;
    }

    const exportData = {
      request: {
        method: 'GET', // This would come from the current request
        url: this.currentResponse.url,
        timestamp: new Date().toISOString()
      },
      response: this.currentResponse
    };

    // Create download link
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.eventBus.emit('toast:show', {
      message: 'Response exported successfully',
      type: 'success'
    });
  }
}
