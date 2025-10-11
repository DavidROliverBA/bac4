# Refactoring Plan - UI & Navigation Improvements

## Overview
Major refactoring to improve breadcrumb logic, child diagram loading, file renaming, and consistent UI layout.

## Tasks

### 1. Refactor Breadcrumb Logic
**Goal:** Simplify breadcrumb loading and make it more reliable

**Current Issues:**
- Breadcrumbs load on multiple triggers (selectedNode change, filePath change)
- Complex logic trying to show child breadcrumbs when node selected
- Can be confusing and cause unnecessary re-renders

**Solution:**
- Remove complex "show child breadcrumbs" logic
- Breadcrumbs always show current diagram's hierarchy
- Simplify to single useEffect with filePath dependency
- Load breadcrumbs once when diagram opens

**Files to modify:**
- `src/ui/canvas-view.tsx` - Simplify breadcrumb useEffect

---

### 2. Refactor Double-Click Child Diagram Loading
**Goal:** Make drill-down more reliable and user-friendly

**Current Issues:**
- Double-click logic is complex
- Error handling could be better
- No visual feedback when loading

**Solution:**
- Simplify double-click handler
- Add loading state/indicator
- Better error messages
- Use `findChildDiagram` first, only create if not found
- Consistent behavior across all node types

**Files to modify:**
- `src/ui/canvas-view.tsx` - Simplify onNodeDoubleClick handler
- Add loading toast/notification

---

### 3. Add File Rename Facility
**Goal:** Allow users to rename diagram files from UI

**Solution:**
- Add "Rename" button to DiagramActionsToolbar
- Show modal/prompt for new name
- Update file in vault (Obsidian's rename API)
- Update relationships.json with new path
- Refresh canvas after rename

**Files to create:**
- `src/ui/components/RenameModal.tsx` - Modal for renaming

**Files to modify:**
- `src/ui/components/DiagramActionsToolbar.tsx` - Add rename button
- `src/services/diagram-navigation-service.ts` - Add `renameDiagram()` method
- `src/ui/canvas-view.tsx` - Add rename handler

---

### 4. Move Context Diagram Tools to Right Panel
**Goal:** Consistent layout - all node palettes on right side

**Solution:**
- Move Context diagram tools (System, Person, External) to right panel
- Remove from top toolbar
- Show as vertical panel on right side

---

### 5. Move Container Diagram Tools to Right Panel
**Goal:** Consistent layout - all node palettes on right side

**Solution:**
- Move Container diagram tools (WebApp, API, Database, etc.) to right panel
- Remove from top toolbar
- Show as vertical panel on right side

---

### 6. Update DiagramToolbar Component
**Goal:** Convert horizontal toolbar to vertical right-side panel

**Current:** Horizontal toolbar at top
**New:** Vertical panel on right side

**Solution:**
- Update DiagramToolbar to render vertically
- Add proper styling for vertical layout
- Use Panel position="top-right" in ReactFlow
- Consistent with ComponentPalette design

**Files to modify:**
- `src/ui/components/DiagramToolbar.tsx` - Update to vertical layout
- `src/ui/canvas-view.tsx` - Move DiagramToolbar to Panel on right

---

## Testing Checklist

### Breadcrumbs Testing
- [ ] Open root diagram - breadcrumbs show just root
- [ ] Open child diagram - breadcrumbs show full path
- [ ] Navigate via breadcrumbs - works correctly
- [ ] No unnecessary re-renders

### Double-Click Testing
- [ ] Double-click System node (context) - opens/creates container diagram
- [ ] Double-click Container node (container) - opens/creates component diagram
- [ ] Double-click existing child - opens without error
- [ ] Double-click non-drillable node - nothing happens (expected)
- [ ] Error handling works

### File Rename Testing
- [ ] Click rename button - modal appears
- [ ] Enter new name - file renamed in vault
- [ ] Relationships updated with new path
- [ ] Breadcrumbs update with new name
- [ ] Child diagrams still work after rename

### Right-Side Panels Testing
- [ ] Context diagram - tools appear on right
- [ ] Container diagram - tools appear on right
- [ ] Component diagram - AWS palette on right (already works)
- [ ] All palettes scroll if too long
- [ ] Drag from palette - works
- [ ] Click to add - works

---

## Implementation Order

1. **Breadcrumb Refactor** (15 min)
   - Simplify logic
   - Test navigation
   - ✅ Mark complete when tested

2. **Double-Click Refactor** (20 min)
   - Simplify handler
   - Add loading state
   - Test drill-down
   - ✅ Mark complete when tested

3. **File Rename Facility** (30 min)
   - Create modal component
   - Add rename method to service
   - Wire up UI
   - Test renaming
   - ✅ Mark complete when tested

4. **Move Toolbars to Right** (20 min)
   - Update DiagramToolbar for vertical layout
   - Move to right panel in canvas-view
   - Test all diagram types
   - ✅ Mark complete when tested

5. **Final Build & Test** (15 min)
   - Run full build
   - Test all features together
   - ✅ Mark complete when all tests pass

**Total Estimated Time:** ~2 hours

---

## Success Criteria

- ✅ Breadcrumbs load reliably and show correct hierarchy
- ✅ Double-click always opens child diagram (creates if needed)
- ✅ Users can rename diagrams from UI
- ✅ All node palettes consistently on right side
- ✅ No errors in console
- ✅ All functionality tested and working
