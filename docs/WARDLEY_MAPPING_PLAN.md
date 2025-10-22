# Wardley Mapping Implementation Plan for BAC4

**Status:** Planning Phase
**Version:** 1.0.0 (Draft)
**Last Updated:** 2025-10-20
**Target Release:** v3.0.0

---

## Executive Summary

This document analyzes different approaches for implementing Wardley Mapping capabilities in BAC4 and provides a comprehensive implementation roadmap.

**Recommendation:** **Option C - Custom React Flow Implementation** with OWM export compatibility.

**Rationale:** Best alignment with BAC4's existing architecture, full control over features, and superior integration with the 7-layer enterprise architecture model.

---

## Table of Contents

1. [What is Wardley Mapping?](#what-is-wardley-mapping)
2. [Why Add Wardley Maps to BAC4?](#why-add-wardley-maps-to-bac4)
3. [Technology Comparison](#technology-comparison)
4. [Recommended Approach](#recommended-approach)
5. [Data Structure Design](#data-structure-design)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Integration with BAC4 Layers](#integration-with-bac4-layers)
8. [Success Metrics](#success-metrics)

---

## What is Wardley Mapping?

### Overview

Wardley Mapping is a strategic planning tool invented by Simon Wardley for visualizing the value chain and evolution of components in a business or technical system.

### Core Concepts

**Axes:**
- **Y-Axis (Vertical)**: Value Chain / Visibility to User
  - Top: Visible to user (user needs)
  - Bottom: Invisible to user (infrastructure, commodities)
- **X-Axis (Horizontal)**: Evolution Stage
  - Genesis (0.0-0.25): Novel, uncertain, poorly understood
  - Custom (0.25-0.50): Bespoke solutions, requires specialist knowledge
  - Product (0.50-0.75): Off-the-shelf products, well-understood
  - Commodity (0.75-1.0): Utility, standardized, automated

**Key Elements:**
- **Components**: Nodes representing capabilities, systems, or resources
- **Dependencies**: Arrows showing which components depend on others
- **Evolution**: Movement of components along the X-axis over time
- **Inertia**: Resistance to change (shown as a barrier)
- **Annotations**: Notes explaining strategic decisions

### Strategic Value

Wardley Maps help organizations:
- Identify opportunities for innovation or commoditization
- Understand competitive positioning
- Make build vs buy vs outsource decisions
- Plan technology evolution
- Communicate strategy visually

---

## Why Add Wardley Maps to BAC4?

### Alignment with Enterprise Architecture

BAC4's 7-layer model (Market → Organisation → Capability → Context → Container → Component → Code) naturally complements Wardley Mapping:

1. **Market Layer** → Wardley Maps show market forces and competitive positioning
2. **Capability Layer** → Maps reveal which capabilities are strategic vs commodity
3. **Context/Container/Component** → Maps guide build/buy/outsource decisions
4. **Code Layer** → Maps inform technology choices and evolution

### Use Cases

**For Solution Architects:**
- Map technology landscape evolution
- Justify cloud migration strategies
- Identify technical debt and modernization opportunities

**For Business Architects:**
- Visualize business capability maturity
- Plan organizational transformation
- Communicate strategy to stakeholders

**For Product Managers:**
- Position products against competition
- Identify market opportunities
- Plan product roadmap evolution

### Competitive Advantage

**Existing Obsidian Wardley Maps Plugin:**
- Uses OnlineWardleyMaps engine
- Text-based (OWM format)
- Separate from BAC4 architecture model

**BAC4 + Wardley Maps Integration:**
- **Unified model**: Link Wardley Maps to BAC4 layers
- **Visual editor**: Same UX as existing BAC4 diagrams
- **Cross-referencing**: Navigate from Capability → Wardley Map → Context Diagram
- **Evolution tracking**: Version control with timeline snapshots
- **Strategic insights**: Analyze architecture through strategic lens

---

## Technology Comparison

### Option A: Integrate Existing Obsidian Wardley Maps Plugin

**Approach:** Use the community Wardley Maps plugin alongside BAC4.

#### Pros
- ✅ **Zero development effort**: Plugin already exists
- ✅ **OWM compatibility**: Uses standard OnlineWardleyMaps format
- ✅ **Community support**: Maintained by Wardley Maps community
- ✅ **Text-based**: Maps-as-code approach
- ✅ **Quick deployment**: Install plugin and start mapping

#### Cons
- ❌ **No BAC4 integration**: Separate from 7-layer architecture model
- ❌ **No cross-referencing**: Can't link to .bac4 diagrams
- ❌ **No timeline**: No snapshot history like BAC4 diagrams
- ❌ **Different UX**: Text-based vs visual editor
- ❌ **No layer validation**: Can't enforce Capability → Wardley Map relationships
- ❌ **Limited customization**: Can't extend for enterprise architecture needs

#### Verdict
✅ **Good for**: Users who want basic Wardley Mapping without integration
❌ **Bad for**: Users who want Wardley Maps as part of their enterprise architecture model

---

### Option B: Canvas-Based Implementation (Like Graph View)

**Approach:** Use Obsidian's native Canvas format to create Wardley Maps.

#### Pros
- ✅ **Native Obsidian**: Better integration with Obsidian ecosystem
- ✅ **Familiar UX**: Same Canvas interface users already know
- ✅ **File linking**: Can link to .bac4 diagrams
- ✅ **Simple implementation**: Similar to existing graph view
- ✅ **Performance**: Canvas handles large maps well

#### Cons
- ❌ **Limited programmatic control**: Canvas API restrictions (learned from Phase 6)
- ❌ **No axis rendering**: Can't draw labeled X/Y axes easily
- ❌ **No grid snapping**: Wardley Maps need precise positioning
- ❌ **No evolution visualization**: Can't show movement over time
- ❌ **No inertia indicators**: Can't render inertia barriers
- ❌ **Export limitations**: No OWM format export
- ❌ **Coordinate system**: Canvas uses pixels, Wardley Maps use 0-1 scale

#### Verdict
✅ **Good for**: Simple maps without advanced features
❌ **Bad for**: Professional Wardley Mapping with evolution tracking

---

### Option C: Custom React Flow Implementation (Like Diagram Editor)

**Approach:** Extend BAC4's existing React Flow diagram editor to support Wardley Maps.

#### Pros
- ✅ **Full control**: Complete customization of features
- ✅ **BAC4 integration**: Native support for .bac4 format
- ✅ **Cross-referencing**: Link Wardley Maps to other diagrams
- ✅ **Timeline support**: Use existing snapshot system
- ✅ **Axis rendering**: Draw labeled X/Y axes with grid
- ✅ **Evolution visualization**: Show component movement over time
- ✅ **Inertia indicators**: Custom node types for inertia barriers
- ✅ **Coordinate system**: Map 0-1 scale to canvas pixels
- ✅ **OWM export**: Convert .bac4 → OWM format
- ✅ **Consistent UX**: Same editor as Context/Container/Component diagrams
- ✅ **Layer validation**: Enforce Wardley Maps only in specific layers
- ✅ **Extensibility**: Add enterprise architecture-specific features

#### Cons
- ❌ **Development effort**: ~40-60 hours of implementation
- ❌ **Maintenance burden**: Another diagram type to maintain
- ❌ **Learning curve**: Users familiar with OWM need to learn BAC4 UX
- ❌ **Bundle size**: Additional 20-30kb for Wardley Map components

#### Verdict
✅ **Good for**: Professional enterprise architecture with integrated Wardley Mapping
✅ **Best alignment**: Fits perfectly with BAC4's vision and architecture

---

### Option D: Hybrid Approach

**Approach:** Support both OWM text files (.wm) and visual .bac4 Wardley Maps.

#### Pros
- ✅ **Best of both worlds**: Text-based for speed, visual for clarity
- ✅ **OWM compatibility**: Import/export standard format
- ✅ **Flexibility**: Users choose their preferred workflow
- ✅ **Migration path**: Import existing .wm files to BAC4

#### Cons
- ❌ **Complexity**: Two implementations to maintain
- ❌ **Sync issues**: Keeping .wm and .bac4 in sync
- ❌ **Confusion**: Users unsure which format to use

#### Verdict
✅ **Good for**: Power users who want both approaches
❌ **Bad for**: Initial implementation (too complex)
💡 **Consider for**: Future enhancement (v3.1.0+)

---

## Recommended Approach

### Option C: Custom React Flow Implementation

**Why This is the Best Choice:**

1. **Strategic Alignment**: Wardley Mapping is about strategic planning. Integrating it into BAC4's architecture model makes strategy a first-class concern.

2. **Unified Workflow**: Architects work in one tool, not switching between BAC4 and a separate Wardley Maps plugin.

3. **Cross-Layer Insights**: Link Capability diagrams to Wardley Maps, Wardley Maps to Context diagrams, enabling drill-down from strategy to implementation.

4. **Evolution Tracking**: BAC4's timeline feature is perfect for tracking how components evolve over quarters/years.

5. **Extensibility**: Can add enterprise architecture-specific features (e.g., "Component Maturity Heatmap", "Strategic Alignment Score").

### Implementation Philosophy

**Start Simple, Evolve Over Time:**

- **Phase 1**: Core Wardley Map editor (components, dependencies, axes)
- **Phase 2**: Evolution and inertia features
- **Phase 3**: OWM import/export
- **Phase 4**: Enterprise architecture enhancements

---

## Data Structure Design

### .bac4 File Format Extension

Add a new `diagramType: "wardley"` to support Wardley Maps.

### Wardley Map Data Structure

```typescript
{
  "version": "1.0.0",
  "metadata": {
    "diagramType": "wardley",
    "title": "E-Commerce Platform Strategy",
    "description": "Strategic map for modernizing e-commerce platform",
    "createdAt": "2025-10-20T10:00:00Z",
    "updatedAt": "2025-10-20T14:30:00Z"
  },
  "timeline": {
    "snapshots": [
      {
        "id": "snapshot-1729425600000-abc123",
        "label": "Current State (Q4 2025)",
        "timestamp": "2025-10-20T10:00:00Z",
        "description": "Current e-commerce platform architecture",
        "createdAt": "2025-10-20T10:00:00Z",
        "nodes": [
          {
            "id": "customer",
            "type": "wardley-component",
            "width": 120,
            "height": 60,
            "data": {
              "label": "Customer",
              "description": "Online shoppers",
              "visibility": 0.95,        // Y-axis: 0 (bottom) to 1 (top)
              "evolution": 0.15,         // X-axis: 0 (genesis) to 1 (commodity)
              "evolutionStage": "genesis", // "genesis" | "custom" | "product" | "commodity"
              "inertia": false,
              "color": "#3b82f6"
            },
            "x": 150,                     // Calculated from evolution (0-1 → canvas pixels)
            "y": 50                       // Calculated from visibility (0-1 → canvas pixels)
          },
          {
            "id": "web-app",
            "type": "wardley-component",
            "width": 120,
            "height": 60,
            "data": {
              "label": "Web Application",
              "description": "React-based SPA",
              "linkedDiagramPath": "BA-Engineering/5-Container/ECommerce-Containers.bac4",
              "visibility": 0.75,
              "evolution": 0.60,
              "evolutionStage": "product",
              "inertia": false,
              "color": "#06b6d4"
            },
            "x": 600,
            "y": 250
          },
          {
            "id": "payment-api",
            "type": "wardley-component",
            "width": 120,
            "height": 60,
            "data": {
              "label": "Payment API",
              "description": "Stripe integration",
              "visibility": 0.50,
              "evolution": 0.85,
              "evolutionStage": "commodity",
              "inertia": false,
              "color": "#10b981"
            },
            "x": 850,
            "y": 500
          },
          {
            "id": "legacy-db",
            "type": "wardley-inertia",
            "width": 140,
            "height": 60,
            "data": {
              "label": "Legacy Database",
              "description": "Oracle DB, difficult to migrate",
              "visibility": 0.30,
              "evolution": 0.40,
              "evolutionStage": "custom",
              "inertia": true,
              "inertiaReason": "Regulatory compliance, migration cost",
              "color": "#ef4444"
            },
            "x": 400,
            "y": 700
          }
        ],
        "edges": [
          {
            "id": "edge-1",
            "source": "customer",
            "target": "web-app",
            "type": "wardley-dependency",
            "data": {
              "label": "Uses",
              "direction": "down"    // Dependencies flow down the value chain
            },
            "markerEnd": {
              "type": "arrowclosed",
              "width": 15,
              "height": 15,
              "color": "#888888"
            },
            "sourceHandle": "bottom",
            "targetHandle": "top"
          },
          {
            "id": "edge-2",
            "source": "web-app",
            "target": "payment-api",
            "type": "wardley-dependency",
            "data": {
              "label": "Calls",
              "direction": "down"
            },
            "markerEnd": {
              "type": "arrowclosed",
              "width": 15,
              "height": 15,
              "color": "#888888"
            },
            "sourceHandle": "bottom",
            "targetHandle": "top"
          },
          {
            "id": "edge-3",
            "source": "web-app",
            "target": "legacy-db",
            "type": "wardley-dependency",
            "data": {
              "label": "Reads/Writes",
              "direction": "down"
            },
            "markerEnd": {
              "type": "arrowclosed",
              "width": 15,
              "height": 15,
              "color": "#888888"
            },
            "sourceHandle": "bottom",
            "targetHandle": "top"
          }
        ],
        "annotations": [
          {
            "id": "annotation-1",
            "x": 300,
            "y": 100,
            "width": 200,
            "height": 80,
            "text": "**Strategic Decision**: Migrate to cloud-native architecture by Q2 2026",
            "style": {
              "backgroundColor": "#fef3c7",
              "borderColor": "#f59e0b"
            }
          }
        ],
        "config": {
          "axisLabels": {
            "x": {
              "genesis": "Genesis",
              "custom": "Custom Built",
              "product": "Product",
              "commodity": "Commodity"
            },
            "y": {
              "top": "Visible",
              "bottom": "Invisible"
            }
          },
          "gridEnabled": true,
          "evolutionMarkersEnabled": true
        }
      },
      {
        "id": "snapshot-1729429200000-def456",
        "label": "Future State (Q2 2026)",
        "timestamp": "2026-04-01T00:00:00Z",
        "description": "Cloud-native platform after migration",
        "createdAt": "2025-10-20T11:00:00Z",
        "nodes": [
          // Same components but with evolved positions
          {
            "id": "customer",
            "type": "wardley-component",
            "width": 120,
            "height": 60,
            "data": {
              "label": "Customer",
              "visibility": 0.95,
              "evolution": 0.20,        // Slight evolution
              "evolutionStage": "custom",
              "inertia": false
            },
            "x": 200,
            "y": 50
          },
          {
            "id": "web-app",
            "type": "wardley-component",
            "width": 120,
            "height": 60,
            "data": {
              "label": "Web Application",
              "visibility": 0.75,
              "evolution": 0.75,        // Moved to commodity (serverless)
              "evolutionStage": "commodity",
              "inertia": false
            },
            "x": 750,
            "y": 250
          },
          {
            "id": "legacy-db",
            "type": "wardley-component",
            "width": 120,
            "height": 60,
            "data": {
              "label": "Cloud Database",
              "description": "Migrated to managed Snowflake",
              "visibility": 0.30,
              "evolution": 0.80,        // Moved to commodity (managed service)
              "evolutionStage": "commodity",
              "inertia": false,         // Inertia removed after migration
              "color": "#10b981"
            },
            "x": 800,
            "y": 700
          }
        ],
        "edges": [...],
        "annotations": [...]
      }
    ],
    "currentSnapshotId": "snapshot-1729425600000-abc123",
    "snapshotOrder": [
      "snapshot-1729425600000-abc123",
      "snapshot-1729429200000-def456"
    ]
  }
}
```

### Node Types

**WardleyComponentNode:**
- Standard Wardley Map component
- Positioned by (visibility, evolution)
- Can have inertia flag
- Color-coded by evolution stage

**WardleyInertiaNode:**
- Special node type for inertia barriers
- Rendered with barrier/wall visual
- Includes `inertiaReason` field

**Anchor Node (optional):**
- Fixed visible user need at top
- Not movable (always y=0.95)

### Evolution Stages

```typescript
type EvolutionStage = "genesis" | "custom" | "product" | "commodity";

const EVOLUTION_RANGES = {
  genesis: [0.00, 0.25],
  custom: [0.25, 0.50],
  product: [0.50, 0.75],
  commodity: [0.75, 1.00]
};
```

### Coordinate Mapping

**Wardley Coordinates (0-1 scale):**
- `visibility`: 0 (invisible/bottom) → 1 (visible/top)
- `evolution`: 0 (genesis/left) → 1 (commodity/right)

**Canvas Coordinates (pixels):**
```typescript
// Canvas dimensions
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 800;
const MARGIN = 100;

// Convert Wardley → Canvas
function wardleyToCanvas(visibility: number, evolution: number): { x: number; y: number } {
  return {
    x: MARGIN + (evolution * (CANVAS_WIDTH - 2 * MARGIN)),
    y: MARGIN + ((1 - visibility) * (CANVAS_HEIGHT - 2 * MARGIN))  // Flip Y-axis
  };
}

// Convert Canvas → Wardley
function canvasToWardley(x: number, y: number): { visibility: number; evolution: number } {
  return {
    evolution: (x - MARGIN) / (CANVAS_WIDTH - 2 * MARGIN),
    visibility: 1 - ((y - MARGIN) / (CANVAS_HEIGHT - 2 * MARGIN))  // Flip Y-axis
  };
}
```

---

## Implementation Roadmap

### Phase 1: Core Wardley Map Editor (v3.0.0)

**Estimated Effort:** 20-25 hours
**Target:** Q1 2026

#### Features

1. **New Diagram Type: Wardley**
   - Add `diagramType: "wardley"` to constants
   - Create Wardley Map command in command palette
   - Update layer validation (allow Wardley Maps in Capability/Context layers)

2. **Wardley Component Node Type**
   - Custom React Flow node component
   - Displays component name and position
   - Color-coded by evolution stage
   - Draggable within canvas bounds

3. **Axes Rendering**
   - Draw X-axis with evolution stage labels (Genesis → Custom → Product → Commodity)
   - Draw Y-axis with visibility labels (Visible/Invisible)
   - Grid lines at stage boundaries (0.25, 0.50, 0.75)

4. **Component Positioning**
   - Click to add component
   - Drag to reposition (snaps to grid)
   - PropertyPanel shows visibility/evolution coordinates
   - Auto-calculate evolution stage from position

5. **Dependencies**
   - Draw edges between components
   - Dependencies flow down value chain (top → bottom)
   - Arrow style matches C4 diagrams

6. **PropertyPanel Integration**
   - Edit component name, description
   - Set visibility (0-1) and evolution (0-1)
   - Link to other diagrams (linkedDiagramPath)
   - Toggle inertia flag

7. **Timeline Support**
   - Use existing snapshot system
   - Create multiple snapshots for evolution over time
   - Switch between "Current State" and "Future State" snapshots

#### Implementation Tasks

- [ ] Create `WardleyComponentNode.tsx` - Custom node component
- [ ] Create `WardleyCanvas.tsx` - Canvas with axes and grid
- [ ] Create `WardleyPropertyPanel.tsx` - Wardley-specific properties
- [ ] Update `canvas-types.ts` - Add `WardleyNodeData` type
- [ ] Update `layer-validation.ts` - Allow Wardley Maps in Capability layer
- [ ] Update `command-constants.ts` - Add "Create Wardley Map" command
- [ ] Create `wardley-utils.ts` - Coordinate mapping utilities
- [ ] Update `useFileOperations.ts` - Handle Wardley Map file operations

#### Files to Create

```
src/ui/nodes/WardleyComponentNode.tsx      (180 lines)
src/ui/canvas/WardleyCanvas.tsx            (250 lines)
src/ui/canvas/WardleyPropertyPanel.tsx     (200 lines)
src/utils/wardley-utils.ts                 (120 lines)
src/types/wardley-types.ts                 (80 lines)
```

#### Files to Modify

```
src/types/canvas-types.ts                  (+30 lines)
src/constants/command-constants.ts         (+5 lines)
src/utils/layer-validation.ts              (+10 lines)
src/ui/canvas/hooks/useFileOperations.ts   (+20 lines)
src/main.ts                                (+15 lines)
```

#### Testing Plan

- [ ] Create Wardley Map for BA Engineering example
- [ ] Add components with different evolution stages
- [ ] Draw dependencies between components
- [ ] Create multiple snapshots (current vs future state)
- [ ] Link Wardley Map to Capability diagram
- [ ] Test coordinate mapping (0-1 scale → pixels)
- [ ] Verify axes and grid render correctly

---

### Phase 2: Evolution & Inertia Features (v3.1.0)

**Estimated Effort:** 15-20 hours
**Target:** Q2 2026

#### Features

1. **Inertia Barriers**
   - Special node type for inertia
   - Rendered as a barrier/wall to the right of component
   - PropertyPanel field for inertia reason
   - Visual indicator (red/orange color, different shape)

2. **Evolution Animation**
   - Animate component movement between snapshots
   - Show evolution paths (dotted lines from old → new position)
   - "Play" button to animate through timeline
   - Speed control (1x, 2x, 5x)

3. **Evolution Markers**
   - Show stage boundary lines (0.25, 0.50, 0.75)
   - Label each stage region
   - Highlight components crossing boundaries

4. **Movement Tracking**
   - Compare snapshots and show which components moved
   - Calculate evolution velocity (units per quarter)
   - Identify "stagnant" components (not evolving)

#### Implementation Tasks

- [ ] Create `WardleyInertiaNode.tsx` - Inertia node component
- [ ] Create `EvolutionAnimator.tsx` - Animation component
- [ ] Create `wardley-evolution.ts` - Evolution tracking logic
- [ ] Update `WardleyPropertyPanel.tsx` - Add inertia fields
- [ ] Update `WardleyCanvas.tsx` - Render evolution markers
- [ ] Add animation controls to toolbar

---

### Phase 3: OWM Import/Export (v3.2.0)

**Estimated Effort:** 10-15 hours
**Target:** Q3 2026

#### Features

1. **OWM Export**
   - Convert .bac4 Wardley Map → OWM text format
   - "Export to OWM" command in command palette
   - Copy to clipboard or save as .wm file
   - Preserve component positions, dependencies, annotations

2. **OWM Import**
   - Parse OWM text format → .bac4 JSON
   - "Import from OWM" command
   - Paste OWM text or select .wm file
   - Create .bac4 diagram from OWM

3. **Compatibility Testing**
   - Test with OnlineWardleyMaps examples
   - Ensure round-trip conversion (BAC4 → OWM → BAC4)
   - Document unsupported OWM features

#### OWM Format Mapping

```
OWM → BAC4 Mapping:

title Map Name              → metadata.title
component Name [Y, X]       → node with visibility=Y, evolution=X
component Name [Y, X] label [LY, LX]  → node with label position
component Name [...] inertia → node with inertia=true
evolve Name (X)             → new snapshot with Name at evolution=X
Name->Dependency            → edge from Name to Dependency
market Name [...]           → node with type=market
pipeline Name [...]         → node with type=pipeline
note Text [X, Y]            → annotation at position
```

#### Implementation Tasks

- [ ] Create `owm-parser.ts` - Parse OWM syntax
- [ ] Create `owm-exporter.ts` - Convert .bac4 → OWM
- [ ] Create `owm-importer.ts` - Convert OWM → .bac4
- [ ] Add "Import from OWM" command
- [ ] Add "Export to OWM" command
- [ ] Test with OnlineWardleyMaps examples

---

### Phase 4: Enterprise Architecture Enhancements (v3.3.0)

**Estimated Effort:** 20-25 hours
**Target:** Q4 2026

#### Features

1. **Component Maturity Heatmap**
   - Overlay color heatmap showing component maturity
   - Red (genesis) → Yellow (custom/product) → Green (commodity)
   - Identify areas needing modernization

2. **Strategic Alignment Score**
   - Calculate alignment between Wardley Map and Capability model
   - Flag components missing from Capability diagrams
   - Suggest new capabilities based on Wardley Map

3. **Evolution Roadmap Generator**
   - Auto-generate roadmap from snapshot timeline
   - Show component movements as Gantt chart
   - Export to markdown or CSV

4. **Competitive Analysis View**
   - Overlay multiple Wardley Maps (your org vs competitors)
   - Compare evolution positions
   - Identify competitive advantages/disadvantages

5. **Build/Buy/Outsource Recommendations**
   - Analyze component evolution stage
   - Recommend: Genesis → Build, Custom → Build/Buy, Product → Buy, Commodity → Outsource
   - Generate decision matrix

#### Implementation Tasks

- [ ] Create `WardleyAnalytics.tsx` - Analytics dashboard
- [ ] Create `wardley-analysis.ts` - Analysis algorithms
- [ ] Create `RoadmapGenerator.tsx` - Roadmap export
- [ ] Create `CompetitiveView.tsx` - Multi-map overlay
- [ ] Add analytics commands to command palette

---

## Integration with BAC4 Layers

### Layer Placement Recommendations

**Recommended Layers for Wardley Maps:**

1. **Capability Layer** (PRIMARY)
   - Map business/technical capabilities evolution
   - Show which capabilities are strategic vs commodity
   - Link to Context diagrams for implementation details

2. **Context Layer** (SECONDARY)
   - Map system landscape evolution
   - Show external system dependencies
   - Identify modernization opportunities

3. **Market Layer** (OPTIONAL)
   - Map competitive landscape
   - Show market forces and trends
   - Position products against competitors

**Not Recommended:**
- Container/Component/Code layers (too detailed for strategic planning)
- Organisation layer (Wardley Maps focus on capabilities, not org structure)

### Cross-Reference Patterns

#### Pattern 1: Capability → Wardley Map → Context

```
Capability Diagram (BA-Engineering-Capabilities.bac4)
  ├─ Capability: "Data Warehouse & BI"
  │  └─ linkedDiagramPath: "Wardley/DW-BI-Strategy.bac4"
  │
Wardley Map (DW-BI-Strategy.bac4)
  ├─ Component: "Snowflake Data Warehouse" (evolution: 0.75, commodity)
  ├─ Component: "dbt Transformations" (evolution: 0.60, product)
  ├─ Component: "Tableau Dashboards" (evolution: 0.70, product)
  │  └─ linkedDiagramPath: "Context/MRO-System.bac4"
  │
Context Diagram (MRO-System.bac4)
  ├─ System: "Snowflake Data Warehouse"
  └─ System: "Tableau Server"
```

**Navigation Path:**
1. Start at Capability diagram
2. Click "Data Warehouse & BI" capability
3. See Wardley Map showing evolution strategy
4. Click "Snowflake Data Warehouse" component
5. Jump to Context diagram showing system landscape

#### Pattern 2: Market → Wardley Map → Capability

```
Market Diagram (BA-Engineering-Market.bac4)
  ├─ Market Segment: "MRO Analytics"
  │  └─ linkedDiagramPath: "Wardley/MRO-Market-Strategy.bac4"
  │
Wardley Map (MRO-Market-Strategy.bac4)
  ├─ Component: "Predictive Maintenance" (evolution: 0.35, custom)
  ├─ Component: "Fleet Health Dashboards" (evolution: 0.65, product)
  │  └─ linkedDiagramPath: "Capability/BA-Engineering-Capabilities.bac4"
  │
Capability Diagram (BA-Engineering-Capabilities.bac4)
  ├─ Capability: "Predictive Analytics"
  └─ Capability: "Data Warehouse & BI"
```

**Strategic Insight:**
- Market analysis identifies opportunities
- Wardley Map shows competitive positioning
- Capability diagram shows implementation approach

### Validation Rules

**Layer Validation Updates:**

```typescript
// Allow Wardley Maps in specific layers
const WARDLEY_MAP_ALLOWED_LAYERS = [
  'capability',  // Primary use case
  'context',     // Secondary use case
  'market'       // Competitive analysis
];

function validateWardleyMapPlacement(filePath: string): boolean {
  const layer = extractLayerFromPath(filePath);
  return WARDLEY_MAP_ALLOWED_LAYERS.includes(layer);
}
```

**Cross-Reference Validation:**

```typescript
// Wardley Map components can link to:
const VALID_WARDLEY_COMPONENT_LINKS = [
  'capability', // Link to capability diagram
  'context',    // Link to context diagram
  'wardley'     // Link to another Wardley Map
];

// Capability nodes can link to Wardley Maps
const VALID_CAPABILITY_LINKS = [
  'capability',
  'context',
  'wardley'     // NEW: Allow linking to Wardley Maps
];
```

---

## Success Metrics

### Adoption Metrics

**Target (6 months after v3.0.0 release):**
- 30% of BAC4 users create at least 1 Wardley Map
- 50% of Capability diagrams link to a Wardley Map
- Average 3 Wardley Maps per vault

### Usage Metrics

**Target:**
- Average 2 snapshots per Wardley Map (showing evolution over time)
- 80% of Wardley Maps have at least 5 components
- 60% of Wardley Maps have cross-references to other diagrams

### Quality Metrics

**Target:**
- Components positioned correctly by evolution stage (manual review)
- Dependencies flow down value chain (automated validation)
- Strategic annotations present (>50% of maps have at least 1 annotation)

### Competitive Metrics

**vs Existing Obsidian Wardley Maps Plugin:**
- 40% of users prefer BAC4 Wardley Maps (integrated UX)
- 60% of users who use both prefer BAC4 for enterprise architecture

**vs OnlineWardleyMaps:**
- 50% of enterprise users prefer BAC4 (offline, version control)
- OWM export feature used by 30% of users (interoperability)

### Business Impact

**For Solution Architects:**
- Time to create Wardley Map: <30 minutes (vs 2-4 hours in PowerPoint)
- Strategic decisions documented: +200% (maps make strategy visible)
- Stakeholder engagement: +150% (visual maps easier to understand)

**For Organizations:**
- Technology roadmap clarity: +80% (evolution paths visualized)
- Build/buy/outsource decisions: 50% faster (data-driven recommendations)
- Cloud migration planning: 40% more effective (evolution tracking)

---

## Appendix

### OWM Syntax Reference

```
# Comments start with # or //

# Basic syntax
title Map Title
evolution Genesis -> Custom -> Product -> Commodity
style wardley

# Components
component Name [Visibility, Evolution]
component Name [Y, X] label [LabelY, LabelX]
component Name [Y, X] inertia

# Special component types
market Name [Y, X]
pipeline Name [Y, X]

# Dependencies
ComponentA->ComponentB
ComponentA+<>ComponentB  // Pipeline

# Evolution
evolve Name (NewEvolution)
evolve OldName->NewName (Evolution)

# Annotations
note Text [X, Y]
annotation [X, Y] Note text
```

### Example OWM Map

```
title E-Commerce Platform Strategy
evolution Genesis -> Custom -> Product -> Commodity

# User needs (top of value chain)
component Customer [0.95, 0.15]
component Shopping Experience [0.85, 0.40]

# Application layer
component Web Application [0.70, 0.60]
component Mobile App [0.70, 0.55]

# Business logic
component Recommendation Engine [0.50, 0.35] inertia
component Payment Processing [0.50, 0.85]
component Order Management [0.45, 0.50]

# Infrastructure
component Database [0.30, 0.45] inertia
component Cloud Hosting [0.20, 0.80]
component CDN [0.15, 0.90]

# Dependencies
Customer->Shopping Experience
Shopping Experience->Web Application
Shopping Experience->Mobile App
Web Application->Recommendation Engine
Web Application->Payment Processing
Web Application->Order Management
Mobile App->Recommendation Engine
Mobile App->Payment Processing
Order Management->Database
Web Application->Database
Payment Processing->Cloud Hosting
Web Application->CDN

# Evolution plan
evolve Recommendation Engine 0.60
evolve Database->Managed Database 0.75

note "Migrate to cloud-native by Q2 2026" [0.5, 0.1]
annotation [0.65, 0.35] Consider off-the-shelf recommendation service
```

### Wardley Mapping Resources

**Books:**
- *Wardley Maps* by Simon Wardley (free online)

**Community:**
- https://community.wardleymaps.com/
- https://github.com/wardley-maps-community/awesome-wardley-maps

**Tools:**
- OnlineWardleyMaps: https://onlinewardleymaps.com/
- Mapkeep: https://mapkeep.com/
- Atlas2: https://github.com/cdaniel/atlas2

**Obsidian Plugins:**
- Wardley Maps for Obsidian: https://github.com/damonsk/obsidian-wardley-maps

---

## Next Steps

1. **Review this plan** with stakeholders and gather feedback
2. **Prioritize features** based on user needs
3. **Create Phase 1 implementation plan** with detailed tasks
4. **Set up development environment** for Wardley Map components
5. **Create design mockups** for Wardley Map editor UX
6. **Begin Phase 1 implementation** (target: Q1 2026)

---

**Questions? Suggestions?**
File an issue at: https://github.com/DavidROliverBA/bac4/issues

