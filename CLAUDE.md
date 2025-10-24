# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BAC4** is an Obsidian plugin that transforms vaults into comprehensive enterprise architecture management platforms. It implements a 7-layer enterprise architecture model extending the C4 approach from market strategy to implementation code, with support for Wardley Mapping.

**Current Version:** 3.0.0 (v2.5.1 format with snapshot isolation and edge persistence fixes)

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

### 6. Snapshot Isolation (v2.5.1) ⚠️ CRITICAL

**NEVER update snapshot-varying properties in the shared `.bac4` file.**

Snapshot-varying properties (label, description, status, color, icon, shape) are stored ONLY in `snapshot.nodeProperties` to prevent contamination between snapshots.

❌ **Wrong (causes snapshot contamination):**
```typescript
// In splitNodesAndEdges - DON'T DO THIS
updatedNodes[nodeId] = {
  ...existingNode,
  properties: {
    ...existingNode.properties,
    label: reactFlowNode.data.label,  // ❌ Updates shared file
    description: reactFlowNode.data.description,  // ❌ Contaminates snapshots
  },
  style: {
    color: reactFlowNode.data.color,  // ❌ Wrong! Snapshot-varying
  }
};
```

✅ **Correct (preserves snapshot isolation):**
```typescript
// In splitNodesAndEdges - Existing nodes
if (existingNode) {
  updatedNodes[nodeId] = {
    ...existingNode,
    // Update ONLY invariant properties
    properties: {
      ...existingNode.properties,
      technology: reactFlowNode.data.technology,  // ✅ Invariant
      team: reactFlowNode.data.team,              // ✅ Invariant
    },
    knowledge: reactFlowNode.data.knowledge,  // ✅ Invariant
    // DO NOT update: label, description, status, color, icon, shape
  };
}

// Store snapshot-varying properties separately
const nodeProperties: Record<string, NodeSnapshotProperties> = {};
for (const node of nodes) {
  nodeProperties[node.id] = {
    properties: {
      label: node.data.label,                    // ✅ Per-snapshot
      description: node.data.description || '',  // ✅ Per-snapshot
      status: node.data.status,                  // ✅ Per-snapshot
    },
    style: {
      color: node.data.color || '#3b82f6',       // ✅ Per-snapshot
      icon: node.data.icon,                      // ✅ Per-snapshot
      shape: node.data.shape,                    // ✅ Per-snapshot
    },
  };
}
```

**Why this matters:**
- Prevents "color contamination" where changing a node in one snapshot affects other snapshots
- Ensures true snapshot isolation
- Maintains temporal accuracy in architecture evolution

### 7. Edge Data Handling (v2.5.1) ⚠️ CRITICAL

**Avoid data duplication and spread ordering issues with edges.**

❌ **Wrong (causes data overwrites):**
```typescript
// In getEdgesFromGraph - DON'T DO THIS
data: {
  label: edge.properties.label,       // Set explicitly
  direction: edge.style.direction,    // Set explicitly
  ...edge.properties,                 // ❌ Overwrites above values!
}
```

✅ **Correct (prevents overwrites):**
```typescript
// In getEdgesFromGraph - Extract before spreading
const { direction: propDirection, style: propStyle, label, ...otherProperties } = edge.properties || {};

return {
  data: {
    label: label,                         // Edge label (user-editable)
    direction: edge.style.direction,      // Arrow direction (right/left/both)
    style: propStyle || 'curved',         // Edge path style (curved/diagonal/rightAngle)
    ...otherProperties,                   // Other custom properties (safe to spread)
  }
};
```

```typescript
// In splitNodesAndEdges - Extract before spreading
const { direction: _direction, style: edgePathStyle, label, ...otherEdgeData } = edge.data || {};

return {
  properties: {
    label: label,              // User-editable label
    style: edgePathStyle,      // Edge path style
    ...otherEdgeData,          // Other custom data (no direction)
  },
  style: {
    direction,                 // Arrow direction (stored here, not in properties)
    lineType: 'solid',
    color: edge.style.stroke,
    markerEnd,
  }
};
```

**Why this matters:**
- Prevents edge labels from being overwritten during save/load
- Eliminates data duplication (direction stored in both properties and style)
- Ensures edge changes persist correctly across file reloads

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

7. **Snapshot Auto-Switch (v2.5.1):** Creating a snapshot automatically switches to it. The `TimelineService.createSnapshot` sets `currentSnapshotId: snapshot.id` (line 75). This is intentional behavior approved in specification.

8. **Force Save Before Snapshot Switch (v2.5.1):** ALWAYS call `forceSaveRef.current()` before switching snapshots to prevent data loss from auto-save race conditions. The 300ms debounce can cause changes to be lost if user switches too quickly.

9. **Snapshot Contamination Prevention (v2.5.1):** Modifying `splitNodesAndEdges` requires extreme care. NEVER update snapshot-varying properties (label, color, description) in the shared `.bac4` file. These go in `snapshot.nodeProperties` only.

10. **Edge Data Duplication (v2.5.1):** `direction` belongs in `edge.style.direction`, NOT in `edge.properties.direction`. Extract values before spreading to avoid overwrites.

11. **Auto-Save Timing:** Changes trigger auto-save after 300ms debounce. Users must wait ~1 second before closing files to ensure save completes. Force save is used for critical operations (snapshot switching).

## Testing Strategy

**See [REGRESSION_TESTING_STRATEGY.md](REGRESSION_TESTING_STRATEGY.md) for comprehensive testing guidelines.**

### Test Levels

1. **Unit Tests:** Use Jest for services, utilities, type conversions
2. **Integration Tests:** Test file I/O, migration, graph generation, snapshot persistence
3. **Manual Smoke Tests:** Build → symlink → reload → test critical features

### Pre-Commit Testing Requirements

**MANDATORY before every commit:**
```bash
npm test              # All unit tests must pass
npm run typecheck     # Zero TypeScript errors
npm run build         # Build must succeed
```

**Manual smoke test checklist:**
- ✅ Change node label → save → reload → verify persistence
- ✅ Change node color → save → reload → verify persistence
- ✅ Change edge label → save → reload → verify persistence ⭐ CRITICAL
- ✅ Change edge direction → save → reload → verify persistence
- ✅ Create snapshot → verify auto-switch and isolation
- ✅ Edit snapshot → switch snapshots → verify no contamination

### Coverage Targets

| Type | Current | Target |
|------|---------|--------|
| Unit Tests | 29.65% | 60% |
| Integration Tests | ~0% | 40% |
| Critical Path | ~60% | 100% |

### Critical Tests Required

**Always test these after modifying `file-io-service.ts`:**
- Node label persistence
- Node color persistence
- Node position persistence
- **Edge label persistence** ⭐
- **Edge direction persistence** ⭐
- Snapshot isolation (no contamination)
- File round-trip (save/load cycle)

## Documentation

### User Documentation
- `README.md` - User-facing features and installation
- `ROADMAP.md` - Strategic product roadmap

### Developer Documentation
- `CLAUDE.md` - This file - Development guidelines for AI assistants
- `COMPREHENSIVE_EDITOR_SPECIFICATION.md` - Complete rebuild specification (v3.0.0)
- `docs/V2.5_REFACTOR_PLAN.md` - v2.5.0 architectural changes
- `docs/V2.5_QUICK_REFERENCE.md` - Developer quick reference
- `docs/V2.5_TESTING_GUIDE.md` - Testing procedures

### Testing & Quality
- `REGRESSION_TESTING_STRATEGY.md` - Comprehensive regression testing guidelines ⭐ NEW
- `EDGE_LABEL_TEST.md` - Edge label persistence testing procedure ⭐ NEW

### Architecture & Planning
- `docs/GRAPH_VIEW_ROADMAP.md` - Graph view feature roadmap
- `docs/WARDLEY_MAPPING_PLAN.md` - Wardley Mapping implementation plan

### Session Documentation (Historical)
- `SNAPSHOT_FIXES_IMPLEMENTED.md` - v2.5.1 snapshot isolation fixes
- `FILE_RENAME_BUG_FIXED.md` - File rename bug resolution
- `SNAPSHOT_SWITCHING_BUG_FIXED.md` - Snapshot switching fixes
- `V3.0.0_INTEGRATION_COMPLETE.md` - v3.0.0 migration documentation

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

---

## Critical Bug Fixes (v2.5.1)

### Snapshot Color Contamination (FIXED 2025-10-24)

**Problem:** Changing node colors in one snapshot contaminated other snapshots.

**Root Cause:** `splitNodesAndEdges` was updating snapshot-varying properties (label, color, description) in the shared `.bac4` file, which then became the fallback for other snapshots.

**Fix:** Modified `splitNodesAndEdges` to:
- Store snapshot-varying properties ONLY in `snapshot.nodeProperties`
- Update ONLY invariant properties (technology, team, knowledge, metrics) in shared `.bac4` file
- Prevent any contamination between snapshots

**Files Changed:** `src/services/file-io-service.ts` (lines 374-430)

**Testing:** See `SNAPSHOT_FIXES_IMPLEMENTED.md` for detailed test procedures

---

### Edge Label Persistence (FIXED 2025-10-24)

**Problem:** Edge label changes may not persist correctly after file reload.

**Root Cause:**
- Data duplication: `direction` stored in both `edge.properties` and `edge.style`
- Object spread ordering: `...edge.properties` could overwrite explicitly set values
- Confusion about which field contains which data

**Fix:** Modified edge save/load logic to:
- Extract `label`, `direction`, and `style` explicitly before spreading
- Store `direction` ONLY in `edge.style.direction`
- Store `label` and `style` (path style) ONLY in `edge.properties`
- Eliminate data duplication

**Files Changed:** `src/services/file-io-service.ts` (lines 336-363, 488-523)

**Testing:** See `EDGE_LABEL_TEST.md` and `REGRESSION_TESTING_STRATEGY.md`

---

## Prevention Strategy

**To prevent future regressions:**

1. **Always run tests before committing:**
   ```bash
   npm test && npm run typecheck && npm run build
   ```

2. **Follow the pre-commit checklist:** See `REGRESSION_TESTING_STRATEGY.md`

3. **Test file I/O after changes:** Any modification to `file-io-service.ts`, `splitNodesAndEdges`, or `mergeNodesAndLayout` requires full persistence testing

4. **Use the critical patterns:** Follow patterns #6 (Snapshot Isolation) and #7 (Edge Data Handling) exactly

5. **Reference regression strategy:** Before making changes, consult `REGRESSION_TESTING_STRATEGY.md` for impact analysis

**Key Principle:** No code changes without tests. Every feature must have unit tests, integration tests, and manual smoke tests.
