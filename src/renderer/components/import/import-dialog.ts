import { Collection } from '../../../shared/types';
import { createIconElement } from '../../utils/icons';

export class ImportDialog {
  private onImport: (preview: any) => Promise<boolean>;

  constructor(onImport: (preview: any) => Promise<boolean>) {
    this.onImport = onImport;
  }

  /**
   * Walk a collection tree and collect every request id (folders aren't
   * selectable on their own — they appear in the import iff at least one
   * descendant request is checked).
   */
  private collectRequestIds(node: Collection | undefined, into: Set<string>) {
    if (!node) return;
    if (node.type === 'request') {
      into.add(node.id);
      return;
    }
    node.children?.forEach((c) => this.collectRequestIds(c, into));
  }

  /**
   * Return a deep-cloned tree containing only requests whose id is in
   * `selected`. Folders are kept only when at least one descendant survives,
   * so empty branches don't leak into the imported collection. The root
   * (depth 0) is preserved even if empty so the commit still has a
   * container; everything below is pruned aggressively.
   */
  private filterTreeBySelection(
    node: Collection,
    selected: Set<string>,
    depth: number = 0
  ): Collection | null {
    if (node.type === 'request') {
      return selected.has(node.id) ? { ...node } : null;
    }
    const children = (node.children ?? [])
      .map((c) => this.filterTreeBySelection(c, selected, depth + 1))
      .filter((c): c is Collection => c !== null);
    if (children.length === 0 && depth > 0) return null;
    return { ...node, children };
  }

  private countRequests(node: Collection | undefined): number {
    if (!node) return 0;
    if (node.type === 'request') return 1;
    return (node.children ?? []).reduce((n, c) => n + this.countRequests(c), 0);
  }

  /**
   * Count folders in a tree, excluding the root container itself so the
   * summary number matches what the user sees in the import preview list.
   */
  private countFolders(node: Collection | undefined): number {
    if (!node) return 0;
    let n = 0;
    const walk = (item: Collection, isRoot: boolean): void => {
      if (item.type === 'folder' && !isRoot) n += 1;
      item.children?.forEach((c) => walk(c, false));
    };
    walk(node, true);
    return n;
  }

  /**
   * Deep-clone a tree, dropping any folder whose subtree contains zero
   * requests. The root folder itself (depth 0) is always preserved so the
   * commit pipeline still has a container; the imported collection just
   * won't include any noise from upstream exports that ship empty
   * folders / categories.
   */
  private pruneEmptyFolders(
    node: Collection,
    depth: number = 0
  ): Collection | null {
    if (node.type === 'request') return { ...node };
    const children = (node.children ?? [])
      .map((c) => this.pruneEmptyFolders(c, depth + 1))
      .filter((c): c is Collection => c !== null);
    if (children.length === 0 && depth > 0) return null;
    return { ...node, children };
  }

  async show(preview: any): Promise<void> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        width: 650px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
      `;

      // Header
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
      `;

      const title = document.createElement('h2');
      title.textContent = 'Import Preview';
      title.style.cssText = `
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
      `;

      const subtitle = document.createElement('div');
      subtitle.textContent = preview.name;
      subtitle.style.cssText = `
        color: var(--text-secondary);
        font-size: 14px;
      `;

      header.appendChild(title);
      header.appendChild(subtitle);

      // Body
      const body = document.createElement('div');
      body.style.cssText = `
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
      `;

      // Summary section
      const summarySection = document.createElement('div');
      summarySection.style.cssText = `
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 20px;
      `;

      const summaryTitle = document.createElement('h3');
      summaryTitle.textContent = 'Summary';
      summaryTitle.style.cssText = `
        margin: 0 0 12px 0;
        color: var(--text-primary);
        font-size: 15px;
        font-weight: 600;
      `;

      const summaryStats = document.createElement('div');
      summaryStats.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      `;

      const createStat = (
        label: string,
        value: number,
        icon: Parameters<typeof createIconElement>[0]
      ) => {
        const stat = document.createElement('div');
        stat.style.cssText = `
          text-align: center;
          padding: 12px;
          background: var(--bg-primary);
          border-radius: 4px;
        `;

        const iconEl = document.createElement('div');
        iconEl.style.cssText = `
          width: 24px;
          height: 24px;
          margin: 0 auto 4px auto;
          color: var(--text-secondary);
        `;
        iconEl.appendChild(
          createIconElement(icon, { style: { width: '100%', height: '100%' } })
        );

        const valueEl = document.createElement('div');
        valueEl.textContent = String(value);
        valueEl.style.cssText = `
          color: var(--text-primary);
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 2px;
        `;

        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.style.cssText = `
          color: var(--text-secondary);
          font-size: 12px;
        `;

        stat.appendChild(iconEl);
        stat.appendChild(valueEl);
        stat.appendChild(labelEl);
        return stat;
      };

      summaryStats.appendChild(
        createStat('Folders', preview.summary.folders, 'folder')
      );
      summaryStats.appendChild(
        createStat('Requests', preview.summary.requests, 'file')
      );
      summaryStats.appendChild(
        createStat('Environments', preview.summary.environments, 'globe')
      );

      summarySection.appendChild(summaryTitle);
      summarySection.appendChild(summaryStats);
      body.appendChild(summarySection);

      // Collection tree section
      if (preview.rootFolder) {
        const treeSection = document.createElement('div');
        treeSection.style.cssText = `
          margin-bottom: 20px;
        `;

        // Pre-collect every request id; everything is selected by default so
        // single-request imports keep working with no extra clicks.
        const allIds = new Set<string>();
        this.collectRequestIds(preview.rootFolder, allIds);
        const selected = new Set<string>(allIds);
        const totalRequests = allIds.size;

        const treeHeader = document.createElement('div');
        treeHeader.style.cssText = `
          display: flex; align-items: center; justify-content: space-between;
          margin: 0 0 12px 0;
        `;
        const treeTitle = document.createElement('h3');
        treeTitle.textContent = 'Collection Structure';
        treeTitle.style.cssText = `
          margin: 0;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
        `;

        // "Select all" toggle + live count, only shown when there's more
        // than one request to choose from.
        const selectionInfo = document.createElement('div');
        selectionInfo.style.cssText =
          'display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-secondary);';

        const countLabel = document.createElement('span');
        const updateCount = () => {
          countLabel.textContent = `${selected.size} of ${totalRequests} selected`;
        };

        const selectAllWrap = document.createElement('label');
        selectAllWrap.style.cssText =
          'display: inline-flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;';
        const selectAllCb = document.createElement('input');
        selectAllCb.type = 'checkbox';
        selectAllCb.checked = true;
        selectAllCb.style.cssText = 'cursor: pointer;';
        const selectAllText = document.createElement('span');
        selectAllText.textContent = 'Select all';
        selectAllWrap.appendChild(selectAllCb);
        selectAllWrap.appendChild(selectAllText);

        if (totalRequests > 1) {
          selectionInfo.appendChild(countLabel);
          selectionInfo.appendChild(selectAllWrap);
        }

        treeHeader.appendChild(treeTitle);
        treeHeader.appendChild(selectionInfo);

        const treeContainer = document.createElement('div');
        treeContainer.style.cssText = `
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 12px;
          background: var(--bg-tertiary);
          max-height: 240px;
          overflow-y: auto;
        `;

        // Track per-node checkbox + reverse parent pointers so toggling a
        // folder cascades to descendants and updates ancestor tri-state.
        const requestCheckboxes = new Map<string, HTMLInputElement>();
        const folderCheckboxes: {
          folderId: string;
          el: HTMLInputElement;
          descendants: string[];
        }[] = [];

        const collectDescendantIds = (item: Collection): string[] => {
          if (item.type === 'request') return [item.id];
          return (item.children ?? []).flatMap(collectDescendantIds);
        };

        const refreshFolderStates = (): void => {
          folderCheckboxes.forEach(({ el, descendants }) => {
            const present = descendants.filter((id) => selected.has(id)).length;
            if (present === 0) {
              el.checked = false;
              el.indeterminate = false;
            } else if (present === descendants.length) {
              el.checked = true;
              el.indeterminate = false;
            } else {
              el.checked = false;
              el.indeterminate = true;
            }
          });
          if (selectAllCb) {
            if (selected.size === 0) {
              selectAllCb.checked = false;
              selectAllCb.indeterminate = false;
            } else if (selected.size === totalRequests) {
              selectAllCb.checked = true;
              selectAllCb.indeterminate = false;
            } else {
              selectAllCb.checked = false;
              selectAllCb.indeterminate = true;
            }
          }
          updateCount();
        };

        const renderTree = (item: Collection, level: number = 0) => {
          const itemEl = document.createElement('div');
          itemEl.style.cssText = `
            padding: 4px 8px;
            padding-left: ${level * 20 + 8}px;
            color: var(--text-primary);
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
          `;

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = true;
          checkbox.style.cssText = 'cursor: pointer; margin: 0 2px 0 0;';
          itemEl.appendChild(checkbox);

          const icon = createIconElement(
            item.type === 'folder' ? 'folder' : 'file',
            {
              style: { width: '14px', height: '14px' },
            }
          );

          const name = document.createElement('span');
          name.textContent = item.name;

          if (item.type === 'request') {
            requestCheckboxes.set(item.id, checkbox);
            checkbox.addEventListener('change', () => {
              if (checkbox.checked) selected.add(item.id);
              else selected.delete(item.id);
              refreshFolderStates();
            });

            const method = document.createElement('span');
            method.textContent = item.request?.method || 'GET';
            method.style.cssText = `
              font-size: 11px;
              padding: 2px 6px;
              border-radius: 3px;
              background: var(--primary-color);
              color: white;
              margin-left: 6px;
            `;
            name.appendChild(method);
          } else {
            const descendantIds = collectDescendantIds(item);
            folderCheckboxes.push({
              folderId: item.id,
              el: checkbox,
              descendants: descendantIds,
            });
            checkbox.addEventListener('change', () => {
              const turnOn = checkbox.checked;
              descendantIds.forEach((id) => {
                if (turnOn) selected.add(id);
                else selected.delete(id);
                const cb = requestCheckboxes.get(id);
                if (cb) cb.checked = turnOn;
              });
              refreshFolderStates();
            });
          }

          itemEl.appendChild(icon);
          itemEl.appendChild(name);
          treeContainer.appendChild(itemEl);

          if (item.type === 'folder' && item.children) {
            item.children.forEach((child) => renderTree(child, level + 1));
          }
        };

        renderTree(preview.rootFolder);

        selectAllCb.addEventListener('change', () => {
          const turnOn = selectAllCb.checked;
          allIds.forEach((id) => {
            if (turnOn) selected.add(id);
            else selected.delete(id);
            const cb = requestCheckboxes.get(id);
            if (cb) cb.checked = turnOn;
          });
          refreshFolderStates();
        });

        updateCount();
        refreshFolderStates();

        treeSection.appendChild(treeHeader);
        treeSection.appendChild(treeContainer);
        body.appendChild(treeSection);

        // Expose the selection set so the Import button can apply it below.
        (preview as any).__selectedRequestIds = selected;
        (preview as any).__totalRequestIds = allIds;
      }

      // Environments section
      if (preview.environments && preview.environments.length > 0) {
        const envsSection = document.createElement('div');
        envsSection.style.cssText = `
          margin-bottom: 20px;
        `;

        const envsTitle = document.createElement('h3');
        envsTitle.textContent = 'Environments';
        envsTitle.style.cssText = `
          margin: 0 0 12px 0;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
        `;

        const envsContainer = document.createElement('div');
        envsContainer.style.cssText = `
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 12px;
          background: var(--bg-tertiary);
        `;

        preview.environments.forEach((env: any) => {
          const envItem = document.createElement('div');
          envItem.style.cssText = `
            padding: 8px;
            margin-bottom: 8px;
            background: var(--bg-primary);
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
          `;

          const envIcon = document.createElement('span');
          envIcon.appendChild(
            createIconElement('globe', {
              style: { width: '16px', height: '16px' },
            })
          );

          const envName = document.createElement('span');
          envName.textContent = env.name;
          envName.style.cssText = `
            flex: 1;
            color: var(--text-primary);
            font-size: 13px;
          `;

          const varCount = document.createElement('span');
          varCount.textContent = `${Object.keys(env.variables || {}).length} variables`;
          varCount.style.cssText = `
            color: var(--text-secondary);
            font-size: 12px;
          `;

          envItem.appendChild(envIcon);
          envItem.appendChild(envName);
          envItem.appendChild(varCount);
          envsContainer.appendChild(envItem);
        });

        envsSection.appendChild(envsTitle);
        envsSection.appendChild(envsContainer);
        body.appendChild(envsSection);
      }

      // Footer
      const footer = document.createElement('div');
      footer.style.cssText = `
        padding: 16px 24px;
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      `;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        padding: 8px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 14px;
      `;

      const importBtn = document.createElement('button');
      importBtn.textContent = 'Import';
      importBtn.style.cssText = `
        padding: 8px 24px;
        background: var(--primary-color);
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      `;

      const cleanup = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      };

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve();
      });

      importBtn.addEventListener('click', async () => {
        // Apply per-request selection (if the tree was rendered).
        const selectedIds = (preview as any).__selectedRequestIds as
          | Set<string>
          | undefined;
        const totalIds = (preview as any).__totalRequestIds as
          | Set<string>
          | undefined;

        let payload = preview;
        if (selectedIds && totalIds && totalIds.size > 0) {
          if (selectedIds.size === 0) {
            // Nothing to import — surface a quick inline warning instead of
            // committing an empty collection.
            importBtn.style.outline = '2px solid var(--error-color, #d33)';
            importBtn.textContent = 'Select at least one request';
            window.setTimeout(() => {
              importBtn.style.outline = '';
              importBtn.textContent = 'Import';
            }, 1800);
            return;
          }
          if (selectedIds.size < totalIds.size && preview.rootFolder) {
            const filteredRoot = this.filterTreeBySelection(
              preview.rootFolder,
              selectedIds
            );
            payload = {
              ...preview,
              rootFolder: filteredRoot ?? preview.rootFolder,
              summary: {
                ...preview.summary,
                requests: this.countRequests(
                  filteredRoot ?? preview.rootFolder
                ),
              },
            };
          }
        }

        // Always strip folders that contain zero requests (some exports
        // — Postman categories, OpenAPI tag groups, Bruno empty subdirs —
        // leave behind empty containers we shouldn't pollute the user's
        // collection with).
        if (payload.rootFolder) {
          const pruned = this.pruneEmptyFolders(payload.rootFolder);
          if (pruned) {
            payload = {
              ...payload,
              rootFolder: pruned,
              summary: {
                ...payload.summary,
                folders: this.countFolders(pruned),
                requests: this.countRequests(pruned),
              },
            };
          }
        }

        importBtn.disabled = true;
        importBtn.textContent = 'Importing...';

        const success = await this.onImport(payload);

        if (success) {
          cleanup();
          resolve();
        } else {
          importBtn.disabled = false;
          importBtn.textContent = 'Import';
        }
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve();
        }
      });

      footer.appendChild(cancelBtn);
      footer.appendChild(importBtn);

      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  }
}
