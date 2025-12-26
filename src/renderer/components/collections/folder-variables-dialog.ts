/**
 * Dialog for managing folder-scoped variables
 * Allows users to add, edit, and delete variables for folders/subfolders
 */

import { Collection } from '../../../shared/types';
import { iconHtml } from '../../utils/icons';

export interface FolderVariablesDialogResult {
  variables: Record<string, string>;
}

export class FolderVariablesDialog {
  /**
   * Shows the folder variables management dialog
   */
  static async show(
    folder: Collection,
    inheritedVariables?: Record<string, string>
  ): Promise<FolderVariablesDialogResult | null> {
    return new Promise((resolve) => {
      // Create working copy of variables
      const workingVars: Record<string, string> = { ...(folder.variables || {}) };

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'folder-vars-dialog-overlay';

      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'folder-vars-dialog';

      // Create header
      const header = document.createElement('div');
      header.className = 'folder-vars-dialog-header';

      const titleContainer = document.createElement('div');
      titleContainer.className = 'folder-vars-dialog-title-container';

      const icon = document.createElement('span');
      icon.className = 'folder-vars-dialog-icon';
      icon.innerHTML = iconHtml('folder');

      const title = document.createElement('h2');
      title.className = 'folder-vars-dialog-title';
      title.textContent = 'Manage Variables';

      const folderName = document.createElement('span');
      folderName.className = 'folder-vars-dialog-folder-name';
      folderName.textContent = folder.name;

      titleContainer.appendChild(icon);
      titleContainer.appendChild(title);
      titleContainer.appendChild(folderName);
      header.appendChild(titleContainer);

      // Create body
      const body = document.createElement('div');
      body.className = 'folder-vars-dialog-body';

      // Description
      const description = document.createElement('p');
      description.className = 'folder-vars-dialog-description';
      description.textContent = 'Variables defined here will be available to all requests within this folder and its subfolders. Child folder variables override parent folder variables.';
      body.appendChild(description);

      // Variables section
      const varsSection = document.createElement('div');
      varsSection.className = 'folder-vars-section';

      const varsHeader = document.createElement('div');
      varsHeader.className = 'folder-vars-section-header';

      const varsTitle = document.createElement('h3');
      varsTitle.className = 'folder-vars-section-title';
      varsTitle.textContent = 'Folder Variables';

      const varCount = document.createElement('span');
      varCount.className = 'folder-vars-count';
      varCount.textContent = `${Object.keys(workingVars).length} variable${Object.keys(workingVars).length !== 1 ? 's' : ''}`;

      varsHeader.appendChild(varsTitle);
      varsHeader.appendChild(varCount);
      varsSection.appendChild(varsHeader);

      // Variables table
      const varsTable = document.createElement('div');
      varsTable.className = 'folder-vars-table';

      // Table header
      const tableHeader = document.createElement('div');
      tableHeader.className = 'folder-vars-table-header';
      tableHeader.innerHTML = `
        <span class="folder-vars-col-key">Variable Name</span>
        <span class="folder-vars-col-value">Value</span>
        <span class="folder-vars-col-actions">Actions</span>
      `;
      varsTable.appendChild(tableHeader);

      // Variables container
      const varsContainer = document.createElement('div');
      varsContainer.className = 'folder-vars-container';

      const updateVarCount = () => {
        varCount.textContent = `${Object.keys(workingVars).length} variable${Object.keys(workingVars).length !== 1 ? 's' : ''}`;
      };

      const renderVars = () => {
        varsContainer.innerHTML = '';

        const entries = Object.entries(workingVars);

        if (entries.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'folder-vars-empty';
          emptyState.innerHTML = `
            <span class="folder-vars-empty-icon">${iconHtml('clipboard')}</span>
            <span class="folder-vars-empty-text">No variables defined</span>
            <span class="folder-vars-empty-hint">Click "Add Variable" to create one</span>
          `;
          varsContainer.appendChild(emptyState);
        } else {
          entries.forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'folder-vars-row';

            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.className = 'folder-vars-input folder-vars-key-input';
            keyInput.value = key;
            keyInput.placeholder = 'Variable name';
            keyInput.spellcheck = false;

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.className = 'folder-vars-input folder-vars-value-input';
            valueInput.value = value;
            valueInput.placeholder = 'Value';
            valueInput.spellcheck = false;

            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'folder-vars-row-actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'folder-vars-delete-btn';
            deleteBtn.title = 'Delete variable';
            deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`;

            deleteBtn.addEventListener('click', () => {
              delete workingVars[key];
              updateVarCount();
              renderVars();
            });

            // Update on key change
            let originalKey = key;
            keyInput.addEventListener('blur', () => {
              const newKey = keyInput.value.trim();
              if (newKey && newKey !== originalKey) {
                // Check for duplicate keys
                if (workingVars[newKey] !== undefined && newKey !== originalKey) {
                  keyInput.value = originalKey;
                  keyInput.classList.add('error');
                  setTimeout(() => keyInput.classList.remove('error'), 1500);
                  return;
                }
                delete workingVars[originalKey];
                workingVars[newKey] = valueInput.value;
                originalKey = newKey;
              } else if (!newKey) {
                keyInput.value = originalKey;
              }
            });

            // Update on value change
            valueInput.addEventListener('input', () => {
              workingVars[originalKey] = valueInput.value;
            });

            actionsContainer.appendChild(deleteBtn);
            row.appendChild(keyInput);
            row.appendChild(valueInput);
            row.appendChild(actionsContainer);
            varsContainer.appendChild(row);
          });
        }
      };

      varsTable.appendChild(varsContainer);
      varsSection.appendChild(varsTable);

      // Add variable button
      const addVarBtn = document.createElement('button');
      addVarBtn.className = 'folder-vars-add-btn';
      addVarBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        <span>Add Variable</span>
      `;
      addVarBtn.addEventListener('click', () => {
        // Find a unique key name
        let counter = 1;
        let newKey = 'new_variable';
        while (workingVars[newKey] !== undefined) {
          newKey = `new_variable_${counter}`;
          counter++;
        }
        workingVars[newKey] = '';
        updateVarCount();
        renderVars();
        // Focus the new key input
        setTimeout(() => {
          const inputs = varsContainer.querySelectorAll('.folder-vars-key-input');
          const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
          if (lastInput) {
            lastInput.focus();
            lastInput.select();
          }
        }, 50);
      });

      varsSection.appendChild(addVarBtn);
      body.appendChild(varsSection);

      // Inherited variables section (if any)
      if (inheritedVariables && Object.keys(inheritedVariables).length > 0) {
        const inheritedSection = document.createElement('div');
        inheritedSection.className = 'folder-vars-inherited-section';

        const inheritedHeader = document.createElement('div');
        inheritedHeader.className = 'folder-vars-section-header';

        const inheritedTitle = document.createElement('h3');
        inheritedTitle.className = 'folder-vars-section-title inherited';
        inheritedTitle.textContent = 'Inherited Variables';

        const inheritedInfo = document.createElement('span');
        inheritedInfo.className = 'folder-vars-inherited-info';
        inheritedInfo.textContent = 'From parent folders (read-only)';

        inheritedHeader.appendChild(inheritedTitle);
        inheritedHeader.appendChild(inheritedInfo);
        inheritedSection.appendChild(inheritedHeader);

        const inheritedList = document.createElement('div');
        inheritedList.className = 'folder-vars-inherited-list';

        Object.entries(inheritedVariables).forEach(([key, value]) => {
          // Skip if already overridden in current folder
          if (workingVars[key] !== undefined) return;

          const row = document.createElement('div');
          row.className = 'folder-vars-inherited-row';

          const keySpan = document.createElement('span');
          keySpan.className = 'folder-vars-inherited-key';
          keySpan.textContent = key;

          const valueSpan = document.createElement('span');
          valueSpan.className = 'folder-vars-inherited-value';
          valueSpan.textContent = value;

          row.appendChild(keySpan);
          row.appendChild(valueSpan);
          inheritedList.appendChild(row);
        });

        inheritedSection.appendChild(inheritedList);
        body.appendChild(inheritedSection);
      }

      // Create footer
      const footer = document.createElement('div');
      footer.className = 'folder-vars-dialog-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'folder-vars-cancel-btn';
      cancelBtn.textContent = 'Cancel';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'folder-vars-save-btn';
      saveBtn.textContent = 'Save Changes';

      const cleanup = () => {
        if (document.body.contains(overlay)) {
          overlay.classList.add('closing');
          dialog.classList.add('closing');
          setTimeout(() => {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          }, 200);
        }
      };

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      saveBtn.addEventListener('click', () => {
        cleanup();
        resolve({ variables: workingVars });
      });

      // Handle overlay click to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });

      // Handle escape key
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(null);
          document.removeEventListener('keydown', handleKeydown);
        }
      };
      document.addEventListener('keydown', handleKeydown);

      footer.appendChild(cancelBtn);
      footer.appendChild(saveBtn);

      // Assemble dialog
      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);

      // Add to DOM with animation
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
        dialog.classList.add('visible');
      });

      // Initial render
      renderVars();
    });
  }
}
