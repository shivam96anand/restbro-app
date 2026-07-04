import { LoadTestForm } from './LoadTestForm';
import { iconHtml } from '../../utils/icons';
import { RunProgress } from './RunProgress';
import { RunSummary } from './RunSummary';
import { RunHistory } from './RunHistory';
import { LoadTestHistoryEntry } from '../../../shared/types';

interface LoadTestProgressTick {
  runId: string;
  scheduled: number;
  sent: number;
  completed: number;
  inFlight: number;
  elapsedSec: number;
}

interface LoadTestSummary {
  runId: string;
  totalPlanned: number;
  sent: number;
  completed: number;
  success: number;
  error: number;
  codeCounts: Record<string, number>;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50: number;
  p95: number;
  p99: number;
  throughputRps: number;
  wallTimeMs: number;
  startedAt: number;
  finishedAt: number;
}

type LoadTestState = 'form' | 'running' | 'summary';

export class LoadTestPage {
  private container: HTMLElement;
  private state: LoadTestState = 'form';
  private form: LoadTestForm;
  private progress: RunProgress;
  private summary: RunSummary;
  private history: RunHistory;

  private currentRunId: string | null = null;
  private currentConfig: any = null;
  private progressCleanup: (() => void) | null = null;
  private summaryCleanup: (() => void) | null = null;

  constructor() {
    this.container = document.getElementById('load-testing-tab')!;
    this.form = new LoadTestForm();
    this.progress = new RunProgress();
    this.summary = new RunSummary();
    this.history = new RunHistory();

    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    await this.renderForm();
    this.setupIpcListeners();
    this.setupPrefillListener();
  }

  /**
   * Listen for `loadtest-prefill-request` events (fired by the main
   * request bar's "Load test…" send option). Routes the request into the
   * form and, if we're mid-run or showing a summary, snaps back to the
   * editable form first.
   */
  private setupPrefillListener(): void {
    document.addEventListener('loadtest-prefill-request', (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const { request, collectionId } = detail as {
        request?: any;
        collectionId?: string;
      };
      if (!request) return;

      const applyPrefill = () => {
        this.form.prefillFromApiRequest(request, collectionId);
      };

      if (this.state !== 'form') {
        void this.renderForm().then(applyPrefill);
      } else {
        applyPrefill();
      }
    });
  }

  private setupEventListeners(): void {
    this.form.onStart = (config) => this.startLoadTest(config);
    this.progress.onCancel = () => this.cancelLoadTest();
    this.summary.onExportCsv = (runId) => this.exportCsv(runId);
    this.summary.onExportPdf = (runId, summary) =>
      this.exportPdf(runId, summary);
  }

  private setupIpcListeners(): void {
    this.progressCleanup = window.restbro.loadtest.onProgress(
      (progress: LoadTestProgressTick) => {
        if (progress.runId === this.currentRunId) {
          this.progress.updateProgress(progress);
        }
      }
    );

    this.summaryCleanup = window.restbro.loadtest.onSummary(
      (summary: LoadTestSummary) => {
        if (summary.runId === this.currentRunId) {
          void this.saveToHistory(summary);
          this.showSummary(summary);
        }
      }
    );
  }

  private async startLoadTest(config: any): Promise<void> {
    try {
      this.currentConfig = config;
      const result = await window.restbro.loadtest.start(config);
      this.currentRunId = result.runId;
      this.showProgress(config);
    } catch (error) {
      console.error('Failed to start load test:', error);
      this.showError(
        error instanceof Error ? error.message : 'Failed to start load test'
      );
    }
  }

  private async cancelLoadTest(): Promise<void> {
    if (!this.currentRunId) return;

    try {
      await window.restbro.loadtest.cancel(this.currentRunId);
    } catch (error) {
      console.error('Failed to cancel load test:', error);
    }
  }

  private async exportCsv(runId: string): Promise<void> {
    try {
      const result = await window.restbro.loadtest.exportCsv(runId);
      if (!result.ok) {
        this.showError(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
      this.showError('Failed to export CSV');
    }
  }

  private async exportPdf(
    runId: string,
    summary: LoadTestSummary
  ): Promise<void> {
    try {
      const result = await window.restbro.loadtest.exportPdf(runId, summary);
      if (!result.ok) {
        this.showError(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      this.showError('Failed to export PDF');
    }
  }

  private async renderForm(): Promise<void> {
    this.state = 'form';
    this.container.innerHTML = `
      <div class="load-test-container">
        <div class="load-test-header">
          <h2>Load Testing</h2>
          <p>Performance test your APIs with configurable load patterns</p>
        </div>
        <div id="load-test-form-container"></div>
        <div id="load-test-history-container"></div>
      </div>
    `;

    const formContainer = this.container.querySelector(
      '#load-test-form-container'
    )!;
    await this.form.render(formContainer as HTMLElement);

    await this.loadAndRenderHistory();
  }

  private showProgress(config: any): void {
    this.state = 'running';
    this.container.innerHTML = `
      <div class="load-test-container">
        <div class="load-test-header">
          <h2>Load Test Running</h2>
          <p>Test in progress...</p>
        </div>
        <div id="load-test-progress-container"></div>
      </div>
    `;

    const progressContainer = this.container.querySelector(
      '#load-test-progress-container'
    )!;
    this.progress.render(progressContainer as HTMLElement, config);
  }

  private showSummary(
    summary: LoadTestSummary,
    options: { historical?: boolean } = {}
  ): void {
    this.state = 'summary';
    const historical = options.historical === true;
    this.container.innerHTML = `
      <div class="load-test-container">
        <div class="load-test-header load-test-header--with-back">
          <button id="loadtest-back-btn" class="loadtest-back-btn" type="button">
            ${iconHtml('arrow-left')}<span>Back</span>
          </button>
          <div class="load-test-header-text">
            <h2>${historical ? 'Load Test Result' : 'Load Test Complete'}</h2>
            <p>${historical ? 'Viewing a previous run' : 'Test finished - view results below'}</p>
          </div>
        </div>
        <div id="load-test-summary-container"></div>
      </div>
    `;

    const backBtn = this.container.querySelector('#loadtest-back-btn');
    backBtn?.addEventListener('click', () => {
      void this.goBackToForm();
    });

    const summaryContainer = this.container.querySelector(
      '#load-test-summary-container'
    )!;
    this.summary.render(summaryContainer as HTMLElement, summary, {
      showExports: !historical,
    });
  }

  private async goBackToForm(): Promise<void> {
    await this.renderForm();
    if (this.currentConfig) {
      this.form.prefillConfig(this.currentConfig);
    }
  }

  /**
   * Persists a completed run to the load test history (newest first, capped to
   * 50 entries) so the History table survives restarts. Best-effort — a failure
   * here must never block showing the summary.
   */
  private async saveToHistory(summary: LoadTestSummary): Promise<void> {
    try {
      const config = this.currentConfig;
      if (!config) return;

      const state = await window.restbro.store.get();

      let targetKind: 'collection' | 'adhoc' = 'adhoc';
      let targetLabel = 'Ad-hoc request';
      if (config.target?.kind === 'collection') {
        targetKind = 'collection';
        const request = this.findRequestById(
          state.collections || [],
          config.target.requestId
        );
        targetLabel = request
          ? request.name || `${request.method} ${request.url}`
          : 'Saved request';
      } else if (config.target?.kind === 'adhoc') {
        targetLabel = `${config.target.method} ${config.target.url}`;
      }

      let environmentName: string | undefined;
      if (config.environmentId) {
        environmentName = (state.environments || []).find(
          (env: { id: string }) => env.id === config.environmentId
        )?.name;
      } else if (config.environmentId === '') {
        environmentName = 'No Environment';
      }

      const entry: LoadTestHistoryEntry = {
        id: summary.runId,
        startedAt: summary.startedAt,
        finishedAt: summary.finishedAt,
        rpm: config.rpm,
        durationSec: config.durationSec,
        targetKind,
        targetLabel,
        environmentName,
        summary,
      };

      const existing = state.loadTestHistory || [];
      const updated = [entry, ...existing].slice(0, 50);
      await window.restbro.store.set({ loadTestHistory: updated });
    } catch (error) {
      console.error('Failed to save load test history:', error);
    }
  }

  private async loadAndRenderHistory(): Promise<void> {
    const historyContainer = this.container.querySelector(
      '#load-test-history-container'
    ) as HTMLElement | null;
    if (!historyContainer) return;

    let entries: LoadTestHistoryEntry[] = [];
    try {
      const state = await window.restbro.store.get();
      entries = state.loadTestHistory || [];
    } catch (error) {
      console.error('Failed to load load test history:', error);
    }

    this.history.render(historyContainer, entries, {
      onView: (entry) => this.showSummary(entry.summary, { historical: true }),
      onClear: () => void this.clearHistory(),
    });
  }

  private async clearHistory(): Promise<void> {
    try {
      await window.restbro.store.set({ loadTestHistory: [] });
    } catch (error) {
      console.error('Failed to clear load test history:', error);
    }
    await this.loadAndRenderHistory();
  }

  private findRequestById(
    collections: Array<{
      request?: { id: string; name?: string; method: string; url: string };
    }>,
    requestId: string
  ): { id: string; name?: string; method: string; url: string } | null {
    for (const collection of collections) {
      if (collection.request?.id === requestId) {
        return collection.request;
      }
    }
    return null;
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'load-test-error';
    errorDiv.innerHTML = `
      <div class="error-message">
        <span class="error-icon">${iconHtml('warning')}</span>
        <span class="error-text">${message}</span>
      </div>
    `;

    this.container.prepend(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  destroy(): void {
    if (this.progressCleanup) {
      this.progressCleanup();
    }
    if (this.summaryCleanup) {
      this.summaryCleanup();
    }
  }
}
