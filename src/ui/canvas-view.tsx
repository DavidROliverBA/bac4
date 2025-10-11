import { ItemView, WorkspaceLeaf, TFile, Menu } from 'obsidian';
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
import { SystemNode, SystemNodeData } from './nodes/SystemNode';
import { PersonNode, PersonNodeData } from './nodes/PersonNode';
import { ContainerNode, ContainerNodeData } from './nodes/ContainerNode';
import { DirectionalEdge } from './edges/DirectionalEdge';
import { ComponentPalette } from './components/ComponentPalette';
import { PropertyPanel } from './components/PropertyPanel';
import { DiagramToolbar } from './components/DiagramToolbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DiagramActionsToolbar } from './components/DiagramActionsToolbar';
import { RenameModal } from './components/RenameModal';
import { ComponentLibraryService } from '../services/component-library-service';
import { DiagramNavigationService } from '../services/diagram-navigation-service';
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
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
};

// Custom edge types mapping
const edgeTypes: EdgeTypes = {
  directional: DirectionalEdge,
};

type CanvasNodeData = C4NodeData | CloudComponentNodeData | SystemNodeData | PersonNodeData | ContainerNodeData;

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath }) => {
  console.log('CanvasEditor: Component rendered with filePath =', filePath);

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [selectedNode, setSelectedNode] = React.useState<Node<CanvasNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = React.useState<Edge | null>(null);
  const [diagramType, setDiagramType] = React.useState<'context' | 'container' | 'component'>('context');
  const [breadcrumbs, setBreadcrumbs] = React.useState<Array<{ label: string; path: string; type: string }>>([]);
  const [breadcrumbRefreshTrigger, setBreadcrumbRefreshTrigger] = React.useState(0);
  const [componentService] = React.useState(() => {
    const service = new ComponentLibraryService();
    service.initialize();
    return service;
  });
  const [navigationService] = React.useState(() => new DiagramNavigationService(plugin));
  const nodeCounterRef = React.useRef(0);

  // Generate unique node ID
  const generateNodeId = React.useCallback(() => {
    nodeCounterRef.current += 1;
    return `node-${nodeCounterRef.current}`;
  }, []);

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

  // Auto-save diagram data (no metadata in file - managed in relationships.json)
  React.useEffect(() => {
    console.log('BAC4: Auto-save effect triggered', { filePath, nodeCount: nodes.length, edgeCount: edges.length });

    if (!filePath) {
      console.log('BAC4: No filePath, skipping auto-save');
      return;
    }

    const saveTimeout = setTimeout(async () => {
      try {
        console.log('BAC4: Starting auto-save to', filePath);

        // Simple structure: just nodes and edges
        const data = {
          nodes,
          edges,
        };

        console.log('BAC4: Saving data', {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          firstNodePosition: nodes[0]?.position
        });
        await plugin.app.vault.adapter.write(filePath, JSON.stringify(data, null, 2));
        console.log('BAC4: ✅ Auto-saved diagram successfully', filePath);
      } catch (error) {
        console.error('BAC4: ❌ Error auto-saving', error);
      }
    }, 1000); // Debounce 1 second

    return () => {
      console.log('BAC4: Cleaning up save timeout');
      clearTimeout(saveTimeout);
    };
  }, [nodes, edges, filePath, plugin]);

  // Component mount
  React.useEffect(() => {
    // Canvas editor initialized
  }, []);

  // Load breadcrumbs when a node with child is selected (NEW LOGIC)
  React.useEffect(() => {
    if (!selectedNode || !filePath) {
      setBreadcrumbs([]);
      return;
    }

    let cancelled = false;

    console.log('BAC4: Checking if selected node has child...', selectedNode.id);

    // Check if selected node has a child diagram
    navigationService.findChildDiagram(filePath, selectedNode.id)
      .then((childPath) => {
        if (cancelled) return;

        if (childPath) {
          // Node has a child - show breadcrumb link
          console.log('BAC4: Node has child, loading child diagram info...');

          navigationService.getDiagramByPath(childPath)
            .then((childDiagram) => {
              if (cancelled) return;

              if (childDiagram) {
                const currentName = filePath.split('/').pop()?.replace('.bac4', '') || 'Current';
                console.log('BAC4: Setting breadcrumbs:', currentName, '→', childDiagram.displayName);

                setBreadcrumbs([
                  { label: currentName, path: filePath, type: 'current' },
                  { label: childDiagram.displayName, path: childPath, type: 'child' }
                ]);
              }
            })
            .catch(() => {
              if (!cancelled) {
                setBreadcrumbs([]);
              }
            });
        } else {
          // Node has no child - clear breadcrumbs
          console.log('BAC4: Node has no child, clearing breadcrumbs');
          setBreadcrumbs([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBreadcrumbs([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNode, filePath, navigationService, breadcrumbRefreshTrigger]);

  // Load canvas data when filePath changes
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

      // Load nodes and edges from .bac4 file
      plugin.app.vault.adapter.read(filePath).then((content) => {
        console.log('BAC4: File content loaded, parsing...');
        const data = JSON.parse(content);
        console.log('BAC4: Parsed data:', {
          hasNodes: !!data.nodes,
          nodeCount: data.nodes?.length,
          hasEdges: !!data.edges,
          edgeCount: data.edges?.length
        });

        // Always load from file if data structure exists, even if empty
        if (data.nodes !== undefined) {
          console.log('BAC4: Loading nodes from file:', data.nodes.length, 'first node position:', data.nodes[0]?.position);
          setNodes(data.nodes);

          // Initialize node counter based on existing nodes
          // Extract max node number from existing node IDs (node-1, node-2, etc.)
          const maxNodeNum = data.nodes.reduce((max: number, node: any) => {
            const match = node.id.match(/node-(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              return Math.max(max, num);
            }
            return max;
          }, 0);
          nodeCounterRef.current = maxNodeNum;
          console.log('BAC4: Initialized node counter to', maxNodeNum);
        } else {
          console.log('BAC4: No nodes array in file, starting with empty canvas');
          setNodes([]);
          nodeCounterRef.current = 0;
        }

        if (data.edges !== undefined) {
          console.log('BAC4: Loading edges from file:', data.edges.length);
          setEdges(data.edges);
        } else {
          setEdges([]);
        }
      }).catch((error) => {
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
  }, [filePath, plugin, navigationService]);

  // Handle new connections
  const onConnect = React.useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'directional',
        animated: false,
        data: {
          label: 'uses',
          direction: 'right' as const,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );

  // Handle edge selection
  const onEdgeClick = React.useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Extract child diagram creation logic for reuse
  const handleCreateOrOpenChildDiagram = React.useCallback(
    async (node: Node<CanvasNodeData>) => {
      console.log('=== BAC4 DRILL-DOWN START ===');
      console.log('Node:', { id: node.id, type: node.type, label: node.data.label });
      console.log('Current diagram:', { filePath, diagramType });

      // Validate we have a saved diagram
      if (!filePath) {
        console.error('BAC4: Cannot drill down - diagram not saved');
        alert('Please save this diagram first before creating child diagrams.');
        return;
      }

      // Determine if this node type can drill down
      const canDrillDown =
        (node.type === 'system' && diagramType === 'context') ||
        (node.type === 'container' && diagramType === 'container');

      if (!canDrillDown) {
        console.log('BAC4: Node type', node.type, 'cannot drill down from', diagramType);
        return;
      }

      // Determine child diagram type
      const childDiagramType = node.type === 'system' ? 'container' : 'component';
      console.log('BAC4: Target child type:', childDiagramType);

      try {
        // Try to find existing child diagram first
        console.log('BAC4: Searching for existing child diagram...');
        let childPath = await navigationService.findChildDiagram(filePath, node.id);
        console.log('BAC4: Find result:', childPath || 'NOT FOUND');

        if (!childPath) {
          // No child exists, create it
          console.log('BAC4: Creating new child diagram for:', node.data.label);
          console.log('BAC4: Parent path:', filePath);
          console.log('BAC4: Node ID:', node.id);

          childPath = await navigationService.createChildDiagram(
            filePath,
            node.id,
            node.data.label,
            diagramType as 'context' | 'container',
            childDiagramType
          );

          console.log('BAC4: ✅ Child diagram created:', childPath);

          // Mark node as having child
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id ? { ...n, data: { ...n.data, hasChildDiagram: true } } : n
            )
          );
        } else {
          console.log('BAC4: ✅ Opening existing child diagram:', childPath);
        }

        // Open the child diagram in NEW tab
        console.log('BAC4: Opening child diagram in NEW tab...');
        await plugin.openCanvasViewInNewTab(childPath);
        console.log('BAC4: ✅ Child diagram opened in new tab successfully');
        console.log('=== BAC4 DRILL-DOWN END ===');
      } catch (error) {
        console.error('=== BAC4 DRILL-DOWN ERROR ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
        const msg = error instanceof Error ? error.message : 'Unknown error';
        alert(`Cannot open child diagram:\n\n${msg}\n\nCheck console for details.`);
      }
    },
    [diagramType, filePath, navigationService, plugin, setNodes]
  );

  // Handle node double-click (drill-down)
  const onNodeDoubleClick = React.useCallback(
    async (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      await handleCreateOrOpenChildDiagram(node);
    },
    [handleCreateOrOpenChildDiagram]
  );

  // Handle node context menu (right-click)
  const onNodeContextMenu = React.useCallback(
    async (event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      event.preventDefault();

      if (!filePath) return;

      // Determine if this node can have children
      const canDrillDown =
        (node.type === 'system' && diagramType === 'context') ||
        (node.type === 'container' && diagramType === 'container');

      if (!canDrillDown) return;

      // Create Obsidian menu
      const menu = new Menu();

      // Check if child already exists
      const childPath = await navigationService.findChildDiagram(filePath, node.id);

      if (childPath) {
        // Child exists - show "Open child diagram"
        menu.addItem((item) => {
          item
            .setTitle('Open child diagram')
            .setIcon('arrow-right')
            .onClick(async () => {
              console.log('BAC4: Opening child from context menu');
              await plugin.openCanvasViewInNewTab(childPath);
            });
        });
      } else {
        // No child - show "Create child diagram"
        const childType = node.type === 'system' ? 'Container' : 'Component';
        menu.addItem((item) => {
          item
            .setTitle(`Create child diagram (${childType})`)
            .setIcon('plus-circle')
            .onClick(async () => {
              console.log('BAC4: Creating child from context menu');
              await handleCreateOrOpenChildDiagram(node);
            });
        });
      }

      // Show menu at mouse position
      menu.showAtMouseEvent(event.nativeEvent);
    },
    [diagramType, filePath, navigationService, plugin, handleCreateOrOpenChildDiagram]
  );

  // React Flow initialization
  const onReactFlowInit = React.useCallback((instance: any) => {
    setReactFlowInstance(instance);
  }, []);

  // Update node label and child diagram file name
  const updateNodeLabel = React.useCallback(
    async (nodeId: string, newLabel: string) => {
      console.log('BAC4: updateNodeLabel called', { nodeId, newLabel });

      // Get the node before updating
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        console.error('BAC4: Node not found:', nodeId);
        return;
      }

      const oldLabel = node.data.label;

      // Update the node label
      setNodes((nds) => {
        const updated = nds.map((n) => {
          if (n.id === nodeId) {
            console.log('BAC4: Found node to update', { oldLabel: n.data.label, newLabel });
            return {
              ...n,
              data: { ...n.data, label: newLabel },
            };
          }
          return n;
        });
        console.log('BAC4: Updated nodes');
        return updated;
      });

      // If node has a child diagram, rename the child diagram file
      if (filePath && node.data.hasChildDiagram) {
        try {
          console.log('BAC4: Node has child diagram, renaming child file...');

          // Find child diagram
          const childPath = await navigationService.findChildDiagram(filePath, nodeId);

          if (childPath) {
            console.log('BAC4: Found child diagram at:', childPath);

            // Rename the child diagram file
            const newChildPath = await navigationService.renameDiagram(childPath, newLabel);
            console.log('BAC4: ✅ Renamed child diagram to:', newChildPath);

            // Update relationship with new parent node label
            await navigationService.updateParentNodeLabel(filePath, nodeId, newLabel);
            console.log('BAC4: ✅ Updated relationship with new label');

            // Trigger breadcrumb refresh
            setBreadcrumbRefreshTrigger(prev => prev + 1);
            console.log('BAC4: ✅ Triggered breadcrumb refresh');
          }
        } catch (error) {
          console.error('BAC4: Error renaming child diagram:', error);
        }
      }
    },
    [setNodes, nodes, filePath, navigationService, setBreadcrumbRefreshTrigger]
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

  // Update edge label
  const updateEdgeLabel = React.useCallback(
    (edgeId: string, newLabel: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: { ...edge.data, label: newLabel },
            };
          }
          return edge;
        })
      );
      // Update selected edge if it's the one being edited
      setSelectedEdge((prev) =>
        prev?.id === edgeId ? { ...prev, data: { ...prev.data, label: newLabel } } : prev
      );
    },
    [setEdges]
  );

  // Update edge direction
  const updateEdgeDirection = React.useCallback(
    (edgeId: string, direction: 'right' | 'left' | 'both') => {
      console.log('BAC4: updateEdgeDirection called', { edgeId, direction });
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            console.log('BAC4: Found edge to update', { oldDirection: edge.data?.direction, direction });
            return {
              ...edge,
              data: { ...edge.data, direction },
            };
          }
          return edge;
        })
      );
      // Update selected edge if it's the one being edited
      setSelectedEdge((prev) =>
        prev?.id === edgeId ? { ...prev, data: { ...prev.data, direction } } : prev
      );
      console.log('BAC4: ✅ Updated edge direction');
    },
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

  // Generate auto-name for nodes based on diagram type
  const getAutoName = React.useCallback((nodeType: string, existingNodes: Node<CanvasNodeData>[]): string => {
    // Count existing nodes of the same type
    const sameTypeNodes = existingNodes.filter((n) => n.type === nodeType);
    const nextNumber = sameTypeNodes.length + 1;

    switch (nodeType) {
      case 'system':
        return `System ${nextNumber}`;
      case 'container':
        return `Container ${nextNumber}`;
      case 'person':
        return `Person ${nextNumber}`;
      case 'c4':
        return `Component ${nextNumber}`;
      case 'cloudComponent':
        return `Cloud Component ${nextNumber}`;
      default:
        return `Node ${nextNumber}`;
    }
  }, []);

  // Create child diagram automatically for certain node types
  const createChildDiagramIfNeeded = React.useCallback(
    async (nodeId: string, nodeType: string, nodeLabel: string) => {
      if (!filePath) return;

      // Only auto-create children for System and Container nodes
      const shouldCreateChild =
        (nodeType === 'system' && diagramType === 'context') ||
        (nodeType === 'container' && diagramType === 'container');

      if (!shouldCreateChild) return;

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

      // Check if it's a BAC4 node (new format)
      const bac4NodeDataStr = event.dataTransfer.getData('application/bac4node');
      if (bac4NodeDataStr) {
        const { type, data } = JSON.parse(bac4NodeDataStr);
        const nodeId = generateNodeId();

        // Generate auto-name
        const autoName = getAutoName(type, nodes);
        const finalData = { ...data, label: autoName };

        const newNode: Node = {
          id: nodeId,
          type,
          position,
          data: finalData,
        };
        setNodes((nds) => [...nds, newNode]);

        // Auto-create child diagram
        setTimeout(() => createChildDiagramIfNeeded(nodeId, type, autoName), 500);
        return;
      }

      // Legacy: Check if it's a C4 node type
      const nodeType = event.dataTransfer.getData('application/reactflow') as
        | 'context'
        | 'container'
        | 'component';

      if (nodeType) {
        const nodeId = generateNodeId();
        const autoName = getAutoName('c4', nodes);

        const newNode: Node<C4NodeData> = {
          id: nodeId,
          type: 'c4',
          position,
          data: {
            label: autoName,
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
        const nodeId = generateNodeId();
        const autoName = getAutoName('cloudComponent', nodes);

        const newNode: Node<CloudComponentNodeData> = {
          id: nodeId,
          type: 'cloudComponent',
          position,
          data: {
            label: autoName,
            component,
            properties: { ...component.defaultProps },
          },
        };
        setNodes((nds) => [...nds, newNode]);
      }
    },
    [reactFlowInstance, setNodes, generateNodeId, getAutoName, nodes, createChildDiagramIfNeeded]
  );

  // Add new node via button (generic)
  const addNodeGeneric = React.useCallback(
    (nodeType: string, nodeData: any) => {
      const nodeId = generateNodeId();

      // Generate auto-name
      const autoName = getAutoName(nodeType, nodes);
      const finalData = { ...nodeData, label: autoName };

      const newNode: Node = {
        id: nodeId,
        type: nodeType,
        position: { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
        data: finalData,
      };
      setNodes((nds) => [...nds, newNode]);

      // Auto-create child diagram
      setTimeout(() => createChildDiagramIfNeeded(nodeId, nodeType, autoName), 500);
    },
    [setNodes, generateNodeId, getAutoName, nodes, createChildDiagramIfNeeded]
  );

  // Drag start handler for cloud components
  const onComponentDragStart = (event: React.DragEvent, component: ComponentDefinition) => {
    event.dataTransfer.setData('application/cloudcomponent', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Add cloud component
  const addCloudComponent = (component: ComponentDefinition) => {
    const newNode: Node<CloudComponentNodeData> = {
      id: generateNodeId(),
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

  // Navigate to another diagram file in NEW tab
  const handleBreadcrumbNavigate = async (path: string) => {
    console.log('BAC4: Navigating to', path, 'in new tab');

    // Open in new tab
    await plugin.openCanvasViewInNewTab(path);
  };

  // Delete selected node
  const handleDeleteNode = React.useCallback(() => {
    if (!selectedNode) return;

    console.log('BAC4: Deleting node', selectedNode.id);
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Rename diagram
  const handleRenameDiagram = React.useCallback(() => {
    if (!filePath) return;

    const currentName = filePath.split('/').pop()?.replace('.bac4', '') || 'diagram';

    // Use Obsidian Modal instead of browser prompt()
    const modal = new RenameModal(plugin.app, {
      currentName,
      onSubmit: async (newName: string) => {
        try {
          console.log('BAC4: Renaming diagram to:', newName);
          const newPath = await navigationService.renameDiagram(filePath, newName);
          console.log('BAC4: Diagram renamed successfully to:', newPath);

          // Note: The view will be automatically updated by Obsidian's file rename event
          // Breadcrumbs will refresh when filePath changes
        } catch (error) {
          console.error('BAC4: Error renaming diagram:', error);
          const msg = error instanceof Error ? error.message : 'Unknown error';
          alert(`Cannot rename diagram: ${msg}`);
        }
      },
      onCancel: () => {
        console.log('BAC4: Rename cancelled by user');
      },
    });

    modal.open();
  }, [filePath, navigationService, plugin.app]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Toolbar Area - Just Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div
          style={{
            padding: '12px',
            background: 'var(--background-secondary)',
            borderBottom: '2px solid var(--background-modifier-border)',
          }}
        >
          <Breadcrumbs
            breadcrumbs={breadcrumbs}
            currentPath={filePath || ''}
            onNavigate={handleBreadcrumbNavigate}
          />
        </div>
      )}

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
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
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

        {/* Right Side Panels */}
        <Panel position="top-right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Actions Toolbar */}
            <DiagramActionsToolbar
              selectedNode={selectedNode}
              onDeleteNode={handleDeleteNode}
              onRenameDiagram={handleRenameDiagram}
              diagramName={filePath ? filePath.split('/').pop()?.replace('.bac4', '') : 'diagram'}
            />

            {/* Diagram-specific Node Toolbar */}
            <DiagramToolbar
              diagramType={diagramType}
              onAddNode={addNodeGeneric}
            />

            {/* Component Palette - Only for Component diagrams */}
            {diagramType === 'component' && (
              <ComponentPalette
                service={componentService}
                onDragStart={onComponentDragStart}
                onAddComponent={addCloudComponent}
              />
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Property Panel */}
      <PropertyPanel
        node={selectedNode}
        edge={selectedEdge}
        onUpdateLabel={updateNodeLabel}
        onUpdateProperties={updateNodeProperties}
        onUpdateEdgeLabel={updateEdgeLabel}
        onUpdateEdgeDirection={updateEdgeDirection}
        onClose={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
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

  async setState(state: any, result: any): Promise<void> {
    console.log('BAC4CanvasView: setState called with', state);

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

  getState(): any {
    const state = {
      file: this.file?.path,
      filePath: this.filePath,
    };
    console.log('BAC4CanvasView: getState returning', state);
    return state;
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.filePath = file.path;
    console.log('BAC4CanvasView: onLoadFile called with', file.path);

    // Check if this file is already open in another leaf
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
    const leavesWithThisFile = leaves.filter((leaf) => {
      const view = leaf.view as BAC4CanvasView;
      return view.file?.path === file.path;
    });

    console.log('BAC4CanvasView: Found', leavesWithThisFile.length, 'leaves with file', file.path);

    // If this file is already open in another leaf, close this one and activate the other
    if (leavesWithThisFile.length > 1) {
      console.log('BAC4CanvasView: File already open, closing duplicate');

      // Find the other leaf (not this one)
      const otherLeaf = leavesWithThisFile.find((l) => l !== this.leaf);

      if (otherLeaf) {
        console.log('BAC4CanvasView: Activating existing leaf');
        this.app.workspace.setActiveLeaf(otherLeaf, { focus: true });

        // Close this duplicate leaf
        console.log('BAC4CanvasView: Detaching duplicate leaf');
        this.leaf.detach();
        return; // Don't continue loading
      }
    }

    // Re-render with new file path if root exists
    if (this.root) {
      console.log('BAC4CanvasView: Re-rendering with new filePath');
      this.renderCanvas();
    }
  }

  private renderCanvas(): void {
    if (!this.root) return;

    console.log('BAC4CanvasView: Rendering canvas with filePath:', this.filePath);
    this.root.render(
      <React.StrictMode>
        <ReactFlowProvider>
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

    // Create React root and render
    this.root = ReactDOM.createRoot(container);
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
