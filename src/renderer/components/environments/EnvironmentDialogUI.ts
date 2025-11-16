/**
 * UI builders for environment management dialog
 */

import { Environment } from '../../../shared/types';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';
import { EnvironmentVariablesManager } from './EnvironmentVariablesManager';

export interface EnvironmentDialogState {
  workingEnvs: Environment[];
  workingActiveId?: string;
  selectedEnvId: string | null;
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
}
