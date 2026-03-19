import { Collection, Environment, Globals } from '../../../shared/types';
import { createIconElement } from '../../utils/icons';

export interface ExportSelection {
  collectionIds: string[];
  environmentIds: string[];
  includeGlobals: boolean;
}

/**
 * Returns the minimal set of checked collection IDs that have no checked ancestor.
 * Each represents a root of a subtree to export (folder + all descendants, or single request).
 */
export function getExportRootIds(
  collections: Collection[],
  checkedIds: Set<string>
): string[] {
  const roots: string[] = [];
  const hasCheckedAncestor = (id: string): boolean => {
    const c = collections.find((x) => x.id === id);
    if (!c?.parentId) return false;
    if (checkedIds.has(c.parentId)) return true;
    return hasCheckedAncestor(c.parentId);
  };
  checkedIds.forEach((id) => {
    if (!hasCheckedAncestor(id)) roots.push(id);
  });
  return roots;
}

export interface ExportDialogOptions {
  collections: Collection[];
  environments: Environment[];
  globals: Globals | undefined;
}

/**
 * Shows a modal for the user to choose which collections, environments, and globals to export.
 * Collections: tree with checkboxes (checking a folder includes it and all descendants).
 * Environments: list with checkboxes (all checked by default).
 * Globals: single checkbox (checked by default).
 */
export function showExportDialog(options: ExportDialogOptions): Promise<ExportSelection | null> {
  const { collections, environments, globals } = options;
  const rootItems = collections
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const checkedCollectionIds = new Set<string>(collections.map((c) => c.id));
  const checkedEnvironmentIds = new Set<string>(environments.map((e) => e.id));
  const expandedFolderIds = new Set<string>(); // collapsed by default
  let includeGlobals = true;

  const hasAnyGlobals = globals?.variables && Object.keys(globals.variables).length > 0;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'export-dialog';
    dialog.style.cssText = `
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 520px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .export-dialog input[type="checkbox"] { accent-color: var(--primary-color); }
    `;
    dialog.appendChild(styleEl);

    const header = document.createElement('div');
    header.style.cssText = `padding: 16px 20px; border-bottom: 1px solid var(--border-color);`;
    const title = document.createElement('h2');
    title.textContent = 'Export';
    title.style.cssText = `margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 600;`;
    const subtitle = document.createElement('div');
    subtitle.textContent = 'Choose collections, environments, and globals to include in the export file.';
    subtitle.style.cssText = `margin-top: 6px; color: var(--text-secondary); font-size: 13px;`;
    header.appendChild(title);
    header.appendChild(subtitle);

    const body = document.createElement('div');
    body.style.cssText = `padding: 16px 20px; overflow-y: auto; flex: 1;`;

    // --- Collections section ---
    const collSection = document.createElement('div');
    collSection.style.cssText = `margin-bottom: 16px;`;
    const collLabel = document.createElement('div');
    collLabel.textContent = 'Collections';
    collLabel.style.cssText = `
      font-weight: 600; color: var(--text-primary); font-size: 13px; margin-bottom: 8px;
      display: flex; align-items: center; gap: 8px;
    `;
    const selectAllColl = document.createElement('button');
    selectAllColl.textContent = 'Select all';
    selectAllColl.type = 'button';
    selectAllColl.style.cssText = `
      font-size: 12px; color: var(--primary-color); background: none; border: none; cursor: pointer; padding: 0;
    `;
    const deselectAllColl = document.createElement('button');
    deselectAllColl.textContent = 'Deselect all';
    deselectAllColl.type = 'button';
    deselectAllColl.style.cssText = `
      font-size: 12px; color: var(--primary-color); background: none; border: none; cursor: pointer; padding: 0;
    `;
    collLabel.appendChild(selectAllColl);
    collLabel.appendChild(document.createTextNode(' · '));
    collLabel.appendChild(deselectAllColl);

    const collTree = document.createElement('div');
    collTree.style.cssText = `
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 8px;
      background: var(--bg-tertiary);
      max-height: 220px;
      overflow-y: auto;
    `;

    function setCollectionChecked(id: string, checked: boolean): void {
      if (checked) {
        checkedCollectionIds.add(id);
        const c = collections.find((x) => x.id === id);
        if (c?.type === 'folder') {
          collections.filter((x) => x.parentId === id).forEach((child) => setCollectionChecked(child.id, true));
        }
      } else {
        checkedCollectionIds.delete(id);
        const c = collections.find((x) => x.id === id);
        if (c?.type === 'folder') {
          collections.filter((x) => x.parentId === id).forEach((child) => setCollectionChecked(child.id, false));
        }
      }
    }

    function syncCheckboxesFromSet(): void {
      collTree.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-id]').forEach((input) => {
        const id = input.dataset.id;
        if (id) input.checked = checkedCollectionIds.has(id);
      });
    }

    function renderCollectionTree(): void {
      collTree.innerHTML = '';
      rootItems.forEach((c) => renderCollectionItem(c, 0));
    }

    function renderCollectionItem(c: Collection, level: number): void {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; align-items: center; gap: 4px; padding: 2px 6px; min-height: 24px;
        padding-left: ${level * 16 + 6}px;
      `;

      if (c.type === 'folder') {
        const expanded = expandedFolderIds.has(c.id);
        const children = collections.filter((x) => x.parentId === c.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const hasChildren = children.length > 0;

        const caretBtn = document.createElement('button');
        caretBtn.type = 'button';
        caretBtn.setAttribute('aria-label', expanded ? 'Collapse folder' : 'Expand folder');
        caretBtn.style.cssText = `
          width: 20px; height: 20px; padding: 0; border: none; background: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); flex-shrink: 0; font-size: 10px; line-height: 1;
        `;
        caretBtn.textContent = expanded ? '\u25BC' : '\u25B6'; // ▼ expanded, ▶ collapsed
        if (hasChildren) {
          caretBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (expandedFolderIds.has(c.id)) expandedFolderIds.delete(c.id);
            else expandedFolderIds.add(c.id);
            renderCollectionTree();
          });
        } else {
          caretBtn.style.visibility = 'hidden';
          caretBtn.setAttribute('aria-hidden', 'true');
        }

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = checkedCollectionIds.has(c.id);
        cb.dataset.id = c.id;
        cb.addEventListener('change', () => {
          setCollectionChecked(c.id, cb.checked);
          syncCheckboxesFromSet();
        });
        const icon = createIconElement('folder', { style: { width: '14px', height: '14px' } });
        const name = document.createElement('span');
        name.textContent = c.name;
        name.style.cssText = 'color: var(--text-primary); font-size: 13px; cursor: pointer; flex: 1;';
        name.addEventListener('click', () => {
          if (hasChildren) {
            if (expandedFolderIds.has(c.id)) expandedFolderIds.delete(c.id);
            else expandedFolderIds.add(c.id);
            renderCollectionTree();
          }
        });

        row.appendChild(caretBtn);
        row.appendChild(cb);
        row.appendChild(icon);
        row.appendChild(name);
        collTree.appendChild(row);

        if (expanded && hasChildren) {
          children.forEach((child) => renderCollectionItem(child, level + 1));
        }
      } else {
        const spacer = document.createElement('span');
        spacer.style.cssText = 'width: 20px; flex-shrink: 0;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = checkedCollectionIds.has(c.id);
        cb.dataset.id = c.id;
        cb.addEventListener('change', () => {
          setCollectionChecked(c.id, cb.checked);
          syncCheckboxesFromSet();
        });
        const icon = createIconElement('file', { style: { width: '14px', height: '14px' } });
        const name = document.createElement('span');
        name.textContent = c.request ? `${c.request.method ?? 'GET'} ${c.name}` : c.name;
        name.style.cssText = 'color: var(--text-primary); font-size: 13px;';
        row.appendChild(spacer);
        row.appendChild(cb);
        row.appendChild(icon);
        row.appendChild(name);
        collTree.appendChild(row);
      }
    }

    renderCollectionTree();

    selectAllColl.addEventListener('click', () => {
      collections.forEach((c) => checkedCollectionIds.add(c.id));
      syncCheckboxesFromSet();
    });
    deselectAllColl.addEventListener('click', () => {
      checkedCollectionIds.clear();
      syncCheckboxesFromSet();
    });

    collSection.appendChild(collLabel);
    collSection.appendChild(collTree);
    body.appendChild(collSection);

    // --- Environments section ---
    const envSection = document.createElement('div');
    envSection.style.cssText = `margin-bottom: 16px;`;
    const envLabel = document.createElement('div');
    envLabel.textContent = 'Environments';
    envLabel.style.cssText = `font-weight: 600; color: var(--text-primary); font-size: 13px; margin-bottom: 8px;`;
    const envList = document.createElement('div');
    envList.style.cssText = `
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 8px;
      background: var(--bg-tertiary);
      max-height: 120px;
      overflow-y: auto;
    `;
    environments.forEach((env) => {
      const label = document.createElement('label');
      label.style.cssText = `display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer;`;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.dataset.envId = env.id;
      cb.addEventListener('change', () => {
        if (cb.checked) checkedEnvironmentIds.add(env.id);
        else checkedEnvironmentIds.delete(env.id);
      });
      const icon = createIconElement('globe', { style: { width: '14px', height: '14px' } });
      const name = document.createElement('span');
      name.textContent = env.name;
      name.style.cssText = 'color: var(--text-primary); font-size: 13px;';
      label.appendChild(cb);
      label.appendChild(icon);
      label.appendChild(name);
      envList.appendChild(label);
    });
    envSection.appendChild(envLabel);
    envSection.appendChild(envList);
    body.appendChild(envSection);

    // --- Globals ---
    if (hasAnyGlobals) {
      const globSection = document.createElement('div');
      globSection.style.cssText = `margin-bottom: 8px;`;
      const globLabel = document.createElement('label');
      globLabel.style.cssText = `display: flex; align-items: center; gap: 8px; cursor: pointer;`;
      const globCb = document.createElement('input');
      globCb.type = 'checkbox';
      globCb.checked = true;
      globCb.addEventListener('change', () => { includeGlobals = globCb.checked; });
      const globText = document.createElement('span');
      globText.textContent = `Include globals (${Object.keys(globals?.variables ?? {}).length} variables)`;
      globText.style.cssText = 'color: var(--text-primary); font-size: 13px;';
      globLabel.appendChild(globCb);
      globLabel.appendChild(globText);
      globSection.appendChild(globLabel);
      body.appendChild(globSection);
    }

    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 12px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    `;
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = `
      padding: 8px 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 14px;
    `;
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export';
    exportBtn.type = 'button';
    exportBtn.style.cssText = `
      padding: 8px 20px;
      background: var(--primary-color);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;

    function cleanup(): void {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
    }

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    exportBtn.addEventListener('click', () => {
      const rootIds = getExportRootIds(collections, checkedCollectionIds);
      cleanup();
      resolve({
        collectionIds: rootIds,
        environmentIds: Array.from(checkedEnvironmentIds),
        includeGlobals,
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(exportBtn);
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
}
