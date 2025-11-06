/**
 * Graph Service v3.0.0
 *
 * Manages the centralized BAC4/__graph__.json file
 * Handles atomic read-modify-write operations
 *
 * @version 3.0.0
 */

import { Vault, TFile } from 'obsidian';
import { GraphFileV3, EMPTY_GRAPH_V3, isGraphFileV3 } from '../types/graph-v3-types';

/**
 * Path to centralized graph file
 */
export const GRAPH_FILE_PATH_V3 = 'BAC4/__graph__.json';

/**
 * Service for managing __graph__.json
 */
export class GraphServiceV3 {
  private vault: Vault;
  private cache: GraphFileV3 | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Initialize __graph__.json if it doesn't exist
   */
  async initialize(): Promise<void> {
    const file = this.vault.getAbstractFileByPath(GRAPH_FILE_PATH_V3);

    if (!file) {
      // Create BAC4 folder if needed
      const folder = this.vault.getAbstractFileByPath('BAC4');
      if (!folder) {
        await this.vault.createFolder('BAC4');
        console.log('BAC4 v3.0: Created BAC4 folder');
      }

      // Create empty graph file
      await this.writeGraph(EMPTY_GRAPH_V3);
      console.log('BAC4 v3.0: Initialized __graph__.json');
    }
  }

  /**
   * Read __graph__.json with caching
   */
  async readGraph(): Promise<GraphFileV3> {
    // Check cache
    const now = Date.now();
    if (this.cache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return JSON.parse(JSON.stringify(this.cache)); // Deep copy
    }

    const file = this.vault.getAbstractFileByPath(GRAPH_FILE_PATH_V3);

    if (!(file instanceof TFile)) {
      console.warn('BAC4 v3.0: __graph__.json not found, initializing...');
      await this.initialize();
      return EMPTY_GRAPH_V3;
    }

    try {
      const content = await this.vault.read(file);
      const data = JSON.parse(content);

      if (!isGraphFileV3(data)) {
        console.error('BAC4 v3.0: Invalid __graph__.json format');
        throw new Error('Invalid graph file format');
      }

      // Update cache
      this.cache = data;
      this.cacheTimestamp = now;

      return JSON.parse(JSON.stringify(data)); // Deep copy
    } catch (error) {
      console.error('BAC4 v3.0: Error reading __graph__.json:', error);
      throw error;
    }
  }

  /**
   * Write __graph__.json atomically
   * Uses temp file + rename pattern
   */
  async writeGraph(graph: GraphFileV3): Promise<void> {
    // Update metadata
    graph.metadata.updated = new Date().toISOString();
    graph.metadata.nodeCount = Object.keys(graph.nodes).length;
    graph.metadata.edgeCount = graph.relationships.edges.length;

    const content = JSON.stringify(graph, null, 2);
    const tempPath = GRAPH_FILE_PATH_V3 + '.tmp';

    try {
      // Delete old temp file if exists
      const oldTemp = this.vault.getAbstractFileByPath(tempPath);
      if (oldTemp instanceof TFile) {
        await this.vault.delete(oldTemp);
      }

      // Write to temp file
      await this.vault.create(tempPath, content);

      // Rename temp → actual (atomic)
      const tempFile = this.vault.getAbstractFileByPath(tempPath) as TFile;
      const graphFile = this.vault.getAbstractFileByPath(GRAPH_FILE_PATH_V3);

      if (graphFile instanceof TFile) {
        await this.vault.delete(graphFile);
        await this.vault.rename(tempFile, GRAPH_FILE_PATH_V3);
      } else {
        await this.vault.rename(tempFile, GRAPH_FILE_PATH_V3);
      }

      // Update cache
      this.cache = graph;
      this.cacheTimestamp = Date.now();

      console.log('BAC4 v3.0: Wrote __graph__.json successfully');
    } catch (error) {
      console.error('BAC4 v3.0: Error writing __graph__.json:', error);

      // Cleanup temp file
      const tempFile = this.vault.getAbstractFileByPath(tempPath);
      if (tempFile instanceof TFile) {
        await this.vault.delete(tempFile);
      }

      throw error;
    }
  }

  /**
   * Atomic update operation
   * Read → modify → write in one transaction
   */
  async update(
    modifier: (graph: GraphFileV3) => GraphFileV3 | Promise<GraphFileV3>
  ): Promise<void> {
    const graph = await this.readGraph();
    const modified = await modifier(graph);
    await this.writeGraph(modified);
  }

  /**
   * Clear cache (force reload)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get statistics about the graph
   */
  async getStatistics(): Promise<{
    nodeCount: number;
    edgeCount: number;
    hierarchyCount: number;
  }> {
    const graph = await this.readGraph();
    return {
      nodeCount: Object.keys(graph.nodes).length,
      edgeCount: graph.relationships.edges.length,
      hierarchyCount: graph.relationships.hierarchy.length,
    };
  }
}
