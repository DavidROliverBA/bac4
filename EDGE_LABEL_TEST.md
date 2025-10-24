# Edge Label Persistence Test

## Manual Test Procedure

**Test:** Verify that edge label changes persist across file save/reload

### Steps:

1. **Setup:**
   - Open file: `BAC4/New Market.bac4`
   - Identify an edge (should have label "reads")

2. **Edit Edge Label:**
   - Click on the edge to select it
   - Property Panel should show "Edge Properties"
   - Current label should be: "reads"
   - Change label to: "writes"
   - Property Panel should immediately show: "writes"

3. **Test Immediate UI Update:**
   - ✅ PASS: Edge label in Property Panel updates to "writes"
   - ❌ FAIL: Edge label stays as "reads"

4. **Test Auto-Save (Wait 300ms):**
   - Wait 5 seconds for auto-save
   - Check browser console for: "BAC4 v2.5: ✅ Auto-saved successfully"

5. **Test File Reload:**
   - Close the file tab (Cmd+W)
   - Reopen: `BAC4/New Market.bac4`
   - Click on the same edge
   - Check Property Panel label

6. **Expected Results:**
   - ✅ PASS: Edge label shows "writes" after reload
   - ❌ FAIL: Edge label reverts to "reads" after reload

## Code Review Findings

### Edge Label Data Flow

**SAVE PATH (splitNodesAndEdges):**
```typescript
// Line 480: Convert React Flow edges to v2.5 format
const graphEdges: EdgeV2[] = edges.map((edge) => {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edgeType,
    properties: {
      label: edge.data?.label,  // ← SAVED HERE
      ...edge.data,
    },
    // ...
  };
});
```

**LOAD PATH (getEdgesFromGraph):**
```typescript
// Line 336: Convert v2.5 edges to React Flow format
const edges: Edge[] = snapshot.edges.map((edge) => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  type: edge.type || 'default',
  data: {
    label: edge.properties.label,  // ← LOADED HERE
    direction: edge.style.direction,
    ...edge.properties,
  },
  // ...
}));
```

**UPDATE PATH (useEdgeHandlers.updateEdgeLabel):**
```typescript
// Line 90-113: Update edge label in React state
const updateEdgeLabel = React.useCallback(
  (edgeId: string, newLabel: string) => {
    let updatedEdge: Edge<EdgeData> | null = null;

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          updatedEdge = {
            ...edge,
            data: { ...edge.data, label: newLabel },  // ← UPDATED HERE
          };
          return updatedEdge;
        }
        return edge;
      })
    );

    if (updatedEdge) {
      onEdgeSelect(updatedEdge);  // ← UPDATES SELECTED EDGE IN UI
    }
  },
  [setEdges, onEdgeSelect]
);
```

**AUTO-SAVE TRIGGER:**
```typescript
// useFileOperations.ts line 376
}, [nodes, edges, annotations, timeline, filePath, plugin]);  // ← edges is a dependency
```

### Potential Issues Found

**Issue 1: Object Spread Order** ❓
In `getEdgesFromGraph` (line 344):
```typescript
data: {
  label: edge.properties.label,    // Set label
  direction: edge.style.direction,  // Set direction
  ...edge.properties,                // Spread all properties (includes label again)
}
```

The `...edge.properties` includes `label`, so it overwrites the explicitly set `label` on line 342. However, both sources have the same value, so this shouldn't cause issues.

**Issue 2: Direction Duplication** ⚠️
`direction` is stored in TWO places:
- `edge.properties.direction` (saved from ...edge.data)
- `edge.style.direction` (saved from edge.data.direction)

When loading, line 343 uses `edge.style.direction`, but line 344 spreads `edge.properties` which includes `direction`. The spread will override the value from line 343.

**Issue 3: Auto-Save Timing** ⏱️
Edge label changes trigger auto-save after 300ms debounce. If the user:
1. Changes edge label
2. Closes file before 300ms
3. Changes may not be saved

But the user said they ARE waiting for auto-save, so this shouldn't be the issue.

### File Structure Verification

From actual file: `/Users/david.oliver/Documents/Vaults/BAC4Testv09/BAC4/New Market.bac4-graph`

```json
{
  "id": "reactflow__edge-node-2bottom-node-1top",
  "source": "node-2",
  "target": "node-1",
  "type": "default",
  "properties": {
    "label": "reads",     // ✅ Label is stored here
    "direction": "right",  // ⚠️ Also in style
    "style": "curved"      // ⚠️ Different from edge.style.markerEnd
  },
  "style": {
    "direction": "right",  // ⚠️ Duplicate
    "lineType": "solid",
    "color": "#888888",
    "markerEnd": "arrowclosed"
  }
}
```

### HYPOTHESIS

**Most Likely Issue:** No actual bug - user interface may be confusing

The edge label editing IS working in the code. However, the user might be experiencing:
1. Auto-save didn't complete (closed file too quickly)
2. Wrong edge selected after reload
3. Multiple edges between same nodes causing confusion

**Secondary Issue:** Data duplication
- `direction` is stored in both `properties` and `style`
- `style` property in edge.data could refer to edge style ("curved") OR edge.data.style
- This creates confusion but shouldn't break functionality

## Recommended Actions

1. **Add Manual Test:** Run the test procedure above to verify if bug exists
2. **Add Console Logging:** Enhance edge update logging to track save/load
3. **Fix Data Duplication:** Clean up the spread patterns to avoid confusion
4. **Add Regression Test:** Automated test for edge label persistence
