/**
 * Layer Validation Utilities
 *
 * Ensures nodes are created in the correct diagram layers.
 * v2.0.0: Validates 7-layer enterprise architecture model
 *
 * @module layer-validation
 */

import type { DiagramType } from '../types/canvas-types';

/**
 * Node types allowed in each diagram layer
 */
export const LAYER_NODE_TYPES: Record<DiagramType, string[]> = {
  // Layer 1: Market segments and customer needs
  market: ['market'],

  // Layer 2: Business units, departments, teams
  organisation: ['organisation'],

  // Layer 3: Business capabilities and functions
  capability: ['capability'],

  // Layer 4: C4 Level 1 - System landscape
  context: ['system', 'person'],

  // Layer 5: C4 Level 2 - Technical containers
  container: ['container'],

  // Layer 6: C4 Level 3 - Internal components
  component: ['c4', 'cloudComponent'],

  // Layer 7: Implementation code and data
  code: ['code'],

  // Meta-diagram: Visualization of diagram relationships
  graph: ['graph'],

  // Wardley Mapping: Strategic positioning
  wardley: ['wardley-component', 'wardley-inertia'],
};

/**
 * Get human-readable layer name
 */
export function getLayerName(diagramType: DiagramType): string {
  const layerNames: Record<DiagramType, string> = {
    market: 'Layer 1: Market',
    organisation: 'Layer 2: Organisation',
    capability: 'Layer 3: Capability',
    context: 'Layer 4: Context',
    container: 'Layer 5: Container',
    component: 'Layer 6: Component',
    code: 'Layer 7: Code',
    graph: 'Meta: Graph View',
    wardley: 'Wardley Map',
  };

  return layerNames[diagramType] || diagramType;
}

/**
 * Get human-readable node type name
 */
export function getNodeTypeName(nodeType: string): string {
  const nodeNames: Record<string, string> = {
    market: 'Market Segment',
    organisation: 'Organisation Unit',
    capability: 'Capability',
    system: 'System',
    person: 'Person',
    container: 'Container',
    c4: 'Component',
    cloudComponent: 'Cloud Component',
    code: 'Code Artifact',
    graph: 'Diagram Node',
  };

  return nodeNames[nodeType] || nodeType;
}

/**
 * Check if a node type is valid for a diagram layer
 *
 * @param nodeType - Type of node being added
 * @param diagramType - Current diagram layer
 * @returns true if valid, false if invalid
 */
export function isValidNodeType(nodeType: string, diagramType: DiagramType): boolean {
  const allowedTypes = LAYER_NODE_TYPES[diagramType];
  return allowedTypes ? allowedTypes.includes(nodeType) : false;
}

/**
 * Get validation error message for invalid node type
 *
 * @param nodeType - Type of node being added
 * @param diagramType - Current diagram layer
 * @returns Error message string
 */
export function getValidationError(nodeType: string, diagramType: DiagramType): string {
  const layerName = getLayerName(diagramType);
  const nodeName = getNodeTypeName(nodeType);
  const allowedTypes = LAYER_NODE_TYPES[diagramType];
  const allowedNames = allowedTypes?.map(getNodeTypeName).join(', ') || 'none';

  return `Cannot add ${nodeName} to ${layerName}.\n\nAllowed node types: ${allowedNames}\n\nTip: Use the layer selector to switch to the appropriate diagram type.`;
}

/**
 * Validate all nodes in a diagram
 *
 * @param nodes - Array of nodes to validate
 * @param diagramType - Diagram type
 * @returns Array of validation errors (empty if all valid)
 */
export function validateDiagramNodes(
  nodes: Array<{ id: string; type?: string }>,
  diagramType: DiagramType
): Array<{ nodeId: string; nodeType: string; error: string }> {
  const errors: Array<{ nodeId: string; nodeType: string; error: string }> = [];

  for (const node of nodes) {
    if (node.type && !isValidNodeType(node.type, diagramType)) {
      errors.push({
        nodeId: node.id,
        nodeType: node.type,
        error: getValidationError(node.type, diagramType),
      });
    }
  }

  return errors;
}
