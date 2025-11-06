/**
 * Node Registry Service
 *
 * Tracks all node names across all diagrams in the vault to:
 * 1. Prevent duplicate node names when creating new nodes
 * 2. Detect when user renames a node to match an existing node
 * 3. Provide cross-references showing which diagrams use which nodes
 *
 * @module node-registry-service
 */

import { TFile, Vault } from 'obsidian';
import type { Node } from 'reactflow';
import type { CanvasNodeData } from '../types/canvas-types';

/**
 * Represents a node reference in a specific diagram
 */
export interface NodeReference {
  /** Node ID within the diagram */
  nodeId: string;
  /** Path to the diagram file */
  diagramPath: string;
  /** Display name of the diagram */
  diagramName: string;
  /** Type of node */
  nodeType: string;
  /** Node label/name */
  label: string;
}

/**
 * Registry entry for a node name
 */
export interface NodeRegistryEntry {
  /** Normalized node name (lowercase, trimmed) */
  normalizedName: string;
  /** All references to this node name across diagrams */
  references: NodeReference[];
}

/**
 * Service for tracking node names across all diagrams
 */
export class NodeRegistryService {
  private static instance: NodeRegistryService | null = null;
  private registry: Map<string, NodeRegistryEntry> = new Map();
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NodeRegistryService {
    if (!this.instance) {
      this.instance = new NodeRegistryService();
    }
    return this.instance;
  }

  /**
   * Initialize the registry by scanning all diagrams
   */
  async initialize(vault: Vault): Promise<void> {
    console.log('BAC4 NodeRegistry: Initializing...');
    this.registry.clear();

    // Get all .bac4 files
    const allFiles = vault.getFiles();
    const diagramFiles = allFiles.filter((file) => file.extension === 'bac4');

    console.log(`BAC4 NodeRegistry: Found ${diagramFiles.length} diagram files`);

    // Parse each diagram and register nodes
    for (const file of diagramFiles) {
      await this.scanDiagram(vault, file);
    }

    this.initialized = true;
    console.log(`BAC4 NodeRegistry: Initialized with ${this.registry.size} unique node names`);
  }

  /**
   * Scan a single diagram and register its nodes
   */
  async scanDiagram(vault: Vault, file: TFile): Promise<void> {
    try {
      const content = await vault.read(file);
      const data = JSON.parse(content);

      let nodes: Node<CanvasNodeData>[] = [];

      // v1.0.0 format: nodes are in timeline snapshots
      if (data.timeline && data.timeline.snapshots && Array.isArray(data.timeline.snapshots)) {
        const currentSnapshotId = data.timeline.currentSnapshotId;
        const currentSnapshot = data.timeline.snapshots.find(
          (s: any) => s.id === currentSnapshotId
        );

        if (currentSnapshot && currentSnapshot.nodes && Array.isArray(currentSnapshot.nodes)) {
          nodes = currentSnapshot.nodes;
        }
      }
      // Legacy format: nodes at top level
      else if (data.nodes && Array.isArray(data.nodes)) {
        nodes = data.nodes;
      }

      // Register each node
      for (const node of nodes) {
        if (node.data && node.data.label) {
          this.registerNode(
            node.id,
            node.data.label,
            file.path,
            file.basename,
            node.type || 'unknown'
          );
        }
      }
    } catch (error) {
      console.error('BAC4 NodeRegistry: Error scanning diagram', file.path, error);
    }
  }

  /**
   * Register a node in the registry
   */
  private registerNode(
    nodeId: string,
    label: string,
    diagramPath: string,
    diagramName: string,
    nodeType: string
  ): void {
    const normalizedName = this.normalizeName(label);

    let entry = this.registry.get(normalizedName);
    if (!entry) {
      entry = {
        normalizedName,
        references: [],
      };
      this.registry.set(normalizedName, entry);
    }

    // Check if this reference already exists (avoid duplicates)
    const existingRef = entry.references.find(
      (ref) => ref.nodeId === nodeId && ref.diagramPath === diagramPath
    );

    if (!existingRef) {
      entry.references.push({
        nodeId,
        diagramPath,
        diagramName,
        nodeType,
        label,
      });
    }
  }

  /**
   * Unregister a node from the registry
   */
  unregisterNode(nodeId: string, label: string, diagramPath: string): void {
    const normalizedName = this.normalizeName(label);
    const entry = this.registry.get(normalizedName);

    if (entry) {
      entry.references = entry.references.filter(
        (ref) => !(ref.nodeId === nodeId && ref.diagramPath === diagramPath)
      );

      // If no more references, remove the entry
      if (entry.references.length === 0) {
        this.registry.delete(normalizedName);
      }
    }
  }

  /**
   * Update a node's name in the registry
   */
  updateNodeName(
    nodeId: string,
    oldLabel: string,
    newLabel: string,
    diagramPath: string,
    diagramName: string,
    nodeType: string
  ): void {
    // Unregister old name
    this.unregisterNode(nodeId, oldLabel, diagramPath);

    // Register new name
    this.registerNode(nodeId, newLabel, diagramPath, diagramName, nodeType);
  }

  /**
   * Check if a node name already exists
   */
  nameExists(label: string): boolean {
    const normalizedName = this.normalizeName(label);
    return this.registry.has(normalizedName);
  }

  /**
   * Get all references to a node name
   */
  getReferences(label: string): NodeReference[] {
    const normalizedName = this.normalizeName(label);
    const entry = this.registry.get(normalizedName);
    return entry ? [...entry.references] : [];
  }

  /**
   * Get references excluding a specific diagram
   */
  getReferencesExcludingDiagram(label: string, excludeDiagramPath: string): NodeReference[] {
    const allRefs = this.getReferences(label);
    return allRefs.filter((ref) => ref.diagramPath !== excludeDiagramPath);
  }

  /**
   * Generate a unique name by auto-incrementing
   * E.g., "System 1" -> "System 2" if "System 1" exists
   */
  generateUniqueName(baseName: string): string {
    if (!this.nameExists(baseName)) {
      return baseName;
    }

    // Try to extract number from end of name
    const match = baseName.match(/^(.*?)(\d+)$/);
    let prefix: string;
    let startNum: number;

    if (match) {
      prefix = match[1].trim();
      startNum = parseInt(match[2], 10);
    } else {
      prefix = baseName;
      startNum = 1;
    }

    // Find next available number
    let num = startNum;
    let candidateName: string;
    do {
      num++;
      candidateName = `${prefix} ${num}`;
    } while (this.nameExists(candidateName));

    return candidateName;
  }

  /**
   * Normalize a name for comparison (lowercase, trimmed)
   */
  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get total number of unique node names
   */
  getUniqueNodeCount(): number {
    return this.registry.size;
  }

  /**
   * Get all unique node names
   */
  getAllNodeNames(): string[] {
    const names: string[] = [];
    this.registry.forEach((entry) => {
      if (entry.references.length > 0) {
        names.push(entry.references[0].label); // Use original case from first reference
      }
    });
    return names.sort();
  }

  /**
   * Refresh the registry (re-scan all diagrams)
   */
  async refresh(vault: Vault): Promise<void> {
    await this.initialize(vault);
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.registry.clear();
    this.initialized = false;
  }
}
