/**
 * Diagram Actions Hook
 *
 * Custom React hook that manages diagram-level actions:
 * - Diagram rename
 * - Diagram type switching (context ↔ container ↔ component)
 * - Navigation between diagrams
 *
 * @module useDiagramActions
 */

import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import type { App } from 'obsidian';
import type BAC4Plugin from '../../../main';
import type { CanvasNodeData } from '../../../types/canvas-types';
import type { DiagramNavigationService } from '../../../services/diagram-navigation-service';
import { RenameModal } from '../../components/RenameModal';
import { DiagramTypeSwitchModal } from '../../components/DiagramTypeSwitchModal';
import { getDiagramName } from '../utils/canvas-utils';
import { ErrorHandler } from '../../../utils/error-handling';

export interface UseDiagramActionsProps {
  app: App;
  plugin: BAC4Plugin;
  filePath?: string;
  diagramType: 'context' | 'container' | 'component';
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  setDiagramType: (type: 'context' | 'container' | 'component') => void;
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node<CanvasNodeData> | null>>;
  setSelectedEdge: React.Dispatch<React.SetStateAction<Edge | null>>;
  nodeCounterRef: React.MutableRefObject<number>;
  navigationService: DiagramNavigationService;
}

export interface DiagramActions {
  handleRenameDiagram: () => void;
  handleDiagramTypeChange: (newType: 'context' | 'container' | 'component') => void;
  handleBreadcrumbNavigate: (path: string) => Promise<void>;
}

/**
 * Custom hook for diagram-level actions
 *
 * @param props - Configuration options
 * @returns Object containing diagram action functions
 */
export function useDiagramActions(props: UseDiagramActionsProps): DiagramActions {
  const {
    app,
    plugin,
    filePath,
    diagramType,
    nodes,
    edges,
    setDiagramType,
    setNodes,
    setEdges,
    setSelectedNode,
    setSelectedEdge,
    nodeCounterRef,
    navigationService,
  } = props;

  /**
   * Rename current diagram
   */
  const handleRenameDiagram = React.useCallback(() => {
    if (!filePath) return;

    const currentName = getDiagramName(filePath);

    // Use Obsidian Modal instead of browser prompt()
    const modal = new RenameModal(app, {
      currentName,
      onSubmit: async (newName: string) => {
        try {
          console.log('BAC4: Renaming diagram to:', newName);
          const newPath = await navigationService.renameDiagram(filePath, newName);
          console.log('BAC4: Diagram renamed successfully to:', newPath);

          // Note: The view will be automatically updated by Obsidian's file rename event
          // Breadcrumbs will refresh when filePath changes
        } catch (error) {
          console.error('BAC4: Error renaming diagram:', error);
          const msg = error instanceof Error ? error.message : 'Unknown error';
          ErrorHandler.handleError(error, `Cannot rename diagram: ${msg}`);
        }
      },
      onCancel: () => {
        console.log('BAC4: Rename cancelled by user');
      },
    });

    modal.open();
  }, [filePath, navigationService, app]);

  /**
   * Handle diagram type switch with confirmation if diagram has content
   */
  const handleDiagramTypeChange = React.useCallback(
    (newType: 'context' | 'container' | 'component') => {
      console.log('BAC4: Diagram type change requested', { from: diagramType, to: newType });

      // If types are the same, do nothing
      if (newType === diagramType) {
        return;
      }

      // Check if diagram has elements
      const hasElements = nodes.length > 0 || edges.length > 0;

      if (hasElements) {
        // Show warning modal
        const modal = new DiagramTypeSwitchModal(app, {
          currentType: diagramType,
          newType,
          onConfirm: async () => {
            console.log('BAC4: User confirmed diagram type switch');
            // Clear diagram
            setNodes([]);
            setEdges([]);
            nodeCounterRef.current = 0;
            setSelectedNode(null);
            setSelectedEdge(null);

            // Update diagram type
            setDiagramType(newType);

            // Update in relationships file
            if (filePath) {
              try {
                await navigationService.updateDiagramType(filePath, newType);
                console.log('BAC4: ✅ Updated diagram type in relationships');
              } catch (error) {
                console.error('BAC4: Error updating diagram type:', error);
              }
            }
          },
          onCancel: () => {
            console.log('BAC4: User cancelled diagram type switch');
          },
        });
        modal.open();
      } else {
        // No elements, switch immediately
        console.log('BAC4: Diagram is empty, switching type immediately');
        setDiagramType(newType);

        // Update in relationships file
        if (filePath) {
          navigationService.updateDiagramType(filePath, newType).catch((error) => {
            console.error('BAC4: Error updating diagram type:', error);
          });
        }
      }
    },
    [
      diagramType,
      nodes,
      edges,
      filePath,
      navigationService,
      app,
      setNodes,
      setEdges,
      setDiagramType,
      setSelectedNode,
      setSelectedEdge,
      nodeCounterRef,
    ]
  );

  /**
   * Navigate to another diagram in a new tab
   */
  const handleBreadcrumbNavigate = React.useCallback(
    async (path: string) => {
      console.log('BAC4: Navigating to', path, 'in new tab');

      // Open in new tab
      await plugin.openCanvasViewInNewTab(path);
    },
    [plugin]
  );

  return {
    handleRenameDiagram,
    handleDiagramTypeChange,
    handleBreadcrumbNavigate,
  };
}
