/**
 * Canvas Helper Utilities
 *
 * General-purpose utility functions for canvas operations including
 * node type validation, diagram type compatibility, and edge normalization.
 *
 * @module canvas-utils
 */

import type { Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { EdgeData } from '../../../types/canvas-types';

// <AI_MODIFIABLE>
/**
 * Check if a node type can drill down from a given diagram type
 *
 * Rules:
 * - System nodes can drill down in Context diagrams → Container diagrams
 * - Container nodes can drill down in Container diagrams → Component diagrams
 *
 * Add new node types and their drill-down rules here.
 *
 * @param nodeType - The node type (system, container, person, etc.)
 * @param diagramType - The current diagram type (context, container, component)
 * @returns true if drill-down is allowed
 *
 * @example
 * ```ts
 * canDrillDown('system', 'context') // true
 * canDrillDown('container', 'container') // true
 * canDrillDown('person', 'context') // false
 * ```
 */
export function canDrillDown(
  nodeType: string,
  diagramType: 'context' | 'container' | 'component'
): boolean {
  return (
    (nodeType === 'system' && diagramType === 'context') ||
    (nodeType === 'container' && diagramType === 'container')
    // Add new drill-down rules here:
    // || (nodeType === 'yourType' && diagramType === 'yourDiagramType')
  );
}
// </AI_MODIFIABLE>

// <AI_MODIFIABLE>
/**
 * Determine child diagram type for a given node type
 *
 * Add new parent → child diagram type mappings here.
 *
 * @param nodeType - The parent node type
 * @returns The child diagram type, or null if no child type exists
 *
 * @example
 * ```ts
 * getChildDiagramType('system') // 'container'
 * getChildDiagramType('container') // 'component'
 * getChildDiagramType('person') // null
 * ```
 */
export function getChildDiagramType(nodeType: string): 'container' | 'component' | null {
  if (nodeType === 'system') {
    return 'container';
  }
  if (nodeType === 'container') {
    return 'component';
  }
  // Add new parent → child mappings here:
  // if (nodeType === 'yourNodeType') {
  //   return 'yourChildDiagramType';
  // }
  return null;
}
// </AI_MODIFIABLE>

/**
 * Get marker configuration based on direction
 *
 * @param direction - Edge direction ('right', 'left', 'both')
 * @returns Object with markerEnd and markerStart properties
 */
export function getEdgeMarkers(direction: 'right' | 'left' | 'both') {
  const arrow = {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#888888',
  };

  switch (direction) {
    case 'right':
      return { markerEnd: arrow, markerStart: undefined };
    case 'left':
      return { markerEnd: undefined, markerStart: arrow };
    case 'both':
      return { markerEnd: arrow, markerStart: arrow };
    default:
      return { markerEnd: arrow, markerStart: undefined };
  }
}

/**
 * Normalize edges to ensure they have proper type and data
 *
 * Ensures all edges have:
 * - type: 'directional'
 * - data.label: defaults to 'uses'
 * - data.direction: defaults to 'right'
 * - markerEnd/markerStart: based on direction
 *
 * @param edges - Array of edges to normalize
 * @returns Normalized edges with complete data and markers
 *
 * @example
 * ```ts
 * const normalized = normalizeEdges([
 *   { id: 'e1', source: 'n1', target: 'n2' },
 *   { id: 'e2', source: 'n2', target: 'n3', label: 'calls' }
 * ]);
 * // All edges now have type: 'directional', data.label, data.direction, and markers
 * ```
 */
export function normalizeEdges(edges: Edge[]): Edge<EdgeData>[] {
  return edges.map((edge) => {
    const direction = (edge.data?.direction || 'right') as 'right' | 'left' | 'both';
    const markers = getEdgeMarkers(direction);

    console.log(
      'BAC4: Normalizing edge',
      edge.id,
      '- direction:',
      direction,
      '- markers:',
      markers
    );

    return {
      ...edge,
      type: edge.type || 'directional',
      ...markers,
      data: {
        label: edge.data?.label || (edge as any).label || 'uses',
        direction,
        ...edge.data,
      },
    };
  });
}

/**
 * Extract diagram name from file path
 *
 * Removes directory path and .bac4 extension from file path.
 *
 * @param filePath - Full file path
 * @returns Diagram name without path or extension
 *
 * @example
 * ```ts
 * getDiagramName('diagrams/my-system.bac4') // 'my-system'
 * getDiagramName('/path/to/Context.bac4') // 'Context'
 * ```
 */
export function getDiagramName(filePath: string): string {
  return filePath.split('/').pop()?.replace('.bac4', '') || 'diagram';
}

// <AI_MODIFIABLE>
/**
 * Check if a node should auto-create a child diagram
 *
 * Auto-creation happens for:
 * - System nodes in Context diagrams
 * - Container nodes in Container diagrams
 *
 * Add new auto-creation rules here for custom node types.
 *
 * @param nodeType - The node type
 * @param diagramType - The current diagram type
 * @returns true if child diagram should be auto-created
 */
export function shouldAutoCreateChild(
  nodeType: string,
  diagramType: 'context' | 'container' | 'component'
): boolean {
  return (
    (nodeType === 'system' && diagramType === 'context') ||
    (nodeType === 'container' && diagramType === 'container')
    // Add new auto-creation rules here:
    // || (nodeType === 'yourNodeType' && diagramType === 'yourDiagramType')
  );
}
// </AI_MODIFIABLE>

/**
 * Get display label for child diagram type
 *
 * @param nodeType - The parent node type
 * @returns Human-readable child diagram type label
 *
 * @example
 * ```ts
 * getChildTypeLabel('system') // 'Container'
 * getChildTypeLabel('container') // 'Component'
 * ```
 */
export function getChildTypeLabel(nodeType: string): string {
  return nodeType === 'system' ? 'Container' : 'Component';
}
