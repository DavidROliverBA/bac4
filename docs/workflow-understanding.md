# BAC4 Workflow - Correct Logic

## Date: 2025-10-10
## Status: Understanding Requirements

---

## User's Explanation of Correct Workflow

### Step 1: Initial Setup
**Action:** User opens Obsidian and clicks "BAC4 Dashboard" button

**Expected Behavior:**
- Creates an empty Context diagram (if doesn't exist)
- Creates `diagram-relationships.json` file (if doesn't exist)
- Opens the Context diagram in a tab

---

### Step 2: Create First System
**Action:** User places a System node onto the Context diagram

**Expected Behavior:**
- System node appears on canvas
- Node is saved to the Context diagram .bac4 file

---

### Step 3: Drill Down - Create Container Diagram
**Action:** User either:
- Double-clicks the System node, OR
- Selects the System node and chooses "has child diagram"

**Expected Behavior:**
- Creates a NEW Container diagram file (e.g., `System1-Container.bac4`)
- Updates `diagram-relationships.json` to create a relationship:
  - Parent: Context diagram
  - Child: Container diagram
  - Parent Node ID: (the System node's ID)
- Opens the Container diagram in a new tab

---

### Step 4: Create Second System
**Action:** User goes back to Context diagram and creates ANOTHER System node

**Expected Behavior:**
- Second System node appears on Context canvas
- Node is saved to the Context diagram .bac4 file

---

### Step 5: Drill Down - Create Second Container Diagram
**Action:** User double-clicks the SECOND System node

**Expected Behavior:**
- Creates ANOTHER Container diagram file (e.g., `System2-Container.bac4`)
- Updates `diagram-relationships.json` to add a SECOND relationship:
  - Parent: Context diagram (same parent as before)
  - Child: Container diagram #2 (different child)
  - Parent Node ID: (the second System node's ID)
- Now the Context diagram has TWO relationships to TWO separate Container diagrams

---

### Step 6: Navigate via Breadcrumbs (INCOMPLETE - NEED CLARIFICATION)
**Action:** User selects one of the System nodes in the Context diagram

**Expected Behavior:**
- The breadcrumb changes to... [INCOMPLETE]
- Allows user to jump to a new tab where... [INCOMPLETE]

---

## Questions for User

1. **Step 6 - Breadcrumb Behavior:**
   When I select a System node in the Context diagram, what should happen to the breadcrumb?

   Options I can think of:
   - A) Show the child diagram path in the breadcrumb (e.g., "Context > System1 Container")
   - B) Add a clickable link in the breadcrumb to jump to the child
   - C) Show a "Go to Child" button in the breadcrumb
   - D) Something else?

   And when you say "jump to a new tab where this con..." - where does it jump?
   - To the child Container diagram?
   - In a NEW tab or the SAME tab?

---

## Current Implementation Issues

Based on this explanation, here are the problems with the current code:

### Issue 1: No "BAC4 Dashboard" Button
- There's no command/button to create the initial Context diagram
- User has to manually create diagrams

### Issue 2: No "Has Child Diagram" Action
- Only double-click is implemented
- Missing alternative UI action to create child

### Issue 3: Breadcrumb Shows on Select (Wrong)
- Current code: Breadcrumbs show when you OPEN a diagram
- User expects: Breadcrumbs change when you SELECT a node
- This is a fundamental difference!

### Issue 4: Multiple Children per Parent
- Current code might not handle multiple children from same parent correctly
- Need to verify `diagram-relationships.json` supports this

### Issue 5: Opening in New Tab
- Current code might open in same tab
- User expects: New tab for child diagram

---

## Correct Architecture

### Diagram Relationships Structure

```json
{
  "version": "1.0",
  "diagrams": [
    {
      "id": "context-main",
      "filePath": "diagrams/Context.bac4",
      "displayName": "Context",
      "type": "context",
      "createdAt": "2025-10-10T10:00:00Z",
      "updatedAt": "2025-10-10T10:00:00Z"
    },
    {
      "id": "container-system1",
      "filePath": "diagrams/System1-Container.bac4",
      "displayName": "System1 Container",
      "type": "container",
      "createdAt": "2025-10-10T10:05:00Z",
      "updatedAt": "2025-10-10T10:05:00Z"
    },
    {
      "id": "container-system2",
      "filePath": "diagrams/System2-Container.bac4",
      "displayName": "System2 Container",
      "type": "container",
      "createdAt": "2025-10-10T10:10:00Z",
      "updatedAt": "2025-10-10T10:10:00Z"
    }
  ],
  "relationships": [
    {
      "parentDiagramId": "context-main",
      "childDiagramId": "container-system1",
      "parentNodeId": "node-1",
      "parentNodeLabel": "System 1",
      "createdAt": "2025-10-10T10:05:00Z"
    },
    {
      "parentDiagramId": "context-main",
      "childDiagramId": "container-system2",
      "parentNodeId": "node-2",
      "parentNodeLabel": "System 2",
      "createdAt": "2025-10-10T10:10:00Z"
    }
  ],
  "updatedAt": "2025-10-10T10:10:00Z"
}
```

**Key Point:** Same parent (`context-main`) has TWO relationships to TWO different children.

---

## What Needs to Change

1. **Add "BAC4 Dashboard" command** - Creates initial Context diagram
2. **Add "Has Child Diagram" action** - UI button/command as alternative to double-click
3. **Fix breadcrumb logic** - Show child breadcrumb when node is SELECTED, not when diagram is opened
4. **Fix navigation** - Open child diagram in NEW tab, not same tab
5. **Verify relationships** - Ensure multiple children from same parent works correctly

---

## Waiting for User Input

**Please complete the sentence:**

"When I select one or other of the system nodes in the context diagram, the breadcrumb will change to allow me to jump to a new tab where this con..."

Once I understand the complete requirement, I'll create a detailed implementation plan.
