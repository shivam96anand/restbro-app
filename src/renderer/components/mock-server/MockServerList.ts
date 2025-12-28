/**
 * Mock Server List Component
 * Renders the list of mock servers in the sidebar
 */
import {
  MockServerDefinition,
  MockServerRuntimeStatus,
} from '../MockServerTabManager';

export class MockServerList {
  onSelect: ((serverId: string) => void) | null = null;
  onDelete: ((serverId: string) => void) | null = null;

  render(
    container: HTMLElement,
    servers: MockServerDefinition[],
    runtimeStatus: MockServerRuntimeStatus[],
    selectedServerId: string | null
  ): void {
    if (servers.length === 0) {
      container.innerHTML = `
        <div class="mock-server-list-empty">
          <p>No servers yet</p>
          <p class="hint">Click + to create one</p>
        </div>
      `;
      return;
    }

    container.innerHTML = servers
      .map((server) => {
        const status = runtimeStatus.find((s) => s.serverId === server.id);
        const isRunning = status?.isRunning ?? false;
        const isSelected = server.id === selectedServerId;
        const portDisplay = server.port !== null ? `:${server.port}` : '';
        const addressDisplay = `${server.host}${portDisplay}`;

        return `
          <div class="mock-server-list-item ${isSelected ? 'selected' : ''}" data-server-id="${server.id}">
            <div class="mock-server-list-item-info">
              <span class="mock-server-name">${this.escapeHtml(server.name)}</span>
              <span class="mock-server-address">${this.escapeHtml(addressDisplay)}</span>
            </div>
            <div class="mock-server-list-item-actions">
              <span class="mock-server-status ${isRunning ? 'running' : 'stopped'}">
                ${isRunning ? '●' : '○'}
              </span>
              <button class="mock-server-delete-btn" data-server-id="${server.id}" title="Delete server">×</button>
            </div>
          </div>
        `;
      })
      .join('');

    // Add click listeners
    container.querySelectorAll('.mock-server-list-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        // Don't select if clicking delete button
        if (target.classList.contains('mock-server-delete-btn')) return;
        const serverId = (item as HTMLElement).dataset.serverId;
        if (serverId && this.onSelect) {
          this.onSelect(serverId);
        }
      });
    });

    container.querySelectorAll('.mock-server-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const serverId = (btn as HTMLElement).dataset.serverId;
        if (serverId && this.onDelete) {
          if (confirm('Delete this server?')) {
            this.onDelete(serverId);
          }
        }
      });
    });
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
