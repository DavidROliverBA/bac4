# Relationship System - Free File Naming

## Overview

The BAC4 plugin now uses a **centralized relationship management system** that separates diagram metadata from the `.bac4` files themselves. This allows users to name their diagram files anything they want, while maintaining the C4 hierarchy through a central `diagram-relationships.json` file.

## Key Changes

### 1. Central Relationships File

**Location:** `diagram-relationships.json` (root of vault)

**Structure:**
```json
{
  "version": "1.0.0",
  "diagrams": [
    {
      "id": "diagram-1728...",
      "filePath": "MyAwesomeDiagram.bac4",
      "displayName": "My Awesome System",
      "type": "context",
      "createdAt": "2025-10-10T...",
      "updatedAt": "2025-10-10T..."
    }
  ],
  "relationships": [
    {
      "parentDiagramId": "diagram-1728...",
      "childDiagramId": "diagram-1729...",
      "parentNodeId": "node-1",
      "parentNodeLabel": "Web Application",
      "createdAt": "2025-10-10T..."
    }
  ],
  "updatedAt": "2025-10-10T..."
}
```

### 2. Simplified .bac4 Files

**Before:**
```json
{
  "metadata": {
    "diagramType": "context",
    "parentDiagramPath": "parent.bac4",
    "parentNodeId": "node-123",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "nodes": [...],
  "edges": [...]
}
```

**After:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

All metadata is now in `diagram-relationships.json`.

### 3. Free File Naming

Users can now:
- Name diagram files anything they want
- Rename files at any time (just update the relationship entry)
- Organize files in any folder structure
- Use descriptive names like `AWS-Architecture.bac4` instead of `context_WebApp_container.bac4`

### 4. Auto-Registration

When a diagram is opened or created, it's automatically registered in the relationships file if not already present.

## Benefits

### For Users
1. **Freedom** - Name files descriptively
2. **Clarity** - Breadcrumbs show display names, not filenames
3. **Organization** - Move files around without breaking relationships
4. **Flexibility** - Change names without losing hierarchy

### For Developers
1. **Separation of Concerns** - Data vs. metadata
2. **Central Management** - One source of truth for relationships
3. **Easier Migration** - Can update relationship structure without touching diagram files
4. **Better Performance** - Don't need to read all files to build hierarchy

## API Changes

### DiagramNavigationService

#### New Methods
- `registerDiagram(filePath, displayName, type)` - Register a diagram
- `updateDiagramName(filePath, newDisplayName)` - Update display name
- `getDiagramByPath(filePath)` - Get diagram metadata
- `unregisterDiagram(filePath)` - Remove diagram (cleanup)
- `getChildDiagrams(parentPath)` - Get all children

#### Updated Methods
- `createChildDiagram()` - Now accepts optional `suggestedFileName` parameter
- `buildBreadcrumbs()` - Uses relationship data instead of file metadata
- `findChildDiagram()` - Looks up relationships, not filename patterns

### Canvas View

- No longer saves/loads metadata from `.bac4` files
- Loads diagram type from relationships file
- Auto-registers diagrams when opened

### Main Plugin

- Creates files named "Untitled.bac4" (instead of "context.bac4")
- Auto-registers new diagrams on creation

## Migration

### Existing Diagrams

Old diagrams with metadata embedded in the file will:
1. Be auto-registered when first opened
2. Continue to work normally
3. Metadata will be ignored (relationships file takes precedence)

### Backwards Compatibility

The system gracefully handles:
- Old format files (with metadata)
- New format files (without metadata)
- Mixed environments

## Example Workflow

### Creating a New Project

1. User clicks "Create New Diagram"
2. File created: `Untitled.bac4`
3. User renames in Obsidian: `E-Commerce-Platform.bac4`
4. Relationship registered:
   ```json
   {
     "id": "diagram-abc123",
     "filePath": "E-Commerce-Platform.bac4",
     "displayName": "E-Commerce-Platform",
     "type": "context"
   }
   ```

### Drilling Down

1. User adds "Web Application" system node
2. User double-clicks node
3. Dialog: "Name the container diagram?" → "WebApp-Containers.bac4"
4. Child diagram created and relationship stored:
   ```json
   {
     "parentDiagramId": "diagram-abc123",
     "childDiagramId": "diagram-xyz789",
     "parentNodeId": "node-1",
     "parentNodeLabel": "Web Application"
   }
   ```

### Breadcrumbs

Breadcrumbs show display names from relationships file:
```
E-Commerce-Platform > Web Application > API Service
```

Not filenames:
```
E-Commerce-Platform.bac4 > WebApp-Containers.bac4 > API-Components.bac4
```

## Future Enhancements

### Rename Dialog
Add UI to update display names without renaming files:
```typescript
await navigationService.updateDiagramName(filePath, "New Display Name");
```

### File Move Detection
Detect when files are moved/renamed in Obsidian and update relationships automatically.

### Validation
Check for orphaned relationships (diagrams that no longer exist).

### Export/Import
Export relationship data for sharing or backup.

## Implementation Files

- `src/types/diagram-relationships.ts` - Type definitions
- `src/services/diagram-navigation-service.ts` - Core relationship logic
- `src/ui/canvas-view.tsx` - Canvas integration
- `src/main.ts` - Plugin entry point

## Testing Checklist

- [ ] Create new diagram - auto-registers
- [ ] Rename diagram file - still works
- [ ] Drill down - creates child with any name
- [ ] Breadcrumbs show display names
- [ ] Navigation works after file rename
- [ ] Multiple diagrams in different folders
- [ ] Delete diagram - relationship cleanup
- [ ] Open old format diagram - auto-migrates

## Notes

- The relationships file is stored in the vault root for easy access
- Relationships are stored by diagram ID, not file path (resilient to renames)
- Display names default to filename (without .bac4) but can be customized
- All operations are async and handle errors gracefully
