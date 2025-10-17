/**
 * Node Handlers Hook
 *
 * Custom React hook that manages all node-related event handlers:
 * - Node selection (click)
 * - Node drilling (double-click)
 * - Node context menu (right-click)
 * - Node label updates
 * - Node property updates
 * - Child diagram creation and linking
 *
 * @module useNodeHandlers
 */

import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import { Menu } from 'obsidian';
import type BAC4Plugin from '../../../main';
import type { CanvasNodeData } from '../../../types/canvas-types';
import type { DiagramNavigationService } from '../../../services/diagram-navigation-service';
import { canDrillDown, getChildDiagramType, getChildTypeLabel } from '../utils/canvas-utils';
import { ErrorHandler } from '../../../utils/error-handling';
import { MarkdownLinkService } from '../../../services/markdown-link-service';

export interface UseNodeHandlersProps {
  plugin: BAC4Plugin;
  filePath?: string;
  diagramType: 'context' | 'container' | 'component';
  nodes: Node<CanvasNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  navigationService: DiagramNavigationService;
  onNodeSelect: (node: Node<CanvasNodeData> | null) => void;
}

export interface NodeHandlers {
  onNodeClick: (event: React.MouseEvent, node: Node<CanvasNodeData>) => void;
  onNodeDoubleClick: (event: React.MouseEvent, node: Node<CanvasNodeData>) => Promise<void>;
  onNodeContextMenu: (event: React.MouseEvent, node: Node<CanvasNodeData>) => Promise<void>;
  updateNodeLabel: (nodeId: string, newLabel: string) => Promise<void>;
  updateNodeProperties: (nodeId: string, updates: Partial<CanvasNodeData>) => void;
  handleCreateOrOpenChildDiagram: (node: Node<CanvasNodeData>) => Promise<void>;
  handleDeleteNode: (nodeId: string) => void;
  linkMarkdownFile: (nodeId: string, filePath: string) => void;
  unlinkMarkdownFile: (nodeId: string) => void;
  createAndLinkMarkdownFile: (nodeId: string, filePath: string) => Promise<void>;
  openLinkedMarkdownFile: (nodeId: string) => Promise<void>;
  updateMarkdownImage: (nodeId: string) => Promise<void>;
}

/**
 * Custom hook for node event handlers
 *
 * @param props - Configuration options
 * @returns Object containing all node handler functions
 */
export function useNodeHandlers(props: UseNodeHandlersProps): NodeHandlers {
  const {
    plugin,
    filePath,
    diagramType,
    nodes,
    setNodes,
    setEdges,
    navigationService,
    onNodeSelect,
  } = props;

  /**
   * Handle node click (selection)
   */
  const onNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      onNodeSelect(node);
    },
    [onNodeSelect]
  );

  /**
   * Open the linked markdown file for a node
   * CRITICAL: Must be declared BEFORE onNodeDoubleClick to avoid TDZ error
   */
  const openLinkedMarkdownFile = React.useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data.linkedMarkdownPath) {
        console.error('BAC4: No linked markdown file for node:', nodeId);
        return;
      }

      try {
        console.log('BAC4: Opening linked markdown file', {
          nodeId,
          filePath: node.data.linkedMarkdownPath,
        });
        await MarkdownLinkService.openMarkdownFile(
          plugin.app.workspace,
          plugin.app.vault,
          node.data.linkedMarkdownPath,
          false
        );
        console.log('BAC4: ✅ Markdown file opened');
      } catch (error) {
        console.error('BAC4: Error opening markdown file:', error);
        ErrorHandler.handleError(error, 'Failed to open markdown file. File may have been moved or deleted.');
      }
    },
    [nodes, plugin]
  );

  /**
   * Create or open child diagram for a node
   */
  const handleCreateOrOpenChildDiagram = React.useCallback(
    async (node: Node<CanvasNodeData>) => {
      console.log('=== BAC4 DRILL-DOWN START ===');
      console.log('Node:', { id: node.id, type: node.type, label: node.data.label });
      console.log('Current diagram:', { filePath, diagramType });

      // Validate we have a saved diagram
      if (!filePath) {
        console.error('BAC4: Cannot drill down - diagram not saved');
        ErrorHandler.showInfo('Please save this diagram first before creating child diagrams.');
        return;
      }

      // Determine if this node type can drill down
      if (!canDrillDown(node.type || '', diagramType)) {
        console.log('BAC4: Node type', node.type, 'cannot drill down from', diagramType);
        return;
      }

      // Determine child diagram type
      const childDiagramType = getChildDiagramType(node.type || '');
      if (!childDiagramType) {
        console.error('BAC4: Invalid node type for drill-down:', node.type);
        return;
      }

      console.log('BAC4: Target child type:', childDiagramType);

      try {
        // Try to find existing child diagram first
        console.log('BAC4: Searching for existing child diagram...');
        let childPath = await navigationService.findChildDiagram(filePath, node.id);
        console.log('BAC4: Find result:', childPath || 'NOT FOUND');

        if (!childPath) {
          // No child exists, create it
          console.log('BAC4: Creating new child diagram for:', node.data.label);
          console.log('BAC4: Parent path:', filePath);
          console.log('BAC4: Node ID:', node.id);

          // Type guard: component diagrams cannot have children (already filtered by canDrillDown)
          if (diagramType === 'component') {
            console.error('BAC4: Component diagrams cannot have children');
            return;
          }

          childPath = await navigationService.createChildDiagram(
            filePath,
            node.id,
            node.data.label,
            diagramType,
            childDiagramType
          );

          console.log('BAC4: ✅ Child diagram created:', childPath);

          // v0.6.0: Update node's linkedDiagramPath in React state
          // Auto-save will persist to disk after 1 second debounce
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? { ...n, data: { ...n.data, linkedDiagramPath: childPath } }
                : n
            )
          );
          console.log('BAC4: ✅ Updated node with linkedDiagramPath in React state');
        } else {
          console.log('BAC4: ✅ Opening existing child diagram:', childPath);
        }

        // Open the child diagram in NEW tab
        console.log('BAC4: Opening child diagram in NEW tab...');
        await plugin.openCanvasViewInNewTab(childPath);
        console.log('BAC4: ✅ Child diagram opened in new tab successfully');
        console.log('=== BAC4 DRILL-DOWN END ===');
      } catch (error) {
        console.error('=== BAC4 DRILL-DOWN ERROR ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
        const msg = error instanceof Error ? error.message : 'Unknown error';
        ErrorHandler.handleError(
          error,
          `Cannot open child diagram:\n\n${msg}\n\nCheck console for details.`
        );
      }
    },
    [diagramType, filePath, navigationService, plugin, setNodes]
  );

  /**
   * Handle node double-click (v0.6.0: Unified navigation)
   *
   * Priority order:
   * 1. linkedDiagramPath exists → Open child diagram (Context/Container drill-down)
   * 2. linkedMarkdownPath exists → Open markdown documentation
   * 3. Neither exists → Try to create/open child diagram (if node type allows)
   * 4. Nothing available → Show info message
   */
  const onNodeDoubleClick = React.useCallback(
    async (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      console.log('=== BAC4 DOUBLE-CLICK START ===');
      console.log('Node:', { id: node.id, type: node.type, label: node.data.label });

      // Priority 1: Check if node has linkedDiagramPath (embedded in node data)
      if ('linkedDiagramPath' in node.data && node.data.linkedDiagramPath) {
        console.log('BAC4: Node has linkedDiagramPath, opening diagram:', node.data.linkedDiagramPath);
        try {
          await plugin.openCanvasViewInNewTab(node.data.linkedDiagramPath);
          console.log('BAC4: ✅ Opened linked diagram');
          console.log('=== BAC4 DOUBLE-CLICK END ===');
          return;
        } catch (error) {
          console.error('BAC4: Error opening linked diagram:', error);
          ErrorHandler.handleError(error, 'Failed to open linked diagram');
          return;
        }
      }

      // Priority 2: Check if node has linkedMarkdownPath
      if (node.data.linkedMarkdownPath) {
        console.log('BAC4: Node has linkedMarkdownPath, opening markdown:', node.data.linkedMarkdownPath);
        await openLinkedMarkdownFile(node.id);
        console.log('=== BAC4 DOUBLE-CLICK END ===');
        return;
      }

      // Priority 3: Try drill-down (only for System/Container nodes in Context/Container diagrams)
      if (canDrillDown(node.type || '', diagramType)) {
        console.log('BAC4: No linked files, attempting drill-down...');
        await handleCreateOrOpenChildDiagram(node);
        console.log('=== BAC4 DOUBLE-CLICK END ===');
        return;
      }

      // Priority 4: Nothing available
      console.log('BAC4: No action available for double-click');
      ErrorHandler.showInfo('No linked diagram or documentation. Use Property Panel to link files.');
      console.log('=== BAC4 DOUBLE-CLICK END ===');
    },
    [handleCreateOrOpenChildDiagram, openLinkedMarkdownFile, plugin, diagramType]
  );

  /**
   * Handle node context menu (right-click)
   */
  const onNodeContextMenu = React.useCallback(
    async (event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      event.preventDefault();

      if (!filePath) return;

      // Determine if this node can have children
      if (!canDrillDown(node.type || '', diagramType)) {
        return;
      }

      // Create Obsidian menu
      const menu = new Menu();

      // Check if child already exists
      const childPath = await navigationService.findChildDiagram(filePath, node.id);

      if (childPath) {
        // Child exists - show "Open child diagram"
        menu.addItem((item) => {
          item
            .setTitle('Open child diagram')
            .setIcon('arrow-right')
            .onClick(async () => {
              console.log('BAC4: Opening child from context menu');
              await plugin.openCanvasViewInNewTab(childPath);
            });
        });
      } else {
        // No child - show "Create child diagram"
        const childType = getChildTypeLabel(node.type || '');
        menu.addItem((item) => {
          item
            .setTitle(`Create child diagram (${childType})`)
            .setIcon('plus-circle')
            .onClick(async () => {
              console.log('BAC4: Creating child from context menu');
              await handleCreateOrOpenChildDiagram(node);
            });
        });
      }

      // Show menu at mouse position
      menu.showAtMouseEvent(event.nativeEvent);
    },
    [diagramType, filePath, navigationService, plugin, handleCreateOrOpenChildDiagram]
  );

  /**
   * Update node label and child diagram file name
   */
  const updateNodeLabel = React.useCallback(
    async (nodeId: string, newLabel: string) => {
      console.log('BAC4: updateNodeLabel called', { nodeId, newLabel });

      // Get the node before updating
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        console.error('BAC4: Node not found:', nodeId);
        return;
      }

      // Update the node label
      setNodes((nds) => {
        const updated = nds.map((n) => {
          if (n.id === nodeId) {
            console.log('BAC4: Found node to update', { oldLabel: n.data.label, newLabel });
            return {
              ...n,
              data: { ...n.data, label: newLabel },
            };
          }
          return n;
        });
        console.log('BAC4: Updated nodes');
        return updated;
      });

      // v0.6.0: Check if node has a child diagram by querying navigation service
      if (filePath) {
        try {
          // Find child diagram
          const childPath = await navigationService.findChildDiagram(filePath, nodeId);

          if (!childPath) {
            console.log('BAC4: Node has no child diagram, skipping rename');
            return;
          }

          console.log('BAC4: Node has child diagram, renaming child file...');

          if (childPath) {
            console.log('BAC4: Found child diagram at:', childPath);

            // Rename the child diagram file
            const newChildPath = await navigationService.renameDiagram(childPath, newLabel);
            console.log('BAC4: ✅ Renamed child diagram to:', newChildPath);

            // Update relationship with new parent node label
            await navigationService.updateParentNodeLabel(filePath, nodeId, newLabel);
            console.log('BAC4: ✅ Updated relationship with new label');
          }
        } catch (error) {
          console.error('BAC4: Error renaming child diagram:', error);
        }
      }
    },
    [setNodes, nodes, filePath, navigationService]
  );

  /**
   * Update node properties
   */
  const updateNodeProperties = React.useCallback(
    (nodeId: string, updates: Partial<CanvasNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...updates },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  /**
   * Delete node and its connected edges
   */
  const handleDeleteNode = React.useCallback(
    (nodeId: string) => {
      console.log('BAC4: Deleting node', nodeId);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  /**
   * Link a markdown file to a node
   */
  const linkMarkdownFile = React.useCallback(
    (nodeId: string, filePath: string) => {
      console.log('BAC4: Linking markdown file', { nodeId, filePath });
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, linkedMarkdownPath: filePath } }
            : node
        )
      );
    },
    [setNodes]
  );

  /**
   * Unlink a markdown file from a node
   */
  const unlinkMarkdownFile = React.useCallback(
    (nodeId: string) => {
      console.log('BAC4: Unlinking markdown file', { nodeId });
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, linkedMarkdownPath: undefined } }
            : node
        )
      );
    },
    [setNodes]
  );

  /**
   * Create a markdown file with diagram image and link it to a node
   */
  const createAndLinkMarkdownFile = React.useCallback(
    async (nodeId: string, filePath: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        console.error('BAC4: Node not found:', nodeId);
        return;
      }

      try {
        console.log('BAC4: Creating markdown file with diagram image', { nodeId, filePath });

        // Create markdown file with embedded diagram image
        const result = await MarkdownLinkService.createMarkdownFileWithImage(
          plugin.app.vault,
          filePath,
          node.data.label,
          node.type || 'generic',
          diagramType
        );

        console.log('BAC4: ✅ Markdown file created', {
          markdown: result.markdownFile.path,
          image: result.imageFile?.path || 'none',
        });

        // Link the file
        linkMarkdownFile(nodeId, filePath);

        // Open the file
        await MarkdownLinkService.openMarkdownFile(
          plugin.app.workspace,
          plugin.app.vault,
          filePath,
          false
        );
        console.log('BAC4: ✅ Markdown file opened');

        ErrorHandler.showSuccess(
          result.imageFile
            ? 'Markdown file created with diagram image'
            : 'Markdown file created (image export failed)'
        );
      } catch (error) {
        console.error('BAC4: Error creating markdown file:', error);
        ErrorHandler.handleError(error, 'Failed to create markdown file');
      }
    },
    [nodes, plugin, diagramType, linkMarkdownFile]
  );

  /**
   * Update the diagram image for an existing markdown file
   */
  const updateMarkdownImage = React.useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data.linkedMarkdownPath) {
        console.error('BAC4: No linked markdown file for node:', nodeId);
        ErrorHandler.showInfo('No linked markdown file to update image for');
        return;
      }

      try {
        console.log('BAC4: Updating diagram image for markdown:', node.data.linkedMarkdownPath);

        const imageFile = await MarkdownLinkService.updateDiagramImage(
          plugin.app.vault,
          node.data.linkedMarkdownPath
        );

        console.log('BAC4: ✅ Diagram image updated:', imageFile?.path);
        ErrorHandler.showSuccess('Diagram image updated successfully');
      } catch (error) {
        console.error('BAC4: Error updating diagram image:', error);
        ErrorHandler.handleError(error, 'Failed to update diagram image');
      }
    },
    [nodes, plugin]
  );

  return {
    onNodeClick,
    onNodeDoubleClick,
    onNodeContextMenu,
    updateNodeLabel,
    updateNodeProperties,
    handleCreateOrOpenChildDiagram,
    handleDeleteNode,
    linkMarkdownFile,
    unlinkMarkdownFile,
    createAndLinkMarkdownFile,
    openLinkedMarkdownFile,
    updateMarkdownImage,
  };
}
