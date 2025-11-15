/**
 * JSON formatting and display utilities
 */

import { JsonNode, JsonValueType } from '../types';

export class JsonFormatUtils {
  /**
   * Escape HTML entities
   */
  public static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format value for display
   */
  public static formatDisplayValue(value: any, type: JsonValueType): string {
    switch (type) {
      case 'string':
        return `"${this.escapeHtml(value)}"`;
      case 'number':
      case 'boolean':
        return String(value);
      case 'null':
        return 'null';
      case 'object':
        return '{}';
      case 'array':
        return '[]';
      default:
        return String(value);
    }
  }

  /**
   * Copy text to clipboard
   */
  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      } catch {
        return false;
      }
    }
  }

  /**
   * Generate JSONPath for a node
   */
  public static getJsonPath(node: JsonNode): string {
    if (node.path.length === 0) return '$';

    const pathParts = node.path.slice(1);
    let jsonPath = '$';

    pathParts.forEach((part) => {
      if (/^\d+$/.test(part)) {
        jsonPath += `[${part}]`;
      } else {
        jsonPath += `.${part}`;
      }
    });

    return jsonPath;
  }
}
