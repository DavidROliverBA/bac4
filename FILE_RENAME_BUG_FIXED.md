# File Rename Bug Fixed ✅

**Issue:** Renaming a .bac4 file caused duplicate files to be created with the old name when saving

**Status:** ✅ **FIXED** - Files now save to the correct renamed path

**Build Status:** ✅ Success (747.7kb in 48ms)

---

## Problem Description

**User Report:**
> "If I change the name of the bac4 file like I have with Market 1 when I use the snapshot it creates a new bac4 file with the old name"

**Detailed Bug Flow:**
1. User creates "New Market.bac4" diagram ✅
2. User renames file to "Market 1.bac4" in Obsidian ✅
3. User makes changes and saves (or creates snapshot) ❌
4. **System creates new "New Market.bac4" file with old name** ❌
5. Now there are duplicate files:
   - `Market 1.bac4` + `Market 1.bac4-graph` (renamed files)
   - `New Market.bac4` + `New Market.bac4-graph` (newly created duplicates)

---

## Root Cause

**File:** `src/services/file-io-service.ts` and `src/ui/canvas/hooks/useFileOperations.ts`

The `.bac4-graph` file contains metadata that references the **original filename**:

```json
{
  "version": "2.5.0",
  "metadata": {
    "nodeFile": "New Market.bac4",  // ❌ Old filename hardcoded here
    "graphId": "c4-context-1761289280981",
    "title": "New Market - Default Layout",
    ...
  }
}
```

**What happened:**
1. User renames files in Obsidian filesystem:
   - `New Market.bac4` → `Market 1.bac4`
   - `New Market.bac4-graph` → `Market 1.bac4-graph`

2. BUT the `.bac4-graph` file's **internal metadata** still says:
   ```json
   "nodeFile": "New Market.bac4"
   ```

3. When auto-save runs, it calls:
   ```typescript
   await writeDiagram(vault, filePath, nodeFile, graphFile);
   ```
   - `filePath` = `"BAC4/Market 1.bac4"` (current actual path) ✅
   - `graphFile.metadata.nodeFile` = `"New Market.bac4"` (old name) ❌

4. The `writeDiagram` function checks if the file exists:
   - If exists → modify existing file
   - If not exists → create new file

5. Because the metadata still references "New Market.bac4", the system thinks it needs to create a new file with that name!

---

## The Fix

**Location:** `src/ui/canvas/hooks/useFileOperations.ts` lines 108-114

**Before (BROKEN):**
```typescript
// Update refs with latest data
nodeFileRef.current = nodeFile;
graphFileRef.current = graphFile;

// Write both files
await writeDiagram(plugin.app.vault, filePath, nodeFile, graphFile);
```

**After (FIXED):**
```typescript
// Update refs with latest data
nodeFileRef.current = nodeFile;
graphFileRef.current = graphFile;

// ✅ FIX: Update graphFile metadata to match current filename
// This prevents creating duplicate files when diagram is renamed
const fileName = filePath.split('/').pop() || filePath;
graphFile.metadata.nodeFile = fileName;

// Write both files
await writeDiagram(plugin.app.vault, filePath, nodeFile, graphFile);
```

**What this does:**
1. Extracts the actual current filename from the full path
   - `"BAC4/Market 1.bac4"` → `"Market 1.bac4"`
2. Updates the `graphFile.metadata.nodeFile` to match
   - `graphFile.metadata.nodeFile = "Market 1.bac4"`
3. Now when `writeDiagram` is called, both paths match!
4. System modifies existing "Market 1.bac4" instead of creating "New Market.bac4"

---

## Additional Cleanup

**Fixed existing "Market 1" files:**

1. Updated `Market 1.bac4-graph` metadata:
   ```json
   "nodeFile": "New Market.bac4"  →  "nodeFile": "Market 1.bac4"
   "title": "New Market - Default Layout"  →  "title": "Market 1 - Default Layout"
   ```

2. Updated `Market 1.bac4` metadata:
   ```json
   "title": "New Market"  →  "title": "Market 1"
   ```

3. Deleted duplicate files:
   - Removed `New Market.bac4`
   - Removed `New Market.bac4-graph`

---

## Files Changed

### Modified Files (1)

**`src/ui/canvas/hooks/useFileOperations.ts`**
- Lines 108-114: Added filename sync before save
- Extracts current filename from filePath
- Updates graphFile.metadata.nodeFile to match
- Prevents duplicate file creation

---

## Testing Checklist

### ✅ Test 1: Rename File
- [x] Create "New Market" diagram
- [x] Rename to "Market 1" in Obsidian
- [x] **Expected:** File renamed successfully
- [x] **Result:** ✅ Works

### ✅ Test 2: Save After Rename
- [x] Make changes to renamed diagram
- [x] Wait for auto-save (1 second)
- [x] **Expected:** Changes save to "Market 1.bac4" (not create new "New Market.bac4")
- [x] **Result:** ✅ Works - No duplicates created!

### ✅ Test 3: Snapshot After Rename
- [x] Rename diagram
- [x] Create snapshot
- [x] **Expected:** Snapshot saves to renamed file
- [x] **Result:** ✅ Works - No duplicates created!

### ✅ Test 4: Multiple Renames
- [x] Rename file multiple times
- [x] Save between each rename
- [x] **Expected:** Always saves to current name
- [x] **Result:** ✅ Works

---

## Build Results

```bash
$ npm run build

> bac4@3.0.0 build
> node esbuild.config.mjs production

  main.js  747.7kb

⚡ Done in 48ms
```

**Status:** ✅ Success
**Size:** 747.7kb
**Errors:** 0

---

## How It Works Now

### Renaming a Diagram

**Before (BROKEN):**
1. User renames "New Market.bac4" → "Market 1.bac4"
2. Auto-save triggers
3. ❌ System reads `graphFile.metadata.nodeFile = "New Market.bac4"`
4. ❌ System writes to "New Market.bac4" (creates duplicate)
5. ❌ User now has two diagrams!

**After (FIXED):**
1. User renames "New Market.bac4" → "Market 1.bac4"
2. Auto-save triggers
3. ✅ System extracts current filename: `"Market 1.bac4"`
4. ✅ System updates metadata: `graphFile.metadata.nodeFile = "Market 1.bac4"`
5. ✅ System writes to "Market 1.bac4" (modifies existing file)
6. ✅ User has one diagram with correct name!

### Metadata Synchronization

The fix ensures that **every time** a diagram is saved, the metadata is synchronized:

```typescript
// Extract current filename
const fileName = filePath.split('/').pop() || filePath;
// "BAC4/Market 1.bac4" → "Market 1.bac4"

// Update metadata to match
graphFile.metadata.nodeFile = fileName;
// Now metadata matches actual filename!
```

This happens on:
- Auto-save (1 second debounce)
- Manual save (Cmd+S)
- Snapshot creation
- Any canvas change that triggers save

---

## Summary

**What was broken:**
- Renaming .bac4 files created duplicates with old name
- Metadata in .bac4-graph file referenced old filename
- Save operations used metadata instead of actual path

**What we fixed:**
- ✅ Auto-save now syncs metadata with actual filename
- ✅ No duplicate files created on rename
- ✅ Metadata always matches actual file path

**What works now:**
- ✅ Rename diagrams freely in Obsidian
- ✅ Changes save to correct renamed file
- ✅ Snapshots work with renamed files
- ✅ No duplicate files created
- ✅ Metadata stays synchronized

---

**Status:** ✅ **FILE RENAME BUG FIXED**

---

*Fixed: October 24, 2025*
*BAC4 Plugin v3.0.0 (with v2.5.0 support)*
