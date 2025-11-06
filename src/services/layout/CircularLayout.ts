/**
 * Circular Layout Engine
 *
 * Arranges diagrams in concentric circles based on architectural layers.
 * Market (center) → Code (outer ring).
 *
 * Good for: High-level overview showing layer distribution at a glance.
 *
 * v2.0.2: Phase 3 - Layout Options
 *
 * @module circular-layout
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
 * Circular layout engine
 *
 * Arranges diagrams in concentric circles by layer.
 */
export class CircularLayout implements LayoutEngine {
  readonly name = 'Circular';
  readonly description = 'Concentric circles by layer';

  /**
   * Layer order for circular layout (center to outer)
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
   * Calculate circular layout positions
   *
   * Algorithm:
   * 1. Group diagrams by layer
   * 2. For each layer (starting from center):
   *    a. Calculate radius based on layer index
   *    b. Distribute nodes evenly around circle
   *    c. Calculate angle for each node
   *    d. Convert polar to cartesian coordinates
   * 3. Center the layout at (0, 0)
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

    // Group diagrams by layer
    const diagramsByLayer = new Map<DiagramType, DiagramMetadata[]>();
    this.layerOrder.forEach((layer) => diagramsByLayer.set(layer, []));

    diagrams.forEach((metadata) => {
      const layer = metadata.diagramType;
      if (diagramsByLayer.has(layer)) {
        diagramsByLayer.get(layer)!.push(metadata);
      }
    });

    // Calculate radius increment based on vertical spacing
    const radiusIncrement = fullConfig.verticalSpacing;
    const baseRadius = 100; // Radius for first layer (center)

    // Position nodes in concentric circles
    this.layerOrder.forEach((layer, layerIndex) => {
      const layerDiagrams = diagramsByLayer.get(layer) || [];

      if (layerDiagrams.length === 0) {
        // Skip empty layers
        return;
      }

      // Calculate radius for this layer
      const radius = layerIndex === 0 ? 0 : baseRadius + layerIndex * radiusIncrement;

      // Special case: single node in center
      if (layerIndex === 0 && layerDiagrams.length === 1) {
        const metadata = layerDiagrams[0];
        const { parentCount, childCount } = countRelationships(metadata.path, diagrams);
        const totalConnections = parentCount + childCount;
        const { width, height } = calculateNodeSize(totalConnections, fullConfig);

        positions.set(metadata.path, { x: 0, y: 0, width, height });
        return;
      }

      // Distribute nodes evenly around circle
      const angleStep = (2 * Math.PI) / layerDiagrams.length;

      layerDiagrams.forEach((metadata, indexInLayer) => {
        const { parentCount, childCount } = countRelationships(metadata.path, diagrams);
        const totalConnections = parentCount + childCount;
        const { width, height } = calculateNodeSize(totalConnections, fullConfig);

        // Calculate angle (start from top, go clockwise)
        const angle = -Math.PI / 2 + indexInLayer * angleStep;

        // Convert polar to cartesian coordinates
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        positions.set(metadata.path, { x, y, width, height });
      });
    });

    return { positions };
  }
}
