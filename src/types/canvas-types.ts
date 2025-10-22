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
 * Diagram type union
 * All possible diagram types in the BAC4 system
 *
 * v2.0.0: Added 4 new layers for enterprise architecture:
 * - market: Market segments, customer needs, trends
 * - organisation: Business units, departments, teams
 * - capability: Business capabilities (already existed, now part of 7-layer model)
 * - code: Implementation artifacts, GitHub links
 *
 * v2.5.0: Added Wardley Mapping support
 */
export type DiagramType =
  | 'market'        // Layer 1: Market segments and customer needs
  | 'organisation'  // Layer 2: Business units, departments, teams
  | 'capability'    // Layer 3: Business capabilities and functions
  | 'context'       // Layer 4: C4 Level 1 - System landscape
  | 'container'     // Layer 5: C4 Level 2 - Technical containers
  | 'component'     // Layer 6: C4 Level 3 - Internal components
  | 'code'          // Layer 7: Implementation code and data
  | 'wardley'       // v2.5.0: Wardley Mapping
  | 'graph';        // Meta-diagram: Visualization of diagram relationships

/**
 * Base node data interface
 * All custom node types should extend this
 *
 * v0.6.0: All node types support markdown linking
 * v0.9.0: Support for multiple child diagram links
 * v1.0.1: Support for cross-references to same-named nodes
 * v2.5.0: Added links object for v2.5.0 format, wardley properties
 */
export interface BaseNodeData {
  label: string;
  type?: string;
  color?: string;
  description?: string;
  notes?: string;
  linkedMarkdownPath?: string; // Vault-relative path to linked markdown file (v0.6.0)
  linkedDiagramPaths?: string[]; // v0.9.0: Multiple child diagram links (replaces single linkedDiagramPath)
  crossReferences?: string[]; // v1.0.1: Paths to other diagrams with same-named nodes
  isReference?: boolean; // v1.0.1: True if this node is a reference to an existing node
  links?: NodeLinks; // v2.5.0: Structured links object
  wardley?: WardleyNodeProperties; // v2.5.0: Wardley mapping properties
}

/**
 * Node Links (v2.5.0)
 * Structured way to represent relationships between nodes and diagrams
 */
export interface NodeLinks {
  parent: string | null;
  children: string[];
  linkedDiagrams: LinkedDiagram[];
  externalSystems: string[];
  dependencies: string[];
}

/**
 * Linked Diagram (v2.5.0)
 */
export interface LinkedDiagram {
  path: string;
  relationship: 'decomposes-to' | 'implements' | 'contains' | 'depends-on' | 'implemented-by';
  description?: string;
}

/**
 * Wardley Node Properties (v2.5.0)
 */
export interface WardleyNodeProperties {
  visibility: number; // 0-1 (Y-axis)
  evolution: number; // 0-1 (X-axis)
  evolutionStage: 'genesis' | 'custom' | 'product' | 'commodity';
  inertia: boolean;
  inertiaReason?: string;
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
  changeIndicator?: 'new' | 'modified' | 'removed' | null; // v1.0.0: Timeline change indicator
}

/**
 * Person node data (C4 Level 1 - Context)
 */
export interface PersonNodeData extends BaseNodeData {
  role?: string;
  changeIndicator?: 'new' | 'modified' | 'removed' | null; // v1.0.0: Timeline change indicator
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
  changeIndicator?: 'new' | 'modified' | 'removed' | null; // v1.0.0: Timeline change indicator
}

/**
 * Cloud component node data (C4 Level 3)
 * v1.0.0: Supports container nodes with resize capability
 */
export interface CloudComponentNodeData extends BaseNodeData {
  provider?: 'aws' | 'azure' | 'gcp' | 'saas';
  componentId?: string;
  componentType?: string; // Component type (e.g., "EC2", "Lambda", "Fargate")
  category?: string;
  icon?: string;
  properties?: Record<string, unknown>; // v1.0.0: Custom properties for cloud components
  isContainer?: boolean; // v1.0.0: Whether this component can contain other components (VPC, Subnet, etc.)
  changeIndicator?: 'new' | 'modified' | 'removed' | null; // v1.0.0: Timeline change indicator
}

/**
 * Market node data (Layer 1 - v2.0.0)
 * Represents market segments, customer types, and market trends
 */
export interface MarketNodeData extends BaseNodeData {
  marketSize?: string;      // e.g., "$50B", "500K customers"
  growthRate?: string;      // e.g., "12% CAGR", "High growth"
  competitors?: string[];   // Competitor names
  trends?: string[];        // Market trends
  linkedDiagramPath?: string; // Path to child Organisation diagram
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
}

/**
 * Organisation node data (Layer 2 - v2.0.0)
 * Represents business units, departments, and teams
 */
export interface OrganisationNodeData extends BaseNodeData {
  businessUnit?: string;    // e.g., "Digital Health Division"
  department?: string;      // e.g., "Engineering", "Product"
  headcount?: number;       // Team size
  location?: string;        // e.g., "London", "Remote"
  linkedDiagramPath?: string; // Path to child Capability diagram
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
}

/**
 * Capability node data (Layer 3)
 * Represents business or technical capabilities with flexible styling and linking
 *
 * v2.0.0: Now part of 7-layer enterprise architecture model
 */
export interface CapabilityNodeData extends BaseNodeData {
  maturityLevel?: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing'; // Capability maturity
  criticalityLevel?: 'critical' | 'important' | 'supporting'; // Business criticality
  investmentLevel?: 'high' | 'medium' | 'low'; // Investment priority
  width?: number; // Custom width for resizing
  height?: number; // Custom height for resizing
  linkedDiagramPath?: string; // Path to linked diagram (usually context)
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
}

/**
 * Code node data (Layer 7 - v2.0.0)
 * Represents implementation artifacts, code files, and data models
 * Includes GitHub integration for linking to actual code
 */
export interface CodeNodeData extends BaseNodeData {
  githubUrl?: string;       // GitHub repository or file URL
  language?: string;        // Programming language (e.g., "TypeScript", "Python")
  codeType?: 'file' | 'class' | 'function' | 'schema' | 'table'; // Type of code artifact
  repo?: string;            // Repository name (e.g., "org/repo")
  branch?: string;          // Git branch (e.g., "main", "develop")
  path?: string;            // File path within repo (e.g., "src/AuthController.ts")
  lastCommit?: string;      // Last commit hash or message
  authors?: string[];       // Code authors
  linkedDiagramPath?: string; // Path to parent Component diagram
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
}

/**
 * Graph node data (v0.9.0)
 * Represents a diagram in the graph view (meta-diagram)
 */
export interface GraphNodeData extends BaseNodeData {
  diagramPath: string; // Path to the diagram file this node represents
  diagramType: Exclude<DiagramType, 'graph'>; // Type of the represented diagram (cannot be a graph itself)
  parentCount?: number; // Number of parent diagrams
  childCount?: number; // Number of child diagrams
  changeIndicator?: 'new' | 'modified' | 'removed' | null; // Timeline change indicator
}

/**
 * Wardley Component Node Data (v2.5.0)
 * Represents a component in a Wardley Map
 */
export interface WardleyComponentNodeData extends BaseNodeData {
  visibility: number; // Y-axis position (0-1)
  evolution: number; // X-axis position (0-1)
  evolutionStage: 'genesis' | 'custom' | 'product' | 'commodity';
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
}

/**
 * Wardley Inertia Node Data (v2.5.0)
 * Represents an inertia barrier in a Wardley Map
 */
export interface WardleyInertiaNodeData extends BaseNodeData {
  inertiaReason?: string;
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
}

/**
 * Union type for all node data types
 *
 * v2.0.0: Added MarketNodeData, OrganisationNodeData, CodeNodeData
 * v2.5.0: Added WardleyComponentNodeData, WardleyInertiaNodeData
 */
export type CanvasNodeData =
  | C4NodeData
  | SystemNodeData
  | PersonNodeData
  | ContainerNodeData
  | CloudComponentNodeData
  | MarketNodeData          // v2.0.0: Layer 1
  | OrganisationNodeData    // v2.0.0: Layer 2
  | CapabilityNodeData      // Layer 3 (previously existing)
  | CodeNodeData            // v2.0.0: Layer 7
  | WardleyComponentNodeData // v2.5.0: Wardley components
  | WardleyInertiaNodeData   // v2.5.0: Wardley inertia barriers
  | GraphNodeData
  | BaseNodeData;

/**
 * Typed canvas node with specific data
 */
export type CanvasNode<T extends CanvasNodeData = CanvasNodeData> = Node<T>;

/**
 * Edge data interface
 * v2.5.0: Added style property for edge rendering
 */
export interface EdgeData {
  label?: string;
  direction?: 'right' | 'left' | 'both';
  description?: string;
  style?: 'diagonal' | 'rightAngle' | 'curved'; // v2.5.0: Edge path style
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
    diagramType: DiagramType;
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
  type: DiagramType;
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
