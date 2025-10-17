# BAC4 v1.0.0 End-to-End Test Plan
**Timeline Tracking Feature - Manual Testing Checklist**

## Pre-Test Setup

### 1. Plugin Installation Verification
- [ ] Open Obsidian
- [ ] Navigate to Settings → Community Plugins
- [ ] Verify BAC4 plugin is enabled
- [ ] Reload Obsidian (Cmd+R or View → Reload without saving)
- [ ] Check console (Cmd+Option+I) for any startup errors

### 2. Test Vault Preparation
- [ ] Create a new folder: `Timeline-Tests/`
- [ ] Open this folder in your test vault
- [ ] Clear any existing `.bac4` files if needed

---

## Phase 1: Timeline Initialization & Basic Operations

### Test 1.1: Create New Diagram with Timeline
**Objective:** Verify that new diagrams automatically get a timeline with an initial snapshot.

**Steps:**
1. Create a new file: `Timeline-Tests/Test1-Context.bac4`
2. Open the file in BAC4 view
3. Add 2-3 System nodes
4. Add 1 Person node
5. Connect them with edges
6. Wait 1 second (auto-save debounce)

**Expected Results:**
- [ ] Diagram opens with empty canvas
- [ ] Timeline toolbar is NOT visible (only 1 snapshot exists)
- [ ] Auto-save occurs (check console for "Auto-saved v1.0.0")
- [ ] File contains timeline with 1 snapshot labeled "Current"

**Verification:**
```bash
# Check file structure
cat Timeline-Tests/Test1-Context.bac4 | jq '.timeline'
```
Should show:
```json
{
  "version": "1.0.0",
  "snapshots": [
    {
      "id": "snapshot-...",
      "label": "Current",
      "timestamp": null,
      "description": null,
      "createdAt": "...",
      "nodes": [...],
      "edges": [...],
      "annotations": []
    }
  ],
  "currentSnapshotId": "snapshot-..."
}
```

---

### Test 1.2: Add Second Snapshot
**Objective:** Verify creating a new snapshot via "Add Snapshot" button.

**Steps:**
1. Continue from Test 1.1
2. Click "Add Snapshot" button (should appear after creating initial diagram)
3. In the modal:
   - Label: `Phase 1 - Initial Design`
   - Timestamp: `Q1 2025`
   - Description: `Initial architecture with 3 systems`
4. Click "Create Snapshot"

**Expected Results:**
- [ ] Modal opens with 3 input fields
- [ ] "Create Snapshot" button is disabled until label is filled
- [ ] Cmd+Enter keyboard shortcut works
- [ ] Modal closes after creation
- [ ] Notice appears: "Created snapshot 'Phase 1 - Initial Design'"
- [ ] Timeline toolbar appears at top of canvas
- [ ] Toolbar shows: "Timeline | ← Previous | [Phase 1 - Initial Design] | Next → | + Add Snapshot | ⚙️ Manage | 1 of 2"

**Verification:**
- [ ] File now contains 2 snapshots
- [ ] Both snapshots have identical content (nodes/edges)
- [ ] Timeline toolbar is visible

---

### Test 1.3: Switch Between Snapshots
**Objective:** Verify navigation between snapshots works correctly.

**Steps:**
1. Continue from Test 1.2 (now on "Phase 1" snapshot)
2. Modify the diagram:
   - Add 1 new System node
   - Delete 1 edge
   - Change a node color
3. Wait 1 second for auto-save
4. Click "← Previous" button in timeline toolbar
5. Verify canvas reverts to initial state
6. Click "Next →" button
7. Verify canvas shows modified state

**Expected Results:**
- [ ] "← Previous" button switches to first snapshot
- [ ] Canvas displays original 3 systems
- [ ] Deleted edge reappears
- [ ] Color changes revert
- [ ] New system node disappears
- [ ] "Next →" button switches back to modified snapshot
- [ ] All changes reappear
- [ ] Dropdown shows correct current snapshot
- [ ] Counter updates: "1 of 2" → "2 of 2"

**Verification:**
- [ ] No console errors during switching
- [ ] Auto-save updates the correct snapshot (check timestamps)

---

## Phase 2: Change Detection & Indicators

### Test 2.1: Enable Change Indicators
**Objective:** Verify change detection highlights differences between snapshots.

**Steps:**
1. Continue from Test 1.3 (2 snapshots exist, currently on snapshot 2)
2. Click "🔍 Show Changes" button in timeline toolbar
3. Observe the canvas

**Expected Results:**
- [ ] Button changes to "🔍 Showing Changes" (active state)
- [ ] New System node gets a green badge: "NEW"
- [ ] Original nodes have no badges
- [ ] Deleted edge is NOT shown (removed edges don't display)

**Advanced Test:**
4. Switch to snapshot 1 (← Previous)
5. Observe badges

**Expected Results:**
- [ ] Original nodes have no badges (this is the baseline)
- [ ] The node that was added in snapshot 2 is NOT visible
- [ ] All original edges are visible

---

### Test 2.2: Modified Node Detection
**Objective:** Verify that modified nodes are detected and badged.

**Steps:**
1. Ensure you're on snapshot 2 with changes visible
2. Select a node that exists in both snapshots
3. In Property Panel, change:
   - Label: "System A" → "System Alpha"
   - Color: Blue → Red
4. Wait 1 second for auto-save
5. Switch to snapshot 1 (← Previous)
6. Switch back to snapshot 2 (Next →)
7. Verify the changed node

**Expected Results:**
- [ ] Node has a blue badge: "MODIFIED"
- [ ] Badge appears on nodes with label OR color changes
- [ ] Other unchanged nodes have no badges

---

### Test 2.3: Remove Change Indicators
**Objective:** Verify that change indicators can be toggled off.

**Steps:**
1. Continue from Test 2.2 (change indicators currently visible)
2. Click "🔍 Showing Changes" button

**Expected Results:**
- [ ] Button changes back to "🔍 Show Changes" (inactive state)
- [ ] All badges disappear from nodes
- [ ] Canvas shows clean diagram without indicators
- [ ] No console errors

---

## Phase 3: Snapshot Management

### Test 3.1: Rename Snapshot
**Objective:** Verify renaming snapshots via Snapshot Manager.

**Steps:**
1. Click "⚙️ Manage" button in timeline toolbar
2. Snapshot Manager modal opens
3. Find "Phase 1 - Initial Design" snapshot
4. Click "Rename" button
5. In rename modal:
   - New Label: `Phase 1 - Architecture Baseline`
   - New Timestamp: `2025-01-15`
   - New Description: `Approved baseline architecture`
6. Click "Save"

**Expected Results:**
- [ ] Snapshot Manager lists all 2 snapshots
- [ ] Current snapshot has checkmark indicator
- [ ] Rename modal pre-fills existing values
- [ ] After save, list updates with new name
- [ ] Timeline dropdown shows updated name
- [ ] File contains updated metadata

**Verification:**
```bash
cat Timeline-Tests/Test1-Context.bac4 | jq '.timeline.snapshots[] | select(.label | contains("Baseline")) | {label, timestamp, description}'
```

---

### Test 3.2: Reorder Snapshots
**Objective:** Verify drag-and-drop reordering in Snapshot Manager.

**Steps:**
1. Open Snapshot Manager (⚙️ Manage)
2. Create a 3rd snapshot first:
   - Close manager
   - Click "+ Add Snapshot"
   - Label: `Phase 2 - Extended`
   - Create
3. Reopen Snapshot Manager
4. Drag "Phase 2 - Extended" above "Phase 1 - Architecture Baseline"
5. Click "Close"

**Expected Results:**
- [ ] Drag handle (⋮⋮) cursor changes to grab/grabbing
- [ ] Snapshot card moves during drag
- [ ] Order persists after closing modal
- [ ] Timeline dropdown shows new order
- [ ] ← Previous / Next → buttons navigate in new order

---

### Test 3.3: Delete Snapshot
**Objective:** Verify deleting snapshots with confirmation.

**Steps:**
1. Open Snapshot Manager
2. Find oldest snapshot ("Current")
3. Click "Delete" button
4. Confirmation dialog appears
5. Click "Delete Snapshot" to confirm

**Expected Results:**
- [ ] Warning dialog: "Are you sure you want to delete..."
- [ ] Cancel button works (test first)
- [ ] After deletion, snapshot disappears from list
- [ ] Remaining snapshots renumber (1 of 3 → 1 of 2)
- [ ] Current snapshot does NOT change (unless deleted snapshot was current)
- [ ] File updated correctly

**Edge Case Test:**
6. Try to delete the LAST remaining snapshot

**Expected Results:**
- [ ] Error message: "Cannot delete the only snapshot"
- [ ] Delete button disabled when only 1 snapshot remains

---

## Phase 4: Annotation System

### Test 4.1: Add Annotations to Snapshot
**Objective:** Verify annotations work across timeline snapshots.

**Steps:**
1. Create a new diagram: `Timeline-Tests/Test2-Container.bac4`
2. Add 2 Container nodes
3. Add 1st snapshot: "Before Annotations"
4. Click annotation palette (top-right, 📝 icon)
5. Add annotations:
   - 1 Sticky Note: "Important decision point"
   - 1 Text Box: "Future consideration"
   - 1 Rectangle (highlight area)
   - 1 Circle (highlight node)
6. Wait for auto-save
7. Create 2nd snapshot: "With Annotations"

**Expected Results:**
- [ ] Annotation palette expands when clicked
- [ ] Palette shows 5 annotation types
- [ ] Each annotation can be:
  - Clicked to add at random position
  - Dragged onto canvas at specific position
- [ ] Annotations are draggable after placement
- [ ] Selected annotation has blue border
- [ ] Annotations persist after auto-save

---

### Test 4.2: Annotation Snapshot Isolation
**Objective:** Verify annotations are snapshot-specific.

**Steps:**
1. Continue from Test 4.1 (currently on "With Annotations")
2. Switch to "Before Annotations" snapshot (← Previous)
3. Verify canvas state
4. Switch back to "With Annotations" (Next →)

**Expected Results:**
- [ ] "Before Annotations" snapshot has NO annotations
- [ ] "With Annotations" snapshot has all 4 annotations
- [ ] Annotations maintain position/color/text across switches
- [ ] No console errors

---

### Test 4.3: Edit Annotation Properties
**Objective:** Verify annotation editing via Property Panel.

**Steps:**
1. Continue from Test 4.2 (on "With Annotations")
2. Click a Sticky Note annotation
3. In Property Panel:
   - Change text content
   - Change color
   - Change width/height (if available)
4. Wait for auto-save

**Expected Results:**
- [ ] Property Panel shows annotation properties
- [ ] Text updates in real-time as you type
- [ ] Color change applies immediately
- [ ] Size changes apply immediately
- [ ] Changes persist after snapshot switch

---

## Phase 5: Export with Timeline Metadata

### Test 5.1: Export Snapshot with Watermark
**Objective:** Verify exported images include timeline label watermark.

**Steps:**
1. Open any diagram with multiple snapshots
2. Switch to a specific snapshot (e.g., "Phase 1 - Architecture Baseline")
3. Click Export menu in toolbar
4. Select "Export as PNG"
5. Image downloads

**Expected Results:**
- [ ] PNG file downloads with diagram name
- [ ] Open exported image
- [ ] Bottom-right corner shows watermark:
  ```
  Phase 1 - Architecture Baseline
  2025-01-15 (or timestamp if available)
  ```
- [ ] Watermark has light gray background
- [ ] Watermark text is readable (black on gray)
- [ ] Rest of diagram matches canvas exactly

---

### Test 5.2: Export Different Formats
**Objective:** Verify all export formats include timeline metadata.

**Steps:**
1. Export the same snapshot as:
   - JPEG
   - SVG
2. Open each file

**Expected Results:**
- [ ] JPEG has watermark (bottom-right)
- [ ] SVG has watermark as text element
- [ ] All formats show correct snapshot label
- [ ] Quality is acceptable for each format

---

## Phase 6: ADR Integration

### Test 6.1: Link Markdown ADR to Snapshot
**Objective:** Verify snapshots can be linked to ADR markdown files.

**Steps:**
1. Create a markdown file: `Timeline-Tests/ADR-001-migration-plan.md`
   ```markdown
   # ADR-001: Migration to Microservices

   ## Status
   Accepted

   ## Context
   Legacy monolith causing deployment issues...

   ## Decision
   Migrate to microservices architecture...
   ```
2. Open your timeline diagram
3. Open Snapshot Manager (⚙️ Manage)
4. Select a snapshot (e.g., "Phase 1 - Architecture Baseline")
5. Click "Edit" or "Rename"
6. In the modal, find "Linked ADR" section
7. Search for "ADR-001" in dropdown
8. Select it
9. Save

**Expected Results:**
- [ ] Dropdown shows all markdown files in vault
- [ ] Typing filters the list
- [ ] Selected file shows in dropdown
- [ ] After save, snapshot shows linked ADR in manager
- [ ] Clicking ADR link opens markdown file
- [ ] Link persists across Obsidian reloads

---

### Test 6.2: Unlink ADR from Snapshot
**Objective:** Verify ADR links can be removed.

**Steps:**
1. Continue from Test 6.1
2. Open Snapshot Manager
3. Edit the snapshot with linked ADR
4. Click "Remove Link" or clear the dropdown
5. Save

**Expected Results:**
- [ ] Link is removed from snapshot
- [ ] Snapshot Manager no longer shows ADR link
- [ ] File updated (check `snapshot.linkedMarkdownPath`)

---

## Phase 7: Advanced Scenarios

### Test 7.1: Multiple Tabs with Same Diagram
**Objective:** Verify React Flow backgrounds don't conflict.

**Steps:**
1. Open `Test1-Context.bac4` in a tab
2. Open the same file in a NEW tab (Cmd+Click on file)
3. Observe both tabs

**Expected Results:**
- [ ] Tab 1 shows background dots
- [ ] Tab 2 shows background dots
- [ ] BOTH tabs maintain dots simultaneously (no conflict)
- [ ] Arrows on edges visible in both tabs
- [ ] No console errors about SVG patterns

**Background:** This was a critical bug in v0.8.0 where opening multiple tabs caused the first tab to lose background rendering due to SVG ID conflicts.

---

### Test 7.2: Large Timeline (10+ Snapshots)
**Objective:** Verify performance with many snapshots.

**Steps:**
1. Create a new diagram
2. Add 15 snapshots via scripted approach or manually:
   - Snapshot 1: "Week 1"
   - Snapshot 2: "Week 2"
   - ... (continue to Week 15)
3. Navigate through all snapshots using Previous/Next
4. Open Snapshot Manager

**Expected Results:**
- [ ] Timeline dropdown shows all 15 snapshots (scrollable)
- [ ] Navigation buttons work smoothly
- [ ] Snapshot Manager lists all 15 (scrollable)
- [ ] No performance degradation
- [ ] File size reasonable (< 500kb for moderate diagram)

---

### Test 7.3: Complex Change Detection
**Objective:** Verify change detection with many modifications.

**Steps:**
1. Create snapshot 1 with 10 nodes
2. Create snapshot 2 with:
   - 3 new nodes (should show NEW)
   - 2 deleted nodes (should not appear)
   - 3 modified nodes (changed labels/colors, should show MODIFIED)
   - 2 unchanged nodes (no badge)
3. Enable "Show Changes"

**Expected Results:**
- [ ] 3 nodes badged "NEW" (green)
- [ ] 3 nodes badged "MODIFIED" (blue)
- [ ] 2 nodes have no badge (unchanged)
- [ ] 2 deleted nodes not visible
- [ ] Total visible: 8 nodes (3 new + 3 modified + 2 unchanged)

---

## Phase 8: Error Handling & Edge Cases

### Test 8.1: Corrupt Timeline Data
**Objective:** Verify graceful handling of invalid timeline data.

**Steps:**
1. Create a diagram with timeline
2. Close Obsidian
3. Manually edit `.bac4` file - corrupt the timeline JSON:
   ```json
   "timeline": {
     "version": "1.0.0",
     "snapshots": "INVALID"
   }
   ```
4. Reopen Obsidian
5. Open the corrupted diagram

**Expected Results:**
- [ ] Diagram opens (doesn't crash plugin)
- [ ] Error logged to console
- [ ] Timeline resets to initial state (1 snapshot)
- [ ] Nodes/edges load if still valid
- [ ] User can continue working

---

### Test 8.2: Missing Snapshot Reference
**Objective:** Verify handling when `currentSnapshotId` references non-existent snapshot.

**Steps:**
1. Create diagram with 2 snapshots
2. Close Obsidian
3. Edit file - change `currentSnapshotId` to invalid ID:
   ```json
   "currentSnapshotId": "snapshot-nonexistent-12345"
   ```
4. Reopen diagram

**Expected Results:**
- [ ] Diagram loads
- [ ] Falls back to first snapshot in array
- [ ] Warning in console
- [ ] Timeline toolbar works normally

---

### Test 8.3: Snapshot with Empty Nodes Array
**Objective:** Verify empty snapshots are valid.

**Steps:**
1. Create new diagram (empty canvas)
2. Add snapshot: "Empty Baseline"
3. Add 5 nodes
4. Add snapshot: "With Nodes"
5. Switch between snapshots

**Expected Results:**
- [ ] "Empty Baseline" shows blank canvas
- [ ] "With Nodes" shows 5 nodes
- [ ] No errors in console
- [ ] Can add nodes to empty snapshot

---

## Test Results Summary

### Test Execution Checklist
**Date:** __________ | **Tester:** __________ | **Build:** v1.0.0

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Create New Diagram with Timeline | ☐ Pass ☐ Fail | |
| 1.2 | Add Second Snapshot | ☐ Pass ☐ Fail | |
| 1.3 | Switch Between Snapshots | ☐ Pass ☐ Fail | |
| 2.1 | Enable Change Indicators | ☐ Pass ☐ Fail | |
| 2.2 | Modified Node Detection | ☐ Pass ☐ Fail | |
| 2.3 | Remove Change Indicators | ☐ Pass ☐ Fail | |
| 3.1 | Rename Snapshot | ☐ Pass ☐ Fail | |
| 3.2 | Reorder Snapshots | ☐ Pass ☐ Fail | |
| 3.3 | Delete Snapshot | ☐ Pass ☐ Fail | |
| 4.1 | Add Annotations to Snapshot | ☐ Pass ☐ Fail | |
| 4.2 | Annotation Snapshot Isolation | ☐ Pass ☐ Fail | |
| 4.3 | Edit Annotation Properties | ☐ Pass ☐ Fail | |
| 5.1 | Export Snapshot with Watermark | ☐ Pass ☐ Fail | |
| 5.2 | Export Different Formats | ☐ Pass ☐ Fail | |
| 6.1 | Link Markdown ADR to Snapshot | ☐ Pass ☐ Fail | |
| 6.2 | Unlink ADR from Snapshot | ☐ Pass ☐ Fail | |
| 7.1 | Multiple Tabs with Same Diagram | ☐ Pass ☐ Fail | |
| 7.2 | Large Timeline (10+ Snapshots) | ☐ Pass ☐ Fail | |
| 7.3 | Complex Change Detection | ☐ Pass ☐ Fail | |
| 8.1 | Corrupt Timeline Data | ☐ Pass ☐ Fail | |
| 8.2 | Missing Snapshot Reference | ☐ Pass ☐ Fail | |
| 8.3 | Snapshot with Empty Nodes Array | ☐ Pass ☐ Fail | |

**Overall Result:** ☐ All Pass ☐ Some Fail ☐ Blocked

### Critical Issues Found
```
[List any critical bugs that block release]
```

### Minor Issues Found
```
[List any non-blocking issues for future fixes]
```

### Performance Notes
```
[Note any performance concerns]
```

---

## Post-Test Actions

### If All Tests Pass:
1. [ ] Tag release: `git tag -a v1.0.0 -m "Release v1.0.0 - Timeline Tracking"`
2. [ ] Create GitHub release with changelog
3. [ ] Update README.md with timeline features
4. [ ] Update ROADMAP.md to mark timeline as complete
5. [ ] Create user documentation in docs/

### If Tests Fail:
1. [ ] Document all failures in GitHub issues
2. [ ] Prioritize critical bugs
3. [ ] Fix bugs in order of severity
4. [ ] Re-run failed tests after fixes
5. [ ] Repeat until all pass

---

## Known Limitations (v1.0.0)

1. **Timeline Toolbar Visibility:** Only shown when 2+ snapshots exist
2. **Change Indicators:** Do not show for removed edges (only nodes)
3. **Annotation Editing:** Must select annotation first to edit properties
4. **Large Timelines:** Performance may degrade with 50+ snapshots (not tested)
5. **Export Watermark:** Always bottom-right, not customizable
6. **ADR Linking:** Only supports markdown files in same vault

---

**END OF TEST PLAN**
