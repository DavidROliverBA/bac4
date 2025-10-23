/**
 * Edge Service v3.0.0
 *
 * Manages global edges in __graph__.json
 * Tracks which diagrams display each edge
 *
 * @version 3.0.0
 */

import { Vault } from 'obsidian';
import { GraphServiceV3 } from './graph-service-v3';
import {
  GlobalEdge,
  EdgeType,
  Direction,
  EdgeChangeInfo,
  generateEdgeId,
} from '../types/graph-v3-types';

export class EdgeServiceV3 {
  private graphService: GraphServiceV3;
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
    this.graphService = new GraphServiceV3(vault);
  }

  /**
   * Create new global edge
   */
  async createEdge(
    edge: Omit<GlobalEdge, 'id' | 'created' | 'updated'>
  ): Promise<GlobalEdge> {
    const now = new Date().toISOString();
    const newEdge: GlobalEdge = {
      ...edge,
      id: generateEdgeId(),
      created: now,
      updated: now,
    };

    await this.graphService.update((graph) => {
      graph.relationships.edges.push(newEdge);
      return graph;
    });

    console.log('BAC4 v3.0: Created edge:', newEdge.id);
    return newEdge;
  }

  /**
   * Get edge by ID
   */
  async getEdge(edgeId: string): Promise<GlobalEdge | null> {
    const graph = await this.graphService.readGraph();
    return graph.relationships.edges.find((e) => e.id === edgeId) || null;
  }

  /**
   * Get all edges
   */
  async getAllEdges(): Promise<GlobalEdge[]> {
    const graph = await this.graphService.readGraph();
    return graph.relationships.edges;
  }

  /**
   * Get edges involving a specific node
   */
  async getEdgesForNode(nodeId: string): Promise<GlobalEdge[]> {
    const graph = await this.graphService.readGraph();
    return graph.relationships.edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
  }

  /**
   * Update edge properties
   */
  async updateEdge(
    edgeId: string,
    updates: Partial<Omit<GlobalEdge, 'id' | 'created'>>
  ): Promise<GlobalEdge> {
    await this.graphService.update((graph) => {
      const index = graph.relationships.edges.findIndex((e) => e.id === edgeId);

      if (index === -1) {
        throw new Error(`Edge not found: ${edgeId}`);
      }

      graph.relationships.edges[index] = {
        ...graph.relationships.edges[index],
        ...updates,
        updated: new Date().toISOString(),
      };

      return graph;
    });

    const updatedGraph = await this.graphService.readGraph();
    return updatedGraph.relationships.edges.find((e) => e.id === edgeId)!;
  }

  /**
   * Delete edge globally
   */
  async deleteEdge(edgeId: string): Promise<void> {
    await this.graphService.update((graph) => {
      graph.relationships.edges = graph.relationships.edges.filter(
        (edge) => edge.id !== edgeId
      );
      return graph;
    });

    console.log('BAC4 v3.0: Deleted edge globally:', edgeId);
  }

  /**
   * Get edge change info
   * Shows which diagrams would be affected by changing/deleting this edge
   */
  async getEdgeChangeInfo(edgeId: string): Promise<EdgeChangeInfo> {
    const graph = await this.graphService.readGraph();
    const edge = graph.relationships.edges.find((e) => e.id === edgeId);

    if (!edge) {
      throw new Error(`Edge not found: ${edgeId}`);
    }

    // Find diagrams that show both source and target nodes
    const diagrams: string[] = [];
    const allFiles = this.vault.getFiles();

    for (const file of allFiles) {
      if (file.extension === 'bac4') {
        try {
          const content = await this.vault.read(file);
          const diagramData = JSON.parse(content);

          if (
            diagramData.version === '3.0.0' &&
            diagramData.view &&
            Array.isArray(diagramData.view.nodes)
          ) {
            const hasSource = diagramData.view.nodes.includes(edge.source);
            const hasTarget = diagramData.view.nodes.includes(edge.target);

            if (hasSource && hasTarget) {
              diagrams.push(file.path);
            }
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    }

    return {
      edge,
      diagramCount: diagrams.length,
      diagrams,
    };
  }

  /**
   * Get edges that should be displayed on a diagram
   * Returns edges where both source and target are in the given node list
   */
  async getEdgesForDiagram(nodeIds: string[]): Promise<GlobalEdge[]> {
    const graph = await this.graphService.readGraph();
    const nodeSet = new Set(nodeIds);

    return graph.relationships.edges.filter(
      (edge) => nodeSet.has(edge.source) && nodeSet.has(edge.target)
    );
  }

  /**
   * Find edge between two nodes
   */
  async findEdge(sourceId: string, targetId: string): Promise<GlobalEdge | null> {
    const graph = await this.graphService.readGraph();
    return (
      graph.relationships.edges.find(
        (edge) => edge.source === sourceId && edge.target === targetId
      ) || null
    );
  }

  /**
   * Get orphaned edges (where source or target node no longer exists)
   */
  async getOrphanedEdges(): Promise<GlobalEdge[]> {
    const graph = await this.graphService.readGraph();
    const orphans: GlobalEdge[] = [];

    for (const edge of graph.relationships.edges) {
      const sourceExists = !!graph.nodes[edge.source];
      const targetExists = !!graph.nodes[edge.target];

      if (!sourceExists || !targetExists) {
        orphans.push(edge);
      }
    }

    return orphans;
  }

  /**
   * Clean up orphaned edges
   */
  async cleanupOrphanedEdges(): Promise<number> {
    let cleanedCount = 0;

    await this.graphService.update((graph) => {
      const originalCount = graph.relationships.edges.length;

      graph.relationships.edges = graph.relationships.edges.filter((edge) => {
        const sourceExists = !!graph.nodes[edge.source];
        const targetExists = !!graph.nodes[edge.target];
        return sourceExists && targetExists;
      });

      cleanedCount = originalCount - graph.relationships.edges.length;
      return graph;
    });

    if (cleanedCount > 0) {
      console.log('BAC4 v3.0: Cleaned up', cleanedCount, 'orphaned edges');
    }

    return cleanedCount;
  }
}
