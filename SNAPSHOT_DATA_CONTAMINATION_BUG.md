# Snapshot Data Contamination Bug - Root Cause Analysis & Fix Plan

## Bug Report

**Severity:** Critical
**Affects:** v2.5.0 dual-file format
**Component:** Timeline snapshot management + File I/O

## Problem Statement

When creating a snapshot, editing one snapshot, then switching to another snapshot, the changes from one snapshot contaminate other snapshots. Specifically:

1. Create diagram with 2 green nodes → Current snapshot
2. Create snapshot "Phase 1" (captures 2 green nodes)
3. Switch to "Phase 1" snapshot
4. Add 3rd node, change all colors to blue
5. Switch back to "Current" snapshot → EXPECT: 2 green nodes, ACTUAL: shows correctly
6. **Close and reopen file → BUG: "Current" snapshot now has 3 blue nodes instead of 2 green**

## Root Cause Analysis

### Architectural Mismatch

The v2.5.0 dual-file format has a **fundamental design flaw** for timeline snapshots:

**v1.0 Format (Timeline in memory):**
```typescript
timeline.snapshots = [
  {
    id: "current",
    nodes: [{ id: "node1", data: { color: "green" }, position: {x, y} }],
    edges: [...]
  },
  {
    id: "phase1",
    nodes: [{ id: "node1", data: { color: "blue" }, position: {x, y} }],
    edges: [...]
  }
]
```
✅ Each snapshot has **complete, independent** node data (including colors, labels, etc.)

**v2.5.0 Dual-File Format:**
```
📄 diagram.bac4 (shared across ALL snapshots):
{
  nodes: {
    "node1": {
      properties: { label: "..." },
      style: { color: "#3b82f6" }  ← SHARED across all snapshots!
    }
  }
}

📄 diagram.bac4-graph (snapshot-specific):
{
  timeline: {
    snapshots: [
      {
        id: "current",
        layout: { "node1": { x: 100, y: 200 } },  ← Only position!
        edges: [...]
      },
      {
        id: "phase1",
        layout: { "node1": { x: 150, y: 250 } },  ← Only position!
        edges: [...]
      }
    ]
  }
}
```
❌ Node data (color, label, description) is **SHARED** across all snapshots!

### The Design Intention vs. Reality

**v2.5.0 was designed for:**
- Multiple **layouts** of the same diagram (e.g., C4 Context view vs. Wardley Map view)
- Same nodes, same data, different visual arrangements

**What users actually need:**
- **Time-based snapshots** capturing complete diagram state at different points in time
- Different node counts, different colors, different labels per snapshot

## Data Flow Trace

### Where the Bug Occurs

**File:** `src/services/file-io-service.ts:361-399`

```typescript
export function splitNodesAndEdges(...) {
  // Update nodes in node file (semantic data only)
  const updatedNodes: Record<string, NodeV2> = {};

  for (const reactFlowNode of nodes) {
    updatedNodes[reactFlowNode.id] = {
      id: reactFlowNode.id,
      type: reactFlowNode.type,
      properties: { label, description, ... },
      style: {
        color: reactFlowNode.data.color,  // ← BUG: Overwrites color for ALL snapshots!
        icon: reactFlowNode.data.icon,
        shape: reactFlowNode.data.shape,
      },
    };
  }

  // Create updated node file
  const nodeFile: BAC4FileV2 = {
    ...currentNodeFile,
    nodes: updatedNodes,  // ← This replaces ALL node data globally!
  };

  // ...
}
```

**When auto-save runs:**
1. User is on "Phase 1" snapshot with 3 blue nodes
2. Auto-save calls `splitNodesAndEdges(nodes, edges, ...)`
3. `nodes` array contains 3 blue nodes (current canvas state)
4. Function writes these 3 blue nodes to `nodeFile.nodes` ← **Global shared data!**
5. Function writes layout to `graphFile.timeline.snapshots[currentSnapshot]` ← Snapshot-specific
6. Both files saved to disk
7. When user switches to "Current" snapshot:
   - Loads layout from "Current" snapshot (2 nodes' positions)
   - Loads node data from shared `nodeFile.nodes` ← **3 blue nodes!**
   - Result: 2 nodes from layout + 3 nodes from shared data = **data contamination**

## Why It Works Temporarily But Breaks On Reload

**In-memory (works):**
- v1 timeline format stores complete snapshots in React state
- `handleSnapshotSwitch` saves canvas to current snapshot before switching
- Switching loads nodes from snapshot.nodes (isolated, correct)

**On disk (broken):**
- v2.5 format saves to dual files
- `nodeFile.nodes` is overwritten with current canvas (loses other snapshots' node data)
- On reload, merges shared node data + snapshot layout = contamination

## Impact Assessment

**Affected Operations:**
- ✅ Creating snapshots
- ❌ Editing different snapshots independently
- ❌ Saving/loading diagrams with multiple snapshots
- ❌ Node color changes across snapshots
- ❌ Node count differences across snapshots
- ❌ Any node property changes (label, description, etc.) per snapshot

**Severity:**
- **Critical** for time-based snapshots (current use case)
- **Non-issue** for layout-only snapshots (original design intent)

## Fix Strategies

### Option 1: Store Node Data Per Snapshot (Recommended)

**Approach:** Move snapshot-varying properties to `.bac4-graph` file

**Changes:**
1. Keep invariant properties in `.bac4` (type, knowledge, metrics, links)
2. Move variant properties to snapshot layout:
   ```typescript
   snapshot.layout = {
     "node1": {
       x: 100, y: 200,
       width: 250, height: 100,
       // NEW: Snapshot-specific node properties
       properties: { label: "...", description: "..." },
       style: { color: "#3b82f6", icon: "...", shape: "..." }
     }
   }
   ```

**Pros:**
- ✅ True snapshot independence
- ✅ Minimal file format change
- ✅ Backward compatible (can migrate)

**Cons:**
- ❌ Data duplication (node properties repeated per snapshot)
- ❌ Requires migration logic
- ❌ Breaks "multiple layouts of same data" use case

### Option 2: Snapshot-Aware Node Storage

**Approach:** Store node data with snapshot IDs

```typescript
nodeFile.nodes = {
  "node1": {
    snapshots: {
      "current": { color: "green", label: "System 1" },
      "phase1": { color: "blue", label: "System 1 (Updated)" }
    }
  }
}
```

**Pros:**
- ✅ Preserves all snapshot data
- ✅ Efficient storage (shared base, per-snapshot overrides)

**Cons:**
- ❌ Major format change
- ❌ Complex merge logic
- ❌ Harder migration

### Option 3: Revert to Single-File Format for Snapshots

**Approach:** Use v1 format for time-based snapshots, v2.5 for layout-only views

**Pros:**
- ✅ Proven to work (v1 format)
- ✅ Simple logic

**Cons:**
- ❌ Abandons v2.5 format for main use case
- ❌ Confusing dual-format system

## Recommended Fix: Option 1 (Enhanced)

### Implementation Plan

#### Phase 1: Extend GraphFile Snapshot Structure
```typescript
// src/types/bac4-v2-types.ts
export interface Snapshot {
  id: string;
  label: string;
  timestamp: string | null;
  description: string;
  created: string;

  // Existing
  layout: Record<string, LayoutInfo>;
  edges: EdgeV2[];
  groups: any[];
  annotations: Annotation[];

  // NEW: Snapshot-specific node properties
  nodeProperties: Record<string, {
    properties: Record<string, unknown>;  // label, description, etc.
    style: { color: string; icon?: string; shape?: string };
  }>;
}
```

#### Phase 2: Update splitNodesAndEdges
```typescript
// file-io-service.ts:line 354
export function splitNodesAndEdges(...) {
  // ... existing code ...

  // Update current snapshot with node properties
  const nodePropertiesForSnapshot: Record<string, any> = {};
  for (const node of nodes) {
    nodePropertiesForSnapshot[node.id] = {
      properties: {
        label: node.data.label,
        description: node.data.description,
        technology: node.data.technology,
        team: node.data.team,
        // ... all user-editable properties
      },
      style: {
        color: node.data.color,
        icon: node.data.icon,
        shape: node.data.shape,
      },
    };
  }

  // Update snapshot
  const updatedSnapshot: Snapshot = {
    ...currentSnapshot,
    layout,
    edges: graphEdges,
    nodeProperties: nodePropertiesForSnapshot,  // NEW!
  };

  // Update node file with ONLY invariant properties
  // (Remove color, label, description - now stored per-snapshot)
}
```

#### Phase 3: Update mergeNodesAndLayout
```typescript
// file-io-service.ts:line 232
export function mergeNodesAndLayout(...) {
  const snapshot = /* ... get snapshot ... */;

  const nodes: Node[] = Object.values(nodeFile.nodes).map((node) => {
    const layout = snapshot.layout?.[node.id];
    const snapshotProps = snapshot.nodeProperties?.[node.id];  // NEW!

    return {
      id: node.id,
      type: node.type,
      position: { x: layout?.x || 0, y: layout?.y || 0 },
      width: layout?.width || 200,
      height: layout?.height || 100,
      data: {
        // Use snapshot-specific properties if available, else fallback to node file
        label: snapshotProps?.properties.label || node.properties.label,
        description: snapshotProps?.properties.description || node.properties.description,
        color: snapshotProps?.style.color || node.style.color,
        // ...
      },
    };
  });
}
```

#### Phase 4: Migration Support
```typescript
// src/services/migration-service.ts - NEW FUNCTION
export function migrateSnapshotsToV2_5_1() {
  // For each .bac4-graph file:
  // - Extract node properties from timeline.snapshots[0] (assumed correct)
  // - Create nodeProperties for each snapshot from their stored nodes
  // - Update snapshot structure
  // - Save migrated files
}
```

#### Phase 5: Testing
- Unit tests for splitNodesAndEdges with multiple snapshots
- Integration test: create snapshot → edit → switch → verify isolation
- Test migration from v2.5.0 → v2.5.1

### File Change Summary

| File | Changes | Lines |
|------|---------|-------|
| `src/types/bac4-v2-types.ts` | Add nodeProperties to Snapshot | +10 |
| `src/services/file-io-service.ts` | Update split/merge functions | ~100 |
| `src/ui/canvas/hooks/useFileOperations.ts` | Update sync logic | ~30 |
| `src/services/migration-service.ts` | Add v2.5.0→v2.5.1 migration | +150 |
| Tests | New snapshot isolation tests | +200 |

### Version Bump

**Current:** v2.5.0
**Fixed:** v2.5.1 (patch for snapshot data model)

## Testing Plan

### Test Case 1: Basic Snapshot Isolation
1. Create diagram with 2 green nodes
2. Create snapshot "Phase 1"
3. Add 3rd node, change colors to blue
4. Save file
5. Switch to "Current" → Verify 2 green nodes
6. Close and reopen file
7. **Pass if:** "Current" has 2 green nodes, "Phase 1" has 3 blue nodes

### Test Case 2: Multiple Snapshot Edits
1. Create "Snapshot A" (1 red node)
2. Create "Snapshot B" (2 blue nodes)
3. Create "Snapshot C" (3 green nodes)
4. Close and reopen
5. **Pass if:** Each snapshot retained its independent state

### Test Case 3: Migration from v2.5.0
1. Load old v2.5.0 file with snapshots
2. Run migration
3. Verify all snapshots preserved
4. Edit each snapshot independently
5. **Pass if:** No contamination

## Acceptance Criteria

- ✅ Each snapshot stores independent node properties (color, label, etc.)
- ✅ Switching snapshots does not contaminate other snapshots
- ✅ File close/reopen preserves all snapshot states
- ✅ Migration from v2.5.0 works without data loss
- ✅ All existing tests pass
- ✅ New snapshot isolation tests pass
- ✅ Documentation updated (CLAUDE.md, V2.5_QUICK_REFERENCE.md)

## Timeline

- **Day 1:** Implement Phase 1-2 (type definitions + split/merge updates)
- **Day 2:** Implement Phase 3-4 (migration + testing)
- **Day 3:** Integration testing, documentation, release v2.5.1

## References

- v1.0.0 timeline format (working correctly): `src/services/TimelineService.ts`
- v2.5.0 dual-file format (broken): `src/services/file-io-service.ts`
- Snapshot switching logic: `src/ui/canvas-view.tsx:522-611`
- Auto-save logic: `src/ui/canvas/hooks/useFileOperations.ts:78-203`

---

**Created:** 2025-10-24
**Status:** Identified, awaiting fix implementation
