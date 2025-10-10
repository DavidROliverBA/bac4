# C4 Model Enhancement Plan

## Current State
- Canvas supports all three C4 levels (Context, Container, Component)
- Diagram type selector at top (Context/Container/Component)
- AWS component palette shows for all diagram types
- No linking between diagrams
- No drill-down functionality

## Goals
1. **Proper C4 Model hierarchy**
2. **Diagram linking** - drill down from Context → Container → Component
3. **Type-appropriate tooling** - only show relevant nodes for each level
4. **Edge label editing** - customize relationship labels
5. **Node styling** - colors, borders, visual customization

---

## Phase 1: Enhanced Canvas Features

### Feature 1.1: Edge Label Editing
**User Story:** As a user, I want to edit edge labels to describe relationships accurately

**Implementation:**
- [ ] Double-click edge label to edit
- [ ] Property panel shows edge properties when edge selected
- [ ] Default labels based on diagram type
- [ ] Custom label input field
- [ ] Common relationship templates (uses, depends on, calls, reads, writes)

**Files to modify:**
- `src/ui/canvas-view.tsx` - Add onEdgeClick handler
- `src/ui/components/PropertyPanel.tsx` - Add edge editing section
- `src/styles.css` - Style editable edge labels

### Feature 1.2: Node Color Customization
**User Story:** As a user, I want to color-code nodes for visual organization

**Implementation:**
- [ ] Color picker in property panel
- [ ] Pre-defined color palettes
- [ ] Save color with node data
- [ ] Apply to node border and background
- [ ] Color legend/key

**Files to modify:**
- `src/ui/nodes/C4Node.tsx` - Accept color prop
- `src/ui/components/PropertyPanel.tsx` - Add color picker
- `src/ui/canvas-view.tsx` - Handle color updates

### Feature 1.3: Node Icons/Badges
**User Story:** As a user, I want to add icons to nodes for quick identification

**Implementation:**
- [ ] Icon picker in property panel
- [ ] Lucide icons integration (Obsidian uses these)
- [ ] Icon displayed in node header
- [ ] Icon color matching node theme

---

## Phase 2: C4 Model Proper Hierarchy

### Understanding C4 Levels:

**Context Diagram (Level 1):**
- Shows: Systems and People (actors)
- Purpose: High-level system landscape
- Nodes: System Context boxes, External Systems, Users/Actors
- NO AWS components (too detailed)

**Container Diagram (Level 2):**
- Shows: Applications, Data Stores, Microservices within a System
- Purpose: Zoom into one System from Context
- Nodes: Web App, Mobile App, API, Database, Message Queue
- NO AWS components yet (logical view)

**Component Diagram (Level 3):**
- Shows: Code components within a Container
- Purpose: Zoom into one Container from Container diagram
- Nodes: Controllers, Services, Repositories
- YES AWS components (deployment view)

### Feature 2.1: Diagram Type Enforcement
**User Story:** As a user, I want appropriate tools for each diagram type

**Implementation:**

**Context Diagrams:**
- [ ] Only show: "+ System", "+ Person", "+ External System"
- [ ] Hide AWS component palette
- [ ] Node types: system, person, external
- [ ] Larger, simpler nodes

**Container Diagrams:**
- [ ] Only show: "+ Web App", "+ Mobile App", "+ API", "+ Database", "+ Queue"
- [ ] Hide AWS component palette
- [ ] Node types: webapp, mobileapp, api, database, queue, service
- [ ] Medium-sized nodes

**Component Diagrams:**
- [ ] Show: "+ Component" (code level)
- [ ] SHOW AWS component palette (deployment)
- [ ] Node types: component, class, interface
- [ ] Also show AWS services for deployment mapping
- [ ] Smaller, more detailed nodes

**Files to modify:**
- `src/ui/canvas-view.tsx` - Conditional rendering based on diagramType
- `src/ui/nodes/` - New node types for each level
- `src/types/diagram-types.ts` - Define C4 level types

### Feature 2.2: Diagram Linking & Drill-Down
**User Story:** As a user, I want to drill down from Context → Container → Component

**Implementation:**

**Link Creation:**
- [ ] Right-click node → "Create linked diagram"
- [ ] Automatically creates child diagram file
- [ ] Stores parent-child relationship
- [ ] Navigation breadcrumb

**Drill-Down Navigation:**
- [ ] Double-click node → open linked diagram
- [ ] Breadcrumb: "Context / Web System / API Service"
- [ ] Back button to parent diagram
- [ ] Visual indicator on nodes that have drill-downs (icon badge)

**Data Structure:**
```typescript
interface DiagramMetadata {
  id: string;
  name: string;
  type: 'context' | 'container' | 'component';
  parentDiagramId?: string;
  parentNodeId?: string;
  childDiagrams?: Array<{
    nodeId: string;
    diagramId: string;
    diagramPath: string;
  }>;
}
```

**Files to create:**
- `src/types/diagram-metadata.ts`
- `src/services/diagram-linking-service.ts`
- `src/ui/components/DiagramBreadcrumb.tsx`
- `src/ui/components/DrillDownButton.tsx`

**Files to modify:**
- `src/ui/canvas-view.tsx` - Add navigation logic
- `src/ui/nodes/C4Node.tsx` - Add drill-down indicator
- `src/data/file-io.ts` - Handle diagram metadata

### Feature 2.3: Diagram Consistency Validation
**User Story:** As a user, I want to ensure my C4 hierarchy is consistent

**Implementation:**
- [ ] Validate node types match diagram type
- [ ] Check parent-child references are valid
- [ ] Warn if container references non-existent context node
- [ ] Suggest corrections

---

## Phase 3: Enhanced Node Types

### New Node Components:

**Context Level:**
- `PersonNode` - Stick figure or avatar icon
- `SystemNode` - Large rounded rectangle
- `ExternalSystemNode` - Grey/dashed border

**Container Level:**
- `WebAppNode` - Browser icon
- `MobileAppNode` - Phone icon
- `APINode` - Cloud/endpoint icon
- `DatabaseNode` - Cylinder shape
- `QueueNode` - Message queue icon

**Component Level:**
- `ComponentNode` - Small rectangle
- Keep existing CloudComponentNode for AWS

**Files to create:**
- `src/ui/nodes/PersonNode.tsx`
- `src/ui/nodes/SystemNode.tsx`
- `src/ui/nodes/ExternalSystemNode.tsx`
- `src/ui/nodes/WebAppNode.tsx`
- `src/ui/nodes/MobileAppNode.tsx`
- `src/ui/nodes/APINode.tsx`
- `src/ui/nodes/DatabaseNode.tsx`
- `src/ui/nodes/QueueNode.tsx`

---

## Phase 4: File Management

### Feature 4.1: Diagram File Structure
```
project-root/
  diagrams/
    context/
      system-landscape.json
    container/
      web-system-containers.json
      mobile-system-containers.json
    component/
      api-service-components.json
      web-app-components.json
```

### Feature 4.2: Create New Diagram
**User Story:** As a user, I want to create new diagrams with proper naming

**Implementation:**
- [ ] "New Diagram" button in Command Palette
- [ ] Modal: Choose type (Context/Container/Component)
- [ ] Auto-suggest name based on parent
- [ ] Create file in appropriate folder
- [ ] Initialize with diagram metadata

---

## Implementation Order

### Sprint 1: Enhanced Canvas Features (1-2 hours)
1. Edge label editing ✓
2. Node color customization ✓
3. Edge property panel ✓

### Sprint 2: C4 Type Enforcement (2-3 hours)
1. Create new node types for Context/Container
2. Conditional toolbar based on diagram type
3. Hide AWS palette for Context/Container
4. Update demo data for each type

### Sprint 3: Diagram Linking (3-4 hours)
1. Diagram metadata structure
2. Linking service
3. Drill-down navigation
4. Breadcrumb UI
5. Visual drill-down indicators

### Sprint 4: Polish & Validation (1-2 hours)
1. Consistency validation
2. Better icons
3. Improved styling
4. Documentation

---

## Acceptance Criteria

### For Context Diagrams:
- ✓ Only System, Person, External System nodes available
- ✓ No AWS palette visible
- ✓ Can create Container diagram from System node
- ✓ Large, simple node styling

### For Container Diagrams:
- ✓ Only Container-level nodes available (WebApp, API, DB, etc.)
- ✓ No AWS palette visible
- ✓ Can create Component diagram from Container node
- ✓ Can navigate back to parent Context diagram
- ✓ Medium-sized node styling

### For Component Diagrams:
- ✓ Component nodes available
- ✓ AWS palette IS visible
- ✓ Can map components to AWS services
- ✓ Can navigate back to parent Container diagram
- ✓ Smaller, detailed node styling

### For All Diagrams:
- ✓ Edge labels are editable
- ✓ Nodes are color-customizable
- ✓ Drill-down indicators visible
- ✓ Breadcrumb navigation works
- ✓ Auto-save preserves all metadata

---

## Next Steps

Start with Sprint 1 to add immediate value, then move to Sprint 2 for proper C4 model enforcement.
