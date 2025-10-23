/**
 * Hydration Service v3.0.0
 *
 * Converts between v3.0.0 data format and React Flow format
 * Hydration: __graph__.json + .bac4 → React Flow nodes/edges
 * Dehydration: React Flow nodes/edges → __graph__.json + .bac4
 *
 * @version 3.0.0
 */

import { Node, Edge } from 'reactflow';
import { Vault } from 'obsidian';
import { GraphServiceV3 } from './graph-service-v3';
import { EdgeServiceV3 } from './edge-service-v3';
import { DiagramServiceV3 } from './diagram-service-v3';
import {
  GraphFileV3,
  DiagramFileV3,
  Snapshot,
  GlobalNode,
  GlobalEdge,
  HydratedNode,
  HydratedEdge,
  isLocalNodeId,
  isLocalEdgeId,
} from '../types/graph-v3-types';

export class HydrationServiceV3 {
  private graphService: GraphServiceV3;
  private edgeService: EdgeServiceV3;
  private diagramService: DiagramServiceV3;

  constructor(vault: Vault) {
    this.graphService = new GraphServiceV3(vault);
    this.edgeService = new EdgeServiceV3(vault);
    this.diagramService = new DiagramServiceV3(vault);
  }

  /**
   * Hydrate: Load diagram and convert to React Flow format
   */
  async hydrateDiagram(
    diagramPath: string
  ): Promise<{ nodes: Node[]; edges: Edge[] }> {
    const [graph, diagram] = await Promise.all([
      this.graphService.readGraph(),
      this.diagramService.readDiagram(diagramPath),
    ]);

    // Get current snapshot
    const snapshot = diagram.snapshots.find(
      (s) => s.id === diagram.currentSnapshotId
    );

    if (!snapshot) {
      throw new Error('No current snapshot found');
    }

    // Hydrate nodes
    const nodes = this.hydrateNodes(graph, diagram, snapshot);

    // Hydrate edges
    const edges = this.hydrateEdges(graph, diagram, snapshot);

    return { nodes, edges };
  }

  /**
   * Hydrate nodes: Combine global nodes + local nodes with layout
   */
  private hydrateNodes(
    graph: GraphFileV3,
    diagram: DiagramFileV3,
    snapshot: Snapshot
  ): Node[] {
    const nodes: Node[] = [];

    // Hydrate global nodes (from diagram.view.nodes)
    for (const nodeId of diagram.view.nodes) {
      const globalNode = graph.nodes[nodeId];
      if (!globalNode) {
        console.warn('BAC4 v3.0: Global node not found:', nodeId);
        continue;
      }

      const layout = snapshot.layout[nodeId] || { x: 0, y: 0 };

      nodes.push({
        id: nodeId,
        type: globalNode.type,
        position: { x: layout.x, y: layout.y },
        width: layout.width,
        height: layout.height,
        data: {
          label: globalNode.label,
          description: globalNode.description,
          technology: globalNode.technology,
          team: globalNode.team,
          knowledge: globalNode.knowledge,
          metrics: globalNode.metrics,
          color: globalNode.style.color,
          icon: globalNode.style.icon,
          shape: globalNode.style.shape,
          isLocal: false,
        },
      });
    }

    // Hydrate local nodes (from snapshot.localNodes)
    for (const localNode of Object.values(snapshot.localNodes)) {
      const layout = snapshot.layout[localNode.id] || { x: 0, y: 0 };

      nodes.push({
        id: localNode.id,
        type: localNode.type,
        position: { x: layout.x, y: layout.y },
        width: layout.width,
        height: layout.height,
        data: {
          label: localNode.label,
          description: localNode.description,
          technology: localNode.technology,
          team: localNode.team,
          knowledge: { notes: [], urls: [], attachments: [] },
          metrics: {},
          color: localNode.style.color,
          icon: localNode.style.icon,
          shape: localNode.style.shape,
          isLocal: true, // Mark as snapshot-specific
        },
      });
    }

    return nodes;
  }

  /**
   * Hydrate edges: Filter global edges + add local edges
   */
  private hydrateEdges(
    graph: GraphFileV3,
    diagram: DiagramFileV3,
    snapshot: Snapshot
  ): Edge[] {
    const edges: Edge[] = [];
    const nodeIds = new Set([
      ...diagram.view.nodes,
      ...Object.keys(snapshot.localNodes),
    ]);

    // Hydrate global edges (only if both nodes are on this diagram)
    for (const globalEdge of graph.relationships.edges) {
      if (nodeIds.has(globalEdge.source) && nodeIds.has(globalEdge.target)) {
        edges.push(this.globalEdgeToReactFlow(globalEdge));
      }
    }

    // Hydrate local edges (from snapshot)
    for (const localEdge of snapshot.localEdges) {
      edges.push(this.localEdgeToReactFlow(localEdge));
    }

    return edges;
  }

  /**
   * Convert global edge to React Flow format
   */
  private globalEdgeToReactFlow(edge: GlobalEdge): Edge {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: {
        label: edge.label,
        direction: edge.direction,
        isLocal: false,
      },
      style: {
        stroke: edge.style.color,
        strokeWidth: edge.style.strokeWidth,
        strokeDasharray:
          edge.style.lineType === 'dashed'
            ? '5 5'
            : edge.style.lineType === 'dotted'
            ? '2 2'
            : undefined,
      },
      markerEnd: edge.direction !== 'left' ? 'arrowclosed' : undefined,
      markerStart: edge.direction === 'left' || edge.direction === 'both' ? 'arrowclosed' : undefined,
    };
  }

  /**
   * Convert local edge to React Flow format
   */
  private localEdgeToReactFlow(edge: any): Edge {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: {
        label: edge.label,
        direction: edge.direction,
        isLocal: true, // Mark as snapshot-specific
      },
      style: {
        stroke: edge.style.color,
        strokeWidth: edge.style.strokeWidth,
        strokeDasharray:
          edge.style.lineType === 'dashed'
            ? '5 5'
            : edge.style.lineType === 'dotted'
            ? '2 2'
            : undefined,
      },
      markerEnd: edge.direction !== 'left' ? 'arrowclosed' : undefined,
      markerStart: edge.direction === 'left' || edge.direction === 'both' ? 'arrowclosed' : undefined,
    };
  }

  /**
   * Dehydrate: Save React Flow nodes/edges back to v3.0.0 format
   */
  async dehydrateDiagram(
    diagramPath: string,
    reactFlowNodes: Node[],
    reactFlowEdges: Edge[]
  ): Promise<void> {
    const [graph, diagram] = await Promise.all([
      this.graphService.readGraph(),
      this.diagramService.readDiagram(diagramPath),
    ]);

    // Get current snapshot
    const snapshot = diagram.snapshots.find(
      (s) => s.id === diagram.currentSnapshotId
    );

    if (!snapshot) {
      throw new Error('No current snapshot found');
    }

    // Update global nodes
    await this.dehydrateNodes(graph, reactFlowNodes);

    // Update diagram layout
    await this.dehydrateLayout(diagram, snapshot, reactFlowNodes);

    // Update global edges
    await this.dehydrateEdges(graph, snapshot, reactFlowEdges);

    // Save diagram
    await this.diagramService.writeDiagram(diagramPath, diagram);
  }

  /**
   * Dehydrate nodes: Update global nodes in __graph__.json
   */
  private async dehydrateNodes(
    graph: GraphFileV3,
    reactFlowNodes: Node[]
  ): Promise<void> {
    // Track which nodes need updating
    const nodesToUpdate: GlobalNode[] = [];

    for (const reactNode of reactFlowNodes) {
      // Skip local nodes (they're in snapshot)
      if (reactNode.data.isLocal) continue;

      const globalNode = graph.nodes[reactNode.id];
      if (!globalNode) continue;

      // Check if any properties changed
      const needsUpdate =
        globalNode.label !== reactNode.data.label ||
        globalNode.description !== reactNode.data.description ||
        globalNode.technology !== reactNode.data.technology ||
        globalNode.team !== reactNode.data.team ||
        globalNode.style.color !== reactNode.data.color ||
        globalNode.style.icon !== reactNode.data.icon;

      if (needsUpdate) {
        nodesToUpdate.push({
          ...globalNode,
          label: reactNode.data.label,
          description: reactNode.data.description,
          technology: reactNode.data.technology,
          team: reactNode.data.team,
          knowledge: reactNode.data.knowledge,
          metrics: reactNode.data.metrics,
          style: {
            color: reactNode.data.color,
            icon: reactNode.data.icon,
            shape: reactNode.data.shape,
          },
          updated: new Date().toISOString(),
        });
      }
    }

    // Update in batch
    if (nodesToUpdate.length > 0) {
      await this.graphService.update((graph) => {
        for (const node of nodesToUpdate) {
          graph.nodes[node.id] = node;
        }
        return graph;
      });
    }
  }

  /**
   * Dehydrate layout: Update node positions in diagram
   */
  private async dehydrateLayout(
    diagram: DiagramFileV3,
    snapshot: Snapshot,
    reactFlowNodes: Node[]
  ): Promise<void> {
    for (const reactNode of reactFlowNodes) {
      const layout = {
        x: reactNode.position.x,
        y: reactNode.position.y,
        width: reactNode.width,
        height: reactNode.height,
      };

      // Update in view
      diagram.view.layout[reactNode.id] = layout;

      // Update in snapshot
      snapshot.layout[reactNode.id] = layout;
    }
  }

  /**
   * Dehydrate edges: Update global edges in __graph__.json
   */
  private async dehydrateEdges(
    graph: GraphFileV3,
    snapshot: Snapshot,
    reactFlowEdges: Edge[]
  ): Promise<void> {
    const edgesToUpdate: GlobalEdge[] = [];
    const localEdgesToUpdate: any[] = [];

    for (const reactEdge of reactFlowEdges) {
      const isLocal = reactEdge.data?.isLocal || isLocalEdgeId(reactEdge.id);

      if (isLocal) {
        // Update local edge in snapshot
        const localEdge = snapshot.localEdges.find((e) => e.id === reactEdge.id);
        if (localEdge) {
          localEdge.label = reactEdge.data?.label;
          localEdge.direction = reactEdge.data?.direction || 'right';
          localEdge.style.color = (reactEdge.style?.stroke as string) || '#888888';
        }
      } else {
        // Update global edge
        const globalEdge = graph.relationships.edges.find((e) => e.id === reactEdge.id);
        if (globalEdge) {
          const needsUpdate =
            globalEdge.label !== reactEdge.data?.label ||
            globalEdge.direction !== reactEdge.data?.direction ||
            globalEdge.style.color !== reactEdge.style?.stroke;

          if (needsUpdate) {
            edgesToUpdate.push({
              ...globalEdge,
              label: reactEdge.data?.label,
              direction: reactEdge.data?.direction || 'right',
              style: {
                ...globalEdge.style,
                color: (reactEdge.style?.stroke as string) || '#888888',
              },
              updated: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Update global edges in batch
    if (edgesToUpdate.length > 0) {
      await this.graphService.update((graph) => {
        for (const edge of edgesToUpdate) {
          const index = graph.relationships.edges.findIndex((e) => e.id === edge.id);
          if (index !== -1) {
            graph.relationships.edges[index] = edge;
          }
        }
        return graph;
      });
    }
  }
}
