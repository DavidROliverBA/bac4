# Snapshot Behavior Specification (v2.5.1)

## Purpose

This document defines the expected behavior of timeline snapshots in BAC4. Snapshots allow users to capture and compare different states of a diagram over time.

---

## Core Concepts

### What is a Snapshot?

A **snapshot** is a frozen-in-time capture of a diagram's complete state, including:
- All nodes (with their positions, colors, labels, properties)
- All edges (connections between nodes)
- All annotations (sticky notes, text boxes, highlights)

### Current vs. Snapshot View Modes

BAC4 has two view modes:

1. **Current View** (default)
   - The live, editable state of the diagram
   - Changes are saved immediately (auto-save)
   - This is what you work on by default

2. **Snapshot View** (historical)
   - A frozen view of the diagram at a specific point in time
   - **All snapshots are EDITABLE** (not read-only)
   - Changes to a snapshot only affect that snapshot, not others

---

## Expected Behaviors

### 1. Creating a Snapshot

**User Action:** Click "+ Add Snapshot" button

**Expected Behavior:**
1. Opens modal asking for:
   - Label (required): e.g., "Phase 1", "Before Migration", "Q2 2025"
   - Timestamp (optional): e.g., "2025-04-15", "Q2 2025"
   - Description (optional): e.g., "Architecture before cloud migration"

2. When user clicks "Create Snapshot":
   - Captures **current canvas state** (all nodes, edges, annotations as they appear right now)
   - Creates new snapshot with unique ID
   - **Automatically switches to the new snapshot** (becomes the active view)
   - Timeline dropdown updates to show new snapshot with ✏️ icon
   - `currentSnapshotId` updated to new snapshot's ID

**Data Captured:**
```json
{
  "id": "snapshot-1234567890-abc123",
  "label": "Phase 1",
  "timestamp": "Q2 2025",
  "description": "Initial architecture design",
  "created": "2025-10-24T12:34:56Z",
  "layout": {
    "node-1": { "x": 100, "y": 200, "width": 250, "height": 100 },
    "node-2": { "x": 400, "y": 200, "width": 250, "height": 100 }
  },
  "nodeProperties": {
    "node-1": {
      "properties": { "label": "System 1", "description": "...", "technology": "Java", "team": "Backend", "status": "active" },
      "style": { "color": "#00ff00", "icon": "square", "shape": "rectangle" }
    },
    "node-2": {
      "properties": { "label": "System 2", "description": "...", "technology": "Node.js", "team": "Frontend", "status": "active" },
      "style": { "color": "#00ff00", "icon": "circle", "shape": "circle" }
    }
  },
  "edges": [...],
  "annotations": [...]
}
```

### 2. Switching Between Snapshots

**User Action:** Select snapshot from timeline dropdown (or click Previous/Next buttons)

**Expected Behavior:**

#### A. Switching FROM Current TO Snapshot

1. **Save current state** before switching:
   - Capture all nodes, edges, annotations from canvas
   - Update "Current" snapshot data in timeline
   - Save to disk (trigger auto-save)

2. **Load snapshot state**:
   - Clear canvas
   - Load nodes from `snapshot.nodeProperties` (positions, colors, labels, etc.)
   - Load edges from `snapshot.edges`
   - Load annotations from `snapshot.annotations`
   - Display snapshot in canvas

3. **Update UI**:
   - Timeline dropdown shows selected snapshot with pencil icon ✏️
   - Breadcrumb shows "Snapshot: Phase 1" or similar

#### B. Switching FROM Snapshot TO Current

1. **Save snapshot state** before switching:
   - Capture all nodes, edges, annotations from canvas
   - Update the snapshot being viewed (e.g., "Phase 1")
   - Save to disk (trigger auto-save)

2. **Load "Current" snapshot**:
   - Clear canvas
   - Load nodes from "Current" snapshot
   - Load edges from "Current" snapshot
   - Load annotations from "Current" snapshot

3. **Update UI**:
   - Timeline dropdown shows "Current" with pencil icon ✏️
   - Breadcrumb shows current diagram name

#### C. Switching FROM Snapshot TO Another Snapshot

1. **Save previous snapshot state**:
   - Capture all nodes, edges, annotations from canvas
   - Update the snapshot being viewed (e.g., "Phase 1")
   - Save to disk

2. **Load new snapshot state**:
   - Clear canvas
   - Load nodes from new snapshot (e.g., "Phase 2")
   - Load edges from new snapshot
   - Load annotations from new snapshot

3. **Update UI**:
   - Timeline dropdown shows new snapshot with pencil icon ✏️

### 3. Editing a Snapshot

**User Action:** Make changes while viewing a snapshot (add/delete/move nodes, change colors, etc.)

**Expected Behavior:**

1. **Changes affect ONLY the current snapshot**:
   - If viewing "Phase 1", changes update "Phase 1" snapshot only
   - If viewing "Current", changes update "Current" snapshot only
   - Other snapshots remain unchanged

2. **Auto-save triggers**:
   - After 300ms debounce (AUTO_SAVE_DEBOUNCE_MS)
   - Saves the currently viewed snapshot to disk
   - Does NOT affect other snapshots

3. **Isolation guarantee**:
   - Adding a node to "Phase 1" → does NOT appear in "Current"
   - Changing node color in "Phase 1" → does NOT change color in "Current"
   - Deleting a node from "Phase 1" → does NOT delete from "Current"

**Example Scenario:**

```
Initial State:
- Current: 2 nodes (green)
- Phase 1: (doesn't exist yet)

Step 1: Create snapshot "Phase 1"
- Captures current canvas state (2 green nodes)
- Creates "Phase 1" snapshot
- Automatically switches to "Phase 1" view ← AUTO-SWITCH
- Viewing: Phase 1
- Canvas shows: 2 green nodes

Step 2: Add node, change all to blue
- Viewing: Phase 1
- Canvas shows: 3 blue nodes
- Auto-save triggers → Phase 1 updated to disk

Step 3: Switch to "Current"
- Saves Phase 1 state (3 blue nodes)
- Loads Current state
- Viewing: Current
- Canvas shows: 2 green nodes ← NOT affected by Phase 1 changes

Step 4: Close file, reopen
- Loads snapshot specified by currentSnapshotId (probably "Phase 1" since that was last viewed)
- Canvas shows: 3 blue nodes ✅

Step 5: Switch to "Current"
- Canvas shows: 2 green nodes ✅
```

### 4. Closing and Reopening a File

**User Action:** Close file (Cmd+W) or close Obsidian, then reopen

**Expected Behavior:**

#### On Close:
1. **Auto-save triggers** (if there are unsaved changes):
   - Saves currently viewed snapshot to disk
   - Updates `.bac4-graph` file with latest snapshot data

2. **No data loss**:
   - All snapshots preserved
   - Current snapshot state preserved
   - Last viewed snapshot remembered (in `currentSnapshotId`)

#### On Reopen:
1. **Load from disk**:
   - Read `.bac4` file (node data)
   - Read `.bac4-graph` file (snapshot data)

2. **Determine which snapshot to show**:
   - Load the snapshot specified in `graphFile.timeline.currentSnapshotId`
   - Typically this is "Current" (but could be last viewed snapshot)

3. **Render canvas**:
   - Load nodes from the snapshot's `nodeProperties`
   - Load edges from the snapshot's `edges`
   - Load annotations from the snapshot's `annotations`

4. **Expected results**:
   - ✅ All node colors preserved
   - ✅ All node positions preserved
   - ✅ All node counts preserved (per snapshot)
   - ✅ All edges preserved
   - ✅ All annotations preserved

### 5. Auto-Save Behavior

**Trigger:** Any change to canvas (add/delete/move node, change property, add edge, etc.)

**Expected Behavior:**

1. **Debounced save** (300ms delay):
   - Waits 300ms after last change
   - If another change occurs, resets timer
   - Only saves after 300ms of inactivity

2. **What gets saved**:
   - Currently viewed snapshot is updated
   - All nodes, edges, annotations from canvas captured
   - Both `.bac4` and `.bac4-graph` files written to disk

3. **Snapshot isolation**:
   - Only the currently viewed snapshot is updated
   - Other snapshots are NOT modified

**Critical Requirement:**
> Auto-save must capture the **current canvas state**, not the **last saved snapshot state**.
> This means reading from React Flow's `nodes`, `edges`, `annotations` state, not from the timeline object.

### 6. Data Persistence Format

**On Disk (v2.5.1):**

#### `.bac4` file (Node Metadata)
```json
{
  "version": "2.5.1",
  "metadata": { "title": "Diagram", "diagramType": "market", ... },
  "nodes": {
    "node-1": {
      "id": "node-1",
      "type": "market",
      "properties": { "label": "Default Label", ... },
      "knowledge": { "notes": [], ... },
      "metrics": {},
      "wardley": null,
      "links": { ... },
      "style": { "color": "#ff0000", ... }  // ← FALLBACK ONLY (for backward compat)
    }
  }
}
```

#### `.bac4-graph` file (Snapshots)
```json
{
  "version": "2.5.1",
  "metadata": { "nodeFile": "diagram.bac4", ... },
  "timeline": {
    "snapshots": [
      {
        "id": "current",
        "label": "Current",
        "timestamp": null,
        "description": "",
        "created": "2025-10-24T00:00:00Z",
        "layout": {
          "node-1": { "x": 100, "y": 200, "width": 250, "height": 100 }
        },
        "edges": [...],
        "annotations": [],
        "nodeProperties": {  // ← PRIMARY SOURCE (v2.5.1)
          "node-1": {
            "properties": { "label": "Green Node", "description": "...", ... },
            "style": { "color": "#00ff00", "icon": "square", "shape": "rectangle" }
          }
        }
      },
      {
        "id": "snapshot-abc123",
        "label": "Phase 1",
        "timestamp": "Q2 2025",
        "description": "Before migration",
        "created": "2025-10-24T12:00:00Z",
        "layout": {
          "node-1": { "x": 100, "y": 200, "width": 250, "height": 100 },
          "node-2": { "x": 400, "y": 200, "width": 250, "height": 100 },
          "node-3": { "x": 700, "y": 200, "width": 250, "height": 100 }
        },
        "edges": [...],
        "annotations": [],
        "nodeProperties": {
          "node-1": {
            "properties": { "label": "Blue Node 1", ... },
            "style": { "color": "#0000ff", ... }
          },
          "node-2": {
            "properties": { "label": "Blue Node 2", ... },
            "style": { "color": "#0000ff", ... }
          },
          "node-3": {
            "properties": { "label": "Blue Node 3", ... },
            "style": { "color": "#0000ff", ... }
          }
        }
      }
    ],
    "currentSnapshotId": "current",  // ← Which snapshot is currently viewed
    "snapshotOrder": ["current", "snapshot-abc123"]
  },
  "config": { ... }
}
```

---

## Critical Rules

### Rule 1: Snapshot Independence
> Each snapshot must maintain completely independent node properties (colors, labels, descriptions, positions).
> Changing one snapshot MUST NOT affect any other snapshot.

### Rule 2: Always Save Before Switch
> When switching snapshots, ALWAYS save the current canvas state to the current snapshot before loading the new one.
> This prevents data loss when switching away from an edited snapshot.

### Rule 3: Canvas is Source of Truth
> The React Flow canvas state (`nodes`, `edges`, `annotations`) is the source of truth for the currently viewed snapshot.
> When saving, always capture from canvas state, not from timeline object.

### Rule 4: Disk is Persistent State
> All snapshot data must be written to disk (`.bac4-graph` file).
> On reload, disk state is the source of truth, not in-memory timeline.

### Rule 5: nodeProperties is Primary
> For v2.5.1+, `snapshot.nodeProperties` is the PRIMARY source for node properties (color, label, etc.).
> `nodeFile.nodes` properties are used ONLY as fallback for backward compatibility.

---

## Edge Cases

### Edge Case 1: Adding Node to Snapshot
**Scenario:** Viewing "Phase 1", add a new node

**Expected:**
1. Node appears in canvas
2. Auto-save captures node in "Phase 1" snapshot
3. Node saved to `snapshot.layout` and `snapshot.nodeProperties`
4. Switching to "Current" → node does NOT appear
5. Switching back to "Phase 1" → node IS present

### Edge Case 2: Deleting Node from Snapshot
**Scenario:** Viewing "Phase 1", delete a node

**Expected:**
1. Node disappears from canvas
2. Auto-save removes node from "Phase 1" snapshot
3. Node removed from `snapshot.layout` and `snapshot.nodeProperties`
4. Switching to "Current" → node still present (if it was there originally)
5. Node is NOT deleted from `.bac4` file (other snapshots may reference it)

### Edge Case 3: Rapid Snapshot Switching
**Scenario:** Switch from Current → Phase 1 → Phase 2 rapidly

**Expected:**
1. Each switch triggers save-before-load
2. All snapshot states preserved
3. No data loss or corruption
4. May see brief loading states

### Edge Case 4: File Rename
**Scenario:** Rename `.bac4` file in Obsidian

**Expected:**
1. `.bac4-graph` file also renamed
2. `graphFile.metadata.nodeFile` updated
3. All snapshots preserved
4. No data loss

### Edge Case 5: Concurrent Edits (Not Supported)
**Scenario:** Open same file in two Obsidian windows

**Expected:**
1. Last save wins
2. May cause data loss if editing different snapshots in different windows
3. Not a priority to handle - warn users not to do this

---

## Implementation Checklist

For the implementation to be correct, the following must be true:

- [ ] Creating snapshot captures current canvas state (not timeline state)
- [ ] Switching snapshots saves current canvas before loading new snapshot
- [ ] Auto-save captures current canvas state to currently viewed snapshot
- [ ] Auto-save writes to `snapshot.nodeProperties` and `snapshot.layout`
- [ ] Load uses `snapshot.nodeProperties` as primary source (fallback to nodeFile)
- [ ] Load only shows nodes present in `snapshot.layout`
- [ ] Closing file triggers auto-save of current snapshot
- [ ] Reopening file loads snapshot specified in `currentSnapshotId`
- [ ] Adding node to snapshot updates only that snapshot
- [ ] Changing color in snapshot updates only that snapshot
- [ ] Deleting node from snapshot updates only that snapshot
- [ ] Switching between snapshots shows correct isolated state

---

## User Experience Goals

1. **Predictable:** Users should always see exactly what they saved
2. **Isolated:** Changes to one snapshot never affect another
3. **Persistent:** Closing and reopening always shows saved state
4. **Fast:** Auto-save happens in background without blocking UI
5. **Clear:** UI clearly indicates which snapshot is being viewed/edited

---

## Decisions (Approved by User)

1. **Should "Current" be editable like other snapshots?**
   - ✅ **APPROVED: YES** - "Current" is just a special snapshot, editable like all others

2. **Should snapshots be read-only or editable?**
   - ✅ **APPROVED: EDITABLE** - All snapshots are editable, allows correcting mistakes and refining designs

3. **When creating a snapshot, should it auto-switch to that snapshot?**
   - ✅ **APPROVED: YES** - Auto-switches to new snapshot immediately after creation

4. **Should deleting a snapshot delete nodes from `.bac4` file?**
   - ✅ **APPROVED: SMART DELETION** - Check if nodes are used in other snapshots
     - If node exists in other snapshots → KEEP in `.bac4` file
     - If node exists ONLY in deleted snapshot → DELETE from `.bac4` file
     - Prevents orphaned nodes while preserving shared data

5. **What should `currentSnapshotId` be after creating a new snapshot?**
   - ✅ **APPROVED: SWITCHES TO NEW** - New snapshot becomes active immediately

---

## Next Steps

1. **Review this specification** - Confirm expected behaviors
2. **Make changes if needed** - Update this document with corrections
3. **Review current implementation** - Check if code matches spec
4. **Create refactoring plan** - List discrepancies and fixes needed
5. **Implement fixes** - Update code to match specification
6. **Test thoroughly** - Verify all behaviors work as specified

### 7. Deleting a Snapshot

**User Action:** Click "Delete" on a snapshot in Snapshot Manager

**Expected Behavior:**

1. **Confirmation prompt**:
   - "Are you sure you want to delete snapshot 'Phase 1'?"
   - Cannot delete if it's the last remaining snapshot

2. **When user confirms**:
   - Remove snapshot from `timeline.snapshots` array
   - Remove from `timeline.snapshotOrder` array
   - Update `currentSnapshotId` (if deleting current snapshot)

3. **Smart node cleanup**:
   - For each node in the deleted snapshot:
     - Check if node exists in ANY other snapshot's `layout`
     - If YES → Keep node in `.bac4` file
     - If NO → Delete node from `.bac4` file
   - This prevents orphaned nodes while preserving shared data

4. **Switch snapshot** (if deleting current snapshot):
   - Switch to previous snapshot in order
   - If no previous, switch to next snapshot in order
   - Load new snapshot's state into canvas

5. **Save to disk**:
   - Write updated `.bac4` file (with nodes removed if needed)
   - Write updated `.bac4-graph` file (without deleted snapshot)

**Example:**
```
Before Delete:
- Current: nodes [1, 2]
- Phase 1: nodes [1, 2, 3]
- Phase 2: nodes [2, 3, 4]

Delete "Phase 1":
- Check node 1: exists in Current ✓ → KEEP
- Check node 2: exists in Current, Phase 2 ✓ → KEEP
- Check node 3: exists in Phase 2 ✓ → KEEP
- Result: All nodes kept

After Delete:
- Current: nodes [1, 2]
- Phase 2: nodes [2, 3, 4]
- .bac4 file still has nodes [1, 2, 3, 4]
```

```
Before Delete:
- Current: nodes [1, 2]
- Phase 1: nodes [1, 2, 3]

Delete "Phase 1":
- Check node 1: exists in Current ✓ → KEEP
- Check node 2: exists in Current ✓ → KEEP
- Check node 3: ONLY in Phase 1 ✗ → DELETE
- Result: Node 3 deleted from .bac4 file

After Delete:
- Current: nodes [1, 2]
- .bac4 file has nodes [1, 2] only
```

---

**Document Version:** 2.0
**Date:** 2025-10-24
**Status:** APPROVED - Ready for Implementation
