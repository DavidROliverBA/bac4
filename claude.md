# BAC4 Plugin - Claude Context Guide

## Project Overview

**BAC4** (Business Architecture for C4) is an Obsidian plugin for AI-native cloud architecture management. It extends the C4 model with cloud-specific component mappings and provides visual diagram editing capabilities.

## What is the C4 Model?

The C4 model is a hierarchical approach to software architecture diagrams:

1. **Context Diagrams (Level 1)** - System landscape
   - Shows: Systems and People (actors)
   - Purpose: High-level "what does this system do and who uses it?"
   - Nodes: System boxes, External Systems, Users/Actors

2. **Container Diagrams (Level 2)** - Zoom into one System
   - Shows: Applications, APIs, Databases, Services within a System
   - Purpose: "How is this system built at a high level?"
   - Nodes: Web App, Mobile App, API, Database, Message Queue

3. **Component Diagrams (Level 3)** - Zoom into one Container
   - Shows: Code components within a Container + deployment to cloud services
   - Purpose: "How is this container implemented?"
   - Nodes: Controllers, Services, Repositories + AWS/Azure/GCP services

## Core Features

### Canvas Editor
- Visual diagram editor using React Flow
- Drag & drop nodes from unified horizontal toolbar
- Create edges by dragging from node handles
- Double-click nodes to drill down to child diagrams
- Moveable property panel for editing node/edge properties
- Custom zoom controls (export-friendly, not captured in images)
- Auto-save to `.bac4` JSON files (1-second debounce)
- Export diagrams as PNG, JPEG, or SVG

### Unified Toolbar (Top)
All diagram controls consolidated in one horizontal bar:
- **Diagram Type Selector** - Switch between Context/Container/Component
- **Node Creation Buttons** - Add nodes appropriate for current diagram type
- **Diagram Actions** - Rename, Export (PNG/JPEG/SVG), Delete node
- Responsive layout with automatic wrapping
- **v0.6.0:** Breadcrumbs removed - use Obsidian's native back/forward navigation

### Hierarchical Navigation & Linking (v0.6.0)
- **Drill-down:** Double-click System → Container diagram, Container → Component diagram
- **Navigation Buttons:** Property Panel displays **− Parent** and **+ Child** buttons at the top
  - **− Parent** button: Navigate to parent diagram (Container/Component diagrams only)
  - **+ Child** button: Open child diagram (System/Container nodes with children only)
  - Buttons auto-show/hide based on hierarchy and node type
- **Property Panel Linking:** Select existing diagrams or create new ones from dropdown
  - System nodes → Link to Container diagrams (stored in `linkedDiagramPath`)
  - Container nodes → Link to Component diagrams (stored in `linkedDiagramPath`)
  - "[+ Create New...]" option auto-creates and links child diagrams
- **Warning Dialogs:** Prevent accidental link changes
- **Open Linked Diagram:** Direct navigation button in Property Panel dropdown
- **Embedded Links:** `linkedDiagramPath` and `linkedMarkdownPath` stored in node.data (v0.6.0)
- **Auto-Update:** File rename listener updates all references automatically (v0.6.0)
- **Navigation:** Use Obsidian's back/forward buttons - breadcrumbs removed (v0.6.0)

### Node Types
- `SystemNode` - For Context diagrams (systems, can link to Container diagrams)
- `PersonNode` - For Context diagrams (actors/users)
- `ContainerNode` - For Container diagrams (apps, services, databases, can link to Component diagrams)
- `CloudComponentNode` - For Component diagrams (AWS/cloud services)
- `C4Node` - Generic fallback

### Cloud Component Library
- AWS service library (Lambda, S3, DynamoDB, etc.)
- Drag & drop cloud components onto Component diagrams
- Moveable & resizable component palette (Component diagrams only)
- Cloud component nodes display Type badge (left) and Provider badge (right)
- Extensible to Azure and GCP

## Project Structure

```
bac4/
├── src/
│   ├── main.ts                          # Plugin entry point
│   ├── core/
│   │   ├── constants.ts                 # Constants and defaults
│   │   └── settings.ts                  # Plugin settings
│   ├── ui/
│   │   ├── canvas-view.tsx              # Main React Flow canvas
│   │   ├── settings-tab.ts              # Settings UI
│   │   ├── nodes/                       # Custom node components
│   │   │   ├── C4Node.tsx
│   │   │   ├── SystemNode.tsx
│   │   │   ├── PersonNode.tsx
│   │   │   ├── ContainerNode.tsx
│   │   │   └── CloudComponentNode.tsx
│   │   └── components/                  # UI components
│   │       ├── ComponentPalette.tsx     # Moveable/resizable cloud component palette
│   │       ├── PropertyPanel.tsx        # Moveable node/edge properties + diagram linking
│   │       ├── UnifiedToolbar.tsx       # Main toolbar with all controls (top)
│   │       ├── RenameModal.tsx          # Diagram rename dialog
│   │       └── DiagramTypeSwitchModal.tsx # Type change warning
│   ├── services/
│   │   ├── component-library-service.ts # Cloud component management
│   │   ├── diagram-navigation-service.ts # Drill-down/linking/relationships logic
│   │   └── markdown-link-service.ts # Markdown documentation with diagram screenshots (v0.8.0)
│   ├── types/
│   │   └── diagram-relationships.ts     # Types for diagram hierarchy
│   ├── edges/
│   │   └── DirectionalEdge.tsx          # Custom edge with arrows (→, ←, ↔)
│   └── data/
│       ├── file-io.ts                   # File reading/writing
│       └── project-structure.ts         # Project organization
├── component-library/                   # Cloud component definitions
│   ├── aws/
│   └── saas/
├── docs/                                # Documentation
│   ├── canvas-library-evaluation.md
│   ├── canvas-interactivity-fix-plan.md
│   └── c4-model-enhancement-plan.md
└── manifest.json                        # Obsidian plugin manifest
```

## Key Technical Details

### File Format (v0.6.0)

**Diagram Files** - Stored as `.bac4` JSON files with embedded metadata:
```json
{
  "version": "0.6.0",
  "metadata": {
    "diagramType": "context",
    "createdAt": "2025-10-14T10:30:00.000Z",
    "updatedAt": "2025-10-14T12:45:00.000Z"
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "system",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Payment System",
        "linkedDiagramPath": "diagrams/Payment System.bac4",  // v0.6.0: Embedded child link
        "linkedMarkdownPath": "docs/Payment System.md",       // v0.6.0: Embedded doc link
        "color": "#4A90E2",
        "description": "..."
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "directional",
      "data": {
        "label": "uses",
        "direction": "right"
      }
    }
  ]
}
```

**Key v0.6.0 Changes:**
- ✅ **Self-contained diagrams** - Version, metadata, and links embedded in .bac4 files
- ✅ **Node-level linking** - `linkedDiagramPath` and `linkedMarkdownPath` stored in node.data
- ✅ **Auto-updating references** - File rename listener updates all references automatically
- ✅ **Unified navigation** - Double-click priority: linkedDiagramPath → linkedMarkdownPath → drill-down
- ⚠️ **Breadcrumbs removed** - Use Obsidian's native back/forward navigation instead

**Relationships File** - `diagram-relationships.json` in vault root (legacy support for hierarchy queries):
```json
{
  "version": "1.0.0",
  "diagrams": [
    {
      "id": "diagram-123",
      "filePath": "Context.bac4",
      "displayName": "Context",
      "type": "context",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "relationships": [
    {
      "parentDiagramId": "diagram-123",
      "childDiagramId": "diagram-456",
      "parentNodeId": "node-1",
      "parentNodeLabel": "Payment System",
      "createdAt": "..."
    }
  ],
  "updatedAt": "..."
}
```
**Note:** diagram-relationships.json provides global hierarchy view for navigation service queries, but primary links are now embedded in .bac4 files via `linkedDiagramPath`.

### React Flow Integration
- Uses `ReactFlowProvider` wrapper (required for Zustand state management)
- Custom node types registered in `nodeTypes` object
- Drag & drop via `onDrop`, `onDragOver` handlers
- Auto-save with 1-second debounce
- **CRITICAL:** Each `<Background>` component MUST have unique `id` prop when multiple tabs open

### Obsidian Integration
- Registers custom view type: `VIEW_TYPE_CANVAS = 'bac4-canvas'`
- Registers `.bac4` file extension
- Prevents duplicate tabs for same file
- Uses Obsidian's file system API for reading/writing

## Development Workflow

### Building
```bash
npm install          # Install dependencies
npm run dev          # Development build with watch mode
npm run build        # Production build
```

### Testing
```bash
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Code Quality
```bash
npm run lint         # Lint TypeScript
npm run format       # Format with Prettier
npm run fix          # Format + lint fix
npm run typecheck    # TypeScript type checking
```

### Installing in Obsidian
1. Build the plugin: `npm run build`
2. Symlink to vault: `ln -s /path/to/bac4 /path/to/vault/.obsidian/plugins/bac4`
3. Enable in Obsidian: Settings → Community Plugins → Enable "BAC4"

## Current Status

### ✅ Completed Features (v0.6.0 - Latest)

**v0.6.0 - Self-Contained Diagrams & File Format Overhaul** 🎉
- **New File Format**
  - Version metadata embedded in .bac4 files
  - Self-contained diagram files with createdAt/updatedAt timestamps
  - Diagram type stored in metadata
- **Embedded Linking**
  - linkedDiagramPath stored in node.data (replaces external relationships for nodes)
  - linkedMarkdownPath for documentation links
  - Auto-validation and cleanup of broken links on load
- **Auto-Updating References**
  - vault.on('rename') listener tracks file renames
  - All .bac4 files automatically updated when linked files are renamed
  - Metadata updatedAt timestamp refreshed on reference updates
- **Unified Navigation**
  - Priority-based double-click: linkedDiagramPath → linkedMarkdownPath → drill-down → info
  - Simplified navigation logic
- **Breadcrumbs Removed**
  - Use Obsidian's native back/forward navigation instead
  - Reduced UI clutter
  - Better integration with Obsidian's built-in navigation

**v0.5.0 - Enhanced UI Controls & Cloud Component Management** 🎉
- **Moveable & Resizable Panels**
  - Component Palette is draggable and resizable (Component diagrams only)
  - Property Panel is draggable (all diagram types)
  - Smooth drag experience with grab cursor
- **Enhanced Cloud Component Nodes**
  - Type badge on left (EC2, Lambda, Fargate, etc.)
  - Provider badge on right (AWS, Azure, GCP, SaaS)
  - Symmetrical badge layout with matching colors
  - Read-only metadata fields (Type, Provider, Category)
- **Larger Container Nodes**
  - 75% size increase (160-240px width, from 90-130px)
  - Better visibility for complex diagrams
  - Folder badge removed for cleaner appearance
- **Custom Zoom Controls**
  - Export-friendly (not captured in PNG/JPEG/SVG)
  - Bottom-right positioning
  - Zoom In (+), Zoom Out (−), Fit View (⊡)
- **Simplified Icon Selector**
  - Single searchable list (48 icons)
  - Category system removed
- **Taller Property Panel**
  - 800px height (doubled from 400px)
  - See more properties without scrolling

**v0.2.0 - MCP Integration Phase 1** ✅
- **MCPService** class with AI-powered diagram generation interface
- **Description Modal** for natural language architecture input
- **Three generation commands:**
  - Generate Context Diagram from Description
  - Generate Container Diagram from Description
  - Generate Component Diagram from Description
- **MCP Settings** with enabled/autoValidate/autoSuggest toggles
- **Complete UI workflow** from command palette → modal → diagram creation
- **Graceful fallback** to empty diagrams (MCP protocol integration Phase 2)
- **Status:** UI & infrastructure ready, MCP communication stubbed
- **Docs:** `docs/MCP_INTEGRATION_STATUS.md`, `docs/MCP_INTEGRATION_PLAN.md`

### ✅ Completed Features (Sprint 1.2 - v0.1.0-v0.4.0)

#### **Core Features**
- **Canvas Editor**
  - React Flow canvas integration
  - Full interactivity (drag, click, connect, pan, zoom)
  - Auto-save with 1-second debounce (performance optimized)
  - Duplicate tab prevention

- **Unified Toolbar**
  - Consolidated all controls in one horizontal bar
  - Diagram type selector (Context/Container/Component)
  - Node creation buttons (context-aware for each diagram type)
  - Breadcrumb navigation (removed in v0.6.0 - use Obsidian's native back/forward)
  - Rename diagram button
  - Export menu (PNG, JPEG, SVG)
  - Delete node button (context-aware, only enabled when node selected)

- **Hierarchical Navigation & Linking**
  - Double-click nodes to drill down (System→Container, Container→Component)
  - Property Panel dropdown to link to existing diagrams
  - "[+ Create New...]" option to auto-create and link child diagrams
  - Warning dialogs before overwriting links
  - "Open Linked Diagram" button in Property Panel
  - Breadcrumb navigation showing full hierarchy (removed in v0.6.0)
  - `diagram-relationships.json` central registry
  - **v0.6.0:** Links embedded in node.data via linkedDiagramPath/linkedMarkdownPath

- **Property Panel**
  - **Navigation buttons** at top: **− Parent** and **+ Child** for quick hierarchy navigation
  - Node/edge property editing
  - Edge label quick-select (uses, depends on, calls, etc.)
  - Directional edges (→, ←, ↔)
  - Color customization with presets
  - Diagram linking dropdowns (for System and Container nodes)
  - **Performance:** React.memo optimizations on form components

- **Node Types**
  - SystemNode (Context diagrams, can drill down)
  - PersonNode (Context diagrams)
  - ContainerNode (Container diagrams, can drill down)
  - CloudComponentNode (Component diagrams, AWS services)
  - C4Node (generic fallback)

- **Export & File Management**
  - Export to PNG (high quality, lossless)
  - Export to JPEG (smaller size, compressed)
  - Export to SVG (vector, scalable)
  - Exports only diagram content (excludes UI controls)
  - Auto-naming based on diagram file name

---

### ✅ Completed Refactoring Phases (Phases 1-4)

**Phase 1: Foundation & Structural Improvements** ✅
- Constants extraction (ui-constants, timing-constants, validation-constants, export-constants)
- Error handling standardization (ErrorHandler, DiagramError)
- Template components created (FormField, FormSection, ColorPicker)
- Service layer architecture established

**Phase 2: Structural Refactoring** ✅
- Component decomposition (PropertyPanel → FormField + FormSection + ColorPicker + etc.)
- Code organization improvements
- Separation of concerns (UI vs business logic)
- File size reductions

**Phase 3: Pattern Standardization** ✅
- Consistent naming conventions
- TypeScript strict mode enforcement
- Code style consistency
- Documentation improvements

**Phase 4: Advanced Improvements** ✅ **COMPLETE** (2025-10-12)
- **4.1 Testing Infrastructure** ✅
  - 104 passing tests (16 error-handling + 17 auto-naming + 43 canvas-utils + 28 existing)
  - Coverage: 29.65% overall, 100% on critical utilities
  - Enhanced Obsidian mocks (Notice, Modal, Menu)
  - Test files:
    - `tests/utils/error-handling.test.ts`
    - `tests/ui/canvas/utils/auto-naming.test.ts`
    - `tests/ui/canvas/utils/canvas-utils.test.ts`

- **4.2 Performance Optimization** ✅
  - React.memo on 3 pure components (FormField, FormSection, ColorPicker)
  - ~60% reduction in unnecessary re-renders
  - Auto-save debouncing (1000ms)
  - useCallback optimizations throughout
  - Documentation: `docs/performance-optimizations.md`

- **4.3 Accessibility** ✅
  - WCAG 2.1 AA compliance documented
  - Keyboard navigation verified
  - Screen reader support considerations
  - ARIA labels on interactive elements
  - Focus indicators
  - Documentation: `docs/accessibility.md`

**Total Time Saved:** 67% efficiency improvement through focused approach
**Phase 4 Summary:** `docs/phase-4-completion-summary.md`

---

### 📋 Remaining Refactoring Phases (Next Steps)

**Phase 5: Documentation & Developer Experience** 📝 IN PROGRESS
- Create developer guides:
  - `docs/guides/adding-node-types.md`
  - `docs/guides/adding-diagram-types.md`
  - `docs/guides/adding-cloud-providers.md`
- Add AI extension markers (`<AI_MODIFIABLE>` tags) to ~20 locations
- Create contribution guide (`CONTRIBUTING.md`)
- Add architectural decision records (ADRs)
- Estimated: 6-8 hours

**Phase 6: Technical Debt Resolution** 🔧 PLANNED
- Remove dead code (DiagramToolbar.tsx, unused components?)
- Update dependencies (React Flow, TypeScript, React)
- Configuration consolidation (create `config/` directory)
- Final cleanup and optimization
- Estimated: 6-8 hours

---

### 🧪 Test Coverage Status

| Category | Coverage | Status |
|----------|----------|--------|
| **Overall** | 29.65% | ✅ Solid foundation |
| **Data utilities** | 94.39% | ✅ Excellent |
| **Error handling** | 100% | ✅ Complete |
| **Auto-naming** | 100% | ✅ Complete |
| **Canvas utilities** | 100% | ✅ Complete |
| **Services** | 0% | ⏳ Deferred (complex mocking) |
| **Components** | 0% | ⏳ Deferred (TSX excluded) |

**Target for Services:** 70% coverage (incrementally add as services evolve)

---

### ⚡ Performance Metrics

| Operation | Time | Status |
|-----------|------|--------|
| Open diagram | <500ms | ✅ Fast |
| Add node | <16ms | ✅ Instant |
| Connect nodes | <32ms | ✅ Smooth |
| Auto-save | 1000ms (debounced) | ✅ Optimized |
| Export PNG | ~2s | ✅ Acceptable |
| Select node | <16ms | ✅ Instant |
| Property update | <16ms | ✅ Instant (memoized) |

**Re-render Optimization:** ~60% reduction in unnecessary re-renders (React.memo on pure components)

---

### ♿ Accessibility Status

- ✅ **WCAG 2.1 AA Compliant** (via Obsidian themes)
- ✅ **Keyboard Navigation:** Tab, Arrow keys, shortcuts
- ✅ **Semantic HTML:** Proper labels, buttons, inputs
- ✅ **ARIA Labels:** Interactive elements properly labeled
- ✅ **Focus Indicators:** Visible focus states
- ✅ **Screen Reader:** Considerations documented
- ⚠️ **Known Limitation:** Canvas is primarily mouse-driven (React Flow limitation)
- 💡 **Future:** Keyboard-first mode, diagram list view for screen readers

**Full Guide:** `docs/accessibility.md`

## Common Tasks

### 📌 AI Extension Points

**The plugin has 7 marked extension points for safe additions:**

All extension points are marked with `<AI_MODIFIABLE>` tags in the source code.

**Quick Reference:**
- **Node Types:** `canvas-view.tsx:55` - Register custom node components
- **Edge Types:** `canvas-view.tsx:67` - Register custom edge components
- **Cloud Providers:** `component-library/index.ts:12` - Add Azure, GCP, etc.
- **Diagram Types:** `validation-constants.ts:92` - Extend C4 hierarchy
- **Node Creation Tools:** `NodeCreationButtons.tsx:27` - Add toolbar buttons
- **Edge Labels:** `validation-constants.ts:135` - Add relationship presets
- **Container Types:** `validation-constants.ts:151` - Add container categories
- **Color Presets:** `ui-constants.ts:184` - Add node color options

**📖 Complete Guide:** See `docs/AI_EXTENSION_POINTS.md` for detailed instructions with code examples, related files, and testing procedures for each extension point.

### Adding a New Node Type
1. Create `src/ui/nodes/NewNode.tsx` with component
2. Export type and data interface
3. Register in `nodeTypes` object in `canvas-view.tsx` (marked with `<AI_MODIFIABLE>`)
4. Add to appropriate diagram type in `NodeCreationButtons.tsx` getTools() function

### Adding a Cloud Provider
1. Create `component-library/azure/` or `component-library/gcp/`
2. Add component definitions JSON following AWS pattern
3. Update `componentLibraries` array in `component-library/index.ts` (marked with `<AI_MODIFIABLE>`)
4. Add icons/assets

### Modifying Canvas Behavior
- Edit `src/ui/canvas-view.tsx`
- React Flow event handlers: `onConnect`, `onNodeClick`, `onNodeDoubleClick`, etc.
- State management uses React hooks: `useNodesState`, `useEdgesState`

## Key Dependencies

- `obsidian` - Obsidian plugin API
- `react` / `react-dom` - UI framework
- `reactflow` (XyFlow) - Canvas/diagram library
- `html-to-image` - Export diagrams to PNG/JPEG/SVG
- `typescript` - Type safety
- `esbuild` - Bundler
- `jest` / `ts-jest` - Testing

## Troubleshooting

### Canvas not interactive
- Check browser console for React Flow errors
- Verify container has explicit width/height
- Check for CSS `pointer-events: none` conflicts
- See `docs/canvas-interactivity-fix-plan.md`

### Duplicate tabs opening
- Check `main.ts` file-open event handler
- Verify `onLoadFile` duplicate detection in `canvas-view.tsx`

### Auto-save not working
- Check filePath is set correctly
- Verify debounce timeout (1 second)
- Check browser console for save errors

### ⚠️ CRITICAL: Background Dots / Arrows Missing with Multiple Tabs Open

**Problem:** First diagram tab renders correctly (dots + arrows), but opening a second tab causes it to lose background dots and arrows.

**Root Cause:** React Flow's `<Background>` component uses SVG patterns with IDs. When multiple React Flow instances exist on the same page WITHOUT unique IDs, the SVG pattern definitions conflict - the second instance overwrites the first instance's pattern, causing the first to stop rendering.

**The Fix:** Add unique `id` prop to Background component based on file path:

```typescript
// src/ui/canvas-view.tsx - CanvasEditor component
<ReactFlow ...>
  <Background
    id={filePath ? `bg-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'bg-default'}
    variant={BackgroundVariant.Dots}
    gap={12}
    size={1}
  />
</ReactFlow>
```

**Why This Works:**
- Each diagram file gets a unique Background ID: `bg-BAC4-Context-bac4`, `bg-BAC4-Container-1-bac4`, etc.
- SVG patterns no longer conflict between tabs
- All tabs render independently without interfering

**DO NOT:**
- ❌ Remove `ReactFlowProvider` (required for Zustand state management)
- ❌ Use the same Background ID across multiple instances
- ❌ Omit the `id` prop when multiple tabs might be open

**ALWAYS:**
- ✅ Include unique `id` prop on `<Background>` component
- ✅ Base ID on file path or other unique identifier
- ✅ Sanitize file path to create valid HTML/SVG ID (alphanumeric + hyphens)
- ✅ Test with 2-3 tabs open simultaneously

**Reference:**
- React Flow docs: https://reactflow.dev/api-reference/components/background
- GitHub issue: https://github.com/wbkd/react-flow/issues/1037

### ⚠️ CRITICAL: Edge Arrows Not Displaying (React Flow 11 Issue)

**Problem:** Arrows work on new edges but disappear after file save/reload, or don't work at all on certain diagram types.

**Root Cause:** React Flow 11 has an **inconsistent marker serialization issue**. When edges are saved to JSON:
- `MarkerType.ArrowClosed` enum → serializes as string `"arrowclosed"` (lowercase)
- On reload, React Flow may not properly recognize the lowercase string value
- Background dots also disappearing indicates React Flow isn't rendering properly

**GitHub Issue Reference:**
https://github.com/xyflow/xyflow/issues/5411 - Inconsistent typing for EdgeMarker.type after toObject() serialization

**The Fix - Two-Part Solution:**

#### Part 1: Ensure Markers Always Use MarkerType Enum
```typescript
// src/ui/canvas/utils/canvas-utils.ts
import { MarkerType } from 'reactflow';

export function getEdgeMarkers(direction: 'right' | 'left' | 'both') {
  const arrow = {
    type: MarkerType.ArrowClosed,  // ← MUST use enum, not string
    width: 20,   // ← MUST be explicit (defaults to 0!)
    height: 20,  // ← MUST be explicit (defaults to 0!)
    color: '#888888',
  };
  // ... return based on direction
}
```

#### Part 2: Always Regenerate Markers When Loading Files
```typescript
// src/ui/canvas/utils/canvas-utils.ts
export function normalizeEdges(edges: Edge[]): Edge<EdgeData>[] {
  return edges.map((edge) => {
    const direction = (edge.data?.direction || 'right') as 'right' | 'left' | 'both';
    const markers = getEdgeMarkers(direction); // ← Regenerate markers

    return {
      ...edge,
      type: edge.type || 'directional',
      ...markers,  // ← Overwrite any saved markers
      data: {
        label: edge.data?.label || (edge as any).label || 'uses',
        direction,
        ...edge.data,
      },
    };
  });
}
```

**Why This Works:**
1. **On Save:** React Flow serializes `MarkerType.ArrowClosed` → `"arrowclosed"` string (can't prevent this)
2. **On Load:** `normalizeEdges()` **ignores** the saved lowercase string and regenerates proper enum values
3. **Fresh Markers:** Every edge gets fresh `MarkerType.ArrowClosed` enum values, not deserialized strings

**DO NOT:**
- ❌ Try to "fix" the saved JSON files manually
- ❌ Use string literals `type: 'arrowclosed'` in code
- ❌ Skip calling `normalizeEdges()` when loading edges
- ❌ Assume saved marker values will work after deserialization

**ALWAYS:**
- ✅ Use `MarkerType.ArrowClosed` enum in code
- ✅ Include explicit `width` and `height` (defaults to 0!)
- ✅ Call `normalizeEdges()` on **every** edge load operation
- ✅ Regenerate markers from `edge.data.direction` property

**Alternative Solution (If Issue Persists):**
If React Flow 11 continues to have issues, consider:
1. **Upgrade to React Flow 12+** (may have fixes)
2. **Switch to XYFlow** (React Flow's new name/version)
3. **Use a different canvas library** (Konva.js, Fabric.js, or plain SVG)

**Known Limitation:**
React Flow 11's marker serialization is fundamentally broken. This workaround regenerates markers on every load, which works but adds overhead. Monitor React Flow issues for official fixes.

## Future Vision

- **Planned vs. Actual Tracking** - Compare designed architecture with deployed reality
- **Estate Dashboard** - Portfolio view across all projects
- **AI-Assisted Architecture** - Generate diagrams via Model Context Protocol (MCP)
- **Architectural Drift Detection** - Alert when implementation diverges from design
- **Multi-cloud Support** - Full Azure and GCP libraries

## Git Workflow

- Branch: `main`
- Recent commits focus on canvas functionality and component library
- All changes should be committed with descriptive messages
- File changes stored as markdown/JSON for easy diffing

---

## 🎯 Coding Standards & Best Practices

### Component Size Policy 🚨 CRITICAL

**Hard Limits (MUST be enforced):**
- Files MUST NOT exceed 500 lines → Refactor immediately
- Files SHOULD NOT exceed 300 lines → Plan refactoring
- Functions SHOULD NOT exceed 50 lines → Extract helpers
- React components SHOULD NOT exceed 200 lines → Extract child components

**When a file exceeds 300 lines:**
1. 🛑 **Stop** adding features to that file
2. 🔍 **Identify** repeated patterns (forms, buttons, sections)
3. 🔨 **Extract** to reusable components
4. ✅ **Apply** constants during extraction
5. 📝 **Document** with JSDoc

**Current Tech Debt:**
- `PropertyPanel.tsx` (774 lines) - 🚨 NEEDS DECOMPOSITION
  - Target components: `<FormField>`, `<FormSection>`, `<ColorPicker>`, `<DiagramLinking>`
  - Has 15+ repeated form input patterns
  - Mixing 8+ responsibilities (node editing, edge editing, color picking, linking, etc.)

### React Component Principles

**Separation of Concerns:**
```typescript
// ✅ GOOD: Clear separation
// Presentational component
export const NodeEditor: React.FC<Props> = ({ node, onUpdate }) => {
  return <FormField label="Name" value={node.name} onChange={onUpdate} />;
};

// Business logic in service
class DiagramService {
  async updateNode(id: string, data: NodeData): Promise<void> {
    // File operations, validation, relationship updates
  }
}

// ❌ BAD: Mixed concerns
export const NodeEditor: React.FC<Props> = ({ node }) => {
  const handleSave = async () => {
    // Business logic in component - WRONG
    const content = JSON.stringify(node);
    await plugin.app.vault.adapter.write(path, content);
    // More complex operations...
  };
  return <div>...</div>;
};
```

**Rule of Three - Extract Repeated Patterns:**
```typescript
// ❌ BAD: Repeated 15+ times in PropertyPanel.tsx
<div style={{ marginBottom: '16px' }}>
  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
    Label
  </label>
  <input
    type="text"
    value={value}
    onChange={onChange}
    style={{ padding: '6px 8px', fontSize: '11px' }}
  />
</div>

// ✅ GOOD: Extract to reusable component
<FormField label="Label" value={value} onChange={onChange} />

// FormField.tsx (~40 lines, reusable across PropertyPanel)
import { SPACING, FONT_SIZES, UI_COLORS } from '../../constants';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label, value, onChange, placeholder
}) => (
  <div style={{ marginBottom: SPACING.gap.wide }}>
    <label style={{
      display: 'block',
      fontSize: FONT_SIZES.small,
      fontWeight: 600,
      color: UI_COLORS.textMuted,
      marginBottom: SPACING.gap.tiny,
      textTransform: 'uppercase',
    }}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: SPACING.padding.input,
        borderRadius: BORDER_RADIUS.normal,
        border: `1px solid ${UI_COLORS.border}`,
        background: UI_COLORS.backgroundSecondary,
        color: UI_COLORS.textNormal,
        fontSize: FONT_SIZES.small,
      }}
    />
  </div>
);
```

**If you see a pattern 3+ times, extract it to a component!**

### Constants Usage (Strictly Enforced)

**ALWAYS import from constants, NEVER use inline values:**
```typescript
// ✅ GOOD
import { SPACING, FONT_SIZES, UI_COLORS, AUTO_SAVE_DEBOUNCE_MS } from '../../constants';

style={{
  padding: SPACING.padding.input,
  fontSize: FONT_SIZES.small,
  color: UI_COLORS.textNormal,
}}

setTimeout(save, AUTO_SAVE_DEBOUNCE_MS);

// ❌ BAD (Will be caught in code review)
style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-normal)' }}
setTimeout(save, 1000);
```

**When to add a new constant:**
- Value is used 2+ times across different files
- Value represents a design token (color, spacing, font size, timing)
- Value might need configuration/adjustment later
- Value is a "magic number" that needs explanation

**Constants are organized in:**
- `src/constants/ui-constants.ts` - Spacing, colors, fonts, dimensions
- `src/constants/timing-constants.ts` - Debounce delays, timeouts
- `src/constants/validation-constants.ts` - Limits, types, validation rules
- `src/constants/export-constants.ts` - Export configurations

### Service Layer Architecture

**Services contain business logic, React components handle UI:**
```typescript
// ✅ GOOD: Clear boundaries
// Service handles all business logic
class DiagramNavigationService {
  /**
   * Creates and links a child diagram
   * Handles: file creation, relationship tracking, validation
   */
  async createChildDiagram(
    parentPath: string,
    nodeId: string,
    nodeLabel: string,
    parentType: 'context' | 'container',
    childType: 'container' | 'component'
  ): Promise<string> {
    // Complex business logic here
    // File operations, relationship management, validation
    return childPath;
  }
}

// Component orchestrates services
const handleDrillDown = async (node: Node) => {
  try {
    const childPath = await navigationService.createChildDiagram(
      filePath, node.id, node.data.label, diagramType, childType
    );
    await plugin.openCanvasViewInNewTab(childPath);
  } catch (error) {
    console.error('Drill-down failed:', error);
    alert('Cannot create child diagram');
  }
};

// ❌ BAD: Business logic in component
const handleDrillDown = async (node: Node) => {
  // All this logic should be in a service!
  const childName = sanitizeName(node.data.label);
  const childPath = `${parentDir}/${childName}.bac4`;

  // Check if exists
  if (await vault.adapter.exists(childPath)) {
    // ... complex validation
  }

  // Create file
  const content = JSON.stringify({ nodes: [], edges: [] });
  await vault.adapter.write(childPath, content);

  // Update relationships file
  const relationships = await vault.adapter.read('diagram-relationships.json');
  // ... complex relationship logic

  // This is all business logic that belongs in a service!
};
```

**Service responsibilities:**
- File I/O operations
- Data validation and sanitization
- Relationship management
- Complex business rules
- Error handling and recovery

**Component responsibilities:**
- Rendering UI
- Handling user interactions
- Orchestrating services
- Managing local UI state
- Displaying feedback to users

### MarkdownLinkService - Documentation & Diagram Screenshots (v0.8.0)

**File:** `/src/services/markdown-link-service.ts`

The MarkdownLinkService handles all markdown documentation linking and automatic diagram screenshot functionality. In v0.8.0, it was enhanced to automatically export diagrams as PNG images when creating markdown files.

#### Core Methods

**1. `exportDiagramAsPng(): Promise<string>`** (Static method)
- **Purpose:** Export the current React Flow diagram as a PNG image
- **Returns:** Base64 data URL of the exported PNG
- **Features:**
  - Smart React Flow readiness detection
  - Retry mechanism (up to 5 attempts, 500ms delay)
  - Checks for both valid dimensions AND internal nodes container
  - Re-queries DOM on each retry (handles React re-renders)
  - Total wait time: up to 2.5 seconds
- **Throws:** Error if diagram container not found or export fails after retries

**Implementation Detail - React Flow Readiness Detection:**
```typescript
// Wait for React Flow to be fully ready
let reactFlow = document.querySelector('.react-flow') as HTMLElement;
let nodesContainer = document.querySelector('.react-flow__nodes');
let attempts = 0;
const maxAttempts = 5;
const delayMs = 500;

while (attempts < maxAttempts) {
  // Re-query DOM on each retry (handles React re-renders)
  reactFlow = document.querySelector('.react-flow') as HTMLElement;
  if (!reactFlow) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempts++;
    continue;
  }

  rect = reactFlow.getBoundingClientRect();
  nodesContainer = document.querySelector('.react-flow__nodes');

  // Check both dimensions AND internal nodes container
  const hasDimensions = rect.width > 0 && rect.height > 0;
  const hasNodesContainer = nodesContainer !== null;

  if (hasDimensions && hasNodesContainer) {
    console.log(`BAC4: React Flow ready after ${attempts} retries`);
    break;
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  attempts++;
}

// Export using html-to-image library
const exportOptions = getExportOptions('png');
const dataUrl = await toPng(reactFlow, exportOptions);
```

**Why This Works:**
- Checking `.react-flow__nodes` provides a better signal that React Flow is fully initialized
- Re-querying DOM on each retry handles React re-renders that temporarily set dimensions to zero
- Multiple retries with delays allow React Flow to stabilize after UI updates (modal opens, PropertyPanel updates, etc.)

**2. `saveDiagramImage(vault, imagePath, dataUrl): Promise<TFile>`** (Static method)
- **Purpose:** Save a base64 PNG data URL to the vault as a binary file
- **Parameters:**
  - `vault: Vault` - Obsidian vault instance
  - `imagePath: string` - Absolute path where image should be saved
  - `dataUrl: string` - Base64 data URL from exportDiagramAsPng()
- **Returns:** The created or updated TFile
- **Features:**
  - Converts base64 data URL to binary ArrayBuffer
  - Creates new file if it doesn't exist
  - Updates existing file if it does exist (preserves single image)
  - Uses Obsidian's vault API (createBinary/modifyBinary)

**3. `createMarkdownFileWithImage(vault, filePath, nodeLabel, nodeType, diagramType): Promise<{ markdownFile: TFile; imageFile: TFile | null }>`** (Static method)
- **Purpose:** Create a markdown file with an automatically embedded diagram screenshot
- **Parameters:**
  - `vault: Vault` - Obsidian vault instance
  - `filePath: string` - Path for the markdown file (e.g., "docs/System_1.md")
  - `nodeLabel: string` - Label of the node being documented
  - `nodeType: string` - Type of node (system, container, cloud-component)
  - `diagramType: 'context' | 'container' | 'component'` - Current diagram level
- **Returns:** Object with both markdownFile and imageFile (imageFile may be null if export fails)
- **Features:**
  - Exports diagram as PNG automatically
  - Saves PNG to same folder as markdown file
  - Generates markdown content with image reference
  - Creates markdown file with template
  - **Graceful fallback:** If image export fails, still creates markdown file
  - Shows appropriate success/warning messages to user

**Example Generated Markdown:**
```markdown
# System 1

*Created: 2025-10-15*

## System 1 - Context Diagram

![[System_1.png]]

## Overview

Add documentation for this System node here...

## Description

...
```

**Heading Format:** `## [Node Label] - [Diagram Type] Diagram`
- Diagram type is capitalized: "Context", "Container", or "Component"
- Image reference uses Obsidian wiki-link format: `![[filename.png]]`

**4. `updateDiagramImage(vault, markdownPath): Promise<TFile | null>`** (Static method)
- **Purpose:** Re-export diagram and update the existing image file
- **Parameters:**
  - `vault: Vault` - Obsidian vault instance
  - `markdownPath: string` - Path to the markdown file (image path derived from this)
- **Returns:** The updated image TFile
- **Features:**
  - Re-exports current diagram state as PNG
  - Replaces existing image file (no duplication)
  - Preserves markdown content (only updates image)
  - Used by "Update Image" button in PropertyPanel

**5. `getMarkdownTemplateWithImage(nodeLabel, nodeType, diagramType, imageName): string`** (Private method)
- **Purpose:** Generate markdown template with embedded image
- **Features:**
  - Adds heading: `## [Node Label] - [Diagram Type] Diagram`
  - Embeds image with: `![[imageName]]`
  - Inserts image section after heading and timestamp
  - Includes placeholder sections (Overview, Description, etc.)

#### Integration Points

**useNodeHandlers.ts:**
```typescript
// Updated createAndLinkMarkdownFile to use new service method
const result = await MarkdownLinkService.createMarkdownFileWithImage(
  plugin.app.vault,
  filePath,
  node.data.label,
  node.type || 'generic',
  diagramType  // Current diagram type
);

// New updateMarkdownImage callback
const updateMarkdownImage = React.useCallback(
  async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.data.linkedMarkdownPath) {
      ErrorHandler.showInfo('No linked markdown file to update image for');
      return;
    }

    try {
      await MarkdownLinkService.updateDiagramImage(
        plugin.app.vault,
        node.data.linkedMarkdownPath
      );
      ErrorHandler.showSuccess('Diagram image updated successfully');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to update diagram image');
    }
  },
  [nodes, plugin]
);
```

**PropertyPanel.tsx:**
```typescript
// Three-button workflow when markdown file exists
<button onClick={handleOpenMarkdownFile}>📄 Open File</button>
<button onClick={handleUpdateMarkdownImage}>🔄 Update Image</button>
<button onClick={handleUnlinkMarkdownFile}>❌ Unlink</button>
```

#### Error Handling & Edge Cases

**Graceful Fallback:**
- If diagram export fails (dimensions issue, rendering problem), markdown file is still created
- User sees warning: "Markdown file created (image export failed)"
- Markdown content is generated without image embed

**Common Failure Scenarios:**
1. **React Flow not ready:** Retry mechanism handles this (up to 2.5 seconds)
2. **Zero dimensions during UI transitions:** Re-querying DOM on each retry solves this
3. **Component Palette rendering time:** Retry mechanism provides sufficient wait time
4. **No linked markdown file:** `updateMarkdownImage()` shows info message, doesn't throw

**Logging:**
- Detailed console logs for debugging: `BAC4: React Flow ready after ${attempts} retries`
- Logs dimension checks: `BAC4: Waiting (attempt ${n}/${maxAttempts})`
- Success confirmations: `BAC4: ✅ Markdown file created`, `BAC4: ✅ Diagram image updated`

#### Usage Examples

**Creating Markdown with Screenshot:**
```typescript
// From node handler
const result = await MarkdownLinkService.createMarkdownFileWithImage(
  plugin.app.vault,
  'docs/Payment System.md',
  'Payment System',
  'system',
  'context'
);

// Result contains:
// - markdownFile: TFile (always present)
// - imageFile: TFile | null (null if export failed)
```

**Updating Existing Screenshot:**
```typescript
// From PropertyPanel "Update Image" button
await MarkdownLinkService.updateDiagramImage(
  plugin.app.vault,
  'docs/Payment System.md'
);
// Updates docs/Payment System.png with current diagram state
```

**Opening Linked Markdown:**
```typescript
// Existing functionality (unchanged)
await MarkdownLinkService.openMarkdownFile(
  plugin.app.workspace,
  plugin.app.vault,
  'docs/Payment System.md',
  false  // openInNewTab
);
```

#### Dependencies

**Required Libraries:**
- `html-to-image` - PNG export via `toPng()` function (already a dependency)
- `obsidian` - Vault API for file operations
- Existing export utilities from `useExport.ts` (getExportOptions)

**No New Dependencies Required!**

#### Performance Considerations

**Export Timing:**
- Retry mechanism adds up to 2.5 seconds max wait time
- Most exports succeed on first or second attempt (<1 second)
- Component diagrams may need 2-3 attempts (ComponentPalette rendering time)
- Context diagrams typically succeed on first attempt

**Bundle Size Impact:**
- No new dependencies added
- Reuses existing html-to-image library
- Service methods are lightweight (~210 lines total)

**User Experience:**
- Export happens in background while PropertyPanel updates
- User sees success notification when complete
- Markdown file opens immediately (doesn't wait for image)

#### Future Enhancements (v0.9.0+)

Possible improvements:
- Auto-update image on diagram changes (optional setting)
- Multiple image formats (SVG for vector)
- Image versioning (keep history of diagrams)
- Batch update all markdown images in project
- Custom image placement in template
- Image compression settings
- Dark mode aware exports

#### Breaking Changes

**None.** This is a purely additive feature in v0.8.0.
- Old `createMarkdownFile()` method still exists and works
- New `createMarkdownFileWithImage()` is separate method
- Graceful fallback if image export fails
- No changes to file format or data structure

### TypeScript Standards (Strict Mode)

**No `any` types - use proper interfaces:**
```typescript
// ✅ GOOD: Properly typed
interface NodeData {
  label: string;
  color?: string;
  description?: string;
}

const updateNode = (id: string, data: Partial<NodeData>): void => {
  setNodes((nds) => nds.map((n) =>
    n.id === id ? { ...n, data: { ...n.data, ...data } } : n
  ));
};

// ❌ BAD: Using `any` as an escape hatch
const updateNode = (id: string, data: any): void => { ... };
const node = nodeArray as any; // Unsafe cast
```

**Use type guards for runtime validation:**
```typescript
// ✅ GOOD: Type guard with runtime check
import { DIAGRAM_TYPES, DiagramType } from './constants';

function isValidDiagramType(value: unknown): value is DiagramType {
  return typeof value === 'string' &&
         DIAGRAM_TYPES.includes(value as DiagramType);
}

// Usage
if (isValidDiagramType(input)) {
  setDiagramType(input); // TypeScript knows it's safe
} else {
  console.error('Invalid diagram type:', input);
}

// ❌ BAD: Unsafe cast
const type = input as DiagramType; // No runtime validation!
setDiagramType(type); // Could crash if input is invalid
```

### JSDoc for AI-Friendliness

**Document INTENT and USAGE, not implementation details:**
```typescript
/**
 * Creates a child diagram linked to a parent node
 *
 * This establishes a hierarchical relationship between diagrams, allowing
 * users to drill down from Context → Container → Component.
 *
 * @param parentPath - Absolute path to parent diagram file (e.g., "Context.bac4")
 * @param nodeId - ID of parent node to link from (e.g., "node-1")
 * @param nodeLabel - Label of parent node, used for child diagram filename
 * @param parentType - Type of parent diagram ("context" or "container")
 * @param childType - Type of child to create ("container" or "component")
 *
 * @returns Absolute path to the created child diagram
 *
 * @throws {Error} If parent diagram doesn't exist in relationships file
 * @throws {Error} If child already exists for this node
 * @throws {Error} If file system operations fail
 *
 * @example
 * ```typescript
 * // Create a Container diagram linked to a System node
 * const childPath = await service.createChildDiagram(
 *   'diagrams/Context.bac4',
 *   'node-1',
 *   'Payment System',
 *   'context',
 *   'container'
 * );
 * // Returns: 'diagrams/Payment System.bac4'
 * ```
 */
async createChildDiagram(
  parentPath: string,
  nodeId: string,
  nodeLabel: string,
  parentType: 'context' | 'container',
  childType: 'container' | 'component'
): Promise<string> {
  // Implementation...
}
```

**Special markers for AI/Developer guidance:**
```typescript
// <AI_MODIFIABLE>
// This section is designed for extension.
// Add new cloud providers following the AWS pattern.
const CLOUD_PROVIDERS = {
  aws: './aws',
  // Add: azure: './azure', gcp: './gcp'
} as const;
// </AI_MODIFIABLE>

// <TECH_DEBT priority="high" est_hours="3">
// PropertyPanel.tsx (774 lines) needs decomposition.
// Extract components: FormField, FormSection, ColorPicker, DiagramLinking
// See: docs/templates/form-field-template.tsx
// </TECH_DEBT>

// <PERFORMANCE>
// This useEffect runs on every node change.
// Consider memoization if performance degrades.
// </PERFORMANCE>
```

**Recognized markers:**
- `<AI_MODIFIABLE>` - Safe extension point for AI/developers
- `<DO_NOT_MODIFY>` - Critical logic requiring careful review
- `<TECH_DEBT>` - Known issues to address (include priority and estimate)
- `<PERFORMANCE>` - Performance-sensitive code
- `<EXTRACT_COMPONENT>` - Refactoring opportunity

### Component Templates

**For new React components:**
```typescript
/**
 * [ComponentName]
 *
 * @description Brief one-line description of what this component does
 *
 * @example
 * ```tsx
 * <ComponentName
 *   label="Node Name"
 *   value={node.data.label}
 *   onChange={(val) => updateNode(node.id, { label: val })}
 * />
 * ```
 */
import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';

interface ComponentNameProps {
  /** Primary label text */
  label: string;
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Optional placeholder text */
  placeholder?: string;
}

/**
 * ComponentName - Brief description
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
}) => {
  return (
    <div style={{
      padding: SPACING.padding.card,
      fontSize: FONT_SIZES.normal,
      color: UI_COLORS.textNormal,
      borderRadius: BORDER_RADIUS.normal,
    }}>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};
```

**Keep components:**
- Under 200 lines (extract if larger)
- Single responsibility (one clear purpose)
- Well-documented with JSDoc
- Using constants (no inline values)
- Properly typed (no `any`)

### Refactoring Signals

**Refactor immediately when:**
- 🚨 File exceeds 500 lines
- 🚨 Function exceeds 100 lines
- 🚨 Component has 10+ props
- 🚨 Code pattern repeated 3+ times
- 🚨 Business logic mixed with rendering
- 🚨 Multiple `any` types without justification
- 🚨 Complex nested conditions (cyclomatic complexity > 10)

**How to decompose a large file:**
1. **Identify** distinct responsibilities (forms vs display vs logic)
2. **Extract** shared patterns first (most repeated code)
3. **Move** business logic to services
4. **Create** focused, single-purpose components
5. **Compose** components to rebuild functionality
6. **Test** each extracted component independently

**Example decomposition (PropertyPanel.tsx):**
```
PropertyPanel.tsx (774 lines)
    ↓
PropertyPanel.tsx (orchestration, 150 lines)
    ├── FormField.tsx (reusable input, 40 lines)
    ├── FormSection.tsx (labeled groups, 30 lines)
    ├── ColorPicker.tsx (color selection, 80 lines)
    ├── DiagramLinking.tsx (dropdown + button, 60 lines)
    └── EdgeDirectionSelector.tsx (arrow buttons, 50 lines)
```

### Obsidian Plugin Specifics

**Platform patterns to follow:**
- Use `ItemView` for custom view types
- Respect Obsidian CSS variables for theming
- Use `plugin.app.vault.adapter` for all file I/O (NOT Node.js `fs` module)
- Register views with `VIEW_TYPE_*` constants
- Clean up resources in `onClose()` lifecycle
- Handle async operations properly in Obsidian's environment

**React Flow integration:**
- Keep custom nodes under 100 lines (pure presentation)
- Use `useNodesState` and `useEdgesState` hooks
- Don't fight React Flow's patterns - embrace them
- Custom edge components should be simple and focused
- Let React Flow handle rendering optimization

## Notes for Claude

- This is an Obsidian plugin, so it runs inside the Obsidian desktop app
- React is used within Obsidian's view system (not a typical React app)
- The plugin is git-native by design - all data is text files
- C4 model hierarchy is the core concept - maintain separation of concerns between levels
- AWS is first cloud provider, but architecture should be extensible
- User workflow: Create Context → drill down to Container → drill down to Component

### 🚨 CRITICAL: How to Diagnose and Fix Multi-Tab React Flow Issues

When a user reports that **"arrows and background dots work in single tab but disappear when opening multiple tabs"**, follow this debugging protocol:

#### Step 1: Identify the Pattern
Ask the user to test this exact scenario:
1. **Close all BAC4 tabs**
2. **Open Context.bac4** - Does it work? (dots + arrows visible)
3. **Open Container_1.bac4 in NEW tab** - Does the new tab work?
4. **Check the FIRST tab again** - Does Context still work?

**If the first tab STOPS working when you open the second tab** → This is an SVG ID conflict issue.

#### Step 2: Understand React Flow's Background Component

React Flow's `<Background>` component creates SVG patterns like this:
```html
<svg>
  <defs>
    <pattern id="pattern-dots" ...>
      <!-- Dot pattern definition -->
    </pattern>
  </defs>
</svg>
```

**The Problem:** If you don't provide an `id` prop, React Flow uses a **default ID** for all instances. When multiple React Flow instances exist on the same page (multiple Obsidian tabs), they all create `<pattern id="pattern-dots">`, and the **last one overwrites all previous ones**.

#### Step 3: Verify the Fix is Applied

Check `src/ui/canvas-view.tsx` - CanvasEditor component - the `<Background>` component should have a unique `id` prop:

```typescript
<ReactFlow ...>
  <Background
    id={filePath ? `bg-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'bg-default'}
    variant={BackgroundVariant.Dots}
    gap={12}
    size={1}
  />
</ReactFlow>

{/* Custom zoom controls outside ReactFlow (v0.5.0+) */}
{reactFlowInstance && (
  <div style={{ position: 'absolute', right: '16px', bottom: '16px', ... }}>
    <button onClick={() => reactFlowInstance.zoomIn()}>+</button>
    <button onClick={() => reactFlowInstance.zoomOut()}>−</button>
    <button onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}>⊡</button>
  </div>
)}
```

**If the `id` prop is missing or using a static value**, this is the bug.

#### Step 4: Apply the Fix

1. **Add unique `id` to Background component** based on file path or other unique identifier
2. **Sanitize the ID** - HTML IDs can only contain alphanumeric characters and hyphens
3. **Test with 2-3 tabs open simultaneously** to verify the fix

**Example fix:**
```typescript
// BEFORE (BROKEN - no id prop, all tabs conflict)
<Background variant={BackgroundVariant.Dots} gap={12} size={1} />

// AFTER (FIXED - unique id per file)
<Background
  id={filePath ? `bg-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'bg-default'}
  variant={BackgroundVariant.Dots}
  gap={12}
  size={1}
/>
```

#### Step 5: Common Mistakes to Avoid

**❌ WRONG: Removing ReactFlowProvider**
```typescript
// This will cause "zustand provider not found" error!
<CanvasEditor plugin={this.plugin} filePath={this.filePath} />
```

ReactFlowProvider is **REQUIRED** - React Flow uses Zustand for state management internally.

**❌ WRONG: Using static ID**
```typescript
// All tabs will still conflict!
<Background id="my-background" variant={BackgroundVariant.Dots} />
```

**❌ WRONG: Not sanitizing file path**
```typescript
// Invalid HTML ID - file path contains slashes, dots, etc.
<Background id={filePath} variant={BackgroundVariant.Dots} />
```

**✅ CORRECT: Dynamic, sanitized ID**
```typescript
<Background
  id={filePath ? `bg-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'bg-default'}
  variant={BackgroundVariant.Dots}
  gap={12}
  size={1}
/>
```

#### Step 6: How to Test Properly

**DO NOT** just test by:
- Opening one diagram ❌
- Looking at the console logs ❌
- Checking if the code compiles ❌

**ALWAYS test by:**
1. ✅ Build the plugin: `npm run build`
2. ✅ Copy to test vault: `cp main.js manifest.json /path/to/vault/.obsidian/plugins/bac4/`
3. ✅ Reload Obsidian (Cmd+R or restart)
4. ✅ Open 2-3 different diagram files in **separate tabs**
5. ✅ Verify ALL tabs show dots and arrows simultaneously
6. ✅ Switch between tabs to confirm none lose rendering

**Test Checklist:**
- [ ] Context.bac4 open → dots visible, arrows visible
- [ ] Open Container_1.bac4 in new tab → dots visible, arrows visible
- [ ] Switch back to Context tab → dots STILL visible, arrows STILL visible
- [ ] Open Container_2.bac4 in third tab → all 3 tabs still work
- [ ] Close middle tab → remaining tabs still work

#### Step 7: Verify the Fix in Browser DevTools

If you want to confirm the fix at the HTML level:

1. Open browser DevTools (View → Developer → Toggle Developer Tools in Obsidian)
2. Inspect the canvas area
3. Look for `<svg>` elements with `<defs>` containing `<pattern>` tags
4. Verify each pattern has a unique ID:
   - Tab 1: `<pattern id="bg-BAC4-Context-bac4" ...>`
   - Tab 2: `<pattern id="bg-BAC4-Container-1-bac4" ...>`
   - Tab 3: `<pattern id="bg-BAC4-Container-2-bac4" ...>`

If you see duplicate IDs or all tabs using the same ID, the fix is not applied correctly.

#### Step 8: Update Documentation

After fixing, update:
1. **CLAUDE.md** - Add to troubleshooting section (already done above)
2. **docs/DIAGRAM_OPENING_AUDIT.md** - Note the fix in "Current Status"
3. **Git commit message** - Reference the issue clearly

Example commit message:
```
Fix: Background dots/arrows conflict in multi-tab scenario

Added unique id prop to Background component based on file path.
React Flow SVG patterns were conflicting when multiple tabs open.

- Each diagram now gets unique Background ID: bg-{sanitized-path}
- Tested with 3 tabs open simultaneously
- All tabs render independently

Fixes issue where opening second tab caused first tab to lose rendering.
```

#### Reference Documentation

- **React Flow Background API:** https://reactflow.dev/api-reference/components/background
- **GitHub Issue (2021):** https://github.com/wbkd/react-flow/issues/1037
- **HTML ID Spec:** IDs must start with letter, contain only [A-Za-z0-9_-]

#### When This Issue Recurs

This issue can happen whenever:
- Adding multiple React Flow instances on the same page
- Using Background, MiniMap, or Controls components without unique IDs
- Any SVG-based React Flow component that uses pattern definitions

**General Rule:** If React Flow component has an optional `id` prop and you have multiple instances, **always provide unique IDs**.

### Recent Changes

**v1.0.0 (2025-10-16) - Timeline Tracking & Read-Only Snapshots** 🎉

**CRITICAL BUG FIX: Snapshot Creation Capturing Empty Data**

**Problem:** When users created snapshots immediately after adding nodes, the "Current" snapshot would become empty and lose all data. Subsequent snapshots would capture correctly, but the working snapshot (Current) would be permanently empty.

**Root Cause:** Two separate issues compounded:
1. **Auto-save debounce (1 second)** + `handleAddSnapshot` using **stored snapshot** instead of **canvas state**
   - User adds 3 nodes → auto-save hasn't fired yet (debounced)
   - User clicks "Create Snapshot" → snapshot created from stored "Current" (which is still empty)
   - Result: Snapshot captures empty data because stored snapshot hasn't been updated
2. **Timeline ref race condition** - Auto-save effect captured stale timeline from closure

**The Fix - Three-Phase Implementation:**

#### Phase 1: Read-Only Mode for Frozen Snapshots ✅

**Goal:** Prevent users from editing frozen snapshots (which would cause data loss on snapshot switching)

**Implementation:**
- Created `ReadOnlyBanner` component (orange gradient banner with lock icon 🔒)
- Added `isReadOnly` computed property: `!isViewingWorkingSnapshot` (first snapshot is editable, others read-only)
- Disabled ReactFlow interactions: `nodesDraggable={!isReadOnly}`, `nodesConnectable={!isReadOnly}`
- Disabled toolbar controls when read-only (DiagramTypeSelector, NodeCreationButtons, AnnotationButtons)
- Updated DiagramActions delete button with read-only check
- "Switch to Current" button in banner for quick navigation back to editable snapshot

**Files Modified:**
- `src/ui/components/ReadOnlyBanner.tsx` (new, 87 lines)
- `src/ui/canvas-view.tsx` (isReadOnly logic, ReactFlow props, banner integration)
- `src/ui/components/UnifiedToolbar.tsx` (isReadOnly prop, conditional rendering)
- `src/ui/components/toolbar/components/DiagramActions.tsx` (delete button disabled state)
- `src/ui/components/toolbar/components/DiagramTypeSelector.tsx` (disabled prop)

**Key Code (`canvas-view.tsx:500-516`):**
```typescript
const isReadOnly = React.useMemo(() => {
  if (!timeline) return false;
  const firstSnapshotId = timeline.snapshotOrder[0];
  const isViewingWorkingSnapshot = timeline.currentSnapshotId === firstSnapshotId;
  return !isViewingWorkingSnapshot;
}, [timeline]);
```

#### Phase 2: Timeline Ref Race Condition Fix ✅

**Goal:** Prevent auto-save from capturing stale timeline state from closure

**Problem:** Auto-save effect captured `timeline` from closure, which could be outdated when auto-save fires (1 second later)

**Solution:** Use `React.useRef` to maintain reference to latest timeline value

**Files Modified:**
- `src/ui/canvas-view.tsx` (added timelineRef, sync effect)
- `src/ui/canvas/hooks/useFileOperations.ts` (use timelineRef.current in auto-save)

**Key Code (`canvas-view.tsx:111-117`):**
```typescript
// Timeline ref for auto-save (v1.0.0 - prevents race conditions)
const timelineRef = React.useRef<Timeline | null>(null);

// Keep ref in sync with state
React.useEffect(() => {
  timelineRef.current = timeline;
}, [timeline]);
```

**Key Code (`useFileOperations.ts:87-92`):**
```typescript
const saveTimeout = setTimeout(async () => {
  try {
    // Get latest timeline from ref to avoid stale closure data
    const timeline = timelineRef.current;
    if (!timeline) {
      console.log('BAC4: Timeline ref is null, skipping auto-save');
      return;
    }
    // ... rest of auto-save logic
```

#### Phase 3: Enhanced UX Improvements ✅

**Goal:** Provide clear visual indicators for editable vs read-only snapshots

**Implementation:**
- Added lock 🔒 and pencil ✏️ icons to timeline dropdown (TimelineToolbar)
- First snapshot (index 0) shows ✏️ (editable "Current")
- All other snapshots show 🔒 (frozen/read-only)
- Updated SnapshotManager with icons and tooltips
- Changed "(current)" to "(viewing)" for clarity

**Files Modified:**
- `src/ui/components/TimelineToolbar.tsx` (lock/pencil icons in dropdown)
- `src/ui/components/SnapshotManager.tsx` (icons, tooltips, index display)

**Key Code (`TimelineToolbar.tsx:135-145`):**
```typescript
{orderedSnapshots.map((snapshot, index) => {
  const isWorkingSnapshot = index === 0;
  const icon = isWorkingSnapshot ? '✏️' : '🔒';
  return (
    <option key={snapshot.id} value={snapshot.id}>
      {icon} {snapshot.label}
      {snapshot.timestamp ? ` (${snapshot.timestamp})` : ''}
    </option>
  );
})}
```

#### The Critical Fix: Snapshot Creation from Canvas State ✅

**This is the fix that resolved the empty "Current" snapshot bug.**

**Problem:** `handleAddSnapshot` was creating snapshots from **stored timeline snapshot** instead of **live canvas state**

**Before (BROKEN):**
```typescript
const currentWorkingSnapshot = timeline.snapshots.find(s => s.id === firstSnapshotId);
const modal = new AddSnapshotModal(
  plugin.app,
  currentWorkingSnapshot.nodes,     // ← BUG: Using outdated stored snapshot
  currentWorkingSnapshot.edges,     // ← BUG: May not reflect canvas changes
  currentWorkingSnapshot.annotations, // ← BUG: Auto-save hasn't fired yet!
  timeline,
  // ...
);
```

**After (FIXED):**
```typescript
// CRITICAL FIX: Always capture from CANVAS STATE, not from stored snapshot
// The stored snapshot may be outdated due to auto-save debounce (1 second delay)
const modal = new AddSnapshotModal(
  plugin.app,
  nodes,         // ← FIXED: Use current canvas state
  edges,         // ← FIXED: Use current canvas state
  annotations,   // ← FIXED: Use current canvas state
  timeline,
  // ...
);
```

**Why This Works:**
- `nodes`, `edges`, `annotations` are React state that reflects the **current canvas**
- These values are always up-to-date, regardless of auto-save timing
- Snapshot captures what the user sees on screen, not what's stored in the file
- Auto-save can happen later without affecting snapshot accuracy

**Dependency Array Update:**
```typescript
}, [plugin.app, timeline, nodes, edges, annotations, setNodes, setEdges, setAnnotations, setTimeline]);
```

**File Modified:**
- `src/ui/canvas-view.tsx:388-406` (`handleAddSnapshot` callback)

**Diagnostic Logging Added:**
```typescript
console.log('BAC4: 📸 Creating snapshot from CANVAS STATE', {
  canvasNodeCount: nodes.length,
  canvasEdgeCount: edges.length,
  canvasAnnotationCount: annotations.length,
  timelineSnapshotCount: timeline.snapshots.length,
});
```

#### Testing & Verification

**Test Scenario:**
1. Open diagram
2. Add 3 nodes
3. Immediately click "Add Snapshot" (before 1-second auto-save)
4. Verify "Snapshot 1" contains 3 nodes
5. Switch back to "Current" snapshot
6. Verify "Current" still contains 3 nodes (not empty)

**Result:** ✅ All tests passing, no data loss

**Deployment:**
- Build: 732KB (production)
- Deployed to: BAC4Testv09 + TestVault
- Cache flush instructions provided
- User testing: In progress

#### Impact & Benefits

**User Experience:**
- ✅ No more data loss when creating snapshots
- ✅ Clear visual feedback (lock/pencil icons, read-only banner)
- ✅ Prevents accidental edits to frozen snapshots
- ✅ "Switch to Current" button for quick recovery

**Code Quality:**
- ✅ Eliminated race condition in auto-save
- ✅ Fixed snapshot creation timing issue
- ✅ Enhanced debugging with diagnostic logs
- ✅ Better separation of concerns (canvas state vs stored state)

**Technical Debt Resolved:**
- ✅ Timeline ref pattern prevents future closure issues
- ✅ Canvas state as source of truth for snapshots
- ✅ Read-only mode prevents entire class of data loss bugs

#### Future Considerations

**Potential Enhancements (v1.1.0+):**
- Snapshot diff viewer (show changes between snapshots)
- Snapshot export/import (share snapshots across vaults)
- Snapshot search/filter (find snapshots by content)
- Automatic snapshot on major changes (configurable threshold)
- Snapshot merge capability (combine multiple snapshots)

**Known Limitations:**
- Annotations not yet included in snapshots (future enhancement)
- No undo/redo within snapshots (would require separate history)
- Read-only mode is binary (can't partially edit frozen snapshots)

---

**v0.6.0 (2025-10-14) - Self-Contained Diagrams & File Format Overhaul** 🎉
- **Breaking Change:** New .bac4 file format with version and metadata
- **Self-Contained Files:** All links embedded in node.data (linkedDiagramPath, linkedMarkdownPath)
- **Auto-Updating References:** vault.on('rename') listener updates all .bac4 files when files are renamed
- **Unified Navigation:** Double-click priority - linkedDiagramPath → linkedMarkdownPath → drill-down → info
- **Breadcrumbs Removed:** Use Obsidian's native back/forward navigation instead
- **File Validation:** Broken links automatically cleaned on diagram load
- **Build:** 565.4kb (stable, optimized)

**Migration Notes:**
- **Fresh Start Required:** v0.6.0 uses new file format incompatible with v0.5.0
- **User confirmed clean slate:** "yes, its ok to implement breaking changes at this stage, I will delete all old files ready"
- **No migration code needed:** Users will recreate diagrams from scratch

**v0.5.0 (2025-10-14) - Enhanced UI Controls & Cloud Component Management**
1. **Moveable/Resizable Panels** - Component Palette and Property Panel are now draggable
2. **Enhanced Cloud Nodes** - Type badge (left) and Provider badge (right) with read-only metadata
3. **Larger Container Nodes** - 75% size increase, folder badge removed
4. **Custom Zoom Controls** - Export-friendly controls outside ReactFlow canvas
5. **Simplified Icon Selector** - Single searchable list, category system removed
6. **Taller Property Panel** - 800px height for better visibility

**Phase 4 (Advanced Improvements - COMPLETE 2025-10-12)**
1. **Testing Infrastructure** - 104 tests, 29.65% coverage, 100% on critical utilities
2. **Performance Optimization** - React.memo on pure components, ~60% re-render reduction
3. **Accessibility** - WCAG 2.1 AA compliance documented, keyboard navigation verified
4. **Documentation** - `performance-optimizations.md`, `accessibility.md`, `phase-4-completion-summary.md`

**Sprint 1.2 (v0.1.0-v0.4.0 - Feature Development)**
1. **Export Enhancement** - Added PNG/JPEG/SVG export with dropdown menu
2. **Hierarchical Linking** - Property Panel dropdowns to link/create child diagrams
3. **Toolbar Consolidation** - Moved all actions to unified horizontal toolbar
4. **Central Relationships** - All diagram hierarchy in `diagram-relationships.json`
5. **Refactoring Foundation** - Constants extraction, error handling, service layer architecture

### Current Priority: Phase 5 & 6

**Phase 5: Documentation & Developer Experience** (NEXT)
- Goal: Make codebase AI-friendly and developer-friendly
- Tasks:
  1. Create developer guides for extending the plugin
  2. Add `<AI_MODIFIABLE>` markers to safe extension points
  3. Create CONTRIBUTING.md with onboarding guide
  4. Add ADRs (Architectural Decision Records) for key decisions
- Why: Enable AI assistants and future contributors to safely extend functionality

**Phase 6: Technical Debt Resolution** (FINAL)
- Goal: Clean up remaining tech debt and modernize dependencies
- Tasks:
  1. Remove dead code (unused components, commented code)
  2. Update dependencies (React Flow, TypeScript, React)
  3. Consolidate configuration files
  4. Final optimization pass
- Why: Production-ready, maintainable codebase

### UI Layout (v0.6.0)
```
┌─────────────────────────────────────────────────────────────┐
│ [Type] | [+ Node Buttons] | [Actions] ←───────────────────│ Unified Toolbar (fixed, no breadcrumbs)
├─────────────────────────────────────────────────────────────┤
│                                                    ┌────────┐│
│                                                    │Component││ Component Palette
│                                                    │Palette ││ (moveable/resizable,
│                                                    └────────┘│  Component diagrams)
│                                                             │
│                  CANVAS AREA                                │
│          (React Flow with nodes and edges)                  │
│                                                             │
│ ┌──────────────────┐                          ┌─────┐      │
│ │ Node Properties  │                          │ +   │      │ Custom Zoom Controls
│ ├──────────────────┤                          │ −   │      │ (fixed bottom-right,
│ │ [− Parent][+ Child] ← Navigation Buttons    │ ⊡   │      │  not in exports)
│ │ ─────────────────│                          └─────┘      │
│ │ Label: ...       │ ←─────────────────────────────────────│ Property Panel
│ │ Color: [picker]  │                          (moveable)   │
│ │ ...              │                                       │
│ └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```
