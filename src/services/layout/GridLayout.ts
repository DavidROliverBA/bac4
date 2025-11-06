/**
 * Grid Layout Engine
 *
 * Simple grid arrangement (√n × √n) with no layer awareness.
 * Nodes are positioned in a uniform grid pattern.
 *
 * Good for: Small vaults (<20 diagrams) where spatial relationships
 * are less important than simple organization.
 *
 * v2.0.2: Phase 3 - Layout Options
 *
 * @module grid-layout
 */

import type {
  LayoutEngine,
  DiagramMetadata,
  LayoutResult,
  LayoutConfig,
  NodePosition,
} from './LayoutEngine';
import { DEFAULT_LAYOUT_CONFIG, calculateNodeSize, countRelationships } from './LayoutEngine';

/**
 * Grid layout engine
 *
 * Arranges diagrams in a simple √n × √n grid pattern.
 */
export class GridLayout implements LayoutEngine {
  readonly name = 'Grid';
  readonly description = 'Simple grid arrangement';

  /**
   * Calculate grid layout positions
   *
   * Algorithm:
   * 1. Calculate grid dimensions (√n × √n)
   * 2. Position nodes left-to-right, top-to-bottom
   * 3. Apply dynamic sizing if enabled
   * 4. Center the entire grid
   *
   * @param diagrams - Array of diagram metadata
   * @param config - Layout configuration options
   * @returns Layout result with positions for each diagram
   */
  calculateLayout(diagrams: DiagramMetadata[], config?: LayoutConfig): LayoutResult {
    const fullConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    const positions = new Map<string, NodePosition>();

    if (diagrams.length === 0) {
      return { positions };
    }

    // Calculate grid dimensions (√n × √n)
    const gridSize = Math.ceil(Math.sqrt(diagrams.length));

    // Calculate total grid dimensions to center it
    const totalWidth = gridSize * fullConfig.horizontalSpacing;
    const totalHeight = gridSize * fullConfig.verticalSpacing;
    const startX = -totalWidth / 2 + fullConfig.horizontalSpacing / 2;
    const startY = -totalHeight / 2 + fullConfig.verticalSpacing / 2;

    // Position nodes in grid
    diagrams.forEach((metadata, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const { parentCount, childCount } = countRelationships(metadata.path, diagrams);
      const totalConnections = parentCount + childCount;

      // Calculate node size
      const { width, height } = calculateNodeSize(totalConnections, fullConfig);

      // Position in grid
      const x = startX + col * fullConfig.horizontalSpacing;
      const y = startY + row * fullConfig.verticalSpacing;

      positions.set(metadata.path, { x, y, width, height });
    });

    return { positions };
  }
}
