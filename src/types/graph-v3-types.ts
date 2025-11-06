/**
 * v3.0.0 Architecture - Complete Type Definitions
 *
 * Key Principles:
 * - All nodes in __graph__.json (global, unique names)
 * - All edges in __graph__.json (global)
 * - .bac4 files are views (node IDs + layout only)
 * - Snapshots can have local nodes/edges (what-if scenarios)
 * - No backward compatibility
 *
 * @version 3.0.0
 * @date 2025-10-23
 */

// ============================================================================
// Graph File (__graph__.json)
// ============================================================================

/**
 * Root structure for BAC4/__graph__.json
 * Contains all global nodes and relationships
 */
export interface GraphFileV3 {
  version: '3.0.0';
  metadata: GraphMetadata;
  nodes: Record<string, GlobalNode>;
  relationships: GlobalRelationships;
}

/**
 * Graph file metadata
 */
export interface GraphMetadata {
  created: string;
  updated: string;
  nodeCount: number;
  edgeCount: number;
}

/**
 * Global node (stored in __graph__.json)
 * Represents actual system components
 */
export interface GlobalNode {
  id: string; // UUID
  type: NodeType;
  label: string; // MUST BE UNIQUE across all nodes
  description: string;
  technology?: string;
  team?: string;
  knowledge: NodeKnowledge;
  metrics: NodeMetrics;
  style: NodeStyle;
  created: string;
  updated: string;
}

/**
 * Node types (C4 model)
 */
export type NodeType =
  | 'person'
  | 'system'
  | 'container'
  | 'component'
  | 'code'
  | 'market'
  | 'organisation'
  | 'capability';

/**
 * Node knowledge (documentation)
 */
export interface NodeKnowledge {
  notes: string[];
  urls: string[];
  attachments: string[];
}

/**
 * Node metrics
 */
export interface NodeMetrics {
  cost?: number;
  users?: number;
  requests?: number;
  [key: string]: number | undefined;
}

/**
 * Node visual style
 */
export interface NodeStyle {
  color: string;
  icon?: string;
  shape?: 'rectangle' | 'rounded' | 'circle' | 'diamond';
}

/**
 * Global relationships
 */
export interface GlobalRelationships {
  edges: GlobalEdge[];
  hierarchy: HierarchyRelationship[];
}

/**
 * Global edge (stored in __graph__.json)
 * Represents relationships between nodes
 */
export interface GlobalEdge {
  id: string; // UUID
  source: string; // Node ID
  target: string; // Node ID
  type: EdgeType;
  label?: string;
  direction: Direction;
  style: EdgeStyle;
  created: string;
  updated: string;
}

/**
 * Edge types
 */
export type EdgeType =
  | 'uses'
  | 'sends-data-to'
  | 'depends-on'
  | 'contains'
  | 'implements'
  | 'default';

/**
 * Edge direction
 */
export type Direction = 'left' | 'right' | 'both';

/**
 * Edge visual style
 */
export interface EdgeStyle {
  color: string;
  lineType: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
}

/**
 * Hierarchy relationship (parent → child diagram)
 */
export interface HierarchyRelationship {
  parentNodeId: string; // Node that has drill-down
  childDiagramPath: string; // Path to child .bac4 file
  created: string;
}

// ============================================================================
// Diagram File (.bac4)
// ============================================================================

/**
 * Diagram file structure (.bac4)
 * View into global nodes with diagram-specific layout
 */
export interface DiagramFileV3 {
  version: '3.0.0';
  metadata: DiagramMetadata;
  view: DiagramView;
  snapshots: Snapshot[];
  currentSnapshotId: string;
  annotations: Annotation[];
}

/**
 * Diagram metadata
 */
export interface DiagramMetadata {
  diagramName: string;
  diagramType: DiagramType;
  created: string;
  updated: string;
}

/**
 * Diagram types
 */
export type DiagramType =
  | 'context'
  | 'container'
  | 'component'
  | 'code'
  | 'market'
  | 'organisation'
  | 'capability'
  | 'graph';

/**
 * Diagram view (current state)
 */
export interface DiagramView {
  nodes: string[]; // Array of node IDs from __graph__.json
  layout: Record<string, NodeLayout>;
  viewport: Viewport;
}

/**
 * Node layout (position on diagram)
 */
export interface NodeLayout {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Viewport settings
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Snapshot (temporal view)
 */
export interface Snapshot {
  id: string;
  label: string;
  description: string;
  timestamp: string | null; // ISO 8601 or null for "current"
  created: string;
  isCurrent: boolean;
  localNodes: Record<string, LocalNode>; // Snapshot-specific nodes (what-if)
  layout: Record<string, NodeLayout>; // Includes global + local nodes
  localEdges: LocalEdge[]; // Snapshot-specific edges
}

/**
 * Local node (exists only in snapshot)
 * Used for "what-if" scenarios
 */
export interface LocalNode {
  id: string; // local-{uuid}
  type: NodeType;
  label: string;
  description: string;
  technology?: string;
  team?: string;
  style: NodeStyle;
}

/**
 * Local edge (exists only in snapshot)
 */
export interface LocalEdge {
  id: string; // local-edge-{uuid}
  source: string; // Can be global or local node ID
  target: string; // Can be global or local node ID
  type: EdgeType;
  label?: string;
  direction: Direction;
  style: EdgeStyle;
}

/**
 * Annotation (comments, highlights, etc.)
 */
export interface Annotation {
  id: string;
  type: 'comment' | 'highlight' | 'arrow' | 'text' | 'shape';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  content?: string;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
  };
  created: string;
  createdBy?: string;
}

// ============================================================================
// React Flow Integration
// ============================================================================

/**
 * Hydrated node (for React Flow)
 * Combines global node data with diagram-specific layout
 */
export interface HydratedNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data: {
    label: string;
    description: string;
    technology?: string;
    team?: string;
    knowledge: NodeKnowledge;
    metrics: NodeMetrics;
    color: string;
    icon?: string;
    shape?: string;
    isLocal?: boolean; // true if from snapshot.localNodes
  };
}

/**
 * Hydrated edge (for React Flow)
 * Combines global edge data with rendering info
 */
export interface HydratedEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  data?: {
    label?: string;
    direction: Direction;
  };
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
  markerEnd?: string;
  isLocal?: boolean; // true if from snapshot.localEdges
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Result of name uniqueness check
 */
export interface NameCheckResult {
  isUnique: boolean;
  existingNode?: GlobalNode;
  usageCount?: number; // How many diagrams use this node
}

/**
 * Result of node deletion check
 */
export interface NodeDeletionInfo {
  node: GlobalNode;
  diagramCount: number; // How many diagrams use this node
  diagrams: string[]; // Paths to diagrams
  edgeCount: number; // How many edges involve this node
  edges: GlobalEdge[];
}

/**
 * Result of edge change check
 */
export interface EdgeChangeInfo {
  edge: GlobalEdge;
  diagramCount: number; // How many diagrams show this edge
  diagrams: string[]; // Paths to diagrams showing both nodes
}

/**
 * Node usage tracking
 */
export interface NodeUsage {
  nodeId: string;
  diagrams: string[]; // Paths to .bac4 files using this node
  edgesAsSource: string[]; // Edge IDs where node is source
  edgesAsTarget: string[]; // Edge IDs where node is target
}

// ============================================================================
// Empty Templates
// ============================================================================

/**
 * Empty graph file template
 */
export const EMPTY_GRAPH_V3: GraphFileV3 = {
  version: '3.0.0',
  metadata: {
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    nodeCount: 0,
    edgeCount: 0,
  },
  nodes: {},
  relationships: {
    edges: [],
    hierarchy: [],
  },
};

/**
 * Empty diagram file template
 */
export function createEmptyDiagramV3(name: string, type: DiagramType): DiagramFileV3 {
  const now = new Date().toISOString();
  return {
    version: '3.0.0',
    metadata: {
      diagramName: name,
      diagramType: type,
      created: now,
      updated: now,
    },
    view: {
      nodes: [],
      layout: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    snapshots: [
      {
        id: 'snapshot-current',
        label: 'Current State',
        description: '',
        timestamp: null,
        created: now,
        isCurrent: true,
        localNodes: {},
        layout: {},
        localEdges: [],
      },
    ],
    currentSnapshotId: 'snapshot-current',
    annotations: [],
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if object is valid GraphFileV3
 */
export function isGraphFileV3(obj: any): obj is GraphFileV3 {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.version === '3.0.0' &&
    obj.metadata &&
    obj.nodes &&
    typeof obj.nodes === 'object' &&
    obj.relationships &&
    Array.isArray(obj.relationships.edges)
  );
}

/**
 * Check if object is valid DiagramFileV3
 */
export function isDiagramFileV3(obj: any): obj is DiagramFileV3 {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.version === '3.0.0' &&
    obj.metadata &&
    obj.view &&
    Array.isArray(obj.view.nodes) &&
    obj.snapshots &&
    Array.isArray(obj.snapshots)
  );
}

/**
 * Check if node ID is local (snapshot-specific)
 */
export function isLocalNodeId(nodeId: string): boolean {
  return nodeId.startsWith('local-');
}

/**
 * Check if edge ID is local (snapshot-specific)
 */
export function isLocalEdgeId(edgeId: string): boolean {
  return edgeId.startsWith('local-edge-');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate UUID for node
 */
export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID for edge
 */
export function generateEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID for local node (snapshot)
 */
export function generateLocalNodeId(): string {
  return `local-node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID for local edge (snapshot)
 */
export function generateLocalEdgeId(): string {
  return `local-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID for snapshot
 */
export function generateSnapshotId(): string {
  return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get allowed node types for diagram type
 */
export function getAllowedNodeTypes(diagramType: DiagramType): NodeType[] {
  const typeMap: Record<DiagramType, NodeType[]> = {
    context: ['system', 'person'],
    container: ['container', 'person'],
    component: ['component'],
    code: ['code'],
    market: ['market'],
    organisation: ['organisation'],
    capability: ['capability'],
    graph: ['system', 'person', 'container', 'component'], // All types
  };

  return typeMap[diagramType] || [];
}

/**
 * Validate node type for diagram
 */
export function isNodeTypeAllowed(nodeType: NodeType, diagramType: DiagramType): boolean {
  const allowed = getAllowedNodeTypes(diagramType);
  return allowed.includes(nodeType);
}
