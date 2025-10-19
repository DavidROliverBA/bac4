# BAC4 Graph View Enhancement Roadmap

**Status:** Phase 2 Complete ✅
**Version:** v2.0.1
**Last Updated:** 2025-10-19

---

## Overview

This roadmap outlines improvements to BAC4's graph view, inspired by the Extended Graph plugin for Obsidian. The goal is to create a best-in-class visualization for the 7-layer enterprise architecture model.

---

## Completed Features

### ✅ Phase 1: Hierarchical Layout (COMPLETE - v2.0.0)

**Implementation Date:** 2025-10-19

**Features:**
1. **Hierarchical layout algorithm** - Arranges diagrams by layer (Market → Code)
2. **Dynamic node sizing** - Nodes scale based on connection count
3. **Layer-based grouping** - Diagrams grouped by architectural layer
4. **Centered layer alignment** - Each layer centered horizontally
5. **Visual layer separation** - 300px vertical spacing between layers

**Technical Details:**
- File: `src/services/graph-generation-service.ts`
- Method: `generateGraph()` - Refactored for hierarchical layout
- New Method: `calculateNodeSize()` - Dynamic sizing based on connections
- Layout: Top-to-bottom by layer, left-to-right within layers

**Benefits:**
- ✅ Immediately visualize architectural flow
- ✅ See which layers have most diagrams
- ✅ Identify central/important diagrams (larger nodes)
- ✅ Understand relationships between layers
- ✅ Much better than random grid layout

**Node Sizing Formula:**
```typescript
width = baseWidth (200px) + min(connections × 10px, 200px)  // Max 400px
height = baseHeight (80px) + min(connections × 5px, 100px)  // Max 180px
```

**Example Layout:**
```
Market (Layer 1)          [Node1] [Node2]
                              ↓       ↓
Organisation (Layer 2)    [Node3] [Node4] [Node5]
                              ↓       ↓       ↓
Capability (Layer 3)      [Node6] [Node7]
                              ↓       ↓
Context (Layer 4)         [Node8]
                              ↓
Container (Layer 5)       [Node9] [Node10]
                              ↓       ↓
Component (Layer 6)       [Node11]
                              ↓
Code (Layer 7)            [Node12] [Node13] [Node14]
```

### ✅ Phase 2: Persistent Layout (COMPLETE - v2.0.1)

**Implementation Date:** 2025-10-19
**Actual Effort:** 3.5 hours

**Problem:** Graph regenerated from scratch each time, losing user's manual node arrangements.

**Solution:** Save and restore user-customized node positions.

#### Features Implemented:
1. ✅ **Layout persistence file** - `.bac4-graph-layout.json` in vault root
2. ✅ **Position saving** - Store x, y, width, height for each diagram
3. ✅ **Position restoration** - Restore saved positions on graph regeneration
4. ✅ **Smart positioning** - Auto-position only NEW diagrams
5. ✅ **Layout versioning** - Track layout format version (1.0.0)
6. ✅ **Auto-save on Canvas edit** - Monitors __graph_view__.canvas for changes
7. ✅ **Diagram rename handling** - Updates layout file when diagrams renamed
8. ✅ **Diagram deletion handling** - Removes from layout when deleted
9. ✅ **Reset command** - "Reset Graph Layout" command palette entry

#### Layout File Format:
```json
{
  "version": "1.0.0",
  "layout": {
    "BAC4/Context.bac4": { "x": 100, "y": 200, "width": 250, "height": 100 },
    "BAC4/Container_API.bac4": { "x": 400, "y": 500, "width": 300, "height": 120 }
  },
  "lastUpdated": "2025-10-19T16:30:00Z"
}
```

#### Implementation:
- ✅ Created `GraphLayoutService` class - Full CRUD operations
- ✅ `saveLayout()` - Write positions to file
- ✅ `loadLayout()` - Read positions from file
- ✅ `resetLayout()` - Delete layout file
- ✅ `handleDiagramRename()` - Update positions on rename
- ✅ `handleDiagramDeletion()` - Remove positions on delete
- ✅ Integrated into `generateGraph()` - Apply saved positions
- ✅ Canvas modification listener - Save on edit (1s debounce)
- ✅ File event listeners - Rename, delete handlers
- ✅ "Reset Graph Layout" command in palette

#### Files Modified/Created:
- `src/services/graph-layout-service.ts` - NEW FILE (360 lines)
- `src/services/graph-generation-service.ts` - Layout restoration logic
- `src/main.ts` - Command + event listeners

#### How It Works:
1. User opens graph view → Loads saved layout
2. New diagrams → Auto-positioned hierarchically
3. Existing diagrams → Use saved positions
4. User drags nodes in Canvas → Auto-saves after 1s
5. User renames diagram → Layout file updates automatically
6. User deletes diagram → Removed from layout file
7. "Reset Graph Layout" → Deletes file, next view uses defaults

#### Benefits:
- ✅ Manual arrangements persist across sessions
- ✅ Automatic save (no explicit "Save" button needed)
- ✅ Handles diagram lifecycle (create, rename, delete)
- ✅ Easy reset to defaults
- ✅ No data loss on file operations

---

## Planned Features

---

### 🎨 Phase 3: Layout Options (MEDIUM PRIORITY)

**Estimated Effort:** 2-3 hours
**Target:** v2.0.2

**Goal:** Provide multiple layout algorithms for different use cases.

#### Features:
1. **Layout selector UI** - Toggle between layouts
2. **Grid layout** - Original grid arrangement (fallback)
3. **Hierarchical layout** - Current implementation (default)
4. **Force-directed layout** - Physics-based automatic arrangement
5. **Circular layout** - Arrange by layer in concentric circles

#### Layout Types:

**Grid Layout:**
- Simple √n × √n grid
- No layer awareness
- Good for: Small vaults (<20 diagrams)

**Hierarchical Layout:** (Current)
- Layer-based vertical arrangement
- Good for: Understanding architectural flow

**Force-Directed Layout:**
- Physics simulation (attracts connected nodes, repels unconnected)
- Good for: Discovering unexpected relationships
- Library: Use React Flow's built-in layout or D3.js

**Circular Layout:**
- Layers as concentric circles
- Market (center) → Code (outer ring)
- Good for: High-level overview

#### Implementation Tasks:
- [ ] Create `LayoutEngine` interface
- [ ] Implement each layout algorithm
- [ ] Add layout selector to graph view toolbar
- [ ] Save layout preference to settings
- [ ] Add keyboard shortcuts (L = toggle layout)

#### Files to Create:
- `src/services/layout/LayoutEngine.ts` - Interface
- `src/services/layout/GridLayout.ts`
- `src/services/layout/HierarchicalLayout.ts` (extract current)
- `src/services/layout/ForceDirectedLayout.ts`
- `src/services/layout/CircularLayout.ts`

---

### 🔍 Phase 4: Filtering & Search (MEDIUM PRIORITY)

**Estimated Effort:** 3-4 hours
**Target:** v2.1.0

**Goal:** Filter and search graph to focus on specific areas.

#### Features:

**1. Layer Filtering**
- Checkboxes for each layer
- Show/hide specific layers
- "Show only Market → Capability" view
- "Show only Context → Code" view

**2. Diagram Search**
- Search input field in toolbar
- Highlight matching diagrams
- Dim non-matching diagrams
- Jump to first match (Enter key)

**3. Connection Filtering**
- "Show only connected to [diagram]"
- "Show isolated diagrams" (no connections)
- "Show hub diagrams" (>5 connections)

#### UI Mockup:
```
┌─────────────────────────────────────────────────────┐
│ Graph View                                   [×]    │
├─────────────────────────────────────────────────────┤
│ Search: [____________]  Layout: [Hierarchical ▼]   │
│                                                     │
│ Layers:  ☑ Market  ☑ Organisation  ☑ Capability   │
│          ☑ Context ☑ Container     ☑ Component     │
│          ☑ Code                                     │
│                                                     │
│ [Canvas with filtered diagram nodes]               │
└─────────────────────────────────────────────────────┘
```

#### Implementation Tasks:
- [ ] Add toolbar UI components
- [ ] Filter nodes/edges based on criteria
- [ ] Highlight/dim nodes based on search
- [ ] Update React Flow data on filter change
- [ ] Save filter state to session storage

#### Files to Modify:
- `src/services/graph-generation-service.ts` - Add filtering logic
- `src/ui/components/GraphToolbar.tsx` - NEW FILE
- `src/main.ts` - Update graph view command

---

### 📊 Phase 5: Statistics & Analytics (LOW PRIORITY)

**Estimated Effort:** 2-3 hours
**Target:** v2.1.0

**Goal:** Provide insights into architecture documentation structure.

#### Features:

**1. Layer Distribution Panel**
```
Layer Distribution:
├─ Market:        3 diagrams (4%)
├─ Organisation:  5 diagrams (7%)
├─ Capability:   12 diagrams (17%)
├─ Context:       8 diagrams (11%)
├─ Container:    15 diagrams (21%)
├─ Component:    23 diagrams (32%)
└─ Code:          6 diagrams (8%)

Total: 72 diagrams
```

**2. Connection Statistics**
- Most connected diagram
- Isolated diagrams (0 connections)
- Average connections per diagram
- Layer connectivity matrix

**3. Coverage Analysis**
- Which layers are under-documented?
- Orphan diagrams (no parents/children)
- Suggested next diagrams to create

#### Implementation Tasks:
- [ ] Calculate statistics from graph data
- [ ] Create statistics panel component
- [ ] Add "Show Statistics" toggle button
- [ ] Export statistics as CSV/JSON

#### Files to Create:
- `src/services/graph-statistics-service.ts`
- `src/ui/components/GraphStatisticsPanel.tsx`

---

### 🎯 Phase 6: Advanced Interactions (LOW PRIORITY)

**Estimated Effort:** 4-5 hours
**Target:** v2.2.0

**Goal:** Power-user features for managing large architecture vaults.

#### Features:

**1. Multi-Select Nodes**
- Shift+Click to select multiple
- Ctrl+A to select all
- Operations: Delete, Export, Bulk edit

**2. Node Pinning**
- Pin specific nodes to prevent auto-layout
- Useful for preserving important positions
- Visual indicator (pin icon)

**3. Minimap**
- Small overview in corner
- Shows current viewport
- Click to navigate

**4. Zoom to Layer**
- Double-click layer name to zoom
- "Fit Layer" command
- Keyboard shortcuts (1-7 for layers)

**5. Export Options**
- Export visible graph as PNG
- Export to SVG (vector)
- Export to Mermaid diagram
- Export statistics report

#### Implementation Tasks:
- [ ] Multi-select logic (React Flow supports this)
- [ ] Pin/unpin node state
- [ ] Minimap component (React Flow has this)
- [ ] Zoom-to-layer animations
- [ ] Export service with multiple formats

---

## Not Recommended (From Extended Graph)

These features don't align with BAC4's use case:

- ❌ **Node images** - Not relevant for architecture diagrams
- ❌ **Tag-based filtering** - BAC4 uses layer types, not tags
- ❌ **SVG export of graph** - Canvas already supports PNG/SVG export
- ❌ **Search result integration** - Not applicable to diagram relationships
- ❌ **Bitmap rendering optimization** - Canvas handles performance

---

## Implementation Priority

### Immediate (v2.0.1)
1. ✅ **Hierarchical Layout** - DONE
2. ✅ **Dynamic Node Sizing** - DONE
3. 🔄 **Persistent Layout** - Next up

### Short-term (v2.0.2 - v2.1.0)
4. Layout Options (Grid, Force-Directed, Circular)
5. Layer Filtering
6. Diagram Search
7. Statistics Panel

### Long-term (v2.2.0+)
8. Multi-select nodes
9. Node pinning
10. Minimap
11. Zoom to layer
12. Advanced export options

---

## Testing Plan

### Phase 1 Testing (Hierarchical Layout)
- [x] Create diagrams across all 7 layers
- [ ] Verify layers appear top-to-bottom
- [ ] Check node sizes scale with connections
- [ ] Confirm edges connect correctly
- [ ] Test with empty layers (should skip)
- [ ] Test with single diagram per layer
- [ ] Test with many diagrams per layer (>10)

### Phase 2 Testing (Persistent Layout)
- [ ] Move nodes manually in Canvas
- [ ] Reload graph - positions should persist
- [ ] Add new diagram - should auto-position
- [ ] Delete diagram - layout should update
- [ ] Rename diagram - layout should follow
- [ ] Reset layout - should restore defaults

### Phase 3 Testing (Layout Options)
- [ ] Switch between layouts - should animate
- [ ] Verify each layout renders correctly
- [ ] Test layout preference persistence
- [ ] Check keyboard shortcuts work

---

## Success Metrics

**User Experience:**
- Time to find specific diagram: <5 seconds (vs 30+ seconds with grid)
- User satisfaction with layout: 9/10
- Graph view usage frequency: +300% (users actually use it)

**Technical:**
- Graph generation time: <500ms for 100 diagrams
- Memory usage: <50MB for 100 diagrams
- Canvas render performance: 60fps

**Adoption:**
- % of users who use graph view weekly: >70%
- Average time spent in graph view per session: >2 minutes
- Feature requests for graph view: +200% (indicates interest)

---

## Technical Considerations

### Performance
- React Flow handles up to 1000 nodes well
- Expect most vaults to have <100 diagrams
- Use virtualization if needed (React Flow supports this)

### Compatibility
- Ensure Canvas export still works
- Maintain backward compatibility with .bac4 files
- Don't break existing diagram relationships

### Accessibility
- Keyboard navigation (Tab, Arrow keys)
- Screen reader support (ARIA labels)
- High contrast mode compatibility

---

## Resources

### Inspired By:
- [Extended Graph Plugin](https://github.com/ElsaTam/obsidian-extended-graph)
- [Juggl Plugin](https://juggl.io/)
- [React Flow](https://reactflow.dev/)

### Libraries:
- React Flow (already in use)
- D3.js (for force-directed layout)
- js-colormaps (if needed for advanced styling)

### Documentation:
- [React Flow Layout Guide](https://reactflow.dev/examples/layout)
- [JSONCanvas Spec](https://jsoncanvas.org/)

---

## Changelog

**2025-10-19:**
- ✅ Implemented Phase 1: Hierarchical Layout
- ✅ Implemented Dynamic Node Sizing
- Created comprehensive roadmap for Phases 2-6
- Deployed to test vault for validation

---

## Next Steps

1. **Test hierarchical layout** in real vault with diverse diagrams
2. **Gather user feedback** on layout effectiveness
3. **Implement Phase 2** (Persistent Layout) if feedback is positive
4. **Iterate** based on actual usage patterns

---

**Questions? Suggestions?**
File an issue at: https://github.com/DavidROliverBA/bac4/issues
