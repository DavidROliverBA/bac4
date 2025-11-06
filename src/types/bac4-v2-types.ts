/**
 * BAC4 v2.5.0 Format Type Definitions
 *
 * Major architectural change: Separation of data and presentation
 * - .bac4 files: Node-centric (semantic data, knowledge, properties)
 * - .bac4-graph files: Relationship-centric (edges, layout, snapshots)
 *
 * Benefits:
 * - Multiple views of same data
 * - Graph database ready (Neo4j migration path)
 * - Better knowledge management
 * - Wardley Mapping integrated
 *
 * @version 2.5.0
 */

// ============================================================================
// .bac4 File Format (Node-Centric)
// ============================================================================

export interface BAC4FileV2 {
  version: '2.5.0' | '2.5.1';
  metadata: DiagramMetadata;
  nodes: Record<string, NodeV2>;
}

export interface DiagramMetadata {
  id: string;
  title: string;
  description: string;
  layer: LayerType;
  diagramType: DiagramType;
  created: string;
  updated: string;
  tags?: string[];
  authors?: string[];
  version?: string;
  status?: DiagramStatus;
}

export type LayerType =
  | 'market'
  | 'organisation'
  | 'capability'
  | 'context'
  | 'container'
  | 'component'
  | 'code';

export type DiagramType =
  | 'market'
  | 'organisation'
  | 'capability'
  | 'context'
  | 'container'
  | 'component'
  | 'code'
  | 'wardley';

export type DiagramStatus = 'draft' | 'review' | 'published' | 'archived';

export interface NodeV2 {
  id: string;
  type: NodeType;
  properties: NodeProperties;
  knowledge: Knowledge;
  metrics?: Metrics;
  wardley?: WardleyProperties;
  links: NodeLinks;
  style: NodeStyle;
}

export type NodeType =
  | 'person'
  | 'system'
  | 'external-system'
  | 'container'
  | 'component'
  | 'code'
  | 'market'
  | 'organisation'
  | 'capability'
  | 'wardley-component'
  | 'wardley-inertia';

export interface NodeProperties {
  label: string;
  description: string;
  technology?: string;
  team?: string;
  repository?: string;
  documentation?: string;
  status?: string;
  criticality?: Criticality;
  compliance?: string[];
  vendor?: string;
  contract_renewal?: string;
  sla?: string;
  role?: string;
  count?: number;
  location?: string;
  [key: string]: any; // Extensible for future properties
}

export type Criticality = 'low' | 'medium' | 'high' | 'critical';

export interface Knowledge {
  notes: Note[];
  urls: URL[];
  attachments: Attachment[];
}

export interface Note {
  id: string;
  created: string;
  author: string;
  content: string;
  tags?: string[];
}

export interface URL {
  label: string;
  url: string;
  type: URLType;
}

export type URLType =
  | 'documentation'
  | 'repository'
  | 'monitoring'
  | 'project-management'
  | 'application'
  | 'other';

export interface Attachment {
  name: string;
  path: string;
  type: string;
}

export interface Metrics {
  uptime?: number;
  users?: number;
  transactions_per_day?: number;
  cost_per_month_usd?: number;
  storage_tb?: number;
  queries_per_day?: number;
  [key: string]: any; // Extensible for custom metrics
}

export interface WardleyProperties {
  visibility: number; // 0-1 (Y-axis)
  evolution: number; // 0-1 (X-axis)
  evolutionStage: EvolutionStage;
  inertia: boolean;
  inertiaReason?: string;
}

export type EvolutionStage = 'genesis' | 'custom' | 'product' | 'commodity';

export const EVOLUTION_RANGES: Record<EvolutionStage, [number, number]> = {
  genesis: [0.0, 0.25],
  custom: [0.25, 0.5],
  product: [0.5, 0.75],
  commodity: [0.75, 1.0],
};

export interface NodeLinks {
  parent: string | null;
  children: string[];
  linkedDiagrams: LinkedDiagram[];
  externalSystems: string[];
  dependencies: string[];
}

export interface LinkedDiagram {
  path: string;
  relationship: RelationshipType;
  description?: string;
}

export type RelationshipType =
  | 'decomposes-to'
  | 'implements'
  | 'contains'
  | 'depends-on'
  | 'implemented-by';

export interface NodeStyle {
  color: string;
  icon?: string;
  shape?: ShapeType;
}

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'person'
  | 'database'
  | 'cloud';

// ============================================================================
// .bac4-graph File Format (Relationship-Centric)
// ============================================================================

export interface BAC4GraphFileV2 {
  version: '2.5.0' | '2.5.1';
  metadata: GraphMetadata;
  timeline: Timeline;
  config: GraphConfig;
}

export interface GraphMetadata {
  nodeFile: string;
  graphId: string;
  title: string;
  viewType: ViewType;
  created: string;
  updated: string;
}

export type ViewType = 'c4-context' | 'c4-container' | 'c4-component' | 'wardley' | 'custom';

export interface Timeline {
  snapshots: Snapshot[];
  currentSnapshotId: string;
  snapshotOrder: string[];
}

export interface Snapshot {
  id: string;
  label: string;
  timestamp: string | null;
  description: string;
  created: string;
  layout: Record<string, LayoutInfo>;
  edges: EdgeV2[];
  groups: Group[];
  annotations: Annotation[];
  /**
   * Snapshot-specific node properties (v2.5.1+)
   * Stores properties that vary between snapshots (color, label, etc.)
   * Falls back to nodeFile.nodes if not present (backward compatibility)
   */
  nodeProperties?: Record<string, NodeSnapshotProperties>;
}

/**
 * Properties that can vary between snapshots (v2.5.1+)
 * For time-based snapshots, these properties are stored per-snapshot
 * to allow independent editing of each snapshot.
 */
export interface NodeSnapshotProperties {
  /** User-editable properties that may vary between snapshots */
  properties: {
    label: string;
    description?: string;
    technology?: string;
    team?: string;
    status?: string;
  };
  /** Visual style that may vary between snapshots */
  style: {
    color: string;
    icon?: string;
    shape?: ShapeType;
  };
}

export interface LayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
}

export interface EdgeV2 {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  properties: EdgeProperties;
  style: EdgeStyle;
  handles: EdgeHandles;
}

export type EdgeType =
  | 'uses'
  | 'sends-data-to'
  | 'depends-on'
  | 'contains'
  | 'implements'
  | 'default';

export interface EdgeProperties {
  label?: string;
  protocol?: string;
  frequency?: string;
  data_volume_gb_per_day?: number;
  [key: string]: any; // Extensible
}

export interface EdgeStyle {
  direction: Direction;
  lineType: LineType;
  color: string;
  markerEnd: MarkerType;
}

export type Direction = 'left' | 'right' | 'up' | 'down' | 'both';
export type LineType = 'solid' | 'dashed' | 'dotted';
export type MarkerType = 'arrowclosed' | 'arrow' | 'none';

export interface EdgeHandles {
  sourceHandle: HandlePosition;
  targetHandle: HandlePosition;
}

export type HandlePosition = 'top' | 'bottom' | 'left' | 'right';

export interface Group {
  id: string;
  label: string;
  nodeIds: string[];
  style: GroupStyle;
  collapsed: boolean;
}

export interface GroupStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: LineType;
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: AnnotationStyle;
}

export interface AnnotationStyle {
  backgroundColor: string;
  borderColor: string;
  fontSize: number;
}

export interface GraphConfig {
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showMinimap: boolean;
  layoutAlgorithm: LayoutAlgorithm;
  axisLabels?: WardleyAxisLabels; // For Wardley maps
  showEvolutionStages?: boolean; // For Wardley maps
  showInertiaBarriers?: boolean; // For Wardley maps
}

export type LayoutAlgorithm = 'manual' | 'hierarchical' | 'force-directed' | 'circular';

export interface WardleyAxisLabels {
  x: {
    genesis: string;
    custom: string;
    product: string;
    commodity: string;
  };
  y: {
    top: string;
    bottom: string;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get evolution stage from evolution value
 */
export function getEvolutionStage(evolution: number): EvolutionStage {
  if (evolution < 0.25) return 'genesis';
  if (evolution < 0.5) return 'custom';
  if (evolution < 0.75) return 'product';
  return 'commodity';
}

/**
 * Get evolution stage color
 */
export function getEvolutionStageColor(stage: EvolutionStage): string {
  const colors: Record<EvolutionStage, string> = {
    genesis: '#ef4444', // Red
    custom: '#f59e0b', // Orange
    product: '#3b82f6', // Blue
    commodity: '#10b981', // Green
  };
  return colors[stage];
}

/**
 * Get evolution stage description
 */
export function getEvolutionStageDescription(stage: EvolutionStage): string {
  const descriptions: Record<EvolutionStage, string> = {
    genesis: 'Novel, uncertain, poorly understood. Requires exploration and innovation.',
    custom: 'Bespoke solutions. Requires specialist knowledge and custom development.',
    product: 'Off-the-shelf products. Well understood with competitive market.',
    commodity: 'Utility, standardized, automated. Use managed services and focus elsewhere.',
  };
  return descriptions[stage];
}

/**
 * Validate Wardley coordinates
 */
export function validateWardleyCoordinates(
  visibility: number,
  evolution: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (visibility < 0 || visibility > 1) {
    errors.push('Visibility must be between 0 and 1');
  }

  if (evolution < 0 || evolution > 1) {
    errors.push('Evolution must be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert Wardley coordinates to canvas pixels
 */
export function wardleyToCanvas(
  visibility: number,
  evolution: number,
  canvasWidth: number = 1000,
  canvasHeight: number = 800,
  margin: number = 100
): { x: number; y: number } {
  return {
    x: margin + evolution * (canvasWidth - 2 * margin),
    y: margin + (1 - visibility) * (canvasHeight - 2 * margin), // Flip Y-axis
  };
}

/**
 * Convert canvas pixels to Wardley coordinates
 */
export function canvasToWardley(
  x: number,
  y: number,
  canvasWidth: number = 1000,
  canvasHeight: number = 800,
  margin: number = 100
): { visibility: number; evolution: number } {
  const evolution = Math.max(0, Math.min(1, (x - margin) / (canvasWidth - 2 * margin)));
  const visibility = Math.max(
    0,
    Math.min(1, 1 - (y - margin) / (canvasHeight - 2 * margin)) // Flip Y-axis
  );

  return { visibility, evolution };
}

/**
 * Create default node
 */
export function createDefaultNode(type: NodeType, label: string = 'New Node'): NodeV2 {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    properties: {
      label,
      description: '',
    },
    knowledge: {
      notes: [],
      urls: [],
      attachments: [],
    },
    metrics: {},
    wardley: undefined,
    links: {
      parent: null,
      children: [],
      linkedDiagrams: [],
      externalSystems: [],
      dependencies: [],
    },
    style: {
      color: getDefaultColor(type),
    },
  };
}

function getDefaultColor(type: NodeType): string {
  const colors: Record<NodeType, string> = {
    person: '#08427B',
    system: '#1168BD',
    'external-system': '#999999',
    container: '#438DD5',
    component: '#85BBF0',
    code: '#6366f1',
    market: '#ec4899',
    organisation: '#8b5cf6',
    capability: '#3b82f6',
    'wardley-component': '#3b82f6',
    'wardley-inertia': '#ef4444',
  };
  return colors[type] || '#3b82f6';
}

/**
 * Create default .bac4 file
 */
export function createDefaultBAC4File(
  title: string,
  layer: LayerType,
  diagramType: DiagramType
): BAC4FileV2 {
  return {
    version: '2.5.0',
    metadata: {
      id: `${diagramType}-${Date.now()}`,
      title,
      description: '',
      layer,
      diagramType,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: 'draft',
    },
    nodes: {},
  };
}

/**
 * Create default .bac4-graph file
 */
export function createDefaultGraphFile(
  nodeFileName: string,
  title: string,
  viewType: ViewType
): BAC4GraphFileV2 {
  return {
    version: '2.5.0',
    metadata: {
      nodeFile: nodeFileName,
      graphId: `${viewType}-${Date.now()}`,
      title: `${title} - Default Layout`,
      viewType,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
    timeline: {
      snapshots: [
        {
          id: `snapshot-${Date.now()}`,
          label: 'Current',
          timestamp: null,
          description: '',
          created: new Date().toISOString(),
          layout: {},
          edges: [],
          groups: [],
          annotations: [],
        },
      ],
      currentSnapshotId: `snapshot-${Date.now()}`,
      snapshotOrder: [`snapshot-${Date.now()}`],
    },
    config: {
      gridEnabled: true,
      gridSize: 20,
      snapToGrid: false,
      showMinimap: false,
      layoutAlgorithm: 'manual',
    },
  };
}
