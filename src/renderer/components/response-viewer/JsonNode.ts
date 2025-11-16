/**
 * JSON node renderer with type badges, actions, and search highlighting
 */

import { JsonNode, SearchMatch, VIEWER_CLASSES } from './types';
import { ViewerStateManager } from './viewerState';
import { JsonNodeActionMenu } from './JsonNodeActionMenu';
import { JsonNodeElements } from './JsonNodeElements';

export interface JsonNodeRendererOptions {
  stateManager: ViewerStateManager;
  onToggle?: (nodeId: string) => void;
  onSelect?: (nodeId: string) => void;
  onAction?: (nodeId: string, action: string, data?: any) => void;
}

export interface JsonNodeRenderContext {
  searchMatches: SearchMatch[];
  isSelected: boolean;
  showTypes: boolean;
}

export class JsonNodeRenderer {
  private stateManager: ViewerStateManager;
  private options: JsonNodeRendererOptions;
  private actionMenu: JsonNodeActionMenu;
  private nodeCache = new Map<string, JsonNode>();

  constructor(options: JsonNodeRendererOptions) {
    this.options = options;
    this.stateManager = options.stateManager;
    this.actionMenu = new JsonNodeActionMenu();
    this.setupGlobalEventListeners();
  }

  private setupGlobalEventListeners(): void {
    // Close action menus when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.json-node-actions')) {
        this.actionMenu.closeAll();
      }
    });
  }

  public render(node: JsonNode, context: JsonNodeRenderContext): HTMLElement {
    // Cache node for action menu lookup
    this.nodeCache.set(node.id, node);

    const element = document.createElement('div');
    element.className = this.getNodeClasses(node, context);
    element.style.paddingLeft = `${node.level * 16 + 8}px`;
    element.dataset.nodeId = node.id;
    element.dataset.nodeType = node.type;

    // Main content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'json-node-content';

    // Expand/collapse icon
    const expandIcon = JsonNodeElements.createExpandIcon(node);
    contentContainer.appendChild(expandIcon);

    // Key part
    if (JsonNodeElements.shouldShowKey(node)) {
      const keyElement = JsonNodeElements.createKeyElement(node, context.searchMatches);
      contentContainer.appendChild(keyElement);

      const separator = document.createElement('span');
      separator.className = 'json-node-separator';
      separator.textContent = ': ';
      contentContainer.appendChild(separator);
    }

    // Value part
    const valueElement = JsonNodeElements.createValueElement(node, context.searchMatches);
    contentContainer.appendChild(valueElement);

    // Type badge
    if (context.showTypes) {
      const typeBadge = JsonNodeElements.createTypeBadge(node);
      contentContainer.appendChild(typeBadge);
    }

    // Actions menu
    const actionsElement = JsonNodeElements.createActionsElement();
    this.attachActionsHandlers(actionsElement, node);
    contentContainer.appendChild(actionsElement);

    element.appendChild(contentContainer);

    // Add event listeners
    this.attachEventListeners(element, node);

    return element;
  }

  private getNodeClasses(node: JsonNode, context: JsonNodeRenderContext): string {
    const classes = [VIEWER_CLASSES.node, `json-node--${node.type}`];

    if (context.isSelected) {
      classes.push('json-node--selected');
    }

    if (node.hasChildren) {
      classes.push(node.isExpanded ? VIEWER_CLASSES.nodeExpanded : VIEWER_CLASSES.nodeCollapsed);
    }

    if (context.searchMatches.length > 0) {
      classes.push('json-node--has-matches');
    }

    return classes.join(' ');
  }

  private attachActionsHandlers(actionsElement: HTMLElement, node: JsonNode): void {
    const trigger = actionsElement.querySelector('.json-node-actions-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.actionMenu.toggle(
          node.id,
          actionsElement,
          node,
          (nodeId, actionId, data) => this.handleActionClick(nodeId, actionId, data)
        );
      });
    }
  }

  private handleActionClick(nodeId: string, actionId: string, data?: any): void {
    this.options.onAction?.(nodeId, actionId, data);
  }

  private attachEventListeners(element: HTMLElement, node: JsonNode): void {
    // Toggle expansion on expand icon or bracket click
    const expandIcon = element.querySelector('.json-node-expand');
    if (expandIcon && node.hasChildren) {
      expandIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.options.onToggle?.(node.id);
      });
    }

    // Node selection on click
    element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.json-node-actions')) {
        return; // Don't select when clicking actions
      }
      this.options.onSelect?.(node.id);
    });

    // Show actions on hover
    element.addEventListener('mouseenter', () => {
      const actions = element.querySelector('.json-node-actions') as HTMLElement;
      if (actions) {
        actions.style.opacity = '1';
      }
    });

    element.addEventListener('mouseleave', () => {
      const actions = element.querySelector('.json-node-actions') as HTMLElement;
      if (actions && !this.actionMenu.hasMenu(node.id)) {
        actions.style.opacity = '0';
      }
    });

    // Context menu
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const actions = element.querySelector('.json-node-actions') as HTMLElement;
      if (actions) {
        this.actionMenu.toggle(
          node.id,
          actions,
          node,
          (nodeId, actionId, data) => this.handleActionClick(nodeId, actionId, data)
        );
      }
    });
  }

  public destroy(): void {
    this.actionMenu.closeAll();
    this.nodeCache.clear();
  }
}