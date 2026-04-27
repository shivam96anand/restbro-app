import { Collection, Environment } from '../../../shared/types';
import { ImportDialog } from './import-dialog';

export class ImportManager {
  private dialog: ImportDialog;
  private onImportComplete?: () => void;

  constructor(onImportComplete?: () => void) {
    this.onImportComplete = onImportComplete;
    this.dialog = new ImportDialog(this.handleImport.bind(this));
  }

  /**
   * Entry point from the Import button. Opens a clean two-option modal:
   *   1. Choose a file (or, on macOS, a folder)
   *   2. Paste raw text (cURL / .http / WSDL)
   *
   * Bruno collections are folder-based, but the user no longer has to pick a
   * dedicated "Bruno" option — picking the collection's `bruno.json` (or any
   * `.bru`) routes through the folder parser automatically, and on macOS the
   * native dialog lets them pick the folder directly.
   */
  async showImportDialog(): Promise<void> {
    const choice = await this.promptSourceChoice();
    if (choice === 'cancel') return;
    if (choice === 'paste') {
      await this.showPasteImport();
      return;
    }
    await this.showFileImport();
  }

  private async showFileImport(): Promise<void> {
    try {
      const result = await window.restbro.files.openDialog();

      if (result.canceled || result.filePaths.length === 0) {
        return;
      }

      const filePath = result.filePaths[0];

      // Bruno collections are filesystem-based. If the user picked the
      // collection root folder (macOS), or any `bruno.json` / `.bru` file
      // inside one, route to the folder parser using the appropriate dir.
      const folderTarget = await this.detectBrunoFolderTarget(filePath);
      if (folderTarget) {
        const parseResult =
          await window.restbro.import.parseFolderPreview(folderTarget);
        if (!parseResult.success) {
          this.showError(
            parseResult.error || 'Failed to parse collection folder'
          );
          return;
        }
        await this.dialog.show(parseResult.preview);
        return;
      }

      // Standard single-file import.
      const fileResult = await window.restbro.files.readContent(filePath);

      if (!fileResult.success) {
        this.showError('Failed to read file');
        return;
      }

      const parseResult = await window.restbro.import.parsePreview(
        fileResult.content
      );

      if (!parseResult.success) {
        this.showError(parseResult.error || 'Failed to parse import file');
        return;
      }

      await this.dialog.show(parseResult.preview);
    } catch (error) {
      console.error('Import failed:', error);
      this.showError(error instanceof Error ? error.message : 'Import failed');
    }
  }

  /**
   * Returns the folder path to feed into `parseFolderPreview` if the picked
   * path is a Bruno collection (folder, `bruno.json`, or `.bru` file).
   * Returns null otherwise so the caller falls through to the file parser.
   */
  private async detectBrunoFolderTarget(
    pickedPath: string
  ): Promise<string | null> {
    const sep = pickedPath.includes('\\') ? '\\' : '/';
    const segments = pickedPath.split(sep);
    const basename = segments[segments.length - 1] || '';
    const lower = basename.toLowerCase();

    // `.bru` request file → use parent folder.
    if (lower.endsWith('.bru')) {
      return segments.slice(0, -1).join(sep) || sep;
    }
    // `bruno.json` collection marker → use parent folder.
    if (lower === 'bruno.json') {
      return segments.slice(0, -1).join(sep) || sep;
    }
    // No extension at all → treat as a directory (macOS folder selection).
    if (!basename.includes('.')) {
      return pickedPath;
    }
    return null;
  }

  /** Prompt for raw text (cURL command, .http snippet, WSDL XML, etc.). */
  private async showPasteImport(): Promise<void> {
    const text = await this.promptForText();
    if (!text) return;
    try {
      const parseResult = await window.restbro.import.parsePreview(text);
      if (!parseResult.success) {
        this.showError(parseResult.error || 'Failed to parse pasted content');
        return;
      }
      await this.dialog.show(parseResult.preview);
    } catch (error) {
      console.error('Paste import failed:', error);
      this.showError(error instanceof Error ? error.message : 'Import failed');
    }
  }

  /**
   * Polished modal asking the user whether to import a file (Postman /
   * Insomnia / OpenAPI / Bruno / …) or paste raw text (cURL / .http / WSDL).
   * Two large card-style buttons; click outside or press Escape to cancel.
   */
  private promptSourceChoice(): Promise<'file' | 'paste' | 'cancel'> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; backdrop-filter: blur(2px);
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        width: 520px; max-width: calc(100vw - 32px);
        color: var(--text-primary);
        box-shadow: 0 20px 60px rgba(0,0,0,0.45);
        overflow: hidden;
      `;

      // Header.
      const header = document.createElement('div');
      header.style.cssText =
        'padding: 20px 24px 4px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px;';
      const titleWrap = document.createElement('div');
      const title = document.createElement('h2');
      title.textContent = 'Import Collection';
      title.style.cssText =
        'margin: 0; font-size: 17px; font-weight: 600; color: var(--text-primary);';
      const subtitle = document.createElement('div');
      subtitle.textContent =
        'Postman, Insomnia, Hoppscotch, OpenAPI, HAR, Bruno, REST Client, WSDL, cURL…';
      subtitle.style.cssText =
        'margin-top: 4px; font-size: 12px; color: var(--text-secondary); line-height: 1.4;';
      titleWrap.appendChild(title);
      titleWrap.appendChild(subtitle);

      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        background: transparent; border: 0; color: var(--text-secondary);
        font-size: 22px; line-height: 1; cursor: pointer; padding: 4px 8px;
        border-radius: 4px;
      `;
      closeBtn.addEventListener(
        'mouseenter',
        () => (closeBtn.style.background = 'var(--bg-tertiary)')
      );
      closeBtn.addEventListener(
        'mouseleave',
        () => (closeBtn.style.background = 'transparent')
      );

      header.appendChild(titleWrap);
      header.appendChild(closeBtn);

      // Body — two card options.
      const body = document.createElement('div');
      body.style.cssText =
        'padding: 16px 24px 22px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';

      const makeCard = (
        heading: string,
        description: string,
        iconSvg: string,
        primary: boolean
      ): HTMLButtonElement => {
        const card = document.createElement('button');
        card.type = 'button';
        card.style.cssText = `
          display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
          text-align: left; padding: 16px; cursor: pointer;
          background: var(--bg-tertiary);
          border: 1px solid ${primary ? 'var(--primary-color)' : 'var(--border-color)'};
          border-radius: 8px; color: var(--text-primary);
          transition: border-color 0.15s, transform 0.05s, background 0.15s;
        `;
        card.addEventListener('mouseenter', () => {
          card.style.borderColor = 'var(--primary-color)';
          card.style.background = 'var(--bg-primary)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.borderColor = primary
            ? 'var(--primary-color)'
            : 'var(--border-color)';
          card.style.background = 'var(--bg-tertiary)';
        });
        card.addEventListener('mousedown', () => {
          card.style.transform = 'translateY(1px)';
        });
        card.addEventListener('mouseup', () => {
          card.style.transform = 'translateY(0)';
        });

        const iconWrap = document.createElement('div');
        iconWrap.style.cssText =
          'width: 28px; height: 28px; color: var(--primary-color);';
        iconWrap.innerHTML = iconSvg;

        const h = document.createElement('div');
        h.textContent = heading;
        h.style.cssText = 'font-size: 14px; font-weight: 600;';

        const d = document.createElement('div');
        d.textContent = description;
        d.style.cssText =
          'font-size: 12px; color: var(--text-secondary); line-height: 1.4;';

        card.appendChild(iconWrap);
        card.appendChild(h);
        card.appendChild(d);
        return card;
      };

      const fileIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
      const pasteIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;

      const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
      const fileCard = makeCard(
        'Choose file',
        isMac
          ? 'Pick an export file or a Bruno collection folder.'
          : 'Pick an export file (or a Bruno bruno.json / .bru).',
        fileIcon,
        true
      );
      const pasteCard = makeCard(
        'Paste cURL / text',
        'Paste a cURL command, .http snippet, or WSDL document.',
        pasteIcon,
        false
      );

      body.appendChild(fileCard);
      body.appendChild(pasteCard);

      const close = (choice: 'file' | 'paste' | 'cancel'): void => {
        document.removeEventListener('keydown', onKeyDown);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(choice);
      };
      const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') close('cancel');
      };
      document.addEventListener('keydown', onKeyDown);

      closeBtn.addEventListener('click', () => close('cancel'));
      fileCard.addEventListener('click', () => close('file'));
      pasteCard.addEventListener('click', () => close('paste'));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close('cancel');
      });

      modal.appendChild(header);
      modal.appendChild(body);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });
  }

  /**
   * Polished modal with a textarea for pasting raw cURL / .http / WSDL
   * content. Visual language matches the source-choice modal: header with
   * a close button, soft shadow, blurred backdrop, and proper button styles.
   * Submit with ⌘/Ctrl+Enter, dismiss with Escape.
   */
  private promptForText(): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; backdrop-filter: blur(2px);
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        width: 640px; max-width: calc(100vw - 32px);
        color: var(--text-primary);
        box-shadow: 0 20px 60px rgba(0,0,0,0.45);
        overflow: hidden;
        display: flex; flex-direction: column;
      `;

      // Header with title + close button.
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 18px 24px 4px 24px;
        display: flex; align-items: flex-start;
        justify-content: space-between; gap: 12px;
      `;
      const titleWrap = document.createElement('div');
      const title = document.createElement('h2');
      title.textContent = 'Paste content';
      title.style.cssText =
        'margin: 0; font-size: 17px; font-weight: 600; color: var(--text-primary);';
      const desc = document.createElement('div');
      desc.textContent =
        'Paste a cURL command, a .http / .rest snippet, or a WSDL document. The format is detected automatically.';
      desc.style.cssText =
        'margin-top: 4px; font-size: 12px; color: var(--text-secondary); line-height: 1.5;';
      titleWrap.appendChild(title);
      titleWrap.appendChild(desc);

      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        background: transparent; border: 0; color: var(--text-secondary);
        font-size: 22px; line-height: 1; cursor: pointer; padding: 4px 8px;
        border-radius: 4px;
      `;
      closeBtn.addEventListener(
        'mouseenter',
        () => (closeBtn.style.background = 'var(--bg-tertiary)')
      );
      closeBtn.addEventListener(
        'mouseleave',
        () => (closeBtn.style.background = 'transparent')
      );

      header.appendChild(titleWrap);
      header.appendChild(closeBtn);

      // Body: textarea.
      const body = document.createElement('div');
      body.style.cssText = 'padding: 14px 24px 4px 24px;';
      const textarea = document.createElement('textarea');
      textarea.setAttribute('spellcheck', 'false');
      textarea.setAttribute('autocapitalize', 'off');
      textarea.setAttribute('autocomplete', 'off');
      textarea.style.cssText = `
        width: 100%; min-height: 220px; box-sizing: border-box;
        background: var(--bg-primary); color: var(--text-primary);
        border: 1px solid var(--border-color); border-radius: 6px;
        padding: 12px; font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 13px; line-height: 1.5; resize: vertical;
        outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      `;
      textarea.placeholder = `curl 'https://api.example.com/users' -H 'Accept: application/json'`;
      textarea.addEventListener('focus', () => {
        textarea.style.borderColor = 'var(--primary-color)';
        textarea.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
      });
      textarea.addEventListener('blur', () => {
        textarea.style.borderColor = 'var(--border-color)';
        textarea.style.boxShadow = 'none';
      });
      body.appendChild(textarea);

      // Footer with hint + actions.
      const footer = document.createElement('div');
      footer.style.cssText = `
        padding: 12px 24px 18px 24px;
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      `;
      const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
      const hint = document.createElement('div');
      hint.textContent = `Press ${isMac ? '⌘' : 'Ctrl'}+Enter to preview · Esc to cancel`;
      hint.style.cssText =
        'font-size: 11px; color: var(--text-secondary); user-select: none;';

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display: flex; gap: 8px;';

      const styleBtn = (
        btn: HTMLButtonElement,
        primary: boolean
      ): HTMLButtonElement => {
        btn.style.cssText = `
          padding: 8px 18px; font-size: 13px; font-weight: 500;
          border-radius: 6px; cursor: pointer;
          border: 1px solid ${primary ? 'var(--primary-color)' : 'var(--border-color)'};
          background: ${primary ? 'var(--primary-color)' : 'var(--bg-tertiary)'};
          color: ${primary ? '#fff' : 'var(--text-primary)'};
          transition: filter 0.15s, background 0.15s;
        `;
        btn.addEventListener('mouseenter', () => {
          btn.style.filter = 'brightness(1.08)';
          if (!primary) btn.style.background = 'var(--bg-primary)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.filter = 'none';
          if (!primary) btn.style.background = 'var(--bg-tertiary)';
        });
        return btn;
      };

      const cancelBtn = styleBtn(document.createElement('button'), false);
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      const importBtn = styleBtn(document.createElement('button'), true);
      importBtn.type = 'button';
      importBtn.textContent = 'Preview';

      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(importBtn);
      footer.appendChild(hint);
      footer.appendChild(btnRow);

      const close = (value: string | null): void => {
        document.removeEventListener('keydown', onKeyDown);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(value);
      };

      const submit = (): void => {
        const v = textarea.value.trim();
        if (!v) {
          // Inline shake + red border instead of an out-of-context toast.
          textarea.style.borderColor = 'var(--error-color, #d33)';
          textarea.style.boxShadow = '0 0 0 3px rgba(211, 51, 51, 0.18)';
          textarea.focus();
          return;
        }
        close(v);
      };

      const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(null);
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          submit();
        }
      };
      document.addEventListener('keydown', onKeyDown);

      closeBtn.addEventListener('click', () => close(null));
      cancelBtn.addEventListener('click', () => close(null));
      importBtn.addEventListener('click', submit);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(null);
      });

      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(footer);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      setTimeout(() => textarea.focus(), 0);
    });
  }

  private async handleImport(preview: any): Promise<boolean> {
    try {
      const result = await window.restbro.import.commit(preview);

      if (!result.success) {
        this.showError(result.error || 'Failed to import');
        return false;
      }

      this.showSuccess(
        `Successfully imported: ${preview.summary.requests} requests, ${preview.summary.environments} environments`
      );

      // Notify completion
      if (this.onImportComplete) {
        this.onImportComplete();
      }

      return true;
    } catch (error) {
      console.error('Import commit failed:', error);
      this.showError(
        error instanceof Error ? error.message : 'Import commit failed'
      );
      return false;
    }
  }

  private showError(message: string): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--error-color);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 4000);
  }

  private showSuccess(message: string): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--success-color, #4caf50);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }
}
