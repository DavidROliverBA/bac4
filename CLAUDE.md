# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BAC4** is an Obsidian plugin that transforms vaults into comprehensive enterprise architecture management platforms. It implements a 7-layer enterprise architecture model extending the C4 approach from market strategy to implementation code, with support for Wardley Mapping.

**Current Version:** 2.2.0 (in transition to v2.5.0 with major architectural refactor)

## Essential Development Commands

### Build & Development
```bash
npm run dev          # Watch mode with hot reload (primary development command)
npm run build        # Production build
npm run typecheck    # TypeScript type checking (run before commits)
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Generate coverage report
```

### Code Quality
```bash
npm run lint         # Lint TypeScript files
npm run format       # Format with Prettier
npm run fix          # Format + lint fix (recommended before commits)
```

### Testing in Obsidian
After building, create a symlink to your test vault:
```bash
ln -s /path/to/bac4 /path/to/your-vault/.obsidian/plugins/bac4
```
Then enable the plugin in Obsidian settings and reload (Cmd+R / Ctrl+R).

## High-Level Architecture

### Dual-File Format (v2.5.0+)

BAC4 uses a **dual-file architecture** that separates semantic data from presentation:

1. **`.bac4` files** - Node-centric semantic data
   - Node properties (label, description, technology, team, etc.)
   - Knowledge management (notes, URLs, attachments)
   - Metrics and compliance data
   - Wardley properties (visibility, evolution stage)
   - Links to other diagrams and nodes

2. **`.bac4-graph` files** - Relationship-centric presentation data
   - Edge definitions (relationships between nodes)
   - Layout information (x, y, width, height per node)
   - Timeline snapshots (version history)
   - Groups and annotations
   - View configuration (grid, minimap, layout algorithm)

**Key Benefit:** Multiple views of the same data. A single `.bac4` file can have multiple `.bac4-graph` files for different layouts (e.g., C4 Context view vs. Wardley Map view).

### File I/O Service Pattern

All file operations **must** use `src/services/file-io-service.ts`:

```typescript
// Read both files together
const { nodeFile, graphFile } = await readDiagram(vault, 'diagram.bac4');

// Convert to React Flow format
const nodes = mergeNodesAndLayout(nodeFile, graphFile);
const edges = getEdgesFromGraph(graphFile);

// Convert back and save
const { nodeFile, graphFile } = splitNodesAndEdges(nodes, edges, currentNodeFile, currentGraphFile);
await writeDiagram(vault, 'diagram.bac4', nodeFile, graphFile);
```

**Critical:** Never directly read/write `.bac4` files without using the File I/O Service. This ensures format compatibility and proper data transformation.

### 7-Layer Enterprise Architecture Model

BAC4 implements a strict layer validation system:

1. **Layer 1: Market** - Market segments (node type: `market`)
2. **Layer 2: Organisation** - Business units (node type: `organisation`)
3. **Layer 3: Capability** - Business capabilities (node type: `capability`)
4. **Layer 4: Context** - C4 Level 1 (node types: `system`, `person`)
5. **Layer 5: Container** - C4 Level 2 (node type: `container`)
6. **Layer 6: Component** - C4 Level 3 (node types: `c4`, `cloudComponent`)
7. **Layer 7: Code** - Implementation artifacts (node type: `code`)

**Layer Validation:** `src/utils/layer-validation.ts` enforces which node types can be added to which diagram layers. When adding nodes, check `isValidNodeType(nodeType, diagramType)` first.

### Plugin Lifecycle

```
main.ts (BAC4Plugin)
├── onload()
│   ├── Load settings from Obsidian data.json
│   ├── Initialize NodeRegistryService (tracks all node names)
│   ├── Register canvas view (VIEW_TYPE_CANVAS)
│   ├── Register .bac4 file extension handler
│   ├── Register commands (create diagram, open dashboard, graph view, etc.)
│   ├── Register file event handlers:
│   │   ├── file-open: Auto-switch to BAC4 view for .bac4 files
│   │   ├── rename: Update linkedDiagramPath references
│   │   ├── delete: Clean up graph layout
│   │   └── modify: Save graph layout when Canvas edited
│   └── Add ribbon icon (dice-4)
└── onunload()
    └── Save settings
```

### React Flow Integration

The canvas editor (`src/ui/canvas-view.tsx`) uses React Flow for visual editing:

```typescript
BAC4CanvasView (Obsidian ItemView)
├── ReactFlow Canvas
│   ├── Custom Node Types:
│   │   ├── PersonNode, SystemNode (Context layer)
│   │   ├── ContainerNode (Container layer)
│   │   ├── ComponentNode, CloudComponent (Component layer)
│   │   ├── MarketNode, OrganisationNode, CapabilityNode (upper layers)
│   │   ├── CodeNode (Code layer)
│   │   └── WardleyComponentNode, WardleyInertiaNode (Wardley Maps)
│   └── Custom Edge Types:
│       ├── DirectionalEdge (C4 diagrams)
│       └── WardleyEdge (Wardley Maps)
├── Toolbar (layer selector, node palette, export)
├── PropertyPanel (edit node/edge properties)
└── Timeline Panel (snapshot management)
```

**Auto-save:** Changes trigger debounced save (300ms) via `useFileOperations` hook.

### Services Architecture

Key services follow singleton pattern or are imported as modules:

- **NodeRegistryService** - Tracks all node names across diagrams for auto-naming
- **DiagramNavigationService** - Manages hierarchical diagram relationships (deprecated in v2.5.0, replaced by node links)
- **ComponentLibraryService** - Cloud component definitions (AWS, Azure, GCP)
- **TimelineService** - Snapshot/versioning management
- **GraphGenerationService** - Generates graph view of all diagrams
- **GraphLayoutService** - Persistent layout storage for graph view
- **GraphFilterService** - Filtering and statistics for graph view
- **MigrationService** - Handles v1 → v2.5.0 format migration
- **File I/O Service** - All `.bac4` / `.bac4-graph` read/write operations

### Migration from v1 to v2.5.0

When encountering old format files, use `MigrationService`:

```typescript
const migrationService = new MigrationService(app);
const stats = await migrationService.migrateAllDiagrams({
  dryRun: false,
  createBackups: true
});
```

The migration:
1. Splits `.bac4` into `.bac4` (nodes) + `.bac4-graph` (relationships)
2. Creates backups as `.bac4.v1.backup`
3. Preserves all data (nodes, edges, timeline, metadata)
4. Generates migration report

**Commands registered:** `migrate-to-v2-5`, `dry-run-migration`, `rollback-migration`, `show-migration-status`

## Critical Patterns

### 1. Never Mix Node Data and Layout

❌ **Wrong:**
```typescript
const node = {
  id: 'node-1',
  x: 100,
  y: 200,
  label: 'API Gateway'
};
```

✅ **Correct:**
```typescript
// In .bac4 file
const nodeData = {
  id: 'node-1',
  properties: { label: 'API Gateway', description: '...' },
  knowledge: { notes: [], urls: [] }
};

// In .bac4-graph file
const layout = {
  'node-1': { x: 100, y: 200, width: 250, height: 100 }
};
```

### 2. Always Use File I/O Service

❌ **Wrong:**
```typescript
const content = await vault.read(file);
const data = JSON.parse(content);
```

✅ **Correct:**
```typescript
import { readDiagram, writeDiagram } from './services/file-io-service';
const { nodeFile, graphFile } = await readDiagram(vault, filePath);
```

### 3. Layer Validation Before Node Creation

❌ **Wrong:**
```typescript
addNode({ type: 'container', data: {...} });
```

✅ **Correct:**
```typescript
import { isValidNodeType } from './utils/layer-validation';

if (!isValidNodeType('container', currentDiagramType)) {
  new Notice('Cannot add Container nodes to Context diagrams');
  return;
}
addNode({ type: 'container', data: {...} });
```

### 4. Hierarchical Navigation

Drill-down navigation uses `linkedDiagramPath` in node data:

```typescript
// In property panel
<select
  value={node.data.linkedDiagramPath || ''}
  onChange={(e) => updateNodeData(node.id, { linkedDiagramPath: e.target.value })}
>
  {availableDiagrams.map(d => <option value={d.path}>{d.name}</option>)}
</select>

// In node double-click handler
if (node.data.linkedDiagramPath) {
  await plugin.openCanvasViewInNewTab(node.data.linkedDiagramPath);
}
```

### 5. Timeline Snapshot Management

Snapshots capture diagram state at a point in time:

```typescript
// Create snapshot
const updatedGraphFile = createSnapshot(
  graphFile,
  'v1.0.0 Release',
  'Production release snapshot',
  '2025-10-22'
);

// Switch snapshot
const switchedGraphFile = switchSnapshot(graphFile, snapshotId);

// Reload canvas with new snapshot
const nodes = mergeNodesAndLayout(nodeFile, switchedGraphFile);
setNodes(nodes);
```

## Wardley Mapping Integration (v2.5.0)

Wardley Maps use the same dual-file format but with specialized properties:

**In `.bac4` file:**
```typescript
node.wardley = {
  visibility: 0.7,        // Y-axis: 0 (invisible) to 1 (visible)
  evolution: 0.8,         // X-axis: 0 (genesis) to 1 (commodity)
  evolutionStage: 'product',
  inertia: true,
  inertiaReason: 'Legacy system'
};
```

**In `.bac4-graph` file:**
```typescript
graphFile.config.axisLabels = {
  x: {
    genesis: 'Genesis',
    custom: 'Custom Built',
    product: 'Product',
    commodity: 'Commodity'
  },
  y: {
    top: 'Visible',
    bottom: 'Invisible'
  }
};
```

**Coordinate Conversion:**
```typescript
import { wardleyToCanvas, canvasToWardley } from './types/bac4-v2-types';

// Wardley coordinates to canvas pixels
const { x, y } = wardleyToCanvas(visibility, evolution, canvasWidth, canvasHeight);

// Canvas pixels to Wardley coordinates
const { visibility, evolution } = canvasToWardley(x, y, canvasWidth, canvasHeight);
```

## Type Definitions

Core types are in `src/types/bac4-v2-types.ts`:

- `BAC4FileV2` - Node file format
- `BAC4GraphFileV2` - Graph file format
- `NodeV2` - Node structure
- `EdgeV2` - Edge structure
- `Snapshot` - Timeline snapshot
- `WardleyProperties` - Wardley Map data

Legacy types in `src/types/canvas-types.ts` are being phased out.

## Common Gotchas

1. **File Extension Handling:** The plugin registers both `.bac4` files and markdown files with BAC4 frontmatter. Check `hasBac4Diagram()` in `src/utils/frontmatter-parser.ts`.

2. **Duplicate Tab Prevention:** `openDiagram()` in `main.ts` checks for existing tabs before opening. Always use the unified opening methods.

3. **Auto-Update on Rename:** The plugin automatically updates `linkedDiagramPath` references when files are renamed. This is handled in the `rename` event listener in `main.ts:166`.

4. **Graph View Canvas:** Graph view uses Obsidian's native Canvas format (`.canvas`) stored at `BAC4/__graph_view__.canvas`. It's regenerated on each open but preserves manual layout changes.

5. **Node Registry:** Auto-naming (System 1, System 2, etc.) depends on `NodeRegistryService` being initialized. It scans all `.bac4` files on plugin load.

6. **Settings Migration:** Users upgrading from old versions may not have `graphFilter` in settings. Always check and provide defaults (see `main.ts:1114`).

## Testing Strategy

- **Unit tests:** Use Jest for services, utilities, type conversions
- **Integration tests:** Test file I/O, migration, graph generation
- **Manual tests in Obsidian:** Build → symlink → reload → test features

**Coverage target:** 30%+ (current: 29.65%)

## Documentation

- `README.md` - User-facing features and installation
- `docs/V2.5_REFACTOR_PLAN.md` - v2.5.0 architectural changes
- `docs/V2.5_QUICK_REFERENCE.md` - Developer quick reference
- `docs/V2.5_TESTING_GUIDE.md` - Testing procedures
- `docs/GRAPH_VIEW_ROADMAP.md` - Graph view feature roadmap
- `docs/WARDLEY_MAPPING_PLAN.md` - Wardley Mapping implementation plan

## Release Process

1. Update version in `package.json`, `manifest.json`, `versions.json`
2. Run `npm run fix && npm run typecheck && npm test && npm run build`
3. Create git tag: `git tag -a v2.x.x -m "Release message"`
4. Create GitHub release with `bac4-vX.X.X.zip` containing `main.js`, `manifest.json`, `styles.css`
5. Update README.md version references

## Key Architectural Decisions

1. **Dual-file format** - Enables multiple views of same data, graph database migration path
2. **Layer validation** - Enforces architectural consistency across all diagrams
3. **Self-contained diagrams** - No global relationship registry (deprecated `diagram-relationships.json`)
4. **React Flow** - Proven canvas library with good performance
5. **Timeline versioning** - Snapshots allow temporal navigation (Current vs. historical states)
6. **Wardley Mapping integration** - Uses same node data, different visualization

## Future Roadmap

See **[ROADMAP.md](ROADMAP.md)** for the complete strategic product roadmap.

### Key Future Milestones

**v3.0.0 - Enterprise Collaboration (Q2 2026)**
- Planned vs. Actual tracking
- Team collaboration with RBAC
- Estate dashboard and analytics
- Architectural drift detection

**v4.0.0 - Enterprise Knowledge Graph (2027)**
- Neo4j graph database backend
- Meeting intelligence and auto-transcription
- Tacit knowledge capture
- Enterprise-wide contextual intelligence

**v4.1.0 - Standards & Interoperability (2027)**
- TOGAF, ArchiMate, BPMN, UML support
- Multi-format import/export
- RESTful and GraphQL APIs

**v5.0.0 - Personalization & Intelligence (2028)**
- Role-based adaptive UX
- Mobile apps with offline support
- AI pair programming for architecture
- Real-time collaborative diagramming
