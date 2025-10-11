/**
 * Diagram Relationships Types
 *
 * Central relationship management for C4 diagrams.
 * Allows free naming of .bac4 files while maintaining hierarchy.
 */

export interface DiagramNode {
  /** Unique identifier for this diagram */
  id: string;

  /** File path to the .bac4 file */
  filePath: string;

  /** Display name for breadcrumbs (can be different from filename) */
  displayName: string;

  /** Diagram type */
  type: 'context' | 'container' | 'component';

  /** Creation timestamp */
  createdAt: string;

  /** Last updated timestamp */
  updatedAt: string;
}

export interface DiagramRelationship {
  /** Parent diagram ID */
  parentDiagramId: string;

  /** Child diagram ID */
  childDiagramId: string;

  /** Node ID in parent diagram that links to child */
  parentNodeId: string;

  /** Label of the parent node (for display) */
  parentNodeLabel: string;

  /** When this relationship was created */
  createdAt: string;
}

export interface DiagramRelationshipsData {
  /** Version for future compatibility */
  version: string;

  /** All diagrams in the project */
  diagrams: DiagramNode[];

  /** All parent-child relationships */
  relationships: DiagramRelationship[];

  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  /** Display name */
  label: string;

  /** Diagram file path */
  path: string;

  /** Diagram type */
  type: string;

  /** Diagram ID */
  id: string;
}
