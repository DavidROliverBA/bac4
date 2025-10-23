/**
 * Node Service v3.0.0
 *
 * Manages global nodes in __graph__.json
 * Enforces unique node names
 * Tracks node usage across diagrams
 *
 * @version 3.0.0
 */

import { Vault } from 'obsidian';
import { GraphServiceV3 } from './graph-service-v3';
import {
  GlobalNode,
  NodeType,
  NameCheckResult,
  NodeDeletionInfo,
  NodeUsage,
  generateNodeId,
} from '../types/graph-v3-types';

export class NodeServiceV3 {
  private graphService: GraphServiceV3;
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
    this.graphService = new GraphServiceV3(vault);
  }

  /**
   * Check if node name is unique
   * Returns existing node if name collision
   */
  async checkNameUniqueness(label: string, excludeNodeId?: string): Promise<NameCheckResult> {
    const graph = await this.graphService.readGraph();

    // Find node with same label
    const existingNode = Object.values(graph.nodes).find(
      (node) => node.label === label && node.id !== excludeNodeId
    );

    if (existingNode) {
      // Count usage
      const usage = await this.getNodeUsage(existingNode.id);

      return {
        isUnique: false,
        existingNode,
        usageCount: usage.diagrams.length,
      };
    }

    return { isUnique: true };
  }

  /**
   * Create new global node
   * Validates name uniqueness first
   */
  async createNode(node: Omit<GlobalNode, 'id' | 'created' | 'updated'>): Promise<GlobalNode> {
    // Check name uniqueness
    const nameCheck = await this.checkNameUniqueness(node.label);
    if (!nameCheck.isUnique) {
      throw new Error(`Node name "${node.label}" already exists`);
    }

    const now = new Date().toISOString();
    const newNode: GlobalNode = {
      ...node,
      id: generateNodeId(),
      created: now,
      updated: now,
    };

    await this.graphService.update((graph) => {
      graph.nodes[newNode.id] = newNode;
      return graph;
    });

    console.log('BAC4 v3.0: Created node:', newNode.label);
    return newNode;
  }

  /**
   * Get node by ID
   */
  async getNode(nodeId: string): Promise<GlobalNode | null> {
    const graph = await this.graphService.readGraph();
    return graph.nodes[nodeId] || null;
  }

  /**
   * Get all nodes
   */
  async getAllNodes(): Promise<GlobalNode[]> {
    const graph = await this.graphService.readGraph();
    return Object.values(graph.nodes);
  }

  /**
   * Get nodes filtered by type
   */
  async getNodesByType(type: NodeType): Promise<GlobalNode[]> {
    const graph = await this.graphService.readGraph();
    return Object.values(graph.nodes).filter((node) => node.type === type);
  }

  /**
   * Update node properties
   * Validates name uniqueness if label changed
   */
  async updateNode(
    nodeId: string,
    updates: Partial<Omit<GlobalNode, 'id' | 'created'>>
  ): Promise<GlobalNode> {
    const graph = await this.graphService.readGraph();
    const existingNode = graph.nodes[nodeId];

    if (!existingNode) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // If label changed, check uniqueness
    if (updates.label && updates.label !== existingNode.label) {
      const nameCheck = await this.checkNameUniqueness(updates.label, nodeId);
      if (!nameCheck.isUnique) {
        throw new Error(`Node name "${updates.label}" already exists`);
      }
    }

    await this.graphService.update((graph) => {
      const node = graph.nodes[nodeId];
      graph.nodes[nodeId] = {
        ...node,
        ...updates,
        updated: new Date().toISOString(),
      };
      return graph;
    });

    const updatedGraph = await this.graphService.readGraph();
    return updatedGraph.nodes[nodeId];
  }

  /**
   * Delete node globally
   * Removes from __graph__.json and all related edges
   */
  async deleteNode(nodeId: string): Promise<void> {
    await this.graphService.update((graph) => {
      // Delete node
      delete graph.nodes[nodeId];

      // Delete edges involving this node
      graph.relationships.edges = graph.relationships.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      // Delete hierarchy relationships
      graph.relationships.hierarchy = graph.relationships.hierarchy.filter(
        (rel) => rel.parentNodeId !== nodeId
      );

      return graph;
    });

    console.log('BAC4 v3.0: Deleted node globally:', nodeId);
  }

  /**
   * Get deletion info for node
   * Shows which diagrams use it and which edges involve it
   */
  async getNodeDeletionInfo(nodeId: string): Promise<NodeDeletionInfo> {
    const graph = await this.graphService.readGraph();
    const node = graph.nodes[nodeId];

    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const usage = await this.getNodeUsage(nodeId);

    // Get edges involving this node
    const edges = graph.relationships.edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );

    return {
      node,
      diagramCount: usage.diagrams.length,
      diagrams: usage.diagrams,
      edgeCount: edges.length,
      edges,
    };
  }

  /**
   * Get node usage info
   * Shows which diagrams use this node and which edges involve it
   */
  async getNodeUsage(nodeId: string): Promise<NodeUsage> {
    const graph = await this.graphService.readGraph();

    // Find edges
    const edgesAsSource = graph.relationships.edges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.id);

    const edgesAsTarget = graph.relationships.edges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => edge.id);

    // Find diagrams - need to scan all .bac4 files
    const diagrams: string[] = [];
    const allFiles = this.vault.getFiles();

    for (const file of allFiles) {
      if (file.extension === 'bac4') {
        try {
          const content = await this.vault.read(file);
          const diagramData = JSON.parse(content);

          // Check if this diagram uses the node
          if (
            diagramData.version === '3.0.0' &&
            diagramData.view &&
            Array.isArray(diagramData.view.nodes)
          ) {
            if (diagramData.view.nodes.includes(nodeId)) {
              diagrams.push(file.path);
            }
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    }

    return {
      nodeId,
      diagrams,
      edgesAsSource,
      edgesAsTarget,
    };
  }

  /**
   * Search nodes by label or description
   */
  async searchNodes(query: string): Promise<GlobalNode[]> {
    const graph = await this.graphService.readGraph();
    const lowerQuery = query.toLowerCase();

    return Object.values(graph.nodes).filter(
      (node) =>
        node.label.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery) ||
        node.technology?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get nodes not used in any diagram (orphans)
   */
  async getOrphanedNodes(): Promise<GlobalNode[]> {
    const graph = await this.graphService.readGraph();
    const orphans: GlobalNode[] = [];

    for (const node of Object.values(graph.nodes)) {
      const usage = await this.getNodeUsage(node.id);
      if (usage.diagrams.length === 0) {
        orphans.push(node);
      }
    }

    return orphans;
  }
}
