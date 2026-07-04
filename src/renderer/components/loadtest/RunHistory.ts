import { LoadTestHistoryEntry } from '../../../shared/types';
import { iconHtml } from '../../utils/icons';

interface RunHistoryCallbacks {
  onView: (entry: LoadTestHistoryEntry) => void;
  onClear: () => void;
}

/**
 * Renders the "History" table of previously completed load test runs shown at
 * the bottom of the load test form. Read-only: rows can be viewed (re-opening
 * the stored summary) or cleared.
 */
export class RunHistory {
  private container: HTMLElement | null = null;
  private entries: LoadTestHistoryEntry[] = [];
  private callbacks: RunHistoryCallbacks | null = null;

  render(
    container: HTMLElement,
    entries: LoadTestHistoryEntry[],
    callbacks: RunHistoryCallbacks
  ): void {
    this.container = container;
    this.entries = entries;
    this.callbacks = callbacks;

    const header = `
      <div class="loadtest-history-header">
        <h3>${iconHtml('clock')}<span>History</span></h3>
        ${
          entries.length
            ? '<button id="loadtest-history-clear" class="btn btn-secondary" type="button">Clear History</button>'
            : ''
        }
      </div>
    `;

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="loadtest-history">
          ${header}
          <div class="loadtest-history-empty">
            No load tests yet. Completed runs will appear here.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="loadtest-history">
        ${header}
        <div class="loadtest-history-table-wrap">
          <table class="loadtest-history-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Target</th>
                <th>Env</th>
                <th class="num">RPM</th>
                <th class="num">Duration</th>
                <th class="num">Completed</th>
                <th class="num">Success</th>
                <th class="num">Errors</th>
                <th class="num">P95</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${entries.map((entry) => this.renderRow(entry)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private renderRow(entry: LoadTestHistoryEntry): string {
    const summary = entry.summary;
    const when = new Date(entry.finishedAt).toLocaleString();
    const successRate =
      summary.completed > 0
        ? ((summary.success / summary.completed) * 100).toFixed(0)
        : '0';
    const errorClass = summary.error > 0 ? ' is-error' : '';

    return `
      <tr>
        <td class="ht-when">${this.escapeHtml(when)}</td>
        <td class="ht-target" title="${this.escapeHtml(entry.targetLabel)}">${this.escapeHtml(entry.targetLabel)}</td>
        <td class="ht-env">${this.escapeHtml(entry.environmentName || '—')}</td>
        <td class="num">${entry.rpm.toLocaleString()}</td>
        <td class="num">${this.formatDuration(entry.durationSec)}</td>
        <td class="num">${summary.completed.toLocaleString()}</td>
        <td class="num">${successRate}%</td>
        <td class="num${errorClass}">${summary.error.toLocaleString()}</td>
        <td class="num">${summary.p95.toFixed(0)}ms</td>
        <td class="ht-actions">
          <button class="loadtest-history-view btn btn-secondary" data-id="${this.escapeHtml(entry.id)}" type="button">View</button>
        </td>
      </tr>
    `;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    const clearBtn = this.container.querySelector('#loadtest-history-clear');
    clearBtn?.addEventListener('click', () => {
      this.callbacks?.onClear();
    });

    const viewButtons = this.container.querySelectorAll(
      '.loadtest-history-view'
    );
    viewButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        const entry = this.entries.find((e) => e.id === id);
        if (entry) this.callbacks?.onView(entry);
      });
    });
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remaining = Math.round(seconds % 60);
      return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
