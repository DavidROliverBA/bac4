/**
 * Graph Layout Service
 *
 * Manages persistence of graph view node positions to maintain user-customized layouts.
 * Saves and restores node positions across graph regenerations.
 *
 * v2.0.1: Phase 2 - Persistent Layout
 *
 * @module graph-layout-service
 */

import { Vault, TFile } from 'obsidian';

/**
 * Layout data for a single node
 */
export interface NodeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Complete layout file structure
 */
export interface GraphLayout {
  version: string;
  layout: Record<string, NodeLayout>; // diagramPath → position
  lastUpdated: string;
}

/**
 * Service for persisting graph view layouts
 */
export class GraphLayoutService {
  private static readonly LAYOUT_FILE_PATH = '.bac4-graph-layout.json';
  private static readonly LAYOUT_VERSION = '1.0.0';

  /**
   * Load saved layout from vault
   *
   * Reads the .bac4-graph-layout.json file and returns node positions.
   * Returns empty layout if file doesn't exist or is invalid.
   *
   * @param vault - Obsidian vault instance
   * @returns Promise resolving to GraphLayout object
   *
   * @example
   * ```ts
   * const layout = await GraphLayoutService.loadLayout(vault);
   * if (layout.layout['BAC4/Context.bac4']) {
   *   const pos = layout.layout['BAC4/Context.bac4'];
   *   node.position = { x: pos.x, y: pos.y };
   * }
   * ```
   */
  static async loadLayout(vault: Vault): Promise<GraphLayout> {
    try {
      const exists = await vault.adapter.exists(this.LAYOUT_FILE_PATH);
      if (!exists) {
        console.log('BAC4: No saved layout file found, using default layout');
        return this.createEmptyLayout();
      }

      const content = await vault.adapter.read(this.LAYOUT_FILE_PATH);
      const layout = JSON.parse(content) as GraphLayout;

      // Validate version compatibility
      if (layout.version !== this.LAYOUT_VERSION) {
        console.warn(
          `BAC4: Layout file version mismatch (${layout.version} vs ${this.LAYOUT_VERSION}), using default layout`
        );
        return this.createEmptyLayout();
      }

      console.log(`BAC4: Loaded layout with ${Object.keys(layout.layout).length} saved positions`);
      return layout;
    } catch (error) {
      console.error('BAC4: Error loading layout file:', error);
      return this.createEmptyLayout();
    }
  }

  /**
   * Save current graph layout to vault
   *
   * Writes node positions to .bac4-graph-layout.json file in vault root.
   * Overwrites existing file if present.
   *
   * @param vault - Obsidian vault instance
   * @param nodePositions - Map of diagram paths to positions
   * @returns Promise that resolves when save is complete
   *
   * @example
   * ```ts
   * const positions = new Map<string, NodeLayout>();
   * positions.set('BAC4/Context.bac4', { x: 100, y: 200, width: 250, height: 100 });
   * await GraphLayoutService.saveLayout(vault, positions);
   * ```
   */
  static async saveLayout(vault: Vault, nodePositions: Map<string, NodeLayout>): Promise<void> {
    try {
      const layout: GraphLayout = {
        version: this.LAYOUT_VERSION,
        layout: Object.fromEntries(nodePositions),
        lastUpdated: new Date().toISOString(),
      };

      const content = JSON.stringify(layout, null, 2);

      // Check if file exists
      const exists = await vault.adapter.exists(this.LAYOUT_FILE_PATH);

      if (exists) {
        // Modify existing file
        await vault.adapter.write(this.LAYOUT_FILE_PATH, content);
      } else {
        // Create new file
        await vault.create(this.LAYOUT_FILE_PATH, content);
      }

      console.log(`BAC4: Saved layout with ${nodePositions.size} node positions`);
    } catch (error) {
      console.error('BAC4: Error saving layout file:', error);
    }
  }

  /**
   * Delete saved layout file
   *
   * Removes .bac4-graph-layout.json from vault, resetting to default layout.
   * Used by "Reset Graph Layout" command.
   *
   * @param vault - Obsidian vault instance
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * ```ts
   * // User clicks "Reset Graph Layout"
   * await GraphLayoutService.resetLayout(vault);
   * // Next graph view will use default hierarchical layout
   * ```
   */
  static async resetLayout(vault: Vault): Promise<void> {
    try {
      const exists = await vault.adapter.exists(this.LAYOUT_FILE_PATH);
      if (!exists) {
        console.log('BAC4: No layout file to reset');
        return;
      }

      // Get the file and delete it
      const file = vault.getAbstractFileByPath(this.LAYOUT_FILE_PATH);
      if (file instanceof TFile) {
        await vault.delete(file);
        console.log('BAC4: Layout file deleted, reset to default');
      }
    } catch (error) {
      console.error('BAC4: Error resetting layout file:', error);
    }
  }

  /**
   * Get saved position for a specific diagram
   *
   * Convenience method to check if a diagram has a saved position.
   *
   * @param layout - GraphLayout object from loadLayout()
   * @param diagramPath - Path to diagram file
   * @returns NodeLayout if saved, undefined otherwise
   *
   * @example
   * ```ts
   * const layout = await GraphLayoutService.loadLayout(vault);
   * const savedPos = GraphLayoutService.getSavedPosition(layout, 'BAC4/Context.bac4');
   * if (savedPos) {
   *   node.position = { x: savedPos.x, y: savedPos.y };
   * }
   * ```
   */
  static getSavedPosition(layout: GraphLayout, diagramPath: string): NodeLayout | undefined {
    return layout.layout[diagramPath];
  }

  /**
   * Check if diagram has saved position
   *
   * @param layout - GraphLayout object from loadLayout()
   * @param diagramPath - Path to diagram file
   * @returns True if position is saved, false otherwise
   *
   * @example
   * ```ts
   * if (GraphLayoutService.hasSavedPosition(layout, diagramPath)) {
   *   // Use saved position
   * } else {
   *   // Use auto-calculated position
   * }
   * ```
   */
  static hasSavedPosition(layout: GraphLayout, diagramPath: string): boolean {
    return diagramPath in layout.layout;
  }

  /**
   * Create empty layout structure
   *
   * @returns Empty GraphLayout object
   * @private
   */
  private static createEmptyLayout(): GraphLayout {
    return {
      version: this.LAYOUT_VERSION,
      layout: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Handle diagram rename
   *
   * Updates layout file when a diagram is renamed.
   * Preserves position for the renamed diagram.
   *
   * @param vault - Obsidian vault instance
   * @param oldPath - Original diagram path
   * @param newPath - New diagram path
   * @returns Promise that resolves when update is complete
   *
   * @example
   * ```ts
   * // When diagram is renamed
   * vault.on('rename', async (file, oldPath) => {
   *   if (file.extension === 'bac4') {
   *     await GraphLayoutService.handleDiagramRename(vault, oldPath, file.path);
   *   }
   * });
   * ```
   */
  static async handleDiagramRename(vault: Vault, oldPath: string, newPath: string): Promise<void> {
    try {
      const layout = await this.loadLayout(vault);

      // Check if old path has saved position
      if (this.hasSavedPosition(layout, oldPath)) {
        const savedPosition = layout.layout[oldPath];

        // Remove old path
        delete layout.layout[oldPath];

        // Add new path with same position
        layout.layout[newPath] = savedPosition;

        // Save updated layout
        const positions = new Map(Object.entries(layout.layout));
        await this.saveLayout(vault, positions);

        console.log(`BAC4: Updated layout for renamed diagram: ${oldPath} → ${newPath}`);
      }
    } catch (error) {
      console.error('BAC4: Error handling diagram rename in layout:', error);
    }
  }

  /**
   * Handle diagram deletion
   *
   * Removes diagram position from layout file when diagram is deleted.
   *
   * @param vault - Obsidian vault instance
   * @param diagramPath - Path to deleted diagram
   * @returns Promise that resolves when update is complete
   *
   * @example
   * ```ts
   * // When diagram is deleted
   * vault.on('delete', async (file) => {
   *   if (file.extension === 'bac4') {
   *     await GraphLayoutService.handleDiagramDeletion(vault, file.path);
   *   }
   * });
   * ```
   */
  static async handleDiagramDeletion(vault: Vault, diagramPath: string): Promise<void> {
    try {
      const layout = await this.loadLayout(vault);

      // Check if diagram has saved position
      if (this.hasSavedPosition(layout, diagramPath)) {
        // Remove from layout
        delete layout.layout[diagramPath];

        // Save updated layout
        const positions = new Map(Object.entries(layout.layout));
        await this.saveLayout(vault, positions);

        console.log(`BAC4: Removed layout for deleted diagram: ${diagramPath}`);
      }
    } catch (error) {
      console.error('BAC4: Error handling diagram deletion in layout:', error);
    }
  }
}
