/**
 * JSON tree building and search utilities
 */

import {
  JsonNode,
  JsonValueType,
  SearchMatch,
  VIEWER_CONSTANTS,
} from '../types';

export class JsonTreeBuilder {
  /**
   * Get JSON value type
   */
  public static getValueType(value: any): JsonValueType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }

  /**
   * Build JSON tree from parsed data
   */
  public static buildJsonTree(
    data: any,
    maxNodes = VIEWER_CONSTANTS.VIRTUALIZATION_THRESHOLD
  ): JsonNode[] {
    const nodes: JsonNode[] = [];
    let nodeCount = 0;

    const createNode = (
      key: string,
      value: any,
      level: number,
      path: string[],
      parent?: JsonNode
    ): JsonNode | null => {
      if (nodeCount >= maxNodes) {
        return null;
      }

      const type = this.getValueType(value);
      const id = path.join('.');
      const hasChildren =
        (type === 'object' || type === 'array') &&
        value !== null &&
        Object.keys(value).length > 0;

      const childCount = hasChildren ? Object.keys(value).length : 0;

      const node: JsonNode = {
        id,
        key,
        value,
        type,
        level,
        path: [...path],
        isExpanded: level < 2,
        parent,
        hasChildren,
        childCount,
      };

      nodeCount++;

      if (hasChildren && nodeCount < maxNodes) {
        node.children = [];

        if (type === 'object') {
          Object.keys(value).forEach((childKey) => {
            const childPath = [...path, childKey];
            const childNode = createNode(
              childKey,
              value[childKey],
              level + 1,
              childPath,
              node
            );
            if (childNode) {
              node.children!.push(childNode);
            }
          });
        } else if (type === 'array') {
          value.forEach((item: any, index: number) => {
            const childPath = [...path, index.toString()];
            const childNode = createNode(
              `[${index}]`,
              item,
              level + 1,
              childPath,
              node
            );
            if (childNode) {
              node.children!.push(childNode);
            }
          });
        }
      }

      return node;
    };

    const rootType = this.getValueType(data);
    if (rootType === 'object' || rootType === 'array') {
      const rootNode = createNode('root', data, 0, ['root']);
      if (rootNode) {
        nodes.push(rootNode);
      }
    } else {
      const rootNode = createNode('', data, 0, ['']);
      if (rootNode) {
        nodes.push(rootNode);
      }
    }

    return nodes;
  }

  /**
   * Get visible nodes from tree based on expansion state
   */
  public static getVisibleNodes(
    nodes: JsonNode[],
    expandedNodes: Set<string>
  ): JsonNode[] {
    const visible: JsonNode[] = [];

    const traverse = (node: JsonNode) => {
      visible.push(node);

      if (node.children && expandedNodes.has(node.id)) {
        node.children.forEach((child) => traverse(child));
      }
    };

    nodes.forEach((node) => traverse(node));
    return visible;
  }

  /**
   * Search within JSON data
   */
  public static searchInNodes(
    nodes: JsonNode[],
    query: string,
    expandedNodes: Set<string>
  ): SearchMatch[] {
    if (!query.trim()) return [];

    const matches: SearchMatch[] = [];
    const queryLower = query.toLowerCase();
    const visibleNodes = this.getVisibleNodes(nodes, expandedNodes);

    visibleNodes.forEach((node) => {
      // Search in key
      if (node.key && node.key.toLowerCase().includes(queryLower)) {
        const startIndex = node.key.toLowerCase().indexOf(queryLower);
        matches.push({
          nodeId: node.id,
          path: node.path,
          key: node.key,
          startIndex,
          endIndex: startIndex + query.length,
          isKey: true,
          jsonPath: '$.' + node.path.join('.'),
        });
      }

      // Search in value (for primitive types)
      if (node.type !== 'object' && node.type !== 'array') {
        const valueStr = String(node.value);
        if (valueStr.toLowerCase().includes(queryLower)) {
          const startIndex = valueStr.toLowerCase().indexOf(queryLower);
          matches.push({
            nodeId: node.id,
            path: node.path,
            value: valueStr,
            startIndex,
            endIndex: startIndex + query.length,
            isKey: false,
            jsonPath: '$.' + node.path.join('.'),
          });
        }
      }
    });

    return matches;
  }
}
