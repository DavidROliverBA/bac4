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
} from 'reactflow';
import 'reactflow/dist/style.css';
import BAC4Plugin from '../main';
import { VIEW_TYPE_CANVAS } from '../core/constants';
import { C4Node, C4NodeData } from './nodes/C4Node';

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
};

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<C4NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  // Load canvas data on mount
  React.useEffect(() => {
    const loadCanvas = async () => {
      if (filePath) {
        try {
          const content = await plugin.app.vault.adapter.read(filePath);
          const data = JSON.parse(content);
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          return;
        } catch (e) {
          // File doesn't exist yet, use demo data
        }
      }

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

    loadCanvas();
  }, [filePath, plugin.app.vault.adapter, setNodes, setEdges]);

  // Handle new connections
  const onConnect = React.useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
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

      const nodeType = event.dataTransfer.getData('application/reactflow') as 'context' | 'container' | 'component';
      if (!nodeType || !reactFlowWrapper.current || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

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

  // Drag start handler
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
        <Panel position="top-left">
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            background: 'var(--background-primary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
          }}>
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
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('bac4-canvas-view');

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
