/**
 * JSONCanvas Exporter Service
 *
 * Converts BAC4 graph view data to Obsidian's JSONCanvas format.
 * This allows the graph view to be opened and edited in Obsidian's
 * native Canvas view, providing better UX and interoperability.
 *
 * **Use Cases:**
 * - Graph view: Export diagram relationship graph as .canvas
 * - Diagram export: Allow viewing BAC4 diagrams in native Obsidian Canvas
 * - Interoperability: Share canvas data with other tools
 *
 * @module jsoncanvas-exporter
 */

import type { Node, Edge } from 'reactflow';
import type { CanvasNodeData } from '../types/canvas-types';
import type {
  JSONCanvasFile,
  JSONCanvasNode,
  JSONCanvasEdge,
  FileCanvasNode,
  TextCanvasNode,
  CanvasColor,
} from '../types/jsoncanvas';

/**
 * Color conversion map: BAC4 hex colors → JSONCanvas presets
 *
 * JSONCanvas presets (1-6):
 * 1 = Red, 2 = Orange, 3 = Yellow, 4 = Green, 5 = Cyan, 6 = Purple
 *
 * We map BAC4's C4 model colors to appropriate presets while
 * preserving hex colors that don't match common patterns.
 */
const COLOR_PRESET_MAP: Record<string, string> = {
  // C4 Model colors → JSONCanvas presets
  '#1168BD': '5', // Context (blue) → Cyan
  '#438DD5': '5', // Container (lighter blue) → Cyan
  '#85BBF0': '4', // Component (lightest blue) → Green
  '#08427B': '6', // Person (dark blue) → Purple
  '#999999': '1', // External/Gray → Red
  '#28A745': '4', // Success green → Green
  '#DC3545': '1', // Error red → Red
  '#FFC107': '3', // Warning yellow → Yellow
  '#6610F2': '6', // Purple → Purple
};

export class JSONCanvasExporter {
  /**
   * Convert BAC4 hex color to JSONCanvas color (hex or preset 1-6)
   *
   * Uses preset map for common colors, falls back to hex for custom colors.
   *
   * @param hexColor - Hex color string (e.g., "#1168BD")
   * @returns Canvas color (preset "1"-"6" or hex)
   *
   * @example
   * ```ts
   * convertColor('#1168BD') // "5" (cyan preset)
   * convertColor('#FF5733') // "#FF5733" (custom hex)
   * ```
   */
  static convertColor(hexColor?: string): CanvasColor | undefined {
    if (!hexColor) return undefined;

    // Normalize to uppercase for comparison
    const normalized = hexColor.toUpperCase();

    // Check if we have a preset mapping (common C4 colors → presets for better theme support)
    if (COLOR_PRESET_MAP[normalized]) {
      return COLOR_PRESET_MAP[normalized];
    }

    // Validate hex format before returning
    if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      return hexColor;
    }

    // Invalid color format - return undefined (use default)
    return undefined;
  }

  /**
   * Convert graph view nodes to JSONCanvas file nodes
   *
   * Graph nodes represent .bac4 diagrams, so we use JSONCanvas `file` nodes
   * that link to the diagram files. When clicked in Obsidian Canvas, they'll
   * open the diagram.
   *
   * @param nodes - React Flow graph nodes
   * @returns Array of JSONCanvas file nodes
   *
   * @example
   * ```ts
   * const graphNodes = await GraphGenerationService.generateGraph(vault);
   * const canvasNodes = JSONCanvasExporter.convertGraphNodes(graphNodes.nodes);
   * // Each canvas node links to a .bac4 file
   * ```
   */
  static convertGraphNodes(nodes: Node<CanvasNodeData>[]): FileCanvasNode[] {
    return nodes.map((node) => {
      // Extract diagram path from graph node data
      const diagramPath =
        'diagramPath' in node.data ? (node.data.diagramPath as string) : node.data.label || '';

      // Extract display name for the file node
      const displayName =
        node.data.label || diagramPath.split('/').pop()?.replace('.bac4', '') || 'Diagram';

      return {
        id: node.id,
        type: 'file' as const,
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        width: Math.round(node.width || 200),
        height: Math.round(node.height || 80),
        file: diagramPath,
        color: this.convertColor(node.data.color),
      };
    });
  }

  /**
   * Convert generic BAC4 nodes to JSONCanvas text nodes
   *
   * For non-graph nodes (e.g., System, Container, etc.), we convert to text nodes
   * with the label as content. This is a lossy conversion since JSONCanvas doesn't
   * support specialized C4 node types.
   *
   * @param nodes - React Flow nodes
   * @returns Array of JSONCanvas text nodes
   *
   * @example
   * ```ts
   * const { nodes } = await readBAC4File(vault, 'Context.bac4');
   * const canvasNodes = JSONCanvasExporter.convertNodesToText(nodes);
   * // C4 System/Container nodes → generic text nodes
   * ```
   */
  static convertNodesToText(nodes: Node<CanvasNodeData>[]): TextCanvasNode[] {
    return nodes.map((node) => {
      // Build text content from node data
      let text = node.data.label || 'Untitled';

      // Add description if present
      if (node.data.description) {
        text += `\n\n${node.data.description}`;
      }

      // Add type information
      if (node.type && node.type !== 'default') {
        text += `\n\n_Type: ${node.type}_`;
      }

      return {
        id: node.id,
        type: 'text' as const,
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        width: Math.round(node.width || 250),
        height: Math.round(node.height || 100),
        text,
        color: this.convertColor(node.data.color),
      };
    });
  }

  /**
   * Convert BAC4 edges to JSONCanvas edges
   *
   * Maps React Flow edges to JSONCanvas format. Handles directional arrows
   * and preserves edge labels and colors.
   *
   * @param edges - React Flow edges
   * @returns Array of JSONCanvas edges
   *
   * @example
   * ```ts
   * const { edges } = await GraphGenerationService.generateGraph(vault);
   * const canvasEdges = JSONCanvasExporter.convertEdges(edges);
   * ```
   */
  static convertEdges(edges: Edge[]): JSONCanvasEdge[] {
    return edges.map((edge) => {
      // Determine arrow ends based on direction
      let fromEnd: 'none' | 'arrow' = 'none';
      let toEnd: 'none' | 'arrow' = 'arrow';

      if (edge.data?.direction === 'left') {
        fromEnd = 'arrow';
        toEnd = 'none';
      } else if (edge.data?.direction === 'both') {
        fromEnd = 'arrow';
        toEnd = 'arrow';
      }

      return {
        id: edge.id,
        fromNode: edge.source,
        toNode: edge.target,
        fromEnd,
        toEnd,
        label: edge.data?.label,
        color: this.convertColor(edge.data?.color),
      };
    });
  }

  /**
   * Export graph view to JSONCanvas format
   *
   * Primary method for converting BAC4 graph view (diagram relationship visualization)
   * to Obsidian's native Canvas format. The resulting .canvas file can be opened
   * and edited in Obsidian's Canvas view.
   *
   * **Features:**
   * - Graph nodes → File nodes (link to .bac4 diagrams)
   * - Edges → Canvas edges with arrows
   * - Colors → Preset mapping or hex preservation
   * - Layout → Preserved (x, y, width, height)
   *
   * @param nodes - Graph view nodes (from GraphGenerationService)
   * @param edges - Graph view edges (relationships between diagrams)
   * @returns JSONCanvas file object ready to serialize
   *
   * @example
   * ```ts
   * // Generate graph view data
   * const { nodes, edges } = await GraphGenerationService.generateGraph(vault);
   *
   * // Convert to Canvas format
   * const canvasFile = JSONCanvasExporter.exportGraphToCanvas(nodes, edges);
   *
   * // Save as .canvas file
   * await vault.create(
   *   'BAC4/__graph_view__.canvas',
   *   JSON.stringify(canvasFile, null, 2)
   * );
   * ```
   */
  static exportGraphToCanvas(nodes: Node<CanvasNodeData>[], edges: Edge[]): JSONCanvasFile {
    return {
      nodes: this.convertGraphNodes(nodes),
      edges: this.convertEdges(edges),
    };
  }

  /**
   * Export regular BAC4 diagram to JSONCanvas format (lossy)
   *
   * Converts a BAC4 diagram (Context, Container, Component) to JSONCanvas.
   * This is a **lossy conversion** since JSONCanvas doesn't support:
   * - Timeline/snapshots
   * - Annotations
   * - C4 specialized node types
   * - Cloud component metadata
   *
   * Use this for **viewing only** in Obsidian Canvas, not as primary format.
   *
   * @param nodes - Diagram nodes
   * @param edges - Diagram edges
   * @returns JSONCanvas file object
   *
   * @example
   * ```ts
   * const { nodes, edges } = await readBAC4File(vault, 'Context.bac4');
   * const canvasFile = JSONCanvasExporter.exportDiagramToCanvas(nodes, edges);
   * await vault.create('Context-export.canvas', JSON.stringify(canvasFile, null, 2));
   * // User can view in Obsidian Canvas, but C4 styling is lost
   * ```
   */
  static exportDiagramToCanvas(nodes: Node<CanvasNodeData>[], edges: Edge[]): JSONCanvasFile {
    return {
      nodes: this.convertNodesToText(nodes),
      edges: this.convertEdges(edges),
    };
  }

  /**
   * Serialize JSONCanvas file to JSON string
   *
   * Convenience method to stringify with proper formatting.
   *
   * @param canvasFile - JSONCanvas file object
   * @param pretty - Whether to pretty-print (default: true)
   * @returns JSON string ready to write to .canvas file
   *
   * @example
   * ```ts
   * const canvasFile = JSONCanvasExporter.exportGraphToCanvas(nodes, edges);
   * const json = JSONCanvasExporter.serialize(canvasFile);
   * await vault.create('graph.canvas', json);
   * ```
   */
  static serialize(canvasFile: JSONCanvasFile, pretty = true): string {
    return pretty ? JSON.stringify(canvasFile, null, 2) : JSON.stringify(canvasFile);
  }

  /**
   * Validate JSONCanvas file structure
   *
   * Checks if a canvas file has valid structure before writing.
   * Useful for catching errors early.
   *
   * @param canvasFile - JSONCanvas file to validate
   * @returns True if valid, false otherwise
   *
   * @example
   * ```ts
   * const canvasFile = exportGraphToCanvas(nodes, edges);
   * if (JSONCanvasExporter.validate(canvasFile)) {
   *   await vault.create('graph.canvas', serialize(canvasFile));
   * }
   * ```
   */
  static validate(canvasFile: JSONCanvasFile): boolean {
    // Canvas file must have nodes or edges array
    if (!canvasFile.nodes && !canvasFile.edges) {
      console.error('JSONCanvas: File must have nodes or edges array');
      return false;
    }

    // Validate nodes if present
    if (canvasFile.nodes) {
      if (!Array.isArray(canvasFile.nodes)) {
        console.error('JSONCanvas: nodes must be an array');
        return false;
      }

      for (const node of canvasFile.nodes) {
        if (!node.id || !node.type || typeof node.x !== 'number' || typeof node.y !== 'number') {
          console.error('JSONCanvas: Invalid node structure', node);
          return false;
        }
      }
    }

    // Validate edges if present
    if (canvasFile.edges) {
      if (!Array.isArray(canvasFile.edges)) {
        console.error('JSONCanvas: edges must be an array');
        return false;
      }

      for (const edge of canvasFile.edges) {
        if (!edge.id || !edge.fromNode || !edge.toNode) {
          console.error('JSONCanvas: Invalid edge structure', edge);
          return false;
        }
      }
    }

    return true;
  }
}
