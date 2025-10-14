/**
 * File Operations Hook
 *
 * Custom React hook that manages file I/O operations:
 * - Loading diagram data from .bac4 files
 * - Auto-saving diagram changes with debounce
 * - Node counter initialization
 * - Linked file validation (v0.6.0)
 *
 * @module useFileOperations
 */

import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import type BAC4Plugin from '../../../main';
import type { CanvasNodeData } from '../../../types/canvas-types';
import type { DiagramNavigationService } from '../../../services/diagram-navigation-service';
// v0.6.0: Removed frontmatter imports (markdown format deprecated)
import { AUTO_SAVE_DEBOUNCE_MS } from '../../../constants';
import { normalizeEdges } from '../utils/canvas-utils';
import { initializeNodeCounter } from '../utils/auto-naming';

export interface UseFileOperationsProps {
  plugin: BAC4Plugin;
  filePath?: string;
  diagramType: 'context' | 'container' | 'component';
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setDiagramType: (type: 'context' | 'container' | 'component') => void;
  nodeCounterRef: React.MutableRefObject<number>;
  navigationService: DiagramNavigationService;
}

/**
 * Custom hook for file operations
 *
 * Manages file loading and auto-saving (v0.6.0: breadcrumbs removed).
 *
 * @param props - Configuration options
 */
export function useFileOperations(props: UseFileOperationsProps): void {
  const {
    plugin,
    filePath,
    diagramType,
    nodes,
    edges,
    setNodes,
    setEdges,
    setDiagramType,
    nodeCounterRef,
    navigationService,
  } = props;

  /**
   * Auto-save diagram data to file (v0.6.0 format)
   */
  React.useEffect(() => {
    console.log('BAC4: Auto-save effect triggered', {
      filePath,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    if (!filePath) {
      console.log('BAC4: No filePath, skipping auto-save');
      return;
    }

    const saveTimeout = setTimeout(async () => {
      try {
        console.log('BAC4: Starting auto-save to', filePath);

        // Read existing file to get createdAt timestamp if it exists
        let createdAt = new Date().toISOString();
        try {
          const existingContent = await plugin.app.vault.adapter.read(filePath);
          const existingData = JSON.parse(existingContent);
          if (existingData.metadata?.createdAt) {
            createdAt = existingData.metadata.createdAt;
          }
        } catch {
          // File doesn't exist or is invalid, use current timestamp
        }

        // Prepare v0.6.0 diagram data
        const diagramData = {
          version: '0.6.0',
          metadata: {
            diagramType,
            createdAt,
            updatedAt: new Date().toISOString(),
          },
          nodes,
          edges,
        };

        console.log('BAC4: Saving v0.6.0 data', {
          version: diagramData.version,
          diagramType: diagramData.metadata.diagramType,
          nodeCount: nodes.length,
          edgeCount: edges.length,
        });

        // Save as pure JSON (.bac4 file) - v0.6.0 only supports .bac4 format
        console.log('BAC4: Saving as JSON (.bac4 file)');
        await plugin.app.vault.adapter.write(filePath, JSON.stringify(diagramData, null, 2));
        console.log('BAC4: ✅ Auto-saved v0.6.0 diagram successfully');
      } catch (error) {
        console.error('BAC4: ❌ Error auto-saving', error);
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      console.log('BAC4: Cleaning up save timeout');
      clearTimeout(saveTimeout);
    };
  }, [nodes, edges, filePath, plugin, diagramType]);

  /**
   * Validate linked files and cleanup broken references (v0.6.0)
   */
  const validateLinkedFiles = React.useCallback(
    async (loadedNodes: Node<CanvasNodeData>[]): Promise<Node<CanvasNodeData>[]> => {
      let needsSave = false;
      const vault = plugin.app.vault;

      const cleanedNodes = await Promise.all(
        loadedNodes.map(async (node) => {
          const data = { ...node.data };
          let updated = false;

          // Check linkedDiagramPath (only SystemNodeData and ContainerNodeData have this)
          if ('linkedDiagramPath' in data && data.linkedDiagramPath) {
            const file = vault.getAbstractFileByPath(data.linkedDiagramPath);
            if (!file) {
              console.warn(`BAC4: Broken link removed: ${node.id} → ${data.linkedDiagramPath}`);
              delete (data as any).linkedDiagramPath;
              updated = true;
            }
          }

          // Check linkedMarkdownPath
          if (data.linkedMarkdownPath) {
            const file = vault.getAbstractFileByPath(data.linkedMarkdownPath);
            if (!file) {
              console.warn(`BAC4: Broken link removed: ${node.id} → ${data.linkedMarkdownPath}`);
              delete data.linkedMarkdownPath;
              updated = true;
            }
          }

          if (updated) {
            needsSave = true;
            return { ...node, data };
          }
          return node;
        })
      );

      if (needsSave) {
        console.log('BAC4: Broken references cleaned, file will be re-saved');
      }

      return cleanedNodes;
    },
    [plugin]
  );

  /**
   * Load canvas data when filePath changes (v0.6.0 format)
   */
  React.useEffect(() => {
    console.log('BAC4: Initializing canvas with filePath:', filePath);

    // Load from file if available (async)
    if (filePath) {
      console.log('BAC4: Loading diagram from file:', filePath);

      // Load nodes and edges from file (.bac4 only - v0.6.0)
      plugin.app.vault.adapter
        .read(filePath)
        .then(async (content) => {
          console.log('BAC4: File content loaded, parsing v0.6.0 format...');

          // Parse as JSON (.bac4 file)
          const data = JSON.parse(content);

          console.log('BAC4: Parsed data:', {
            version: data.version,
            diagramType: data.metadata?.diagramType,
            hasNodes: !!data.nodes,
            nodeCount: data.nodes?.length,
            hasEdges: !!data.edges,
            edgeCount: data.edges?.length,
          });

          // Set diagram type from metadata (v0.6.0)
          if (data.metadata?.diagramType) {
            console.log('BAC4: Setting diagram type from metadata:', data.metadata.diagramType);
            setDiagramType(data.metadata.diagramType);
          }

          // Validate and cleanup linked files
          let validatedNodes = data.nodes || [];
          if (validatedNodes.length > 0) {
            validatedNodes = await validateLinkedFiles(validatedNodes);
          }

          // Always load from file if data structure exists, even if empty
          if (validatedNodes !== undefined) {
            console.log(
              'BAC4: Loading nodes from file:',
              validatedNodes.length,
              'first node position:',
              validatedNodes[0]?.position
            );
            setNodes(validatedNodes);

            // Initialize node counter based on existing nodes
            nodeCounterRef.current = initializeNodeCounter(validatedNodes);
            console.log('BAC4: Initialized node counter to', nodeCounterRef.current);
          } else {
            console.log('BAC4: No nodes array in file, starting with empty canvas');
            setNodes([]);
            nodeCounterRef.current = 0;
          }

          if (data.edges !== undefined) {
            console.log('BAC4: Loading edges from file:', data.edges.length);
            // Ensure all edges have the directional type and default data
            const edgesWithType = normalizeEdges(data.edges);
            setEdges(edgesWithType);
          } else {
            setEdges([]);
          }
        })
        .catch((error) => {
          console.error('BAC4: Error loading file:', error);
          // Start with empty canvas if file doesn't exist
          setNodes([]);
          setEdges([]);
          nodeCounterRef.current = 0;
        });
    } else {
      console.log('BAC4: No filePath provided, starting with empty canvas');
      setNodes([]);
      setEdges([]);
      nodeCounterRef.current = 0;
    }
  }, [filePath, plugin, setNodes, setEdges, setDiagramType, nodeCounterRef, validateLinkedFiles]);
}
