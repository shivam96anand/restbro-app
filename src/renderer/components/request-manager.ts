import { ApiRequest } from '../../shared/types';
import { RequestFormHandler } from './request/request-form-handler';
import { RequestEditorsManager } from './request/request-editors-manager';
import { RequestDataManager } from './request/request-data-manager';
import { buildFolderVars } from './request/variable-helper';

export class RequestManager {
  private formHandler: RequestFormHandler;
  private editorsManager: RequestEditorsManager;
  private dataManager: RequestDataManager;

  constructor() {
    this.formHandler = new RequestFormHandler(
      (updates) => this.updateRequest(updates)
    );

    this.editorsManager = new RequestEditorsManager(
      (updates) => this.updateRequest(updates)
    );

    this.dataManager = new RequestDataManager(
      (message) => this.formHandler.showError(message),
      this.editorsManager
    );
  }

  private updateRequest(updates: Partial<ApiRequest>): void {
    this.dataManager.updateCurrentRequest(updates);
  }

  initialize(): void {
    this.formHandler.setupRequestForm();
    this.formHandler.setupRequestTabs();
    this.dataManager.setupSendButton();
    this.dataManager.setupCancelButton();
    this.dataManager.setupCancelEventListener();
    this.dataManager.setupTabChangeListener();

    this.editorsManager.setupParamsEditor();
    this.editorsManager.setupHeadersEditor();
    this.editorsManager.setupBodyEditor();
    this.editorsManager.setupAuthEditor();

    this.formHandler.showEmptyState();

    document.addEventListener('tab-changed', (e: Event) => {
      const customEvent = e as CustomEvent;
      const activeTab = customEvent.detail.activeTab;
      this.loadRequest(
        activeTab ? activeTab.request : null,
        activeTab ? activeTab.collectionId : undefined,
        activeTab ? activeTab.activeDetailsTab : undefined
      );
    });
  }

  private async loadRequest(request: ApiRequest | null, collectionId?: string, activeDetailsTab?: string): Promise<void> {
    this.dataManager.setCurrentRequest(request);

    if (!request) {
      this.clearForm();
      this.formHandler.showEmptyState();
      return;
    }

    this.formHandler.showRequestForm();
    this.formHandler.loadBasicRequestData(request);
    this.formHandler.refreshVariableTooltips(collectionId); // Refresh tooltips with collectionId
    this.formHandler.restoreActiveDetailsTab(activeDetailsTab); // Restore the active details tab

    // Set variable context for params and headers editors
    await this.refreshVariableContext(collectionId);

    this.editorsManager.loadParams(request.params || {});
    this.editorsManager.loadHeaders(request.headers);

    if (request.body) {
      this.editorsManager.loadBody(request.body);
    }

    if (request.auth) {
      this.editorsManager.loadAuth(request.auth, collectionId);
    }
  }

  /**
   * Refresh variable context for editors when environment changes or request loads
   */
  private async refreshVariableContext(collectionId?: string): Promise<void> {
    try {
      const state = await window.apiCourier.store.get();
      const activeEnvironment = state.activeEnvironmentId
        ? state.environments.find((e: any) => e.id === state.activeEnvironmentId)
        : undefined;

      const globals = state.globals || { variables: {} };
      const folderVars = buildFolderVars(collectionId, state.collections);

      this.editorsManager.setVariableContext(activeEnvironment, globals, folderVars);
    } catch (error) {
      console.error('Failed to refresh variable context:', error);
    }
  }

  private clearForm(): void {
    this.formHandler.clearBasicForm();
    this.editorsManager.clearEditors();
  }
}
