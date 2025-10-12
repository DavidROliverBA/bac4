/**
 * Auto-Naming Utilities
 *
 * Generates automatic names for nodes based on their type and existing nodes.
 * Implements sequential numbering (e.g., "System 1", "System 2", etc.).
 *
 * @module auto-naming
 */

import type { Node } from 'reactflow';
import type { CanvasNodeData } from '../../../types/canvas-types';

/**
 * Generate automatic name for a node based on its type
 *
 * Counts existing nodes of the same type and assigns the next sequential number.
 *
 * @param nodeType - The type of node (system, container, person, c4, cloudComponent)
 * @param existingNodes - Array of all existing nodes on the canvas
 * @returns Auto-generated name with sequential number
 *
 * @example
 * ```ts
 * const name = getAutoName('system', nodes);
 * // Returns "System 1" if no system nodes exist
 * // Returns "System 3" if 2 system nodes already exist
 * ```
 */
export function getAutoName(
  nodeType: string,
  existingNodes: Node<CanvasNodeData>[]
): string {
  // Count existing nodes of the same type
  const sameTypeNodes = existingNodes.filter((n) => n.type === nodeType);
  const nextNumber = sameTypeNodes.length + 1;

  switch (nodeType) {
    case 'system':
      return `System ${nextNumber}`;
    case 'container':
      return `Container ${nextNumber}`;
    case 'person':
      return `Person ${nextNumber}`;
    case 'c4':
      return `Component ${nextNumber}`;
    case 'cloudComponent':
      return `Cloud Component ${nextNumber}`;
    default:
      return `Node ${nextNumber}`;
  }
}

/**
 * Initialize node counter from existing nodes
 *
 * Finds the highest node number from existing node IDs (node-1, node-2, etc.)
 * to ensure new nodes don't conflict with existing IDs.
 *
 * @param nodes - Array of existing nodes
 * @returns Maximum node number found in existing IDs
 *
 * @example
 * ```ts
 * const maxNum = initializeNodeCounter([
 *   { id: 'node-1', ... },
 *   { id: 'node-5', ... },
 *   { id: 'node-3', ... }
 * ]);
 * // Returns 5
 * ```
 */
export function initializeNodeCounter(nodes: Node<CanvasNodeData>[]): number {
  const maxNodeNum = nodes.reduce((max: number, node: Node<CanvasNodeData>) => {
    const match = node.id.match(/node-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);

  return maxNodeNum;
}
