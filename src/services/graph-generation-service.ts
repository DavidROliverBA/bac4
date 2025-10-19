/**
 * Graph Generation Service
 *
 * Scans all BAC4 diagrams in the vault and generates a graph visualization
 * showing all diagrams as nodes and their relationships as edges.
 *
 * The graph view is a special meta-diagram that provides an overview of
 * the entire architecture documentation structure.
 *
 * @module graph-generation-service
 */

import { TFile, Vault } from 'obsidian';
import type { CanvasNode, CanvasEdge, DiagramNode, DiagramType } from '../types/canvas-types';
import { createGraphNode } from '../ui/canvas/utils/node-factory';
import { C4_TYPE_COLORS } from '../constants/ui-constants';

interface DiagramMetadata {
  path: string;
  displayName: string;
  diagramType: Exclude<DiagramType, 'graph'>;
  linkedDiagramPaths: string[];
}

export class GraphGenerationService {
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
   * Count parent and child relationships for a diagram
   *
   * Counts how many diagrams link to this one (parents) and how many
   * diagrams this one links to (children).
   *
   * @param diagramPath - Path to the diagram to analyze
   * @param allMetadata - Array of all diagram metadata to search
   * @returns Object containing parentCount and childCount
   *
   * @example
   * ```ts
   * const {parentCount, childCount} = GraphGenerationService.countRelationships(
   *   'BAC4/System_1.bac4',
   *   allMetadata
   * );
   * console.log(`Parents: ${parentCount}, Children: ${childCount}`);
   * ```
   */
  static countRelationships(
    diagramPath: string,
    allMetadata: DiagramMetadata[]
  ): { parentCount: number; childCount: number } {
    let parentCount = 0;
    let childCount = 0;

    const diagram = allMetadata.find((d) => d.path === diagramPath);
    if (!diagram) {
      return { parentCount: 0, childCount: 0 };
    }

    // Count children (diagrams this one links to)
    childCount = diagram.linkedDiagramPaths.length;

    // Count parents (diagrams that link to this one)
    for (const otherDiagram of allMetadata) {
      if (otherDiagram.linkedDiagramPaths.includes(diagramPath)) {
        parentCount++;
      }
    }

    return { parentCount, childCount };
  }

  /**
   * Generate graph nodes and edges from all diagrams in vault
   *
   * Creates a meta-visualization showing all diagrams as nodes and their
   * relationships as edges. Nodes are positioned in a grid layout and colored
   * by diagram type. Edges support both exact path matching and basename matching.
   *
   * @param vault - Obsidian vault instance to scan
   * @returns Promise resolving to object containing nodes and edges arrays
   *
   * @example
   * ```ts
   * const { nodes, edges } = await GraphGenerationService.generateGraph(vault);
   * setNodes(nodes);
   * setEdges(edges);
   * reactFlowInstance.fitView({ padding: 0.2 });
   * ```
   */
  static async generateGraph(vault: Vault): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }> {
    console.log('BAC4: Generating graph view...');

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

    // Generate nodes - position in a grid layout
    const nodes: CanvasNode[] = [];
    const gridColumns = Math.ceil(Math.sqrt(allMetadata.length));
    const gridSpacing = 250; // Space between nodes

    allMetadata.forEach((metadata, index) => {
      const row = Math.floor(index / gridColumns);
      const col = index % gridColumns;
      const x = col * gridSpacing + 100;
      const y = row * gridSpacing + 100;

      const { parentCount, childCount } = this.countRelationships(metadata.path, allMetadata);

      // Get color based on diagram type
      const color = C4_TYPE_COLORS[metadata.diagramType] || C4_TYPE_COLORS.context;

      const node = createGraphNode(
        `graph-${index}`,
        { x, y },
        metadata.displayName,
        metadata.path,
        metadata.diagramType,
        parentCount,
        childCount
      );

      // Set color
      node.data.color = color;

      nodes.push(node);
    });

    // Generate edges based on linkedDiagramPaths
    const edges: CanvasEdge[] = [];
    let edgeId = 0;

    allMetadata.forEach((metadata, index) => {
      metadata.linkedDiagramPaths.forEach((linkedPath) => {
        // Find the target node - try exact match first
        let targetIndex = allMetadata.findIndex((m) => m.path === linkedPath);

        // If no exact match, try basename match
        if (targetIndex === -1) {
          const linkedBasename = linkedPath.split('/').pop()?.replace('.bac4', '') || linkedPath;
          targetIndex = allMetadata.findIndex((m) => {
            const metadataBasename = m.path.split('/').pop()?.replace('.bac4', '') || m.path;
            return metadataBasename === linkedBasename;
          });
        }

        if (targetIndex !== -1) {
          edges.push({
            id: `edge-${edgeId++}`,
            source: `graph-${index}`,
            target: `graph-${targetIndex}`,
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
