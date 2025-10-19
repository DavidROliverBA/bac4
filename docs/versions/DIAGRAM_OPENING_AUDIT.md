# Diagram Opening Methods - Complete Audit

## All Ways to Open a Diagram

### 1. Dashboard / Ribbon Icon
- **User Action:** Click the dice-4 icon in the left ribbon
- **Code Path:** `main.ts:79-81` → `openDashboard()` → `openCanvasView(contextPath)`
- **File:** Context.bac4
- **Method Used:** `openCanvasView()`
- **Tab Behavior:** Opens in current leaf (reuses existing or creates new)

### 2. Command Palette - "Open Dashboard"
- **User Action:** Cmd+P → "BAC4: Open Dashboard"
- **Code Path:** `main.ts:377-380` → `openDashboard()` → `openCanvasView(contextPath)`
- **File:** Context.bac4
- **Method Used:** `openCanvasView()`
- **Tab Behavior:** Opens in current leaf

### 3. File Explorer - Click .bac4 File
- **User Action:** Click any .bac4 file in file explorer
- **Code Path:** Obsidian native → `registerExtensions(['bac4'])` → `BAC4CanvasView.onLoadFile()`
- **File:** Any .bac4 file
- **Method Used:** Direct view creation
- **Tab Behavior:** Opens in current leaf OR creates duplicate tab (⚠️ ISSUE)

### 4. File Menu - "Open in BAC4 Canvas"
- **User Action:** Right-click .bac4 file → "Open in BAC4 Canvas"
- **Code Path:** `main.ts:64-66` → `openCanvasView(file.path)`
- **File:** Any .bac4 file
- **Method Used:** `openCanvasView()`
- **Tab Behavior:** Opens in current leaf (checks for existing)

### 5. Double-Click Node (Drill Down)
- **User Action:** Double-click System node or Container node with child
- **Code Path:** `useNodeHandlers.ts:146` → `openCanvasViewInNewTab(childPath)`
- **File:** Child diagram (System_X.bac4 or Container_X.bac4)
- **Method Used:** `openCanvasViewInNewTab()`
- **Tab Behavior:** Opens in NEW tab (checks for existing first)

### 6. Right-Click Node Context Menu
- **User Action:** Right-click node → "Open Child Diagram"
- **Code Path:** `useNodeHandlers.ts:198` → `openCanvasViewInNewTab(childPath)`
- **File:** Child diagram
- **Method Used:** `openCanvasViewInNewTab()`
- **Tab Behavior:** Opens in NEW tab

### 7. Breadcrumb Navigation
- **User Action:** Click breadcrumb to navigate to parent
- **Code Path:** `useDiagramActions.ts:185` → `openCanvasViewInNewTab(path)`
- **File:** Parent diagram
- **Method Used:** `openCanvasViewInNewTab()`
- **Tab Behavior:** Opens in NEW tab

### 8. Property Panel - "Open Diagram" Button
- **User Action:** Select node → Property Panel → "Open Diagram"
- **Code Path:** `PropertyPanel.tsx` → `onOpenDiagram(childPath)` → breadcrumb handler → `openCanvasViewInNewTab()`
- **File:** Linked diagram
- **Method Used:** `openCanvasViewInNewTab()`
- **Tab Behavior:** Opens in NEW tab

### 9. First Time Dashboard Creation
- **User Action:** First launch or dashboard doesn't exist
- **Code Path:** `openDashboard()` creates Context.bac4 → `openCanvasView(contextPath)`
- **File:** Context.bac4 (created)
- **Method Used:** `openCanvasView()`
- **Tab Behavior:** Opens in current leaf

---

## Code Analysis

### Two Main Entry Points

#### `openCanvasView(filePath?: string)` - main.ts:303
**Purpose:** Open diagram in CURRENT leaf (or reuse existing tab)

**Behavior:**
- Checks if file is already open in another tab
- If already open: Activates existing tab, returns
- If not open: Opens in current leaf (`getLeaf(false)`)

**Used By:**
- Dashboard/Ribbon icon ✓
- Command Palette ✓
- File menu context ✓
- Dashboard creation ✓

**Duplicate Prevention:** ✓ YES (checks before opening)

---

#### `openCanvasViewInNewTab(filePath: string)` - main.ts:244
**Purpose:** Open diagram in NEW tab (for drill-down navigation)

**Behavior:**
- Checks if file is already open in another tab
- If already open: Activates existing tab, returns
- If not open: Creates NEW tab (`getLeaf('tab')`)

**Used By:**
- Double-click node ✓
- Right-click context menu ✓
- Breadcrumb navigation ✓
- Property Panel button ✓

**Duplicate Prevention:** ✓ YES (checks before opening)

---

### View Lifecycle Methods

#### `BAC4CanvasView.onOpen()` - canvas-view.tsx:494
**When Called:** View is first created (new tab opened)

**What It Does:**
1. Sets up container styles
2. Calls `renderCanvas()`

#### `BAC4CanvasView.onLoadFile(file)` - canvas-view.tsx:281
**When Called:** File is opened in existing view OR Obsidian opens .bac4 file natively

**What It Does:**
1. Checks for duplicates
2. If duplicate: Closes this view, activates existing
3. If not duplicate: Calls `renderCanvas()`

**⚠️ POTENTIAL ISSUE:** When user clicks .bac4 in file explorer, Obsidian's native file handling might create a new leaf BEFORE our duplicate detection runs.

#### `BAC4CanvasView.setState(state)` - canvas-view.tsx:241
**When Called:** File changes in existing view

**What It Does:**
1. Updates `this.filePath`
2. Calls `renderCanvas()` if root exists

#### `BAC4CanvasView.renderCanvas()` - canvas-view.tsx:464
**What It Does:**
1. **UNMOUNTS** existing React root (critical!)
2. **CREATES** new React root
3. **RENDERS** with `key={this.filePath}` on ReactFlowProvider

**✓ CORRECT:** This ensures fresh React Flow instance every time

---

## Issues Identified

### ⚠️ Issue #1: File Explorer Click Bypass
**Problem:** When user clicks .bac4 file in file explorer, Obsidian's `registerExtensions(['bac4'])` handler creates a leaf and calls `onLoadFile()`. By the time `onLoadFile()` runs, the duplicate tab already exists.

**Current Mitigation:** `onLoadFile()` detects duplicate and closes itself, but this causes a flicker (tab opens then closes).

**Better Solution:** Intercept BEFORE Obsidian creates the leaf.

### ✓ Fixed: React Flow Initialization
**Problem:** React Flow was reusing state across diagram changes.

**Solution:** `renderCanvas()` now ALWAYS unmounts and remounts React root, ensuring fresh instance.

---

## Recommendations

### 1. Consolidate Duplicate Detection
All three entry points have duplicate detection:
- `openCanvasView()` - checks before creating leaf ✓
- `openCanvasViewInNewTab()` - checks before creating leaf ✓
- `onLoadFile()` - checks after leaf created ⚠️

**Recommendation:** Extract to shared function:

```typescript
private checkAndActivateExistingTab(filePath: string): boolean {
  const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
  const existingLeaf = leaves.find((leaf) => {
    const view = leaf.view as any;
    return view.file?.path === filePath;
  });

  if (existingLeaf) {
    console.log('BAC4: File already open, activating existing tab');
    this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
    return true; // Found and activated
  }

  return false; // Not found
}
```

### 2. Override File Explorer Behavior
Currently file explorer clicks can create duplicates because Obsidian handles them natively.

**Solution:** Override the workspace's file open handler:

```typescript
// In onload()
this.registerEvent(
  this.app.workspace.on('file-open', (file) => {
    if (file && file.extension === 'bac4') {
      // Check if already open BEFORE Obsidian creates tab
      if (this.checkAndActivateExistingTab(file.path)) {
        // Prevent Obsidian's default handling
        return false;
      }
    }
  })
);
```

### 3. Single Source of Truth for Opening
Create ONE master function that all paths use:

```typescript
async openDiagram(filePath: string, options: { newTab?: boolean } = {}): Promise<void> {
  // Check if already open
  if (this.checkAndActivateExistingTab(filePath)) {
    return; // Already open, activated it
  }

  // Get leaf (new tab or current)
  const leaf = options.newTab
    ? this.app.workspace.getLeaf('tab')
    : this.app.workspace.getLeaf(false);

  // Open file
  const file = this.app.vault.getAbstractFileByPath(filePath);
  if (file) {
    await leaf.openFile(file as TFile);
  }
}
```

Then simplify:
```typescript
openCanvasView(filePath: string) {
  return this.openDiagram(filePath, { newTab: false });
}

openCanvasViewInNewTab(filePath: string) {
  return this.openDiagram(filePath, { newTab: true });
}
```

---

## Testing Checklist

- [ ] Dashboard icon → Opens Context, no duplicates
- [ ] Command Palette → Opens Context, no duplicates
- [ ] File Explorer click → Opens diagram, no duplicates, no flicker
- [ ] File menu "Open in BAC4 Canvas" → Opens diagram, no duplicates
- [ ] Double-click System node → Opens Container in new tab, no duplicates
- [ ] Double-click Container node → Opens Component in new tab, no duplicates
- [ ] Right-click node → "Open Child" → Opens child, no duplicates
- [ ] Click breadcrumb → Opens parent, no duplicates
- [ ] Property Panel "Open Diagram" → Opens diagram, no duplicates
- [ ] All diagrams show background dots ✓
- [ ] All diagrams show arrows ✓
- [ ] React Flow initializes fresh each time ✓
- [ ] No React Flow state leakage ✓

---

## Current Status

### ✓ Completed
- React Flow initialization (forced remount) ✓
- Background dots rendering ✓
- Arrow rendering ✓
- Duplicate prevention consolidated ✓
- Single source of truth for opening diagrams ✓
- `checkAndActivateExistingDiagram()` helper extracted ✓
- Unified `openDiagram()` method created ✓
- `openCanvasView()` refactored to use unified method ✓
- `openCanvasViewInNewTab()` refactored to use unified method ✓
- **Multi-tab Background conflict fixed** ✓
  - Added unique `id` prop to Background component based on file path
  - Prevents SVG pattern conflicts when multiple tabs open
  - Format: `bg-BAC4-Context-bac4`, `bg-BAC4-Container-1-bac4`, etc.

### ⚠️ Remaining Issue
- File explorer click causes flicker (duplicate detected late)
  - Obsidian's `registerExtensions(['bac4'])` creates leaf before duplicate detection
  - Current mitigation: `onLoadFile()` detects and closes duplicate
  - **Improvement:** Override workspace's `file-open` event handler

### 🔧 Recommended Next Steps
1. ✓ Extract `checkAndActivateExistingTab()` helper - DONE
2. ✓ Create unified `openDiagram()` function - DONE
3. ✓ Refactor `openCanvasView()` to use unified method - DONE
4. ✓ Refactor `openCanvasViewInNewTab()` to use unified method - DONE
5. Override file explorer behavior to prevent flicker (optional improvement)
6. Test all 9 opening methods
