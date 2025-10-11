# BAC4 Correct Workflow Specification

## Date: 2025-10-10
## Status: Requirements Documented - Ready for Planning

---

## Complete Workflow

### Step 1: Open Dashboard
**Action:** User clicks "BAC4 Dashboard" button in Obsidian

**System Behavior:**
1. Check if Context diagram exists (e.g., `Context.bac4`)
2. Check if `diagram-relationships.json` exists
3. If either doesn't exist, create them as empty files
4. Open the Context diagram in current tab
5. Display empty canvas (if new file)

**Files Created:**
- `Context.bac4` (empty diagram)
- `diagram-relationships.json` (empty relationships)

---

### Step 2: Add First System Node
**Action:** User adds a System node to Context diagram

**System Behavior:**
1. System node appears on canvas
2. Node saved to `Context.bac4` file with its position and properties
3. No relationship created yet (just a node)

---

### Step 3: Create Child Container Diagram
**Action:** User either:
- Double-clicks the System node, OR
- Selects "Create child diagram" option

**System Behavior:**
1. Create new Container diagram file (e.g., `System1-Container.bac4`)
2. Update `diagram-relationships.json`:
   - Add diagram entry for Context (if not exists)
   - Add diagram entry for new Container
   - Add relationship linking Context → Container via the System node ID
3. Open Container diagram in **NEW TAB**
4. Mark System node as "hasChildDiagram" in Context file

**Updated Relationships:**
```json
{
  "diagrams": [
    { "id": "ctx-1", "filePath": "Context.bac4", "type": "context" },
    { "id": "cnt-1", "filePath": "System1-Container.bac4", "type": "container" }
  ],
  "relationships": [
    {
      "parentDiagramId": "ctx-1",
      "childDiagramId": "cnt-1",
      "parentNodeId": "node-1",
      "parentNodeLabel": "System 1"
    }
  ]
}
```

---

### Step 4: Add Second System Node
**Action:** User returns to Context diagram tab and adds ANOTHER System node

**System Behavior:**
1. Second System node appears on canvas
2. Node saved to `Context.bac4` file
3. No relationship created yet

---

### Step 5: Create Second Child Container Diagram
**Action:** User double-clicks the SECOND System node

**System Behavior:**
1. Create another Container diagram file (e.g., `System2-Container.bac4`)
2. Update `diagram-relationships.json`:
   - Add diagram entry for new Container
   - Add SECOND relationship: Context → Container #2
3. Open second Container diagram in **NEW TAB**
4. Mark second System node as "hasChildDiagram"

**Updated Relationships:**
```json
{
  "diagrams": [
    { "id": "ctx-1", "filePath": "Context.bac4", "type": "context" },
    { "id": "cnt-1", "filePath": "System1-Container.bac4", "type": "container" },
    { "id": "cnt-2", "filePath": "System2-Container.bac4", "type": "container" }
  ],
  "relationships": [
    {
      "parentDiagramId": "ctx-1",
      "childDiagramId": "cnt-1",
      "parentNodeId": "node-1",
      "parentNodeLabel": "System 1"
    },
    {
      "parentDiagramId": "ctx-1",
      "childDiagramId": "cnt-2",
      "parentNodeId": "node-2",
      "parentNodeLabel": "System 2"
    }
  ]
}
```

**Result:** Context diagram now has 2 relationships to 2 separate Container diagrams.

---

### Step 6: Navigate via Node Selection
**Action:** User selects (single-click) a System node in Context diagram

**System Behavior:**
1. Look up if this node has a child diagram in relationships file
2. If yes, update breadcrumb to show: `Context > System 1 Container`
3. Breadcrumb becomes clickable
4. User can click breadcrumb to jump to child diagram

**When breadcrumb is clicked:**
- Opens Container diagram in **NEW TAB**
- New tab shows the Container diagram for that specific System
- Original Context tab remains open

**When different System node selected:**
- Breadcrumb updates to show: `Context > System 2 Container`
- Clicking opens the OTHER Container diagram in new tab

---

## Key Requirements

### 1. BAC4 Dashboard Command
- Add Obsidian command: "Open BAC4 Dashboard"
- Ribbon icon to trigger this command
- Creates Context diagram + relationships file if needed
- Opens Context diagram in current tab

### 2. Breadcrumb Behavior
**Current (WRONG):**
- Breadcrumbs show when you OPEN a diagram
- Shows hierarchy from root to current file

**Correct (NEW):**
- Breadcrumbs show when you SELECT a node that has a child
- Shows: `Current Diagram > Child Diagram Name`
- Clicking breadcrumb opens child in NEW tab
- Breadcrumb updates as you select different nodes

### 3. Child Diagram Creation
**Current:**
- Only double-click works

**Correct:**
- Double-click works
- Add context menu option: "Create child diagram"
- Both methods create new file + update relationships

### 4. Multiple Children Support
- Same parent diagram can have MANY child diagrams
- Each relationship tracked by parent node ID
- Selecting different nodes shows different breadcrumbs

### 5. Open in New Tab
**Current:**
- Opens in same tab (replaces current view)

**Correct:**
- Always open child diagram in NEW tab
- Keep parent tab open for easy navigation

---

## Data Structure

### diagram-relationships.json
```json
{
  "version": "1.0",
  "diagrams": [
    {
      "id": "unique-id-1",
      "filePath": "path/to/Context.bac4",
      "displayName": "Context",
      "type": "context",
      "createdAt": "2025-10-10T10:00:00Z",
      "updatedAt": "2025-10-10T10:00:00Z"
    }
  ],
  "relationships": [
    {
      "parentDiagramId": "unique-id-1",
      "childDiagramId": "unique-id-2",
      "parentNodeId": "node-1",
      "parentNodeLabel": "System 1",
      "createdAt": "2025-10-10T10:05:00Z"
    }
  ],
  "updatedAt": "2025-10-10T10:10:00Z"
}
```

### .bac4 File (Node Data)
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "system",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "System 1",
        "hasChildDiagram": true
      }
    }
  ],
  "edges": []
}
```

---

## Visual Workflow

```
┌─────────────────────────────────────────────┐
│  Obsidian Ribbon: Click "BAC4 Dashboard"   │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Create Context.bac4   │ (if not exists)
        │ Create relationships  │ (if not exists)
        │ Open Context diagram  │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ User adds System node │
        │ (drag or click)       │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ User double-clicks    │
        │ System node           │
        └───────────────────────┘
                    ↓
    ┌─────────────────────────────────┐
    │ Create Container diagram file   │
    │ Update relationships.json       │
    │ Open Container in NEW TAB       │
    └─────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ User returns to       │
        │ Context tab           │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ User adds 2nd System  │
        │ Double-click again    │
        └───────────────────────┘
                    ↓
    ┌─────────────────────────────────┐
    │ Create 2nd Container diagram    │
    │ Update relationships.json       │
    │ (now has 2 relationships)       │
    │ Open 2nd Container in NEW TAB   │
    └─────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ User selects System 1 │
        │ (single-click)        │
        └───────────────────────┘
                    ↓
    ┌─────────────────────────────────┐
    │ Breadcrumb updates:             │
    │ "Context > System1 Container"   │
    │ (clickable)                     │
    └─────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ User clicks           │
        │ breadcrumb            │
        └───────────────────────┘
                    ↓
    ┌─────────────────────────────────┐
    │ Opens Container in NEW TAB      │
    │ Context tab stays open          │
    └─────────────────────────────────┘
```

---

## Current Code Issues

1. ❌ No "BAC4 Dashboard" command
2. ❌ Breadcrumb shows on diagram open (should show on node select)
3. ❌ Breadcrumb shows hierarchy path (should show child link)
4. ❌ Opens in same tab (should open in new tab)
5. ❌ No context menu for "Create child diagram"
6. ✅ Relationships file structure is correct
7. ✅ Multiple children from same parent is supported

---

## Next Step

Create detailed implementation plan in `docs/workflow-implementation-plan.md`.
