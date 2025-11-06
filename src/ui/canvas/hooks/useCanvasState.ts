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
import { TFile, Notice } from 'obsidian';
import type { Node } from 'reactflow';
import type { CanvasNodeData, ReactFlowInstance, DiagramType } from '../../../types/canvas-types';
import type { ComponentDefinition } from '../../../../component-library/types';
import type BAC4Plugin from '../../../main';
import { AUTO_CREATE_CHILD_DELAY_MS } from '../../../constants';
import { getAutoName } from '../utils/auto-naming';
import {
  generateNodeId,
  createGenericNode,
  createC4Node,
  createCloudComponentNode,
} from '../utils/node-factory';
import { MarkdownLinkService } from '../../../services/markdown-link-service';
import { NodeRegistryService } from '../../../services/node-registry-service';
import { isValidNodeType, getValidationError } from '../../../utils/layer-validation';

export interface UseCanvasStateProps {
  plugin: BAC4Plugin;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  filePath?: string;
  diagramType: DiagramType;
  nodes: Node<CanvasNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  nodeCounterRef: React.MutableRefObject<number>;
  mousePosition: { x: number; y: number } | null;
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
    diagramType,
    nodes,
    setNodes,
    nodeCounterRef,
    mousePosition,
    onCreateChildDiagram,
    onPaneClickCallback,
  } = props;

  /**
   * Populate cross-references for a newly created or renamed node
   * Updates the local node and syncs cross-references across all diagrams
   */
  const populateCrossReferences = React.useCallback(
    async (nodeId: string, label: string) => {
      console.log('BAC4: 🔍 populateCrossReferences called', { nodeId, label, filePath });

      if (!filePath) {
        console.log('BAC4: ❌ No filePath, skipping cross-reference population');
        return;
      }

      const registry = NodeRegistryService.getInstance();
      if (!registry.isInitialized()) {
        console.log('BAC4: ❌ Registry not initialized, skipping cross-reference population');
        return;
      }

      // Get all references to this node name (including current diagram)
      const allReferences = registry.getReferences(label);
      console.log(
        `BAC4: 📋 Registry returned ${allReferences.length} references for "${label}":`,
        allReferences
      );

      if (allReferences.length <= 1) {
        // No cross-references - this is the only node with this name
        console.log('BAC4: ℹ️ No cross-references for:', label, '(only one instance exists)');
        return;
      }

      console.log(
        `BAC4: ✨ Found ${allReferences.length} instances of "${label}" - starting cross-reference sync`
      );

      // Get paths to other diagrams (excluding current)
      const otherDiagrams = allReferences
        .filter((ref) => ref.diagramPath !== filePath)
        .map((ref) => ref.diagramPath);

      // Update the local node's crossReferences
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  isReference: otherDiagrams.length > 0,
                  crossReferences: otherDiagrams,
                },
              }
            : n
        )
      );

      console.log('BAC4: Updated local node with cross-references');

      // Now update ALL other diagrams to include this diagram in their crossReferences
      console.log('BAC4: 💾 Starting to update cross-references in other diagrams...');
      for (const ref of allReferences) {
        if (ref.diagramPath === filePath) {
          console.log('BAC4: ⏭️ Skipping current diagram:', ref.diagramPath);
          continue; // Skip current diagram
        }

        console.log('BAC4: 📂 Processing diagram:', ref.diagramPath, 'nodeId:', ref.nodeId);

        try {
          const diagramFile = plugin.app.vault.getAbstractFileByPath(ref.diagramPath);
          if (!(diagramFile instanceof TFile)) {
            console.error('BAC4: ❌ Diagram file not found or not a file:', ref.diagramPath);
            continue;
          }

          console.log('BAC4: 📖 Reading diagram file:', ref.diagramPath);
          // Read diagram file
          const content = await plugin.app.vault.read(diagramFile);
          const diagramData = JSON.parse(content);
          console.log('BAC4: ✅ Successfully read and parsed diagram file');

          let nodes: Node<CanvasNodeData>[] = [];
          let nodesPath = '';

          // v1.0.0 format: nodes are in timeline snapshots
          if (diagramData.timeline?.snapshots && Array.isArray(diagramData.timeline.snapshots)) {
            const currentSnapshotId = diagramData.timeline.currentSnapshotId;
            const currentSnapshot = diagramData.timeline.snapshots.find(
              (s: any) => s.id === currentSnapshotId
            );

            if (currentSnapshot?.nodes && Array.isArray(currentSnapshot.nodes)) {
              nodes = currentSnapshot.nodes;
              nodesPath = 'timeline.snapshots[current].nodes';
            }
          }
          // Legacy format: nodes at top level
          else if (diagramData.nodes && Array.isArray(diagramData.nodes)) {
            nodes = diagramData.nodes;
            nodesPath = 'nodes';
          }

          // Update the node's crossReferences
          console.log('BAC4: 🔧 Updating node', ref.nodeId, 'with cross-references');
          const updatedNodes = nodes.map((node) => {
            if (node.id === ref.nodeId) {
              // Rebuild crossReferences for this node
              const crossRefs = allReferences
                .filter((r) => r.diagramPath !== ref.diagramPath)
                .map((r) => r.diagramPath);

              console.log('BAC4: 🔗 Setting cross-references for node:', {
                nodeId: ref.nodeId,
                label: node.data.label,
                crossRefs,
                isReference: crossRefs.length > 0,
              });

              return {
                ...node,
                data: {
                  ...node.data,
                  isReference: crossRefs.length > 0,
                  crossReferences: crossRefs,
                },
              };
            }
            return node;
          });

          // Update the diagram data structure
          console.log('BAC4: 📝 Updating diagram data structure at path:', nodesPath);
          if (nodesPath === 'timeline.snapshots[current].nodes') {
            const currentSnapshotId = diagramData.timeline.currentSnapshotId;
            const snapshotIndex = diagramData.timeline.snapshots.findIndex(
              (s: any) => s.id === currentSnapshotId
            );
            if (snapshotIndex !== -1) {
              diagramData.timeline.snapshots[snapshotIndex].nodes = updatedNodes;
              console.log('BAC4: ✅ Updated snapshot nodes at index:', snapshotIndex);
            } else {
              console.error('BAC4: ❌ Could not find snapshot with id:', currentSnapshotId);
            }
          } else {
            diagramData.nodes = updatedNodes;
            console.log('BAC4: ✅ Updated top-level nodes');
          }

          // Save the updated diagram
          console.log('BAC4: 💾 Writing updated diagram to disk:', ref.diagramPath);
          await plugin.app.vault.modify(diagramFile, JSON.stringify(diagramData, null, 2));
          console.log('BAC4: ✅ Successfully updated cross-references in:', ref.diagramPath);
        } catch (error) {
          console.error('BAC4: Error updating cross-references in:', ref.diagramPath, error);
        }
      }

      console.log('BAC4: ✅ Cross-reference sync complete');
    },
    [filePath, plugin, setNodes]
  );

  /**
   * Register newly created node in NodeRegistryService
   */
  const registerNode = React.useCallback(
    (nodeId: string, label: string, nodeType: string) => {
      console.log('BAC4: 📝 registerNode called', { nodeId, label, nodeType, filePath });

      if (!filePath) {
        console.log('BAC4: ❌ No filePath, skipping node registration');
        return;
      }

      const registry = NodeRegistryService.getInstance();
      if (!registry.isInitialized()) {
        console.log('BAC4: ❌ Registry not initialized, skipping node registration');
        return;
      }

      // Extract diagram name from file path
      const diagramName = filePath.split('/').pop()?.replace('.bac4', '') || filePath;

      registry.registerNode(nodeId, label, filePath, diagramName, nodeType);
      console.log('BAC4: ✅ Registered new node:', { nodeId, label, nodeType, filePath });

      // Populate cross-references if this node name exists elsewhere
      console.log('BAC4: 🔄 Calling populateCrossReferences for newly registered node');
      populateCrossReferences(nodeId, label);
    },
    [filePath, populateCrossReferences]
  );

  /**
   * Generate markdown file path for cloud component
   * Creates path in docs/ folder next to current diagram
   */
  const generateMarkdownPath = React.useCallback(
    (label: string): string | null => {
      if (!filePath) return null;

      // Get parent directory of current diagram
      const lastSlash = filePath.lastIndexOf('/');
      const parentDir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';

      // Sanitize label for filename
      const sanitizedLabel = label.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_');

      // Create path: parent/docs/Label.md
      return parentDir ? `${parentDir}/docs/${sanitizedLabel}.md` : `docs/${sanitizedLabel}.md`;
    },
    [filePath]
  );

  /**
   * Create markdown documentation file for cloud component
   */
  const createCloudComponentDocs = React.useCallback(
    async (
      _nodeId: string,
      label: string,
      _component: ComponentDefinition
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
    },
    [plugin, generateMarkdownPath]
  );

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

      // Use screenToFlowPosition (project is deprecated in React Flow 11+)
      // Type assertion needed as TS types not yet updated
      const position = (reactFlowInstance as any).screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if it's a BAC4 node (new format)
      const bac4NodeDataStr = event.dataTransfer.getData('application/bac4node');
      if (bac4NodeDataStr) {
        const { type, data } = JSON.parse(bac4NodeDataStr);

        // Validate node type for current diagram layer (v2.0.0)
        if (!isValidNodeType(type, diagramType)) {
          new Notice(getValidationError(type, diagramType), 5000);
          return;
        }

        const nodeId = generateNodeId(nodeCounterRef);

        // Generate auto-name
        const autoName = getAutoName(type, nodes);
        const finalData = { ...data, label: autoName };

        const newNode = createGenericNode(nodeId, type, position, finalData);
        setNodes((nds) => [...nds, newNode]);

        // Register node in registry
        registerNode(nodeId, autoName, type);

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

        // Register node in registry
        registerNode(nodeId, autoName, 'c4');
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

        // Register node in registry
        registerNode(nodeId, autoName, 'cloudComponent');

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
    [
      reactFlowInstance,
      setNodes,
      nodeCounterRef,
      nodes,
      onCreateChildDiagram,
      reactFlowWrapper,
      createCloudComponentDocs,
      registerNode,
    ]
  );

  /**
   * Add new node via toolbar button (generic)
   * Uses mouse position if available, otherwise center of viewport
   */
  const addNodeGeneric = React.useCallback(
    (nodeType: string, nodeData: Record<string, unknown>) => {
      // Validate node type for current diagram layer (v2.0.0)
      if (!isValidNodeType(nodeType, diagramType)) {
        new Notice(getValidationError(nodeType, diagramType), 5000);
        return;
      }

      const nodeId = generateNodeId(nodeCounterRef);

      // Generate auto-name
      const autoName = getAutoName(nodeType, nodes);
      const finalData = { ...nodeData, label: autoName };

      // Use mouse position if available, otherwise center of viewport
      const position = mousePosition || { x: 400, y: 300 };
      const newNode = createGenericNode(nodeId, nodeType, position, finalData);
      setNodes((nds) => [...nds, newNode]);

      // Register node in registry
      registerNode(nodeId, autoName, nodeType);

      // Auto-create child diagram
      setTimeout(
        () => onCreateChildDiagram(nodeId, nodeType, autoName),
        AUTO_CREATE_CHILD_DELAY_MS
      );
    },
    [
      setNodes,
      nodeCounterRef,
      nodes,
      mousePosition,
      onCreateChildDiagram,
      registerNode,
      diagramType,
    ]
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
   * Uses mouse position if available, otherwise center of viewport
   */
  const addCloudComponent = React.useCallback(
    (component: ComponentDefinition) => {
      const nodeId = generateNodeId(nodeCounterRef);
      // Use mouse position if available, otherwise center of viewport
      const position = mousePosition || { x: 400, y: 300 };

      const newNode = createCloudComponentNode(nodeId, position, component.name, component);
      setNodes((nds) => [...nds, newNode]);

      // Register node in registry
      registerNode(nodeId, component.name, 'cloudComponent');

      // Auto-create and link markdown file
      createCloudComponentDocs(nodeId, component.name, component).then((markdownPath) => {
        if (markdownPath) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, linkedMarkdownPath: markdownPath } } : n
            )
          );
          console.log('BAC4: ✅ Auto-linked markdown file:', markdownPath);
        }
      });
    },
    [setNodes, nodeCounterRef, mousePosition, createCloudComponentDocs, registerNode]
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
