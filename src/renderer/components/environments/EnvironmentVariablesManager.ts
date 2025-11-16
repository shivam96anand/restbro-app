/**
 * Manager for environment variables rendering and editing
 */

import { Environment } from '../../../shared/types';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';

export class EnvironmentVariablesManager {
  /**
   * Renders the variables section for an environment
   */
  static renderVariablesSection(selectedEnv: Environment): HTMLDivElement {
    const varsLabel = document.createElement('div');
    varsLabel.textContent = 'Variables:';
    varsLabel.style.cssText = EnvironmentDialogStyles.varsLabel;

    const varsContainer = document.createElement('div');
    varsContainer.style.cssText = EnvironmentDialogStyles.varsContainer;

    const renderVars = () => {
      varsContainer.innerHTML = '';

      Object.entries(selectedEnv.variables).forEach(([key, value]) => {
        const varRow = this.createVariableRow(key, value, selectedEnv, renderVars);
        varsContainer.appendChild(varRow);
      });

      // Add variable button
      const addVarBtn = this.createAddVariableButton(selectedEnv, renderVars);
      varsContainer.appendChild(addVarBtn);
    };

    renderVars();

    const container = document.createElement('div');
    container.appendChild(varsLabel);
    container.appendChild(varsContainer);

    return container;
  }

  /**
   * Creates a single variable row with key, value, and delete button
   */
  private static createVariableRow(
    key: string,
    value: string,
    selectedEnv: Environment,
    renderVars: () => void
  ): HTMLDivElement {
    const varRow = document.createElement('div');
    varRow.style.cssText = EnvironmentDialogStyles.varRow;

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.value = key;
    keyInput.placeholder = 'Key';
    keyInput.style.cssText = EnvironmentDialogStyles.varInput;

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = value;
    valueInput.placeholder = 'Value';
    valueInput.style.cssText = EnvironmentDialogStyles.varInput;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.style.cssText = EnvironmentDialogStyles.deleteVarButton;

    deleteBtn.addEventListener('click', () => {
      delete selectedEnv.variables[key];
      renderVars();
    });

    // Update on key change
    keyInput.addEventListener('blur', () => {
      if (keyInput.value && keyInput.value !== key) {
        delete selectedEnv.variables[key];
        selectedEnv.variables[keyInput.value] = valueInput.value;
        renderVars();
      }
    });

    // Update on value change
    valueInput.addEventListener('input', () => {
      selectedEnv.variables[key] = valueInput.value;
    });

    varRow.appendChild(keyInput);
    varRow.appendChild(valueInput);
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
      const newKey = `var${Object.keys(selectedEnv.variables).length + 1}`;
      selectedEnv.variables[newKey] = '';
      renderVars();
    });

    return addVarBtn;
  }
}
