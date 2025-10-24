/**
 * File Operations Hook v2.5.0
 *
 * Refactored to use dual-file format:
 * - .bac4 files: Nodes (semantic data)
 * - .bac4-graph files: Relationships + layout (presentation data)
 *
 * @version 2.5.0
 */

import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import type BAC4Plugin from '../../../main';
import type { CanvasNodeData, DiagramType } from '../../../types/canvas-types';
import type { DiagramNavigationService } from '../../../services/diagram-navigation-service';
import type { BAC4FileV2, BAC4GraphFileV2 } from '../../../types/bac4-v2-types';
import { AUTO_SAVE_DEBOUNCE_MS } from '../../../constants';
import { normalizeEdges } from '../utils/canvas-utils';
import { initializeNodeCounter } from '../utils/auto-naming';
import { Timeline, Annotation } from '../../../types/timeline';
import {
  readDiagram,
  writeDiagram,
  mergeNodesAndLayout,
  getEdgesFromGraph,
  splitNodesAndEdges,
  getGraphFilePath,
  fileExists,
} from '../../../services/file-io-service';
import { Notice } from 'obsidian';

export interface UseFileOperationsProps {
  plugin: BAC4Plugin;
  filePath?: string;
  diagramType: DiagramType;
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  timeline: Timeline | null;
  timelineRef: React.MutableRefObject<Timeline | null>;
  annotations: Annotation[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setTimeline: React.Dispatch<React.SetStateAction<Timeline | null>>;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  setDiagramType: (type: DiagramType) => void;
  nodeCounterRef: React.MutableRefObject<number>;
  navigationService: DiagramNavigationService;
}

/**
 * Custom hook for file operations (v2.5.0 dual-file format)
 *
 * Manages loading and saving of .bac4 + .bac4-graph files.
 */
export function useFileOperations(props: UseFileOperationsProps): void {
  const {
    plugin,
    filePath,
    nodes,
    edges,
    timeline,
    annotations,
    setNodes,
    setEdges,
    setTimeline,
    setAnnotations,
    setDiagramType,
    nodeCounterRef,
  } = props;

  // Store current files in refs to avoid stale closures
  const nodeFileRef = React.useRef<BAC4FileV2 | null>(null);
  const graphFileRef = React.useRef<BAC4GraphFileV2 | null>(null);

  /**
   * Auto-save diagram data to dual files (v2.5.0 format)
   */
  React.useEffect(() => {
    console.log('BAC4 v2.5: Auto-save effect triggered', {
      filePath,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      annotationCount: annotations.length,
      hasNodeFile: !!nodeFileRef.current,
      hasGraphFile: !!graphFileRef.current,
    });

    if (!filePath || !nodeFileRef.current || !graphFileRef.current) {
      console.log('BAC4 v2.5: No filePath or files not loaded, skipping auto-save');
      return;
    }

    const saveTimeout = setTimeout(async () => {
      try {
        console.log('BAC4 v2.5: Starting auto-save to', filePath);

        // ✅ FIX: Sync new snapshots from v1 timeline to v2.5 graphFileRef
        // timeline.snapshots is v1 format (from React state)
        // graphFileRef.timeline.snapshots is v2.5 format (for disk)
        // We need to convert any NEW v1 snapshots to v2.5 and add them
        if (timeline && graphFileRef.current) {
          const existingSnapshotIds = new Set(
            graphFileRef.current.timeline.snapshots.map(s => s.id)
          );

          // Find new snapshots that don't exist in graphFileRef yet
          const newSnapshots = timeline.snapshots.filter(
            s => !existingSnapshotIds.has(s.id)
          );

          // Convert new v1 snapshots to v2.5 format
          const newV2Snapshots = newSnapshots.map(v1Snapshot => {
            // Build layout from v1 nodes
            const layout: Record<string, any> = {};
            for (const node of v1Snapshot.nodes) {
              layout[node.id] = {
                x: node.position.x,
                y: node.position.y,
                width: node.width || 200,
                height: node.height || 100,
                locked: false,
              };
            }

            // Convert v1 edges to v2.5 edges
            const v2Edges = v1Snapshot.edges.map((edge: any) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              type: edge.type || 'default',
              properties: { label: edge.data?.label, ...edge.data },
              style: {
                direction: edge.data?.direction || 'right',
                lineType: 'solid',
                color: edge.style?.stroke || '#888888',
                markerEnd: edge.markerEnd || 'arrowclosed',
              },
              handles: {
                sourceHandle: edge.sourceHandle || 'right',
                targetHandle: edge.targetHandle || 'left',
              },
            }));

            return {
              id: v1Snapshot.id,
              label: v1Snapshot.label,
              timestamp: v1Snapshot.timestamp,
              description: v1Snapshot.description,
              created: v1Snapshot.createdAt,
              layout,
              edges: v2Edges,
              groups: [],
              annotations: v1Snapshot.annotations || [],
            };
          });

          // Update graphFileRef with new snapshots
          graphFileRef.current = {
            ...graphFileRef.current,
            timeline: {
              snapshots: [...graphFileRef.current.timeline.snapshots, ...newV2Snapshots],
              currentSnapshotId: timeline.currentSnapshotId,
              snapshotOrder: timeline.snapshotOrder,
            },
          };
        }

        // Split React Flow data back to v2.5.0 format
        const { nodeFile, graphFile } = splitNodesAndEdges(
          nodes,
          edges,
          nodeFileRef.current!,
          graphFileRef.current!
        );

        // Update refs with latest data
        nodeFileRef.current = nodeFile;
        graphFileRef.current = graphFile;

        // ✅ FIX: Update graphFile metadata to match current filename
        // This prevents creating duplicate files when diagram is renamed
        const fileName = filePath.split('/').pop() || filePath;
        graphFile.metadata.nodeFile = fileName;

        // Write both files
        await writeDiagram(plugin.app.vault, filePath, nodeFile, graphFile);

        console.log('BAC4 v2.5: ✅ Auto-saved successfully', {
          nodeFile: filePath,
          graphFile: getGraphFilePath(filePath),
          nodeCount: Object.keys(nodeFile.nodes).length,
          edgeCount: graphFile.timeline.snapshots[0]?.edges.length || 0,
        });
      } catch (error) {
        console.error('BAC4 v2.5: ❌ Error auto-saving', error);
        new Notice('Failed to auto-save diagram');
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(saveTimeout);
    };
  }, [nodes, edges, annotations, timeline, filePath, plugin]);

  /**
   * Validate linked files and cleanup broken references
   */
  const validateLinkedFiles = React.useCallback(
    async (loadedNodes: Node<CanvasNodeData>[]): Promise<Node<CanvasNodeData>[]> => {
      const vault = plugin.app.vault;
      let needsSave = false;

      const cleanedNodes = await Promise.all(
        loadedNodes.map(async (node) => {
          const data = { ...node.data };
          let updated = false;

          // Check linkedDiagramPath
          if ('linkedDiagramPath' in data && data.linkedDiagramPath) {
            const file = vault.getAbstractFileByPath(data.linkedDiagramPath);
            if (!file) {
              console.warn(
                `BAC4 v2.5: Broken link removed: ${node.id} → ${data.linkedDiagramPath}`
              );
              delete (data as Record<string, unknown>).linkedDiagramPath;
              updated = true;
            }
          }

          // Check links.linkedDiagrams (v2.5.0 format)
          if (node.data.links?.linkedDiagrams) {
            const validLinkedDiagrams = [];
            for (const link of node.data.links.linkedDiagrams) {
              const file = vault.getAbstractFileByPath(link.path);
              if (file) {
                validLinkedDiagrams.push(link);
              } else {
                console.warn(`BAC4 v2.5: Broken linked diagram removed: ${link.path}`);
                updated = true;
              }
            }
            if (updated) {
              data.links = {
                ...data.links,
                linkedDiagrams: validLinkedDiagrams,
              };
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
        console.log('BAC4 v2.5: Broken references cleaned, files will be re-saved');
      }

      return cleanedNodes;
    },
    [plugin]
  );

  /**
   * Load diagram when filePath changes (v2.5.0 dual-file format)
   */
  React.useEffect(() => {
    console.log('BAC4 v2.5: Initializing canvas with filePath:', filePath);

    if (!filePath) {
      console.log('BAC4 v2.5: No filePath provided, starting with empty canvas');
      nodeFileRef.current = null;
      graphFileRef.current = null;
      setNodes([]);
      setEdges([]);
      setAnnotations([]);
      nodeCounterRef.current = 0;
      return;
    }

    // Load both .bac4 and .bac4-graph files
    console.log('BAC4 v2.5: Loading diagram from dual files:', filePath);

    readDiagram(plugin.app.vault, filePath)
      .then(async ({ nodeFile, graphFile }) => {
        console.log('BAC4 v2.5: Files loaded successfully', {
          version: nodeFile.version,
          diagramType: nodeFile.metadata.diagramType,
          nodeCount: Object.keys(nodeFile.nodes).length,
          snapshotCount: graphFile.timeline.snapshots.length,
        });

        // Store files in refs for auto-save
        nodeFileRef.current = nodeFile;
        graphFileRef.current = graphFile;

        // Set diagram type from metadata
        if (nodeFile.metadata.diagramType) {
          setDiagramType(nodeFile.metadata.diagramType as DiagramType);
        }

        // Merge node data + layout data for React Flow
        const mergedNodes = mergeNodesAndLayout(nodeFile, graphFile);

        // Validate linked files
        const validatedNodes = await validateLinkedFiles(mergedNodes);

        // Set nodes
        setNodes(validatedNodes);

        // Initialize node counter
        nodeCounterRef.current = initializeNodeCounter(validatedNodes);
        console.log('BAC4 v2.5: Initialized node counter to', nodeCounterRef.current);

        // Get edges from graph file
        const graphEdges = getEdgesFromGraph(graphFile);
        const normalizedEdges = normalizeEdges(graphEdges);
        setEdges(normalizedEdges);

        // Get annotations from graph file
        const currentSnapshot = graphFile.timeline.snapshots.find(
          (s) => s.id === graphFile.timeline.currentSnapshotId
        );
        const snapshotAnnotations = currentSnapshot?.annotations || [];
        setAnnotations(snapshotAnnotations);

        // Create timeline from graph file (for backward compatibility)
        // Convert v2.5.0 timeline to v1 timeline format
        const v1Timeline: Timeline = {
          snapshots: graphFile.timeline.snapshots.map((s) => ({
            id: s.id,
            label: s.label,
            timestamp: s.timestamp,
            description: s.description,
            createdAt: s.created,
            nodes: mergeNodesAndLayout(nodeFile, graphFile, s.id),
            edges: s.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              type: e.type,
              data: e.properties,
              markerEnd: {
                type: e.style.markerEnd,
                color: e.style.color,
              },
              sourceHandle: e.handles.sourceHandle,
              targetHandle: e.handles.targetHandle,
            })),
            annotations: s.annotations,
          })),
          currentSnapshotId: graphFile.timeline.currentSnapshotId,
          snapshotOrder: graphFile.timeline.snapshotOrder,
        };
        setTimeline(v1Timeline);

        console.log('BAC4 v2.5: ✅ Diagram loaded successfully');
      })
      .catch((error) => {
        console.error('BAC4 v2.5: Error loading files:', error);

        // Check if this is a v1 file that needs migration
        if (error.message.includes('Invalid file version')) {
          new Notice(
            'This diagram uses an old format. Please run "Migrate Diagrams to v2.5.0" from the command palette.',
            10000
          );
        } else if (error.message.includes('Graph file not found')) {
          new Notice(
            'Graph file (.bac4-graph) not found. Please run migration.',
            10000
          );
        } else {
          new Notice('Failed to load diagram. See console for details.');
        }

        // Reset state
        nodeFileRef.current = null;
        graphFileRef.current = null;
        setNodes([]);
        setEdges([]);
        setAnnotations([]);
        nodeCounterRef.current = 0;
      });
  }, [
    filePath,
    plugin,
    setNodes,
    setEdges,
    setTimeline,
    setAnnotations,
    setDiagramType,
    nodeCounterRef,
    validateLinkedFiles,
  ]);
}
