/**
 * Graph Generation Service
 *
 * Scans all BAC4 diagrams in the vault and generates a graph visualization
 * showing all diagrams as nodes and their relationships as edges.
 *
 * The graph view is a special meta-diagram that provides an overview of
 * the entire architecture documentation structure.
 *
 * v2.0.2: Phase 3 - Multiple layout engines supported
 *
 * @module graph-generation-service
 */

import { TFile, Vault } from 'obsidian';
import type { CanvasNode, CanvasEdge, DiagramNode, DiagramType } from '../types/canvas-types';
import { createGraphNode } from '../ui/canvas/utils/node-factory';
import { C4_TYPE_COLORS } from '../constants/ui-constants';
import { GraphLayoutService, type NodeLayout } from './graph-layout-service';
import type { DiagramMetadata } from './layout/LayoutEngine';
import { HierarchicalLayout } from './layout/HierarchicalLayout';
import { GridLayout } from './layout/GridLayout';
import { ForceDirectedLayout } from './layout/ForceDirectedLayout';
import { CircularLayout } from './layout/CircularLayout';
import type { LayoutEngine } from './layout/LayoutEngine';
import { countRelationships } from './layout/LayoutEngine';

export class GraphGenerationService {
  /**
   * Available layout engines
   */
  private static readonly layoutEngines: Record<string, LayoutEngine> = {
    hierarchical: new HierarchicalLayout(),
    grid: new GridLayout(),
    'force-directed': new ForceDirectedLayout(),
    circular: new CircularLayout(),
  };

  /**
   * Get layout engine by name
   *
   * @param layoutType - Layout type identifier
   * @returns LayoutEngine instance
   */
  static getLayoutEngine(layoutType: string): LayoutEngine {
    return this.layoutEngines[layoutType] || this.layoutEngines.hierarchical;
  }

  /**
   * Get all .bac4 files in the vault
   *
   * @param vault - Obsidian vault instance to search
   * @returns Promise resolving to array of TFile objects with .bac4 extension
   *
   * @example
   * ```ts
   * const diagrams = await GraphGenerationService.getAllDiagrams(vault);
   * console.log(`Found ${diagrams.length} diagrams`);
   * ```
   */
  static async getAllDiagrams(vault: Vault): Promise<TFile[]> {
    const allFiles = vault.getFiles();
    return allFiles.filter((file) => file.extension === 'bac4');
  }

  /**
   * Parse a diagram file to extract metadata
   *
   * Supports both v1.0.0 timeline format and legacy formats.
   * Extracts diagram type, linked diagrams, and other metadata.
   *
   * @param vault - Obsidian vault instance for reading files
   * @param file - The .bac4 file to parse
   * @returns Promise resolving to DiagramMetadata object, or null if parsing fails
   *
   * @example
   * ```ts
   * const metadata = await GraphGenerationService.parseDiagramMetadata(vault, file);
   * if (metadata) {
   *   console.log(`Diagram: ${metadata.displayName}, Links: ${metadata.linkedDiagramPaths.length}`);
   * }
   * ```
   */
  static async parseDiagramMetadata(vault: Vault, file: TFile): Promise<DiagramMetadata | null> {
    try {
      const content = await vault.read(file);
      const data = JSON.parse(content);

      // Extract diagram type from metadata
      const diagramType = data.metadata?.diagramType || data.diagramType || 'context';

      // Collect all linked diagram paths from nodes
      const linkedDiagramPaths: string[] = [];

      // v1.0.0 format: nodes are in timeline snapshots
      if (data.timeline && data.timeline.snapshots && Array.isArray(data.timeline.snapshots)) {
        // Get current snapshot
        const currentSnapshotId = data.timeline.currentSnapshotId;
        const currentSnapshot = data.timeline.snapshots.find((s: any) => s.id === currentSnapshotId);

        if (currentSnapshot && currentSnapshot.nodes && Array.isArray(currentSnapshot.nodes)) {
          for (const node of currentSnapshot.nodes) {
            // Support both single linkedDiagramPath and array linkedDiagramPaths
            if (node.data?.linkedDiagramPath) {
              linkedDiagramPaths.push(node.data.linkedDiagramPath);
            }
            if (node.data?.linkedDiagramPaths && Array.isArray(node.data.linkedDiagramPaths)) {
              linkedDiagramPaths.push(...node.data.linkedDiagramPaths);
            }
          }
        }
      }
      // Legacy format: nodes at top level
      else if (data.nodes && Array.isArray(data.nodes)) {
        for (const node of data.nodes) {
          // Support both single linkedDiagramPath and array linkedDiagramPaths
          if (node.data?.linkedDiagramPath) {
            linkedDiagramPaths.push(node.data.linkedDiagramPath);
          }
          if (node.data?.linkedDiagramPaths && Array.isArray(node.data.linkedDiagramPaths)) {
            linkedDiagramPaths.push(...node.data.linkedDiagramPaths);
          }
        }
      }

      // Remove duplicates
      const uniqueLinkedPaths = [...new Set(linkedDiagramPaths)];

      return {
        path: file.path,
        displayName: file.basename,
        diagramType: diagramType as Exclude<DiagramType, 'graph'>,
        linkedDiagramPaths: uniqueLinkedPaths,
      };
    } catch (error) {
      console.error('BAC4: Error parsing diagram metadata for', file.path, error);
      return null;
    }
  }


  /**
   * Generate graph nodes and edges from all diagrams in vault
   *
   * v2.0.0: Uses hierarchical layout optimized for 7-layer architecture model.
   * v2.0.1: Persistent layout - Restores user-customized node positions.
   * v2.0.2: Multiple layout engines - Supports Grid, Hierarchical, Force-Directed, Circular
   *
   * **Layout Algorithm:**
   * 1. Load saved layout from .bac4-graph-layout.json
   * 2. Parse all diagram metadata
   * 3. Use selected layout engine to calculate positions
   * 4. For each diagram:
   *    - If saved position exists → Use saved position
   *    - If new diagram → Use layout engine position
   * 5. Generate edges based on relationships
   *
   * @param vault - Obsidian vault instance to scan
   * @param layoutType - Layout algorithm to use (default: 'hierarchical')
   * @returns Promise resolving to object containing nodes and edges arrays
   *
   * @example
   * ```ts
   * const { nodes, edges } = await GraphGenerationService.generateGraph(vault, 'hierarchical');
   * setNodes(nodes);
   * setEdges(edges);
   * reactFlowInstance.fitView({ padding: 0.2 });
   * ```
   */
  static async generateGraph(
    vault: Vault,
    layoutType: string = 'hierarchical'
  ): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }> {
    console.log(`BAC4: Generating graph view with ${layoutType} layout...`);

    // Load saved layout positions (v2.0.1)
    const savedLayout = await GraphLayoutService.loadLayout(vault);
    console.log(
      `BAC4: Loaded ${Object.keys(savedLayout.layout).length} saved node positions`
    );

    // Get all diagram files
    const diagramFiles = await this.getAllDiagrams(vault);
    console.log(`BAC4: Found ${diagramFiles.length} diagram files`);

    // Parse metadata for all diagrams
    const allMetadata: DiagramMetadata[] = [];
    for (const file of diagramFiles) {
      const metadata = await this.parseDiagramMetadata(vault, file);
      if (metadata) {
        allMetadata.push(metadata);
      }
    }

    console.log(`BAC4: Parsed ${allMetadata.length} diagram metadata entries`);

    // Get layout engine and calculate positions (v2.0.2)
    const layoutEngine = this.getLayoutEngine(layoutType);
    console.log(`BAC4: Using ${layoutEngine.name} layout engine`);
    const layoutResult = layoutEngine.calculateLayout(allMetadata);

    // Generate nodes using layout engine positions
    const nodes: CanvasNode[] = [];
    const pathToNodeId = new Map<string, string>(); // Map diagram path to node ID
    let nodeIndex = 0;

    allMetadata.forEach((metadata) => {
      // Get position from layout engine
      const layoutPosition = layoutResult.positions.get(metadata.path);
      if (!layoutPosition) {
        console.warn(`BAC4: No layout position for ${metadata.path}`);
        return;
      }

      // Check if this diagram has a saved position (v2.0.1)
      // Saved positions override layout engine positions
      const savedPosition = GraphLayoutService.getSavedPosition(savedLayout, metadata.path);

      let x: number;
      let y: number;
      let width: number;
      let height: number;

      if (savedPosition) {
        // Use saved position (user has manually arranged this node)
        x = savedPosition.x;
        y = savedPosition.y;
        width = savedPosition.width;
        height = savedPosition.height;
        console.log(
          `BAC4: Using saved position for ${metadata.displayName}: (${x}, ${y})`
        );
      } else {
        // Use layout engine position
        x = layoutPosition.x;
        y = layoutPosition.y;
        width = layoutPosition.width;
        height = layoutPosition.height;
      }

      // Get color based on diagram type
      const color = C4_TYPE_COLORS[metadata.diagramType] || C4_TYPE_COLORS.context;

      // Count relationships for node metadata
      const { parentCount, childCount } = countRelationships(metadata.path, allMetadata);

      const nodeId = `graph-${nodeIndex++}`;
      const node = createGraphNode(
        nodeId,
        { x, y },
        metadata.displayName,
        metadata.path,
        metadata.diagramType,
        parentCount,
        childCount
      );

      // Set color and size
      node.data.color = color;
      node.width = width;
      node.height = height;

      nodes.push(node);

      // Map path to node ID for edge creation
      pathToNodeId.set(metadata.path, nodeId);
    });

    // Generate edges based on linkedDiagramPaths
    const edges: CanvasEdge[] = [];
    let edgeId = 0;

    allMetadata.forEach((metadata) => {
      const sourceNodeId = pathToNodeId.get(metadata.path);
      if (!sourceNodeId) return;

      metadata.linkedDiagramPaths.forEach((linkedPath) => {
        // Try to find target node by exact path match
        let targetNodeId = pathToNodeId.get(linkedPath);

        // If no exact match, try basename match
        if (!targetNodeId) {
          const linkedBasename = linkedPath.split('/').pop()?.replace('.bac4', '') || linkedPath;

          for (const [path, nodeId] of pathToNodeId.entries()) {
            const pathBasename = path.split('/').pop()?.replace('.bac4', '') || path;
            if (pathBasename === linkedBasename) {
              targetNodeId = nodeId;
              break;
            }
          }
        }

        if (targetNodeId) {
          edges.push({
            id: `edge-${edgeId++}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: 'directional',
            data: {
              direction: 'right',
            },
          });
        }
      });
    });

    console.log(`BAC4: Generated ${nodes.length} nodes and ${edges.length} edges for graph view`);

    return { nodes, edges };
  }

  /**
   * Get diagram path from graph node
   *
   * Extracts the file path of the diagram that a graph node represents.
   * Returns null if the node is not a graph node or doesn't have a diagram path.
   *
   * @param node - The canvas node to extract path from
   * @returns Diagram file path, or null if not a graph node
   *
   * @example
   * ```ts
   * const path = GraphGenerationService.getDiagramPathFromNode(node);
   * if (path) {
   *   await plugin.openCanvasView(path);
   * }
   * ```
   */
  static getDiagramPathFromNode(node: CanvasNode): string | null {
    if (node.type === 'graph' && 'diagramPath' in node.data) {
      return node.data.diagramPath as string;
    }
    return null;
  }
}
