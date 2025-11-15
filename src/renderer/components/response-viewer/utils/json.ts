/**
 * JSON utilities with safety guards and worker support
 * Handles parsing, formatting, validation, and tree building
 */

import {
  JsonNode,
  JsonValueType,
  JsonParseResult,
  FormatResult,
  SearchMatch,
  VIEWER_CONSTANTS,
} from '../types';
import { JsonWorkerManager } from './JsonWorkerManager';
import { JsonTreeBuilder } from './JsonTreeBuilder';
import { JsonFormatUtils } from './JsonFormatUtils';

/**
 * Main JSON utilities class
 */
export class JsonUtils {
  private static workerManager: JsonWorkerManager | null = null;

  /**
   * Get or create worker manager
   */
  private static getWorker(): JsonWorkerManager {
    if (!this.workerManager) {
      this.workerManager = new JsonWorkerManager();
    }
    return this.workerManager;
  }

  /**
   * Safe JSON parsing with size checks
   */
  public static async parseJson(text: string): Promise<JsonParseResult> {
    if (!text || typeof text !== 'string') {
      return {
        success: false,
        error: 'Invalid input: text must be a non-empty string',
      };
    }

    const byteSize = new Blob([text]).size;
    if (byteSize > VIEWER_CONSTANTS.MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large: ${Math.round(byteSize / 1024 / 1024)}MB exceeds ${Math.round(VIEWER_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024)}MB limit`,
      };
    }

    const isLargeFile = byteSize > VIEWER_CONSTANTS.LARGE_FILE_THRESHOLD;

    if (isLargeFile) {
      // Use worker for large files
      try {
        const result = await this.getWorker().parseJson(text);
        return { ...result, isLargeFile: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Parse failed',
        };
      }
    } else {
      // Use main thread for small files
      return this.parseJsonSync(text);
    }
  }

  /**
   * Synchronous JSON parsing (for main thread fallback)
   */
  public static parseJsonSync(text: string): JsonParseResult {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed',
      };
    }
  }

  /**
   * Format JSON with proper indentation
   */
  public static async formatJson(
    data: any,
    indent = 2
  ): Promise<FormatResult> {
    try {
      const result = await this.getWorker().formatJson(data, indent);
      return result;
    } catch (error) {
      return this.formatJsonSync(data, indent);
    }
  }

  /**
   * Synchronous JSON formatting
   */
  public static formatJsonSync(data: any, indent = 2): FormatResult {
    try {
      const formatted = JSON.stringify(data, null, indent);
      return { success: true, formatted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Format failed',
      };
    }
  }

  /**
   * Minify JSON
   */
  public static async minifyJson(data: any): Promise<FormatResult> {
    try {
      const result = await this.getWorker().minifyJson(data);
      return result;
    } catch (error) {
      return this.minifyJsonSync(data);
    }
  }

  /**
   * Synchronous JSON minification
   */
  public static minifyJsonSync(data: any): FormatResult {
    try {
      const formatted = JSON.stringify(data);
      return { success: true, formatted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Minify failed',
      };
    }
  }

  /**
   * Validate JSON text
   */
  public static async validateJson(
    text: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const result = await this.getWorker().validateJson(text);
      return result;
    } catch (error) {
      return this.validateJsonSync(text);
    }
  }

  /**
   * Synchronous JSON validation
   */
  public static validateJsonSync(
    text: string
  ): { valid: boolean; error?: string } {
    try {
      JSON.parse(text);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  }

  /**
   * Get JSON value type
   */
  public static getValueType(value: any): JsonValueType {
    return JsonTreeBuilder.getValueType(value);
  }

  /**
   * Build JSON tree from parsed data
   */
  public static buildJsonTree(
    data: any,
    maxNodes = VIEWER_CONSTANTS.VIRTUALIZATION_THRESHOLD
  ): JsonNode[] {
    return JsonTreeBuilder.buildJsonTree(data, maxNodes);
  }

  /**
   * Get visible nodes from tree based on expansion state
   */
  public static getVisibleNodes(
    nodes: JsonNode[],
    expandedNodes: Set<string>
  ): JsonNode[] {
    return JsonTreeBuilder.getVisibleNodes(nodes, expandedNodes);
  }

  /**
   * Search within JSON data
   */
  public static searchInNodes(
    nodes: JsonNode[],
    query: string,
    expandedNodes: Set<string>
  ): SearchMatch[] {
    return JsonTreeBuilder.searchInNodes(nodes, query, expandedNodes);
  }

  /**
   * Escape HTML entities
   */
  public static escapeHtml(text: string): string {
    return JsonFormatUtils.escapeHtml(text);
  }

  /**
   * Format value for display
   */
  public static formatDisplayValue(value: any, type: JsonValueType): string {
    return JsonFormatUtils.formatDisplayValue(value, type);
  }

  /**
   * Copy text to clipboard
   */
  public static async copyToClipboard(text: string): Promise<boolean> {
    return JsonFormatUtils.copyToClipboard(text);
  }

  /**
   * Generate JSONPath for a node
   */
  public static getJsonPath(node: JsonNode): string {
    return JsonFormatUtils.getJsonPath(node);
  }

  /**
   * Cleanup worker resources
   */
  public static cleanup(): void {
    if (this.workerManager) {
      this.workerManager.terminate();
      this.workerManager = null;
    }
  }
}
