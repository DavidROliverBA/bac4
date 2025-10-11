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
- Drag & drop nodes from toolbars/palettes
- Create edges by dragging from node handles
- Double-click nodes to drill down to child diagrams
- Property panel for editing node/edge properties
- Auto-save to `.bac4` JSON files

### Hierarchical Navigation
- **Drill-down:** Double-click System → Container diagram, Container → Component diagram
- **Breadcrumbs:** Navigate back up the hierarchy
- **Linking:** Parent-child relationships stored in metadata

### Node Types
- `SystemNode` - For Context diagrams (systems)
- `PersonNode` - For Context diagrams (actors)
- `ContainerNode` - For Container diagrams (apps, services, databases)
- `CloudComponentNode` - For Component diagrams (AWS/cloud services)
- `C4Node` - Generic fallback

### Cloud Component Library
- AWS service library (Lambda, S3, DynamoDB, etc.)
- Drag & drop cloud components onto Component diagrams
- Component palette only shows for Component-level diagrams
- Extensible to Azure and GCP

## Project Structure

```
bac4-plugin/
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
│   │       ├── ComponentPalette.tsx     # Cloud component palette
│   │       ├── PropertyPanel.tsx        # Node/edge properties editor
│   │       ├── DiagramToolbar.tsx       # Diagram-specific tools
│   │       ├── DiagramActionsToolbar.tsx
│   │       └── Breadcrumbs.tsx          # Hierarchy navigation
│   ├── services/
│   │   ├── component-library-service.ts # Cloud component management
│   │   └── diagram-navigation-service.ts # Drill-down/linking logic
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

### File Format
Diagrams are stored as `.bac4` JSON files:
```json
{
  "metadata": {
    "diagramType": "context" | "container" | "component",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "parentDiagramId": "optional parent reference",
    "parentNodeId": "optional node that links here"
  },
  "nodes": [...],
  "edges": [...]
}
```

### React Flow Integration
- Uses `ReactFlowProvider` wrapper
- Custom node types registered in `nodeTypes` object
- Drag & drop via `onDrop`, `onDragOver` handlers
- Auto-save with 1-second debounce

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
2. Symlink to vault: `ln -s /path/to/bac4-plugin /path/to/vault/.obsidian/plugins/bac4-plugin`
3. Enable in Obsidian: Settings → Community Plugins → Enable "BAC4"

## Current Status

### ✅ Completed Features
- React Flow canvas integration
- Full interactivity (drag, click, connect)
- Edge label editing
- Property panel for nodes and edges
- Component library integration (AWS)
- Drill-down navigation
- Breadcrumb navigation
- Auto-save
- Duplicate tab prevention
- Basic node types (System, Person, Container, CloudComponent)

### 📋 Planned Enhancements (from c4-model-enhancement-plan.md)

**Phase 2: C4 Type Enforcement**
- Show only appropriate nodes for each diagram type
- Context: System, Person, External System only
- Container: WebApp, API, Database, Queue only
- Component: Component + AWS palette

**Phase 3: Enhanced Node Types**
- WebAppNode, MobileAppNode, APINode, DatabaseNode, QueueNode
- Better icons and styling for each type

**Phase 4: File Management**
- Structured folder organization (context/, container/, component/)
- "New Diagram" modal with naming suggestions

## Common Tasks

### Adding a New Node Type
1. Create `src/ui/nodes/NewNode.tsx` with component
2. Export type and data interface
3. Register in `nodeTypes` object in `canvas-view.tsx`
4. Add to appropriate toolbar in `DiagramToolbar.tsx`

### Adding a Cloud Provider
1. Create `component-library/azure/` or `component-library/gcp/`
2. Add component definitions JSON
3. Update `ComponentLibraryService` to load new provider
4. Add icons/assets

### Modifying Canvas Behavior
- Edit `src/ui/canvas-view.tsx`
- React Flow event handlers: `onConnect`, `onNodeClick`, `onNodeDoubleClick`, etc.
- State management uses React hooks: `useNodesState`, `useEdgesState`

## Key Dependencies

- `obsidian` - Obsidian plugin API
- `react` / `react-dom` - UI framework
- `reactflow` (now XyFlow) - Canvas/diagram library
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

## Notes for Claude

- This is an Obsidian plugin, so it runs inside the Obsidian desktop app
- React is used within Obsidian's view system (not a typical React app)
- The plugin is git-native by design - all data is text files
- C4 model hierarchy is the core concept - maintain separation of concerns between levels
- AWS is first cloud provider, but architecture should be extensible
- User workflow: Create Context → drill down to Container → drill down to Component
