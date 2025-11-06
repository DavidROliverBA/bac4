import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BAC4Plugin from '../main';
import { VIEW_TYPE_CANVAS } from '../core/constants';
import { MIN_ZOOM, MAX_ZOOM, FIT_VIEW_MAX_ZOOM } from '../constants';
import { C4Node } from './nodes/C4Node';
import { CloudComponentNode } from './nodes/CloudComponentNode';
import { SystemNode } from './nodes/SystemNode';
import { PersonNode } from './nodes/PersonNode';
import { ContainerNode } from './nodes/ContainerNode';
import { CapabilityNode } from './nodes/CapabilityNode';
import { MarketNode } from './nodes/MarketNode';
import { OrganisationNode } from './nodes/OrganisationNode';
import { CodeNode } from './nodes/CodeNode';
import { GraphNode } from './nodes/GraphNode';
import { DirectionalEdge } from './edges/DirectionalEdge';
import { ComponentPalette } from './components/ComponentPalette';
import { PropertyPanel } from './components/PropertyPanel';
import { UnifiedToolbar } from './components/UnifiedToolbar';
import { TimelineToolbar } from './components/TimelineToolbar';
import { NavigationControls } from './components/NavigationControls';
import { NavigationBreadcrumbs } from './components/NavigationBreadcrumbs';
import { AddSnapshotModal } from './components/AddSnapshotModal';
import { SnapshotManagerModal } from './components/SnapshotManager';
import { CreateLayoutModal, RenameLayoutModal, DeleteLayoutModal } from './modals/layout-modals';
import { AnnotationType } from './components/AnnotationPalette';
import { AnnotationOverlay } from './components/AnnotationOverlay';
import { ChangesSummaryPanel } from './components/ChangesSummaryPanel';
import { ComponentLibraryService } from '../services/component-library-service';
import { DiagramNavigationService } from '../services/diagram-navigation-service';
import { NavigationHistoryService } from '../services/navigation-history-service';
import { TimelineService } from '../services/TimelineService';
import { ChangeDetectionService } from '../services/ChangeDetectionService';
import { AnnotationService } from '../services/AnnotationService';
import { GraphGenerationService } from '../services/graph-generation-service';
import { NodeRegistryService } from '../services/node-registry-service';
import { LayoutManagerService, LayoutInfo } from '../services/layout-manager-service';
import type { CanvasNodeData, ReactFlowInstance, DiagramType } from '../types/canvas-types';
import type { Timeline, Annotation, ChangeSet } from '../types/timeline';
import { getNavigationIconVisibility } from '../utils/navigation-utils';

// Import custom hooks
import { useNodeHandlers } from './canvas/hooks/useNodeHandlers';
import { useEdgeHandlers } from './canvas/hooks/useEdgeHandlers';
import { useDiagramActions } from './canvas/hooks/useDiagramActions';
import { useFileOperations } from './canvas/hooks/useFileOperations';
import { useCanvasState } from './canvas/hooks/useCanvasState';

// Import utilities
import { shouldAutoCreateChild, getDiagramName } from './canvas/utils/canvas-utils';

/**
 * Canvas Editor Component - React Flow wrapper
 */
interface CanvasEditorProps {
  plugin: BAC4Plugin;
  filePath?: string;
  view?: BAC4CanvasView;
}

// <AI_MODIFIABLE>
// Custom node types mapping
// Add new node types here following the pattern:
// yourNodeType: YourNodeComponent,
const nodeTypes: NodeTypes = {
  c4: C4Node,
  cloudComponent: CloudComponentNode,
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
  capability: CapabilityNode,
  market: MarketNode, // v2.0.0: Layer 1 - Market segments
  organisation: OrganisationNode, // v2.0.0: Layer 2 - Business units
  code: CodeNode, // v2.0.0: Layer 7 - Implementation
  graph: GraphNode,
};

// Custom edge types mapping
// Add new edge types here following the pattern:
// yourEdgeType: YourEdgeComponent,
const edgeTypes: EdgeTypes = {
  directional: DirectionalEdge,
};
// </AI_MODIFIABLE>

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath, view }) => {
  console.log('CanvasEditor: Component rendered with filePath =', filePath);

  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [timeline, setTimeline] = React.useState<Timeline | null>(null);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = React.useState<Node<CanvasNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = React.useState<Edge | null>(null);
  const [mousePosition, setMousePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [diagramType, setDiagramType] = React.useState<DiagramType>('context');
  const nodeCounterRef = React.useRef(0);

  // Change detection state (v1.0.0)
  const [showChanges, setShowChanges] = React.useState(false);
  const [baseSnapshotId, setBaseSnapshotId] = React.useState<string | null>(null);
  const [currentChangeSet, setCurrentChangeSet] = React.useState<ChangeSet | null>(null);
  const [beforeSnapshotNodes, setBeforeSnapshotNodes] = React.useState<Node[]>([]);
  const [beforeSnapshotEdges, setBeforeSnapshotEdges] = React.useState<Edge[]>([]);

  // Annotation state (v1.0.0)
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<string | null>(null);

  // Wardley Map state (v2.5.0)
  const [showWardleyAxes, setShowWardleyAxes] = React.useState(true);
  const [showWardleyGrid, setShowWardleyGrid] = React.useState(false);
  const [wardleyBackgroundImage, setWardleyBackgroundImage] = React.useState<string | undefined>(
    undefined
  );
  const [wardleyBackgroundOpacity, setWardleyBackgroundOpacity] = React.useState(0.3);

  // Navigation state (v2.3.0)
  const [breadcrumbs, setBreadcrumbs] = React.useState<any[]>([]);

  // Layout state (v2.6.0 - Multiple Layouts)
  const [layouts, setLayouts] = React.useState<LayoutInfo[]>([]);
  const [currentLayout, setCurrentLayout] = React.useState<LayoutInfo | null>(null);
  const [currentGraphFilePath, setCurrentGraphFilePath] = React.useState<string | null>(null);

  // Timeline ref for auto-save (v1.0.0 - prevents race conditions)
  const timelineRef = React.useRef<Timeline | null>(null);

  // Force save ref (v2.5.1 - allows immediate save when switching snapshots)
  const forceSaveRef = React.useRef<(() => Promise<void>) | null>(null);

  // Keep ref in sync with state
  React.useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Services
  const [componentService] = React.useState(() => {
    const service = new ComponentLibraryService();
    service.initialize();
    return service;
  });
  const [navigationService] = React.useState(() => new DiagramNavigationService(plugin));
  const [navigationHistoryService] = React.useState(() => new NavigationHistoryService(plugin));
  const [layoutManager] = React.useState(() => new LayoutManagerService(plugin.app.vault));

  // Log whenever filePath prop changes
  React.useEffect(() => {
    console.log('CanvasEditor: filePath prop changed to:', filePath);
  }, [filePath]);

  // Sync selectedNode with nodes array when nodes change
  React.useEffect(() => {
    if (selectedNode) {
      const updatedNode = nodes.find((n) => n.id === selectedNode.id);
      if (updatedNode && updatedNode !== selectedNode) {
        setSelectedNode(updatedNode);
      }
    }
  }, [nodes, selectedNode]);

  /**
   * Automatically update edge handle connections based on node positions
   * This ensures edges connect from the optimal side of each node
   */
  React.useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return;

    const updatedEdges = edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return edge;

      // Calculate center positions of nodes
      const sourceX = sourceNode.position.x + (sourceNode.width || 150) / 2;
      const sourceY = sourceNode.position.y + (sourceNode.height || 100) / 2;
      const targetX = targetNode.position.x + (targetNode.width || 150) / 2;
      const targetY = targetNode.position.y + (targetNode.height || 100) / 2;

      // Calculate angle from source to target
      const deltaX = targetX - sourceX;
      const deltaY = targetY - sourceY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const normalizedAngle = angle < 0 ? angle + 360 : angle;

      // Determine optimal handles based on angle
      let sourceHandle: string;
      let targetHandle: string;

      if (normalizedAngle >= 315 || normalizedAngle < 45) {
        // Target is to the right
        sourceHandle = 'right';
        targetHandle = 'left';
      } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
        // Target is below
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
        // Target is to the left
        sourceHandle = 'left';
        targetHandle = 'right';
      } else {
        // Target is above
        sourceHandle = 'top';
        targetHandle = 'bottom';
      }

      // Only update if handles changed
      if (edge.sourceHandle !== sourceHandle || edge.targetHandle !== targetHandle) {
        return {
          ...edge,
          sourceHandle,
          targetHandle,
        };
      }

      return edge;
    });

    // Only update if something changed
    if (JSON.stringify(edges) !== JSON.stringify(updatedEdges)) {
      setEdges(updatedEdges);
    }
  }, [nodes, edges, setEdges]);

  /**
   * Create child diagram automatically for certain node types
   */
  const createChildDiagramIfNeeded = React.useCallback(
    async (nodeId: string, nodeType: string, nodeLabel: string) => {
      if (!filePath) return;

      // Only auto-create children for System and Container nodes
      if (!shouldAutoCreateChild(nodeType, diagramType)) {
        return;
      }

      try {
        const childDiagramType = nodeType === 'system' ? 'container' : 'component';
        console.log('BAC4: Auto-creating child diagram for', nodeLabel);

        await navigationService.createChildDiagram(
          filePath,
          nodeId,
          nodeLabel,
          diagramType as 'context' | 'container',
          childDiagramType
        );

        // Note: linkedDiagramPath is set by createChildDiagram() in node.data
        console.log('BAC4: ✅ Auto-created child diagram for', nodeLabel);
      } catch (error) {
        console.error('BAC4: Error auto-creating child diagram:', error);
      }
    },
    [filePath, diagramType, navigationService, setNodes]
  );

  /**
   * Handle node selection
   */
  const handleNodeSelect = React.useCallback((node: Node<CanvasNodeData> | null) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  /**
   * Handle edge selection
   */
  const handleEdgeSelect = React.useCallback((edge: Edge | null) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  /**
   * Handle pane click (deselect)
   */
  const handlePaneClickCallback = React.useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  /**
   * Track mouse position for node placement (v1.0.0)
   */
  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent) => {
      if (reactFlowInstance) {
        // Use screenToFlowPosition (project is deprecated in React Flow 11+)
        // Type assertion needed as TS types not yet updated
        const position = (reactFlowInstance as any).screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        setMousePosition(position);
      }
    },
    [reactFlowInstance]
  );

  // Custom hooks for modular functionality
  const nodeHandlers = useNodeHandlers({
    plugin,
    filePath,
    diagramType,
    nodes,
    setNodes,
    setEdges,
    navigationService,
    onNodeSelect: handleNodeSelect,
  });

  const edgeHandlers = useEdgeHandlers({
    setEdges,
    onEdgeSelect: handleEdgeSelect,
    diagramType, // v2.5.0: Pass diagram type to determine edge type (wardley vs directional)
  });

  const diagramActions = useDiagramActions({
    app: plugin.app,
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
  });

  const canvasState = useCanvasState({
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
    onCreateChildDiagram: createChildDiagramIfNeeded,
    onPaneClickCallback: handlePaneClickCallback,
  });

  // File operations hook (manages loading, saving)
  useFileOperations({
    plugin,
    filePath,
    diagramType,
    nodes,
    edges,
    timeline,
    timelineRef,
    annotations,
    setNodes,
    setEdges,
    setTimeline,
    setAnnotations,
    setDiagramType,
    nodeCounterRef,
    navigationService,
    forceSaveRef,
    currentGraphFilePath, // v2.6.0 - Multiple layouts
  });

  /**
   * Initialize layouts when file opens (v2.6.0)
   */
  React.useEffect(() => {
    if (!filePath) return;

    async function initializeLayouts() {
      try {
        const availableLayouts = await layoutManager.getLayoutsForNodeFile(filePath);
        setLayouts(availableLayouts);

        // Set current layout (default or first available)
        const defaultLayout = availableLayouts.find((l) => l.isDefault) || availableLayouts[0];
        if (defaultLayout) {
          setCurrentLayout(defaultLayout);
          setCurrentGraphFilePath(defaultLayout.graphPath);
        }
      } catch (error) {
        console.error('Failed to initialize layouts:', error);
      }
    }

    initializeLayouts();
  }, [filePath, layoutManager]);

  /**
   * Track navigation history (v2.3.0)
   * Note: Simplified to show only current diagram, not full history
   */
  React.useEffect(() => {
    if (filePath) {
      navigationHistoryService.addEntry({
        filePath,
        diagramType,
      });
      // Only show current diagram (last entry) in breadcrumbs
      const currentEntry = navigationHistoryService.getCurrentEntry();
      setBreadcrumbs(currentEntry ? [currentEntry] : []);
    }
  }, [filePath, diagramType, navigationHistoryService]);

  /**
   * Navigation handlers (v2.3.0)
   */
  const handleNavigateBack = async () => {
    const entry = await navigationHistoryService.goBack();
    if (entry) {
      // Only show current diagram in breadcrumbs
      const currentEntry = navigationHistoryService.getCurrentEntry();
      setBreadcrumbs(currentEntry ? [currentEntry] : []);
      // Open the previous diagram
      const file = plugin.app.vault.getAbstractFileByPath(entry.filePath);
      if (file instanceof plugin.app.vault.adapter.constructor.prototype.constructor) {
        await plugin.openDiagram(file as any, true);
      }
    }
  };

  const handleNavigateForward = async () => {
    const entry = await navigationHistoryService.goForward();
    if (entry) {
      // Only show current diagram in breadcrumbs
      const currentEntry = navigationHistoryService.getCurrentEntry();
      setBreadcrumbs(currentEntry ? [currentEntry] : []);
      // Open the next diagram
      const file = plugin.app.vault.getAbstractFileByPath(entry.filePath);
      if (file instanceof plugin.app.vault.adapter.constructor.prototype.constructor) {
        await plugin.openDiagram(file as any, true);
      }
    }
  };

  const handleBreadcrumbNavigate = async (entry: any) => {
    // Navigate to specific breadcrumb entry
    const file = plugin.app.vault.getAbstractFileByPath(entry.filePath);
    if (file instanceof plugin.app.vault.adapter.constructor.prototype.constructor) {
      await plugin.openDiagram(file as any, true);
    }
  };

  /**
   * Generate graph view when diagram type is 'graph'
   * The graph view is a special meta-visualization showing all diagrams
   */
  React.useEffect(() => {
    if (diagramType === 'graph') {
      console.log('BAC4: Diagram type changed to graph, generating graph view...');

      const generateGraphView = async () => {
        try {
          const { nodes: graphNodes, edges: graphEdges } =
            await GraphGenerationService.generateGraph(plugin.app.vault);

          console.log(
            'BAC4: Generated graph with',
            graphNodes.length,
            'nodes and',
            graphEdges.length,
            'edges'
          );

          setNodes(graphNodes);
          setEdges(graphEdges);

          // Fit view after a small delay to ensure nodes are rendered
          setTimeout(() => {
            if (reactFlowInstance) {
              reactFlowInstance.fitView({ padding: 0.2 });
            }
          }, 100);
        } catch (error) {
          console.error('BAC4: Error generating graph view:', error);
        }
      };

      generateGraphView();
    }
  }, [diagramType, plugin.app.vault, setNodes, setEdges]);

  /**
   * Handle navigation icon: drill down to child diagram
   */
  const handleNavigateToChild = React.useCallback(async () => {
    if (!selectedNode || !filePath) return;

    try {
      await nodeHandlers.handleCreateOrOpenChildDiagram(selectedNode);
    } catch (error) {
      console.error('BAC4: Error navigating to child:', error);
    }
  }, [selectedNode, filePath, nodeHandlers]);

  /**
   * Handle navigation icon: go to parent diagram
   */
  const handleNavigateToParent = React.useCallback(async () => {
    if (!filePath) return;

    try {
      const parentPath = await navigationService.navigateToParent(filePath);
      if (parentPath) {
        diagramActions.handleBreadcrumbNavigate(parentPath);
      }
    } catch (error) {
      console.error('BAC4: Error navigating to parent:', error);
    }
  }, [filePath, navigationService, diagramActions]);

  /**
   * Calculate navigation icon visibility (v0.6.0: simplified without breadcrumbs)
   */
  const navigationIconVisibility = React.useMemo(() => {
    if (!selectedNode || !filePath) {
      return { showPlus: false, showMinus: false };
    }

    // v0.6.0: Determine hasParent by checking if navigationService can find parent
    // For now, we'll use a simplified approach - only root (Context) diagrams have no parent
    const hasParent = diagramType !== 'context';

    // v0.6.0: Check linkedDiagramPath instead of hasChildDiagram
    // Type guard: linkedDiagramPath exists on SystemNodeData and ContainerNodeData
    const hasChildDiagram = !!(
      selectedNode.data &&
      'linkedDiagramPath' in selectedNode.data &&
      selectedNode.data.linkedDiagramPath
    );

    return getNavigationIconVisibility(selectedNode.type, diagramType, hasChildDiagram, hasParent);
  }, [selectedNode, filePath, diagramType]);

  /**
   * Timeline Handlers (v1.0.0)
   */
  const handleSnapshotSwitch = React.useCallback(
    async (snapshotId: string) => {
      if (!timeline) return;

      // ✅ v2.5.1 FIX: Save current canvas state to BOTH v1 timeline AND disk BEFORE switching
      // This prevents data loss when switching snapshots quickly
      const currentSnapshotIndex = timeline.snapshots.findIndex(
        (s) => s.id === timeline.currentSnapshotId
      );

      let updatedTimeline = timeline;
      if (currentSnapshotIndex !== -1) {
        console.log('BAC4 v2.5.1: Saving current canvas state before switching', {
          currentSnapshot: timeline.currentSnapshotId,
          nodeCount: nodes.length,
          edgeCount: edges.length,
        });

        // 1. Save to v1 timeline (in-memory)
        const updatedSnapshots = [...timeline.snapshots];
        updatedSnapshots[currentSnapshotIndex] = {
          ...updatedSnapshots[currentSnapshotIndex],
          nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
          edges: JSON.parse(JSON.stringify(edges)), // Deep copy
          annotations: JSON.parse(JSON.stringify(annotations)), // Deep copy
        };

        updatedTimeline = {
          ...timeline,
          snapshots: updatedSnapshots,
        };

        // 2. ✅ NEW: Force save to disk IMMEDIATELY (prevent data loss)
        if (forceSaveRef.current) {
          console.log('BAC4 v2.5.1: 💾 Force saving to disk before switch...');
          await forceSaveRef.current();
          console.log('BAC4 v2.5.1: ✅ Force save complete, now switching snapshots');
        } else {
          console.warn('BAC4 v2.5.1: ⚠️ forceSaveRef not available, changes may be lost!');
        }
      }

      const result = TimelineService.switchSnapshot(snapshotId, updatedTimeline);
      let updatedNodes = result.nodes;
      let updatedEdges = result.edges;

      // Apply change detection if enabled
      if (showChanges && baseSnapshotId && baseSnapshotId !== snapshotId) {
        const baseSnapshot = TimelineService.getSnapshotById(baseSnapshotId, updatedTimeline);
        const currentSnapshot = TimelineService.getSnapshotById(snapshotId, updatedTimeline);

        if (baseSnapshot && currentSnapshot) {
          const changes = ChangeDetectionService.compareSnapshots(baseSnapshot, currentSnapshot);

          // Store changeSet and before snapshot data for ChangesSummaryPanel
          setCurrentChangeSet(changes);
          setBeforeSnapshotNodes(baseSnapshot.nodes);
          setBeforeSnapshotEdges(baseSnapshot.edges);

          // Apply change indicators to nodes
          updatedNodes = ChangeDetectionService.applyNodeChangeIndicators(
            currentSnapshot.nodes,
            changes
          );

          // Apply change indicators to edges
          updatedEdges = ChangeDetectionService.applyEdgeChangeIndicators(
            currentSnapshot.edges,
            changes
          );

          console.log('BAC4: Applied change indicators', {
            nodeChanges:
              changes.addedNodes.length +
              changes.modifiedNodes.length +
              changes.removedNodes.length,
            edgeChanges: changes.addedEdges.length + changes.removedEdges.length,
          });
        }
      } else {
        // Clear change data when not comparing
        setCurrentChangeSet(null);
        setBeforeSnapshotNodes([]);
        setBeforeSnapshotEdges([]);
      }

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setAnnotations(result.annotations);

      // Update timeline's currentSnapshotId (use updatedTimeline which has saved state)
      setTimeline({
        ...updatedTimeline,
        currentSnapshotId: snapshotId,
      });

      console.log('BAC4: Switched to snapshot:', snapshotId);
    },
    [
      timeline,
      nodes,
      edges,
      annotations,
      setNodes,
      setEdges,
      setAnnotations,
      showChanges,
      baseSnapshotId,
    ]
  );

  const handleAddSnapshot = React.useCallback(() => {
    if (!timeline) return;

    // CRITICAL FIX: Always capture from CANVAS STATE, not from stored snapshot
    // The stored snapshot may be outdated due to auto-save debounce (1 second delay)
    // We must use the current canvas state to get the latest changes
    console.log('BAC4: 📸 Creating snapshot from CANVAS STATE', {
      canvasNodeCount: nodes.length,
      canvasEdgeCount: edges.length,
      canvasAnnotationCount: annotations.length,
      timelineSnapshotCount: timeline.snapshots.length,
    });

    const modal = new AddSnapshotModal(
      plugin.app,
      nodes, // ← FIXED: Use current canvas state
      edges, // ← FIXED: Use current canvas state
      annotations, // ← FIXED: Use current canvas state
      timeline,
      (updatedTimeline: Timeline, newSnapshotId: string) => {
        console.log('BAC4: 📸 Snapshot created:', newSnapshotId);
        console.log('BAC4: Updated timeline snapshot count:', updatedTimeline.snapshots.length);

        // ✅ v2.5.1 FIX: Auto-switch to new snapshot (approved spec behavior)
        // Timeline service already set currentSnapshotId to new snapshot
        // Now load the new snapshot's state into canvas
        const newSnapshot = updatedTimeline.snapshots.find((s) => s.id === newSnapshotId);

        if (newSnapshot) {
          console.log('BAC4: 🔄 Auto-switching to new snapshot:', newSnapshotId);

          // Load new snapshot's state into canvas
          setNodes(JSON.parse(JSON.stringify(newSnapshot.nodes))); // Deep copy
          setEdges(JSON.parse(JSON.stringify(newSnapshot.edges))); // Deep copy
          setAnnotations(JSON.parse(JSON.stringify(newSnapshot.annotations))); // Deep copy

          // Update timeline
          setTimeline(updatedTimeline);

          console.log('BAC4: ✅ Switched to new snapshot:', newSnapshot.label);
        } else {
          console.error('BAC4: ❌ New snapshot not found in timeline:', newSnapshotId);
          setTimeline(updatedTimeline);
        }
      }
    );
    modal.open();
  }, [
    plugin.app,
    timeline,
    nodes,
    edges,
    annotations,
    setNodes,
    setEdges,
    setAnnotations,
    setTimeline,
  ]);

  // Expose handleAddSnapshot to the view instance for command palette access
  React.useEffect(() => {
    if (view) {
      view.handleAddSnapshot = handleAddSnapshot;
    }
    return () => {
      if (view) {
        view.handleAddSnapshot = null;
      }
    };
  }, [view, handleAddSnapshot]);

  // Expose canvas state getters to view instance for export feature
  React.useEffect(() => {
    if (view) {
      view['nodesGetter'] = () => nodes;
      view['edgesGetter'] = () => edges;
    }
    return () => {
      if (view) {
        view['nodesGetter'] = null;
        view['edgesGetter'] = null;
      }
    };
  }, [view, nodes, edges]);

  const handleManageSnapshots = React.useCallback(() => {
    if (!timeline) return;

    const modal = new SnapshotManagerModal(plugin.app, timeline, (updatedTimeline: Timeline) => {
      setTimeline(updatedTimeline);
    });
    modal.open();
  }, [plugin.app, timeline]);

  /**
   * Toggle change indicators
   */
  const handleToggleChanges = React.useCallback(() => {
    setShowChanges((prev) => {
      const newValue = !prev;

      // When enabling change detection, set base snapshot to current snapshot
      if (newValue && timeline) {
        setBaseSnapshotId(timeline.currentSnapshotId);
        console.log('BAC4: Change detection enabled, base snapshot:', timeline.currentSnapshotId);
      } else {
        // When disabling, clear change indicators by re-switching to current snapshot
        if (timeline) {
          const currentSnapshot = TimelineService.getCurrentSnapshot(timeline);
          setNodes(currentSnapshot.nodes);
          setEdges(currentSnapshot.edges);
        }
        setBaseSnapshotId(null);
        // Clear change data
        setCurrentChangeSet(null);
        setBeforeSnapshotNodes([]);
        setBeforeSnapshotEdges([]);
        console.log('BAC4: Change detection disabled');
      }

      return newValue;
    });
  }, [timeline, setNodes, setEdges]);

  /**
   * Keyboard shortcuts for timeline and diagram navigation (v2.3.0)
   * - Cmd+[, Cmd+] - Timeline snapshot navigation
   * - Alt+Left, Alt+Right - Diagram navigation (back/forward)
   */
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Left - Navigate back
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        handleNavigateBack();
        return;
      }

      // Alt+Right - Navigate forward
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        handleNavigateForward();
        return;
      }

      // Timeline shortcuts - only if timeline has snapshots
      if (!timeline || timeline.snapshots.length < 2) return;

      const currentSnapshot = TimelineService.getCurrentSnapshot(timeline);

      // Cmd+[ - Previous snapshot
      if (event.metaKey && event.key === '[') {
        event.preventDefault();
        const previous = TimelineService.getPreviousSnapshot(currentSnapshot.id, timeline);
        if (previous) {
          handleSnapshotSwitch(previous.id);
        }
      }

      // Cmd+] - Next snapshot
      if (event.metaKey && event.key === ']') {
        event.preventDefault();
        const next = TimelineService.getNextSnapshot(currentSnapshot.id, timeline);
        if (next) {
          handleSnapshotSwitch(next.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeline, handleSnapshotSwitch, handleNavigateBack, handleNavigateForward]);

  /**
   * Annotation Handlers (v1.0.0)
   */
  const handleAddAnnotation = React.useCallback(
    (type: AnnotationType) => {
      if (!timeline) return;

      // Create annotation at center of viewport
      // Use screenToFlowPosition (project is deprecated in React Flow 11+)
      // Type assertion needed as TS types not yet updated
      const viewportCenter = reactFlowInstance
        ? (reactFlowInstance as any).screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          })
        : { x: 200, y: 200 };

      const annotation = AnnotationService.createAnnotation({
        type,
        position: { x: viewportCenter.x, y: viewportCenter.y },
        snapshotId: timeline.currentSnapshotId,
        properties: {
          text: type === 'sticky-note' || type === 'text-box' ? 'New annotation...' : '',
          color: type === 'sticky-note' ? '#FFD700' : type === 'text-box' ? '#FFFFFF' : '#90CAF9',
          width: type === 'sticky-note' ? 200 : type === 'text-box' ? 250 : 150,
          height: type === 'sticky-note' ? 150 : type === 'text-box' ? 100 : 150,
          linkedNodeId: null,
        },
      });

      const updatedAnnotations = [...annotations, annotation];
      setAnnotations(updatedAnnotations);
      setSelectedAnnotationId(annotation.id);

      console.log('BAC4: Created annotation:', annotation.type, annotation.id);
    },
    [timeline, annotations, reactFlowInstance]
  );

  const handleAnnotationClick = React.useCallback((id: string) => {
    console.log('BAC4: handleAnnotationClick called with id =', id);
    setSelectedAnnotationId(id);
    setSelectedNode(null);
    setSelectedEdge(null);
    console.log('BAC4: ✅ Annotation selected:', id);
  }, []);

  const handleAnnotationDrag = React.useCallback(
    (id: string, x: number, y: number) => {
      const updated = annotations.map((ann) =>
        ann.id === id ? { ...ann, position: { x, y } } : ann
      );
      setAnnotations(updated);
    },
    [annotations]
  );

  const handleAnnotationDragEnd = React.useCallback((id: string) => {
    console.log('BAC4: Annotation drag ended:', id);
    // Save is handled by auto-save effect
  }, []);

  const handleAnnotationTextUpdate = React.useCallback(
    (
      id: string,
      text: string,
      formatting?: { fontSize?: number; bold?: boolean; underline?: boolean }
    ) => {
      const updated = annotations.map((ann) =>
        ann.id === id ? { ...ann, data: { ...ann.data, text, ...formatting } } : ann
      );
      setAnnotations(updated);
      console.log('BAC4: Annotation updated:', id, formatting ? 'with formatting' : '');
    },
    [annotations]
  );

  const handleAnnotationResize = React.useCallback(
    (id: string, width: number, height: number) => {
      const updated = annotations.map((ann) =>
        ann.id === id ? { ...ann, data: { ...ann.data, width, height } } : ann
      );
      setAnnotations(updated);
    },
    [annotations]
  );

  const handleDeleteAnnotation = React.useCallback(() => {
    console.log(
      'BAC4: handleDeleteAnnotation called, selectedAnnotationId =',
      selectedAnnotationId
    );
    console.log('BAC4: Current annotations count =', annotations.length);

    if (!selectedAnnotationId) {
      console.log('BAC4: ❌ No annotation selected, returning early');
      return;
    }

    const updated = annotations.filter((ann) => ann.id !== selectedAnnotationId);
    console.log('BAC4: ✅ Filtered annotations, new count =', updated.length);

    setAnnotations(updated);
    setSelectedAnnotationId(null);
    console.log('BAC4: ✅ Deleted annotation:', selectedAnnotationId);
  }, [selectedAnnotationId, annotations]);

  /**
   * Wardley Map Handlers (v2.5.0) - DISABLED
   * Wardley Map support removed in v3.0.0
   */
  // const handleAddWardleyComponent = React.useCallback(() => { ... }, []);
  // const handleAddWardleyInertia = React.useCallback(() => { ... }, []);

  /**
   * Layout Handlers (v2.6.0 - Multiple Layouts)
   */

  // Switch to a different layout
  const handleLayoutSwitch = React.useCallback(
    async (graphPath: string) => {
      if (!filePath) return;

      try {
        // Force save current state before switching
        if (forceSaveRef.current) {
          await forceSaveRef.current();
        }

        // Layout switching will be handled by useFileOperations hook
        // when currentGraphFilePath changes
        setCurrentGraphFilePath(graphPath);

        // Update current layout in state
        const newLayout = layouts.find((l) => l.graphPath === graphPath);
        if (newLayout) {
          setCurrentLayout(newLayout);
          plugin.app.workspace.trigger('bac4:layout-switched', { layoutPath: graphPath });
        }
      } catch (error) {
        console.error('Failed to switch layout:', error);
      }
    },
    [filePath, forceSaveRef, layouts, plugin]
  );

  // Create a new layout
  const handleCreateLayout = React.useCallback(() => {
    if (!filePath) return;

    // Determine suggested view type based on current diagram
    const suggestedType =
      diagramType === 'wardley'
        ? 'wardley'
        : diagramType === 'context'
          ? 'c4-context'
          : diagramType === 'container'
            ? 'c4-container'
            : diagramType === 'component'
              ? 'c4-component'
              : 'custom';

    new CreateLayoutModal(
      plugin.app,
      suggestedType,
      async (layoutName, viewType, copyFromCurrent) => {
        try {
          // Read current graph file if copying
          let currentGraphData = null;
          if (copyFromCurrent && currentGraphFilePath) {
            const content = await plugin.app.vault.adapter.read(currentGraphFilePath);
            currentGraphData = JSON.parse(content);
          }

          // Create new layout
          const newGraphPath = await layoutManager.createLayout(filePath, {
            viewType,
            layoutName,
            copyFromCurrent,
            currentGraphFile: currentGraphData,
          });

          // Refresh layouts list
          const updatedLayouts = await layoutManager.getLayoutsForNodeFile(filePath);
          setLayouts(updatedLayouts);

          // Switch to new layout
          await handleLayoutSwitch(newGraphPath);
        } catch (error) {
          console.error('Failed to create layout:', error);
        }
      }
    ).open();
  }, [filePath, diagramType, currentGraphFilePath, layoutManager, plugin, handleLayoutSwitch]);

  // Rename an existing layout
  const handleRenameLayout = React.useCallback(
    (graphPath: string) => {
      const layout = layouts.find((l) => l.graphPath === graphPath);
      if (!layout || !filePath) return;

      new RenameLayoutModal(plugin.app, layout.title, async (newName) => {
        try {
          await layoutManager.renameLayout(graphPath, newName);

          // Refresh layouts list
          const updatedLayouts = await layoutManager.getLayoutsForNodeFile(filePath);
          setLayouts(updatedLayouts);

          // Update current layout if it was renamed
          if (graphPath === currentGraphFilePath) {
            const renamedLayout = updatedLayouts.find((l) => l.graphPath !== graphPath);
            if (renamedLayout) {
              setCurrentLayout(renamedLayout);
            }
          }
        } catch (error) {
          console.error('Failed to rename layout:', error);
        }
      }).open();
    },
    [layouts, filePath, layoutManager, plugin, currentGraphFilePath]
  );

  // Delete a layout
  const handleDeleteLayout = React.useCallback(
    (graphPath: string) => {
      const layout = layouts.find((l) => l.graphPath === graphPath);
      if (!layout || !filePath) return;

      new DeleteLayoutModal(plugin.app, layout.title, async () => {
        try {
          await layoutManager.deleteLayout(graphPath);

          // Refresh layouts list
          const updatedLayouts = await layoutManager.getLayoutsForNodeFile(filePath);
          setLayouts(updatedLayouts);

          // If current layout was deleted, switch to default
          if (graphPath === currentGraphFilePath) {
            const defaultLayout = updatedLayouts.find((l) => l.isDefault);
            if (defaultLayout) {
              await handleLayoutSwitch(defaultLayout.graphPath);
            }
          }
        } catch (error) {
          console.error('Failed to delete layout:', error);
        }
      }).open();
    },
    [layouts, filePath, layoutManager, plugin, currentGraphFilePath, handleLayoutSwitch]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Unified Horizontal Toolbar */}
      <UnifiedToolbar
        currentType={diagramType}
        onTypeChange={diagramActions.handleDiagramTypeChange}
        onAddNode={canvasState.addNodeGeneric}
        onAddAnnotation={handleAddAnnotation}
        selectedNode={selectedNode}
        selectedAnnotationId={selectedAnnotationId}
        onDeleteNode={() => selectedNode && nodeHandlers.handleDeleteNode(selectedNode.id)}
        onDeleteAnnotation={handleDeleteAnnotation}
        onRenameDiagram={diagramActions.handleRenameDiagram}
        onBringNodeForward={() => selectedNode && nodeHandlers.bringNodeForward(selectedNode.id)}
        onSendNodeBackward={() => selectedNode && nodeHandlers.sendNodeBackward(selectedNode.id)}
        onAddSnapshot={timeline ? handleAddSnapshot : undefined}
        diagramName={filePath ? getDiagramName(filePath) : 'diagram'}
        filePath={filePath}
        timeline={timeline}
        layouts={layouts}
        currentLayout={currentLayout}
        onLayoutSwitch={handleLayoutSwitch}
        onCreateLayout={handleCreateLayout}
        onRenameLayout={handleRenameLayout}
        onDeleteLayout={handleDeleteLayout}
      />

      {/* Navigation Controls & Breadcrumbs (v2.3.0) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'var(--background-secondary)',
          borderBottom: '1px solid var(--background-modifier-border)',
        }}
      >
        <NavigationControls
          plugin={plugin}
          navigationService={navigationHistoryService}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
        />
        <NavigationBreadcrumbs
          plugin={plugin}
          breadcrumbs={breadcrumbs}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>

      {/* Timeline Toolbar (v1.0.0 - shows when 2+ snapshots) */}
      {timeline && (
        <TimelineToolbar
          timeline={timeline}
          onSnapshotSwitch={handleSnapshotSwitch}
          onAddSnapshot={handleAddSnapshot}
          onManageSnapshots={handleManageSnapshots}
          showChanges={showChanges}
          onToggleChanges={handleToggleChanges}
        />
      )}

      {/* Wardley Toolbar - DISABLED in v3.0.0
      {diagramType === 'wardley' && (
        <WardleyToolbar ... />
      )}
      */}

      {/* React Flow Canvas */}
      <div
        ref={reactFlowWrapper}
        className="bac4-canvas-export-container"
        style={{
          width: '100%',
          flex: 1,
          position: 'relative',
        }}
      >
        <ReactFlow
          id={filePath ? `rf-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'rf-default'}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={edgeHandlers.onConnect}
          onNodeClick={nodeHandlers.onNodeClick}
          onNodeDoubleClick={nodeHandlers.onNodeDoubleClick}
          onNodeContextMenu={nodeHandlers.onNodeContextMenu}
          onEdgeClick={edgeHandlers.onEdgeClick}
          onPaneClick={canvasState.onPaneClick}
          onMouseMove={handleMouseMove}
          onInit={canvasState.onReactFlowInit}
          onDrop={canvasState.onDrop}
          onDragOver={canvasState.onDragOver}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: FIT_VIEW_MAX_ZOOM }}
          deleteKeyCode="Delete"
          connectionMode={ConnectionMode.Loose}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            id={filePath ? `bg-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'bg-default'}
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
          />
        </ReactFlow>

        {/* Canvas Controls - Outside ReactFlow so not exported */}
        {reactFlowInstance && (
          <div
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: 'var(--background-primary)',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
            }}
          >
            <button
              onClick={() => reactFlowInstance.zoomIn()}
              style={{
                background: 'var(--background-secondary)',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                color: 'var(--text-normal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => reactFlowInstance.zoomOut()}
              style={{
                background: 'var(--background-secondary)',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                color: 'var(--text-normal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
              style={{
                background: 'var(--background-secondary)',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-normal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Fit view"
            >
              ⊡
            </button>
          </div>
        )}

        {/* Component Palette - Outside ReactFlow for custom positioning */}
        {diagramType === 'component' && (
          <ComponentPalette
            service={componentService}
            onDragStart={canvasState.onComponentDragStart}
            onAddComponent={canvasState.addCloudComponent}
          />
        )}

        {/* Wardley Canvas Overlay - DISABLED in v3.0.0
        {diagramType === 'wardley' && (
          <WardleyCanvas ... />
        )}
        */}

        {/* Annotation Overlay (v1.0.0) */}
        <AnnotationOverlay
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          onAnnotationClick={handleAnnotationClick}
          onAnnotationDrag={handleAnnotationDrag}
          onAnnotationDragEnd={handleAnnotationDragEnd}
          onAnnotationTextUpdate={handleAnnotationTextUpdate}
          onAnnotationResize={handleAnnotationResize}
        />

        {/* Changes Summary Panel (v1.0.0) */}
        {currentChangeSet && (
          <ChangesSummaryPanel
            changeSet={currentChangeSet}
            nodes={nodes}
            edges={edges}
            beforeNodes={beforeSnapshotNodes}
            beforeEdges={beforeSnapshotEdges}
            isVisible={showChanges}
          />
        )}

        {/* Property Panel */}
        <PropertyPanel
          node={selectedNode}
          edge={selectedEdge}
          onUpdateLabel={nodeHandlers.updateNodeLabel}
          onUpdateProperties={nodeHandlers.updateNodeProperties}
          onUpdateEdgeLabel={edgeHandlers.updateEdgeLabel}
          onUpdateEdgeDirection={edgeHandlers.updateEdgeDirection}
          onUpdateEdgeStyle={edgeHandlers.updateEdgeStyle}
          onDeleteEdge={edgeHandlers.handleDeleteEdge}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          plugin={plugin}
          currentDiagramPath={filePath}
          currentDiagramType={diagramType}
          navigationService={navigationService}
          onOpenDiagram={diagramActions.handleBreadcrumbNavigate}
          onCreateAndLinkChild={async (nodeId: string) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              await nodeHandlers.handleCreateOrOpenChildDiagram(node);
            }
          }}
          app={plugin.app}
          vault={plugin.app.vault}
          workspace={plugin.app.workspace}
          onLinkMarkdownFile={nodeHandlers.linkMarkdownFile}
          onUnlinkMarkdownFile={nodeHandlers.unlinkMarkdownFile}
          onCreateAndLinkMarkdownFile={nodeHandlers.createAndLinkMarkdownFile}
          onOpenLinkedMarkdownFile={nodeHandlers.openLinkedMarkdownFile}
          onUpdateMarkdownImage={nodeHandlers.updateMarkdownImage}
          onNavigateToChild={handleNavigateToChild}
          onNavigateToParent={handleNavigateToParent}
          showNavigateToChild={navigationIconVisibility.showPlus}
          showNavigateToParent={navigationIconVisibility.showMinus}
        />

        {/* Wardley Property Panel - DISABLED in v3.0.0
        {selectedNode && (selectedNode.type === 'wardley-component' || selectedNode.type === 'wardley-inertia') && (
          <WardleyPropertyPanel ... />
        )}
        */}
      </div>
    </div>
  );
};

/**
 * Obsidian ItemView for BAC4 Canvas
 */
export class BAC4CanvasView extends ItemView {
  plugin: BAC4Plugin;
  root: ReactDOM.Root | null = null;
  filePath?: string;
  file?: TFile;
  // Handler for adding timeline snapshots (set by React component)
  handleAddSnapshot: (() => void) | null = null;
  // Canvas state accessors (set by React component for export feature)
  private nodesGetter: (() => Node<CanvasNodeData>[]) | null = null;
  private edgesGetter: (() => Edge[]) | null = null;
  // Event reference for file rename
  private renameEventRef: any = null;

  constructor(leaf: WorkspaceLeaf, plugin: BAC4Plugin, filePath?: string) {
    super(leaf);
    this.plugin = plugin;
    this.filePath = filePath;
  }

  getViewType(): string {
    return VIEW_TYPE_CANVAS;
  }

  getDisplayText(): string {
    return this.filePath ? `Canvas: ${this.filePath}` : 'BAC4 Canvas';
  }

  getIcon(): string {
    return 'layout-dashboard';
  }

  /**
   * Get current nodes (for export feature)
   */
  getNodes(): Node<CanvasNodeData>[] | null {
    return this.nodesGetter ? this.nodesGetter() : null;
  }

  /**
   * Get current edges (for export feature)
   */
  getEdges(): Edge[] | null {
    return this.edgesGetter ? this.edgesGetter() : null;
  }

  /**
   * Get current file path (for export feature)
   */
  getFilePath(): string | undefined {
    return this.filePath;
  }

  /**
   * Get diagram type (for AI features)
   * Returns the diagram type from metadata or defaults to 'context'
   */
  getDiagramType(): DiagramType {
    // TODO: Read from file metadata when available
    // For now, return a default
    return 'context';
  }

  async setState(state: { file?: string; filePath?: string }, result: unknown): Promise<void> {
    console.log('BAC4CanvasView: ⚠️ setState called with', state);

    const newFilePath = state.file || state.filePath;

    // CRITICAL: Check for duplicates BEFORE setting file path
    if (newFilePath) {
      console.log('BAC4CanvasView: Checking for existing tabs with file:', newFilePath);

      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
      const leavesWithThisFile = leaves.filter((leaf) => {
        const view = leaf.view as BAC4CanvasView;
        const hasFile = view.file?.path === newFilePath || view.filePath === newFilePath;
        return hasFile && leaf !== this.leaf;
      });

      console.log(
        'BAC4CanvasView: Found',
        leavesWithThisFile.length,
        'OTHER leaves with file',
        newFilePath
      );

      // If file already open in another leaf, activate it and close this one
      if (leavesWithThisFile.length > 0) {
        console.log(
          'BAC4CanvasView: ❌ DUPLICATE DETECTED in setState! Closing this leaf and activating existing'
        );
        const otherLeaf = leavesWithThisFile[0];
        this.app.workspace.setActiveLeaf(otherLeaf, { focus: true });
        this.leaf.detach();
        return; // Don't continue
      }

      console.log('BAC4CanvasView: ✅ No duplicate found in setState, proceeding');
    }

    // Handle file path from state
    if (state.file) {
      this.filePath = state.file;
      // Also get the TFile object
      const file = this.app.vault.getAbstractFileByPath(state.file);
      if (file) {
        this.file = file as TFile;
      }
      console.log('BAC4CanvasView: Set filePath from state.file:', this.filePath);
    } else if (state.filePath) {
      this.filePath = state.filePath;
      // Also get the TFile object
      const file = this.app.vault.getAbstractFileByPath(state.filePath);
      if (file) {
        this.file = file as TFile;
      }
      console.log('BAC4CanvasView: Set filePath from state.filePath:', this.filePath);
    }

    // Parent ItemView.setState expects any, but we receive unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await super.setState(state, result as any);

    // Re-render if we have a root and filePath changed
    if (this.root && this.filePath) {
      console.log('BAC4CanvasView: Re-rendering after setState');
      this.renderCanvas();
    }
  }

  getState(): { file?: string; filePath?: string } {
    const state = {
      file: this.file?.path,
      filePath: this.filePath,
    };
    console.log('BAC4CanvasView: getState returning', state);
    return state;
  }

  async onLoadFile(file: TFile): Promise<void> {
    console.log('BAC4CanvasView: ⚠️ onLoadFile called with', file.path);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('BAC4CanvasView: Current leaf ID:', (this.leaf as any).id);

    // CRITICAL: Check for duplicates BEFORE setting file
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
    console.log('BAC4CanvasView: Total BAC4 canvas leaves:', leaves.length);

    const leavesWithThisFile = leaves.filter((leaf) => {
      const view = leaf.view as BAC4CanvasView;
      const hasFile = view.file?.path === file.path || view.filePath === file.path;
      if (hasFile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('BAC4CanvasView: Leaf', (leaf as any).id, 'has file', file.path);
      }
      return hasFile && leaf !== this.leaf;
    });

    console.log(
      'BAC4CanvasView: Found',
      leavesWithThisFile.length,
      'OTHER leaves with file',
      file.path
    );

    // If file already open in another leaf, activate it and close this one
    if (leavesWithThisFile.length > 0) {
      console.log(
        'BAC4CanvasView: ❌ DUPLICATE DETECTED! Closing this leaf and activating existing'
      );
      const otherLeaf = leavesWithThisFile[0];
      this.app.workspace.setActiveLeaf(otherLeaf, { focus: true });
      this.leaf.detach();
      return; // Don't continue loading
    }

    // No duplicate found, proceed normally
    console.log('BAC4CanvasView: ✅ No duplicate found, loading file normally');
    this.file = file;
    this.filePath = file.path;

    // Re-render with new file path if root exists
    if (this.root) {
      console.log('BAC4CanvasView: Re-rendering with new filePath');
      this.renderCanvas();
    }
  }

  private renderCanvas(): void {
    console.log('BAC4CanvasView: Rendering canvas with filePath:', this.filePath);

    // CRITICAL: Always unmount and remount React to ensure fresh React Flow instance
    if (this.root) {
      console.log('BAC4CanvasView: Unmounting existing React root for fresh start');
      this.root.unmount();
      this.root = null;
    }

    // Get container
    const container = this.containerEl.children[1] as HTMLElement;
    if (!container) {
      console.error('BAC4CanvasView: Container not found!');
      return;
    }

    // Create fresh React root
    console.log('BAC4CanvasView: Creating fresh React root');
    this.root = ReactDOM.createRoot(container);

    this.root.render(
      <React.StrictMode>
        <ReactFlowProvider key={this.filePath || 'no-file'}>
          <CanvasEditor plugin={this.plugin} filePath={this.filePath} view={this} />
        </ReactFlowProvider>
      </React.StrictMode>
    );
  }

  async onOpen(): Promise<void> {
    console.log('BAC4CanvasView: onOpen called');
    console.log('BAC4CanvasView: this.file =', this.file);
    console.log('BAC4CanvasView: this.filePath =', this.filePath);

    // If opened from a file, use the file path
    if (this.file) {
      this.filePath = this.file.path;
      console.log('BAC4CanvasView: Set filePath from this.file:', this.filePath);
    }

    // Check if leaf has a view with a file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaf = this.leaf as any;
    if (leaf.view?.file) {
      this.file = leaf.view.file;
      this.filePath = leaf.view.file.path;
      console.log('BAC4CanvasView: Set filePath from leaf.view.file:', this.filePath);
    }

    // If still no filePath, check the leaf's state
    if (!this.filePath && leaf.getViewState) {
      const state = leaf.getViewState();
      console.log('BAC4CanvasView: Checking leaf state:', state);
      if (state?.state?.file && typeof state.state.file === 'string') {
        const pathFromState = state.state.file;
        this.filePath = pathFromState;
        const file = this.app.vault.getAbstractFileByPath(pathFromState);
        if (file) {
          this.file = file as TFile;
        }
        console.log('BAC4CanvasView: Set filePath from leaf state:', this.filePath);
      }
    }

    console.log('BAC4CanvasView: Final filePath for rendering:', this.filePath);

    // Check for duplicate tabs before rendering
    if (this.filePath) {
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
      const leavesWithThisFile = leaves.filter((l) => {
        const view = l.view as BAC4CanvasView;
        return view.file?.path === this.filePath && l !== this.leaf;
      });

      if (leavesWithThisFile.length > 0) {
        console.log('BAC4CanvasView: Duplicate detected in onOpen, closing this leaf');
        const otherLeaf = leavesWithThisFile[0];
        this.app.workspace.setActiveLeaf(otherLeaf, { focus: true });
        this.leaf.detach();
        return;
      }
    }

    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('bac4-canvas-view');

    // CRITICAL: Set explicit dimensions and styles for React Flow to work
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // ✅ FIX: Register file rename event listener
    this.renameEventRef = this.app.vault.on('rename', (file, oldPath) => {
      // Check if this view's file was renamed
      if (this.filePath === oldPath) {
        console.log('BAC4CanvasView: File renamed from', oldPath, 'to', file.path);
        this.filePath = file.path;
        this.file = file as TFile;

        // ✅ DON'T re-render! Just update the path.
        // The diagram data is already loaded in memory.
        // Re-rendering would cause reload and race with graph file rename.
        // Auto-save will use the updated filePath automatically.
      }
    });

    // Render canvas (will create React root internally)
    this.renderCanvas();
  }

  async onClose(): Promise<void> {
    // ✅ FIX: Unregister rename event listener
    if (this.renameEventRef) {
      this.app.vault.offref(this.renameEventRef);
      this.renameEventRef = null;
    }

    // Unmount React component
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
