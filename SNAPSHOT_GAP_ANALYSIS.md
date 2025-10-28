# Snapshot Behavior Gap Analysis

## Overview

This document compares the **approved specification** (SNAPSHOT_BEHAVIOR_SPECIFICATION.md v2.0) against the **current implementation** to identify discrepancies and bugs.

**Analysis Date:** 2025-10-24
**Code Version:** v2.5.1 (in development)

---

## Critical Gaps Found

### ❌ GAP 1: Creating Snapshot Does Not Auto-Switch

**Specification Requirement:**
> When user clicks "Create Snapshot":
> - Automatically switches to the new snapshot (becomes the active view)
> - Timeline dropdown updates to show new snapshot with ✏️ icon
> - `currentSnapshotId` updated to new snapshot's ID

**Current Implementation:**

**File:** `src/services/TimelineService.ts:71-75`
```typescript
// Update timeline - STAY ON CURRENT SNAPSHOT (don't auto-switch)
// The new snapshot is created in the background for comparison
const updatedTimeline: Timeline = {
  snapshots: [...currentTimeline.snapshots, snapshot],
  currentSnapshotId: currentTimeline.currentSnapshotId, // ✅ Stay on current, don't switch
  snapshotOrder: [...currentTimeline.snapshotOrder, snapshot.id],
};
```

**File:** `src/ui/canvas-view.tsx:636-639`
```typescript
// Update timeline - stay on currently selected snapshot (all snapshots editable)
setTimeline(updatedTimeline);

console.log('BAC4: ✅ Snapshot created, staying on current snapshot');
```

**Impact:**
- User creates snapshot but doesn't see it
- Confusing UX - user has to manually switch to see new snapshot
- Violates approved spec

**Severity:** HIGH

**Fix Required:**
1. Change `TimelineService.createSnapshot` to set `currentSnapshotId: snapshot.id`
2. Update `handleAddSnapshot` to switch to new snapshot after creation
3. Load new snapshot's state into canvas after creation

---

### ❌ GAP 2: Auto-Save Uses Hybrid v1/v2.5 Format (Data Loss Risk)

**Specification Requirement:**
> **Rule 3: Canvas is Source of Truth**
> The React Flow canvas state (nodes, edges, annotations) is the source of truth for the currently viewed snapshot.
> When saving, always capture from canvas state, not from timeline object.

**Current Implementation:**

The code uses a **complex dual-state system**:

1. **v1 Timeline Format** (in-memory React state)
   - `timeline.snapshots` contains v1 snapshots with nodes/edges/annotations
   - Updated by `handleSnapshotSwitch` when switching (canvas-view.tsx:540-546)

2. **v2.5 Format** (on disk)
   - `.bac4` and `.bac4-graph` files
   - Created by `splitNodesAndEdges` during auto-save

**The Problem:**

**File:** `src/ui/canvas/hooks/useFileOperations.ts:97-186`

```typescript
// ✅ FIX: Sync new snapshots from v1 timeline to v2.5 graphFileRef
// timeline.snapshots is v1 format (from React state)
// graphFileRef.timeline.snapshots is v2.5 format (for disk)
// We need to convert any NEW v1 snapshots to v2.5 and add them
if (timeline && graphFileRef.current) {
  const existingSnapshotIds = new Set(
    graphFileRef.current.timeline.snapshots.map(s => s.id)
  );

  // Find new snapshots that don't exist in graphFileRef yet
  const newSnapshots = timeline.snapshots.filter(
    s => !existingSnapshotIds.has(s.id)
  );

  // Convert new v1 snapshots to v2.5 format
  const newV2Snapshots = newSnapshots.map(v1Snapshot => {
    // ... conversion logic ...
  });

  // Update graphFileRef with new snapshots
  graphFileRef.current = {
    ...graphFileRef.current,
    timeline: {
      snapshots: [...graphFileRef.current.timeline.snapshots, ...newV2Snapshots],
      currentSnapshotId: timeline.currentSnapshotId,
      snapshotOrder: timeline.snapshotOrder,
    },
  };
}

// Split React Flow data back to v2.5.0 format
const { nodeFile, graphFile } = splitNodesAndEdges(
  nodes,
  edges,
  nodeFileRef.current!,
  graphFileRef.current!
);
```

**The Bug:**

1. Only **NEW** snapshots are converted from v1 → v2.5 (line 107-109)
2. **EXISTING** snapshots in `graphFileRef` are NOT updated with current canvas state
3. `splitNodesAndEdges` is called with current canvas `nodes` and `edges` (line 189-194)
4. But `splitNodesAndEdges` only updates the **current snapshot** (whichever is in `currentSnapshotId`)
5. If user edits snapshot, then switches away WITHOUT waiting for auto-save, changes may be lost

**Reproduction Scenario:**

```
1. Viewing "Phase 1" snapshot
2. Change node color to blue
3. Canvas nodes array updated ✓
4. Auto-save debounce starts (300ms)
5. User immediately switches to "Current" (before auto-save completes)
6. handleSnapshotSwitch saves canvas to v1 timeline ✓
7. Switch completes, canvas now shows "Current"
8. Auto-save debounce completes (from step 4)
9. splitNodesAndEdges is called with "Current" snapshot's nodes (NOT Phase 1!)
10. Phase 1 changes LOST ❌
```

**Impact:**
- User edits are lost if they switch snapshots quickly
- Color changes not persisted
- Node additions not persisted

**Severity:** CRITICAL

**Root Cause:**
- Auto-save is tied to canvas state change, not snapshot state change
- When user switches snapshots, canvas is cleared and reloaded
- Pending auto-save from previous snapshot runs AFTER switch, using new snapshot's data
- Previous snapshot's changes are never written to disk

**Fix Required:**
1. Cancel pending auto-save when switching snapshots
2. Force immediate save before switching (already done in handleSnapshotSwitch for v1 timeline)
3. Ensure forced save also writes to disk (v2.5 format)
4. OR: Trigger auto-save immediately when switching, before loading new snapshot

---

### ❌ GAP 3: Snapshot Switching Saves to v1 Timeline Only (Not Disk)

**Specification Requirement:**
> When switching snapshots:
> 1. Save current canvas state before switching
> 2. Update snapshot data in timeline
> 3. **Save to disk** (trigger auto-save)
> 4. Load new snapshot state

**Current Implementation:**

**File:** `src/ui/canvas-view.tsx:526-552`

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

    // ... load new snapshot, update state ...
  },
  [timeline, nodes, edges, annotations, ...]
);
```

**The Problem:**

1. Saves to v1 `timeline` object (in-memory React state) ✓
2. **Does NOT save to disk** ❌
3. Auto-save may not trigger because:
   - Auto-save depends on `nodes`, `edges`, `annotations` changing
   - After switch, new snapshot's nodes are loaded
   - This triggers auto-save
   - But auto-save runs with **new** snapshot's data, not old snapshot's saved changes

**Impact:**
- Changes made in a snapshot are saved to v1 timeline (memory)
- But NOT written to `.bac4-graph` file (disk)
- On file reload, changes are lost

**Severity:** CRITICAL

**Fix Required:**
1. Call auto-save immediately when switching snapshots
2. OR: Force write to disk synchronously before switching
3. Ensure v1 timeline changes are converted to v2.5 and written

---

### ❌ GAP 4: No Smart Node Deletion on Snapshot Delete

**Specification Requirement:**
> **Smart node cleanup:**
> - For each node in the deleted snapshot:
>   - Check if node exists in ANY other snapshot's `layout`
>   - If YES → Keep node in `.bac4` file
>   - If NO → Delete node from `.bac4` file

**Current Implementation:**

**File:** `src/services/TimelineService.ts:121-158`

```typescript
static deleteSnapshot(snapshotId: string, timeline: Timeline): Timeline {
  // Cannot delete the last snapshot
  if (timeline.snapshots.length === 1) {
    throw new Error('Cannot delete the last snapshot');
  }

  const snapshotIndex = timeline.snapshots.findIndex((s) => s.id === snapshotId);

  if (snapshotIndex === -1) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const snapshot = timeline.snapshots[snapshotIndex];
  console.log(`BAC4: Deleting snapshot "${snapshot.label}" (${snapshot.id})`);

  // Remove snapshot
  const updatedSnapshots = timeline.snapshots.filter((s) => s.id !== snapshotId);
  const updatedOrder = timeline.snapshotOrder.filter((id) => id !== snapshotId);

  // If deleting current snapshot, switch to previous or next
  let newCurrentId = timeline.currentSnapshotId;
  if (timeline.currentSnapshotId === snapshotId) {
    // Try to get previous snapshot
    const currentOrderIndex = timeline.snapshotOrder.indexOf(snapshotId);
    if (currentOrderIndex > 0) {
      newCurrentId = timeline.snapshotOrder[currentOrderIndex - 1];
    } else {
      // Use next snapshot
      newCurrentId = timeline.snapshotOrder[currentOrderIndex + 1];
    }
  }

  return {
    snapshots: updatedSnapshots,
    currentSnapshotId: newCurrentId,
    snapshotOrder: updatedOrder,
  };
}
```

**The Problem:**

1. Simply removes snapshot from array
2. **Does NOT check if nodes are used elsewhere** ❌
3. **Does NOT delete orphaned nodes from `.bac4` file** ❌
4. Orphaned nodes accumulate in `.bac4` file over time

**Impact:**
- `.bac4` file grows with unused nodes
- Potential memory/performance issues
- Confusing for users (nodes exist in file but not in any snapshot)

**Severity:** MEDIUM (not critical, but violates spec)

**Fix Required:**
1. When deleting snapshot, analyze all remaining snapshots
2. Identify nodes that ONLY exist in deleted snapshot
3. Remove those nodes from `.bac4` file
4. Keep nodes that exist in other snapshots

---

### ⚠️ GAP 5: File Reload May Not Load Last Viewed Snapshot

**Specification Requirement:**
> On Reopen:
> 1. Load from disk
> 2. Determine which snapshot to show:
>    - Load the snapshot specified in `graphFile.timeline.currentSnapshotId`
>    - **This should be the last viewed snapshot**

**Current Implementation:**

**File:** `src/ui/canvas-view.tsx` (initialization logic)

Need to verify:
- Does file load read `currentSnapshotId` from graphFile?
- Does it use that to determine which snapshot to display?
- Or does it always load "Current" snapshot?

**Investigation Needed:**
- Check file loading logic in `canvas-view.tsx` or `main.ts`
- Verify which snapshot is loaded on file open

**Severity:** MEDIUM

---

## Implementation Checklist (from Spec) - Current Status

- [x] Creating snapshot captures current canvas state ✓ (canvas-view.tsx:628-630)
- [ ] **Switching snapshots saves current canvas before loading new snapshot** ⚠️ (saves to v1 timeline, not disk)
- [x] Auto-save captures current canvas state ✓ (useFileOperations.ts:189-194)
- [x] Auto-save writes to `snapshot.nodeProperties` and `snapshot.layout` ✓ (file-io-service.ts:429-486)
- [x] Load uses `snapshot.nodeProperties` as primary source ✓ (file-io-service.ts:271-314)
- [x] Load only shows nodes present in `snapshot.layout` ✓ (file-io-service.ts:256-259)
- [ ] **Closing file triggers auto-save of current snapshot** ⚠️ (relies on auto-save debounce, may not complete)
- [ ] **Reopening file loads snapshot specified in `currentSnapshotId`** ❓ (needs verification)
- [ ] **Creating snapshot auto-switches to new snapshot** ❌ (stays on current, GAP 1)
- [x] Adding node to snapshot updates only that snapshot ✓ (isolation works)
- [x] Changing color in snapshot updates only that snapshot ✓ (isolation works with v2.5.1 fix)
- [x] Deleting node from snapshot updates only that snapshot ✓ (isolation works)
- [x] Switching between snapshots shows correct isolated state ✓ (v1 timeline handles this)

**Summary:** 8/12 requirements met, 4 critical gaps

---

## Root Cause Summary

### Primary Issue: Dual-State System

The codebase maintains **two parallel state systems**:

1. **v1 Timeline (In-Memory)**
   - React state: `timeline` object with `timeline.snapshots`
   - Each snapshot has full `nodes`, `edges`, `annotations` arrays
   - Updated by `handleSnapshotSwitch` when switching
   - Used for snapshot isolation and switching

2. **v2.5 Format (On Disk)**
   - `.bac4` file: node metadata
   - `.bac4-graph` file: snapshots with `layout`, `edges`, `nodeProperties`
   - Updated by auto-save via `splitNodesAndEdges`
   - Only updates **current snapshot** specified by `currentSnapshotId`

### The Disconnect

**Problem:** Changes made to v1 timeline are not reliably propagated to v2.5 disk format

**When it works:**
1. User makes change → canvas state updates
2. Auto-save triggers (300ms debounce)
3. Auto-save calls `splitNodesAndEdges` with current canvas state
4. Updates current snapshot in `graphFile`
5. Writes to disk

**When it fails:**
1. User makes change → canvas state updates
2. User switches snapshot BEFORE auto-save completes
3. `handleSnapshotSwitch` saves canvas to v1 timeline ✓
4. Canvas is cleared and new snapshot loaded
5. Auto-save from step 2 completes
6. Auto-save uses **new snapshot's** canvas state ❌
7. Previous snapshot's changes LOST

**Additional Failure:**
1. User makes change → canvas state updates
2. Auto-save triggers, saves to disk ✓
3. User closes file BEFORE auto-save completes
4. Changes LOST

---

## Recommended Fix Strategy

### Strategy A: Eliminate v1 Timeline (Preferred)

**Approach:** Remove v1 timeline entirely, use only v2.5 format

**Changes:**
1. Remove `timeline` React state
2. Use `graphFileRef.current.timeline` directly
3. Update snapshots in `graphFileRef` when switching
4. Force immediate disk write when switching snapshots
5. Simplify auto-save to only handle debounced writes

**Pros:**
- Single source of truth (v2.5 format)
- No sync issues between v1 and v2.5
- Cleaner, more maintainable code

**Cons:**
- Significant refactoring required
- Need to update all code that reads `timeline` state

### Strategy B: Fix v1 → v2.5 Sync (Quicker)

**Approach:** Keep both systems, improve sync reliability

**Changes:**
1. Cancel pending auto-save when switching snapshots
2. Force immediate save to disk when switching (not just v1 timeline)
3. Update `splitNodesAndEdges` to update **all** snapshots from v1 timeline, not just new ones
4. Force save on file close

**Pros:**
- Less refactoring
- Preserves existing architecture
- Can be done incrementally

**Cons:**
- Still maintains dual-state complexity
- Potential for future sync bugs
- More code to maintain

### Strategy C: Hybrid (Recommended)

**Approach:** Keep v1 timeline for in-memory operations, but ensure reliable sync

**Changes:**
1. **Immediate Fix (GAP 1):** Make `createSnapshot` auto-switch to new snapshot
2. **Immediate Fix (GAP 2 & 3):** Force save to disk when switching snapshots
   - Cancel pending auto-save timeout
   - Call `splitNodesAndEdges` immediately with current canvas state
   - Write to disk synchronously before loading new snapshot
3. **Immediate Fix (GAP 4):** Add smart node deletion to `deleteSnapshot`
4. **Future:** Gradually migrate to pure v2.5 format (Strategy A)

**Pros:**
- Addresses critical bugs immediately
- Preserves current architecture
- Path forward to cleaner architecture

**Cons:**
- Still has dual-state complexity
- Need to eventually migrate to Strategy A

---

## Proposed Implementation Plan

### Phase 1: Critical Fixes (This Session)

1. **Fix GAP 1:** Auto-switch to new snapshot after creation
   - Update `TimelineService.createSnapshot` to set `currentSnapshotId: snapshot.id`
   - Update `handleAddSnapshot` callback to switch canvas to new snapshot

2. **Fix GAP 2 & 3:** Ensure changes are saved to disk when switching
   - Add `forceSaveSnapshot()` function that:
     - Cancels pending auto-save
     - Calls `splitNodesAndEdges` with current canvas state
     - Writes to disk immediately
   - Call `forceSaveSnapshot()` in `handleSnapshotSwitch` before loading new snapshot

3. **Fix auto-save race condition:**
   - Clear auto-save timeout when switching snapshots
   - Force immediate save before switch

### Phase 2: Smart Deletion (Next Session)

4. **Fix GAP 4:** Implement smart node deletion
   - Create `getOrphanedNodes()` function
   - Update `deleteSnapshot` to call it
   - Remove orphaned nodes from `.bac4` file

### Phase 3: Verification (Testing)

5. Test all scenarios from specification
6. Verify file reload loads correct snapshot
7. Verify no data loss on rapid switching

---

**Document Version:** 1.0
**Date:** 2025-10-24
**Status:** READY FOR IMPLEMENTATION
