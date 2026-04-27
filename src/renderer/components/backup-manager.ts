interface BackupInfo {
  id: string;
  filename: string;
  createdAt: number;
}

interface BackupManagerOptions {
  /**
   * Invoked before the restore IPC is called so the app can pause
   * anything that might race the restore (e.g. the renderer's 30s
   * autosave that pushes in-memory state back to the store).
   */
  onBeforeRestore?: () => void;
}

export class BackupManager {
  private button: HTMLButtonElement | null = null;
  private menu: HTMLDivElement | null = null;
  private options: BackupManagerOptions;

  constructor(options: BackupManagerOptions = {}) {
    this.options = options;
  }

  initialize(): void {
    this.button = document.getElementById(
      'backup-button'
    ) as HTMLButtonElement | null;
    if (!this.button) return;

    this.button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.menu) {
        this.closeMenu();
      } else {
        void this.openMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (!this.menu) return;
      if (this.menu.contains(event.target as Node)) return;
      if (this.button && this.button.contains(event.target as Node)) return;
      this.closeMenu();
    });
  }

  private async openMenu(): Promise<void> {
    if (!this.button) return;
    const backups = await this.fetchBackups();
    this.menu = this.buildMenu(backups);
    document.body.appendChild(this.menu);
    this.positionMenu();
    // Fetch lightweight stats per backup in parallel and inject them.
    void this.populateBackupStats(backups);
  }

  private closeMenu(): void {
    if (this.menu && document.body.contains(this.menu)) {
      document.body.removeChild(this.menu);
    }
    this.menu = null;
  }

  private async fetchBackups(): Promise<BackupInfo[]> {
    try {
      return await window.restbro.backups.list();
    } catch (error) {
      console.error('Failed to load backups:', error);
      return [];
    }
  }

  private buildMenu(backups: BackupInfo[]): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'backup-menu';

    const title = document.createElement('div');
    title.className = 'backup-menu-title';
    title.textContent = 'Time Machine';
    menu.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'backup-menu-subtitle';
    subtitle.textContent =
      'Restore replaces your current data with the chosen snapshot.';
    subtitle.style.cssText =
      'padding: 0 12px 8px; font-size: 11px; color: var(--text-secondary); line-height: 1.4;';
    menu.appendChild(subtitle);

    const list = document.createElement('div');
    list.className = 'backup-menu-list';

    if (backups.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'backup-menu-empty';
      empty.textContent = 'No backups yet';
      list.appendChild(empty);
    } else {
      backups.forEach((backup) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'backup-menu-item';
        item.dataset.backupId = backup.id;
        item.style.cssText =
          'display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left;';

        const label = document.createElement('span');
        label.textContent = this.formatBackupLabel(backup);
        label.style.cssText = 'font-size: 13px; color: var(--text-primary);';
        item.appendChild(label);

        const stats = document.createElement('span');
        stats.className = 'backup-menu-item-stats';
        stats.textContent = 'Loading…';
        stats.style.cssText = 'font-size: 11px; color: var(--text-secondary);';
        item.appendChild(stats);

        item.addEventListener('click', () => {
          void this.confirmAndRestore(backup);
        });
        list.appendChild(item);
      });
    }

    menu.appendChild(list);
    return menu;
  }

  private async populateBackupStats(backups: BackupInfo[]): Promise<void> {
    if (!this.menu) return;
    const describeFn = window.restbro.backups.describe;
    if (typeof describeFn !== 'function') return;
    await Promise.all(
      backups.map(async (backup) => {
        try {
          const info = await describeFn(backup.id);
          if (!this.menu) return;
          const item = this.menu.querySelector(
            `[data-backup-id="${CSS.escape(backup.id)}"]`
          );
          const stats = item?.querySelector(
            '.backup-menu-item-stats'
          ) as HTMLElement | null;
          if (!stats) return;
          if (!info) {
            stats.textContent = 'unreadable';
            return;
          }
          const sizeKb = Math.max(1, Math.round(info.sizeBytes / 1024));
          stats.textContent = `${info.collections} folders · ${info.requests} requests · ${sizeKb} KB`;
        } catch {
          /* ignore */
        }
      })
    );
  }

  /**
   * Confirm with the user, run the restore, and surface success/failure
   * with a toast. Pauses the renderer's autosave first so it can't race
   * the restore between IPC return and `window.location.reload()`.
   */
  private async confirmAndRestore(backup: BackupInfo): Promise<void> {
    const ok = window.confirm(
      `Restore from ${this.formatBackupLabel(backup)}?\n\n` +
        `Your current collections, environments, history and tabs ` +
        `will be replaced with the contents of this snapshot. ` +
        `(A snapshot of your current state is saved automatically so ` +
        `you can roll this restore back too.)`
    );
    if (!ok) return;

    try {
      this.options.onBeforeRestore?.();
      await window.restbro.backups.restore(backup.id);
      this.showToast(
        `Restored snapshot from ${this.formatBackupLabel(backup)}. Reloading…`,
        'success'
      );
      // Give the toast a beat to render, then reload so the renderer
      // re-fetches state straight from disk.
      window.setTimeout(() => window.location.reload(), 350);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      this.showToast(
        `Restore failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        'error'
      );
    }
  }

  private positionMenu(): void {
    if (!this.menu || !this.button) return;
    const rect = this.button.getBoundingClientRect();
    const menuRect = this.menu.getBoundingClientRect();
    const left = Math.min(rect.left, window.innerWidth - menuRect.width - 12);
    const top = rect.bottom + 8;
    this.menu.style.left = `${Math.max(12, left)}px`;
    this.menu.style.top = `${top}px`;
  }

  private formatBackupLabel(backup: BackupInfo): string {
    if (!backup.createdAt) {
      return backup.filename;
    }
    const date = new Date(backup.createdAt);
    return date.toLocaleString();
  }

  private showToast(message: string, variant: 'success' | 'error'): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 10001;
      max-width: 360px; padding: 12px 16px; border-radius: 6px;
      color: #fff; font-size: 13px; line-height: 1.4;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      background: ${variant === 'success' ? 'var(--success-color, #16a34a)' : 'var(--error-color, #d33)'};
    `;
    document.body.appendChild(toast);
    window.setTimeout(() => {
      if (document.body.contains(toast)) document.body.removeChild(toast);
    }, 3500);
  }
}
