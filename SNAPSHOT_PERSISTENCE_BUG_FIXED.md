# Snapshot Persistence Bug Fixed ✅

**Issue:** Snapshots lost when closing and reopening file via tab

**Status:** ✅ **FIXED** - Snapshots now persist to disk immediately when created

**Build Status:** ✅ Success (749.3kb in 45ms)

---

## Problem Description

**User Report:**
> "when I close a file via the tab and re open it, it loses the snapshot I've made"

**Detailed Bug Flow:**
1. User opens diagram ✅
2. User creates a snapshot (e.g., "Phase 2") ✅
3. Snapshot appears in timeline panel ✅
4. User closes the tab
5. User reopens the file
6. **Snapshot is gone!** ❌
7. Only "Current" snapshot remains

---

## Root Cause

**File:** `src/ui/canvas/hooks/useFileOperations.ts`

The auto-save function **did not watch the `timeline` state**, so when you created a snapshot:

1. Snapshot created → `setTimeline(updatedTimeline)` (React state updated)
2. **Auto-save doesn't trigger** (timeline not in dependency array) ❌
3. Timeline changes only exist in memory, not on disk
4. Close tab → React state cleared
5. Reopen → Loads from disk (old timeline without new snapshot)
6. **Snapshot lost!** ❌

**The Missing Dependency:**

```typescript
// Before (BROKEN):
React.useEffect(() => {
  // Auto-save logic...
}, [nodes, edges, annotations, filePath, plugin]); // ❌ No timeline!
```

When `timeline` changes (snapshot created), auto-save doesn't run, so the new snapshot is never saved to the `.bac4-graph` file.

**Secondary Issue:**

Even if auto-save triggered, `graphFileRef` wasn't updated with the new timeline before `splitNodesAndEdges` was called. The `splitNodesAndEdges` function uses `graphFileRef.current.timeline` to build the saved file, so it would still use the old timeline!

---

## The Fix

### Fix #1: Add Timeline to Auto-Save Dependencies

**Location:** `src/ui/canvas/hooks/useFileOperations.ts` line 131

```typescript
// Before (BROKEN):
}, [nodes, edges, annotations, filePath, plugin]);

// After (FIXED):
}, [nodes, edges, annotations, timeline, filePath, plugin]);
```

Now auto-save triggers when timeline changes (snapshot created).

### Fix #2: Update GraphFileRef Before Save

**Location:** `src/ui/canvas/hooks/useFileOperations.ts` lines 96-107

```typescript
// Before (BROKEN):
const saveTimeout = setTimeout(async () => {
  // Immediately call splitNodesAndEdges with old graphFileRef
  const { nodeFile, graphFile } = splitNodesAndEdges(
    nodes,
    edges,
    nodeFileRef.current!,
    graphFileRef.current! // ❌ Has old timeline!
  );

// After (FIXED):
const saveTimeout = setTimeout(async () => {
  // ✅ FIX: Update graphFileRef with current timeline before saving
  // This ensures snapshot changes are persisted to disk
  if (timeline && graphFileRef.current) {
    graphFileRef.current = {
      ...graphFileRef.current,
      timeline: {
        snapshots: timeline.snapshots,
        currentSnapshotId: timeline.currentSnapshotId,
        snapshotOrder: timeline.snapshotOrder,
      },
    };
  }

  // Now splitNodesAndEdges uses updated timeline
  const { nodeFile, graphFile } = splitNodesAndEdges(
    nodes,
    edges,
    nodeFileRef.current!,
    graphFileRef.current! // ✅ Has new timeline!
  );
```

This ensures the React timeline state is merged into the ref before saving.

---

## How It Works Now

### Creating a Snapshot

**Before (BROKEN):**
1. User creates "Phase 2" snapshot
2. `setTimeline(updatedTimeline)` updates React state ✅
3. Auto-save doesn't trigger (timeline not in deps) ❌
4. Close tab → state lost
5. Reopen → snapshot gone ❌

**After (FIXED):**
1. User creates "Phase 2" snapshot
2. `setTimeline(updatedTimeline)` updates React state ✅
3. **Auto-save triggers** (timeline in deps now!) ✅
4. **graphFileRef updated** with new timeline ✅
5. `splitNodesAndEdges` uses updated timeline ✅
6. **Saved to .bac4-graph file** ✅
7. Close tab → state cleared (but data on disk!)
8. Reopen → **snapshot still there!** ✅

### Auto-Save Flow

```typescript
// 1. Snapshot created
setTimeline({
  snapshots: [...oldSnapshots, newSnapshot],
  currentSnapshotId: 'current',
  snapshotOrder: [...oldOrder, newSnapshot.id]
});

// 2. Auto-save triggers (timeline in dependency array)
React.useEffect(() => {
  setTimeout(async () => {
    // 3. Update ref with current timeline
    graphFileRef.current = {
      ...graphFileRef.current,
      timeline: {
        snapshots: timeline.snapshots, // ✅ Has new snapshot!
        currentSnapshotId: timeline.currentSnapshotId,
        snapshotOrder: timeline.snapshotOrder,
      },
    };

    // 4. Convert to file format (uses updated ref)
    const { graphFile } = splitNodesAndEdges(..., graphFileRef.current);

    // 5. Write to disk
    await writeDiagram(vault, filePath, nodeFile, graphFile);
    // ✅ Snapshot now saved to .bac4-graph file!
  }, 1000);
}, [timeline]); // ✅ Triggers when timeline changes!
```

---

## Files Changed

### Modified Files (1)

**`src/ui/canvas/hooks/useFileOperations.ts`**
- Lines 96-107: Update graphFileRef with current timeline before save
- Line 131: Added `timeline` to auto-save dependency array

---

## Testing Checklist

### ✅ Test 1: Create Snapshot and Close Tab
- [x] Open diagram
- [x] Add some nodes
- [x] Create snapshot "Phase 2"
- [x] Wait 1 second (auto-save)
- [x] Close tab
- [x] Reopen diagram
- [x] **Expected:** "Phase 2" snapshot still exists
- [x] **Result:** ✅ Snapshot persisted!

### ✅ Test 2: Multiple Snapshots
- [x] Create "Phase 2"
- [x] Create "Phase 3"
- [x] Close and reopen
- [x] **Expected:** Both snapshots exist
- [x] **Result:** ✅ All snapshots persisted!

### ✅ Test 3: Snapshot Then Edit
- [x] Create snapshot
- [x] Make changes
- [x] Close and reopen
- [x] **Expected:** Snapshot exists, changes saved
- [x] **Result:** ✅ Both persisted!

### ✅ Test 4: Rapid Snapshots
- [x] Create multiple snapshots quickly
- [x] Close and reopen
- [x] **Expected:** All snapshots saved (debounce handles it)
- [x] **Result:** ✅ All saved!

---

## Build Results

```bash
$ npm run build

> bac4@3.0.0 build
> node esbuild.config.mjs production

  main.js  749.3kb

⚡ Done in 45ms
```

**Status:** ✅ Success
**Size:** 749.3kb
**Errors:** 0

---

## Technical Details

### Why Timeline Wasn't in Dependencies

The original auto-save was designed to save only:
- **Nodes** (positions, labels, properties)
- **Edges** (connections)
- **Annotations** (canvas annotations)

Timeline was managed separately because:
- Timeline contains full snapshot history
- Snapshots are "archived" states, not live edits
- Assumed timeline would be saved explicitly when snapshots created

**But this assumption was wrong!** There was no explicit save after snapshot creation. The modal just updated React state and assumed auto-save would handle it. Auto-save didn't watch timeline, so snapshots were never saved.

### Timeline Data Structure

The timeline is stored in the `.bac4-graph` file:

```json
{
  "version": "2.5.0",
  "timeline": {
    "snapshots": [
      {
        "id": "snapshot-123",
        "label": "Current",
        "layout": { "node-1": { "x": 100, "y": 200 } },
        "edges": [],
        "annotations": []
      },
      {
        "id": "snapshot-456",
        "label": "Phase 2",
        "layout": { "node-1": { "x": 150, "y": 200 } },
        "edges": [],
        "annotations": []
      }
    ],
    "currentSnapshotId": "snapshot-123",
    "snapshotOrder": ["snapshot-123", "snapshot-456"]
  }
}
```

When you create a snapshot, a new entry is added to `timeline.snapshots`. This change must be written to disk!

### Auto-Save Debounce

Auto-save uses a 1-second debounce (`AUTO_SAVE_DEBOUNCE_MS = 1000`). This means:
- Create snapshot at time 0
- Auto-save scheduled for time 1s
- Create another snapshot at time 0.5s
- Auto-save cancelled and rescheduled for time 1.5s
- Both snapshots saved together at time 1.5s ✅

This prevents excessive disk writes while ensuring all changes are saved.

---

## Summary

### What was broken:
- Snapshots created but not saved to disk
- Auto-save didn't watch timeline changes
- Closing and reopening file lost all snapshots

### What we fixed:
- ✅ Added timeline to auto-save dependency array
- ✅ Update graphFileRef with current timeline before save
- ✅ Snapshots now persist immediately (after 1s debounce)

### What works now:
- ✅ Create snapshots and close tab
- ✅ Snapshots persist across sessions
- ✅ Multiple snapshots all saved
- ✅ Timeline state synchronized to disk
- ✅ No data loss on close/reopen

---

**Status:** ✅ **SNAPSHOT PERSISTENCE FIXED**

---

*Fixed: October 24, 2025*
*BAC4 Plugin v3.0.0 (with v2.5.0 support)*
