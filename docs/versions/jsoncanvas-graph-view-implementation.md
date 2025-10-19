# JSONCanvas Graph View Implementation
## Native Obsidian Canvas for BAC4 Graph View

**Date**: October 19, 2025
**Version**: BAC4 v1.0.1
**Status**: ✅ **IMPLEMENTED**

---

## Summary

Successfully converted the BAC4 graph view to use Obsidian's native JSONCanvas format (`.canvas`), replacing the custom `.bac4`-based graph view. The graph view now opens in Obsidian's native Canvas editor, providing better UX, performance, and interoperability.

**Benefits**:
- ✅ Native Obsidian Canvas rendering (faster, more polished)
- ✅ Users can edit graph layout visually
- ✅ Click diagram files to open them
- ✅ Open format (interoperable with other tools)
- ✅ Less custom code to maintain
- ✅ Auto-regenerated on each open (always fresh)

---

## Implementation Details

### 1. New Files Created

#### `/src/types/jsoncanvas.ts`
Complete TypeScript definitions for JSONCanvas v1.0 specification:
- `JSONCanvasNode` - Union of text/file/link/group nodes
- `JSONCanvasEdge` - Edge connecting two nodes
- `JSONCanvasFile` - Top-level canvas structure
- Type guards for node type checking

**Key Types**:
```typescript
export interface FileCanvasNode extends BaseCanvasNode {
  type: 'file';
  file: string;           // Path to .bac4 diagram
  subpath?: string;       // Optional heading/block reference
}

export interface JSONCanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromEnd?: 'none' | 'arrow';
  toEnd?: 'none' | 'arrow';
  label?: string;
  color?: CanvasColor;
}
```

#### `/src/services/jsoncanvas-exporter.ts`
Service for converting BAC4 data to JSONCanvas format:
- `exportGraphToCanvas()` - Graph view → Canvas format
- `exportDiagramToCanvas()` - Regular diagrams → Canvas (lossy)
- `convertGraphNodes()` - Graph nodes → file nodes (link to .bac4)
- `convertEdges()` - BAC4 edges → Canvas edges
- `convertColor()` - Hex → Canvas presets (or preserve hex)

**Color Mapping**:
```typescript
const COLOR_PRESET_MAP: Record<string, string> = {
  '#1168BD': '5', // Context (blue) → Cyan preset
  '#438DD5': '5', // Container → Cyan preset
  '#85BBF0': '4', // Component → Green preset
  '#08427B': '6', // Person (dark blue) → Purple preset
  '#999999': '1', // External → Red preset
  // Unmapped colors pass through as hex
};
```

### 2. Modified Files

#### `/src/main.ts`
**Changes**:
1. Updated `openGraphView()` to create `.canvas` files
2. Added `exportDiagramToCanvas()` method
3. Added "Export Diagram to Canvas" command (Cmd+P)

**Before** (old graph view):
```typescript
// Created __graph_view__.bac4 (custom format)
const filePath = 'BAC4/__graph_view__.bac4';
const diagramData = { version: '1.0.0', metadata: {...}, timeline: {...} };
await this.app.vault.create(filePath, JSON.stringify(diagramData));
await this.openCanvasView(file.path); // Custom BAC4 view
```

**After** (native Canvas):
```typescript
// Creates __graph_view__.canvas (JSONCanvas format)
const filePath = 'BAC4/__graph_view__.canvas';
const { nodes, edges } = await GraphGenerationService.generateGraph(vault);
const canvasData = JSONCanvasExporter.exportGraphToCanvas(nodes, edges);
await this.app.vault.create(filePath, canvasJson);
// Opens in native Obsidian Canvas (no custom view needed!)
await leaf.openFile(file as TFile);
```

**New Command**:
```typescript
// Cmd+P → "BAC4: Export Diagram to Canvas"
this.addCommand({
  id: 'bac4-export-to-canvas',
  name: 'Export Diagram to Canvas',
  checkCallback: (checking) => {
    const activeView = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
    if (!activeView) return false;
    if (!checking) this.exportDiagramToCanvas(activeView);
    return true;
  },
});
```

#### `/src/ui/canvas-view.tsx`
**Changes**:
1. Added `getNodes()`, `getEdges()`, `getFilePath()` public methods
2. Exposed canvas state via getters for export feature

**State Exposure Pattern**:
```typescript
// In CanvasEditor component
React.useEffect(() => {
  if (view) {
    view['nodesGetter'] = () => nodes;
    view['edgesGetter'] = () => edges;
  }
  return () => {
    if (view) {
      view['nodesGetter'] = null;
      view['edgesGetter'] = null;
    }
  };
}, [view, nodes, edges]);

// In BAC4CanvasView class
getNodes(): Node<CanvasNodeData>[] | null {
  return this.nodesGetter ? this.nodesGetter() : null;
}
```

---

## Usage

### Opening Graph View

**Command Palette** (Cmd+P):
```
BAC4: Open Graph View
```

**Result**:
- Creates/regenerates `BAC4/__graph_view__.canvas`
- Opens in Obsidian's native Canvas view
- Each node is a **file node** linking to a .bac4 diagram
- Click any diagram file to open it
- Drag nodes to rearrange layout (preserved until next regeneration)

### Exporting Diagrams to Canvas

**Command Palette** (Cmd+P):
```
BAC4: Export Diagram to Canvas
```

**Result**:
- Creates `[DiagramName].canvas` next to `[DiagramName].bac4`
- Lossy conversion (loses timeline, C4 styling, annotations)
- Nodes become generic text nodes
- Useful for viewing in native Canvas or sharing with non-BAC4 users

---

## Technical Architecture

### Graph View Flow

```
User Action: "Open Graph View"
    ↓
main.ts: openGraphView()
    ↓
GraphGenerationService.generateGraph(vault)
    ├─ Scans all .bac4 files in vault
    ├─ Parses metadata (type, linked diagrams)
    ├─ Creates Graph nodes (one per diagram)
    └─ Creates edges (diagram relationships)
    ↓
JSONCanvasExporter.exportGraphToCanvas(nodes, edges)
    ├─ Converts Graph nodes → File nodes (link to .bac4)
    ├─ Converts edges → Canvas edges (arrows)
    ├─ Maps colors → Canvas presets or hex
    └─ Returns JSONCanvasFile
    ↓
vault.create('BAC4/__graph_view__.canvas', canvasJson)
    ↓
Opens in native Obsidian Canvas
```

### Export Diagram Flow

```
User Action: "Export Diagram to Canvas"
    ↓
main.ts: exportDiagramToCanvas(view)
    ↓
view.getNodes(), view.getEdges()
    ↓
JSONCanvasExporter.exportDiagramToCanvas(nodes, edges)
    ├─ Converts C4 nodes → Text nodes (lossy)
    ├─ Preserves positions, sizes, colors
    ├─ Converts edges → Canvas edges
    └─ Returns JSONCanvasFile
    ↓
vault.create('[DiagramName].canvas', canvasJson)
    ↓
Notice: "Exported to [DiagramName].canvas"
```

---

## JSONCanvas Format Example

### Graph View Canvas

```json
{
  "nodes": [
    {
      "id": "graph-0",
      "type": "file",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 80,
      "file": "BAC4/Context.bac4",
      "color": "5"
    },
    {
      "id": "graph-1",
      "type": "file",
      "x": 350,
      "y": 100,
      "width": 200,
      "height": 80,
      "file": "BAC4/API_Gateway.bac4",
      "color": "5"
    }
  ],
  "edges": [
    {
      "id": "edge-0",
      "fromNode": "graph-0",
      "toNode": "graph-1",
      "fromEnd": "none",
      "toEnd": "arrow"
    }
  ]
}
```

### Exported Diagram Canvas

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "x": 250,
      "y": 100,
      "width": 250,
      "height": 100,
      "text": "API Gateway\n\nREST API for mobile apps\n\n_Type: system_",
      "color": "5"
    },
    {
      "id": "node-2",
      "type": "text",
      "x": 550,
      "y": 100,
      "width": 250,
      "height": 100,
      "text": "Database\n\n_Type: container_",
      "color": "5"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromNode": "node-1",
      "toNode": "node-2",
      "fromEnd": "none",
      "toEnd": "arrow",
      "label": "reads/writes"
    }
  ]
}
```

---

## Feature Comparison

| Feature | Old (.bac4 Graph) | New (.canvas Graph) |
|---------|-------------------|---------------------|
| **File Format** | Custom BAC4 v1.0.0 | JSONCanvas v1.0 |
| **Rendering** | Custom React Flow view | Native Obsidian Canvas |
| **Editing** | View-only (regenerated) | Editable (rearrange nodes) |
| **Node Type** | GraphNode (custom) | File nodes (link to .bac4) |
| **Click Behavior** | Double-click → open | Click file → open |
| **Performance** | React Flow | Native Canvas (faster) |
| **Layout** | Auto-grid | User-editable |
| **Persistence** | Regenerated on open | Preserved until regenerated |
| **Interoperability** | BAC4 only | Any JSONCanvas tool |

---

## Testing Checklist

### Graph View
- [x] ~~Command: "Open Graph View" creates `.canvas` file~~
- [x] ~~Graph opens in native Obsidian Canvas~~
- [x] ~~File nodes link to correct .bac4 diagrams~~
- [x] ~~Clicking file node opens diagram in BAC4 view~~
- [x] ~~Edges connect diagrams correctly~~
- [x] ~~Colors preserve from C4 types~~
- [x] ~~Re-opening regenerates (always fresh)~~

### Export Feature
- [x] ~~Command: "Export Diagram to Canvas" available when diagram open~~
- [x] ~~Creates `.canvas` file next to `.bac4`~~
- [x] ~~C4 nodes convert to text nodes~~
- [x] ~~Positions, sizes, colors preserved~~
- [x] ~~Edges convert correctly~~
- [x] ~~Prevents overwriting existing exports~~

### Edge Cases
- [x] ~~Empty vault (no diagrams) → graph view shows empty canvas~~
- [x] ~~Single diagram → graph view shows one node~~
- [x] ~~Complex relationships → edges render correctly~~
- [x] ~~Export unsaved diagram → shows "save first" notice~~

---

## Known Limitations

### Graph View
1. **Layout is manual** - No auto-layout algorithms (user arranges)
2. **Regenerated on open** - Custom layouts lost when reopened
   - *Mitigation*: If users want persistent layout, they can duplicate and rename the file
3. **File nodes only** - Can't show node details in graph (just filename)

### Export Feature
1. **Lossy conversion** - Timeline, annotations, C4 styling lost
2. **Text nodes only** - No specialized C4 node rendering
3. **One-way** - Cannot import `.canvas` back to `.bac4`
4. **No metadata** - Diagram type, timestamps lost

---

## Future Enhancements

### Potential Improvements

1. **Persistent Graph Layout**
   - Save user-arranged layout separately
   - Reload last layout when regenerating
   - Manual "Reset Layout" button

2. **Auto-Layout Options**
   - Hierarchical layout (top-down)
   - Force-directed layout (physics-based)
   - Circular layout (radial)
   - Grid layout (current default)

3. **Enhanced File Nodes**
   - Add subpath to show snapshot info
   - Group nodes by diagram type
   - Color-code by type or folder

4. **Bidirectional Export**
   - Import `.canvas` → `.bac4` (best effort)
   - Detect changes in exported canvas
   - Sync updates back to original

5. **Advanced Export Options**
   - Export specific snapshot (not just current)
   - Export with/without annotations
   - Export as image (PNG/SVG)

---

## Comparison with Full Migration

This implementation demonstrates why **graph view** was ideal for JSONCanvas conversion:

| Aspect | Graph View | Full Diagram Migration |
|--------|------------|------------------------|
| **Complexity** | 🟢 LOW (4-6 hours) | 🔴 HIGH (345-525 hours) |
| **Feature Loss** | ✅ None (graph is simple) | ❌ Critical (timeline, C4, annotations) |
| **User Impact** | ✅ Improved UX | ❌ Workflow disruption |
| **Code Changes** | ✅ Additive only | ❌ Major refactor |
| **Maintenance** | ✅ Less code | ❌ Custom Canvas plugin needed |
| **Reversibility** | ✅ Can revert easily | ❌ One-way migration |

**Verdict**: Graph view conversion was a **perfect use case** - simple enough to migrate fully while gaining native Canvas benefits.

---

## Migration Path (If Needed)

If we ever want to migrate main diagrams to Canvas:

1. **Extend this implementation**
   - Export feature already works
   - Add import feature (Canvas → BAC4)
   - Improve conversion fidelity

2. **Gradual adoption**
   - Users export diagrams as needed
   - Dual-format support (`.bac4` + `.canvas`)
   - Eventually deprecate `.bac4` if feasible

3. **Custom Canvas plugin**
   - Build Obsidian Canvas plugin for C4 rendering
   - Add timeline support to Canvas
   - Requires 80-120 hours (see migration report)

---

## Related Documentation

- [JSONCanvas Migration Analysis](./jsoncanvas-migration-analysis.md) - Full migration feasibility study
- [JSONCanvas Specification](https://jsoncanvas.org/spec/1.0/) - Official spec
- [Graph Generation Service](../src/services/graph-generation-service.ts) - Graph data generation
- [JSONCanvas Exporter](../src/services/jsoncanvas-exporter.ts) - Format conversion

---

## Conclusion

✅ **Success!** The graph view now uses Obsidian's native Canvas format, providing:
- Better UX (native editing, polished UI)
- Better performance (optimized renderer)
- Less code to maintain
- Open format for interoperability

The implementation also added a bonus **export feature** for regular diagrams, allowing users to view BAC4 diagrams in native Canvas if desired (though with feature loss).

This demonstrates the value of **selective migration** - converting features where it makes sense (graph view) while preserving the powerful BAC4 format for core functionality (timeline-based architecture modeling).
