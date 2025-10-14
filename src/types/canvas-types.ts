/**
 * Canvas-Specific Type Definitions
 *
 * Type definitions for React Flow canvas interactions and data structures.
 * These types extend React Flow's base types with BAC4-specific properties.
 *
 * @module canvas-types
 */

import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';

/**
 * Base node data interface
 * All custom node types should extend this
 *
 * v0.6.0: All node types support markdown linking
 */
export interface BaseNodeData {
  label: string;
  type?: string;
  color?: string;
  description?: string;
  notes?: string;
  linkedMarkdownPath?: string; // Vault-relative path to linked markdown file (v0.6.0)
}

/**
 * C4 Model node data
 */
export interface C4NodeData extends BaseNodeData {
  type: 'context' | 'container' | 'component' | 'person';
  technology?: string;
}

/**
 * System node data (C4 Level 1 - Context)
 * v0.6.0: Links to Container diagrams via linkedDiagramPath
 */
export interface SystemNodeData extends BaseNodeData {
  external?: boolean;
  linkedDiagramPath?: string; // Path to child Container diagram (v0.6.0)
}

/**
 * Person node data (C4 Level 1 - Context)
 */
export interface PersonNodeData extends BaseNodeData {
  role?: string;
}

/**
 * Container node data (C4 Level 2)
 * Schema v0.4.0: Replaced containerType enum with flexible icon field
 * Schema v0.6.0: Links to Component diagrams via linkedDiagramPath
 */
export interface ContainerNodeData extends BaseNodeData {
  icon: string; // Lucide icon ID (e.g., "cloud-cog", "database", "server")
  type?: string; // Optional type tag displayed in [brackets] (e.g., "REST API", "PostgreSQL")
  linkedDiagramPath?: string; // Path to child Component diagram (v0.6.0)
}

/**
 * Cloud component node data (C4 Level 3)
 */
export interface CloudComponentNodeData extends BaseNodeData {
  provider?: 'aws' | 'azure' | 'gcp' | 'saas';
  componentId?: string;
  componentType?: string; // Component type (e.g., "EC2", "Lambda", "Fargate")
  category?: string;
  icon?: string;
}

/**
 * Union type for all node data types
 */
export type CanvasNodeData =
  | C4NodeData
  | SystemNodeData
  | PersonNodeData
  | ContainerNodeData
  | CloudComponentNodeData
  | BaseNodeData;

/**
 * Typed canvas node with specific data
 */
export type CanvasNode<T extends CanvasNodeData = CanvasNodeData> = Node<T>;

/**
 * Edge data interface
 */
export interface EdgeData {
  label?: string;
  direction?: 'right' | 'left' | 'both';
  description?: string;
}

/**
 * Typed canvas edge with data
 */
export type CanvasEdge = Edge<EdgeData>;

/**
 * React Flow instance type
 */
export interface ReactFlowInstance {
  getNodes: () => CanvasNode[];
  getEdges: () => CanvasEdge[];
  setNodes: (nodes: CanvasNode[] | ((nodes: CanvasNode[]) => CanvasNode[])) => void;
  setEdges: (edges: CanvasEdge[] | ((edges: CanvasEdge[]) => CanvasEdge[])) => void;
  getNode: (id: string) => CanvasNode | undefined;
  getEdge: (id: string) => CanvasEdge | undefined;
  addNodes: (nodes: CanvasNode[]) => void;
  addEdges: (edges: CanvasEdge[]) => void;
  deleteElements: (params: { nodes?: CanvasNode[]; edges?: CanvasEdge[] }) => void;
  project: (position: { x: number; y: number }) => { x: number; y: number };
  fitView: (options?: { padding?: number; includeHiddenNodes?: boolean }) => void;
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
  setCenter: (x: number, y: number, options?: { zoom?: number; duration?: number }) => void;
}

/**
 * Node event handler types
 */
export type NodeClickHandler = (event: React.MouseEvent, node: CanvasNode) => void;
export type NodeDoubleClickHandler = (event: React.MouseEvent, node: CanvasNode) => void;
export type NodeDragHandler = (event: React.MouseEvent, node: CanvasNode) => void;

/**
 * Edge event handler types
 */
export type EdgeClickHandler = (event: React.MouseEvent, edge: CanvasEdge) => void;
export type EdgeUpdateHandler = (oldEdge: CanvasEdge, newConnection: Connection) => void;

/**
 * Canvas event handler types
 */
export type NodesChangeHandler = (changes: NodeChange[]) => void;
export type EdgesChangeHandler = (changes: EdgeChange[]) => void;
export type ConnectHandler = (connection: Connection) => void;

/**
 * Drag and drop event data
 */
export interface DragEventData {
  type: string;
  data: Partial<CanvasNodeData>;
}

/**
 * Canvas state interface
 */
export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNode: CanvasNode | null;
  selectedEdge: CanvasEdge | null;
  reactFlowInstance: ReactFlowInstance | null;
}

/**
 * Diagram file format (legacy v0.5.0 and earlier)
 */
export interface DiagramFile {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * BAC4 File Format v0.6.0
 * Self-contained diagram files with embedded relationships
 *
 * Breaking changes from v0.5.0:
 * - Retired diagram-relationships.json (relationships embedded in nodes)
 * - All nodes support linkedMarkdownPath
 * - File includes version and metadata
 */
export interface BAC4FileV06 {
  version: '0.6.0';
  metadata: {
    diagramType: 'context' | 'container' | 'component';
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
  };
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Auto-naming counter state
 */
export interface AutoNamingCounters {
  [key: string]: number;
}

/**
 * Diagram Relationships Types (v0.6.0)
 *
 * These types support the central diagram-relationships.json file used for:
 * - Breadcrumb navigation
 * - Parent diagram lookup
 * - Diagram registry
 *
 * Note: Individual .bac4 files also store linkedDiagramPath in node data.
 * The relationships file provides a global index for faster navigation.
 */

/**
 * Diagram node metadata in relationships file
 */
export interface DiagramNode {
  id: string;
  filePath: string;
  displayName: string;
  type: 'context' | 'container' | 'component';
  createdAt: string;
  updatedAt: string;
}

/**
 * Parent-child relationship between diagrams
 */
export interface DiagramRelationship {
  parentDiagramId: string;
  childDiagramId: string;
  parentNodeId: string;
  parentNodeLabel: string;
  createdAt: string;
}

/**
 * Central relationships file structure
 */
export interface DiagramRelationshipsData {
  version: string;
  diagrams: DiagramNode[];
  relationships: DiagramRelationship[];
  updatedAt: string;
}
