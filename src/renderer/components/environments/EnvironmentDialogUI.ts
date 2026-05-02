/**
 * UI builders for environment management dialog
 */

import { Environment, Globals } from '../../../shared/types';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';
import { EnvironmentVariablesManager } from './EnvironmentVariablesManager';
import { iconHtml } from '../../utils/icons';

const DRAFT_PREFIX = '__restbro_draft__';

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
    onSelectEnv: (envId: string) => void
  ): HTMLDivElement {
    const envList = document.createElement('div');
    envList.style.cssText = EnvironmentDialogStyles.envList;

    const envListHeader = document.createElement('div');
    envListHeader.style.cssText = EnvironmentDialogStyles.envListHeader;

    const envListTitle = document.createElement('div');
    envListTitle.textContent = 'Environments';
    envListTitle.style.cssText = EnvironmentDialogStyles.envListTitle;

    const envListCount = document.createElement('div');
    envListCount.textContent = `${state.workingEnvs.length}`;
    envListCount.style.cssText = EnvironmentDialogStyles.envListCount;

    envListHeader.appendChild(envListTitle);
    envListHeader.appendChild(envListCount);
    envList.appendChild(envListHeader);

    const envListBody = document.createElement('div');
    envListBody.style.cssText = EnvironmentDialogStyles.envListBody;

    state.workingEnvs.forEach((env) => {
      const envItem = document.createElement('div');
      envItem.style.cssText = EnvironmentDialogStyles.getEnvItemStyle(
        state.selectedEnvId === env.id
      );

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selected-env';
      radio.checked = state.selectedEnvId === env.id;
      radio.title = 'Selected environment';
      radio.style.cursor = 'pointer';
      radio.style.accentColor = 'var(--primary-color)';

      radio.addEventListener('change', () => {
        if (radio.checked) {
          onSelectEnv(env.id);
        }
      });

      const nameSpan = document.createElement('span');
      nameSpan.textContent = env.name;
      nameSpan.style.cssText = EnvironmentDialogStyles.envNameSpan;

      const meta = document.createElement('div');
      meta.style.cssText = EnvironmentDialogStyles.envMeta;

      if (state.workingActiveId === env.id) {
        const activeBadge = document.createElement('span');
        activeBadge.textContent = 'Active';
        activeBadge.style.cssText = EnvironmentDialogStyles.activeBadge;
        meta.appendChild(activeBadge);
      }

      envItem.addEventListener('click', (e) => {
        if (e.target !== radio) {
          onSelectEnv(env.id);
        }
      });

      envItem.appendChild(radio);
      envItem.appendChild(nameSpan);
      envItem.appendChild(meta);
      envListBody.appendChild(envItem);
    });

    envList.appendChild(envListBody);

    return envList;
  }

  /**
   * Creates the environment details panel (right panel)
   */
  static createEnvironmentDetails(
    selectedEnv: Environment,
    isActive: boolean,
    onNameChange: (newName: string) => void,
    onDelete: () => void,
    onSetActive: () => void,
    onDuplicate?: () => void
  ): HTMLDivElement {
    const envDetails = document.createElement('div');
    envDetails.style.cssText = EnvironmentDialogStyles.envDetails;

    const detailHeader = document.createElement('div');
    detailHeader.style.cssText = EnvironmentDialogStyles.detailHeader;

    const detailTitle = document.createElement('div');
    detailTitle.textContent = 'Environment Details';
    detailTitle.style.cssText = EnvironmentDialogStyles.detailTitle;
    detailHeader.appendChild(detailTitle);

    const headerButtons = document.createElement('div');
    headerButtons.style.cssText =
      'display: flex; gap: 8px; align-items: center;';

    if (isActive) {
      const activeBadge = document.createElement('span');
      activeBadge.textContent = 'Active';
      activeBadge.style.cssText = EnvironmentDialogStyles.activeBadge;
      headerButtons.appendChild(activeBadge);
    } else {
      const setActiveBtn = document.createElement('button');
      setActiveBtn.textContent = 'Set Active';
      setActiveBtn.style.cssText = EnvironmentDialogStyles.setActiveButton;
      setActiveBtn.addEventListener('click', onSetActive);
      headerButtons.appendChild(setActiveBtn);
    }

    if (onDuplicate) {
      const duplicateBtn = document.createElement('button');
      duplicateBtn.textContent = 'Duplicate';
      duplicateBtn.style.cssText = EnvironmentDialogStyles.setActiveButton;
      duplicateBtn.addEventListener('click', onDuplicate);
      headerButtons.appendChild(duplicateBtn);
    }

    detailHeader.appendChild(headerButtons);

    // Name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name';
    nameLabel.style.cssText = EnvironmentDialogStyles.label;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = selectedEnv.name;
    nameInput.placeholder = 'Environment name';
    nameInput.style.cssText = EnvironmentDialogStyles.nameInput;

    nameInput.addEventListener('focus', () => {
      nameInput.style.borderColor = 'var(--primary-color)';
      nameInput.style.boxShadow =
        '0 0 0 2px rgba(var(--primary-color-rgb), 0.15)';
    });
    nameInput.addEventListener('blur', () => {
      nameInput.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      nameInput.style.boxShadow = 'none';
    });

    nameInput.addEventListener('input', () => {
      onNameChange(nameInput.value);
    });

    // Variables section
    const varsSection =
      EnvironmentVariablesManager.renderVariablesSection(selectedEnv);

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

    envDetails.appendChild(detailHeader);
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
    emptyState.textContent =
      'No environments. Click "+ New Environment" to create one.';
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
    onDelete: () => void,
    onDuplicate?: (envId: string) => void
  ): HTMLDivElement {
    const layout = document.createElement('div');
    layout.style.cssText = EnvironmentDialogStyles.layout;

    const envList = this.createEnvironmentList(state, onSelectEnv);
    layout.appendChild(envList);

    const selectedEnv = state.workingEnvs.find(
      (e) => e.id === state.selectedEnvId
    );
    if (selectedEnv) {
      const envDetails = this.createEnvironmentDetails(
        selectedEnv,
        state.workingActiveId === selectedEnv.id,
        onNameChange,
        onDelete,
        () => onSetActive(selectedEnv.id),
        onDuplicate ? () => onDuplicate(selectedEnv.id) : undefined
      );
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
    envTab.style.cssText = EnvironmentDialogStyles.getTabStyle(
      activeTab === 'environments'
    );
    envTab.addEventListener('click', () => onTabChange('environments'));

    const globalsTab = document.createElement('button');
    globalsTab.textContent = 'Globals';
    globalsTab.style.cssText = EnvironmentDialogStyles.getTabStyle(
      activeTab === 'globals'
    );
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
    description.textContent =
      'Global variables are available in all requests, regardless of the selected environment. They have the lowest priority and will be overridden by environment or folder variables with the same name.';
    panel.appendChild(description);

    // Variables header
    const varsHeader = document.createElement('div');
    varsHeader.style.cssText = EnvironmentDialogStyles.varsHeader;

    const varsTitle = document.createElement('div');
    varsTitle.textContent = 'Global Variables';
    varsTitle.style.cssText = EnvironmentDialogStyles.varsTitle;

    const varsCount = document.createElement('div');
    varsCount.style.cssText = EnvironmentDialogStyles.varsCount;

    varsHeader.appendChild(varsTitle);
    varsHeader.appendChild(varsCount);
    panel.appendChild(varsHeader);

    // Variables container
    const varsContainer = document.createElement('div');
    varsContainer.style.cssText = EnvironmentDialogStyles.varsContainer;

    if (!globals.variableDescriptions) {
      globals.variableDescriptions = {};
    }

    const renderVars = () => {
      varsContainer.innerHTML = '';
      varsCount.textContent = `${Object.keys(globals.variables).length}`;

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

      Object.entries(globals.variables).forEach(([key, value]) => {
        const varRow = this.createGlobalVariableRow(
          key,
          value,
          globals,
          renderVars
        );
        varsContainer.appendChild(varRow);
      });

      // Add variable button
      const addVarBtn = document.createElement('button');
      addVarBtn.textContent = '+ Add Variable';
      addVarBtn.style.cssText = EnvironmentDialogStyles.addVarButton;
      addVarBtn.addEventListener('click', () => {
        const newKey = this.createDraftKey(globals.variables);
        globals.variables[newKey] = '';
        if (!globals.variableDescriptions) {
          globals.variableDescriptions = {};
        }
        globals.variableDescriptions[newKey] = '';
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

    if (!globals.variableDescriptions) {
      globals.variableDescriptions = {};
    }
    const descriptions = globals.variableDescriptions;
    const currentKey = key;
    const isDraft = currentKey.startsWith(DRAFT_PREFIX);

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.value = isDraft ? '' : currentKey;
    keyInput.placeholder = 'Key';
    keyInput.style.cssText = EnvironmentDialogStyles.varInput;
    keyInput.spellcheck = false;
    keyInput.addEventListener('focus', () => {
      keyInput.style.borderColor = 'var(--primary-color)';
      keyInput.style.boxShadow =
        '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
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
      valueInput.style.boxShadow =
        '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
    });
    valueInput.addEventListener('blur', () => {
      valueInput.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      valueInput.style.boxShadow = 'none';
    });

    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.value = descriptions[currentKey] || '';
    descriptionInput.placeholder = 'Description';
    descriptionInput.style.cssText =
      EnvironmentDialogStyles.varInputDescription;
    descriptionInput.spellcheck = false;
    descriptionInput.addEventListener('focus', () => {
      descriptionInput.style.borderColor = 'var(--primary-color)';
      descriptionInput.style.boxShadow =
        '0 0 0 2px rgba(var(--primary-color-rgb), 0.12)';
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
      delete globals.variables[currentKey];
      delete descriptions[currentKey];
      renderVars();
    });

    // Update on key change
    keyInput.addEventListener('blur', () => {
      const nextKey = keyInput.value.trim();
      if (!nextKey) {
        delete globals.variables[currentKey];
        delete descriptions[currentKey];
        renderVars();
        return;
      }

      if (nextKey !== currentKey) {
        const nextValue = valueInput.value;
        const nextDescription = descriptions[currentKey] || '';
        delete globals.variables[currentKey];
        delete descriptions[currentKey];
        globals.variables[nextKey] = nextValue;
        if (nextDescription) {
          descriptions[nextKey] = nextDescription;
        }
        renderVars();
      }
    });

    // Update on value change
    valueInput.addEventListener('input', () => {
      globals.variables[currentKey] = valueInput.value;
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

  private static createDraftKey(existing: Record<string, string>): string {
    let draftKey = `${DRAFT_PREFIX}${crypto.randomUUID()}`;
    while (draftKey in existing) {
      draftKey = `${DRAFT_PREFIX}${crypto.randomUUID()}`;
    }
    return draftKey;
  }
}
