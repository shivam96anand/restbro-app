import { ResponseViewMode, ResponseViewer } from './ResponseViewer';

interface ResponseControlsState {
  hasBody: boolean;
  availableModes: ResponseViewMode[];
  viewMode: ResponseViewMode;
  editorApplicable: boolean;
  wordWrap: boolean;
  fontSize: number;
  stats: { chars: number; bytes: number; lines: number } | null;
}

const WRAP_ICON = `<svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true">
  <path d="M2 5h16M2 10h11a3 3 0 0 1 0 6h-3m0 0 2-2m-2 2 2 2M2 15h5"
    fill="none" stroke="currentColor" stroke-width="1.4"
    stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Renders the response bottom-bar controls (view mode, word wrap, font size,
 * body stats, JSON path breadcrumb) and wires them to the ResponseViewer.
 *
 * The controls live in `.response-bottom-bar` alongside the layout toggle and
 * only appear when the Body tab shows a rendered response.
 */
export class ResponseControlsBar {
  private root: HTMLElement | null = null;
  private modesEl: HTMLElement | null = null;
  private wrapBtn: HTMLButtonElement | null = null;
  private fontEl: HTMLElement | null = null;
  private statsEl: HTMLElement | null = null;
  private pathBtn: HTMLButtonElement | null = null;

  private activeTab = 'body';
  private state: ResponseControlsState | null = null;
  private currentPath: string | null = null;
  private copyResetTimer: number | null = null;

  constructor(private viewer: ResponseViewer) {
    this.render();
    this.listen();
  }

  public setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.applyVisibility();
  }

  private render(): void {
    const bar = document.querySelector('.response-bottom-bar');
    if (!bar) return;

    const root = document.createElement('div');
    root.className = 'response-controls';
    root.hidden = true;
    root.innerHTML = `
      <div class="rc-modes" role="group" aria-label="Response view mode"></div>
      <button type="button" class="rc-btn rc-wrap" title="Word wrap" aria-label="Toggle word wrap" aria-pressed="false">${WRAP_ICON}</button>
      <span class="rc-font">
        <button type="button" class="rc-btn rc-font-dec" title="Decrease font size" aria-label="Decrease font size">A&minus;</button>
        <button type="button" class="rc-btn rc-font-inc" title="Increase font size" aria-label="Increase font size">A+</button>
      </span>
      <span class="rc-stats" title="Response body size"></span>
      <button type="button" class="rc-path" title="Copy JSON path" aria-label="Copy JSON path" hidden></button>
    `;

    // Keep the controls on the left; the layout toggle stays on the right.
    bar.insertBefore(root, bar.firstChild);

    this.root = root;
    this.modesEl = root.querySelector('.rc-modes');
    this.wrapBtn = root.querySelector('.rc-wrap');
    this.fontEl = root.querySelector('.rc-font');
    this.statsEl = root.querySelector('.rc-stats');
    this.pathBtn = root.querySelector('.rc-path');

    this.wrapBtn?.addEventListener('click', () => {
      this.viewer.setWordWrap(!this.viewer.getWordWrap());
    });
    root
      .querySelector('.rc-font-dec')
      ?.addEventListener('click', () => this.viewer.adjustFontSize(-1));
    root
      .querySelector('.rc-font-inc')
      ?.addEventListener('click', () => this.viewer.adjustFontSize(1));
    this.pathBtn?.addEventListener('click', () => this.copyPath());
  }

  private listen(): void {
    document.addEventListener('response-controls-state', (e: Event) => {
      this.state = (e as CustomEvent).detail as ResponseControlsState;
      this.applyState();
    });
    document.addEventListener('response-json-path-changed', (e: Event) => {
      this.currentPath = (e as CustomEvent).detail?.path ?? null;
      this.applyPath();
    });
  }

  private applyState(): void {
    if (!this.state) return;
    const s = this.state;

    // View-mode segment
    if (this.modesEl) {
      const show = s.availableModes.length > 0;
      this.modesEl.hidden = !show;
      if (show) this.renderModes(s.availableModes, s.viewMode);
    }

    // Word wrap
    if (this.wrapBtn) {
      this.wrapBtn.hidden = !s.editorApplicable;
      this.wrapBtn.classList.toggle('active', s.wordWrap);
      this.wrapBtn.setAttribute('aria-pressed', String(s.wordWrap));
    }

    // Font size
    if (this.fontEl) this.fontEl.hidden = !s.editorApplicable;

    // Stats
    if (this.statsEl) {
      if (s.stats) {
        this.statsEl.hidden = false;
        this.statsEl.textContent = this.formatStats(s.stats);
      } else {
        this.statsEl.hidden = true;
      }
    }

    this.applyVisibility();
  }

  private renderModes(
    modes: ResponseViewMode[],
    active: ResponseViewMode
  ): void {
    if (!this.modesEl) return;
    const labels: Record<ResponseViewMode, string> = {
      pretty: 'Pretty',
      raw: 'Raw',
    };
    this.modesEl.innerHTML = modes
      .map(
        (m) =>
          `<button type="button" class="rc-mode-btn${m === active ? ' active' : ''}" data-mode="${m}" title="${labels[m]} view" aria-pressed="${m === active}">${labels[m]}</button>`
      )
      .join('');
    this.modesEl
      .querySelectorAll<HTMLButtonElement>('.rc-mode-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.mode as ResponseViewMode;
          void this.viewer.setViewMode(mode);
        });
      });
  }

  private applyPath(): void {
    if (!this.pathBtn) return;
    if (this.currentPath && this.activeTab === 'body') {
      this.pathBtn.hidden = false;
      this.pathBtn.textContent = this.currentPath;
      this.pathBtn.title = `Copy path: ${this.currentPath}`;
    } else {
      this.pathBtn.hidden = true;
    }
    this.applyVisibility();
  }

  private applyVisibility(): void {
    if (!this.root) return;
    const visible = this.activeTab === 'body' && !!this.state?.hasBody;
    this.root.hidden = !visible;
    if (!visible && this.pathBtn) this.pathBtn.hidden = true;
  }

  private async copyPath(): Promise<void> {
    if (!this.pathBtn || !this.currentPath) return;
    try {
      await navigator.clipboard.writeText(this.currentPath);
    } catch {
      return;
    }
    const original = this.currentPath;
    this.pathBtn.textContent = 'Copied!';
    this.pathBtn.classList.add('copied');
    if (this.copyResetTimer) window.clearTimeout(this.copyResetTimer);
    this.copyResetTimer = window.setTimeout(() => {
      if (this.pathBtn && this.currentPath === original) {
        this.pathBtn.textContent = original;
      }
      this.pathBtn?.classList.remove('copied');
    }, 1000);
  }

  private formatStats(stats: {
    chars: number;
    bytes: number;
    lines: number;
  }): string {
    const n = (v: number): string => v.toLocaleString();
    return `${n(stats.chars)} chars · ${this.formatBytes(stats.bytes)} · ${n(stats.lines)} lines`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
