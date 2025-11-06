/**
 * Force-Directed Layout Engine
 *
 * Physics-based automatic arrangement using force simulation.
 * Connected nodes attract each other, unconnected nodes repel.
 *
 * Good for: Discovering unexpected relationships and clustering
 * diagrams that are highly interconnected.
 *
 * v2.0.2: Phase 3 - Layout Options
 *
 * @module force-directed-layout
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
 * Node in force simulation
 */
interface ForceNode {
  path: string;
  x: number;
  y: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  width: number;
  height: number;
}

/**
 * Force-directed layout engine
 *
 * Uses physics simulation to arrange diagrams based on their connections.
 */
export class ForceDirectedLayout implements LayoutEngine {
  readonly name = 'Force-Directed';
  readonly description = 'Physics-based automatic arrangement';

  /**
   * Calculate force-directed layout positions
   *
   * Algorithm:
   * 1. Initialize nodes with random positions
   * 2. For each iteration:
   *    a. Apply repulsive forces (all nodes repel each other)
   *    b. Apply attractive forces (connected nodes attract)
   *    c. Update velocities and positions
   *    d. Apply damping to stabilize
   * 3. Center the final layout
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

    // Initialize nodes with random positions and calculate sizes
    const nodes: ForceNode[] = diagrams.map((metadata) => {
      const { parentCount, childCount } = countRelationships(metadata.path, diagrams);
      const totalConnections = parentCount + childCount;
      const { width, height } = calculateNodeSize(totalConnections, fullConfig);

      return {
        path: metadata.path,
        x: (Math.random() - 0.5) * fullConfig.canvasWidth,
        y: (Math.random() - 0.5) * fullConfig.canvasHeight,
        vx: 0,
        vy: 0,
        width,
        height,
      };
    });

    // Build adjacency map for faster connection lookups
    const connections = new Map<string, Set<string>>();
    diagrams.forEach((metadata) => {
      if (!connections.has(metadata.path)) {
        connections.set(metadata.path, new Set());
      }
      metadata.linkedDiagramPaths.forEach((linkedPath) => {
        // Find actual path (might need basename matching)
        const actualPath = diagrams.find((d) => {
          const dBasename = d.path.split('/').pop()?.replace('.bac4', '') || d.path;
          const linkedBasename = linkedPath.split('/').pop()?.replace('.bac4', '') || linkedPath;
          return d.path === linkedPath || dBasename === linkedBasename;
        })?.path;

        if (actualPath) {
          connections.get(metadata.path)!.add(actualPath);
          // Add bidirectional connection
          if (!connections.has(actualPath)) {
            connections.set(actualPath, new Set());
          }
          connections.get(actualPath)!.add(metadata.path);
        }
      });
    });

    // Physics constants
    const REPULSION_STRENGTH = 5000;
    const ATTRACTION_STRENGTH = 0.01;
    const DAMPING = 0.8;
    const MIN_DISTANCE = 50; // Minimum distance to prevent overlap

    // Run simulation
    for (let iteration = 0; iteration < fullConfig.forceIterations; iteration++) {
      // Reset forces
      nodes.forEach((node) => {
        node.vx = 0;
        node.vy = 0;
      });

      // Apply repulsive forces (all nodes repel each other)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          if (distance < MIN_DISTANCE) {
            // Strong repulsion when too close
            const force = (REPULSION_STRENGTH * 10) / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          } else {
            // Normal repulsion
            const force = REPULSION_STRENGTH / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        }
      }

      // Apply attractive forces (connected nodes attract)
      nodes.forEach((nodeA) => {
        const connectedPaths = connections.get(nodeA.path);
        if (!connectedPaths) return;

        connectedPaths.forEach((connectedPath) => {
          const nodeB = nodes.find((n) => n.path === connectedPath);
          if (!nodeB) return;

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          // Spring force (Hooke's law)
          const force = distance * ATTRACTION_STRENGTH;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodeA.vx += fx;
          nodeA.vy += fy;
        });
      });

      // Update positions with damping
      nodes.forEach((node) => {
        node.x += node.vx * DAMPING;
        node.y += node.vy * DAMPING;
      });
    }

    // Center the layout
    const avgX = nodes.reduce((sum, node) => sum + node.x, 0) / nodes.length;
    const avgY = nodes.reduce((sum, node) => sum + node.y, 0) / nodes.length;

    nodes.forEach((node) => {
      positions.set(node.path, {
        x: node.x - avgX,
        y: node.y - avgY,
        width: node.width,
        height: node.height,
      });
    });

    return { positions };
  }
}
