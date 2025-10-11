# Bug Fix Plan - Issues Found in Testing

## Date: 2025-10-10
## Status: Planning Phase

---

## Issues Identified

### Issue #1: Node Palette Not on Right Side
**Severity:** High
**Impact:** Major UI layout issue

**Symptoms:**
- Node palette (System, Person, External) appears in center/wrong position
- Not aligned with expected right-side layout

**Root Cause Analysis:**
- Panel positioning might be incorrect
- CSS styling might be overriding position
- Multiple panels might be conflicting

**Solution:**
1. Check Panel position prop in canvas-view.tsx
2. Verify CSS for `.react-flow__panel` positioning
3. Ensure right panel has proper `right: 0` positioning
4. Check for z-index conflicts
5. May need to adjust panel stacking order

**Files to Check:**
- `src/ui/canvas-view.tsx` - Panel position
- `src/styles.css` - Panel CSS rules

---

### Issue #2: Double-Click Not Creating Child Diagrams
**Severity:** Critical
**Impact:** Core functionality broken

**Symptoms:**
- Double-clicking System node does nothing
- Console shows drill-down logs but no child created
- May be related to relationships.json issues

**Root Cause Analysis:**
- `findChildDiagram()` may be failing silently
- `createChildDiagram()` might have errors
- File path resolution issues
- Relationships.json not being created/read properly

**Solution:**
1. Add better error logging to double-click handler
2. Check if relationships.json file exists
3. Verify `navigationService.findChildDiagram()` logic
4. Verify `navigationService.createChildDiagram()` file creation
5. Test file system permissions
6. Add try-catch with detailed logging

**Files to Check:**
- `src/ui/canvas-view.tsx` - onNodeDoubleClick handler
- `src/services/diagram-navigation-service.ts` - findChildDiagram, createChildDiagram

---

### Issue #3: Rename Button Error - "prompt is not supported"
**Severity:** High
**Impact:** Rename feature completely broken

**Symptoms:**
- Clicking rename button causes error
- Error: `prompt is not a null or not supported`
- Error occurs in Electron/Obsidian environment

**Root Cause Analysis:**
- **Browser `prompt()` is not available in Electron/Obsidian**
- Obsidian runs in Electron which may disable `window.prompt`
- Need to use Obsidian's native modal/input system instead

**Solution:**
1. **Replace `prompt()` with Obsidian Modal**
2. Use Obsidian's `Modal` class to create input dialog
3. Create custom RenameModal component
4. Use Obsidian API: `new Modal(app)` with text input

**Example Fix:**
```typescript
// Instead of:
const newName = prompt('Enter new name:', currentName);

// Use Obsidian Modal:
class RenameModal extends Modal {
  onSubmit: (name: string) => void;

  constructor(app: App, currentName: string, onSubmit: (name: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'Rename Diagram' });

    const input = contentEl.createEl('input', {
      type: 'text',
      value: this.currentName
    });

    // ... submit button
  }
}
```

**Files to Modify:**
- `src/ui/canvas-view.tsx` - Replace prompt with Modal
- May need to create `src/ui/components/RenameModal.ts`

---

### Issue #4: JPEG Export Shows Black Box
**Severity:** Medium
**Impact:** Export feature broken

**Symptoms:**
- Exported JPEG shows black rectangle
- No diagram content visible
- Only shows edges outline maybe

**Root Cause Analysis:**
- `html-to-image` library issue with React Flow
- Viewport selection wrong
- Canvas rendering timing issue
- Need to capture specific elements, not whole viewport
- Background/foreground rendering order

**Solution:**
1. **Change export target** - Don't export `.react-flow__viewport`
2. **Export specific container** - Target `.react-flow` or specific wrapper
3. **Wait for render** - Add delay before capture
4. **Check z-index/visibility** - Ensure nodes are in correct layer
5. **Alternative:** Use React Flow's built-in export if available

**Better Approach:**
```typescript
// Instead of viewport, export the whole react-flow container
const flowElement = document.querySelector('.react-flow') as HTMLElement;

// Or get bounding box of all nodes and export that region
const nodes = getNodes();
// Calculate bounds
// Export bounded region
```

**Files to Modify:**
- `src/ui/components/DiagramActionsToolbar.tsx` - handleExportJPEG function

---

## Implementation Order

### Priority 1: Critical Functionality (Do First)
1. **Issue #2: Fix Double-Click** - Core feature, must work
2. **Issue #3: Fix Rename** - Replace prompt with Modal

### Priority 2: UI Issues
3. **Issue #1: Fix Palette Position** - Layout correctness
4. **Issue #4: Fix JPEG Export** - Nice-to-have feature

---

## Detailed Fix Steps

### Step 1: Fix Double-Click (30 min)
1. Add detailed console logging to onNodeDoubleClick
2. Check if navigationService methods are being called
3. Verify relationships.json is being created
4. Check file paths are correct
5. Test file creation in vault
6. Add error alerts for debugging

### Step 2: Fix Rename Modal (45 min)
1. Create RenameModal component using Obsidian Modal class
2. Replace prompt() call with modal
3. Handle modal submit/cancel
4. Test in Obsidian environment
5. Add validation (empty name, duplicate name)

### Step 3: Fix Panel Position (15 min)
1. Check Panel position in canvas-view
2. Adjust CSS if needed
3. Test panel stacking
4. Verify responsive behavior

### Step 4: Fix JPEG Export (30 min)
1. Change target element for export
2. Add render delay if needed
3. Test with actual diagram content
4. Verify edges and nodes both appear

---

## Testing Plan

### Test 1: Double-Click
- [ ] Double-click System node
- [ ] Check console for logs
- [ ] Verify file created in vault
- [ ] Verify relationships.json updated
- [ ] Child diagram opens

### Test 2: Rename
- [ ] Click rename button
- [ ] Modal appears (no error)
- [ ] Enter new name
- [ ] File renamed
- [ ] Breadcrumbs updated

### Test 3: Panel Position
- [ ] Open Context diagram
- [ ] Verify palette on right side
- [ ] Check all buttons visible
- [ ] Verify scrolling works

### Test 4: JPEG Export
- [ ] Create diagram with nodes
- [ ] Click "Save as JPEG"
- [ ] Open exported file
- [ ] Verify nodes visible
- [ ] Verify edges visible

---

## Expected Outcomes

After fixes:
- ✅ Node palette consistently on right side
- ✅ Double-click creates/opens child diagrams
- ✅ Rename uses Obsidian modal (no error)
- ✅ JPEG export shows full diagram

---

## Risk Assessment

**Low Risk:**
- Panel positioning fix (CSS only)
- JPEG export fix (confined to one function)

**Medium Risk:**
- Rename modal (need to learn Obsidian Modal API)

**High Risk:**
- Double-click fix (may reveal deeper issues with relationships system)

---

## Next Steps

1. Start with Issue #2 (double-click) - most critical
2. Then Issue #3 (rename modal) - complete feature
3. Then Issue #1 (panel position) - polish
4. Finally Issue #4 (JPEG export) - enhancement

**Estimated Total Time:** 2 hours
