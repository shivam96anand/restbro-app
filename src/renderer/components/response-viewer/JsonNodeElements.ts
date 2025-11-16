/**
 * Element creation utilities for JSON node rendering
 */

import { JsonNode, SearchMatch, VIEWER_CLASSES } from './types';
import { JsonUtils } from './utils/json';
import { JsonNodeStyles } from './JsonNodeStyles';

export class JsonNodeElements {
  /**
   * Create expand/collapse icon
   */
  static createExpandIcon(node: JsonNode): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'json-node-expand';

    if (node.hasChildren) {
      icon.textContent = node.isExpanded ? '▼' : '▶';
      icon.style.cursor = 'pointer';
      icon.style.userSelect = 'none';
      icon.style.minWidth = '12px';
      icon.style.display = 'inline-block';
      icon.style.color = 'var(--text-secondary, #666)';
    } else {
      icon.style.minWidth = '12px';
      icon.style.display = 'inline-block';
    }

    return icon;
  }

  /**
   * Check if key should be shown for this node
   */
  static shouldShowKey(node: JsonNode): boolean {
    // Don't show key for root node or array items that are just indices
    if (node.level === 0) return false;
    if (node.parent?.type === 'array' && /^\[\d+\]$/.test(node.key)) return false;
    return node.key.length > 0;
  }

  /**
   * Create key element with search highlighting
   */
  static createKeyElement(node: JsonNode, matches: SearchMatch[]): HTMLElement {
    const keyElement = document.createElement('span');
    keyElement.className = VIEWER_CLASSES.nodeKey;

    const displayKey = node.parent?.type === 'array' ? node.key : `"${node.key}"`;
    const keyMatches = matches.filter(m => m.isKey);
    const highlightedKey = this.highlightSearchMatches(displayKey, keyMatches);

    keyElement.innerHTML = highlightedKey;
    keyElement.style.color = 'var(--json-key-color, #0451a5)';
    keyElement.style.fontWeight = '600';

    return keyElement;
  }

  /**
   * Create value element with search highlighting
   */
  static createValueElement(node: JsonNode, matches: SearchMatch[]): HTMLElement {
    const valueElement = document.createElement('span');
    valueElement.className = VIEWER_CLASSES.nodeValue;

    let displayValue: string;

    if (node.type === 'object' || node.type === 'array') {
      const bracket = node.type === 'array' ? '[' : '{';
      const closeBracket = node.type === 'array' ? ']' : '}';

      if (node.isExpanded) {
        // For empty arrays/objects, show both brackets on same line
        if (node.childCount === 0) {
          displayValue = `${bracket}${closeBracket}`;
        } else {
          displayValue = bracket;
        }
      } else {
        const preview = node.childCount > 0 ? ` ${node.childCount} ${node.childCount === 1 ? 'item' : 'items'} ` : ' ';
        displayValue = `${bracket}${preview}${closeBracket}`;
      }
    } else {
      displayValue = JsonUtils.formatDisplayValue(node.value, node.type);
    }

    // Apply search highlighting for value matches
    const valueMatches = matches.filter(m => !m.isKey);
    const highlightedValue = this.highlightSearchMatches(displayValue, valueMatches);

    valueElement.innerHTML = highlightedValue;
    valueElement.style.color = JsonNodeStyles.getValueColor(node.type);

    return valueElement;
  }

  /**
   * Create type badge
   */
  static createTypeBadge(node: JsonNode): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'json-node-type';
    badge.textContent = node.type;
    badge.style.cssText = JsonNodeStyles.getTypeBadgeStyle(node.type);

    return badge;
  }

  /**
   * Create actions trigger button
   */
  static createActionsElement(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'json-node-actions';
    actions.style.cssText = JsonNodeStyles.actionContainer;

    const trigger = document.createElement('button');
    trigger.className = 'json-node-actions-trigger';
    trigger.textContent = '•••';
    trigger.style.cssText = JsonNodeStyles.actionTrigger;

    actions.appendChild(trigger);
    return actions;
  }

  /**
   * Highlight search matches in text
   */
  private static highlightSearchMatches(text: string, matches: SearchMatch[]): string {
    if (matches.length === 0) return JsonUtils.escapeHtml(text);

    let result = '';
    let lastIndex = 0;

    // Sort matches by start index
    const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

    sortedMatches.forEach((match, index) => {
      // Add text before the match
      result += JsonUtils.escapeHtml(text.substring(lastIndex, match.startIndex));

      // Add highlighted match
      const matchText = text.substring(match.startIndex, match.endIndex);
      const isActive = index === 0; // For simplicity, highlight first match as active
      const className = isActive ?
        `${VIEWER_CLASSES.searchHighlight} ${VIEWER_CLASSES.searchActive}` :
        VIEWER_CLASSES.searchHighlight;

      result += `<span class="${className}">${JsonUtils.escapeHtml(matchText)}</span>`;

      lastIndex = match.endIndex;
    });

    // Add remaining text
    result += JsonUtils.escapeHtml(text.substring(lastIndex));

    return result;
  }
}
