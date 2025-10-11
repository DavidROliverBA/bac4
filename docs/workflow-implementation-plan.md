# BAC4 Workflow - Implementation Plan

## Date: 2025-10-10
## Status: Planning Phase - DO NOT CODE YET

---

## Overview

This plan addresses the fundamental workflow changes needed to match the correct specification documented in `workflow-correct-spec.md`.

---

## Changes Required

### Change 1: Add "BAC4 Dashboard" Command ⭐ HIGH PRIORITY
### Change 2: Fix Breadcrumb Logic (Node Selection) ⭐ HIGH PRIORITY
### Change 3: Open Child Diagrams in New Tab ⭐ HIGH PRIORITY
### Change 4: Add Context Menu for Child Creation 🔵 MEDIUM PRIORITY
### Change 5: Visual Indicator for Nodes with Children 🔵 MEDIUM PRIORITY

---

## Change 1: Add "BAC4 Dashboard" Command

### Current State
- No dashboard command exists
- User must manually create Context diagrams
- No automatic setup

### Target State
- Ribbon icon: "BAC4 Dashboard"
- Command palette: "BAC4: Open Dashboard"
- Auto-creates Context diagram + relationships file
- Opens Context diagram in current tab

### Implementation Steps

#### 1.1: Add Dashboard Command to main.ts
**File:** `src/main.ts`

**Add command:**
```typescript
this.addCommand({
  id: 'open-bac4-dashboard',
  name: 'Open BAC4 Dashboard',
  callback: async () => {
    await this.openDashboard();
  }
});
```

**Add ribbon icon:**
```typescript
this.addRibbonIcon('layout-dashboard', 'BAC4 Dashboard', async () => {
  await this.openDashboard();
});
```

#### 1.2: Implement openDashboard() Method
**File:** `src/main.ts`

```typescript
async openDashboard(): Promise<void> {
  // 1. Get or create Context diagram path
  const contextPath = this.settings.dashboardPath || 'BAC4/Context.bac4';

  // 2. Check if Context diagram exists
  const contextExists = await this.app.vault.adapter.exists(contextPath);

  if (!contextExists) {
    // 3. Create directory if needed
    const dir = contextPath.substring(0, contextPath.lastIndexOf('/'));
    if (!(await this.app.vault.adapter.exists(dir))) {
      await this.app.vault.createFolder(dir);
    }

    // 4. Create empty Context diagram
    const emptyDiagram = { nodes: [], edges: [] };
    await this.app.vault.create(contextPath, JSON.stringify(emptyDiagram, null, 2));
  }

  // 5. Initialize relationships file
  const navService = new DiagramNavigationService(this);
  await navService.ensureRelationshipsFile();

  // 6. Register Context diagram in relationships
  await navService.registerDiagram(contextPath, 'Context', 'context');

  // 7. Open Context diagram
  await this.openCanvasView(contextPath);
}
```

#### 1.3: Add Settings for Dashboard Path
**File:** `src/settings.ts`

```typescript
export interface BAC4Settings {
  // ... existing settings
  dashboardPath: string; // Path to main Context diagram
}

export const DEFAULT_SETTINGS: BAC4Settings = {
  // ... existing defaults
  dashboardPath: 'BAC4/Context.bac4',
};
```

**Add to settings tab:**
```typescript
new Setting(containerEl)
  .setName('Dashboard path')
  .setDesc('Path to the main Context diagram')
  .addText(text => text
    .setPlaceholder('BAC4/Context.bac4')
    .setValue(this.plugin.settings.dashboardPath)
    .onChange(async (value) => {
      this.plugin.settings.dashboardPath = value;
      await this.plugin.saveSettings();
    }));
```

#### 1.4: Add ensureRelationshipsFile() Method
**File:** `src/services/diagram-navigation-service.ts`

```typescript
async ensureRelationshipsFile(): Promise<void> {
  const exists = await this.plugin.app.vault.adapter.exists(this.relationshipsPath);
  if (!exists) {
    const emptyRelationships: DiagramRelationshipsData = {
      version: '1.0',
      diagrams: [],
      relationships: [],
      updatedAt: new Date().toISOString()
    };
    await this.plugin.app.vault.adapter.write(
      this.relationshipsPath,
      JSON.stringify(emptyRelationships, null, 2)
    );
  }
}
```

**Testing:**
- [ ] Click ribbon icon → Context diagram opens
- [ ] Run command from palette → Same result
- [ ] Check `Context.bac4` created with empty nodes/edges
- [ ] Check `diagram-relationships.json` created
- [ ] Second click opens existing Context (no duplicate)

---

## Change 2: Fix Breadcrumb Logic (Node Selection)

### Current State
- Breadcrumbs show when diagram is OPENED
- Show hierarchy: Root → Parent → Current
- Always visible at top of canvas

### Target State
- Breadcrumbs show when node is SELECTED
- Show child link: `Current Diagram > Child Diagram`
- Only visible if selected node has a child
- Clicking breadcrumb opens child in NEW tab

### Implementation Steps

#### 2.1: Change Breadcrumb State Logic
**File:** `src/ui/canvas-view.tsx`

**Remove old breadcrumb effect (lines 138-164):**
```typescript
// DELETE THIS ENTIRE useEffect:
React.useEffect(() => {
  if (!filePath) {
    setBreadcrumbs([]);
    return;
  }
  // ... rest of old logic
}, [filePath, navigationService]);
```

**Add new breadcrumb logic based on node selection:**
```typescript
// Load breadcrumbs when a node with child is selected
React.useEffect(() => {
  if (!selectedNode || !filePath) {
    setBreadcrumbs([]);
    return;
  }

  let cancelled = false;

  // Check if selected node has a child diagram
  navigationService.findChildDiagram(filePath, selectedNode.id)
    .then((childPath) => {
      if (cancelled) return;

      if (childPath) {
        // Node has a child - show breadcrumb
        navigationService.getDiagramByPath(childPath)
          .then((childDiagram) => {
            if (cancelled) return;

            if (childDiagram) {
              const currentName = filePath.split('/').pop()?.replace('.bac4', '') || 'Current';
              setBreadcrumbs([
                { label: currentName, path: filePath, type: 'current' },
                { label: childDiagram.displayName, path: childPath, type: 'child' }
              ]);
            }
          });
      } else {
        // Node has no child - clear breadcrumbs
        setBreadcrumbs([]);
      }
    })
    .catch(() => {
      if (!cancelled) {
        setBreadcrumbs([]);
      }
    });

  return () => {
    cancelled = true;
  };
}, [selectedNode, filePath, navigationService]);
```

#### 2.2: Update Breadcrumb Component
**File:** `src/ui/components/Breadcrumbs.tsx`

**Change styling to show it's a forward link (not hierarchy):**
```typescript
// Change separator from "/" to "→" or ">"
// Style current diagram differently from child link
// Make child diagram clickable and highlighted
```

Example:
```
[Current Diagram] → [Child Diagram (clickable)]
```

#### 2.3: Update Navigate Handler
**File:** `src/ui/canvas-view.tsx`

```typescript
const handleBreadcrumbNavigate = async (path: string) => {
  console.log('BAC4: Navigating to child diagram:', path);

  // Open in NEW tab, not current tab
  const leaf = this.app.workspace.getLeaf('tab'); // Force new tab
  await leaf.setViewState({
    type: VIEW_TYPE_CANVAS,
    state: { file: path }
  });

  // Activate the new tab
  this.app.workspace.setActiveLeaf(leaf, { focus: true });
};
```

**Testing:**
- [ ] Open Context diagram → No breadcrumbs shown
- [ ] Select node without child → No breadcrumbs
- [ ] Select node WITH child → Breadcrumb appears: "Context → Container"
- [ ] Click breadcrumb → Opens Container in NEW tab
- [ ] Context tab stays open
- [ ] Select different node → Breadcrumb updates

---

## Change 3: Open Child Diagrams in New Tab

### Current State
**File:** `src/ui/canvas-view.tsx` (line 337-338)
```typescript
// Opens in same tab
await plugin.openCanvasView(childPath);
```

### Target State
```typescript
// Opens in NEW tab
const leaf = plugin.app.workspace.getLeaf('tab'); // Force new tab
await leaf.setViewState({
  type: VIEW_TYPE_CANVAS,
  state: { file: childPath }
});
plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
```

### Implementation Steps

#### 3.1: Update onNodeDoubleClick
**File:** `src/ui/canvas-view.tsx` (line 337-339)

**Replace:**
```typescript
// Open the child diagram
console.log('BAC4: Opening child diagram in canvas...');
await plugin.openCanvasView(childPath);
```

**With:**
```typescript
// Open the child diagram in NEW tab
console.log('BAC4: Opening child diagram in NEW tab...');
const leaf = plugin.app.workspace.getLeaf('tab'); // Creates new tab
await leaf.setViewState({
  type: VIEW_TYPE_CANVAS,
  state: { file: childPath }
});
plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
```

#### 3.2: Update openCanvasView() Method
**File:** `src/main.ts`

**Current method opens in existing leaf - keep for other uses**
**Add new method: openCanvasViewInNewTab()**

```typescript
async openCanvasViewInNewTab(filePath: string): Promise<void> {
  const leaf = this.app.workspace.getLeaf('tab');
  await leaf.setViewState({
    type: VIEW_TYPE_CANVAS,
    state: { file: filePath }
  });
  this.app.workspace.setActiveLeaf(leaf, { focus: true });
}
```

**Testing:**
- [ ] Double-click node → Opens in NEW tab
- [ ] Parent tab remains open
- [ ] Can switch between tabs
- [ ] No duplicate tabs created

---

## Change 4: Add Context Menu for Child Creation

### Current State
- Only double-click creates child diagram
- No right-click context menu option

### Target State
- Right-click on node → "Create child diagram" option
- Same behavior as double-click
- Better discoverability

### Implementation Steps

#### 4.1: Add Context Menu Handler
**File:** `src/ui/canvas-view.tsx`

**Add onNodeContextMenu handler:**
```typescript
const onNodeContextMenu = React.useCallback(
  (event: React.MouseEvent, node: Node<CanvasNodeData>) => {
    event.preventDefault();

    // Check if this node can have a child
    const canDrillDown =
      (node.type === 'system' && diagramType === 'context') ||
      (node.type === 'container' && diagramType === 'container');

    if (!canDrillDown) return;

    // Create Obsidian menu
    const menu = new Menu();

    menu.addItem((item) => {
      item
        .setTitle('Create child diagram')
        .setIcon('plus-circle')
        .onClick(async () => {
          // Reuse the double-click logic
          await handleCreateChildDiagram(node);
        });
    });

    // Check if child already exists
    navigationService.findChildDiagram(filePath!, node.id)
      .then((childPath) => {
        if (childPath) {
          menu.addItem((item) => {
            item
              .setTitle('Open child diagram')
              .setIcon('arrow-right')
              .onClick(async () => {
                const leaf = plugin.app.workspace.getLeaf('tab');
                await leaf.setViewState({
                  type: VIEW_TYPE_CANVAS,
                  state: { file: childPath }
                });
                plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
              });
          });
        }

        menu.showAtMouseEvent(event.nativeEvent);
      });
  },
  [diagramType, filePath, navigationService, plugin]
);
```

#### 4.2: Extract Child Creation Logic
**File:** `src/ui/canvas-view.tsx`

**Create reusable function:**
```typescript
const handleCreateChildDiagram = React.useCallback(
  async (node: Node<CanvasNodeData>) => {
    // Move the logic from onNodeDoubleClick into here
    // So both double-click and context menu can use it
  },
  [/* dependencies */]
);
```

#### 4.3: Add Handler to ReactFlow
**File:** `src/ui/canvas-view.tsx`

```typescript
<ReactFlow
  // ... existing props
  onNodeContextMenu={onNodeContextMenu}
>
```

**Testing:**
- [ ] Right-click System node → Menu appears
- [ ] Click "Create child diagram" → Creates Container
- [ ] Right-click node with child → "Open child diagram" appears
- [ ] Click "Open child diagram" → Opens in new tab

---

## Change 5: Visual Indicator for Nodes with Children

### Current State
- No visual indication if a node has a child diagram
- `hasChildDiagram: true` exists in data but not shown

### Target State
- Node with child shows icon (e.g., 📂, ↓, or special badge)
- Clear visual cue that node is drillable
- Consistent across all node types

### Implementation Steps

#### 5.1: Update SystemNode Component
**File:** `src/ui/nodes/SystemNode.tsx`

**Add visual indicator:**
```typescript
{data.hasChildDiagram && (
  <div style={{
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'var(--interactive-accent)',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }}>
    📂
  </div>
)}
```

#### 5.2: Update ContainerNode Component
**File:** `src/ui/nodes/ContainerNode.tsx`

**Same indicator for consistency**

#### 5.3: Update Node Border/Styling
**File:** `src/ui/nodes/SystemNode.tsx` (and ContainerNode)

**Change border style for nodes with children:**
```typescript
border: data.hasChildDiagram
  ? '3px solid var(--interactive-accent)'
  : '2px solid var(--background-modifier-border)'
```

**Testing:**
- [ ] Node without child → Normal appearance
- [ ] Create child → Badge/icon appears
- [ ] Border changes to highlight drillable nodes
- [ ] Consistent across node types

---

## Implementation Order

### Phase 1: Core Functionality (Do First)
1. ✅ Change 1: Add "BAC4 Dashboard" Command
2. ✅ Change 3: Open Child Diagrams in New Tab
3. ✅ Change 2: Fix Breadcrumb Logic

### Phase 2: Enhancements (Do Second)
4. ✅ Change 4: Add Context Menu
5. ✅ Change 5: Visual Indicators

---

## Testing Plan

### Test 1: Dashboard Creation
1. Open Obsidian
2. Click "BAC4 Dashboard" ribbon icon
3. Verify Context.bac4 created
4. Verify diagram-relationships.json created
5. Verify Context diagram opens
6. Click dashboard again → Should open existing

### Test 2: Child Diagram Creation
1. Add System node to Context
2. Double-click System node
3. Verify Container diagram created
4. Verify opened in NEW tab
5. Verify relationships.json updated
6. Verify System node marked with badge

### Test 3: Multiple Children
1. Return to Context tab
2. Add second System node
3. Double-click second System
4. Verify second Container created
5. Verify relationships has 2 entries
6. Both tabs should be open

### Test 4: Breadcrumb Navigation
1. In Context tab, select first System
2. Verify breadcrumb appears: "Context → System1 Container"
3. Click breadcrumb
4. Verify opens Container in new tab
5. Select second System
6. Verify breadcrumb updates: "Context → System2 Container"
7. Click breadcrumb
8. Verify opens second Container

### Test 5: Context Menu
1. Right-click System node
2. Verify "Create child diagram" option
3. Click option → Creates Container
4. Right-click same node again
5. Verify "Open child diagram" option appears
6. Click option → Opens in new tab

---

## Files to Modify

### New Files:
None

### Modified Files:
1. `src/main.ts` - Add dashboard command, ribbon, openCanvasViewInNewTab()
2. `src/settings.ts` - Add dashboardPath setting
3. `src/services/diagram-navigation-service.ts` - Add ensureRelationshipsFile()
4. `src/ui/canvas-view.tsx` - Fix breadcrumb logic, new tab opening, context menu
5. `src/ui/components/Breadcrumbs.tsx` - Update styling for forward link
6. `src/ui/nodes/SystemNode.tsx` - Add visual indicator
7. `src/ui/nodes/ContainerNode.tsx` - Add visual indicator

---

## Risks and Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation:**
- Test each change incrementally
- Keep existing openCanvasView() method
- Add new methods alongside old ones

### Risk 2: Breadcrumb Performance
**Mitigation:**
- Use cancellation tokens in useEffect
- Debounce node selection events if needed

### Risk 3: Duplicate Tabs
**Mitigation:**
- Check if diagram already open before creating tab
- Add duplicate detection in openCanvasViewInNewTab()

---

## Estimated Time

- Phase 1 (Core): 2-3 hours
- Phase 2 (Enhancements): 1-2 hours
- Testing: 1 hour
- **Total: 4-6 hours**

---

## Next Step

Wait for user approval of this plan before implementing any code changes.

**User: Please review this plan and confirm before I proceed with implementation.**
