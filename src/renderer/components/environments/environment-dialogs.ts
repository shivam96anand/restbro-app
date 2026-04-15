import { Environment, Globals } from '../../../shared/types';
import { modal } from '../../utils/modal';
import { EnvironmentDialogStyles } from './EnvironmentDialogStyles';
import {
  EnvironmentDialogUI,
  EnvironmentDialogState,
  DialogTab,
} from './EnvironmentDialogUI';

export class EnvironmentDialogs {
  private onShowError: (message: string) => void;

  constructor(onShowError: (message: string) => void) {
    this.onShowError = onShowError;
  }

  async promptEnvironmentName(
    defaultValue: string = ''
  ): Promise<string | null> {
    return modal.show(
      'Environment Name',
      'Enter environment name',
      defaultValue
    );
  }

  async showManageDialog(
    environments: Environment[],
    activeEnvironmentId?: string
  ): Promise<{
    environments: Environment[];
    activeEnvironmentId?: string;
    globals?: Globals;
  } | null> {
    // Load globals from store
    let loadedGlobals: Globals = { variables: {}, variableDescriptions: {} };
    try {
      const storeState = await window.restbro.store.get();
      loadedGlobals = storeState.globals || {
        variables: {},
        variableDescriptions: {},
      };
    } catch (error) {
      console.error('Failed to load globals:', error);
    }

    return new Promise((resolve) => {
      // Create overlay and dialog containers
      const { overlay, dialog, body } = this.createDialogStructure();

      // Initialize state
      const state: EnvironmentDialogState = {
        workingEnvs: [
          ...environments.map((e) => ({
            ...e,
            variables: { ...e.variables },
            variableDescriptions: { ...(e.variableDescriptions || {}) },
          })),
        ],
        workingActiveId: activeEnvironmentId,
        selectedEnvId: environments[0]?.id || null,
        workingGlobals: {
          variables: { ...loadedGlobals.variables },
          variableDescriptions: {
            ...(loadedGlobals.variableDescriptions || {}),
          },
        },
        activeTab: 'environments',
      };

      // Render function
      const renderBody = () => {
        body.innerHTML = '';

        // Create tabs
        const tabs = EnvironmentDialogUI.createTabs(
          state.activeTab,
          (tab: DialogTab) => {
            state.activeTab = tab;
            renderBody();
          }
        );
        body.appendChild(tabs);

        if (state.activeTab === 'globals') {
          // Render globals panel
          const globalsPanel = EnvironmentDialogUI.createGlobalsPanel(
            state.workingGlobals
          );
          body.appendChild(globalsPanel);
          return;
        }

        // Render environments tab
        if (state.workingEnvs.length === 0) {
          body.appendChild(EnvironmentDialogUI.createEmptyState());
          return;
        }

        const layout = EnvironmentDialogUI.createLayout(
          state,
          (envId) => {
            state.selectedEnvId = envId;
            renderBody();
          },
          (envId) => {
            state.workingActiveId = envId;
            renderBody();
          },
          (newName) => {
            const selectedEnv = state.workingEnvs.find(
              (e) => e.id === state.selectedEnvId
            );
            if (selectedEnv) {
              selectedEnv.name = newName;
            }
          },
          () => {
            state.workingEnvs = state.workingEnvs.filter(
              (e) => e.id !== state.selectedEnvId
            );
            if (state.workingActiveId === state.selectedEnvId) {
              state.workingActiveId = undefined;
            }
            state.selectedEnvId = state.workingEnvs[0]?.id || null;
            renderBody();
          }
        );

        body.appendChild(layout);
      };

      // Create header with handlers
      const header = EnvironmentDialogUI.createHeader(
        async () => {
          const name = await this.promptEnvironmentName();
          if (name) {
            const newEnv: Environment = {
              id: crypto.randomUUID(),
              name,
              variables: {},
            };
            state.workingEnvs.push(newEnv);
            state.selectedEnvId = newEnv.id;
            renderBody();
          }
        },
        async () => {
          if (state.workingEnvs.length === 0) return;

          const confirmed = confirm(
            `Delete all ${state.workingEnvs.length} environment(s)? This cannot be undone.`
          );
          if (confirmed) {
            state.workingEnvs = [];
            state.selectedEnvId = null;
            state.workingActiveId = undefined;
            renderBody();
          }
        }
      );

      // Create footer with handlers
      const cleanup = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      };

      const footer = EnvironmentDialogUI.createFooter(
        () => {
          cleanup();
          resolve(null);
        },
        () => {
          const DRAFT_PREFIX = '__restbro_draft__';
          state.workingEnvs.forEach((env) => {
            const descriptions = env.variableDescriptions || {};
            Object.keys(env.variables).forEach((key) => {
              if (!key || key.startsWith(DRAFT_PREFIX)) {
                delete env.variables[key];
                delete descriptions[key];
              }
            });
            env.variableDescriptions = descriptions;
          });

          const globalDescriptions =
            state.workingGlobals.variableDescriptions || {};
          Object.keys(state.workingGlobals.variables).forEach((key) => {
            if (!key || key.startsWith(DRAFT_PREFIX)) {
              delete state.workingGlobals.variables[key];
              delete globalDescriptions[key];
            }
          });
          state.workingGlobals.variableDescriptions = globalDescriptions;

          cleanup();
          resolve({
            environments: state.workingEnvs,
            activeEnvironmentId: state.workingActiveId,
            globals: state.workingGlobals,
          });
        }
      );

      // Handle overlay click to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });

      // Assemble dialog
      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Initial render
      renderBody();
    });
  }

  /**
   * Creates the basic dialog structure (overlay, dialog, body)
   */
  private createDialogStructure(): {
    overlay: HTMLDivElement;
    dialog: HTMLDivElement;
    body: HTMLDivElement;
  } {
    const overlay = document.createElement('div');
    overlay.style.cssText = EnvironmentDialogStyles.overlay;

    const dialog = document.createElement('div');
    dialog.style.cssText = EnvironmentDialogStyles.dialog;

    const body = document.createElement('div');
    body.style.cssText = EnvironmentDialogStyles.body;

    return { overlay, dialog, body };
  }
}
