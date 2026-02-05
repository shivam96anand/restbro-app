/**
 * Manager for environment variables rendering and editing
 */

import { Environment } from '../../../shared/types';
import { iconHtml } from '../../utils/icons';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';

const DRAFT_PREFIX = '__apicourier_draft__';

export class EnvironmentVariablesManager {
  /**
   * Renders the variables section for an environment
   */
  static renderVariablesSection(selectedEnv: Environment): HTMLDivElement {
    const varsHeader = document.createElement('div');
    varsHeader.style.cssText = EnvironmentDialogStyles.varsHeader;

    const varsTitle = document.createElement('div');
    varsTitle.textContent = 'Variables';
    varsTitle.style.cssText = EnvironmentDialogStyles.varsTitle;

    const varsCount = document.createElement('div');
    varsCount.style.cssText = EnvironmentDialogStyles.varsCount;

    varsHeader.appendChild(varsTitle);
    varsHeader.appendChild(varsCount);

    const varsContainer = document.createElement('div');
    varsContainer.style.cssText = EnvironmentDialogStyles.varsContainer;

    if (!selectedEnv.variableDescriptions) {
      selectedEnv.variableDescriptions = {};
    }
    const descriptions = selectedEnv.variableDescriptions;

    const renderVars = () => {
      varsContainer.innerHTML = '';
      varsCount.textContent = `${Object.keys(selectedEnv.variables).length}`;

      const headerRow = document.createElement('div');
      headerRow.style.cssText = EnvironmentDialogStyles.varHeaderRow;

      const keyHeader = document.createElement('div');
      keyHeader.textContent = 'Key';
      keyHeader.style.cssText = EnvironmentDialogStyles.varHeaderCell;

      const valueHeader = document.createElement('div');
      valueHeader.textContent = 'Value';
      valueHeader.style.cssText = EnvironmentDialogStyles.varHeaderCell;

      const descHeader = document.createElement('div');
      descHeader.textContent = 'Description';
      descHeader.style.cssText = EnvironmentDialogStyles.varHeaderCell;

      const actionHeader = document.createElement('div');
      actionHeader.textContent = '';
      actionHeader.style.cssText = EnvironmentDialogStyles.varHeaderCell;

      headerRow.appendChild(keyHeader);
      headerRow.appendChild(valueHeader);
      headerRow.appendChild(descHeader);
      headerRow.appendChild(actionHeader);
      varsContainer.appendChild(headerRow);

      Object.entries(selectedEnv.variables).forEach(([key, value]) => {
        const varRow = this.createVariableRow(
          key,
          value,
          descriptions[key] || '',
          selectedEnv,
          descriptions,
          renderVars
        );
        varsContainer.appendChild(varRow);
      });

      // Add variable button
      const addVarBtn = this.createAddVariableButton(selectedEnv, renderVars);
      varsContainer.appendChild(addVarBtn);
    };

    renderVars();

    const container = document.createElement('div');
    container.appendChild(varsHeader);
    container.appendChild(varsContainer);

    return container;
  }

  /**
   * Creates a single variable row with key, value, and delete button
   */
  private static createVariableRow(
    key: string,
    value: string,
    description: string,
    selectedEnv: Environment,
    descriptions: Record<string, string>,
    renderVars: () => void
  ): HTMLDivElement {
    const varRow = document.createElement('div');
    varRow.style.cssText = EnvironmentDialogStyles.varRow;

    let currentKey = key;
    const isDraft = currentKey.startsWith(DRAFT_PREFIX);

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.value = isDraft ? '' : currentKey;
    keyInput.placeholder = 'Key';
    keyInput.style.cssText = EnvironmentDialogStyles.varInput;
    keyInput.spellcheck = false;
    keyInput.addEventListener('focus', () => {
      keyInput.style.borderColor = 'var(--primary-color)';
      keyInput.style.boxShadow = '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
    });
    keyInput.addEventListener('blur', () => {
      keyInput.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      keyInput.style.boxShadow = 'none';
    });

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = value;
    valueInput.placeholder = 'Value';
    valueInput.style.cssText = EnvironmentDialogStyles.varInput;
    valueInput.spellcheck = false;
    valueInput.addEventListener('focus', () => {
      valueInput.style.borderColor = 'var(--primary-color)';
      valueInput.style.boxShadow = '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
    });
    valueInput.addEventListener('blur', () => {
      valueInput.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      valueInput.style.boxShadow = 'none';
    });

    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.value = description;
    descriptionInput.placeholder = 'Description';
    descriptionInput.style.cssText = EnvironmentDialogStyles.varInputDescription;
    descriptionInput.spellcheck = false;
    descriptionInput.addEventListener('focus', () => {
      descriptionInput.style.borderColor = 'var(--primary-color)';
      descriptionInput.style.boxShadow = '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
    });
    descriptionInput.addEventListener('blur', () => {
      descriptionInput.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      descriptionInput.style.boxShadow = 'none';
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = iconHtml('close');
    deleteBtn.style.cssText = EnvironmentDialogStyles.deleteVarButton;
    deleteBtn.title = 'Delete variable';

    deleteBtn.addEventListener('click', () => {
      delete selectedEnv.variables[currentKey];
      delete descriptions[currentKey];
      renderVars();
    });

    // Update on key change
    keyInput.addEventListener('blur', () => {
      const nextKey = keyInput.value.trim();
      if (!nextKey) {
        delete selectedEnv.variables[currentKey];
        delete descriptions[currentKey];
        renderVars();
        return;
      }

      if (nextKey !== currentKey) {
        const nextValue = valueInput.value;
        const nextDescription = descriptions[currentKey] || '';
        delete selectedEnv.variables[currentKey];
        delete descriptions[currentKey];
        selectedEnv.variables[nextKey] = nextValue;
        if (nextDescription) {
          descriptions[nextKey] = nextDescription;
        }
        renderVars();
      }
    });

    // Update on value change
    valueInput.addEventListener('input', () => {
      selectedEnv.variables[currentKey] = valueInput.value;
    });

    // Update on description change
    descriptionInput.addEventListener('input', () => {
      descriptions[currentKey] = descriptionInput.value;
    });

    varRow.appendChild(keyInput);
    varRow.appendChild(valueInput);
    varRow.appendChild(descriptionInput);
    varRow.appendChild(deleteBtn);

    return varRow;
  }

  /**
   * Creates the "Add Variable" button
   */
  private static createAddVariableButton(
    selectedEnv: Environment,
    renderVars: () => void
  ): HTMLButtonElement {
    const addVarBtn = document.createElement('button');
    addVarBtn.textContent = '+ Add Variable';
    addVarBtn.style.cssText = EnvironmentDialogStyles.addVarButton;

    addVarBtn.addEventListener('click', () => {
      const newKey = this.createDraftKey(selectedEnv.variables);
      selectedEnv.variables[newKey] = '';
      if (!selectedEnv.variableDescriptions) {
        selectedEnv.variableDescriptions = {};
      }
      selectedEnv.variableDescriptions[newKey] = '';
      renderVars();
    });

    return addVarBtn;
  }

  private static createDraftKey(existing: Record<string, string>): string {
    let draftKey = `${DRAFT_PREFIX}${crypto.randomUUID()}`;
    while (draftKey in existing) {
      draftKey = `${DRAFT_PREFIX}${crypto.randomUUID()}`;
    }
    return draftKey;
  }
}
