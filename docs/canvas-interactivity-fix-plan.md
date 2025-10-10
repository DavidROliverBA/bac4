# Canvas Interactivity Fix Plan

## Problem
The canvas renders correctly but has NO interactivity:
- ❌ Cannot drag nodes
- ❌ Cannot click nodes (no property panel)
- ❌ Cannot create edges between nodes
- ❌ Cannot drag components from palette
- ❌ No zoom/pan controls visible
- ❌ No minimap visible

## Root Cause Analysis

### Possible Issues:
1. **React Flow not initializing properly** - onInit not being called
2. **CSS z-index conflicts** - Obsidian UI blocking React Flow interactions
3. **Event handlers not bound** - Mouse events not reaching React Flow
4. **React Flow wrapper styling** - Container not sized properly
5. **Obsidian's ItemView containerEl** - Wrong DOM element being used
6. **React strict mode issues** - Double rendering causing issues
7. **CSS from Obsidian overriding** - React Flow styles being overridden

## Investigation Steps

### Step 1: Verify React Flow Initialization
- [ ] Add console.log to onInit callback
- [ ] Check if reactFlowInstance is being set
- [ ] Verify nodes and edges arrays are populated
- [ ] Check browser console for React Flow errors

### Step 2: Check DOM Structure
- [ ] Inspect element hierarchy in DevTools
- [ ] Verify `.react-flow` class exists
- [ ] Check computed styles on React Flow elements
- [ ] Look for pointer-events: none anywhere
- [ ] Check z-index stacking context

### Step 3: Verify Event Handlers
- [ ] Add console.log to onNodeClick
- [ ] Add console.log to onNodesChange
- [ ] Add console.log to onConnect
- [ ] Add console.log to onDrop
- [ ] Check if ANY mouse events are firing

### Step 4: Check Container Sizing
- [ ] Verify reactFlowWrapper ref has dimensions
- [ ] Check if container height/width are > 0
- [ ] Verify position: relative on parent
- [ ] Check if overflow: hidden is blocking

## Fix Implementation Plan

### Fix 1: Ensure Proper Container Setup
```typescript
// In BAC4CanvasView.onOpen()
- [ ] Use correct containerEl child element
- [ ] Set explicit height/width on container
- [ ] Add position: relative
- [ ] Ensure no overflow: hidden on parents
```

### Fix 2: Add Debugging to React Flow
```typescript
- [ ] Add onInit with console.log
- [ ] Add onError handler
- [ ] Log all event handlers
- [ ] Verify reactFlowInstance exists
```

### Fix 3: Fix CSS Conflicts
```css
- [ ] Add .bac4-canvas-view { pointer-events: auto; }
- [ ] Ensure React Flow container has proper z-index
- [ ] Override any Obsidian styles that might block
- [ ] Add explicit dimensions to react-flow wrapper
```

### Fix 4: Add React Flow Wrapper Styles
```typescript
- [ ] Set position: relative on wrapper
- [ ] Set explicit width: 100%, height: 100%
- [ ] Add data-testid for debugging
- [ ] Remove any conflicting Obsidian classes
```

### Fix 5: Verify ReactFlowProvider
```typescript
- [ ] Ensure ReactFlowProvider wraps ReactFlow
- [ ] Check if provider context is accessible
- [ ] Verify hooks (useNodesState, useEdgesState) work
```

### Fix 6: Test Controls Visibility
```typescript
- [ ] Verify Controls component renders
- [ ] Check if controls have pointer-events
- [ ] Test MiniMap rendering
- [ ] Add explicit positioning if needed
```

### Fix 7: Handle Obsidian-Specific Issues
```typescript
- [ ] Check if Obsidian's modal/overlay blocks events
- [ ] Verify ItemView doesn't have event capture
- [ ] Test with/without React.StrictMode
- [ ] Check Obsidian's workspace leaf behavior
```

## Testing Checklist

After each fix, test:
- [ ] Can drag a node
- [ ] Can click a node (property panel appears)
- [ ] Can drag from node handle to create edge
- [ ] Can drag component from palette
- [ ] Zoom controls visible and working
- [ ] Minimap visible
- [ ] Pan with mouse drag
- [ ] Delete key works

## Debugging Commands

```javascript
// In browser console:
// Check if React Flow is mounted
document.querySelector('.react-flow')

// Check computed styles
getComputedStyle(document.querySelector('.react-flow'))

// Check for pointer-events
document.querySelector('.react-flow').style.pointerEvents

// Get React Flow instance
window.__reactFlowInstance
```

## Expected Outcome

After fixes:
✅ Nodes are draggable
✅ Nodes are clickable (property panel)
✅ Edges can be created by dragging handles
✅ Components can be dragged from palette
✅ Zoom/pan controls visible and working
✅ Minimap visible
✅ All interactions smooth and responsive

## Files to Modify

1. `src/ui/canvas-view.tsx` - Main canvas component
2. `src/styles.css` - Add/fix CSS for React Flow
3. `tests/manual-testing.md` - Document testing steps

## Next Steps

1. Start with Step 1: Add debugging console.logs
2. Test in Obsidian and check browser console
3. Based on logs, identify root cause
4. Apply targeted fix
5. Test all interactions
6. Commit working solution
