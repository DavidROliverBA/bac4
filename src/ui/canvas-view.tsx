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
} from 'reactflow';
import 'reactflow/dist/style.css';
import BAC4Plugin from '../main';
import { VIEW_TYPE_CANVAS } from '../core/constants';

/**
 * Canvas Editor Component - React Flow wrapper
 */
interface CanvasEditorProps {
  plugin: BAC4Plugin;
  filePath?: string;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath }) => {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);

  // Initial demo nodes
  React.useEffect(() => {
    const initialNodes: Node[] = [
      {
        id: '1',
        type: 'default',
        position: { x: 250, y: 100 },
        data: { label: 'System Context' },
      },
      {
        id: '2',
        type: 'default',
        position: { x: 100, y: 250 },
        data: { label: 'Container A' },
      },
      {
        id: '3',
        type: 'default',
        position: { x: 400, y: 250 },
        data: { label: 'Container B' },
      },
    ];

    const initialEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e1-3', source: '1', target: '3', animated: true },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          // TODO: Handle node changes
          console.log('Nodes changed:', changes);
        }}
        onEdgesChange={(changes) => {
          // TODO: Handle edge changes
          console.log('Edges changed:', changes);
        }}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
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
