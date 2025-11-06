/**
 * Snapshot Service v3.0.0
 *
 * Manages snapshots within diagrams
 * Handles local nodes and edges (what-if scenarios)
 * Promotes snapshot nodes to global
 *
 * @version 3.0.0
 */

import { Vault } from 'obsidian';
import { DiagramServiceV3 } from './diagram-service-v3';
import { NodeServiceV3 } from './node-service-v3';
import {
  Snapshot,
  LocalNode,
  LocalEdge,
  GlobalNode,
  NodeType,
  generateSnapshotId,
  generateLocalNodeId,
  generateLocalEdgeId,
} from '../types/graph-v3-types';

export class SnapshotServiceV3 {
  private diagramService: DiagramServiceV3;
  private nodeService: NodeServiceV3;
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
    this.diagramService = new DiagramServiceV3(vault);
    this.nodeService = new NodeServiceV3(vault);
  }

  /**
   * Create new snapshot
   */
  async createSnapshot(
    diagramPath: string,
    label: string,
    description: string,
    timestamp: string | null
  ): Promise<Snapshot> {
    const diagram = await this.diagramService.readDiagram(diagramPath);

    // Get current snapshot to copy from
    const currentSnapshot = diagram.snapshots.find((s) => s.id === diagram.currentSnapshotId);

    if (!currentSnapshot) {
      throw new Error('No current snapshot found');
    }

    // Create new snapshot (copy of current)
    const newSnapshot: Snapshot = {
      id: generateSnapshotId(),
      label,
      description,
      timestamp,
      created: new Date().toISOString(),
      isCurrent: false,
      localNodes: { ...currentSnapshot.localNodes },
      layout: { ...currentSnapshot.layout },
      localEdges: [...currentSnapshot.localEdges],
    };

    diagram.snapshots.push(newSnapshot);
    await this.diagramService.writeDiagram(diagramPath, diagram);

    console.log('BAC4 v3.0: Created snapshot:', label);
    return newSnapshot;
  }

  /**
   * Switch to different snapshot
   */
  async switchSnapshot(diagramPath: string, snapshotId: string): Promise<void> {
    const diagram = await this.diagramService.readDiagram(diagramPath);

    const snapshot = diagram.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Update current flags
    diagram.snapshots.forEach((s) => {
      s.isCurrent = s.id === snapshotId;
    });

    diagram.currentSnapshotId = snapshotId;

    await this.diagramService.writeDiagram(diagramPath, diagram);
    console.log('BAC4 v3.0: Switched to snapshot:', snapshotId);
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(diagramPath: string, snapshotId: string): Promise<void> {
    const diagram = await this.diagramService.readDiagram(diagramPath);

    // Can't delete last snapshot
    if (diagram.snapshots.length === 1) {
      throw new Error('Cannot delete last snapshot');
    }

    // Can't delete current snapshot
    if (diagram.currentSnapshotId === snapshotId) {
      throw new Error('Cannot delete current snapshot. Switch to another first.');
    }

    diagram.snapshots = diagram.snapshots.filter((s) => s.id !== snapshotId);
    await this.diagramService.writeDiagram(diagramPath, diagram);

    console.log('BAC4 v3.0: Deleted snapshot:', snapshotId);
  }

  /**
   * Add local node to snapshot
   */
  async addLocalNode(
    diagramPath: string,
    snapshotId: string,
    node: Omit<LocalNode, 'id'>
  ): Promise<LocalNode> {
    const diagram = await this.diagramService.readDiagram(diagramPath);
    const snapshot = diagram.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Check name uniqueness against global nodes
    const nameCheck = await this.nodeService.checkNameUniqueness(node.label);
    if (!nameCheck.isUnique) {
      throw new Error(`Node name "${node.label}" already exists globally`);
    }

    // Check against local nodes in this snapshot
    const localNameExists = Object.values(snapshot.localNodes).some((n) => n.label === node.label);
    if (localNameExists) {
      throw new Error(`Node name "${node.label}" already exists in this snapshot`);
    }

    const localNode: LocalNode = {
      ...node,
      id: generateLocalNodeId(),
    };

    snapshot.localNodes[localNode.id] = localNode;

    // Add default layout
    snapshot.layout[localNode.id] = { x: 250, y: 250 };

    await this.diagramService.writeDiagram(diagramPath, diagram);

    console.log('BAC4 v3.0: Added local node to snapshot:', localNode.label);
    return localNode;
  }

  /**
   * Add local edge to snapshot
   */
  async addLocalEdge(
    diagramPath: string,
    snapshotId: string,
    edge: Omit<LocalEdge, 'id'>
  ): Promise<LocalEdge> {
    const diagram = await this.diagramService.readDiagram(diagramPath);
    const snapshot = diagram.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const localEdge: LocalEdge = {
      ...edge,
      id: generateLocalEdgeId(),
    };

    snapshot.localEdges.push(localEdge);
    await this.diagramService.writeDiagram(diagramPath, diagram);

    console.log('BAC4 v3.0: Added local edge to snapshot');
    return localEdge;
  }

  /**
   * Promote local node to global
   * Moves node from snapshot.localNodes to __graph__.json
   */
  async promoteNodeToGlobal(
    diagramPath: string,
    snapshotId: string,
    localNodeId: string
  ): Promise<GlobalNode> {
    const diagram = await this.diagramService.readDiagram(diagramPath);
    const snapshot = diagram.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const localNode = snapshot.localNodes[localNodeId];
    if (!localNode) {
      throw new Error(`Local node not found: ${localNodeId}`);
    }

    // Create global node
    const globalNode = await this.nodeService.createNode({
      type: localNode.type,
      label: localNode.label,
      description: localNode.description,
      technology: localNode.technology,
      team: localNode.team,
      knowledge: { notes: [], urls: [], attachments: [] },
      metrics: {},
      style: localNode.style,
    });

    // Remove from local nodes
    delete snapshot.localNodes[localNodeId];

    // Update layout to use new global ID
    const layout = snapshot.layout[localNodeId];
    delete snapshot.layout[localNodeId];
    snapshot.layout[globalNode.id] = layout;

    // Update local edges to use new global ID
    for (const edge of snapshot.localEdges) {
      if (edge.source === localNodeId) {
        edge.source = globalNode.id;
      }
      if (edge.target === localNodeId) {
        edge.target = globalNode.id;
      }
    }

    // Add to diagram view
    if (!diagram.view.nodes.includes(globalNode.id)) {
      diagram.view.nodes.push(globalNode.id);
      diagram.view.layout[globalNode.id] = layout;
    }

    await this.diagramService.writeDiagram(diagramPath, diagram);

    console.log('BAC4 v3.0: Promoted local node to global:', localNode.label);
    return globalNode;
  }

  /**
   * Get current snapshot
   */
  async getCurrentSnapshot(diagramPath: string): Promise<Snapshot> {
    const diagram = await this.diagramService.readDiagram(diagramPath);
    const snapshot = diagram.snapshots.find((s) => s.id === diagram.currentSnapshotId);

    if (!snapshot) {
      throw new Error('No current snapshot found');
    }

    return snapshot;
  }

  /**
   * Update snapshot layout
   */
  async updateSnapshotLayout(
    diagramPath: string,
    snapshotId: string,
    layout: Record<string, { x: number; y: number; width?: number; height?: number }>
  ): Promise<void> {
    const diagram = await this.diagramService.readDiagram(diagramPath);
    const snapshot = diagram.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    snapshot.layout = layout;
    await this.diagramService.writeDiagram(diagramPath, diagram);
  }
}
