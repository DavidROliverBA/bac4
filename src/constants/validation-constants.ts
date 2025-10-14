/**
 * Validation Constants for BAC4 Plugin
 *
 * Limits, constraints, and validation rules for the application.
 */

/**
 * Maximum length for diagram names
 *
 * @default 100 characters
 */
export const MAX_DIAGRAM_NAME_LENGTH = 100;

/**
 * Maximum length for node labels
 *
 * @default 50 characters
 */
export const MAX_NODE_LABEL_LENGTH = 50;

/**
 * Maximum length for edge labels
 *
 * @default 30 characters
 */
export const MAX_EDGE_LABEL_LENGTH = 30;

/**
 * Maximum length for descriptions
 *
 * @default 500 characters
 */
export const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Maximum number of nodes per diagram
 *
 * Soft limit for performance warnings.
 *
 * @default 100 nodes
 */
export const MAX_NODES_WARNING = 100;

/**
 * Maximum number of edges per diagram
 *
 * Soft limit for performance warnings.
 *
 * @default 150 edges
 */
export const MAX_EDGES_WARNING = 150;

/**
 * Minimum zoom level
 *
 * @default 0.1 (10%)
 */
export const MIN_ZOOM = 0.1;

/**
 * Maximum zoom level
 *
 * @default 4 (400%)
 */
export const MAX_ZOOM = 4;

/**
 * Default zoom level
 *
 * @default 1 (100%)
 */
export const DEFAULT_ZOOM = 1;

/**
 * Fit view padding
 *
 * Padding around diagram when using fit-to-view.
 *
 * @default 0.2 (20%)
 */
export const FIT_VIEW_PADDING = 0.2;

/**
 * Fit view max zoom
 *
 * Maximum zoom when auto-fitting view.
 *
 * @default 1.5 (150%)
 */
export const FIT_VIEW_MAX_ZOOM = 1.5;

// <AI_MODIFIABLE>
/**
 * Valid diagram types
 * Add new diagram types here to extend the C4 hierarchy.
 * The type union is auto-generated from this array.
 */
export const DIAGRAM_TYPES = ['context', 'container', 'component'] as const;

/**
 * Diagram type union (auto-generated)
 */
export type DiagramType = (typeof DIAGRAM_TYPES)[number];
// </AI_MODIFIABLE>

// <AI_MODIFIABLE>
/**
 * Valid node types
 * Add new node types here. The type union is auto-generated from this array.
 */
export const NODE_TYPES = ['c4', 'cloudComponent', 'system', 'person', 'container'] as const;

/**
 * Node type union (auto-generated)
 */
export type NodeType = (typeof NODE_TYPES)[number];
// </AI_MODIFIABLE>

/**
 * Valid edge directions
 */
export const EDGE_DIRECTIONS = ['right', 'left', 'both'] as const;

/**
 * Edge direction union
 */
export type EdgeDirection = (typeof EDGE_DIRECTIONS)[number];

// <AI_MODIFIABLE>
/**
 * Common relationship labels
 * Add new edge label presets here for quick selection in PropertyPanel
 */
export const COMMON_RELATIONSHIPS = [
  'uses',
  'depends on',
  'calls',
  'reads',
  'writes',
  'sends to',
  'contains',
] as const;
// </AI_MODIFIABLE>

// <AI_MODIFIABLE>
/**
 * Container types - REMOVED in Schema v0.4.0
 * Container nodes now use flexible icon field instead of fixed enum
 * See: ContainerNode.tsx and IconSelector.tsx
 */
// </AI_MODIFIABLE>

/**
 * Check if a value is a valid diagram type
 *
 * @param value - Value to check
 * @returns True if valid diagram type
 */
export function isValidDiagramType(value: string): value is DiagramType {
  return DIAGRAM_TYPES.includes(value as DiagramType);
}

/**
 * Check if a value is a valid node type
 *
 * @param value - Value to check
 * @returns True if valid node type
 */
export function isValidNodeType(value: string): value is NodeType {
  return NODE_TYPES.includes(value as NodeType);
}

/**
 * Check if a value is a valid edge direction
 *
 * @param value - Value to check
 * @returns True if valid edge direction
 */
export function isValidEdgeDirection(value: string): value is EdgeDirection {
  return EDGE_DIRECTIONS.includes(value as EdgeDirection);
}
