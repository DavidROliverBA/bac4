import { ItemView, WorkspaceLeaf } from 'obsidian';
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
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BAC4Plugin from '../main';
import { VIEW_TYPE_CANVAS } from '../core/constants';
import { C4Node, C4NodeData } from './nodes/C4Node';
import { CloudComponentNode, CloudComponentNodeData } from './nodes/CloudComponentNode';
import { ComponentPalette } from './components/ComponentPalette';
import { PropertyPanel } from './components/PropertyPanel';
import { ComponentLibraryService } from '../services/component-library-service';
import { ComponentDefinition } from '../../component-library/types';

/**
 * Canvas Editor Component - React Flow wrapper
 */
interface CanvasEditorProps {
  plugin: BAC4Plugin;
  filePath?: string;
}

// Custom node types mapping
const nodeTypes: NodeTypes = {
  c4: C4Node,
  cloudComponent: CloudComponentNode,
};

type CanvasNodeData = C4NodeData | CloudComponentNodeData;

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [selectedNode, setSelectedNode] = React.useState<Node<CanvasNodeData> | null>(null);
  const [diagramType, setDiagramType] = React.useState<'context' | 'container' | 'component'>('container');
  const [componentService] = React.useState(() => {
    const service = new ComponentLibraryService();
    service.initialize();
    return service;
  });

  // Component mount
  React.useEffect(() => {
    // Canvas editor initialized
  }, []);

  // Load canvas data immediately on mount (synchronous initialization)
  React.useEffect(() => {
    const initCanvas = () => {
      // Initial demo nodes with C4 types
      const initialNodes: Node<C4NodeData>[] = [
        {
          id: '1',
          type: 'c4',
          position: { x: 250, y: 100 },
          data: {
            label: 'System Context',
            type: 'context',
            technology: 'Enterprise System',
            description: 'Main system boundary',
          },
        },
        {
          id: '2',
          type: 'c4',
          position: { x: 100, y: 300 },
          data: {
            label: 'Web Application',
            type: 'container',
            technology: 'React + TypeScript',
            description: 'Frontend application',
          },
        },
        {
          id: '3',
          type: 'c4',
          position: { x: 400, y: 300 },
          data: {
            label: 'API Service',
            type: 'container',
            technology: 'Node.js',
            description: 'Backend REST API',
          },
        },
      ];

      const initialEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2', animated: true, label: 'uses' },
        { id: 'e1-3', source: '1', target: '3', animated: true, label: 'uses' },
      ];

      setNodes(initialNodes);
      setEdges(initialEdges);
    };

    initCanvas();

    // Load from file if available (async)
    if (filePath) {
      plugin.app.vault.adapter.read(filePath).then((content) => {
        const data = JSON.parse(content);
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
      }).catch(() => {
        // File doesn't exist, using demo data
      });
    }
  }, []);

  // Handle new connections
  const onConnect = React.useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'default',
        animated: false,
        label: 'uses',
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      setSelectedNode(node);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null);
  }, []);

  // React Flow initialization
  const onReactFlowInit = React.useCallback((instance: any) => {
    setReactFlowInstance(instance);
  }, []);

  // Update node label
  const updateNodeLabel = React.useCallback(
    (nodeId: string, newLabel: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, label: newLabel },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Update node properties
  const updateNodeProperties = React.useCallback(
    (nodeId: string, updates: Partial<CanvasNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...updates },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Auto-save canvas data
  React.useEffect(() => {
    if (!filePath || nodes.length === 0) return;

    const autoSaveInterval = plugin.settings.autoSaveInterval || 30000;
    const timeoutId = setTimeout(async () => {
      try {
        const data = {
          nodes,
          edges,
          viewport: reactFlowInstance?.getViewport(),
        };
        await plugin.app.vault.adapter.write(filePath, JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Failed to save canvas:', e);
      }
    }, autoSaveInterval);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, filePath, plugin.app.vault.adapter, plugin.settings.autoSaveInterval, reactFlowInstance]);

  // Add new node via drag-and-drop
  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if it's a C4 node type
      const nodeType = event.dataTransfer.getData('application/reactflow') as
        | 'context'
        | 'container'
        | 'component';

      if (nodeType) {
        const newNode: Node<C4NodeData> = {
          id: `node-${Date.now()}`,
          type: 'c4',
          position,
          data: {
            label: `New ${nodeType}`,
            type: nodeType,
            technology: '',
            description: '',
          },
        };
        setNodes((nds) => [...nds, newNode]);
        return;
      }

      // Check if it's a cloud component
      const componentDataStr = event.dataTransfer.getData('application/cloudcomponent');
      if (componentDataStr) {
        const component: ComponentDefinition = JSON.parse(componentDataStr);
        const newNode: Node<CloudComponentNodeData> = {
          id: `node-${Date.now()}`,
          type: 'cloudComponent',
          position,
          data: {
            label: component.name,
            component,
            properties: { ...component.defaultProps },
          },
        };
        setNodes((nds) => [...nds, newNode]);
      }
    },
    [reactFlowInstance, setNodes]
  );

  // Add new node via button
  const addNode = React.useCallback(
    (nodeType: 'context' | 'container' | 'component') => {
      const newNode: Node<C4NodeData> = {
        id: `node-${Date.now()}`,
        type: 'c4',
        position: { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
        data: {
          label: `New ${nodeType}`,
          type: nodeType,
          technology: '',
          description: '',
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Drag start handler for C4 nodes
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Drag start handler for cloud components
  const onComponentDragStart = (event: React.DragEvent, component: ComponentDefinition) => {
    event.dataTransfer.setData('application/cloudcomponent', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Add cloud component
  const addCloudComponent = (component: ComponentDefinition) => {
    const newNode: Node<CloudComponentNodeData> = {
      id: `node-${Date.now()}`,
      type: 'cloudComponent',
      position: { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: component.name,
        component,
        properties: { ...component.defaultProps },
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div
      ref={reactFlowWrapper}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={onReactFlowInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        deleteKeyCode="Delete"
        connectionMode={ConnectionMode.Loose}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />

        {/* Diagram Type Selector */}
        <Panel position="top-center">
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '6px',
              background: 'var(--background-primary)',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 8px' }}>
              Diagram Type:
            </span>
            <button
              onClick={() => setDiagramType('context')}
              style={{
                padding: '4px 12px',
                background: diagramType === 'context' ? 'rgba(74, 144, 226, 0.3)' : 'transparent',
                border: diagramType === 'context' ? '1px solid #4A90E2' : '1px solid var(--background-modifier-border)',
                borderRadius: '3px',
                color: 'var(--text-normal)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Context
            </button>
            <button
              onClick={() => setDiagramType('container')}
              style={{
                padding: '4px 12px',
                background: diagramType === 'container' ? 'rgba(126, 211, 33, 0.3)' : 'transparent',
                border: diagramType === 'container' ? '1px solid #7ED321' : '1px solid var(--background-modifier-border)',
                borderRadius: '3px',
                color: 'var(--text-normal)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Container
            </button>
            <button
              onClick={() => setDiagramType('component')}
              style={{
                padding: '4px 12px',
                background: diagramType === 'component' ? 'rgba(245, 166, 35, 0.3)' : 'transparent',
                border: diagramType === 'component' ? '1px solid #F5A623' : '1px solid var(--background-modifier-border)',
                borderRadius: '3px',
                color: 'var(--text-normal)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Component
            </button>
          </div>
        </Panel>

        <Panel position="top-left">
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              background: 'var(--background-primary)',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
            }}
          >
            <button
              draggable
              onDragStart={(e) => onDragStart(e, 'context')}
              onClick={() => addNode('context')}
              style={{
                padding: '6px 12px',
                background: 'rgba(74, 144, 226, 0.2)',
                border: '1px solid #4A90E2',
                borderRadius: '4px',
                color: 'var(--text-normal)',
                cursor: 'grab',
                fontSize: '12px',
              }}
            >
              + Context
            </button>
            <button
              draggable
              onDragStart={(e) => onDragStart(e, 'container')}
              onClick={() => addNode('container')}
              style={{
                padding: '6px 12px',
                background: 'rgba(126, 211, 33, 0.2)',
                border: '1px solid #7ED321',
                borderRadius: '4px',
                color: 'var(--text-normal)',
                cursor: 'grab',
                fontSize: '12px',
              }}
            >
              + Container
            </button>
            <button
              draggable
              onDragStart={(e) => onDragStart(e, 'component')}
              onClick={() => addNode('component')}
              style={{
                padding: '6px 12px',
                background: 'rgba(245, 166, 35, 0.2)',
                border: '1px solid #F5A623',
                borderRadius: '4px',
                color: 'var(--text-normal)',
                cursor: 'grab',
                fontSize: '12px',
              }}
            >
              + Component
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Component Palette */}
      <ComponentPalette
        service={componentService}
        onDragStart={onComponentDragStart}
        onAddComponent={addCloudComponent}
      />

      {/* Property Panel */}
      <PropertyPanel
        node={selectedNode}
        onUpdateLabel={updateNodeLabel}
        onUpdateProperties={updateNodeProperties}
        onClose={() => setSelectedNode(null)}
      />
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

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('bac4-canvas-view');

    // CRITICAL: Set explicit dimensions and styles for React Flow to work
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Create React root and render
    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <ReactFlowProvider>
          <CanvasEditor plugin={this.plugin} filePath={this.filePath} />
        </ReactFlowProvider>
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Unmount React component
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
