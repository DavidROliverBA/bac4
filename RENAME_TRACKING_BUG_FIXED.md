# Rename Tracking Bug Fixed ✅

**Issue:** After renaming a file, auto-save creates a duplicate with the old name

**Status:** ✅ **FIXED** - Canvas view now tracks file renames and updates save path

**Build Status:** ✅ Success (749.2kb in 50ms)

---

## Problem Description

**User Report:**
> "when I name change a file this sticks but then the auto save creates a new file using the old name so I get two files that are the same so the logic needs changing"

**Detailed Bug Flow:**
1. User opens "New Market.bac4" in canvas view ✅
2. Canvas view sets `filePath = "BAC4/New Market.bac4"`
3. User renames file to "Market 1.bac4" in Obsidian file explorer ✅
4. **Canvas view doesn't know about the rename!** ❌
5. Auto-save triggers (1 second after change)
6. Auto-save uses old path: `filePath = "BAC4/New Market.bac4"` ❌
7. **System creates NEW "New Market.bac4" file** ❌
8. User now has duplicates:
   - `Market 1.bac4` (the renamed file, correct)
   - `New Market.bac4` (newly created duplicate by auto-save)

---

## Root Cause

**File:** `src/ui/canvas-view.tsx`

The `BAC4CanvasView` class sets `this.filePath` when the view opens, but **never updates it** when the underlying file is renamed in Obsidian's file explorer.

**What happened:**
1. View opens with file "New Market.bac4"
   ```typescript
   constructor(leaf, plugin, filePath) {
     this.filePath = filePath; // "BAC4/New Market.bac4"
   }
   ```

2. User renames file in Obsidian: "New Market.bac4" → "Market 1.bac4"
   - Obsidian's file system updates ✅
   - Obsidian fires `vault.on('rename', ...)` event ✅
   - **But BAC4CanvasView doesn't listen to this event!** ❌

3. Auto-save triggers in `useFileOperations.ts`:
   ```typescript
   await writeDiagram(vault, filePath, nodeFile, graphFile);
   // filePath is still "BAC4/New Market.bac4" (old path!)
   ```

4. `writeDiagram()` checks if file exists:
   - "New Market.bac4" doesn't exist (it was renamed)
   - Creates new file with old name
   - **Result:** Duplicate file created ❌

---

## The Fix

### Added Rename Event Listener (Without Re-render)

**Location:** `src/ui/canvas-view.tsx`

**Changes:**

1. **Added event reference field** (line 1157):
   ```typescript
   export class BAC4CanvasView extends ItemView {
     // ...
     // Event reference for file rename
     private renameEventRef: any = null;
   ```

2. **Register rename event in `onOpen()`** (lines 1415-1428):
   ```typescript
   async onOpen(): Promise<void> {
     // ... existing setup code ...

     // ✅ FIX: Register file rename event listener
     this.renameEventRef = this.app.vault.on('rename', (file, oldPath) => {
       // Check if this view's file was renamed
       if (this.filePath === oldPath) {
         console.log('BAC4CanvasView: File renamed from', oldPath, 'to', file.path);
         this.filePath = file.path;
         this.file = file as TFile;

         // ✅ DON'T re-render! Just update the path.
         // The diagram data is already loaded in memory.
         // Re-rendering would cause reload and race with graph file rename.
         // Auto-save will use the updated filePath automatically.
       }
     });

     this.renderCanvas();
   }
   ```

**Important:** We **don't re-render** on rename because:
- The diagram data is already loaded in memory
- Re-rendering would trigger a reload from disk
- This creates a race condition with the graph file rename (main.ts also renames the `.bac4-graph` file)
- Just updating `filePath` is sufficient - auto-save will use the new path

3. **Unregister event in `onClose()`** (lines 1433-1437):
   ```typescript
   async onClose(): Promise<void> {
     // ✅ FIX: Unregister rename event listener
     if (this.renameEventRef) {
       this.app.vault.offref(this.renameEventRef);
       this.renameEventRef = null;
     }

     // Unmount React component
     if (this.root) {
       this.root.unmount();
       this.root = null;
     }
   }
   ```

---

## How It Works Now

### File Rename Flow

**Before (BROKEN):**
1. User opens "New Market.bac4"
   - `this.filePath = "BAC4/New Market.bac4"`
2. User renames to "Market 1.bac4"
   - ❌ View doesn't update `this.filePath`
3. Auto-save triggers
   - ❌ Saves to old path: "BAC4/New Market.bac4"
   - ❌ Creates duplicate file!

**After (FIXED):**
1. User opens "New Market.bac4"
   - `this.filePath = "BAC4/New Market.bac4"`
   - ✅ Registers rename event listener
2. User renames to "Market 1.bac4" in sidebar
   - ✅ Obsidian fires `vault.on('rename')` event
   - ✅ **Two handlers run:**
     - main.ts: Renames companion `.bac4-graph` file
     - canvas-view.tsx: Updates `this.filePath = "BAC4/Market 1.bac4"`
   - ✅ **Does NOT re-render** (prevents race condition)
   - ✅ Diagram data stays in memory (no reload needed)
3. Auto-save triggers
   - ✅ Saves to NEW path: "BAC4/Market 1.bac4"
   - ✅ No duplicates created!
   - ✅ No "graph file not found" errors!

### Event Listener Lifecycle

**Registration (onOpen):**
```typescript
this.renameEventRef = this.app.vault.on('rename', (file, oldPath) => {
  if (this.filePath === oldPath) {
    // This view's file was renamed
    this.filePath = file.path; // Update to new path
    this.file = file as TFile;
    // DON'T re-render - prevents race with graph file rename
    // Data stays in memory, auto-save uses new path
  }
});
```

**Cleanup (onClose):**
```typescript
if (this.renameEventRef) {
  this.app.vault.offref(this.renameEventRef);
  this.renameEventRef = null;
}
```

This ensures:
- Event listener is active while view is open
- Event listener is removed when view closes
- No memory leaks from orphaned event handlers

---

## Files Changed

### Modified Files (1)

**`src/ui/canvas-view.tsx`**
- Line 1157: Added `renameEventRef` field
- Lines 1415-1426: Register rename event listener in `onOpen()`
- Lines 1433-1437: Unregister event listener in `onClose()`

---

## Testing Checklist

### ✅ Test 1: Rename While View Open
- [x] Open "New Market.bac4"
- [x] Rename to "Market 1.bac4" in file explorer
- [x] Make changes to diagram
- [x] Wait for auto-save
- [x] **Expected:** Changes save to "Market 1.bac4" (not create "New Market.bac4")
- [x] **Result:** ✅ Works - No duplicates!

### ✅ Test 2: Multiple Renames
- [x] Open diagram
- [x] Rename multiple times: A → B → C
- [x] Make changes between renames
- [x] **Expected:** Always saves to current name
- [x] **Result:** ✅ Works

### ✅ Test 3: Close and Reopen
- [x] Open and rename diagram
- [x] Close view
- [x] Reopen renamed file
- [x] **Expected:** Opens with correct name
- [x] **Result:** ✅ Works

### ✅ Test 4: Event Cleanup
- [x] Open diagram
- [x] Close view
- [x] Rename file externally
- [x] **Expected:** No errors (event listener cleaned up)
- [x] **Result:** ✅ Works

---

## Build Results

```bash
$ npm run build

> bac4@3.0.0 build
> node esbuild.config.mjs production

  main.js  749.2kb

⚡ Done in 50ms
```

**Status:** ✅ Success
**Size:** 749.2kb
**Errors:** 0

---

## Summary

### What was broken:
- Canvas view didn't track file renames
- Auto-save used stale file path
- Created duplicate files with old name after rename

### What we fixed:
- ✅ Added rename event listener to canvas view
- ✅ View updates `filePath` when file is renamed
- ✅ Auto-save always uses current file path
- ✅ Proper event cleanup on view close

### What works now:
- ✅ Rename files freely in Obsidian
- ✅ Canvas tracks rename and updates path
- ✅ Auto-save uses correct renamed path
- ✅ No duplicate files created
- ✅ No memory leaks from event listeners

---

**Status:** ✅ **RENAME TRACKING FIXED**

---

*Fixed: October 24, 2025*
*BAC4 Plugin v3.0.0 (with v2.5.0 support)*
