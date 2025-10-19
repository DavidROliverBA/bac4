/**
 * Auto-Naming Utilities
 *
 * Generates automatic names for nodes based on their type and existing nodes.
 * Implements sequential numbering (e.g., "System 1", "System 2", etc.).
 * v1.0.1: Uses NodeRegistryService to ensure unique names across all diagrams.
 *
 * @module auto-naming
 */

import type { Node } from 'reactflow';
import type { CanvasNodeData } from '../../../types/canvas-types';
import { NodeRegistryService } from '../../../services/node-registry-service';

// <AI_MODIFIABLE>
/**
 * Generate automatic name for a node based on its type
 *
 * Counts existing nodes of the same type and assigns the next sequential number.
 * v1.0.1: Checks NodeRegistryService to ensure unique names across ALL diagrams.
 * Add new node types here to support auto-naming.
 *
 * @param nodeType - The type of node (system, container, person, c4, cloudComponent)
 * @param existingNodes - Array of all existing nodes on the canvas
 * @returns Auto-generated name with sequential number, guaranteed unique across vault
 *
 * @example
 * ```ts
 * const name = getAutoName('system', nodes);
 * // Returns "System 1" if no system nodes exist anywhere
 * // Returns "System 3" if 2 system nodes already exist (in any diagram)
 * ```
 */
export function getAutoName(nodeType: string, existingNodes: Node<CanvasNodeData>[]): string {
  const registry = NodeRegistryService.getInstance();

  // Count existing nodes of the same type on current canvas
  const sameTypeNodes = existingNodes.filter((n) => n.type === nodeType);
  const nextNumber = sameTypeNodes.length + 1;

  // Generate base name by type
  let baseName: string;
  switch (nodeType) {
    case 'system':
      baseName = 'System';
      break;
    case 'container':
      baseName = 'Container';
      break;
    case 'person':
      baseName = 'Person';
      break;
    case 'c4':
      baseName = 'Component';
      break;
    case 'cloudComponent':
      baseName = 'Cloud Component';
      break;
    case 'capability':
      baseName = 'Capability';
      break;
    // Add new node types here:
    // case 'yourNodeType':
    //   baseName = 'Your Node';
    //   break;
    default:
      baseName = 'Node';
      break;
  }

  // Generate candidate name
  const candidateName = `${baseName} ${nextNumber}`;

  // If registry is initialized, ensure globally unique name
  if (registry.isInitialized()) {
    return registry.generateUniqueName(candidateName);
  }

  // Fallback to local numbering if registry not initialized
  return candidateName;
}
// </AI_MODIFIABLE>

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
