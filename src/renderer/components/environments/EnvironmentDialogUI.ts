/**
 * UI builders for environment management dialog
 */

import { Environment, Globals } from '../../../shared/types';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';
import { EnvironmentVariablesManager } from './EnvironmentVariablesManager';
import { iconHtml } from '../../utils/icons';

export type DialogTab = 'environments' | 'globals';

export interface EnvironmentDialogState {
  workingEnvs: Environment[];
  workingActiveId?: string;
  selectedEnvId: string | null;
  workingGlobals: Globals;
  activeTab: DialogTab;
}

export class EnvironmentDialogUI {
  /**
   * Creates the environment list (left panel)
   */
  static createEnvironmentList(
    state: EnvironmentDialogState,
    onSelectEnv: (envId: string) => void,
    onSetActive: (envId: string) => void
  ): HTMLDivElement {
    const envList = document.createElement('div');
    envList.style.cssText = EnvironmentDialogStyles.envList;

    state.workingEnvs.forEach(env => {
      const envItem = document.createElement('div');
      envItem.style.cssText = EnvironmentDialogStyles.getEnvItemStyle(
        state.selectedEnvId === env.id
      );

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'active-env';
      radio.checked = state.workingActiveId === env.id;
      radio.title = 'Set as active';
      radio.style.cursor = 'pointer';

      radio.addEventListener('change', () => {
        if (radio.checked) {
          onSetActive(env.id);
        }
      });

      const nameSpan = document.createElement('span');
      nameSpan.textContent = env.name;
      nameSpan.style.cssText = EnvironmentDialogStyles.envNameSpan;

      envItem.addEventListener('click', (e) => {
        if (e.target !== radio) {
          onSelectEnv(env.id);
        }
      });

      envItem.appendChild(radio);
      envItem.appendChild(nameSpan);
      envList.appendChild(envItem);
    });

    return envList;
  }

  /**
   * Creates the environment details panel (right panel)
   */
  static createEnvironmentDetails(
    selectedEnv: Environment,
    onNameChange: (newName: string) => void,
    onDelete: () => void
  ): HTMLDivElement {
    const envDetails = document.createElement('div');
    envDetails.style.cssText = EnvironmentDialogStyles.envDetails;

    // Name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name:';
    nameLabel.style.cssText = EnvironmentDialogStyles.label;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = selectedEnv.name;
    nameInput.style.cssText = EnvironmentDialogStyles.nameInput;

    nameInput.addEventListener('input', () => {
      onNameChange(nameInput.value);
    });

    // Variables section
    const varsSection = EnvironmentVariablesManager.renderVariablesSection(selectedEnv);

    // Delete environment button
    const deleteEnvBtn = document.createElement('button');
    deleteEnvBtn.textContent = 'Delete Environment';
    deleteEnvBtn.style.cssText = EnvironmentDialogStyles.deleteEnvButton;

    deleteEnvBtn.addEventListener('click', async () => {
      const confirmed = confirm(`Delete environment "${selectedEnv.name}"?`);
      if (confirmed) {
        onDelete();
      }
    });

    envDetails.appendChild(nameLabel);
    envDetails.appendChild(nameInput);
    envDetails.appendChild(varsSection);
    envDetails.appendChild(deleteEnvBtn);

    return envDetails;
  }

  /**
   * Creates the empty state message
   */
  static createEmptyState(): HTMLDivElement {
    const emptyState = document.createElement('div');
    emptyState.textContent = 'No environments. Click "+ New Environment" to create one.';
    emptyState.style.cssText = EnvironmentDialogStyles.emptyState;
    return emptyState;
  }

  /**
   * Creates the two-column layout
   */
  static createLayout(
    state: EnvironmentDialogState,
    onSelectEnv: (envId: string) => void,
    onSetActive: (envId: string) => void,
    onNameChange: (newName: string) => void,
    onDelete: () => void
  ): HTMLDivElement {
    const layout = document.createElement('div');
    layout.style.cssText = EnvironmentDialogStyles.layout;

    const envList = this.createEnvironmentList(state, onSelectEnv, onSetActive);
    layout.appendChild(envList);

    const selectedEnv = state.workingEnvs.find(e => e.id === state.selectedEnvId);
    if (selectedEnv) {
      const envDetails = this.createEnvironmentDetails(selectedEnv, onNameChange, onDelete);
      layout.appendChild(envDetails);
    }

    return layout;
  }

  /**
   * Creates the dialog header
   */
  static createHeader(
    onAddEnvironment: () => void,
    onDeleteAll: () => void
  ): HTMLDivElement {
    const header = document.createElement('div');
    header.style.cssText = EnvironmentDialogStyles.header;

    const title = document.createElement('h2');
    title.textContent = 'Manage Environments';
    title.style.cssText = EnvironmentDialogStyles.title;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = EnvironmentDialogStyles.buttonsContainer;

    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.textContent = 'Delete All';
    deleteAllBtn.style.cssText = EnvironmentDialogStyles.deleteAllButton;
    deleteAllBtn.addEventListener('click', onDeleteAll);

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ New Environment';
    addBtn.style.cssText = EnvironmentDialogStyles.addButton;
    addBtn.addEventListener('click', onAddEnvironment);

    buttonsContainer.appendChild(deleteAllBtn);
    buttonsContainer.appendChild(addBtn);

    header.appendChild(title);
    header.appendChild(buttonsContainer);

    return header;
  }

  /**
   * Creates the dialog footer with action buttons
   */
  static createFooter(
    onCancel: () => void,
    onSave: () => void
  ): HTMLDivElement {
    const footer = document.createElement('div');
    footer.style.cssText = EnvironmentDialogStyles.footer;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = EnvironmentDialogStyles.cancelButton;
    cancelBtn.addEventListener('click', onCancel);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = EnvironmentDialogStyles.saveButton;
    saveBtn.addEventListener('click', onSave);

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    return footer;
  }

  /**
   * Creates the tabs for switching between Environments and Globals
   */
  static createTabs(
    activeTab: DialogTab,
    onTabChange: (tab: DialogTab) => void
  ): HTMLDivElement {
    const tabsContainer = document.createElement('div');
    tabsContainer.style.cssText = EnvironmentDialogStyles.tabsContainer;

    const envTab = document.createElement('button');
    envTab.textContent = 'Environments';
    envTab.style.cssText = EnvironmentDialogStyles.getTabStyle(activeTab === 'environments');
    envTab.addEventListener('click', () => onTabChange('environments'));

    const globalsTab = document.createElement('button');
    globalsTab.textContent = 'Globals';
    globalsTab.style.cssText = EnvironmentDialogStyles.getTabStyle(activeTab === 'globals');
    globalsTab.addEventListener('click', () => onTabChange('globals'));

    tabsContainer.appendChild(envTab);
    tabsContainer.appendChild(globalsTab);

    return tabsContainer;
  }

  /**
   * Creates the globals panel for editing global variables
   */
  static createGlobalsPanel(globals: Globals): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = EnvironmentDialogStyles.globalsPanel;

    // Description
    const description = document.createElement('div');
    description.style.cssText = EnvironmentDialogStyles.globalsDescription;
    description.textContent = 'Global variables are available in all requests, regardless of the selected environment. They have the lowest priority and will be overridden by environment or folder variables with the same name.';
    panel.appendChild(description);

    // Variables label
    const varsLabel = document.createElement('div');
    varsLabel.textContent = 'Variables:';
    varsLabel.style.cssText = EnvironmentDialogStyles.varsLabel;
    panel.appendChild(varsLabel);

    // Variables container
    const varsContainer = document.createElement('div');
    varsContainer.style.cssText = EnvironmentDialogStyles.varsContainer;

    const renderVars = () => {
      varsContainer.innerHTML = '';

      Object.entries(globals.variables).forEach(([key, value]) => {
        const varRow = this.createGlobalVariableRow(key, value, globals, renderVars);
        varsContainer.appendChild(varRow);
      });

      // Add variable button
      const addVarBtn = document.createElement('button');
      addVarBtn.textContent = '+ Add Variable';
      addVarBtn.style.cssText = EnvironmentDialogStyles.addVarButton;
      addVarBtn.addEventListener('click', () => {
        const newKey = `global${Object.keys(globals.variables).length + 1}`;
        globals.variables[newKey] = '';
        renderVars();
      });
      varsContainer.appendChild(addVarBtn);
    };

    renderVars();
    panel.appendChild(varsContainer);

    return panel;
  }

  /**
   * Creates a single global variable row
   */
  private static createGlobalVariableRow(
    key: string,
    value: string,
    globals: Globals,
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
    deleteBtn.innerHTML = iconHtml('close');
    deleteBtn.style.cssText = EnvironmentDialogStyles.deleteVarButton;

    deleteBtn.addEventListener('click', () => {
      delete globals.variables[key];
      renderVars();
    });

    // Update on key change
    keyInput.addEventListener('blur', () => {
      if (keyInput.value && keyInput.value !== key) {
        delete globals.variables[key];
        globals.variables[keyInput.value] = valueInput.value;
        renderVars();
      }
    });

    // Update on value change
    valueInput.addEventListener('input', () => {
      globals.variables[key] = valueInput.value;
    });

    varRow.appendChild(keyInput);
    varRow.appendChild(valueInput);
    varRow.appendChild(deleteBtn);

    return varRow;
  }
}
