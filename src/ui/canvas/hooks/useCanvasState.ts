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
import { AUTO_CREATE_CHILD_DELAY_MS } from '../../../constants';
import { getAutoName } from '../utils/auto-naming';
import {
  generateNodeId,
  generateRandomPosition,
  createGenericNode,
  createC4Node,
  createCloudComponentNode,
} from '../utils/node-factory';

export interface UseCanvasStateProps {
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
    reactFlowWrapper,
    reactFlowInstance,
    setReactFlowInstance,
    nodes,
    setNodes,
    nodeCounterRef,
    onCreateChildDiagram,
    onPaneClickCallback,
  } = props;

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
      }
    },
    [reactFlowInstance, setNodes, nodeCounterRef, nodes, onCreateChildDiagram, reactFlowWrapper]
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
      setTimeout(() => onCreateChildDiagram(nodeId, nodeType, autoName), AUTO_CREATE_CHILD_DELAY_MS);
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
    },
    [setNodes, nodeCounterRef]
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
