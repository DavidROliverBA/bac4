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
import { AUTO_SAVE_DEBOUNCE_MS } from '../../../constants';
import { normalizeEdges } from '../utils/canvas-utils';
import { initializeNodeCounter } from '../utils/auto-naming';
import { Timeline, Annotation } from '../../../types/timeline';
import { readBAC4File, writeBAC4File } from '../../../data/file-io';
import { TimelineService } from '../../../services/TimelineService';

export interface UseFileOperationsProps {
  plugin: BAC4Plugin;
  filePath?: string;
  diagramType: 'context' | 'container' | 'component';
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  timeline: Timeline | null;
  timelineRef: React.MutableRefObject<Timeline | null>; // v1.0.0 - prevents stale closure issues
  annotations: Annotation[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CanvasNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setTimeline: React.Dispatch<React.SetStateAction<Timeline | null>>;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
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
    nodes,
    edges,
    timelineRef,
    annotations,
    setNodes,
    setEdges,
    setTimeline,
    setAnnotations,
    setDiagramType,
    nodeCounterRef,
  } = props;

  /**
   * Auto-save diagram data to file (v1.0.0 format with timeline)
   * Uses timelineRef to prevent stale closure issues
   */
  React.useEffect(() => {
    console.log('BAC4: Auto-save effect triggered', {
      filePath,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      annotationCount: annotations.length,
      hasTimeline: !!timelineRef.current,
    });

    if (!filePath || !timelineRef.current) {
      console.log('BAC4: No filePath or timeline, skipping auto-save');
      return;
    }

    const saveTimeout = setTimeout(async () => {
      try {
        // Get latest timeline from ref to avoid stale closure data (v1.0.0 race condition fix)
        const timeline = timelineRef.current;
        if (!timeline) {
          console.log('BAC4: Timeline ref is null, skipping auto-save');
          return;
        }

        console.log('BAC4: Starting auto-save to', filePath);

        // Auto-save to CURRENTLY SELECTED snapshot (v1.0.0 - all snapshots editable)
        const currentSnapshot = TimelineService.getCurrentSnapshot(timeline);
        const currentSnapshotId = timeline.currentSnapshotId;

        console.log('BAC4: Auto-save to selected snapshot:', {
          currentSnapshotId: currentSnapshotId,
          currentSnapshotLabel: currentSnapshot.label,
        });

        // Update the currently selected snapshot with current canvas state
        const updatedSnapshots = timeline.snapshots.map((snapshot) =>
          snapshot.id === currentSnapshotId
            ? {
                ...snapshot,
                // Use canvas state for updates
                nodes: JSON.parse(JSON.stringify(nodes)),
                edges: JSON.parse(JSON.stringify(edges)),
                annotations: JSON.parse(JSON.stringify(annotations)),
              }
            : snapshot
        );

        const updatedTimeline: Timeline = {
          ...timeline,
          snapshots: updatedSnapshots,
        };

        // Try to read existing file to preserve metadata
        // If it fails (corrupted/missing), create new v1.0.0 structure
        let diagramData;
        try {
          const existingFile = await readBAC4File(plugin.app.vault, filePath);
          diagramData = {
            ...existingFile,
            timeline: updatedTimeline,
          };
        } catch (readError) {
          console.log('BAC4: Could not read existing file, creating new v1.0.0 structure');
          // Create new v1.0.0 file structure
          const now = new Date().toISOString();
          diagramData = {
            version: '1.0.0' as const,
            metadata: {
              diagramType: 'context' as const, // Default, will be set correctly on next load
              createdAt: now,
              updatedAt: now,
            },
            timeline: updatedTimeline,
          };
        }

        console.log('BAC4: Saving v1.0.0 data', {
          version: diagramData.version,
          diagramType: diagramData.metadata.diagramType,
          snapshotCount: updatedTimeline.snapshots.length,
          currentSnapshot: currentSnapshot.label,
        });

        await writeBAC4File(plugin.app.vault, filePath, diagramData);
        console.log('BAC4: ✅ Auto-saved v1.0.0 diagram successfully');

        // CRITICAL: Update in-memory timeline state so snapshot switching loads latest changes
        setTimeline(updatedTimeline);
        console.log('BAC4: ✅ Updated in-memory timeline with auto-saved changes');
      } catch (error) {
        console.error('BAC4: ❌ Error auto-saving', error);
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      console.log('BAC4: Cleaning up save timeout');
      clearTimeout(saveTimeout);
    };
  }, [nodes, edges, annotations, timelineRef, filePath, plugin, setTimeline]);

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
              // Type-safe delete: We know this property exists from the 'in' check above
              delete (data as Record<string, unknown>).linkedDiagramPath;
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
   * Load canvas data when filePath changes (v1.0.0 format with timeline)
   */
  React.useEffect(() => {
    console.log('BAC4: Initializing canvas with filePath:', filePath);

    // Load from file if available (async)
    if (filePath) {
      console.log('BAC4: Loading diagram from file:', filePath);

      readBAC4File(plugin.app.vault, filePath)
        .then(async (data) => {
          console.log('BAC4: File content loaded, parsing v1.0.0 format...');

          console.log('BAC4: Parsed data:', {
            version: data.version,
            diagramType: data.metadata?.diagramType,
            snapshotCount: data.timeline.snapshots.length,
            currentSnapshotId: data.timeline.currentSnapshotId,
          });

          // Set diagram type from metadata
          if (data.metadata?.diagramType) {
            console.log('BAC4: Setting diagram type from metadata:', data.metadata.diagramType);
            setDiagramType(data.metadata.diagramType);
          }

          // Set timeline
          setTimeline(data.timeline);

          // Get current snapshot
          const currentSnapshot = TimelineService.getCurrentSnapshot(data.timeline);
          console.log('BAC4: Loading current snapshot:', currentSnapshot.label);

          // Validate and cleanup linked files
          let validatedNodes = currentSnapshot.nodes || [];
          if (validatedNodes.length > 0) {
            validatedNodes = await validateLinkedFiles(validatedNodes);
          }

          // Load nodes from current snapshot
          console.log(
            'BAC4: Loading nodes from current snapshot:',
            validatedNodes.length,
            'nodes'
          );
          setNodes(validatedNodes);

          // Initialize node counter based on existing nodes
          nodeCounterRef.current = initializeNodeCounter(validatedNodes);
          console.log('BAC4: Initialized node counter to', nodeCounterRef.current);

          // Load edges from current snapshot
          const snapshotEdges = currentSnapshot.edges || [];
          console.log('BAC4: Loading edges from current snapshot:', snapshotEdges.length);
          const edgesWithType = normalizeEdges(snapshotEdges);
          setEdges(edgesWithType);

          // Load annotations from current snapshot
          const snapshotAnnotations = currentSnapshot.annotations || [];
          console.log('BAC4: Loading annotations from current snapshot:', snapshotAnnotations.length);
          setAnnotations(snapshotAnnotations);
        })
        .catch((error) => {
          console.error('BAC4: Error loading file:', error);
          // Create initial timeline if file doesn't exist or is invalid
          console.log('BAC4: Creating initial timeline for new file');
          const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
          setTimeline(initialTimeline);
          setNodes([]);
          setEdges([]);
          setAnnotations([]);
          nodeCounterRef.current = 0;
        });
    } else {
      console.log('BAC4: No filePath provided, starting with empty canvas');
      const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
      setTimeline(initialTimeline);
      setNodes([]);
      setEdges([]);
      setAnnotations([]);
      nodeCounterRef.current = 0;
    }
  }, [filePath, plugin, setNodes, setEdges, setTimeline, setAnnotations, setDiagramType, nodeCounterRef, validateLinkedFiles]);
}
