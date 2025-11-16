/**
 * Action menu management for JSON nodes
 */

import { JsonNode } from './types';
import { JsonNodeStyles } from './JsonNodeStyles';

export class JsonNodeActionMenu {
  private actionMenus = new Map<string, HTMLElement>();

  /**
   * Toggle action menu for a node
   */
  public toggle(
    nodeId: string,
    container: HTMLElement,
    node: JsonNode | null,
    onAction: (nodeId: string, actionId: string, data?: any) => void
  ): void {
    // Close other menus
    this.closeAll();

    const existingMenu = this.actionMenus.get(nodeId);
    if (existingMenu) {
      this.close(nodeId);
      return;
    }

    const menu = this.createMenu(nodeId, node, onAction);
    container.appendChild(menu);
    this.actionMenus.set(nodeId, menu);

    // Position menu
    this.positionMenu(menu, container);
  }

  /**
   * Create action menu
   */
  private createMenu(
    nodeId: string,
    node: JsonNode | null,
    onAction: (nodeId: string, actionId: string, data?: any) => void
  ): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'json-node-actions-menu';
    menu.style.cssText = JsonNodeStyles.actionMenu;

    const actions = this.getAvailableActions(node);
    actions.forEach(action => {
      const item = document.createElement('button');
      item.className = 'json-node-actions-item';
      item.textContent = action.label;
      item.style.cssText = JsonNodeStyles.actionItem;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        onAction(nodeId, action.id, action.data);
        this.close(nodeId);
      });

      item.addEventListener('mouseenter', () => {
        item.style.background = 'var(--bg-secondary, #f5f5f5)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.background = 'none';
      });

      menu.appendChild(item);
    });

    return menu;
  }

  /**
   * Get available actions for a node
   */
  private getAvailableActions(node: JsonNode | null): Array<{ id: string; label: string; data?: any }> {
    if (!node) return [];

    const actions = [
      { id: 'copy-value', label: 'Copy Value' },
      { id: 'copy-path', label: 'Copy Path' },
      { id: 'copy-jsonpath', label: 'Copy JSONPath' },
    ];

    if (node.key && node.level > 0) {
      actions.unshift({ id: 'copy-key', label: 'Copy Key' });
    }

    if (node.hasChildren) {
      actions.push(
        { id: 'expand-all', label: 'Expand All Children' },
        { id: 'collapse-all', label: 'Collapse All Children' }
      );
    }

    return actions;
  }

  /**
   * Position action menu to avoid going off screen
   */
  private positionMenu(menu: HTMLElement, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if menu would go off screen
    if (rect.right + menuRect.width > viewportWidth) {
      menu.style.right = '0';
      menu.style.left = 'auto';
    }

    // Adjust vertical position if menu would go off screen
    if (rect.bottom + menuRect.height > viewportHeight) {
      menu.style.top = 'auto';
      menu.style.bottom = '100%';
    }
  }

  /**
   * Close a specific action menu
   */
  public close(nodeId: string): void {
    const menu = this.actionMenus.get(nodeId);
    if (menu) {
      menu.remove();
      this.actionMenus.delete(nodeId);
    }
  }

  /**
   * Close all action menus
   */
  public closeAll(): void {
    this.actionMenus.forEach((menu) => {
      menu.remove();
    });
    this.actionMenus.clear();
  }

  /**
   * Check if a menu is open for a node
   */
  public hasMenu(nodeId: string): boolean {
    return this.actionMenus.has(nodeId);
  }
}
