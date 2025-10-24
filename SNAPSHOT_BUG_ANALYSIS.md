# Snapshot Bug Analysis

**Issue:** When creating a snapshot, the current page loses all nodes.

**Expected Behavior:**
1. User has nodes on current diagram (e.g., "Current" snapshot with 5 nodes)
2. User creates new snapshot (e.g., "Phase 2")
3. Current diagram should KEEP showing the 5 nodes (stay on "Current")
4. New "Phase 2" snapshot should be a COPY of current state (also has 5 nodes)
5. User can switch between snapshots to compare
6. Changes to one snapshot don't affect others

**Current Behavior (BROKEN):**
1. User has 5 nodes on "Current" snapshot
2. User creates "Phase 2" snapshot
3. **BUG:** Current diagram loses all nodes (becomes empty!)
4. Nodes only exist in the new snapshot

---

## Root Cause Analysis

### Problem 1: Automatic Snapshot Switching

**File:** `src/services/TimelineService.ts`
**Line:** 74

```typescript
static createSnapshot(...): CreateSnapshotResult {
  // ... create snapshot ...

  const updatedTimeline: Timeline = {
    snapshots: [...currentTimeline.snapshots, snapshot],
    currentSnapshotId: snapshot.id, // ❌ WRONG: Switches to NEW snapshot
    snapshotOrder: [...currentTimeline.snapshotOrder, snapshot.id],
  };
}
```

**Problem:** When creating a snapshot, it automatically changes `currentSnapshotId` to the NEW snapshot. This means the system thinks we're now viewing the new snapshot, not the original one.

**Why this is wrong:**
- The intent is to CAPTURE current state, not SWITCH to new state
- User expects to stay on their current view
- Comment in canvas-view.tsx says "stay on currently selected snapshot" but code does opposite

---

### Problem 2: No Node Loading After Snapshot Creation

**File:** `src/ui/canvas-view.tsx`
**Lines:** 585-615

```typescript
const handleAddSnapshot = React.useCallback(() => {
  const modal = new AddSnapshotModal(
    plugin.app,
    nodes,
    edges,
    annotations,
    timeline,
    (updatedTimeline, snapshotId) => {
      // Update timeline - stay on currently selected snapshot (all snapshots editable)
      setTimeline(updatedTimeline);  // ❌ Sets timeline with NEW currentSnapshotId
      console.log('BAC4: ✅ Snapshot created, staying on current snapshot');  // ❌ LIE
    }
  );
}, [...]);
```

**Problem:** After creating snapshot:
1. Timeline is updated with new `currentSnapshotId` pointing to new snapshot
2. BUT `handleSnapshotSwitch` is NOT called
3. So canvas nodes are NOT updated to match the new `currentSnapshotId`
4. This creates a mismatch between what the timeline says is current and what's actually shown

**Result:**
- Timeline state says: "current snapshot is Phase 2"
- Canvas shows: nodes from "Current" snapshot
- This inconsistent state causes issues

---

### Problem 3: Auto-Save Bug

**File:** `src/ui/canvas/hooks/useFileOperations.ts`
**Line:** 78

```typescript
React.useEffect(() => {
  const saveTimeout = setTimeout(async () => {
    // Update timeline with current nodes/edges
    if (timeline && timeline.snapshots.length > 0) {
      const currentSnapshot = timeline.snapshots[timeline.currentIndex];  // ❌ BUG
      currentSnapshot.nodes = nodes;
      currentSnapshot.edges = normalizeEdges(edges);
    }

    data.timeline = timeline;
    await plugin.app.vault.modify(file, JSON.stringify(data, null, 2));
  }, AUTO_SAVE_DEBOUNCE_MS);
}, [nodes, edges, annotations, filePath, timeline, plugin]);
```

**Problems:**
1. **Line 78:** Uses `timeline.currentIndex` which DOESN'T EXIST in Timeline type
   - Timeline has `currentSnapshotId` (string), not `currentIndex` (number)
   - This will be `undefined`
   - `timeline.snapshots[undefined]` = `undefined`

2. **Result:** Auto-save tries to update `undefined.nodes`, which fails silently or updates wrong snapshot

3. **Actual Timeline type:**
```typescript
interface Timeline {
  snapshots: TimelineSnapshot[];
  currentSnapshotId: string;  // ← ID, not index!
  snapshotOrder: string[];
}
```

**What should happen:**
```typescript
// Find current snapshot by ID
const currentSnapshot = timeline.snapshots.find(
  s => s.id === timeline.currentSnapshotId
);
if (currentSnapshot) {
  currentSnapshot.nodes = nodes;
  currentSnapshot.edges = normalizeEdges(edges);
}
```

---

## The Complete Bug Flow

### Scenario: User creates "Phase 2" snapshot

**Initial State:**
```
Timeline: {
  snapshots: [
    { id: "snap1", label: "Current", nodes: [node1, node2, node3] }
  ],
  currentSnapshotId: "snap1"
}
Canvas: showing [node1, node2, node3] from snap1
```

**User clicks "Add Snapshot"**

**Step 1:** TimelineService.createSnapshot() is called
```
Creates: { id: "snap2", label: "Phase 2", nodes: [node1, node2, node3] }  ✅ Correct copy

Returns: {
  timeline: {
    snapshots: [
      { id: "snap1", label: "Current", nodes: [node1, node2, node3] },
      { id: "snap2", label: "Phase 2", nodes: [node1, node2, node3] }  ✅ Copy exists
    ],
    currentSnapshotId: "snap2"  ❌ WRONG: Should stay "snap1"
  }
}
```

**Step 2:** Modal callback calls setTimeline(updatedTimeline)
```
Timeline state: {
  currentSnapshotId: "snap2"  ← System thinks we're on Phase 2
}
Canvas: still showing [node1, node2, node3]  ← But these are from snap1
```

**Step 3:** Auto-save triggers (after 1 second)
```typescript
// Line 78: Get current snapshot
const currentSnapshot = timeline.snapshots[timeline.currentIndex];
// timeline.currentIndex = undefined (doesn't exist)
// currentSnapshot = timeline.snapshots[undefined] = undefined

// Line 79-80: Try to update
currentSnapshot.nodes = nodes;  // ❌ Error or no-op (updating undefined)
```

**Step 4:** File is saved with corrupted timeline
```
// Because currentSnapshot was undefined, the snapshot nodes weren't updated
// OR the wrong snapshot was updated
// Timeline gets saved with inconsistent state
```

**Step 5:** User reloads or next operation
```
// System tries to load nodes for "snap2" (current)
// But snap2 might be empty or have wrong data
// Result: No nodes show on canvas
```

---

## Solutions Required

### Fix 1: Don't Switch to New Snapshot (TimelineService)

**File:** `src/services/TimelineService.ts`
**Line:** 74

**Change:**
```typescript
// BEFORE (wrong):
const updatedTimeline: Timeline = {
  snapshots: [...currentTimeline.snapshots, snapshot],
  currentSnapshotId: snapshot.id, // ❌ Switches to new snapshot
  snapshotOrder: [...currentTimeline.snapshotOrder, snapshot.id],
};

// AFTER (correct):
const updatedTimeline: Timeline = {
  snapshots: [...currentTimeline.snapshots, snapshot],
  currentSnapshotId: currentTimeline.currentSnapshotId, // ✅ Stay on current
  snapshotOrder: [...currentTimeline.snapshotOrder, snapshot.id],
};
```

**Result:** Creating a snapshot no longer changes which snapshot is active.

---

### Fix 2: Fix Auto-Save to Use currentSnapshotId (useFileOperations)

**File:** `src/ui/canvas/hooks/useFileOperations.ts`
**Lines:** 77-81

**Change:**
```typescript
// BEFORE (wrong):
if (timeline && timeline.snapshots.length > 0) {
  const currentSnapshot = timeline.snapshots[timeline.currentIndex];  // ❌ undefined
  currentSnapshot.nodes = nodes;
  currentSnapshot.edges = normalizeEdges(edges);
}

// AFTER (correct):
if (timeline && timeline.snapshots.length > 0) {
  // Find current snapshot by ID
  const currentSnapshot = timeline.snapshots.find(
    s => s.id === timeline.currentSnapshotId
  );

  if (currentSnapshot) {
    currentSnapshot.nodes = nodes;
    currentSnapshot.edges = normalizeEdges(edges);
  }
}
```

**Result:** Auto-save correctly updates the currently active snapshot.

---

### Fix 3: Same Fix in handleSave (useFileOperations)

**File:** `src/ui/canvas/hooks/useFileOperations.ts`
**Lines:** 178-183

**Same pattern - needs same fix:**
```typescript
// Find current snapshot by ID instead of using non-existent currentIndex
const currentSnapshot = timeline.snapshots.find(
  s => s.id === timeline.currentSnapshotId
);

if (currentSnapshot) {
  currentSnapshot.nodes = nodes;
  currentSnapshot.edges = normalizeEdges(edges);
}
```

---

## Testing Checklist

After fixes applied:

### Test 1: Create Snapshot Without Losing Nodes
- [ ] Open diagram with 3 nodes
- [ ] Create snapshot "Phase 2"
- [ ] **Expected:** Canvas still shows 3 nodes
- [ ] **Expected:** Still on original snapshot ("Current")

### Test 2: Verify Snapshot Was Created
- [ ] Click snapshot dropdown
- [ ] **Expected:** See both "Current" and "Phase 2"
- [ ] Switch to "Phase 2"
- [ ] **Expected:** Shows same 3 nodes (copy)

### Test 3: Edit Different Snapshots
- [ ] On "Phase 2", add 1 more node (total 4)
- [ ] Switch back to "Current"
- [ ] **Expected:** Shows original 3 nodes
- [ ] Switch to "Phase 2"
- [ ] **Expected:** Shows 4 nodes

### Test 4: Auto-Save Works Correctly
- [ ] Make changes to canvas
- [ ] Wait 1 second (auto-save)
- [ ] Reload diagram
- [ ] **Expected:** Changes persisted

### Test 5: Show Changes Feature
- [ ] Create baseline snapshot
- [ ] Make changes
- [ ] Enable "Show Changes"
- [ ] **Expected:** See diff between snapshots

---

## Additional Notes

### Why This Bug Was Hard to Notice Initially

1. **Silent Failure:** The `timeline.snapshots[undefined]` doesn't throw an error in JavaScript - it just returns `undefined`
2. **Timing:** Auto-save has 1-second delay, so bug isn't immediate
3. **Inconsistent State:** Timeline says one thing, canvas shows another - makes debugging confusing

### Why Current Comment is Misleading

```typescript
// Line 608: canvas-view.tsx
console.log('BAC4: ✅ Snapshot created, staying on current snapshot');
```

This log message claims we're "staying on current snapshot" but the code does the opposite! The timeline's `currentSnapshotId` was changed to the new snapshot.

---

## Code Locations Summary

**Files that need changes:**

1. ✅ `src/services/TimelineService.ts:74`
   - Change: Don't switch to new snapshot

2. ✅ `src/ui/canvas/hooks/useFileOperations.ts:78`
   - Change: Use `currentSnapshotId` instead of `currentIndex` (auto-save)

3. ✅ `src/ui/canvas/hooks/useFileOperations.ts:180`
   - Change: Use `currentSnapshotId` instead of `currentIndex` (manual save)

**No changes needed:**
- `src/ui/canvas-view.tsx` - Canvas view is actually correct, just working with broken service
- `src/ui/components/AddSnapshotModal.tsx` - Modal is correct
- `src/types/timeline.ts` - Types are correct

---

**Ready for Fix Implementation:** ✅

All issues identified and solutions documented. Ready to proceed with fixes.
