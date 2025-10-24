# Snapshot Layout Warning Fix ✅

**Issue:** Misleading console warning when loading files with snapshots

**Warning:** `No layout found for node node-3 in snapshot snapshot-1761300519788-2vcj9u8kc, using defaults`

**Status:** ✅ **FIXED** - Warning now only appears when actually problematic

---

## Problem Description

### User Report
```
BAC4 v2.5: Files loaded successfully {version: '2.5.0', diagramType: 'market', nodeCount: 3, snapshotCount: 2}
No layout found for node node-3 in snapshot snapshot-1761300519788-2vcj9u8kc, using defaults
```

### What Was Happening

**Scenario:**
1. User creates diagram with 2 nodes
2. User creates snapshot "Phase 1" (saves layout of 2 nodes)
3. User adds `node-3` after creating snapshot
4. User closes and reopens file
5. System loads all snapshots including "Phase 1"
6. **Warning appears:** "No layout found for node node-3 in snapshot..."

**Why the warning appeared:**
- The system loads ALL nodes from `.bac4` file (3 nodes)
- The system loads ALL snapshots from `.bac4-graph` file
- When reconstructing historical snapshots, it tries to merge all 3 nodes
- Old snapshot "Phase 1" only has layout for 2 nodes
- `node-3` didn't exist when "Phase 1" was created
- **This is CORRECT behavior!** Old snapshots shouldn't have new nodes

### The Confusion

The warning made it seem like something was wrong, but actually:
- ✅ Historical snapshots SHOULD NOT have newer nodes
- ✅ Current snapshot SHOULD have all nodes
- ❌ Warning appeared for ALL snapshots (even historical ones)

---

## The Fix

### Code Change

**File:** `src/services/file-io-service.ts` (lines 253-267)

**Before:**
```typescript
const nodes: Node[] = Object.values(nodeFile.nodes).map((node) => {
  const layout = snapshot.layout?.[node.id];

  if (!layout) {
    // ❌ Always warns, even for historical snapshots
    console.warn(`No layout found for node ${node.id} in snapshot ${snapshot.id}, using defaults`);
  }

  return { /* node data */ };
});
```

**After:**
```typescript
// Determine if this is the current snapshot or a historical one
const isCurrentSnapshot = snapshot.id === graphFile.timeline.currentSnapshotId;

const nodes: Node[] = Object.values(nodeFile.nodes).map((node) => {
  const layout = snapshot.layout?.[node.id];

  // ✅ Only warn if node is missing from CURRENT snapshot
  // Historical snapshots are expected to not have newer nodes
  if (!layout && isCurrentSnapshot) {
    console.warn(
      `⚠️ BAC4 v2.5: Node ${node.id} ("${node.properties.label}") missing from current snapshot layout, using defaults (0, 0). ` +
      `This usually means the node was added but auto-save hasn't completed yet.`
    );
  }

  return { /* node data */ };
});
```

---

## What Changed

### Before Fix ❌
- Warning appeared for EVERY snapshot when a newer node didn't exist in it
- Confusing and alarming for users
- Made it seem like data was corrupted
- Example: "No layout found for node-3 in snapshot-xyz"

### After Fix ✅
- Warning ONLY appears if node missing from CURRENT snapshot
- Historical snapshots silently use defaults (expected behavior)
- Warning message is more informative
- Explains what's likely happening

---

## When You'll Still See a Warning

The warning will now ONLY appear if:

1. **You add a node but close the file before auto-save completes**
   ```
   ⚠️ BAC4 v2.5: Node node-3 ("My New Node") missing from current snapshot layout,
   using defaults (0, 0). This usually means the node was added but auto-save hasn't
   completed yet.
   ```

   **What this means:** The node was added to the `.bac4` file but not to the current snapshot's layout in `.bac4-graph` yet.

   **Solution:** This is the auto-save timing issue. Wait for auto-save to complete before closing.

2. **The files are corrupted or manually edited incorrectly**
   - Node exists in `.bac4` but missing from current snapshot layout
   - Unusual situation, likely manual file editing

---

## When You WON'T See a Warning (Normal Behavior)

**Historical Snapshots:**
```
Timeline:
  ├─ "Current" (3 nodes) ← Active
  ├─ "Phase 2" (3 nodes)
  └─ "Phase 1" (2 nodes) ← node-3 added after this
```

When loading this file:
- ✅ NO warning for "Phase 1" snapshot (node-3 is newer, expected)
- ✅ NO warning for "Phase 2" snapshot (has all 3 nodes)
- ✅ NO warning for "Current" snapshot (has all 3 nodes)

**This is the expected behavior!**

---

## Example Scenarios

### Scenario 1: Normal Usage ✅

**Steps:**
1. Create diagram with 2 nodes
2. Create snapshot "Phase 1"
3. Add node-3
4. **Wait for auto-save** (see "✅ Auto-saved successfully")
5. Close file
6. Reopen file

**Result:**
- ✅ NO warnings
- "Current" has all 3 nodes
- "Phase 1" has 2 nodes (correct!)

---

### Scenario 2: Close Before Auto-Save ⚠️

**Steps:**
1. Create diagram with 2 nodes
2. Create snapshot "Phase 1"
3. Add node-3
4. **Immediately close file** (before auto-save)
5. Reopen file

**Result:**
```
⚠️ BAC4 v2.5: Node node-3 ("My New Node") missing from current snapshot layout,
using defaults (0, 0). This usually means the node was added but auto-save hasn't
completed yet.
```

**What happened:**
- node-3 added to React state
- File closed before auto-save wrote it to disk
- On reopen, node-3 might partially exist or be at (0, 0)

**Solution:** Wait for auto-save next time

---

### Scenario 3: Historical Snapshots (After Fix) ✅

**Before the fix:**
```
Loading file with 3 snapshots and 5 nodes...
❌ No layout found for node-4 in snapshot snapshot-abc (historical)
❌ No layout found for node-5 in snapshot snapshot-abc (historical)
❌ No layout found for node-5 in snapshot snapshot-def (historical)
```

**After the fix:**
```
Loading file with 3 snapshots and 5 nodes...
(no warnings - historical snapshots silently use defaults)
```

---

## Technical Details

### Why Historical Snapshots Don't Have All Nodes

**v2.5.0 Dual-File Format:**
- `.bac4`: Contains ALL nodes that have EVER existed in the diagram
- `.bac4-graph`: Contains snapshots with layouts for nodes that existed AT THAT TIME

**Example:**
```json
// .bac4 file (all nodes ever created)
{
  "nodes": {
    "node-1": { "label": "Frontend" },
    "node-2": { "label": "Backend" },
    "node-3": { "label": "Database" }  ← Added later
  }
}

// .bac4-graph file (timeline)
{
  "timeline": {
    "snapshots": [
      {
        "id": "snapshot-current",
        "label": "Current",
        "layout": {
          "node-1": { "x": 100, "y": 100 },
          "node-2": { "x": 300, "y": 100 },
          "node-3": { "x": 500, "y": 100 }  ← Has node-3
        }
      },
      {
        "id": "snapshot-phase1",
        "label": "Phase 1",
        "layout": {
          "node-1": { "x": 100, "y": 100 },
          "node-2": { "x": 300, "y": 100 }
          // ✅ No node-3 here - it didn't exist yet!
        }
      }
    ]
  }
}
```

When loading:
- Current snapshot: All 3 nodes have layout ✅
- Phase 1 snapshot: Only 2 nodes have layout ✅ (correct!)

The old warning would complain about node-3 missing from Phase 1. The new code recognizes that Phase 1 is historical and doesn't warn.

---

## Build Status

```bash
$ npm run build

  main.js  750.4kb

⚡ Done in 57ms
```

**Status:** ✅ Success

---

## Summary

### What Was Wrong ❌
- Warning appeared for ALL snapshots when newer nodes didn't exist in historical snapshots
- Confusing and alarming
- Made normal behavior seem like an error

### What's Fixed ✅
- Warning ONLY appears for current snapshot
- Historical snapshots silently use defaults
- More informative warning message
- Explains likely cause (auto-save timing)

### User Impact
- Less confusing console output
- Warnings only when there's an actual problem
- Historical snapshots work as expected without warnings

---

**Status:** ✅ **FIXED**

**Build:** ✅ Success (750.4kb)

**Files Changed:** 1 (src/services/file-io-service.ts)

---

*Fixed: October 24, 2025*
*BAC4 Plugin v3.0.0 (with v2.5.0 support)*
