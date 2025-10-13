# ADR 003: Pure JSON Diagram Files Without Embedded Metadata

**Date:** 2025-10-12
**Status:** Accepted
**Deciders:** Development Team
**Related:** File Format, Data Structure, ADR 002

---

## Context

BAC4 diagrams need to be saved to files that:
- Store nodes (positions, labels, properties, types)
- Store edges (connections, labels, directions)
- Are version-controlled with git
- Can be easily inspected and edited manually if needed
- Support future format migrations

**Question:** Should diagram metadata (type, created date, parent references) be embedded in diagram files or stored separately?

## Decision

**Diagram files (`.bac4`) contain ONLY pure data (nodes and edges). All metadata is stored in the centralized `diagram-relationships.json` file.**

## Alternatives Considered

### 1. **Pure Data Files + Centralized Metadata** (CHOSEN)
- **Diagram File Structure:**
  ```json
  {
    "nodes": [...],
    "edges": [...]
  }
  ```
- **Metadata stored in:** `diagram-relationships.json`
- **Pros:**
  - Clean separation of concerns (data vs metadata)
  - Minimal git diffs (only node/edge changes)
  - Easy to inspect diagram content
  - Simple file format (just nodes and edges)
  - React Flow compatible (direct mapping)
- **Cons:**
  - Need separate metadata file (addressed by ADR 002)
  - Can't determine diagram type from file alone

### 2. **Embedded Metadata in Diagram Files**
- **Structure:**
  ```json
  {
    "metadata": {
      "diagramType": "context",
      "createdAt": "...",
      "updatedAt": "...",
      "parentDiagramId": "..."
    },
    "nodes": [...],
    "edges": [...]
  }
  ```
- **Pros:**
  - Self-contained diagram files
  - Can determine type from file
- **Cons:**
  - ❌ Metadata changes cause git diffs even when diagram unchanged
  - ❌ Circular references (parent stores child ID, child stores parent ID)
  - ❌ `updatedAt` changes on every save (noisy git history)
  - ❌ React Flow doesn't need metadata (extra parsing)
  - ❌ Inconsistency risk if metadata conflicts with relationships file

### 3. **Markdown with Frontmatter**
- Use `.md` files with YAML frontmatter + JSON codeblock
- **Structure:**
  ```markdown
  ---
  type: context
  created: 2025-10-12
  ---

  ```json
  {
    "nodes": [...],
    "edges": [...]
  }
  ```
  ```
- **Pros:**
  - Native Obsidian format
  - Can add notes/documentation
- **Cons:**
  - ❌ Not JSON parseable
  - ❌ Requires custom parser
  - ❌ Can't directly load into React Flow
  - ❌ Metadata in frontmatter AND relationships file (duplication)
  - ❌ More complex to edit programmatically

### 4. **Binary Format**
- Use binary serialization (protobuf, msgpack, etc.)
- **Pros:**
  - Smaller file size
  - Fast parsing
- **Cons:**
  - ❌ Not human-readable
  - ❌ Not git-friendly (binary diffs)
  - ❌ Can't manually edit/inspect
  - ❌ Requires additional tooling
  - ❌ Overkill for diagram sizes

## Rationale

Pure JSON data files were chosen because:

1. **Clean Separation:** Diagram content (data) vs diagram metadata (type, dates, relationships) are separate concerns
2. **Minimal Git Diffs:** Only node/edge changes appear in diffs, not metadata updates
3. **React Flow Compatible:** Direct mapping to React Flow's node/edge arrays
4. **Simplicity:** Straightforward JSON structure, easy to parse and generate
5. **Inspectability:** Easy to open and understand file contents
6. **Manual Editing:** Users can edit diagram files directly if needed (advanced use)
7. **No Duplication:** Metadata lives in ONE place (relationships file), not duplicated

**Key Insight:** Since we already need a relationships file for hierarchy tracking (ADR 002), embedding metadata in diagram files would be redundant and error-prone.

## Consequences

### Positive

- ✅ **Clean Git History:** Only actual diagram changes appear in diffs
- ✅ **Simple Format:** Just nodes and edges, no metadata clutter
- ✅ **React Flow Direct:** Can load JSON directly into React Flow
- ✅ **Manual Editing:** Easy to understand and edit manually
- ✅ **No Duplication:** Single source of truth for metadata
- ✅ **Fast Parsing:** Simple JSON.parse() with no metadata extraction

### Negative

- ⚠️ **Requires Relationships File:** Can't determine diagram type from file alone (must check relationships file)
- ⚠️ **Two-File System:** Need both diagram file and relationships file for complete info

### Neutral

- 📝 **Migration:** File format can evolve independently of metadata format
- 📝 **Validation:** Need to validate nodes/edges structure, but simpler than full metadata

## Implementation Details

**Diagram File (`.bac4`):**
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "system",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Payment System",
        "description": "Processes payments",
        "color": "#4A90E2"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "directional",
      "data": {
        "label": "uses",
        "direction": "right"
      }
    }
  ]
}
```

**Loading Process:**
1. Read `.bac4` file → get nodes and edges
2. Load `diagram-relationships.json` → get metadata (type, parent, etc.)
3. Combine for complete diagram state

**Saving Process:**
1. Save nodes + edges to `.bac4` file
2. Update relationships file if metadata changed

**File Operations:**
```typescript
// Loading
const diagramData = JSON.parse(await vault.read('Context.bac4'));
const { nodes, edges } = diagramData;
const metadata = navigationService.getDiagramMetadata('Context.bac4');

// Saving
await vault.write('Context.bac4', JSON.stringify({ nodes, edges }, null, 2));
```

## Data Ownership

| Data | Location | Reason |
|------|----------|--------|
| **Nodes** | `.bac4` file | Diagram content |
| **Edges** | `.bac4` file | Diagram content |
| **Diagram Type** | Relationships file | Metadata |
| **Created Date** | Relationships file | Metadata |
| **Updated Date** | Relationships file | Metadata |
| **Parent/Child Links** | Relationships file | Metadata |
| **Display Name** | Relationships file | Metadata |

## Future Considerations

**If Metadata Needed in File:**
If we ever need to embed metadata (e.g., for standalone file sharing), we can add it WITHOUT breaking existing files:

```json
{
  "version": "2.0.0",
  "metadata": {
    "type": "context",
    "exportedAt": "..."
  },
  "nodes": [...],
  "edges": [...]
}
```

Loader would check for `metadata` field and use it if present, otherwise fall back to relationships file.

## References

- Related: ADR 002 (Centralized Relationships File)
- Implementation: `src/data/file-io.ts`
- Types: `src/types/canvas-types.ts`

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-10-12 | Development Team | Initial ADR |
