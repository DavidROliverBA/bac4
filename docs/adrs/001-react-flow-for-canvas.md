# ADR 001: Use React Flow for Canvas Implementation

**Date:** 2025-10-12
**Status:** Accepted
**Deciders:** Development Team
**Related:** Canvas Editor, Diagram Visualization

---

## Context

BAC4 Plugin requires a visual canvas for creating and editing C4 architecture diagrams. We need a solution that supports:
- Interactive node manipulation (drag, select, connect)
- Custom node rendering (different shapes, colors, icons for each C4 level)
- Edge creation with custom labels and directions
- Zoom, pan, and viewport management
- Export to image formats (PNG, SVG, JPEG)
- Performance with 50+ nodes

## Decision

**We chose React Flow (XyFlow) as the canvas library.**

## Alternatives Considered

### 1. **React Flow** (CHOSEN)
- **Pros:**
  - Built for React (matches our tech stack)
  - Extensive documentation and examples
  - Custom node/edge support
  - Built-in zoom, pan, mini-map
  - Strong performance (viewport culling, virtual rendering)
  - Active development and community
  - MIT license
- **Cons:**
  - Large bundle size (~200KB)
  - Learning curve for advanced features
  - Some features require Pro license (we don't use them)

### 2. **Canvas API (Raw)**
- **Pros:**
  - Full control over rendering
  - No dependencies
  - Smallest bundle size
- **Cons:**
  - High implementation complexity
  - Need to implement ALL features from scratch (zoom, pan, selection, etc.)
  - Significant maintenance burden
  - No React integration
  - Estimated 3-4 weeks development time

### 3. **D3.js**
- **Pros:**
  - Powerful visualization library
  - Flexible and customizable
  - Well-established
- **Cons:**
  - Not React-native (requires workarounds)
  - Primarily for data visualization, not interactive diagrams
  - Complex API for diagram editing
  - Manual state management

### 4. **GoJS**
- **Pros:**
  - Specifically designed for diagrams
  - Rich feature set
  - Good performance
- **Cons:**
  - Commercial license required ($1,000+)
  - Not React-native
  - Licensing incompatible with open-source plugin

### 5. **Cytoscape.js**
- **Pros:**
  - Graph visualization library
  - Open source
  - Good for network diagrams
- **Cons:**
  - Designed for graphs, not hierarchical diagrams
  - Limited custom node rendering
  - Not React-native

## Rationale

React Flow was selected because:

1. **React Integration:** Seamlessly integrates with our React-based UI, making custom nodes simple React components
2. **Feature Complete:** Provides all needed features out-of-the-box (zoom, pan, selection, connections)
3. **Customization:** Easy to create custom node types (SystemNode, PersonNode, ContainerNode, etc.)
4. **Performance:** Built-in optimizations for large diagrams (viewport culling, virtual rendering)
5. **Export:** Built-in support for exporting to images (with html-to-image)
6. **Community:** Large community, active development, extensive examples
7. **License:** MIT license compatible with open-source Obsidian plugin
8. **Developer Experience:** Excellent documentation, TypeScript support, clear API

## Consequences

### Positive

- ✅ **Fast Development:** Saved 3-4 weeks of canvas implementation time
- ✅ **Maintainability:** Well-documented library with community support
- ✅ **Features:** Built-in zoom, pan, minimap, background, controls
- ✅ **Custom Nodes:** Easy to create C4-specific node types
- ✅ **Performance:** Handles 50+ nodes smoothly
- ✅ **Export:** Simple image export with html-to-image integration

### Negative

- ⚠️ **Bundle Size:** Adds ~200KB to plugin bundle (acceptable for Obsidian plugin)
- ⚠️ **Dependency:** Reliant on external library (mitigated by active development)
- ⚠️ **Learning Curve:** Team needs to learn React Flow API (documentation helps)

### Neutral

- 📝 **Updates:** Need to track React Flow updates (generally non-breaking)
- 📝 **Custom Features:** Some advanced features may require React Flow Pro or custom implementation

## Implementation Details

**Key Integration Points:**
- `src/ui/canvas-view.tsx` - Main React Flow wrapper
- `src/ui/nodes/` - Custom node components (SystemNode, ContainerNode, etc.)
- `src/ui/edges/DirectionalEdge.tsx` - Custom edge with directional arrows
- Custom hooks: `useNodeHandlers`, `useEdgeHandlers`, `useCanvasState`

**Configuration:**
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}  // Custom node types
  edgeTypes={edgeTypes}  // Custom edge types
  fitView
  minZoom={0.1}
  maxZoom={4}
  connectionMode={ConnectionMode.Loose}
  proOptions={{ hideAttribution: true }}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

## References

- React Flow Documentation: https://reactflow.dev/
- Canvas Library Evaluation: `docs/canvas-library-evaluation.md`
- React Flow GitHub: https://github.com/xyflow/xyflow

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-10-12 | Development Team | Initial ADR |
