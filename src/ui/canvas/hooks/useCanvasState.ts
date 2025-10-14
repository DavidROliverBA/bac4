/**
 * Canvas State Hook
 *
 * Custom React hook that manages canvas-level state and interactions:
 * - React Flow instance initialization
 * - Drag-and-drop handling for nodes and components
 * - Node addition via toolbar buttons
 * - Auto-child diagram creation for System and Container nodes
 * - Pane click handling (deselection)
 *
 * @module useCanvasState
 */

import * as React from 'react';
import type { Node } from 'reactflow';
import type { CanvasNodeData, ReactFlowInstance } from '../../../types/canvas-types';
import type { ComponentDefinition } from '../../../../component-library/types';
import type BAC4Plugin from '../../../main';
import { AUTO_CREATE_CHILD_DELAY_MS } from '../../../constants';
import { getAutoName } from '../utils/auto-naming';
import {
  generateNodeId,
  generateRandomPosition,
  createGenericNode,
  createC4Node,
  createCloudComponentNode,
} from '../utils/node-factory';
import { MarkdownLinkService } from '../../../services/markdown-link-service';

export interface UseCanvasStateProps {
  plugin: BAC4Plugin;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  filePath?: string;
  diagramType: 'context' | 'container' | 'component';
  nodes: Node<CanvasNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  nodeCounterRef: React.MutableRefObject<number>;
  onCreateChildDiagram: (nodeId: string, nodeType: string, nodeLabel: string) => Promise<void>;
  onPaneClickCallback: () => void;
}

export interface CanvasStateHandlers {
  onReactFlowInit: (instance: ReactFlowInstance) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  addNodeGeneric: (nodeType: string, nodeData: Record<string, unknown>) => void;
  onComponentDragStart: (event: React.DragEvent, component: ComponentDefinition) => void;
  addCloudComponent: (component: ComponentDefinition) => void;
  onPaneClick: () => void;
}

/**
 * Custom hook for canvas state management
 *
 * @param props - Configuration options
 * @returns Object containing canvas state handlers
 */
export function useCanvasState(props: UseCanvasStateProps): CanvasStateHandlers {
  const {
    plugin,
    reactFlowWrapper,
    reactFlowInstance,
    setReactFlowInstance,
    filePath,
    nodes,
    setNodes,
    nodeCounterRef,
    onCreateChildDiagram,
    onPaneClickCallback,
  } = props;

  /**
   * Generate markdown file path for cloud component
   * Creates path in docs/ folder next to current diagram
   */
  const generateMarkdownPath = React.useCallback((label: string): string | null => {
    if (!filePath) return null;

    // Get parent directory of current diagram
    const lastSlash = filePath.lastIndexOf('/');
    const parentDir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';

    // Sanitize label for filename
    const sanitizedLabel = label.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_');

    // Create path: parent/docs/Label.md
    return parentDir ? `${parentDir}/docs/${sanitizedLabel}.md` : `docs/${sanitizedLabel}.md`;
  }, [filePath]);

  /**
   * Create markdown documentation file for cloud component
   */
  const createCloudComponentDocs = React.useCallback(async (
    nodeId: string,
    label: string,
    component: ComponentDefinition
  ): Promise<string | null> => {
    const markdownPath = generateMarkdownPath(label);
    if (!markdownPath) {
      console.log('BAC4: Cannot create markdown - diagram not saved');
      return null;
    }

    try {
      // Check if docs folder exists, create if not
      const docsFolder = markdownPath.substring(0, markdownPath.lastIndexOf('/'));
      const folderExists = plugin.app.vault.getAbstractFileByPath(docsFolder);

      if (!folderExists) {
        console.log('BAC4: Creating docs folder:', docsFolder);
        await plugin.app.vault.createFolder(docsFolder);
      }

      // Check if markdown file already exists
      const fileExists = await MarkdownLinkService.fileExists(plugin.app.vault, markdownPath);
      if (fileExists) {
        console.log('BAC4: Markdown file already exists:', markdownPath);
        return markdownPath; // Return existing path
      }

      // Create markdown file with cloud component template
      console.log('BAC4: Creating markdown file for cloud component:', markdownPath);
      await MarkdownLinkService.createMarkdownFile(
        plugin.app.vault,
        markdownPath,
        label,
        'cloudComponent'
      );
      console.log('BAC4: ✅ Markdown file created');

      return markdownPath;
    } catch (error) {
      console.error('BAC4: Error creating markdown file:', error);
      return null; // Don't fail node creation if markdown creation fails
    }
  }, [plugin, generateMarkdownPath]);

  /**
   * React Flow initialization callback
   */
  const onReactFlowInit = React.useCallback(
    (instance: ReactFlowInstance) => {
      console.log('BAC4: React Flow initialized!', {
        hasInstance: !!instance,
        nodeCount: instance.getNodes().length,
        edgeCount: instance.getEdges().length,
      });
      setReactFlowInstance(instance);
    },
    [setReactFlowInstance]
  );

  /**
   * Drag over handler (enables drop)
   */
  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Drop handler for adding nodes via drag-and-drop
   */
  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const position = reactFlowInstance.project({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if it's a BAC4 node (new format)
      const bac4NodeDataStr = event.dataTransfer.getData('application/bac4node');
      if (bac4NodeDataStr) {
        const { type, data } = JSON.parse(bac4NodeDataStr);
        const nodeId = generateNodeId(nodeCounterRef);

        // Generate auto-name
        const autoName = getAutoName(type, nodes);
        const finalData = { ...data, label: autoName };

        const newNode = createGenericNode(nodeId, type, position, finalData);
        setNodes((nds) => [...nds, newNode]);

        // Auto-create child diagram
        setTimeout(() => onCreateChildDiagram(nodeId, type, autoName), AUTO_CREATE_CHILD_DELAY_MS);
        return;
      }

      // Legacy: Check if it's a C4 node type
      const nodeType = event.dataTransfer.getData('application/reactflow') as
        | 'context'
        | 'container'
        | 'component';

      if (nodeType) {
        const nodeId = generateNodeId(nodeCounterRef);
        const autoName = getAutoName('c4', nodes);

        const newNode = createC4Node(nodeId, position, autoName, nodeType);
        setNodes((nds) => [...nds, newNode]);
        return;
      }

      // Check if it's a cloud component
      const componentDataStr = event.dataTransfer.getData('application/cloudcomponent');
      if (componentDataStr) {
        const component: ComponentDefinition = JSON.parse(componentDataStr);
        const nodeId = generateNodeId(nodeCounterRef);
        const autoName = getAutoName('cloudComponent', nodes);

        const newNode = createCloudComponentNode(nodeId, position, autoName, component);
        setNodes((nds) => [...nds, newNode]);

        // Auto-create and link markdown file
        createCloudComponentDocs(nodeId, autoName, component).then((markdownPath) => {
          if (markdownPath) {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, linkedMarkdownPath: markdownPath } }
                  : n
              )
            );
            console.log('BAC4: ✅ Auto-linked markdown file:', markdownPath);
          }
        });
      }
    },
    [reactFlowInstance, setNodes, nodeCounterRef, nodes, onCreateChildDiagram, reactFlowWrapper, createCloudComponentDocs]
  );

  /**
   * Add new node via toolbar button (generic)
   */
  const addNodeGeneric = React.useCallback(
    (nodeType: string, nodeData: Record<string, unknown>) => {
      const nodeId = generateNodeId(nodeCounterRef);

      // Generate auto-name
      const autoName = getAutoName(nodeType, nodes);
      const finalData = { ...nodeData, label: autoName };

      const position = generateRandomPosition();
      const newNode = createGenericNode(nodeId, nodeType, position, finalData);
      setNodes((nds) => [...nds, newNode]);

      // Auto-create child diagram
      setTimeout(
        () => onCreateChildDiagram(nodeId, nodeType, autoName),
        AUTO_CREATE_CHILD_DELAY_MS
      );
    },
    [setNodes, nodeCounterRef, nodes, onCreateChildDiagram]
  );

  /**
   * Drag start handler for cloud components
   */
  const onComponentDragStart = React.useCallback(
    (event: React.DragEvent, component: ComponentDefinition) => {
      event.dataTransfer.setData('application/cloudcomponent', JSON.stringify(component));
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  /**
   * Add cloud component via button click
   */
  const addCloudComponent = React.useCallback(
    (component: ComponentDefinition) => {
      const nodeId = generateNodeId(nodeCounterRef);
      const position = generateRandomPosition();

      const newNode = createCloudComponentNode(nodeId, position, component.name, component);
      setNodes((nds) => [...nds, newNode]);

      // Auto-create and link markdown file
      createCloudComponentDocs(nodeId, component.name, component).then((markdownPath) => {
        if (markdownPath) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, linkedMarkdownPath: markdownPath } }
                : n
            )
          );
          console.log('BAC4: ✅ Auto-linked markdown file:', markdownPath);
        }
      });
    },
    [setNodes, nodeCounterRef, createCloudComponentDocs]
  );

  /**
   * Handle pane click (deselect all)
   */
  const onPaneClick = React.useCallback(() => {
    onPaneClickCallback();
  }, [onPaneClickCallback]);

  return {
    onReactFlowInit,
    onDragOver,
    onDrop,
    addNodeGeneric,
    onComponentDragStart,
    addCloudComponent,
    onPaneClick,
  };
}
