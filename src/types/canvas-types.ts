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
 */
export interface BaseNodeData {
  label: string;
  type?: string;
  color?: string;
  description?: string;
  hasChildDiagram?: boolean;
  linkedDiagramPath?: string;
  linkedMarkdownFile?: string; // Vault-relative path to linked markdown file
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
 */
export interface SystemNodeData extends BaseNodeData {
  external?: boolean;
  hasChildDiagram?: boolean;
  linkedDiagramPath?: string;
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
 */
export interface ContainerNodeData extends BaseNodeData {
  icon: string; // Lucide icon ID (e.g., "cloud-cog", "database", "server")
  type?: string; // Optional type tag displayed in [brackets] (e.g., "REST API", "PostgreSQL")
  hasChildDiagram?: boolean;
  linkedDiagramPath?: string;
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
 * Diagram file format
 */
export interface DiagramFile {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Auto-naming counter state
 */
export interface AutoNamingCounters {
  [key: string]: number;
}
