/**
 * Format Converter: v1 (v2.0.0-v2.2.0) → v2 (v2.5.0)
 *
 * Converts old .bac4 format to new split format:
 * - Old: Single .bac4 file with nodes, edges, positions
 * - New: .bac4 (nodes only) + .bac4-graph (relationships + layout)
 *
 * @version 2.5.0
 */

import type {
  BAC4FileV2,
  BAC4GraphFileV2,
  NodeV2,
  EdgeV2,
  LayerType,
  DiagramType,
  ViewType,
  NodeType,
  EvolutionStage,
} from '../types/bac4-v2-types';

// ============================================================================
// Old Format Types (v1)
// ============================================================================

interface BAC4FileV1 {
  version: string;
  metadata: {
    diagramType: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  timeline: {
    snapshots: SnapshotV1[];
    currentSnapshotId: string;
    snapshotOrder: string[];
  };
}

interface SnapshotV1 {
  id: string;
  label: string;
  timestamp: string | null;
  description: string;
  createdAt: string;
  nodes: NodeV1[];
  edges: EdgeV1[];
  annotations: any[];
}

interface NodeV1 {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data: {
    label: string;
    description?: string;
    technology?: string;
    color?: string;
    linkedDiagramPath?: string;
    [key: string]: any;
  };
  selected?: boolean;
  dragging?: boolean;
  positionAbsolute?: any;
  zIndex?: number;
}

interface EdgeV1 {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    label?: string;
    direction?: string;
    [key: string]: any;
  };
  markerEnd?: {
    type: string;
    width?: number;
    height?: number;
    color?: string;
  };
  sourceHandle?: string;
  targetHandle?: string;
}

// ============================================================================
// Format Converter
// ============================================================================

export class FormatConverter {
  /**
   * Convert v1 .bac4 file to v2 format (split into node file + graph file)
   */
  static convertV1ToV2(
    v1File: BAC4FileV1,
    filePath: string
  ): { nodeFile: BAC4FileV2; graphFile: BAC4GraphFileV2 } {
    console.log(`Converting ${filePath} from v1 to v2 format...`);

    // Infer layer from file path
    const layer = this.inferLayerFromPath(filePath);
    const diagramType = this.inferDiagramType(v1File.metadata.diagramType);
    const viewType = this.getViewType(diagramType);

    // Extract nodes from all snapshots (use current snapshot for base data)
    const currentSnapshot = v1File.timeline.snapshots.find(
      (s) => s.id === v1File.timeline.currentSnapshotId
    );

    if (!currentSnapshot) {
      throw new Error(`No current snapshot found for ${filePath}`);
    }

    // Convert nodes to v2 format (semantic data only)
    const nodes: Record<string, NodeV2> = {};
    for (const v1Node of currentSnapshot.nodes) {
      nodes[v1Node.id] = this.convertNode(v1Node);
    }

    // Create node file (semantic data)
    const nodeFile: BAC4FileV2 = {
      version: '2.5.1',
      metadata: {
        id: this.generateId(diagramType),
        title: v1File.metadata.title,
        description: v1File.metadata.description || '',
        layer,
        diagramType,
        created: v1File.metadata.createdAt,
        updated: v1File.metadata.updatedAt,
        status: 'published',
      },
      nodes,
    };

    // Create graph file (relationships + layout)
    const graphFile: BAC4GraphFileV2 = {
      version: '2.5.1',
      metadata: {
        nodeFile: this.getFileName(filePath),
        graphId: this.generateId(viewType),
        title: `${v1File.metadata.title} - Default Layout`,
        viewType,
        created: v1File.metadata.createdAt,
        updated: v1File.metadata.updatedAt,
      },
      timeline: {
        snapshots: v1File.timeline.snapshots.map((s) =>
          this.convertSnapshot(s)
        ),
        currentSnapshotId: v1File.timeline.currentSnapshotId,
        snapshotOrder: v1File.timeline.snapshotOrder,
      },
      config: {
        gridEnabled: true,
        gridSize: 20,
        snapToGrid: false,
        showMinimap: false,
        layoutAlgorithm: 'manual',
      },
    };

    return { nodeFile, graphFile };
  }

  /**
   * Convert a single node from v1 to v2 format
   */
  private static convertNode(v1Node: NodeV1): NodeV2 {
    // Extract linked diagrams
    const linkedDiagrams = v1Node.data.linkedDiagramPath
      ? [
          {
            path: v1Node.data.linkedDiagramPath,
            relationship: 'decomposes-to' as const,
          },
        ]
      : [];

    // Convert node type
    const nodeType = this.normalizeNodeType(v1Node.type);

    return {
      id: v1Node.id,
      type: nodeType,
      properties: {
        label: v1Node.data.label || 'Untitled',
        description: v1Node.data.description || '',
        technology: v1Node.data.technology,
        ...this.extractOtherProperties(v1Node.data),
      },
      knowledge: {
        notes: [],
        urls: [],
        attachments: [],
      },
      metrics: {},
      wardley: undefined, // Will be set later if needed
      links: {
        parent: null,
        children: [],
        linkedDiagrams,
        externalSystems: [],
        dependencies: [],
      },
      style: {
        color: v1Node.data.color || this.getDefaultColor(nodeType),
      },
    };
  }

  /**
   * Convert a snapshot from v1 to v2 format
   */
  private static convertSnapshot(v1Snapshot: SnapshotV1): any {
    return {
      id: v1Snapshot.id,
      label: v1Snapshot.label,
      timestamp: v1Snapshot.timestamp,
      description: v1Snapshot.description,
      created: v1Snapshot.createdAt,
      layout: this.extractLayout(v1Snapshot.nodes),
      edges: v1Snapshot.edges.map((e) => this.convertEdge(e)),
      groups: [],
      annotations: v1Snapshot.annotations || [],
    };
  }

  /**
   * Extract layout information from v1 nodes
   */
  private static extractLayout(
    v1Nodes: NodeV1[]
  ): Record<string, { x: number; y: number; width: number; height: number; locked: boolean }> {
    const layout: Record<string, any> = {};

    for (const node of v1Nodes) {
      layout[node.id] = {
        x: node.x,
        y: node.y,
        width: node.width || 200,
        height: node.height || 100,
        locked: false,
      };
    }

    return layout;
  }

  /**
   * Convert edge from v1 to v2 format
   */
  private static convertEdge(v1Edge: EdgeV1): EdgeV2 {
    return {
      id: v1Edge.id,
      source: v1Edge.source,
      target: v1Edge.target,
      type: v1Edge.type || 'default',
      properties: {
        label: v1Edge.data?.label,
        ...v1Edge.data,
      },
      style: {
        direction: (v1Edge.data?.direction as any) || 'right',
        lineType: 'solid',
        color: v1Edge.markerEnd?.color || '#888888',
        markerEnd: (v1Edge.markerEnd?.type as any) || 'arrowclosed',
      },
      handles: {
        sourceHandle: (v1Edge.sourceHandle as any) || 'right',
        targetHandle: (v1Edge.targetHandle as any) || 'left',
      },
    };
  }

  /**
   * Infer layer from file path
   */
  private static inferLayerFromPath(filePath: string): LayerType {
    if (filePath.includes('/1-Market/')) return 'market';
    if (filePath.includes('/2-Organisation/')) return 'organisation';
    if (filePath.includes('/3-Capability/')) return 'capability';
    if (filePath.includes('/4-Context/')) return 'context';
    if (filePath.includes('/5-Container/')) return 'container';
    if (filePath.includes('/6-Component/')) return 'component';
    if (filePath.includes('/7-Code/')) return 'code';

    // Fallback: infer from diagram type
    return 'context';
  }

  /**
   * Infer diagram type from metadata
   */
  private static inferDiagramType(metaDiagramType: string): DiagramType {
    const normalized = metaDiagramType.toLowerCase();

    if (normalized.includes('market')) return 'market';
    if (normalized.includes('organisation') || normalized.includes('organization'))
      return 'organisation';
    if (normalized.includes('capability')) return 'capability';
    if (normalized.includes('context')) return 'context';
    if (normalized.includes('container')) return 'container';
    if (normalized.includes('component')) return 'component';
    if (normalized.includes('code')) return 'code';
    if (normalized.includes('wardley')) return 'wardley';

    return 'context';
  }

  /**
   * Get view type from diagram type
   */
  private static getViewType(diagramType: DiagramType): ViewType {
    if (diagramType === 'wardley') return 'wardley';
    if (diagramType === 'context') return 'c4-context';
    if (diagramType === 'container') return 'c4-container';
    if (diagramType === 'component') return 'c4-component';
    return 'custom';
  }

  /**
   * Normalize node type
   */
  private static normalizeNodeType(type: string): NodeType {
    const normalized = type.toLowerCase();

    if (normalized === 'person') return 'person';
    if (normalized === 'system') return 'system';
    if (normalized === 'external-system') return 'external-system';
    if (normalized === 'container') return 'container';
    if (normalized === 'component') return 'component';
    if (normalized === 'code') return 'code';
    if (normalized === 'market') return 'market';
    if (normalized === 'organisation') return 'organisation';
    if (normalized === 'capability') return 'capability';

    // Default to system
    return 'system';
  }

  /**
   * Extract other properties from v1 data
   */
  private static extractOtherProperties(data: any): Record<string, any> {
    const {
      label,
      description,
      technology,
      color,
      linkedDiagramPath,
      ...rest
    } = data;

    return rest;
  }

  /**
   * Get default color for node type
   */
  private static getDefaultColor(type: NodeType): string {
    const colors: Record<NodeType, string> = {
      person: '#08427B',
      system: '#1168BD',
      'external-system': '#999999',
      container: '#438DD5',
      component: '#85BBF0',
      code: '#6366f1',
      market: '#ec4899',
      organisation: '#8b5cf6',
      capability: '#3b82f6',
      'wardley-component': '#3b82f6',
      'wardley-inertia': '#ef4444',
    };
    return colors[type] || '#3b82f6';
  }

  /**
   * Generate unique ID
   */
  private static generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get file name from path
   */
  private static getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Convert v2 format back to v1 (for backward compatibility during transition)
   * NOTE: This is lossy - some v2 features won't convert back
   */
  static convertV2ToV1(
    nodeFile: BAC4FileV2,
    graphFile: BAC4GraphFileV2
  ): BAC4FileV1 {
    console.log('Converting v2 back to v1 format (lossy conversion)...');

    const snapshots: SnapshotV1[] = graphFile.timeline.snapshots.map((snapshot) => {
      const nodes: NodeV1[] = Object.values(nodeFile.nodes).map((node) => {
        const layout = snapshot.layout[node.id];

        return {
          id: node.id,
          type: node.type,
          x: layout?.x || 0,
          y: layout?.y || 0,
          width: layout?.width || 200,
          height: layout?.height || 100,
          data: {
            label: node.properties.label,
            description: node.properties.description,
            technology: node.properties.technology,
            color: node.style.color,
            linkedDiagramPath: node.links.linkedDiagrams[0]?.path,
            ...node.properties,
          },
        };
      });

      const edges: EdgeV1[] = snapshot.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: {
          label: edge.properties.label,
          direction: edge.style.direction,
          ...edge.properties,
        },
        markerEnd: {
          type: edge.style.markerEnd,
          color: edge.style.color,
        },
        sourceHandle: edge.handles.sourceHandle,
        targetHandle: edge.handles.targetHandle,
      }));

      return {
        id: snapshot.id,
        label: snapshot.label,
        timestamp: snapshot.timestamp,
        description: snapshot.description,
        createdAt: snapshot.created,
        nodes,
        edges,
        annotations: snapshot.annotations,
      };
    });

    return {
      version: '2.2.0',
      metadata: {
        diagramType: nodeFile.metadata.diagramType,
        title: nodeFile.metadata.title,
        description: nodeFile.metadata.description,
        createdAt: nodeFile.metadata.created,
        updatedAt: nodeFile.metadata.updated,
      },
      timeline: {
        snapshots,
        currentSnapshotId: graphFile.timeline.currentSnapshotId,
        snapshotOrder: graphFile.timeline.snapshotOrder,
      },
    };
  }

  /**
   * Validate v2 format
   */
  static validateV2Format(
    nodeFile: BAC4FileV2,
    graphFile: BAC4GraphFileV2
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check version
    if (nodeFile.version !== '2.5.0' && nodeFile.version !== '2.5.1') {
      errors.push(`Invalid node file version: ${nodeFile.version}`);
    }
    if (graphFile.version !== '2.5.0' && graphFile.version !== '2.5.1') {
      errors.push(`Invalid graph file version: ${graphFile.version}`);
    }

    // Check required metadata
    if (!nodeFile.metadata.id) errors.push('Node file missing metadata.id');
    if (!nodeFile.metadata.title) errors.push('Node file missing metadata.title');
    if (!nodeFile.metadata.layer) errors.push('Node file missing metadata.layer');

    if (!graphFile.metadata.nodeFile)
      errors.push('Graph file missing metadata.nodeFile');
    if (!graphFile.metadata.viewType)
      errors.push('Graph file missing metadata.viewType');

    // Check nodes
    if (!nodeFile.nodes || typeof nodeFile.nodes !== 'object') {
      errors.push('Node file missing or invalid nodes object');
    }

    // Check timeline
    if (!graphFile.timeline || !graphFile.timeline.snapshots) {
      errors.push('Graph file missing timeline or snapshots');
    }

    // Check that all nodes in layout exist in node file
    for (const snapshot of graphFile.timeline.snapshots || []) {
      for (const nodeId of Object.keys(snapshot.layout || {})) {
        if (!nodeFile.nodes[nodeId]) {
          errors.push(
            `Snapshot ${snapshot.id} references non-existent node: ${nodeId}`
          );
        }
      }
    }

    // Check that all edge nodes exist
    for (const snapshot of graphFile.timeline.snapshots || []) {
      for (const edge of snapshot.edges || []) {
        if (!nodeFile.nodes[edge.source]) {
          errors.push(
            `Edge ${edge.id} references non-existent source node: ${edge.source}`
          );
        }
        if (!nodeFile.nodes[edge.target]) {
          errors.push(
            `Edge ${edge.id} references non-existent target node: ${edge.target}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
