/**
 * Layout Manager Service
 *
 * Manages multiple presentation layouts for the same semantic data.
 * Enables one .bac4 file to have multiple .bac4-graph views.
 *
 * Examples:
 * - Context.bac4 → Context-C4.bac4-graph, Context-Wardley.bac4-graph
 * - API.bac4 → API-Container.bac4-graph, API-Timeline.bac4-graph
 *
 * @version 2.6.0
 */

import { TFile, TFolder, Vault } from 'obsidian';
import { BAC4GraphFileV2, ViewType, GraphMetadata } from '../types/bac4-v2-types';

export interface LayoutInfo {
  graphPath: string;
  graphFile: TFile;
  title: string;
  viewType: ViewType;
  updated: string;
  isCurrent: boolean;
  isDefault: boolean;
}

export interface CreateLayoutOptions {
  viewType: ViewType;
  layoutName: string;
  copyFromCurrent?: boolean;
  currentGraphFile?: BAC4GraphFileV2;
}

export class LayoutManagerService {
  constructor(private vault: Vault) {}

  /**
   * Discover all graph files for a given node file
   *
   * Example:
   * Input: "Diagrams/Context.bac4"
   * Output: [
   *   "Diagrams/Context.bac4-graph" (default),
   *   "Diagrams/Context-Wardley.bac4-graph",
   *   "Diagrams/Context-Timeline.bac4-graph"
   * ]
   */
  async getLayoutsForNodeFile(
    nodeFilePath: string,
    currentGraphPath?: string
  ): Promise<LayoutInfo[]> {
    const baseName = this.getBaseName(nodeFilePath);
    const folder = this.getFolder(nodeFilePath);

    // Get all files in the same folder
    const files = this.vault.getFiles();
    const graphFiles = files.filter((file) => {
      // Must be in same folder
      if (file.parent?.path !== folder) return false;

      // Must be a .bac4-graph file
      if (!file.path.endsWith('.bac4-graph')) return false;

      // Must match base name pattern
      const fileName = file.basename;
      return (
        fileName === baseName || // Default: Context.bac4-graph
        fileName.startsWith(`${baseName}-`) // Named: Context-Wardley.bac4-graph
      );
    });

    // Load metadata for each graph file
    const layouts: LayoutInfo[] = [];
    for (const graphFile of graphFiles) {
      try {
        const content = await this.vault.read(graphFile);
        const data: BAC4GraphFileV2 = JSON.parse(content);

        // Verify it references the correct node file
        if (data.metadata.nodeFile !== this.getFileName(nodeFilePath)) {
          console.warn(
            `Graph file ${graphFile.path} references wrong node file: ${data.metadata.nodeFile}`
          );
          continue;
        }

        const isDefault = graphFile.basename === baseName;
        const isCurrent = graphFile.path === currentGraphPath;

        layouts.push({
          graphPath: graphFile.path,
          graphFile,
          title: data.metadata.title,
          viewType: data.metadata.viewType,
          updated: data.metadata.updated,
          isCurrent,
          isDefault,
        });
      } catch (error) {
        console.error(`Failed to load graph file ${graphFile.path}:`, error);
      }
    }

    // Sort: current first, then default, then by name
    layouts.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return a.title.localeCompare(b.title);
    });

    return layouts;
  }

  /**
   * Create a new layout for a node file
   *
   * Example:
   * createLayout("Context.bac4", {
   *   viewType: "wardley",
   *   layoutName: "Wardley Map View",
   *   copyFromCurrent: false
   * })
   * → Creates "Context-Wardley.bac4-graph"
   */
  async createLayout(
    nodeFilePath: string,
    options: CreateLayoutOptions
  ): Promise<string> {
    const baseName = this.getBaseName(nodeFilePath);
    const folder = this.getFolder(nodeFilePath);

    // Generate file name
    const layoutSlug = this.slugify(options.layoutName);
    const graphFileName = `${baseName}-${layoutSlug}.bac4-graph`;
    const graphFilePath = folder
      ? `${folder}/${graphFileName}`
      : graphFileName;

    // Check if file already exists
    const existing = this.vault.getAbstractFileByPath(graphFilePath);
    if (existing) {
      throw new Error(`Layout already exists: ${graphFilePath}`);
    }

    // Create new graph file
    let graphFile: BAC4GraphFileV2;

    if (options.copyFromCurrent && options.currentGraphFile) {
      // Copy from current layout
      graphFile = JSON.parse(JSON.stringify(options.currentGraphFile));
      graphFile.metadata.graphId = this.generateId();
      graphFile.metadata.title = options.layoutName;
      graphFile.metadata.viewType = options.viewType;
      graphFile.metadata.created = new Date().toISOString();
      graphFile.metadata.updated = new Date().toISOString();
    } else {
      // Create blank layout
      graphFile = this.createBlankLayout(
        this.getFileName(nodeFilePath),
        options.viewType,
        options.layoutName
      );
    }

    // Write file
    await this.vault.create(graphFilePath, JSON.stringify(graphFile, null, 2));

    return graphFilePath;
  }

  /**
   * Delete a layout
   *
   * Note: Cannot delete default layout (base-name.bac4-graph)
   */
  async deleteLayout(graphFilePath: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(graphFilePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`Layout not found: ${graphFilePath}`);
    }

    // Check if it's the default layout
    const isDefault = !graphFilePath.match(/-[^/]+\.bac4-graph$/);
    if (isDefault) {
      throw new Error('Cannot delete default layout');
    }

    await this.vault.delete(file);
  }

  /**
   * Rename a layout
   *
   * Example:
   * renameLayout("Context-Old.bac4-graph", "New View Name")
   * → Renames to "Context-New-View-Name.bac4-graph"
   */
  async renameLayout(
    oldGraphPath: string,
    newLayoutName: string
  ): Promise<string> {
    const file = this.vault.getAbstractFileByPath(oldGraphPath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`Layout not found: ${oldGraphPath}`);
    }

    // Extract base name
    const oldFileName = file.basename;
    const match = oldFileName.match(/^(.+?)-(.+)$/);
    if (!match) {
      throw new Error('Cannot rename default layout');
    }

    const baseName = match[1];
    const layoutSlug = this.slugify(newLayoutName);
    const newFileName = `${baseName}-${layoutSlug}.bac4-graph`;
    const newPath = file.parent
      ? `${file.parent.path}/${newFileName}`
      : newFileName;

    // Check if new name already exists
    const existing = this.vault.getAbstractFileByPath(newPath);
    if (existing) {
      throw new Error(`Layout already exists: ${newPath}`);
    }

    // Update metadata
    const content = await this.vault.read(file);
    const data: BAC4GraphFileV2 = JSON.parse(content);
    data.metadata.title = newLayoutName;
    data.metadata.updated = new Date().toISOString();

    // Rename file
    await this.vault.rename(file, newPath);

    // Write updated metadata
    const newFile = this.vault.getAbstractFileByPath(newPath) as TFile;
    await this.vault.modify(newFile, JSON.stringify(data, null, 2));

    return newPath;
  }

  /**
   * Validate graph file consistency
   *
   * Checks:
   * - Graph file references correct node file
   * - Node file exists
   * - Graph file metadata is valid
   */
  async validateLayout(graphFilePath: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check graph file exists
    const graphFile = this.vault.getAbstractFileByPath(graphFilePath);
    if (!graphFile || !(graphFile instanceof TFile)) {
      errors.push(`Graph file not found: ${graphFilePath}`);
      return { valid: false, errors };
    }

    // Load and parse
    try {
      const content = await this.vault.read(graphFile);
      const data: BAC4GraphFileV2 = JSON.parse(content);

      // Check metadata
      if (!data.metadata) {
        errors.push('Missing metadata');
      } else {
        if (!data.metadata.nodeFile) {
          errors.push('Missing nodeFile reference');
        }
        if (!data.metadata.viewType) {
          errors.push('Missing viewType');
        }
        if (!data.metadata.title) {
          errors.push('Missing title');
        }

        // Check node file exists
        if (data.metadata.nodeFile) {
          const nodeFilePath = graphFile.parent
            ? `${graphFile.parent.path}/${data.metadata.nodeFile}`
            : data.metadata.nodeFile;
          const nodeFile = this.vault.getAbstractFileByPath(nodeFilePath);
          if (!nodeFile) {
            errors.push(`Referenced node file not found: ${nodeFilePath}`);
          }
        }
      }

      // Check version
      if (!data.version) {
        errors.push('Missing version');
      }

      // Check timeline
      if (!data.timeline) {
        errors.push('Missing timeline');
      }
    } catch (error) {
      errors.push(`Failed to parse graph file: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default graph file path for a node file
   *
   * Example:
   * getDefaultGraphPath("Context.bac4") → "Context.bac4-graph"
   */
  getDefaultGraphPath(nodeFilePath: string): string {
    const baseName = this.getBaseName(nodeFilePath);
    const folder = this.getFolder(nodeFilePath);
    return folder ? `${folder}/${baseName}.bac4-graph` : `${baseName}.bac4-graph`;
  }

  /**
   * Check if graph file is default layout
   */
  isDefaultLayout(graphFilePath: string): boolean {
    return !graphFilePath.match(/-[^/]+\.bac4-graph$/);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private createBlankLayout(
    nodeFileName: string,
    viewType: ViewType,
    title: string
  ): BAC4GraphFileV2 {
    const now = new Date().toISOString();

    return {
      version: '2.5.1',
      metadata: {
        nodeFile: nodeFileName,
        graphId: this.generateId(),
        title: title,
        viewType: viewType,
        created: now,
        updated: now,
      },
      timeline: {
        snapshots: [],
        currentSnapshotId: '',
        snapshotOrder: [],
      },
      config: {
        layoutAlgorithm: 'manual',
        gridEnabled: true,
        showMinimap: true,
        gridSize: 20,
        snapToGrid: false,
        axisLabels: undefined,
      },
    };
  }

  private getBaseName(filePath: string): string {
    const fileName = filePath.split('/').pop() || filePath;
    return fileName.replace(/\.bac4(-graph)?$/, '');
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  private getFolder(filePath: string): string | null {
    const parts = filePath.split('/');
    if (parts.length === 1) return null;
    return parts.slice(0, -1).join('/');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateId(): string {
    return `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
