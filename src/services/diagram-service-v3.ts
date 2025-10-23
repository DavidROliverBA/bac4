/**
 * Diagram Service v3.0.0
 *
 * Manages .bac4 diagram files (views into global nodes)
 * Handles adding/removing nodes from diagrams
 *
 * @version 3.0.0
 */

import { Vault, TFile } from 'obsidian';
import {
  DiagramFileV3,
  DiagramType,
  NodeLayout,
  createEmptyDiagramV3,
  isDiagramFileV3,
} from '../types/graph-v3-types';

export class DiagramServiceV3 {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Read diagram file
   */
  async readDiagram(filePath: string): Promise<DiagramFileV3> {
    const file = this.vault.getAbstractFileByPath(filePath);

    if (!(file instanceof TFile)) {
      throw new Error(`Diagram file not found: ${filePath}`);
    }

    const content = await this.vault.read(file);
    const data = JSON.parse(content);

    if (!isDiagramFileV3(data)) {
      throw new Error(`Invalid diagram format: ${filePath}`);
    }

    return data;
  }

  /**
   * Write diagram file
   */
  async writeDiagram(filePath: string, diagram: DiagramFileV3): Promise<void> {
    diagram.metadata.updated = new Date().toISOString();

    const content = JSON.stringify(diagram, null, 2);
    const file = this.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      await this.vault.modify(file, content);
    } else {
      await this.vault.create(filePath, content);
    }

    console.log('BAC4 v3.0: Wrote diagram:', filePath);
  }

  /**
   * Create new diagram
   */
  async createDiagram(
    filePath: string,
    name: string,
    type: DiagramType
  ): Promise<DiagramFileV3> {
    const diagram = createEmptyDiagramV3(name, type);
    await this.writeDiagram(filePath, diagram);
    return diagram;
  }

  /**
   * Add node to diagram view
   */
  async addNodeToDiagram(
    filePath: string,
    nodeId: string,
    layout?: NodeLayout
  ): Promise<void> {
    const diagram = await this.readDiagram(filePath);

    // Check if node already in view
    if (diagram.view.nodes.includes(nodeId)) {
      console.warn('BAC4 v3.0: Node already in diagram:', nodeId);
      return;
    }

    // Add to view
    diagram.view.nodes.push(nodeId);

    // Add layout
    if (layout) {
      diagram.view.layout[nodeId] = layout;
    } else {
      // Default center position
      diagram.view.layout[nodeId] = { x: 250, y: 250 };
    }

    // Also add to current snapshot layout
    const currentSnapshot = diagram.snapshots.find(
      (s) => s.id === diagram.currentSnapshotId
    );
    if (currentSnapshot) {
      if (layout) {
        currentSnapshot.layout[nodeId] = layout;
      } else {
        currentSnapshot.layout[nodeId] = { x: 250, y: 250 };
      }
    }

    await this.writeDiagram(filePath, diagram);
    console.log('BAC4 v3.0: Added node to diagram:', nodeId, '→', filePath);
  }

  /**
   * Remove node from diagram view only
   * Does NOT delete from __graph__.json
   */
  async removeNodeFromDiagram(filePath: string, nodeId: string): Promise<void> {
    const diagram = await this.readDiagram(filePath);

    // Remove from view
    diagram.view.nodes = diagram.view.nodes.filter((id) => id !== nodeId);

    // Remove from layout
    delete diagram.view.layout[nodeId];

    // Remove from all snapshots
    for (const snapshot of diagram.snapshots) {
      delete snapshot.layout[nodeId];
    }

    await this.writeDiagram(filePath, diagram);
    console.log('BAC4 v3.0: Removed node from diagram:', nodeId, 'from', filePath);
  }

  /**
   * Update node layout in diagram
   */
  async updateNodeLayout(
    filePath: string,
    nodeId: string,
    layout: NodeLayout
  ): Promise<void> {
    const diagram = await this.readDiagram(filePath);

    // Update in view
    diagram.view.layout[nodeId] = layout;

    // Update in current snapshot
    const currentSnapshot = diagram.snapshots.find(
      (s) => s.id === diagram.currentSnapshotId
    );
    if (currentSnapshot) {
      currentSnapshot.layout[nodeId] = layout;
    }

    await this.writeDiagram(filePath, diagram);
  }

  /**
   * Update viewport
   */
  async updateViewport(
    filePath: string,
    viewport: { x: number; y: number; zoom: number }
  ): Promise<void> {
    const diagram = await this.readDiagram(filePath);
    diagram.view.viewport = viewport;
    await this.writeDiagram(filePath, diagram);
  }

  /**
   * Get all diagrams using a specific node
   */
  async getDiagramsUsingNode(nodeId: string): Promise<string[]> {
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
            Array.isArray(diagramData.view.nodes) &&
            diagramData.view.nodes.includes(nodeId)
          ) {
            diagrams.push(file.path);
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    }

    return diagrams;
  }

  /**
   * Remove node from all diagrams
   * Used when globally deleting a node
   */
  async removeNodeFromAllDiagrams(nodeId: string): Promise<string[]> {
    const diagrams = await this.getDiagramsUsingNode(nodeId);

    for (const diagramPath of diagrams) {
      await this.removeNodeFromDiagram(diagramPath, nodeId);
    }

    return diagrams;
  }

  /**
   * Get all diagram files
   */
  async getAllDiagrams(): Promise<
    Array<{ path: string; metadata: DiagramFileV3['metadata'] }>
  > {
    const diagrams: Array<{ path: string; metadata: DiagramFileV3['metadata'] }> = [];
    const allFiles = this.vault.getFiles();

    for (const file of allFiles) {
      if (file.extension === 'bac4') {
        try {
          const content = await this.vault.read(file);
          const diagramData = JSON.parse(content);

          if (diagramData.version === '3.0.0' && diagramData.metadata) {
            diagrams.push({
              path: file.path,
              metadata: diagramData.metadata,
            });
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    }

    return diagrams;
  }
}
