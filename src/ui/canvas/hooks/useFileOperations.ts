/**
 * File Operations Hook
 *
 * Custom React hook that manages file I/O operations:
 * - Loading diagram data from .bac4 or .md files
 * - Auto-saving diagram changes with debounce
 * - Breadcrumb loading based on node selection
 * - Node counter initialization
 *
 * @module useFileOperations
 */

import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import type BAC4Plugin from '../../../main';
import type { CanvasNodeData } from '../../../types/canvas-types';
import type { DiagramNavigationService } from '../../../services/diagram-navigation-service';
import type { BreadcrumbItem } from '../../../types/component-props';
import {
  parseFrontmatter,
  extractDiagramData,
  buildMarkdownWithFrontmatter,
} from '../../../utils/frontmatter-parser';
import { AUTO_SAVE_DEBOUNCE_MS } from '../../../constants';
import { normalizeEdges, getDiagramName } from '../utils/canvas-utils';
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
  setBreadcrumbs: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>;
  nodeCounterRef: React.MutableRefObject<number>;
  breadcrumbRefreshTrigger: number;
  navigationService: DiagramNavigationService;
}

/**
 * Custom hook for file operations
 *
 * Manages file loading, auto-saving, and breadcrumb updates.
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
    setBreadcrumbs,
    nodeCounterRef,
    breadcrumbRefreshTrigger,
    navigationService,
  } = props;

  /**
   * Auto-save diagram data to file
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

        // Prepare diagram data
        const diagramData = {
          nodes,
          edges,
        };

        console.log('BAC4: Saving data', {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          firstNodePosition: nodes[0]?.position,
        });

        // Save based on file format
        if (filePath.endsWith('.md')) {
          console.log('BAC4: Saving as markdown with frontmatter');

          // Read existing file to preserve markdown body
          let existingBody = '';
          try {
            const existingContent = await plugin.app.vault.adapter.read(filePath);
            const { body } = parseFrontmatter(existingContent);
            existingBody = body;
          } catch (error) {
            // File doesn't exist yet, use empty body
            console.log('BAC4: No existing markdown body, starting fresh');
          }

          // Build frontmatter
          const frontmatter = {
            bac4_diagram: true,
            bac4_type: diagramType,
            bac4_updated: new Date().toISOString(),
            bac4_data: JSON.stringify(diagramData, null, 2),
          };

          // Combine frontmatter and body
          const content = buildMarkdownWithFrontmatter(frontmatter, existingBody);
          await plugin.app.vault.adapter.write(filePath, content);
          console.log('BAC4: ✅ Auto-saved markdown diagram successfully');
        } else {
          // Save as pure JSON (.bac4 file)
          console.log('BAC4: Saving as JSON (.bac4 file)');
          await plugin.app.vault.adapter.write(
            filePath,
            JSON.stringify(diagramData, null, 2)
          );
          console.log('BAC4: ✅ Auto-saved JSON diagram successfully');
        }
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
   * Load breadcrumbs for current diagram's hierarchy
   *
   * Simplified: Always shows current diagram's parent chain, not child diagrams.
   * Triggered on filePath change and breadcrumbRefreshTrigger.
   */
  React.useEffect(() => {
    if (!filePath) {
      setBreadcrumbs([]);
      return;
    }

    let cancelled = false;

    console.log('BAC4: Loading breadcrumbs for current diagram:', filePath);

    navigationService
      .buildBreadcrumbs(filePath)
      .then((breadcrumbs) => {
        if (cancelled) return;

        console.log('BAC4: Loaded breadcrumbs:', breadcrumbs.length, 'items');
        setBreadcrumbs(breadcrumbs);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('BAC4: Error loading breadcrumbs:', error);
          setBreadcrumbs([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filePath, navigationService, breadcrumbRefreshTrigger, setBreadcrumbs]);

  /**
   * Load canvas data when filePath changes
   */
  React.useEffect(() => {
    console.log('BAC4: Initializing canvas with filePath:', filePath);

    // Load from file if available (async)
    if (filePath) {
      console.log('BAC4: Loading diagram from file:', filePath);

      // Load diagram type from relationships file
      navigationService.getDiagramByPath(filePath).then((diagram) => {
        if (diagram) {
          console.log('BAC4: Setting diagram type from relationships:', diagram.type);
          setDiagramType(diagram.type);
        }
      });

      // Load nodes and edges from file (.bac4 or .md)
      plugin.app.vault.adapter
        .read(filePath)
        .then((content) => {
          console.log('BAC4: File content loaded, parsing...');

          let data: { nodes?: Node<CanvasNodeData>[]; edges?: Edge[] } = {};

          // Detect file format
          if (filePath.endsWith('.md')) {
            console.log('BAC4: Detected markdown file, parsing frontmatter...');
            const diagramData = extractDiagramData(content);
            if (diagramData) {
              data = diagramData;
              console.log('BAC4: Extracted diagram data from frontmatter');
            } else {
              console.warn('BAC4: No diagram data found in frontmatter');
              data = { nodes: [], edges: [] };
            }
          } else {
            // Parse as JSON (.bac4 file)
            console.log('BAC4: Parsing as JSON (.bac4 file)');
            data = JSON.parse(content);
          }

          console.log('BAC4: Parsed data:', {
            hasNodes: !!data.nodes,
            nodeCount: data.nodes?.length,
            hasEdges: !!data.edges,
            edgeCount: data.edges?.length,
          });

          // Always load from file if data structure exists, even if empty
          if (data.nodes !== undefined) {
            console.log(
              'BAC4: Loading nodes from file:',
              data.nodes.length,
              'first node position:',
              data.nodes[0]?.position
            );
            setNodes(data.nodes);

            // Initialize node counter based on existing nodes
            nodeCounterRef.current = initializeNodeCounter(data.nodes);
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
  }, [
    filePath,
    plugin,
    navigationService,
    setNodes,
    setEdges,
    setDiagramType,
    nodeCounterRef,
  ]);
}
