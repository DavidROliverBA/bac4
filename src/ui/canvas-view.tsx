import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  Panel,
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
import { DirectionalEdge } from './edges/DirectionalEdge';
import { ComponentPalette } from './components/ComponentPalette';
import { PropertyPanel } from './components/PropertyPanel';
import { UnifiedToolbar } from './components/UnifiedToolbar';
import { ComponentLibraryService } from '../services/component-library-service';
import { DiagramNavigationService } from '../services/diagram-navigation-service';
import type { CanvasNodeData, ReactFlowInstance } from '../types/canvas-types';
import type { BreadcrumbItem } from '../types/component-props';
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
};

// Custom edge types mapping
// Add new edge types here following the pattern:
// yourEdgeType: YourEdgeComponent,
const edgeTypes: EdgeTypes = {
  directional: DirectionalEdge,
};
// </AI_MODIFIABLE>

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath }) => {
  console.log('CanvasEditor: Component rendered with filePath =', filePath);

  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = React.useState<Node<CanvasNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = React.useState<Edge | null>(null);
  const [diagramType, setDiagramType] = React.useState<'context' | 'container' | 'component'>(
    'context'
  );
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);
  const [breadcrumbRefreshTrigger, setBreadcrumbRefreshTrigger] = React.useState(0);
  const nodeCounterRef = React.useRef(0);

  // Services
  const [componentService] = React.useState(() => {
    const service = new ComponentLibraryService();
    service.initialize();
    return service;
  });
  const [navigationService] = React.useState(() => new DiagramNavigationService(plugin));

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

        // Mark node as having child
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, hasChildDiagram: true } } : n
          )
        );

        console.log('BAC4: ✅ Auto-created child diagram for', nodeLabel);
      } catch (error) {
        console.error('BAC4: Error auto-creating child diagram:', error);
      }
    },
    [filePath, diagramType, navigationService, setNodes]
  );

  /**
   * Handle breadcrumb refresh
   */
  const handleBreadcrumbRefresh = React.useCallback(() => {
    setBreadcrumbRefreshTrigger((prev) => prev + 1);
  }, []);

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
    onBreadcrumbRefresh: handleBreadcrumbRefresh,
  });

  const edgeHandlers = useEdgeHandlers({
    setEdges,
    onEdgeSelect: handleEdgeSelect,
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
    reactFlowWrapper,
    reactFlowInstance,
    setReactFlowInstance,
    filePath,
    diagramType,
    nodes,
    setNodes,
    nodeCounterRef,
    onCreateChildDiagram: createChildDiagramIfNeeded,
    onPaneClickCallback: handlePaneClickCallback,
  });

  // File operations hook (manages loading, saving, breadcrumbs)
  useFileOperations({
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
  });

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
   * Calculate navigation icon visibility
   */
  const navigationIconVisibility = React.useMemo(() => {
    if (!selectedNode || !filePath) {
      return { showPlus: false, showMinus: false };
    }

    // Check if diagram has parent
    const hasParent = breadcrumbs.length > 1;

    return getNavigationIconVisibility(
      selectedNode.type,
      diagramType,
      selectedNode.data.hasChildDiagram || false,
      hasParent
    );
  }, [selectedNode, filePath, diagramType, breadcrumbs]);

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
        breadcrumbs={breadcrumbs}
        currentPath={filePath || ''}
        onNavigate={diagramActions.handleBreadcrumbNavigate}
        selectedNode={selectedNode}
        onDeleteNode={() => selectedNode && nodeHandlers.handleDeleteNode(selectedNode.id)}
        onRenameDiagram={diagramActions.handleRenameDiagram}
        diagramName={filePath ? getDiagramName(filePath) : 'diagram'}
      />

      {/* React Flow Canvas */}
      <div
        ref={reactFlowWrapper}
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
          <Controls position="bottom-right" />
          <MiniMap />

          {/* Right Side Panel - Component Palette */}
          {diagramType === 'component' && (
            <Panel position="top-right">
              <ComponentPalette
                service={componentService}
                onDragStart={canvasState.onComponentDragStart}
                onAddComponent={canvasState.addCloudComponent}
              />
            </Panel>
          )}
        </ReactFlow>

        {/* Property Panel */}
        <PropertyPanel
          node={selectedNode}
          edge={selectedEdge}
          onUpdateLabel={nodeHandlers.updateNodeLabel}
          onUpdateProperties={nodeHandlers.updateNodeProperties}
          onUpdateEdgeLabel={edgeHandlers.updateEdgeLabel}
          onUpdateEdgeDirection={edgeHandlers.updateEdgeDirection}
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
          onNavigateToChild={handleNavigateToChild}
          onNavigateToParent={handleNavigateToParent}
          showNavigateToChild={navigationIconVisibility.showPlus}
          showNavigateToParent={navigationIconVisibility.showMinus}
        />
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

    await super.setState(state, result);

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
    console.log('BAC4CanvasView: Current leaf ID:', (this.leaf as any).id);

    // CRITICAL: Check for duplicates BEFORE setting file
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
    console.log('BAC4CanvasView: Total BAC4 canvas leaves:', leaves.length);

    const leavesWithThisFile = leaves.filter((leaf) => {
      const view = leaf.view as BAC4CanvasView;
      const hasFile = view.file?.path === file.path || view.filePath === file.path;
      if (hasFile) {
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
      console.log('BAC4CanvasView: ❌ DUPLICATE DETECTED! Closing this leaf and activating existing');
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
          <CanvasEditor plugin={this.plugin} filePath={this.filePath} />
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
      if (state?.state?.file) {
        this.filePath = state.state.file;
        const file = this.app.vault.getAbstractFileByPath(this.filePath);
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

    // Render canvas (will create React root internally)
    this.renderCanvas();
  }

  async onClose(): Promise<void> {
    // Unmount React component
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
