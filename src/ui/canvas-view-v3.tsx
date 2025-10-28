/**
 * Canvas View v3.0.0
 *
 * Simplified canvas view using v3.0.0 architecture:
 * - Loads from __graph__.json + .bac4 files
 * - Global nodes with unique names
 * - Shows NodePalette for browsing/adding nodes
 * - Warning modals for global edits
 *
 * @version 3.0.0
 */

import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  NodeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BAC4Plugin from '../main';

// v3.0.0 Services
import { HydrationServiceV3 } from '../services/hydration-service-v3';
import { NodeServiceV3 } from '../services/node-service-v3';
import { EdgeServiceV3 } from '../services/edge-service-v3';
import { DiagramServiceV3 } from '../services/diagram-service-v3';
import type { GlobalNode, DiagramType } from '../types/graph-v3-types';

// v3.0.0 UI Components
import { NodePalette } from './components/NodePalette';
import {
  NameCollisionModal,
  DeleteNodeModal,
  EdgeChangeWarningModal,
  EdgeDeleteWarningModal
} from './modals/v3-modals';

// Existing node components (reuse from old code)
import { SystemNode } from './nodes/SystemNode';
import { PersonNode } from './nodes/PersonNode';
import { ContainerNode } from './nodes/ContainerNode';
import { CapabilityNode } from './nodes/CapabilityNode';
import { MarketNode } from './nodes/MarketNode';
import { OrganisationNode } from './nodes/OrganisationNode';
import { CodeNode } from './nodes/CodeNode';

// Existing edge components
import { DirectionalEdge } from './edges/DirectionalEdge';

export const VIEW_TYPE_CANVAS_V3 = 'bac4-canvas-v3';

/**
 * Node types for React Flow
 */
const nodeTypes: NodeTypes = {
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
  capability: CapabilityNode,
  market: MarketNode,
  organisation: OrganisationNode,
  code: CodeNode,
};

const edgeTypes = {
  default: DirectionalEdge,
  directional: DirectionalEdge,
};

/**
 * Canvas Editor Component
 */
interface CanvasEditorV3Props {
  plugin: BAC4Plugin;
  filePath: string;
  onClose: () => void;
}

const CanvasEditorV3: React.FC<CanvasEditorV3Props> = ({ plugin, filePath, onClose }) => {
  // Services
  const [hydrationService] = React.useState(() => new HydrationServiceV3(plugin.app.vault));
  const [nodeService] = React.useState(() => new NodeServiceV3(plugin.app.vault));
  const [edgeService] = React.useState(() => new EdgeServiceV3(plugin.app.vault));
  const [diagramService] = React.useState(() => new DiagramServiceV3(plugin.app.vault));

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // UI state
  const [showNodePalette, setShowNodePalette] = React.useState(false);
  const [allNodes, setAllNodes] = React.useState<GlobalNode[]>([]);
  const [diagramType, setDiagramType] = React.useState<DiagramType>('context');
  const [isLoading, setIsLoading] = React.useState(true);

  /**
   * Load diagram on mount
   */
  React.useEffect(() => {
    loadDiagram();
  }, [filePath]);

  /**
   * Load all global nodes for palette
   */
  React.useEffect(() => {
    const loadAllNodes = async () => {
      const nodes = await nodeService.getAllNodes();
      setAllNodes(nodes);
    };
    loadAllNodes();
  }, []);

  /**
   * Load diagram from v3.0.0 format
   */
  const loadDiagram = async () => {
    try {
      setIsLoading(true);

      // Read diagram metadata
      const diagram = await diagramService.readDiagram(filePath);
      setDiagramType(diagram.metadata.diagramType);

      // Hydrate nodes and edges
      const { nodes: hydratedNodes, edges: hydratedEdges } =
        await hydrationService.hydrateDiagram(filePath);

      setNodes(hydratedNodes);
      setEdges(hydratedEdges);

      new Notice('Diagram loaded (v3.0.0)');
    } catch (error) {
      console.error('Error loading diagram:', error);
      new Notice('Error loading diagram: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save diagram
   */
  const saveDiagram = async () => {
    try {
      await hydrationService.dehydrateDiagram(filePath, nodes, edges);
      new Notice('Saved');
    } catch (error) {
      console.error('Error saving:', error);
      new Notice('Error saving: ' + error.message);
    }
  };

  /**
   * Auto-save on changes
   */
  React.useEffect(() => {
    if (!isLoading && nodes.length > 0) {
      const timeout = setTimeout(() => {
        saveDiagram();
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeout);
    }
  }, [nodes, edges, isLoading]);

  /**
   * Handle new connection (edge creation)
   */
  const onConnect = React.useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      // Create global edge
      const newEdge = await edgeService.createEdge({
        source: connection.source,
        target: connection.target,
        type: 'default',
        label: '',
        direction: 'right',
        style: {
          color: '#888888',
          lineType: 'solid',
          strokeWidth: 2,
        },
      });

      // Add to canvas
      setEdges((eds) => addEdge({
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        type: 'directional',
        data: {
          label: newEdge.label,
          direction: newEdge.direction,
        },
        style: {
          stroke: newEdge.style.color,
          strokeWidth: newEdge.style.strokeWidth,
        },
      }, eds));

      new Notice('Edge created');
    } catch (error) {
      console.error('Error creating edge:', error);
      new Notice('Error creating edge');
    }
  }, [edgeService]);

  /**
   * Handle edge delete
   */
  const handleDeleteEdge = async (edgeId: string) => {
    try {
      const edgeInfo = await edgeService.getEdgeChangeInfo(edgeId);

      if (edgeInfo.diagramCount > 1) {
        // Show warning modal
        const confirmed = await new Promise<boolean>((resolve) => {
          new EdgeDeleteWarningModal(
            plugin.app,
            edgeInfo.edge,
            edgeInfo.diagramCount,
            resolve
          ).open();
        });

        if (!confirmed) return;
      }

      // Delete globally
      await edgeService.deleteEdge(edgeId);

      // Remove from canvas
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));

      new Notice('Edge deleted globally');
    } catch (error) {
      console.error('Error deleting edge:', error);
      new Notice('Error deleting edge');
    }
  };

  /**
   * Handle adding existing node to diagram
   */
  const handleAddExistingNode = async (node: GlobalNode) => {
    try {
      // Add to diagram
      await diagramService.addNodeToDiagram(filePath, node.id, {
        x: 250,
        y: 250,
      });

      // Reload diagram
      await loadDiagram();

      new Notice(`Added "${node.label}" to diagram`);
    } catch (error) {
      console.error('Error adding node:', error);
      new Notice('Error adding node');
    }
  };

  /**
   * Handle creating new node
   */
  const handleCreateNewNode = async (type: string) => {
    try {
      const label = prompt(`Enter name for new ${type}:`);
      if (!label) return;

      // Check name uniqueness
      const nameCheck = await nodeService.checkNameUniqueness(label);

      if (!nameCheck.isUnique) {
        // Show collision modal
        const result = await new Promise((resolve) => {
          new NameCollisionModal(
            plugin.app,
            nameCheck.existingNode!,
            nameCheck.usageCount!,
            resolve
          ).open();
        });

        if (result.action === 'cancel') return;

        if (result.action === 'add-existing') {
          await handleAddExistingNode(nameCheck.existingNode!);
          return;
        }

        if (result.action === 'create-new' && result.newName) {
          // Use new name
          return handleCreateNewNode(type); // Recursive with new prompt
        }
      }

      // Create global node
      const newNode = await nodeService.createNode({
        type: type as any,
        label,
        description: '',
        knowledge: { notes: [], urls: [], attachments: [] },
        metrics: {},
        style: { color: '#3b82f6' },
      });

      // Add to diagram
      await diagramService.addNodeToDiagram(filePath, newNode.id, {
        x: 250,
        y: 250,
      });

      // Reload
      await loadDiagram();

      // Refresh all nodes list
      const allNodesUpdated = await nodeService.getAllNodes();
      setAllNodes(allNodesUpdated);

      new Notice(`Created "${label}"`);
    } catch (error) {
      console.error('Error creating node:', error);
      new Notice('Error: ' + error.message);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading diagram...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        display: 'flex',
        gap: '8px'
      }}>
        <button onClick={() => setShowNodePalette(!showNodePalette)}>
          {showNodePalette ? 'Hide' : 'Show'} Node Palette
        </button>
        <button onClick={saveDiagram}>Save</button>
        <button onClick={loadDiagram}>Reload</button>
        <span style={{ padding: '8px', background: 'var(--background-secondary)', borderRadius: '4px' }}>
          Type: {diagramType}
        </span>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Node Palette */}
      <NodePalette
        isOpen={showNodePalette}
        onClose={() => setShowNodePalette(false)}
        diagramType={diagramType}
        diagramPath={filePath}
        allNodes={allNodes}
        currentNodeIds={nodes.map((n) => n.id)}
        onAddExistingNode={handleAddExistingNode}
        onCreateNewNode={handleCreateNewNode}
      />
    </div>
  );
};

/**
 * Canvas View for Obsidian
 */
export class BAC4CanvasViewV3 extends ItemView {
  plugin: BAC4Plugin;
  filePath: string = '';
  root: ReactDOM.Root | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: BAC4Plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_CANVAS_V3;
  }

  getDisplayText(): string {
    if (this.filePath) {
      const fileName = this.filePath.split('/').pop()?.replace('.bac4', '') || 'Diagram';
      return fileName + ' (v3.0.0)';
    }
    return 'BAC4 Diagram (v3.0.0)';
  }

  getIcon(): string {
    return 'diagram';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('bac4-canvas-view-v3');

    // Create root for React
    this.root = ReactDOM.createRoot(container);

    // Render canvas
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  /**
   * Set file path and render
   */
  async setFilePath(filePath: string): Promise<void> {
    this.filePath = filePath;
    this.render();
  }

  /**
   * Render React component
   */
  private render(): void {
    if (!this.root || !this.filePath) return;

    this.root.render(
      <ReactFlowProvider>
        <CanvasEditorV3
          plugin={this.plugin}
          filePath={this.filePath}
          onClose={() => this.leaf.detach()}
        />
      </ReactFlowProvider>
    );
  }

  /**
   * Called by Obsidian when opening file
   */
  async setState(state: any, result: any): Promise<void> {
    if (state.filePath) {
      await this.setFilePath(state.filePath);
    }
    return super.setState(state, result);
  }

  /**
   * Get state for serialization
   */
  getState(): any {
    return {
      filePath: this.filePath,
    };
  }
}
