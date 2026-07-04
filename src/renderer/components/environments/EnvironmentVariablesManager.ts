/**
 * Manager for variable tables (environments + globals).
 *
 * Renders a full-height table with a sticky column header, scrollable rows,
 * and a pinned "Add Variable" button. The VALUE column is the widest so long
 * URLs and tokens stay readable.
 */

import { Environment } from '../../../shared/types';
import { iconHtml } from '../../utils/icons';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';

const DRAFT_PREFIX = '__restbro_draft__';

interface VariableTableOptions {
  title: string;
  variables: Record<string, string>;
  descriptions: Record<string, string>;
  /** Per-variable secret flag (true = masked). Mutated in place. */
  secrets: Record<string, boolean>;
  emptyText?: string;
}

export class EnvironmentVariablesManager {
  /**
   * Renders the variables section for an environment.
   */
  static renderVariablesSection(selectedEnv: Environment): HTMLDivElement {
    selectedEnv.variableDescriptions ??= {};
    selectedEnv.variableSecrets ??= {};
    return this.renderVariableTable({
      title: 'Variables',
      variables: selectedEnv.variables,
      descriptions: selectedEnv.variableDescriptions,
      secrets: selectedEnv.variableSecrets,
    });
  }

  /**
   * Generic variable table shared by environments and globals.
   * Mutates the provided `variables` / `descriptions` records in place.
   */
  static renderVariableTable(options: VariableTableOptions): HTMLDivElement {
    const { title, variables, descriptions, secrets } = options;
    const emptyText =
      options.emptyText ??
      'No variables yet. Click "Add Variable" to create one.';

    const section = document.createElement('div');
    section.style.cssText = EnvironmentDialogStyles.varsSection;

    // Section header: title + live count
    const header = document.createElement('div');
    header.style.cssText = EnvironmentDialogStyles.varsHeader;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = EnvironmentDialogStyles.varsTitle;

    const countEl = document.createElement('div');
    countEl.style.cssText = EnvironmentDialogStyles.varsCount;

    header.appendChild(titleEl);
    header.appendChild(countEl);

    // Scroll container with a sticky header row and a rebuildable rows body
    const container = document.createElement('div');
    container.style.cssText = EnvironmentDialogStyles.varsContainer;

    container.appendChild(this.createHeaderRow());

    const rowsBody = document.createElement('div');
    rowsBody.style.cssText = EnvironmentDialogStyles.varsBody;
    container.appendChild(rowsBody);

    const render = () => {
      rowsBody.innerHTML = '';
      const keys = Object.keys(variables);
      countEl.textContent = `${keys.length}`;

      if (keys.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = emptyText;
        empty.style.cssText = EnvironmentDialogStyles.varsEmpty;
        rowsBody.appendChild(empty);
        return;
      }

      keys.forEach((key) => {
        const row = this.createVariableRow(
          key,
          variables[key],
          variables,
          descriptions,
          secrets,
          render
        );
        rowsBody.appendChild(row);
      });
    };

    render();

    // Pinned "Add Variable" button below the scroll area
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Add Variable';
    addBtn.style.cssText = EnvironmentDialogStyles.addVarButton;
    addBtn.addEventListener('mouseenter', () => {
      addBtn.style.background = 'rgba(var(--primary-color-rgb), 0.18)';
    });
    addBtn.addEventListener('mouseleave', () => {
      addBtn.style.background = 'rgba(var(--primary-color-rgb), 0.1)';
    });
    addBtn.addEventListener('click', () => {
      const newKey = this.createDraftKey(variables);
      variables[newKey] = '';
      descriptions[newKey] = '';
      render();
      container.scrollTop = container.scrollHeight;
      const lastRow = rowsBody.lastElementChild as HTMLElement | null;
      (lastRow?.querySelector('input') as HTMLInputElement | null)?.focus();
    });

    section.appendChild(header);
    section.appendChild(container);
    section.appendChild(addBtn);

    return section;
  }

  private static createHeaderRow(): HTMLDivElement {
    const headerRow = document.createElement('div');
    headerRow.style.cssText = EnvironmentDialogStyles.varHeaderRow;
    ['Key', 'Value', 'Description', 'Type', ''].forEach((labelText) => {
      const cell = document.createElement('div');
      cell.textContent = labelText;
      cell.style.cssText = EnvironmentDialogStyles.varHeaderCell;
      headerRow.appendChild(cell);
    });
    return headerRow;
  }

  /**
   * Creates a single variable row (key, value, description, type, delete).
   * The "Type" dropdown controls whether the value is treated as a secret.
   */
  private static createVariableRow(
    key: string,
    value: string,
    variables: Record<string, string>,
    descriptions: Record<string, string>,
    secrets: Record<string, boolean>,
    render: () => void
  ): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = EnvironmentDialogStyles.varRow;
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(255, 255, 255, 0.02)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'transparent';
    });

    const currentKey = key;
    const isDraft = currentKey.startsWith(DRAFT_PREFIX);

    const keyInput = this.createInput(
      isDraft ? '' : currentKey,
      'Key',
      EnvironmentDialogStyles.varInput
    );
    const isSecret = secrets[currentKey] === true;
    const valueInput = this.createInput(
      value,
      'Value',
      isSecret
        ? EnvironmentDialogStyles.varInputSecret
        : EnvironmentDialogStyles.varInput
    );
    const valueCell = isSecret ? this.wrapSecretValue(valueInput) : valueInput;
    const descriptionInput = this.createInput(
      descriptions[currentKey] || '',
      'Description',
      EnvironmentDialogStyles.varInputDescription
    );

    const typeSelect = this.createTypeSelect(isSecret, (nextSecret) => {
      if (nextSecret) {
        secrets[currentKey] = true;
      } else {
        delete secrets[currentKey];
      }
      render();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = iconHtml('close');
    deleteBtn.style.cssText = EnvironmentDialogStyles.deleteVarButton;
    deleteBtn.title = 'Delete variable';
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = 'rgba(var(--error-color-rgb), 0.18)';
    });
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = 'rgba(var(--error-color-rgb), 0.08)';
    });
    deleteBtn.addEventListener('click', () => {
      delete variables[currentKey];
      delete descriptions[currentKey];
      delete secrets[currentKey];
      render();
    });

    // Rename key on blur
    keyInput.addEventListener('blur', () => {
      const nextKey = keyInput.value.trim();
      if (!nextKey) {
        delete variables[currentKey];
        delete descriptions[currentKey];
        delete secrets[currentKey];
        render();
        return;
      }
      if (nextKey !== currentKey) {
        const nextValue = valueInput.value;
        const nextDescription = descriptions[currentKey] || '';
        const wasSecret = secrets[currentKey] === true;
        delete variables[currentKey];
        delete descriptions[currentKey];
        delete secrets[currentKey];
        variables[nextKey] = nextValue;
        if (nextDescription) {
          descriptions[nextKey] = nextDescription;
        }
        if (wasSecret) {
          secrets[nextKey] = true;
        }
        render();
      }
    });

    valueInput.addEventListener('input', () => {
      variables[currentKey] = valueInput.value;
    });
    descriptionInput.addEventListener('input', () => {
      descriptions[currentKey] = descriptionInput.value;
    });

    row.appendChild(keyInput);
    row.appendChild(valueCell);
    row.appendChild(descriptionInput);
    row.appendChild(typeSelect);
    row.appendChild(deleteBtn);

    return row;
  }

  /**
   * Builds the per-row "Type" dropdown (Default / Secret). Choosing "Secret"
   * masks the value input; choosing "Default" reveals it.
   */
  private static createTypeSelect(
    isSecret: boolean,
    onChange: (nextSecret: boolean) => void
  ): HTMLSelectElement {
    const select = document.createElement('select');
    select.title = 'Variable type';
    select.style.cssText = EnvironmentDialogStyles.typeSelect;

    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.textContent = 'Default';

    const secretOption = document.createElement('option');
    secretOption.value = 'secret';
    secretOption.textContent = 'Secret';

    select.appendChild(defaultOption);
    select.appendChild(secretOption);
    select.value = isSecret ? 'secret' : 'default';

    select.addEventListener('change', () => {
      onChange(select.value === 'secret');
    });
    select.addEventListener('focus', () => {
      select.style.borderColor = 'var(--primary-color)';
    });
    select.addEventListener('blur', () => {
      select.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    });

    return select;
  }

  /**
   * Creates a text input with the shared focus/blur highlight behaviour.
   */
  private static createInput(
    value: string,
    placeholder: string,
    cssText: string
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = placeholder;
    input.spellcheck = false;
    input.style.cssText = cssText;
    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--primary-color)';
      input.style.boxShadow = '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      input.style.boxShadow = 'none';
    });
    return input;
  }

  /**
   * Masks a secret value input and adds a reveal (eye) toggle. The reveal state
   * is per-row and resets whenever the table re-renders (it is never persisted).
   */
  private static wrapSecretValue(valueInput: HTMLInputElement): HTMLDivElement {
    valueInput.type = 'password';
    valueInput.autocomplete = 'off';

    const wrap = document.createElement('div');
    wrap.style.cssText = EnvironmentDialogStyles.valueWrap;
    wrap.appendChild(valueInput);

    const eyeBtn = document.createElement('button');
    eyeBtn.type = 'button';
    eyeBtn.innerHTML = iconHtml('eye');
    eyeBtn.title = 'Show value';
    eyeBtn.style.cssText = EnvironmentDialogStyles.eyeButton;
    eyeBtn.addEventListener('mouseenter', () => {
      eyeBtn.style.color = 'var(--text-primary)';
      eyeBtn.style.background = 'rgba(255, 255, 255, 0.06)';
    });
    eyeBtn.addEventListener('mouseleave', () => {
      eyeBtn.style.color = 'var(--text-secondary)';
      eyeBtn.style.background = 'transparent';
    });
    eyeBtn.addEventListener('click', () => {
      const revealed = valueInput.type === 'text';
      valueInput.type = revealed ? 'password' : 'text';
      eyeBtn.innerHTML = iconHtml(revealed ? 'eye' : 'eye-off');
      eyeBtn.title = revealed ? 'Show value' : 'Hide value';
    });
    wrap.appendChild(eyeBtn);

    return wrap;
  }

  private static createDraftKey(existing: Record<string, string>): string {
    let draftKey = `${DRAFT_PREFIX}${crypto.randomUUID()}`;
    while (draftKey in existing) {
      draftKey = `${DRAFT_PREFIX}${crypto.randomUUID()}`;
    }
    return draftKey;
  }
}
