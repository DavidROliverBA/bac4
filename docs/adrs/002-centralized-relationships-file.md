# ADR 002: Centralized Relationships File for Diagram Hierarchy

**Date:** 2025-10-12
**Status:** Accepted
**Deciders:** Development Team
**Related:** Navigation System, Diagram Linking, File Management

---

## Context

BAC4 Plugin implements hierarchical diagram navigation following the C4 model:
- **Context diagrams** (L1) → drill down to **Container diagrams** (L2)
- **Container diagrams** (L2) → drill down to **Component diagrams** (L3)

We need to track:
- Which diagrams exist in the vault
- Parent-child relationships between diagrams
- Which node in the parent links to which child diagram
- Diagram metadata (type, creation date, display name)

**Challenge:** How do we store and manage these relationships?

## Decision

**We use a single centralized `diagram-relationships.json` file stored at the vault root.**

## Alternatives Considered

### 1. **Centralized Relationships File** (CHOSEN)
- **Structure:** Single JSON file at vault root
- **Content:** All diagram registrations and relationships
- **Format:**
  ```json
  {
    "version": "1.0.0",
    "diagrams": [
      { "id": "...", "filePath": "...", "type": "context", ... }
    ],
    "relationships": [
      { "parentDiagramId": "...", "childDiagramId": "...", "parentNodeId": "..." }
    ]
  }
  ```
- **Pros:**
  - Single source of truth
  - Easy to query all relationships
  - Atomic updates (one file)
  - Simple backup/restore
  - Git-friendly (one file to track)
  - Fast lookups (all data in memory)
- **Cons:**
  - Single point of failure (mitigated by validation and backups)
  - Needs migration strategy if format changes
  - Could grow large (unlikely for typical use)

### 2. **Metadata in Diagram Files**
- Store parent/child info directly in each `.bac4` file
- **Pros:**
  - Self-contained diagrams
  - No separate relationships file
- **Cons:**
  - ❌ Circular references (parent stores child ID, child stores parent ID)
  - ❌ Inconsistency risk (parent and child metadata can diverge)
  - ❌ Difficult to query all relationships
  - ❌ Complex updates (need to modify multiple files atomically)
  - ❌ Hard to detect orphaned diagrams

### 3. **Separate Relationships Files per Diagram**
- Each diagram has a `.bac4.meta` sidecar file
- **Pros:**
  - Distributed metadata
  - Scales well
- **Cons:**
  - ❌ Many small files (clutters vault)
  - ❌ Difficult to query global relationships
  - ❌ Complex to maintain consistency
  - ❌ More files to track in git

### 4. **Database (SQLite)**
- Use local SQLite database for relationships
- **Pros:**
  - Powerful queries
  - Transaction support
  - Scalable
- **Cons:**
  - ❌ Not git-friendly (binary file)
  - ❌ Adds complexity (database library)
  - ❌ Difficult to inspect/edit manually
  - ❌ Backup/restore complexity
  - ❌ Overkill for typical diagram counts (<1000)

### 5. **Obsidian Dataview/Metadata**
- Use Obsidian's frontmatter or dataview
- **Pros:**
  - Native Obsidian integration
  - Searchable in Obsidian
- **Cons:**
  - ❌ `.bac4` files are JSON, not markdown (no frontmatter support)
  - ❌ Would require creating `.md` files alongside `.bac4` files
  - ❌ Increases file count
  - ❌ Circular reference issues remain

## Rationale

The centralized relationships file was chosen because:

1. **Single Source of Truth:** One file to track all relationships eliminates inconsistency
2. **Simple Queries:** Easy to find all children of a diagram, all parents, orphaned diagrams
3. **Atomic Updates:** All relationship changes happen in one file transaction
4. **Git-Friendly:** Text-based JSON file, easy to diff and merge
5. **Performance:** All data fits in memory (even 1000 diagrams = ~500KB)
6. **Manual Inspection:** Users can view/edit relationships if needed
7. **Backup/Restore:** Single file to backup with vault
8. **Migration:** Easy to version and migrate (version field in JSON)

**Key Insight:** For a typical architecture project with 50-200 diagrams, a centralized file is far simpler than distributed metadata and performs excellently.

## Consequences

### Positive

- ✅ **Consistency:** No risk of parent/child metadata diverging
- ✅ **Fast Queries:** All relationships loaded in memory at startup
- ✅ **Simple API:** Single service (`DiagramNavigationService`) manages all relationships
- ✅ **Git-Friendly:** Easy to see relationship changes in commits
- ✅ **Debugging:** Easy to inspect current state in JSON file
- ✅ **Recovery:** If file corrupted, can rebuild from diagram files
- ✅ **Orphan Detection:** Easy to find diagrams not in relationships file

### Negative

- ⚠️ **Single File:** Need to handle concurrent access (mitigated: Obsidian is single-threaded)
- ⚠️ **Migration:** Format changes require migration strategy (version field helps)
- ⚠️ **Large Vaults:** Could become slow with 10,000+ diagrams (extremely unlikely)

### Neutral

- 📝 **Validation:** Need robust validation when loading relationships file
- 📝 **Cleanup:** Need periodic cleanup of orphaned entries (diagrams deleted outside plugin)
- 📝 **Sync:** Need to handle file moving/renaming (update filePath in relationships)

## Implementation Details

**File Location:**
```
vault-root/
├── diagram-relationships.json  # ← Centralized file
├── Context.bac4
├── System A.bac4
└── Component X.bac4
```

**Service:**
- `src/services/diagram-navigation-service.ts` - Manages all relationship operations
- Methods:
  - `registerDiagram()` - Add diagram to registry
  - `createChildDiagram()` - Create and link child
  - `linkDiagrams()` - Link existing diagrams
  - `getBreadcrumbs()` - Get hierarchy path
  - `getChildren()` - Get all children of diagram
  - `cleanup()` - Remove orphaned entries

**Auto-Registration:**
- All diagrams auto-register when created or opened
- Relationships file created automatically if missing
- Graceful degradation if file corrupted (rebuild from diagram files)

**Validation:**
- Check file exists before loading
- Validate JSON schema on load
- Verify diagram IDs reference existing files
- Remove orphaned entries periodically

## Example Structure

```json
{
  "version": "1.0.0",
  "diagrams": [
    {
      "id": "diagram-1697123456789",
      "filePath": "Context.bac4",
      "displayName": "Context",
      "type": "context",
      "createdAt": "2025-10-12T10:30:00Z",
      "updatedAt": "2025-10-12T14:15:00Z"
    },
    {
      "id": "diagram-1697123456790",
      "filePath": "Payment System.bac4",
      "displayName": "Payment System",
      "type": "container",
      "createdAt": "2025-10-12T10:35:00Z",
      "updatedAt": "2025-10-12T14:20:00Z"
    }
  ],
  "relationships": [
    {
      "parentDiagramId": "diagram-1697123456789",
      "childDiagramId": "diagram-1697123456790",
      "parentNodeId": "node-1",
      "parentNodeLabel": "Payment System",
      "createdAt": "2025-10-12T10:35:00Z"
    }
  ],
  "updatedAt": "2025-10-12T14:20:00Z"
}
```

## Migration Strategy

**Version Field:** Top-level `version` field allows future migrations:
```typescript
if (data.version === '1.0.0') {
  // No migration needed
} else if (data.version === '2.0.0') {
  // Migrate from 1.0.0 to 2.0.0
  data = migrateV1toV2(data);
}
```

## References

- Implementation: `src/services/diagram-navigation-service.ts`
- Type Definitions: `src/types/diagram-relationships.ts`
- Related: ADR 003 (Diagram File Format)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-10-12 | Development Team | Initial ADR |
