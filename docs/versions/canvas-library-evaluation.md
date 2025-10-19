# Canvas Library Evaluation - Story 2.1

**Date:** 2025-10-09
**Status:** Completed
**Decision:** React Flow (now XyFlow)

## Context

BAC4 requires a canvas library to render C4 architecture diagrams with:
- Structured node-based layouts (boxes representing systems, containers, components)
- Directional connections between nodes (relationships)
- Cloud provider icons (AWS/Azure/GCP services)
- Zoom and pan capabilities
- Drag-and-drop positioning
- Export capabilities
- Integration with Obsidian plugin architecture

## Options Evaluated

### 1. React Flow (XyFlow)
**Strengths:**
- Purpose-built for node-based diagrams with connections
- 693,543 weekly npm downloads (proven adoption)
- Highly customizable nodes and edges
- Built-in zoom, pan, minimap
- Strong TypeScript support
- Active development (rebranded to XyFlow in 2025)
- Perfect fit for C4 model's hierarchical node structure
- Examples of architecture diagrams with custom icons
- Edge routing and connection validation

**Weaknesses:**
- React dependency (adds framework complexity to Obsidian plugin)
- Learning curve for advanced customization
- Bundle size considerations

**C4 Model Fit:** ⭐⭐⭐⭐⭐
- Excellent for Context, Container, Component diagrams
- Natural representation of systems as nodes
- Edges perfectly represent relationships
- Hierarchical zoom levels align with C4 abstraction levels

### 2. Konva / react-konva
**Strengths:**
- Low-level canvas control
- High performance for complex graphics
- 693,543 weekly downloads
- Animations and transitions
- Layering and filtering capabilities

**Weaknesses:**
- Too low-level for structured diagrams
- Would require building node/edge system from scratch
- Performance concerns with many event listeners
- Not designed for architecture diagrams

**C4 Model Fit:** ⭐⭐⭐
- Would work but requires significant custom implementation
- Better suited for freeform drawing than structured diagrams

### 3. Excalidraw
**Strengths:**
- Existing Obsidian plugin with proven integration
- Hand-drawn aesthetic (unique visual style)
- Excellent for quick sketches
- Built-in collaboration features
- Simple and intuitive

**Weaknesses:**
- 237 weekly npm downloads (much smaller ecosystem)
- Sketch-style doesn't match enterprise C4 diagram expectations
- Less structured (freeform drawing vs. node-based)
- Obsidian plugin reported stability issues
- Not designed for programmatic diagram generation
- Limited for precise technical architecture diagrams

**C4 Model Fit:** ⭐⭐
- Better for brainstorming than formal architecture documentation
- Lacks structured node/relationship model
- Visual style may not be professional enough for enterprise use

## Decision

**Selected: React Flow (XyFlow)**

### Rationale

1. **Perfect Semantic Match:** React Flow's node-edge model directly maps to C4's system-relationship model
2. **Structured Diagrams:** C4 requires precise, structured layouts - not freeform sketches
3. **Enterprise Requirements:** BAC4 targets enterprise architects who need professional, formal diagrams
4. **Customization:** Custom nodes can represent different component types (AWS Lambda, S3, etc.)
5. **Programmatic Generation:** React Flow supports AI-assisted diagram generation (future MCP integration)
6. **Active Development:** Recent rebrand to XyFlow shows continued investment
7. **TypeScript Native:** Aligns with BAC4's strict TypeScript configuration

### Implementation Plan

1. **Obsidian + React Integration:**
   - Use `ReactDOM.render()` to mount React Flow in Obsidian view container
   - Wrap in custom Obsidian ItemView class
   - Handle lifecycle (mount/unmount)

2. **Custom Node Types:**
   - C4Context node (system boundary)
   - C4Container node (deployment units)
   - C4Component node (code components)
   - AWSService node (with AWS icon library)
   - AzureService node
   - GCPService node

3. **Edge Types:**
   - DirectionalEdge (with arrow)
   - BidirectionalEdge
   - AsyncEdge (dotted line for async communication)

4. **State Management:**
   - Store React Flow state in JSON format
   - Use file-io.ts utilities for persistence
   - Support undo/redo

5. **Bundle Size Mitigation:**
   - Use esbuild tree-shaking
   - Lazy-load React Flow only when canvas view opens
   - External: obsidian (don't bundle)

## Next Steps

1. Install dependencies: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `reactflow`
2. Create custom Obsidian ItemView for canvas
3. Implement React Flow wrapper component
4. Create initial custom node types
5. Add persistence layer

## References

- React Flow: https://reactflow.dev
- C4 Model: https://c4model.com
- Obsidian API: https://github.com/obsidianmd/obsidian-api
- npm trends: https://npmtrends.com/excalidraw-vs-konva-vs-reactflow

## ADR Update Required

This decision should be recorded in `docs/architecture.md` as:
- **ADR-004:** Canvas Library Selection - React Flow chosen for structured node-based C4 diagrams
