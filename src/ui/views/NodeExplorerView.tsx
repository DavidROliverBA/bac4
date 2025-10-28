/**
 * Node Explorer View for Obsidian
 *
 * Vault-wide view of all nodes from __graph__.json
 * Shows relationships, usage stats, and allows bulk operations.
 *
 * @version 3.0.0
 */

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import BAC4Plugin from '../../main';

// v3.0.0 Services
import { NodeServiceV3 } from '../../services/node-service-v3';
import { EdgeServiceV3 } from '../../services/edge-service-v3';

// Node Explorer Component
import { NodeExplorer } from '../pages/NodeExplorer';

export const VIEW_TYPE_NODE_EXPLORER = 'bac4-node-explorer-v3';

/**
 * Node Explorer View for Obsidian
 */
export class NodeExplorerView extends ItemView {
  plugin: BAC4Plugin;
  root: ReactDOM.Root | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: BAC4Plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_NODE_EXPLORER;
  }

  getDisplayText(): string {
    return 'Node Explorer (v3.0.0)';
  }

  getIcon(): string {
    return 'database';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('bac4-node-explorer-view');

    // Create root for React
    this.root = ReactDOM.createRoot(container);

    // Render
    await this.render();
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  /**
   * Render Node Explorer component
   */
  private async render(): Promise<void> {
    if (!this.root) return;

    try {
      // Initialize services
      const nodeService = new NodeServiceV3(this.plugin.app.vault);
      const edgeService = new EdgeServiceV3(this.plugin.app.vault);

      // Load all nodes and edges
      const nodes = await nodeService.getAllNodes();
      const edges = await edgeService.getAllEdges();

      // Render component
      this.root.render(
        <NodeExplorer
          nodes={nodes}
          edges={edges}
          onDeleteNodes={async (nodeIds: string[]) => {
            try {
              for (const id of nodeIds) {
                await nodeService.deleteNode(id);
              }
              new Notice(`Deleted ${nodeIds.length} node(s) globally`);
              await this.render(); // Refresh
            } catch (error) {
              console.error('Error deleting nodes:', error);
              new Notice('Error deleting nodes');
            }
          }}
          onRefresh={async () => {
            await this.render();
          }}
        />
      );
    } catch (error) {
      console.error('Error rendering Node Explorer:', error);
      new Notice('Error loading Node Explorer');
    }
  }
}
