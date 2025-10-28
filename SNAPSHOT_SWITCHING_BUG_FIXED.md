# Snapshot Switching Bug Fixed ✅

**Issue:** When switching between snapshots, nodes would disappear from the original snapshot

**Status:** ✅ **FIXED** - All snapshot operations now work correctly

**Build Status:** ✅ Success (747.7kb in 69ms)

---

## Problem Description

**User Report:**
> "The nodes are in current and Phase 2 (the new snapshot) but when I return to the previous nodes are still there, then return to the new snapshot all good nodes still there but then when I return to current the nodes have disappeared"

**Detailed Bug Flow:**
1. Add nodes to "Current" snapshot ✅
2. Create "Phase 2" snapshot → nodes appear in Phase 2 ✅
3. Switch to "Phase 2" → nodes still there ✅
4. **Switch back to "Current" → nodes disappeared!** ❌
5. Switch to "Phase 2" again → nodes still there ✅
6. **Switch back to "Current" → nodes still gone!** ❌

---

## Root Cause

**File:** `src/ui/canvas-view.tsx`
**Function:** `handleSnapshotSwitch` (line 522)

The snapshot switching function was **missing a critical step**: it loaded the target snapshot immediately **without saving the current canvas state first**.

**What happened:**
1. User adds nodes to "Current" snapshot
2. User clicks to switch to "Phase 2"
3. ❌ **Function never saves the current canvas state**
4. Function loads "Phase 2" snapshot data
5. User switches back to "Current"
6. ❌ **Function loads old "Current" data (which had no nodes)**

**Result:** All changes to "Current" were lost because they were never saved to the snapshot.

---

## The Fix

**Location:** `src/ui/canvas-view.tsx` lines 522-611

**Before (BROKEN):**
```typescript
const handleSnapshotSwitch = React.useCallback(
  (snapshotId: string) => {
    if (!timeline) return;

    // ❌ MISSING: Save current canvas state to current snapshot

    // Load target snapshot
    const result = TimelineService.switchSnapshot(snapshotId, timeline);
    let updatedNodes = result.nodes;
    let updatedEdges = result.edges;

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setAnnotations(result.annotations);

    // Update timeline's currentSnapshotId
    setTimeline({
      ...timeline,
      currentSnapshotId: snapshotId,
    });
  },
  [timeline, setNodes, setEdges, setAnnotations, showChanges, baseSnapshotId]
);
```

**After (FIXED):**
```typescript
const handleSnapshotSwitch = React.useCallback(
  (snapshotId: string) => {
    if (!timeline) return;

    // ✅ FIX: Save current canvas state to current snapshot BEFORE switching
    // This prevents losing nodes when switching between snapshots
    const currentSnapshotIndex = timeline.snapshots.findIndex(
      (s) => s.id === timeline.currentSnapshotId
    );

    let updatedTimeline = timeline;
    if (currentSnapshotIndex !== -1) {
      console.log('BAC4: Saving current canvas state before switching', {
        currentSnapshot: timeline.currentSnapshotId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      const updatedSnapshots = [...timeline.snapshots];
      updatedSnapshots[currentSnapshotIndex] = {
        ...updatedSnapshots[currentSnapshotIndex],
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
        edges: JSON.parse(JSON.stringify(edges)), // Deep copy
        annotations: JSON.parse(JSON.stringify(annotations)), // Deep copy
      };

      updatedTimeline = {
        ...timeline,
        snapshots: updatedSnapshots,
      };
    }

    // Now load target snapshot (using updatedTimeline with saved state)
    const result = TimelineService.switchSnapshot(snapshotId, updatedTimeline);
    let updatedNodes = result.nodes;
    let updatedEdges = result.edges;

    // Apply change detection (using updatedTimeline)
    if (showChanges && baseSnapshotId && baseSnapshotId !== snapshotId) {
      const baseSnapshot = TimelineService.getSnapshotById(baseSnapshotId, updatedTimeline);
      const currentSnapshot = TimelineService.getSnapshotById(snapshotId, updatedTimeline);
      // ... change detection code ...
    }

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setAnnotations(result.annotations);

    // Update timeline's currentSnapshotId (use updatedTimeline with saved state)
    setTimeline({
      ...updatedTimeline,
      currentSnapshotId: snapshotId,
    });
  },
  [timeline, nodes, edges, annotations, setNodes, setEdges, setAnnotations, showChanges, baseSnapshotId]
);
```

---

## Additional Fix: v1.0.0 Format Warning

**Secondary Issue:** "This diagram is using an old format" warning appeared

**Root Cause:** Two commands were still creating v1.0.0 format diagrams:
1. Dashboard command (line 446)
2. Create Context Diagram command (line 600)

**Files Fixed:** `src/main.ts`

**Before (Dashboard - line 446):**
```typescript
// Create empty Context diagram (v1.0.0 format with timeline)
const now = new Date().toISOString();
const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
const emptyDiagram = {
  version: '1.0.0',
  metadata: {
    diagramType: 'context',
    createdAt: now,
    updatedAt: now,
  },
  timeline: initialTimeline,
};
await this.app.vault.adapter.write(contextPath, JSON.stringify(emptyDiagram, null, 2));
```

**After (Dashboard - line 446):**
```typescript
// Create empty Context diagram (v2.5.0 dual-file format)
const { createDefaultBAC4File, createDefaultGraphFile } = await import('./types/bac4-v2-types');
const { writeDiagram } = await import('./services/file-io-service');

const nodeFile = createDefaultBAC4File('Context', 'context', 'context');
const graphFile = createDefaultGraphFile('Context.bac4', 'Context', 'c4-context');

await writeDiagram(this.app.vault, contextPath, nodeFile, graphFile);
console.log('BAC4: Created empty Context diagram with v2.5.0 dual-file format');
```

**Same fix applied at line 595-605 for Create Context Diagram command.**

---

## Files Changed

### Modified Files (2)

1. **`src/ui/canvas-view.tsx`** (Snapshot switching fix)
   - Lines 522-611: Added save-before-switch logic
   - Lines 526-552: Save current canvas state to current snapshot
   - Line 554: Use `updatedTimeline` instead of `timeline`
   - Lines 560-561: Use `updatedTimeline` for change detection
   - Line 604: Use `updatedTimeline` for setTimeline
   - Line 610: Added missing dependencies: `nodes`, `edges`, `annotations`

2. **`src/main.ts`** (v1.0.0 format fixes)
   - Lines 446-454: Dashboard command now creates v2.5.0 format
   - Lines 595-605: Create Context command now creates v2.5.0 format

---

## Testing Checklist

### ✅ Test 1: Create Snapshot with Nodes
- [x] Create diagram
- [x] Add nodes to "Current" snapshot
- [x] Create "Phase 2" snapshot
- [x] **Expected:** Nodes visible in both snapshots
- [x] **Result:** ✅ Works

### ✅ Test 2: Switch to New Snapshot
- [x] Switch from "Current" to "Phase 2"
- [x] **Expected:** Nodes still visible
- [x] **Result:** ✅ Works

### ✅ Test 3: Switch Back to Original (THE BUG)
- [x] Switch from "Phase 2" back to "Current"
- [x] **Expected:** Nodes still visible (not disappeared!)
- [x] **Result:** ✅ Works - NODES PERSIST!

### ✅ Test 4: Multiple Switches
- [x] Switch between snapshots multiple times
- [x] **Expected:** Nodes remain in both snapshots
- [x] **Result:** ✅ Works

### ✅ Test 5: No Format Warning
- [x] Create new diagram (any type)
- [x] **Expected:** No "old format" warning
- [x] **Result:** ✅ Works - creates v2.5.0 format

---

## Build Results

```bash
$ npm run build

> bac4@3.0.0 build
> node esbuild.config.mjs production

  main.js  747.7kb

⚡ Done in 69ms
```

**Status:** ✅ Success
**Size:** 747.7kb
**Errors:** 0

---

## How It Works Now

### Creating a Snapshot

1. User adds nodes to "Current" snapshot
2. User clicks "Add Snapshot" → creates "Phase 2"
3. Auto-save (1 second debounce) saves to disk
4. Both snapshots now contain the nodes

### Switching Between Snapshots

**When switching from "Current" to "Phase 2":**

1. **Save current state:** System saves canvas nodes/edges/annotations to "Current" snapshot
   ```typescript
   updatedSnapshots[currentIndex] = {
     ...currentSnapshot,
     nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy of canvas
     edges: JSON.parse(JSON.stringify(edges)),
     annotations: JSON.parse(JSON.stringify(annotations)),
   };
   ```

2. **Load target state:** System loads "Phase 2" snapshot data
   ```typescript
   const result = TimelineService.switchSnapshot('Phase 2', updatedTimeline);
   setNodes(result.nodes);
   setEdges(result.edges);
   ```

3. **Update timeline:** System updates current snapshot ID
   ```typescript
   setTimeline({
     ...updatedTimeline, // Contains saved "Current" state
     currentSnapshotId: 'Phase 2',
   });
   ```

**When switching back from "Phase 2" to "Current":**

1. **Save "Phase 2" state:** System saves current canvas to "Phase 2" snapshot
2. **Load "Current" state:** System loads saved "Current" data (which now has nodes!)
3. **Result:** Nodes reappear correctly ✅

---

## Summary of All Fixes

### Original Snapshot Creation Bug (Fixed Earlier)
**Issue:** Creating snapshot auto-switched to new snapshot
**Fix:** Changed `currentSnapshotId: snapshot.id` to `currentSnapshotId: currentTimeline.currentSnapshotId`
**File:** `src/services/TimelineService.ts` line 75

### Auto-Save Bug (Fixed Earlier)
**Issue:** Auto-save used `timeline.currentIndex` (doesn't exist)
**Fix:** Changed to use `.find(s => s.id === timeline.currentSnapshotId)`
**File:** `src/ui/canvas/hooks/useFileOperations.ts` lines 78-86, 187-195

### Snapshot Switching Bug (Fixed Now)
**Issue:** Switching snapshots didn't save current state first
**Fix:** Added save-before-switch logic
**File:** `src/ui/canvas-view.tsx` lines 522-611

### v1.0.0 Format Bug (Fixed Now)
**Issue:** Some commands created v1.0.0 diagrams
**Fix:** Changed to create v2.5.0 dual-file format
**File:** `src/main.ts` lines 446-454, 595-605

---

## What Works Now

✅ Create snapshots without nodes disappearing
✅ Switch between snapshots - nodes persist
✅ All snapshots maintain their state independently
✅ Auto-save works correctly
✅ Manual save works correctly
✅ All new diagrams created in v2.5.0 format
✅ No "old format" warnings
✅ Change detection works (show differences between snapshots)

---

**Status:** ✅ **ALL SNAPSHOT BUGS FIXED**

User confirmation: "this works as expected"

---

*Fixed: October 24, 2025*
*BAC4 Plugin v3.0.0 (with v2.5.0 support)*
