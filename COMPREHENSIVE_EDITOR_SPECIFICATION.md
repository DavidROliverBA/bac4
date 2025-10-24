# BAC4 Enterprise Architecture Editor - Complete Build Specification

**Version:** 3.0.0
**Last Updated:** 2025-10-24
**Purpose:** Comprehensive specification to recreate the BAC4 visual enterprise architecture editor from scratch

---

## Executive Summary

Build an Obsidian plugin that transforms Markdown vaults into comprehensive enterprise architecture management platforms. The editor supports a 7-layer architecture model (Market → Code) with visual diagramming, timeline versioning, and Wardley Mapping capabilities.

**Core Value Proposition:**
- Visual architecture diagramming within Obsidian's knowledge management ecosystem
- Single source of truth with dual-file format (semantic data + presentation)
- Timeline snapshots for temporal architecture evolution tracking
- Multi-view support (C4 diagrams, Wardley Maps, graph view)
- Hierarchical drill-down navigation between architecture layers

---

## Technology Stack

### Required Dependencies

```json
{
  "dependencies": {
    "obsidian": "^1.7.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "reactflow": "^11.11.4",
    "@reactflow/background": "^11.3.14",
    "@reactflow/controls": "^11.2.14",
    "@reactflow/minimap": "^11.7.14",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.7.2",
    "esbuild": "^0.24.0",
    "@typescript-eslint/eslint-plugin": "^8.18.1",
    "@typescript-eslint/parser": "^8.18.1",
    "eslint": "^9.16.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^16.1.0",
    "prettier": "^3.4.2"
  }
}
```

### Build Configuration

- **Bundler:** esbuild (for fast builds)
- **TypeScript:** Strict mode enabled
- **Output:** Single `main.js` file (ESM format)
- **External:** Mark `obsidian` as external dependency

---

## Architecture Overview

### 1. Dual-File Format System

The editor uses a split-brain architecture to separate semantic data from presentation:

#### File Type 1: `.bac4` (Node File - Semantic Data)

```typescript
interface BAC4FileV2 {
  version: '2.5.0' | '2.5.1';
  metadata: {
    title: string;
    diagramType: DiagramType;
    created: string; // ISO timestamp
    updated: string; // ISO timestamp
    author?: string;
    tags?: string[];
  };
  nodes: Record<string, NodeV2>;
}

interface NodeV2 {
  id: string;
  type: NodeType;
  properties: {
    label: string;
    description?: string;
    technology?: string;
    team?: string;
    status?: string;
    [key: string]: any; // Extensible
  };
  knowledge: {
    notes: string[];
    urls: string[];
    attachments: string[];
  };
  metrics: {
    [key: string]: number | string;
  };
  wardley?: {
    visibility: number; // 0-1 (Y-axis)
    evolution: number;  // 0-1 (X-axis)
    evolutionStage: 'genesis' | 'custom' | 'product' | 'commodity';
    inertia?: boolean;
    inertiaReason?: string;
  };
  links: {
    parent: string | null;
    children: string[];
    linkedDiagrams: string[];
    externalSystems: string[];
    dependencies: string[];
  };
  style: {
    color: string;
    icon?: string;
    shape?: 'rectangle' | 'circle' | 'diamond' | 'hexagon';
  };
}
```

#### File Type 2: `.bac4-graph` (Graph File - Presentation Data)

```typescript
interface BAC4GraphFileV2 {
  version: '2.5.0' | '2.5.1';
  metadata: {
    title: string;
    nodeFile: string; // Reference to .bac4 file
    viewType: 'c4' | 'wardley';
    created: string;
    updated: string;
  };
  timeline: {
    snapshots: Snapshot[];
    currentSnapshotId: string;
    snapshotOrder: string[];
  };
  config: {
    grid: { enabled: boolean; size: number };
    minimap: { enabled: boolean; position: string };
    layoutAlgorithm: 'manual' | 'dagre' | 'elk';
    axisLabels?: WardleyAxisLabels; // For Wardley Maps
  };
}

interface Snapshot {
  id: string;
  label: string;
  timestamp: string | null;
  description: string;
  created: string; // ISO timestamp
  layout: Record<string, LayoutInfo>;
  edges: EdgeV2[];
  groups: Group[];
  annotations: Annotation[];
  nodeProperties?: Record<string, NodeSnapshotProperties>; // v2.5.1+
}

interface NodeSnapshotProperties {
  properties: {
    label: string;
    description?: string;
    technology?: string;
    team?: string;
    status?: string;
  };
  style: {
    color: string;
    icon?: string;
    shape?: ShapeType;
  };
}

interface LayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
}

interface EdgeV2 {
  id: string;
  source: string;
  target: string;
  type: 'uses' | 'sends-data-to' | 'depends-on' | 'contains' | 'implements' | 'default';
  properties: {
    label?: string;
    [key: string]: any;
  };
  style: {
    direction: 'right' | 'left' | 'both';
    lineType: 'solid' | 'dashed' | 'dotted';
    color: string;
    markerEnd: 'arrow' | 'arrowclosed' | 'none';
  };
  handles: {
    sourceHandle: 'top' | 'right' | 'bottom' | 'left';
    targetHandle: 'top' | 'right' | 'bottom' | 'left';
  };
}
```

**Critical Design Rule:**
- **NEVER update snapshot-varying properties** (label, description, status, color, icon, shape) in the `.bac4` file from snapshot edits
- These properties are stored ONLY in `snapshot.nodeProperties` to prevent contamination between snapshots
- The `.bac4` file stores only INVARIANT properties (technology, team, knowledge, metrics, wardley, links)

---

### 2. Seven-Layer Architecture Model

The editor enforces a strict layered architecture:

```typescript
type DiagramType =
  | 'market'       // Layer 1: Market segments
  | 'organisation' // Layer 2: Business units
  | 'capability'   // Layer 3: Business capabilities
  | 'context'      // Layer 4: C4 Level 1 (systems & people)
  | 'container'    // Layer 5: C4 Level 2 (applications)
  | 'component'    // Layer 6: C4 Level 3 (technical components)
  | 'code'         // Layer 7: Implementation artifacts
  | 'wardley'      // Special: Wardley Maps
  | 'graph';       // Special: Graph view

type NodeType =
  | 'market'
  | 'organisation'
  | 'capability'
  | 'person'
  | 'system'
  | 'container'
  | 'c4'           // Generic C4 component
  | 'cloudComponent'
  | 'code'
  | 'wardleyComponent'
  | 'wardleyInertia';
```

**Layer Validation Rules:**

```typescript
const ALLOWED_NODE_TYPES: Record<DiagramType, NodeType[]> = {
  market: ['market'],
  organisation: ['organisation'],
  capability: ['capability'],
  context: ['person', 'system'],
  container: ['container'],
  component: ['c4', 'cloudComponent'],
  code: ['code'],
  wardley: ['wardleyComponent', 'wardleyInertia'],
  graph: ['person', 'system', 'container', 'c4', 'cloudComponent', 'code']
};

function isValidNodeType(nodeType: NodeType, diagramType: DiagramType): boolean {
  return ALLOWED_NODE_TYPES[diagramType]?.includes(nodeType) ?? false;
}
```

---

### 3. Core Services Architecture

Implement these services as singleton classes or ES modules:

#### File I/O Service (`src/services/file-io-service.ts`)

**Purpose:** All file read/write operations for dual-file format

**Key Functions:**

```typescript
// Read operations
async function readBAC4File(vault: Vault, filePath: string): Promise<BAC4FileV2>
async function readBAC4GraphFile(vault: Vault, filePath: string): Promise<BAC4GraphFileV2>
async function readDiagram(vault: Vault, bac4FilePath: string): Promise<{ nodeFile, graphFile }>

// Write operations
async function writeBAC4File(vault: Vault, filePath: string, nodeFile: BAC4FileV2): Promise<void>
async function writeBAC4GraphFile(vault: Vault, filePath: string, graphFile: BAC4GraphFileV2): Promise<void>
async function writeDiagram(vault: Vault, bac4FilePath: string, nodeFile: BAC4FileV2, graphFile: BAC4GraphFileV2): Promise<void>

// Format conversion
function mergeNodesAndLayout(nodeFile: BAC4FileV2, graphFile: BAC4GraphFileV2, snapshotId?: string): Node[]
function getEdgesFromGraph(graphFile: BAC4GraphFileV2, snapshotId?: string): Edge[]
function splitNodesAndEdges(nodes: Node[], edges: Edge[], currentNodeFile: BAC4FileV2, currentGraphFile: BAC4GraphFileV2): { nodeFile, graphFile }

// Snapshot operations
function createSnapshot(graphFile: BAC4GraphFileV2, label: string, description: string, timestamp: string | null): BAC4GraphFileV2
function switchSnapshot(graphFile: BAC4GraphFileV2, snapshotId: string): BAC4GraphFileV2
function deleteSnapshot(graphFile: BAC4GraphFileV2, snapshotId: string): BAC4GraphFileV2
```

**Critical Implementation Detail for `splitNodesAndEdges`:**

```typescript
// ✅ CORRECT: Only update invariant properties in .bac4 file
for (const reactFlowNode of nodes) {
  const existingNode = currentNodeFile.nodes[reactFlowNode.id];

  if (existingNode) {
    // Existing node - ONLY update INVARIANT properties
    updatedNodes[reactFlowNode.id] = {
      ...existingNode,
      properties: {
        ...existingNode.properties,
        technology: reactFlowNode.data.technology,
        team: reactFlowNode.data.team,
      },
      knowledge: reactFlowNode.data.knowledge || existingNode.knowledge,
      metrics: reactFlowNode.data.metrics || existingNode.metrics,
      wardley: reactFlowNode.data.wardley || existingNode.wardley,
      links: reactFlowNode.data.links || existingNode.links,
      // DO NOT update: label, description, status, color, icon, shape
      // These are snapshot-varying and stored in nodeProperties
    };
  } else {
    // New node - initialize with defaults
    updatedNodes[reactFlowNode.id] = {
      id: reactFlowNode.id,
      type: reactFlowNode.type as NodeType,
      properties: {
        label: reactFlowNode.data.label || 'New Node',
        description: '',
        technology: reactFlowNode.data.technology,
        team: reactFlowNode.data.team,
      },
      knowledge: { notes: [], urls: [], attachments: [] },
      metrics: {},
      wardley: reactFlowNode.data.wardley,
      links: { parent: null, children: [], linkedDiagrams: [], externalSystems: [], dependencies: [] },
      style: { color: '#3b82f6', icon: reactFlowNode.data.icon, shape: reactFlowNode.data.shape },
    };
  }
}

// ✅ Store snapshot-specific properties in nodeProperties
const nodeProperties: Record<string, NodeSnapshotProperties> = {};
for (const node of nodes) {
  nodeProperties[node.id] = {
    properties: {
      label: node.data.label,
      description: node.data.description || '',
      technology: node.data.technology,
      team: node.data.team,
      status: node.data.status,
    },
    style: {
      color: node.data.color || '#3b82f6',
      icon: node.data.icon,
      shape: node.data.shape,
    },
  };
}
```

#### Timeline Service (`src/services/TimelineService.ts`)

**Purpose:** Manages v1 timeline format (in-memory state)

**Key Functions:**

```typescript
class TimelineService {
  static createSnapshot(nodes: Node[], edges: Edge[], annotations: Annotation[], options: CreateSnapshotOptions, currentTimeline: Timeline): CreateSnapshotResult
  static switchSnapshot(snapshotId: string, timeline: Timeline): SwitchSnapshotResult
  static deleteSnapshot(snapshotId: string, timeline: Timeline): Timeline
  static renameSnapshot(snapshotId: string, newLabel: string, timeline: Timeline): Timeline
  static reorderSnapshots(newOrder: string[], timeline: Timeline): Timeline
  static getNextSnapshot(currentId: string, timeline: Timeline): TimelineSnapshot | null
  static getPreviousSnapshot(currentId: string, timeline: Timeline): TimelineSnapshot | null
  static createInitialTimeline(nodes?: Node[], edges?: Edge[], label?: string): Timeline
  static getCurrentSnapshot(timeline: Timeline): TimelineSnapshot
}
```

**Critical Behavior (v2.5.1):**
- When creating snapshot, auto-switch to new snapshot: `currentSnapshotId: snapshot.id`

#### Node Registry Service (`src/services/NodeRegistryService.ts`)

**Purpose:** Tracks all node names across diagrams for auto-naming

```typescript
class NodeRegistryService {
  private nodeNames: Set<string> = new Set();

  async scanAllDiagrams(vault: Vault): Promise<void>
  registerNodeName(name: string): void
  unregisterNodeName(name: string): void
  isNameTaken(name: string): boolean
  generateUniqueName(prefix: string): string // e.g., "System 1", "System 2"
}
```

#### Component Library Service (`src/services/ComponentLibraryService.ts`)

**Purpose:** Cloud component templates (AWS, Azure, GCP)

```typescript
interface CloudComponent {
  id: string;
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  category: 'compute' | 'storage' | 'database' | 'network' | 'security' | 'analytics' | 'ai-ml';
  icon: string; // Lucide icon name
  color: string;
  description: string;
  tags: string[];
}

class ComponentLibraryService {
  getComponents(provider?: string, category?: string): CloudComponent[]
  getComponentById(id: string): CloudComponent | null
  searchComponents(query: string): CloudComponent[]
}
```

---

## React Flow Canvas Implementation

### Main Canvas Component (`src/ui/canvas-view.tsx`)

**Structure:**

```tsx
export class BAC4CanvasView extends ItemView {
  // Obsidian view lifecycle
  getViewType(): string { return VIEW_TYPE_CANVAS; }
  getDisplayText(): string { return 'BAC4 Canvas'; }
  getIcon(): string { return 'dice-4'; }

  async onOpen(): Promise<void> {
    // Load .bac4 and .bac4-graph files
    // Initialize React root
    // Render canvas
  }

  async onClose(): Promise<void> {
    // Cleanup React
    // Save state
  }
}

const CanvasContent: React.FC<Props> = ({ plugin, filePath }) => {
  // State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeFile, setNodeFile] = useState<BAC4FileV2>(null);
  const [graphFile, setGraphFile] = useState<BAC4GraphFileV2>(null);
  const [timeline, setTimeline] = useState<Timeline>(null); // v1 format

  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const forceSaveRef = useRef<(() => Promise<void>) | null>(null);

  // Custom hooks
  useFileOperations({ /* auto-save logic */ });
  useNodeHandlers({ /* node operations */ });
  useEdgeHandlers({ /* edge operations */ });

  // React Flow setup
  return (
    <div className="bac4-canvas-container">
      <Toolbar />
      <TimelinePanel />
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
      <PropertyPanel />
    </div>
  );
};
```

### Custom Node Types

Implement these React Flow custom nodes:

#### 1. PersonNode (`src/ui/nodes/PersonNode.tsx`)

```tsx
const PersonNode: React.FC<NodeProps<CanvasNodeData>> = ({ data, selected }) => {
  return (
    <div className={`person-node ${selected ? 'selected' : ''}`} style={{ borderColor: data.color }}>
      <div className="node-header">
        <Lucide icon={data.icon || 'user'} size={20} />
        <span>{data.label}</span>
      </div>
      {data.description && <div className="node-description">{data.description}</div>}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};
```

**Key Features:**
- Circular/ellipse shape
- Icon + label display
- Description tooltip
- Colored border
- Connection handles (top, right, bottom, left)

#### 2. SystemNode (`src/ui/nodes/SystemNode.tsx`)

```tsx
const SystemNode: React.FC<NodeProps<CanvasNodeData>> = ({ data, selected }) => {
  const hasDrillDown = data.linkedDiagramPath;

  return (
    <div className={`system-node ${selected ? 'selected' : ''}`} style={{ borderColor: data.color }}>
      <div className="node-header">
        <Lucide icon={data.icon || 'box'} size={20} />
        <span>{data.label}</span>
        {hasDrillDown && <span className="drill-down-badge">📂</span>}
      </div>
      {data.description && <div className="node-description">{data.description}</div>}
      {data.technology && <div className="node-tech">{data.technology}</div>}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};
```

**Key Features:**
- Rectangle shape
- Drill-down indicator (📂 badge) if `linkedDiagramPath` exists
- Double-click to open child diagram
- Technology stack display

#### 3. ContainerNode (`src/ui/nodes/ContainerNode.tsx`)

Similar to SystemNode but with different styling (lighter background, dashed border).

#### 4. ComponentNode / CloudComponentNode (`src/ui/nodes/ComponentNode.tsx`)

```tsx
const CloudComponentNode: React.FC<NodeProps<CanvasNodeData>> = ({ data, selected }) => {
  return (
    <div className={`cloud-component-node ${selected ? 'selected' : ''}`} style={{ backgroundColor: data.color }}>
      <div className="cloud-icon">
        <Lucide icon={data.icon || 'cloud'} size={32} />
      </div>
      <div className="cloud-label">{data.label}</div>
      {data.provider && <div className="cloud-provider">{data.provider}</div>}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};
```

**Key Features:**
- Icon-centric design
- Provider badge (AWS, Azure, GCP)
- Colored background

#### 5. WardleyComponentNode (`src/ui/nodes/WardleyComponentNode.tsx`)

```tsx
const WardleyComponentNode: React.FC<NodeProps<WardleyNodeData>> = ({ data, selected }) => {
  return (
    <div className={`wardley-component ${selected ? 'selected' : ''}`}>
      <div className="wardley-label">{data.label}</div>
      <div className="wardley-evolution">{data.wardley?.evolutionStage}</div>
      {data.wardley?.inertia && <span className="inertia-indicator">⚓</span>}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};
```

**Wardley Coordinate System:**

```typescript
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const PADDING = 50;

function wardleyToCanvas(visibility: number, evolution: number): { x: number; y: number } {
  return {
    x: PADDING + (evolution * (CANVAS_WIDTH - 2 * PADDING)),
    y: PADDING + ((1 - visibility) * (CANVAS_HEIGHT - 2 * PADDING))
  };
}

function canvasToWardley(x: number, y: number): { visibility: number; evolution: number } {
  return {
    evolution: (x - PADDING) / (CANVAS_WIDTH - 2 * PADDING),
    visibility: 1 - ((y - PADDING) / (CANVAS_HEIGHT - 2 * PADDING))
  };
}
```

### Custom Edge Types

#### DirectionalEdge (`src/ui/edges/DirectionalEdge.tsx`)

```tsx
const DirectionalEdge: React.FC<EdgeProps> = ({ id, source, target, data, selected }) => {
  const direction = data?.direction || 'right';

  const getMarkerEnd = () => {
    if (direction === 'right') return 'url(#arrow-right)';
    if (direction === 'left') return 'url(#arrow-left)';
    if (direction === 'both') return 'url(#arrow-both)';
  };

  return (
    <>
      <defs>
        <marker id="arrow-right" markerWidth="10" markerHeight="10" refX="5" refY="5">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
        </marker>
        {/* Define other markers */}
      </defs>
      <BaseEdge id={id} path={edgePath} markerEnd={getMarkerEnd()} />
      {data?.label && <EdgeLabelRenderer><div>{data.label}</div></EdgeLabelRenderer>}
    </>
  );
};
```

**Key Features:**
- Direction: right (→), left (←), both (↔)
- Editable labels
- Color customization
- Line type (solid, dashed, dotted)

---

## Key Features Implementation

### 1. Timeline Snapshot System

**User Workflow:**
1. User views "Current" snapshot (default, always exists)
2. User clicks "+ Add Snapshot" button
3. Modal appears: "Enter snapshot label"
4. User enters "Phase 1" and clicks "Create Snapshot"
5. ✅ Editor auto-switches to "Phase 1" (shows captured state from "Current")
6. User edits "Phase 1" (changes colors, adds nodes)
7. User switches back to "Current" → ✅ Force save "Phase 1" to disk first
8. User closes file
9. User reopens file → ✅ Shows last viewed snapshot

**Implementation Requirements:**

```typescript
// Creating snapshot
const handleCreateSnapshot = useCallback(async (label: string, description: string, timestamp: string | null) => {
  console.log('BAC4: 📸 Creating snapshot from CANVAS STATE');

  // 1. Create snapshot in v1 timeline (in-memory)
  const { snapshot, timeline: updatedTimeline } = TimelineService.createSnapshot(
    nodes, edges, annotations, { label, description, timestamp }, timeline
  );

  // 2. Create snapshot in v2.5 graph file
  const updatedGraphFile = createSnapshot(graphFile, label, description, timestamp);

  // 3. Update state
  setTimeline(updatedTimeline);
  setGraphFile(updatedGraphFile);

  // 4. ✅ AUTO-SWITCH to new snapshot (v2.5.1 behavior)
  console.log('BAC4: 🔄 Auto-switching to new snapshot:', snapshot.id);
  const newSnapshot = updatedTimeline.snapshots.find(s => s.id === snapshot.id);
  setNodes(JSON.parse(JSON.stringify(newSnapshot.nodes)));
  setEdges(JSON.parse(JSON.stringify(newSnapshot.edges)));
  setAnnotations(JSON.parse(JSON.stringify(newSnapshot.annotations)));

  // 5. Save immediately
  await forceSaveRef.current?.();
}, [nodes, edges, annotations, timeline, graphFile]);

// Switching snapshots
const handleSnapshotSwitch = useCallback(async (snapshotId: string) => {
  console.log('BAC4 v2.5.1: Switching to snapshot:', snapshotId);

  // 1. ✅ CRITICAL: Force save current snapshot to disk BEFORE switching
  if (forceSaveRef.current) {
    console.log('BAC4 v2.5.1: 💾 Force saving to disk before switch...');
    await forceSaveRef.current();
    console.log('BAC4 v2.5.1: ✅ Force save complete');
  }

  // 2. Update v2.5 graph file
  const updatedGraphFile = switchSnapshot(graphFile, snapshotId);
  setGraphFile(updatedGraphFile);

  // 3. Load new snapshot data
  const nodes = mergeNodesAndLayout(nodeFile, updatedGraphFile, snapshotId);
  const edges = getEdgesFromGraph(updatedGraphFile, snapshotId);

  setNodes(nodes);
  setEdges(edges);

  // 4. Update v1 timeline (in-memory)
  const updatedTimeline = { ...timeline, currentSnapshotId: snapshotId };
  setTimeline(updatedTimeline);
}, [nodeFile, graphFile, timeline, forceSaveRef]);
```

**Force Save Implementation:**

```typescript
const forceSaveSnapshot = useCallback(async () => {
  console.log('BAC4 v2.5.1: 💾 FORCE SAVE triggered');

  // 1. Cancel any pending auto-save
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = null;
  }

  // 2. Sync v1 timeline to v2.5 snapshots
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  // 3. Split React Flow data to v2.5.1 format
  const { nodeFile: updatedNodeFile, graphFile: updatedGraphFile } = splitNodesAndEdges(
    nodes, edges, nodeFile, graphFile
  );

  // 4. Write to disk immediately (synchronous)
  await writeDiagram(vault, filePath, updatedNodeFile, updatedGraphFile);

  console.log('BAC4 v2.5.1: ✅ FORCE SAVE complete');
}, [filePath, nodes, edges, nodeFile, graphFile, vault]);
```

### 2. Auto-Save with Debounce

```typescript
const AUTO_SAVE_DELAY = 300; // ms

useEffect(() => {
  if (!filePath || !nodes || !edges) return;

  console.log('BAC4 v2.5: Auto-save effect triggered');

  // Cancel previous timeout
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }

  // Set new timeout
  autoSaveTimeoutRef.current = setTimeout(async () => {
    console.log('BAC4 v2.5: Starting auto-save to', filePath);

    const { nodeFile: updatedNodeFile, graphFile: updatedGraphFile } = splitNodesAndEdges(
      nodes, edges, nodeFileRef.current!, graphFileRef.current!
    );

    await writeDiagram(vault, filePath, updatedNodeFile, updatedGraphFile);

    console.log('BAC4 v2.5: ✅ Auto-saved successfully');
  }, AUTO_SAVE_DELAY);

  return () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };
}, [nodes, edges, annotations, timeline, filePath, vault]);
```

### 3. Hierarchical Navigation (Drill-Down)

**Implementation:**

```typescript
// In PropertyPanel - Linked Diagram Selector
<div className="property-section">
  <label>Linked Diagram</label>
  <select
    value={selectedNode.data.linkedDiagramPath || ''}
    onChange={(e) => {
      updateNodeData(selectedNode.id, { linkedDiagramPath: e.target.value });
    }}
  >
    <option value="">None</option>
    {availableDiagrams.map(diagram => (
      <option key={diagram.path} value={diagram.path}>{diagram.name}</option>
    ))}
  </select>
</div>

// In Node - Double-Click Handler
const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
  if (node.data.linkedDiagramPath) {
    console.log('BAC4: Drilling down to:', node.data.linkedDiagramPath);
    plugin.openCanvasViewInNewTab(node.data.linkedDiagramPath);
  }
}, [plugin]);

// Register handler
<ReactFlow onNodeDoubleClick={handleNodeDoubleClick} />
```

**Breadcrumb Display:**

```tsx
const Breadcrumbs: React.FC<{ filePath: string; currentNode?: Node }> = ({ filePath, currentNode }) => {
  const parentPath = currentNode?.data.linkedDiagramPath;

  return (
    <div className="breadcrumbs">
      {parentPath && <span onClick={() => openDiagram(parentPath)}>Parent</span>}
      {parentPath && <span className="separator">→</span>}
      <span className="current">{getFileName(filePath)}</span>
    </div>
  );
};
```

### 4. Layer Validation

**Prevent invalid node additions:**

```typescript
const handleAddNode = useCallback((nodeType: NodeType) => {
  const diagramType = graphFile.metadata.diagramType;

  if (!isValidNodeType(nodeType, diagramType)) {
    new Notice(`Cannot add ${nodeType} nodes to ${diagramType} diagrams`);
    return;
  }

  // Generate unique name
  const uniqueName = nodeRegistry.generateUniqueName(nodeType);

  // Create node
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type: nodeType,
    position: { x: 100, y: 100 },
    data: {
      label: uniqueName,
      description: '',
      color: getDefaultColor(nodeType),
      icon: getDefaultIcon(nodeType),
    },
  };

  setNodes([...nodes, newNode]);
}, [nodes, graphFile, nodeRegistry]);
```

### 5. Property Panel

**Dynamic property editing:**

```tsx
const PropertyPanel: React.FC<{ selectedNode?: Node; selectedEdge?: Edge }> = ({ selectedNode, selectedEdge }) => {
  if (!selectedNode && !selectedEdge) {
    return <div className="property-panel">Select a node or edge to edit properties</div>;
  }

  if (selectedNode) {
    return (
      <div className="property-panel">
        <h3>Node Properties</h3>

        <div className="property-group">
          <label>Label</label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
          />
        </div>

        <div className="property-group">
          <label>Description</label>
          <textarea
            value={selectedNode.data.description || ''}
            onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
          />
        </div>

        <div className="property-group">
          <label>Color</label>
          <input
            type="color"
            value={selectedNode.data.color}
            onChange={(e) => updateNodeData(selectedNode.id, { color: e.target.value })}
          />
        </div>

        <div className="property-group">
          <label>Technology</label>
          <input
            type="text"
            value={selectedNode.data.technology || ''}
            onChange={(e) => updateNodeData(selectedNode.id, { technology: e.target.value })}
          />
        </div>

        <div className="property-group">
          <label>Team</label>
          <input
            type="text"
            value={selectedNode.data.team || ''}
            onChange={(e) => updateNodeData(selectedNode.id, { team: e.target.value })}
          />
        </div>

        {/* Knowledge management */}
        <div className="property-group">
          <label>Notes</label>
          <textarea
            value={selectedNode.data.knowledge?.notes?.join('\n') || ''}
            onChange={(e) => updateNodeData(selectedNode.id, {
              knowledge: { ...selectedNode.data.knowledge, notes: e.target.value.split('\n') }
            })}
          />
        </div>
      </div>
    );
  }

  // Edge properties
  return (
    <div className="property-panel">
      <h3>Edge Properties</h3>

      <div className="property-group">
        <label>Label</label>
        <input
          type="text"
          value={selectedEdge.data?.label || ''}
          onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
        />
      </div>

      <div className="property-group">
        <label>Direction</label>
        <select
          value={selectedEdge.data?.direction || 'right'}
          onChange={(e) => updateEdgeData(selectedEdge.id, { direction: e.target.value })}
        >
          <option value="right">Right →</option>
          <option value="left">Left ←</option>
          <option value="both">Both ↔</option>
        </select>
      </div>

      <div className="property-group">
        <label>Color</label>
        <input
          type="color"
          value={selectedEdge.style?.stroke || '#888888'}
          onChange={(e) => updateEdgeStyle(selectedEdge.id, { stroke: e.target.value })}
        />
      </div>
    </div>
  );
};
```

### 6. Toolbar

```tsx
const Toolbar: React.FC<{ onAddNode, onExport, diagramType }> = ({ onAddNode, onExport, diagramType }) => {
  const nodeTypes = ALLOWED_NODE_TYPES[diagramType];

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <label>Add Node:</label>
        {nodeTypes.map(nodeType => (
          <button key={nodeType} onClick={() => onAddNode(nodeType)}>
            <Lucide icon={getDefaultIcon(nodeType)} size={16} />
            {nodeType}
          </button>
        ))}
      </div>

      <div className="toolbar-section">
        <button onClick={() => onExport('png')}>Export PNG</button>
        <button onClick={() => onExport('svg')}>Export SVG</button>
        <button onClick={() => onExport('json')}>Export JSON</button>
      </div>
    </div>
  );
};
```

---

## Plugin Lifecycle (Obsidian Integration)

### Main Plugin Class (`src/main.ts`)

```typescript
export default class BAC4Plugin extends Plugin {
  settings: BAC4Settings;
  nodeRegistry: NodeRegistryService;

  async onload() {
    console.log('Loading BAC4 plugin v3.0.0');

    // 1. Load settings
    await this.loadSettings();

    // 2. Initialize services
    this.nodeRegistry = new NodeRegistryService();
    await this.nodeRegistry.scanAllDiagrams(this.app.vault);

    // 3. Register view
    this.registerView(VIEW_TYPE_CANVAS, (leaf) => new BAC4CanvasView(leaf, this));

    // 4. Register file extensions
    this.registerExtensions(['bac4'], VIEW_TYPE_CANVAS);

    // 5. Register commands
    this.addCommand({
      id: 'create-context-diagram',
      name: 'Create Context Diagram',
      callback: () => this.createDiagram('context'),
    });

    this.addCommand({
      id: 'create-container-diagram',
      name: 'Create Container Diagram',
      callback: () => this.createDiagram('container'),
    });

    this.addCommand({
      id: 'create-component-diagram',
      name: 'Create Component Diagram',
      callback: () => this.createDiagram('component'),
    });

    this.addCommand({
      id: 'create-wardley-map',
      name: 'Create Wardley Map',
      callback: () => this.createDiagram('wardley'),
    });

    // 6. Register event handlers
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (file?.extension === 'bac4') {
          this.openCanvasView(file.path);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (file.path.endsWith('.bac4')) {
          this.handleFileRename(oldPath, file.path);
        }
      })
    );

    // 7. Add ribbon icon
    this.addRibbonIcon('dice-4', 'BAC4 Architecture', () => {
      this.createDiagram('context');
    });
  }

  async onunload() {
    console.log('Unloading BAC4 plugin');
    await this.saveSettings();
  }

  async createDiagram(type: DiagramType): Promise<void> {
    const modal = new DiagramCreationModal(this.app, async (title) => {
      const filePath = `BAC4/${title}.bac4`;

      // Create empty diagram files
      const nodeFile = createEmptyNodeFile(type, title);
      const graphFile = createEmptyGraphFile(type, title);

      await writeDiagram(this.app.vault, filePath, nodeFile, graphFile);

      // Open in canvas view
      await this.openCanvasView(filePath);
    });

    modal.open();
  }

  async openCanvasView(filePath: string): Promise<void> {
    // Check for existing tab
    const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS)
      .find(leaf => (leaf.view as BAC4CanvasView).filePath === filePath);

    if (existingLeaf) {
      this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    // Open in new tab
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({
      type: VIEW_TYPE_CANVAS,
      state: { filePath },
    });

    this.app.workspace.revealLeaf(leaf);
  }

  async handleFileRename(oldPath: string, newPath: string): Promise<void> {
    // Update linkedDiagramPath references in all diagrams
    const allFiles = this.app.vault.getMarkdownFiles();

    for (const file of allFiles) {
      if (file.extension === 'bac4') {
        const { nodeFile, graphFile } = await readDiagram(this.app.vault, file.path);

        let modified = false;
        for (const nodeId in nodeFile.nodes) {
          const node = nodeFile.nodes[nodeId];
          if (node.links.linkedDiagrams.includes(oldPath)) {
            node.links.linkedDiagrams = node.links.linkedDiagrams.map(
              path => path === oldPath ? newPath : path
            );
            modified = true;
          }
        }

        if (modified) {
          await writeDiagram(this.app.vault, file.path, nodeFile, graphFile);
        }
      }
    }
  }
}
```

---

## Styling Guidelines

### CSS Architecture (`styles.css`)

```css
/* Base canvas container */
.bac4-canvas-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

/* Timeline panel */
.timeline-panel {
  position: absolute;
  top: 60px;
  left: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  z-index: 10;
}

/* Property panel */
.property-panel {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  z-index: 10;
}

/* Node styles */
.person-node {
  padding: 12px 20px;
  border: 2px solid;
  border-radius: 50%;
  background: white;
  min-width: 120px;
  text-align: center;
}

.system-node {
  padding: 12px 16px;
  border: 2px solid;
  border-radius: 8px;
  background: white;
  min-width: 180px;
}

.container-node {
  padding: 12px 16px;
  border: 2px dashed;
  border-radius: 8px;
  background: #f9f9f9;
  min-width: 180px;
}

.cloud-component-node {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  min-width: 120px;
  color: white;
}

.wardley-component {
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(255,255,255,0.9);
  font-size: 12px;
}

/* Edge styles */
.react-flow__edge-path {
  stroke-width: 2;
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke-width: 3;
  stroke: #1976d2;
}

/* Snapshot indicator */
.snapshot-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #4caf50;
  color: white;
  border-radius: 3px;
  font-size: 10px;
  margin-left: 8px;
}

/* Drill-down badge */
.drill-down-badge {
  margin-left: 8px;
  font-size: 14px;
}
```

---

## Testing Requirements

### Unit Tests

```typescript
// src/__tests__/file-io-service.test.ts
describe('File I/O Service', () => {
  test('splitNodesAndEdges should not update snapshot-varying properties in node file', () => {
    const existingNodeFile = {
      nodes: {
        'node-1': {
          id: 'node-1',
          type: 'system',
          properties: { label: 'Old Label', description: 'Old Desc' },
          style: { color: '#ff0000' },
        }
      }
    };

    const reactFlowNodes = [{
      id: 'node-1',
      type: 'system',
      data: { label: 'New Label', description: 'New Desc', color: '#00ff00' }
    }];

    const { nodeFile } = splitNodesAndEdges(reactFlowNodes, [], existingNodeFile, graphFile);

    // Should NOT update label, description, color in node file
    expect(nodeFile.nodes['node-1'].properties.label).toBe('Old Label');
    expect(nodeFile.nodes['node-1'].properties.description).toBe('Old Desc');
    expect(nodeFile.nodes['node-1'].style.color).toBe('#ff0000');
  });

  test('splitNodesAndEdges should store snapshot-varying properties in nodeProperties', () => {
    const { graphFile } = splitNodesAndEdges(reactFlowNodes, [], nodeFile, currentGraphFile);
    const snapshot = graphFile.timeline.snapshots.find(s => s.id === graphFile.timeline.currentSnapshotId);

    expect(snapshot.nodeProperties['node-1'].properties.label).toBe('New Label');
    expect(snapshot.nodeProperties['node-1'].style.color).toBe('#00ff00');
  });
});

// src/__tests__/timeline-service.test.ts
describe('Timeline Service', () => {
  test('createSnapshot should auto-switch to new snapshot', () => {
    const { timeline } = TimelineService.createSnapshot(nodes, edges, annotations, { label: 'Test' }, currentTimeline);

    expect(timeline.currentSnapshotId).toBe(timeline.snapshots[timeline.snapshots.length - 1].id);
  });
});
```

### Integration Tests

```typescript
// src/__tests__/snapshot-persistence.test.ts
describe('Snapshot Persistence', () => {
  test('color changes persist across file reload', async () => {
    // 1. Create diagram
    const { nodeFile, graphFile } = createTestDiagram();

    // 2. Change node color
    const nodes = mergeNodesAndLayout(nodeFile, graphFile);
    nodes[0].data.color = '#ff0000';

    // 3. Save
    const { nodeFile: savedNodeFile, graphFile: savedGraphFile } = splitNodesAndEdges(nodes, [], nodeFile, graphFile);

    // 4. Reload
    const reloadedNodes = mergeNodesAndLayout(savedNodeFile, savedGraphFile);

    // 5. Verify color persists
    expect(reloadedNodes[0].data.color).toBe('#ff0000');
  });
});
```

---

## Critical Implementation Rules

### DO's

✅ **Always use File I/O Service** for all `.bac4` / `.bac4-graph` operations
✅ **Store snapshot-varying properties ONLY in `snapshot.nodeProperties`**
✅ **Force save before switching snapshots** to prevent data loss
✅ **Auto-switch to new snapshot after creation**
✅ **Validate node types before adding to diagram**
✅ **Use debounced auto-save (300ms delay)**
✅ **Provide visual feedback** (breadcrumbs, badges, indicators)
✅ **Support undo/redo** (React Flow built-in)
✅ **Handle file renames** (update linkedDiagramPath references)

### DON'Ts

❌ **Never update snapshot-varying properties in `.bac4` file** (label, description, status, color, icon, shape)
❌ **Never mix semantic data and layout data** in same file
❌ **Never read/write files directly** (always use File I/O Service)
❌ **Never skip force save before snapshot switch**
❌ **Never allow invalid node types in diagrams**
❌ **Never modify React Flow state during render**
❌ **Never use sync file operations** (always async)

---

## Export Functionality

### Image Export (PNG/JPEG)

```typescript
import { toPng, toJpeg } from 'html-to-image';

const handleExportPNG = useCallback(async () => {
  const element = reactFlowWrapper.current;
  if (!element) return;

  const dataUrl = await toPng(element, {
    backgroundColor: '#ffffff',
    width: 1920,
    height: 1080,
  });

  const link = document.createElement('a');
  link.download = `${getFileName(filePath)}.png`;
  link.href = dataUrl;
  link.click();
}, [filePath]);
```

### SVG Export

```typescript
import { toSvg } from 'html-to-image';

const handleExportSVG = useCallback(async () => {
  const element = reactFlowWrapper.current;
  if (!element) return;

  const dataUrl = await toSvg(element);

  const link = document.createElement('a');
  link.download = `${getFileName(filePath)}.svg`;
  link.href = dataUrl;
  link.click();
}, [filePath]);
```

---

## Performance Optimization

### 1. Virtualization (for large diagrams)

```typescript
import { useReactFlow } from 'reactflow';

const { getNodes, getEdges } = useReactFlow();

// Only render nodes in viewport + buffer
const visibleNodes = useMemo(() => {
  const viewport = getViewport();
  return getNodes().filter(node => isInViewport(node, viewport));
}, [getNodes, viewport]);
```

### 2. Memoization

```typescript
const NodeComponent = React.memo<NodeProps>(({ data, selected }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && prevProps.selected === nextProps.selected;
});
```

### 3. Debounced Updates

```typescript
import { debounce } from 'lodash';

const debouncedSave = useMemo(
  () => debounce((nodes, edges) => {
    saveDiagram(nodes, edges);
  }, 300),
  []
);
```

---

## Migration Strategy (v1 → v2.5.0)

```typescript
class MigrationService {
  async migrateAllDiagrams(vault: Vault): Promise<MigrationStats> {
    const stats = { total: 0, migrated: 0, failed: 0, skipped: 0 };

    const files = vault.getFiles().filter(f => f.extension === 'bac4');

    for (const file of files) {
      try {
        const content = await vault.read(file);
        const data = JSON.parse(content);

        if (data.version === '1.0.0') {
          // Split into .bac4 and .bac4-graph
          const nodeFile = convertToNodeFile(data);
          const graphFile = convertToGraphFile(data);

          // Backup original
          await vault.create(`${file.path}.v1.backup`, content);

          // Write new format
          await writeDiagram(vault, file.path, nodeFile, graphFile);

          stats.migrated++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error('Migration failed for', file.path, error);
        stats.failed++;
      }

      stats.total++;
    }

    return stats;
  }
}
```

---

## Debugging Tips

### Console Logging

```typescript
// Enable verbose logging
const DEBUG = true;

if (DEBUG) {
  console.log('BAC4 v2.5.1: 📸 Creating snapshot:', snapshotLabel);
  console.log('BAC4 v2.5.1: 💾 Force save triggered');
  console.log('BAC4 v2.5.1: ✅ Snapshot saved to disk');
}
```

### React DevTools

Install React DevTools browser extension to inspect component state.

### File Inspection

```bash
# Pretty-print JSON files
cat diagram.bac4 | jq '.'
cat diagram.bac4-graph | jq '.timeline.snapshots[0].nodeProperties'
```

---

## Deployment

### Build Process

```bash
npm run build  # Production build
npm run dev    # Development watch mode
```

### Installation

1. Build plugin: `npm run build`
2. Copy files to vault: `cp main.js manifest.json /path/to/vault/.obsidian/plugins/bac4/`
3. Reload Obsidian: Cmd+R (Mac) / Ctrl+R (Windows)
4. Enable plugin in Settings → Community Plugins

### Release

```bash
# Update version
npm version patch  # or minor/major

# Create git tag
git tag -a v3.0.0 -m "Release v3.0.0"
git push --tags

# Create GitHub release
gh release create v3.0.0 ./main.js ./manifest.json --title "v3.0.0"
```

---

## Summary

This specification provides a complete blueprint for recreating the BAC4 enterprise architecture editor. Key implementation priorities:

1. **Dual-file format** - Strict separation of semantic and presentation data
2. **Snapshot isolation** - Store varying properties in `nodeProperties`, not shared `.bac4` file
3. **Force save pattern** - Prevent data loss with immediate writes before state changes
4. **Layer validation** - Enforce architectural consistency
5. **React Flow integration** - Leverage proven canvas library
6. **Obsidian plugin lifecycle** - Proper event handling and file management

Follow these patterns precisely to avoid data contamination bugs and ensure robust timeline snapshot behavior.
