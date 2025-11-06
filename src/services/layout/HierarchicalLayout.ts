/**
 * Hierarchical Layout Engine
 *
 * Arranges diagrams in a hierarchical layout based on the 7-layer
 * enterprise architecture model (Market → Organisation → Capability →
 * Context → Container → Component → Code).
 *
 * Nodes are positioned:
 * - Vertically: By layer (top to bottom)
 * - Horizontally: Centered within each layer
 * - Size: Dynamic based on connection count
 *
 * v2.0.2: Phase 3 - Extracted from graph-generation-service.ts
 *
 * @module hierarchical-layout
 */

import type { DiagramType } from '../../types/canvas-types';
import type {
  LayoutEngine,
  DiagramMetadata,
  LayoutResult,
  LayoutConfig,
  NodePosition,
} from './LayoutEngine';
import { DEFAULT_LAYOUT_CONFIG, calculateNodeSize, countRelationships } from './LayoutEngine';

/**
 * Hierarchical layout engine
 *
 * Groups diagrams by architectural layer and positions them
 * in a top-to-bottom hierarchy.
 */
export class HierarchicalLayout implements LayoutEngine {
  readonly name = 'Hierarchical';
  readonly description = 'Arrange by layer (Market → Code)';

  /**
   * Layer order for hierarchical layout
   */
  private readonly layerOrder: DiagramType[] = [
    'market',
    'organisation',
    'capability',
    'context',
    'container',
    'component',
    'code',
  ];

  /**
   * Calculate hierarchical layout positions
   *
   * Algorithm:
   * 1. Group diagrams by layer
   * 2. Skip empty layers
   * 3. For each layer:
   *    - Calculate total width needed
   *    - Center layer horizontally
   *    - Position nodes left-to-right with spacing
   *    - Apply dynamic sizing based on connections
   *    - Move to next layer (verticalSpacing below)
   *
   * @param diagrams - Array of diagram metadata
   * @param config - Layout configuration options
   * @returns Layout result with positions for each diagram
   */
  calculateLayout(diagrams: DiagramMetadata[], config?: LayoutConfig): LayoutResult {
    const fullConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    const positions = new Map<string, NodePosition>();

    // Group diagrams by layer
    const diagramsByLayer = new Map<DiagramType, DiagramMetadata[]>();
    this.layerOrder.forEach((layer) => diagramsByLayer.set(layer, []));

    diagrams.forEach((metadata) => {
      const layer = metadata.diagramType;
      if (diagramsByLayer.has(layer)) {
        diagramsByLayer.get(layer)!.push(metadata);
      }
    });

    // Position nodes in hierarchical layout
    const startY = 100;
    let currentY = startY;

    this.layerOrder.forEach((layer) => {
      const layerDiagrams = diagramsByLayer.get(layer) || [];

      if (layerDiagrams.length === 0) {
        // Skip empty layers
        return;
      }

      // Calculate total width of this layer to center it
      const totalWidth = layerDiagrams.length * fullConfig.horizontalSpacing;
      const startX = -totalWidth / 2 + fullConfig.horizontalSpacing / 2;

      layerDiagrams.forEach((metadata, indexInLayer) => {
        const { parentCount, childCount } = countRelationships(metadata.path, diagrams);
        const totalConnections = parentCount + childCount;

        // Calculate dynamic node size based on connections
        const { width, height } = calculateNodeSize(totalConnections, fullConfig);

        // Position node in hierarchical layout
        const x = startX + indexInLayer * fullConfig.horizontalSpacing;
        const y = currentY;

        positions.set(metadata.path, { x, y, width, height });
      });

      // Move to next layer
      currentY += fullConfig.verticalSpacing;
    });

    return { positions };
  }
}
