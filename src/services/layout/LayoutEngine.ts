/**
 * Layout Engine Interface
 *
 * Defines the contract for all graph layout algorithms.
 * Each layout implementation must provide a method to calculate
 * node positions based on diagram metadata.
 *
 * v2.0.2: Phase 3 - Layout Options
 *
 * @module layout-engine
 */

import type { DiagramType } from '../../types/canvas-types';

/**
 * Metadata for a single diagram node
 * Exported for use in graph generation service
 */
export interface DiagramMetadata {
  path: string;
  displayName: string;
  diagramType: Exclude<DiagramType, 'graph'>;
  linkedDiagramPaths: string[];
}

/**
 * Position and size for a node
 */
export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result of layout calculation
 */
export interface LayoutResult {
  positions: Map<string, NodePosition>; // diagramPath → position
}

/**
 * Configuration options for layout algorithms
 */
export interface LayoutConfig {
  /**
   * Vertical spacing between layers (hierarchical/circular layouts)
   */
  verticalSpacing?: number;

  /**
   * Horizontal spacing between nodes
   */
  horizontalSpacing?: number;

  /**
   * Whether to use dynamic node sizing based on connections
   */
  dynamicSizing?: boolean;

  /**
   * Base width for nodes (when not using dynamic sizing)
   */
  baseWidth?: number;

  /**
   * Base height for nodes (when not using dynamic sizing)
   */
  baseHeight?: number;

  /**
   * Canvas dimensions for force-directed layout
   */
  canvasWidth?: number;
  canvasHeight?: number;

  /**
   * Number of iterations for force-directed simulation
   */
  forceIterations?: number;
}

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: Required<LayoutConfig> = {
  verticalSpacing: 300,
  horizontalSpacing: 250,
  dynamicSizing: true,
  baseWidth: 200,
  baseHeight: 80,
  canvasWidth: 2000,
  canvasHeight: 2000,
  forceIterations: 100,
};

/**
 * Abstract layout engine interface
 *
 * All layout algorithms implement this interface to provide
 * consistent node positioning across different layout types.
 */
export interface LayoutEngine {
  /**
   * Name of the layout algorithm
   */
  readonly name: string;

  /**
   * Description of the layout algorithm
   */
  readonly description: string;

  /**
   * Calculate node positions for all diagrams
   *
   * @param diagrams - Array of diagram metadata
   * @param config - Layout configuration options
   * @returns Layout result with positions for each diagram
   */
  calculateLayout(diagrams: DiagramMetadata[], config?: LayoutConfig): LayoutResult;
}

/**
 * Helper function to calculate dynamic node size based on connections
 *
 * @param connectionCount - Total parent + child connections
 * @param config - Layout configuration
 * @returns Object with width and height in pixels
 */
export function calculateNodeSize(
  connectionCount: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { width: number; height: number } {
  if (!config.dynamicSizing) {
    return {
      width: config.baseWidth ?? DEFAULT_LAYOUT_CONFIG.baseWidth,
      height: config.baseHeight ?? DEFAULT_LAYOUT_CONFIG.baseHeight,
    };
  }

  const baseWidth = config.baseWidth ?? DEFAULT_LAYOUT_CONFIG.baseWidth;
  const baseHeight = config.baseHeight ?? DEFAULT_LAYOUT_CONFIG.baseHeight;
  const scaleFactor = 10; // 10px per connection

  const width = baseWidth + Math.min(connectionCount * scaleFactor, 200); // Max 400px wide
  const height = baseHeight + Math.min(connectionCount * (scaleFactor / 2), 100); // Max 180px tall

  return { width, height };
}

/**
 * Helper function to count relationships for a diagram
 *
 * @param diagramPath - Path to the diagram
 * @param allDiagrams - Array of all diagram metadata
 * @returns Object containing parentCount and childCount
 */
export function countRelationships(
  diagramPath: string,
  allDiagrams: DiagramMetadata[]
): { parentCount: number; childCount: number } {
  let parentCount = 0;
  let childCount = 0;

  const diagram = allDiagrams.find((d) => d.path === diagramPath);
  if (!diagram) {
    return { parentCount: 0, childCount: 0 };
  }

  // Count children (diagrams this one links to)
  childCount = diagram.linkedDiagramPaths.length;

  // Count parents (diagrams that link to this one)
  for (const otherDiagram of allDiagrams) {
    if (otherDiagram.linkedDiagramPaths.includes(diagramPath)) {
      parentCount++;
    }
  }

  return { parentCount, childCount };
}
