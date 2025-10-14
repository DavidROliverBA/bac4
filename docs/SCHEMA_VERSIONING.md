# BAC4 Schema Versioning

## Overview

BAC4 diagram files (`.bac4`) are JSON documents that evolve over time. This document tracks schema versions and breaking changes to ensure proper migration paths.

## Philosophy

**Breaking Changes Are Acceptable**
- BAC4 is designed for version-controlled environments (Git)
- Diagrams evolve with the codebase
- Users can always roll back via Git if needed
- Schema clarity > backward compatibility

## Current Schema Version

**Version:** `0.4.0` (Planned)
**Status:** In Development
**Release Date:** TBD

---

## Version History

### v0.4.0 - Container Node Icon Flexibility (Planned)

**Release Date:** TBD
**Breaking Changes:** YES - Container node data structure changed

#### Changes

**Container Node Data Model:**

```typescript
// BEFORE (v0.3.0 and earlier)
interface ContainerNodeData {
  label: string;
  containerType: 'webapp' | 'mobileapp' | 'api' | 'database' | 'queue' | 'service';
  technology?: string;
  description?: string;
  hasChildDiagram?: boolean;
  color?: string;
}

// AFTER (v0.4.0)
interface ContainerNodeData {
  label: string;
  icon: string;  // Required Lucide icon ID (e.g., "cloud-cog", "database", "server")
  type?: string;  // Optional type tag displayed in [brackets] (e.g., "API", "Database")
  description?: string;
  hasChildDiagram?: boolean;
  color?: string;
}
```

#### Rationale

1. **Removed:** Fixed `containerType` enum (6 predefined types)
2. **Added:** Free-form `icon` field accepting any Lucide icon ID
3. **Renamed:** `technology` → `type` (clearer semantic meaning)
4. **Result:** Users can select from 1,637 Lucide icons instead of 6 emojis

#### Migration Path

**For Users:**
- Delete existing Container diagrams (they will not load correctly)
- Recreate diagrams with new icon selector
- Diagrams created in v0.4.0+ will have full icon flexibility

**For Developers:**
- No migration script needed (users delete/recreate)
- Old diagrams will fail validation gracefully
- File format remains JSON (no parsing changes)

#### Example Diagram File

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "container",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Payment Service",
        "icon": "credit-card",
        "type": "REST API",
        "description": "Handles payment processing",
        "color": "#4A90E2"
      }
    },
    {
      "id": "node-2",
      "type": "container",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Order Database",
        "icon": "database",
        "type": "PostgreSQL",
        "description": "Stores order data",
        "color": "#16A085"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "data": {
        "label": "writes to",
        "direction": "right"
      }
    }
  ]
}
```

---

### v0.3.0 - Enhanced Installation Experience

**Release Date:** 2025-10-13
**Breaking Changes:** NO

#### Changes
- Improved documentation
- BRAT plugin support
- No data model changes

---

### v0.2.0 - AI Integration

**Release Date:** 2025-10-13
**Breaking Changes:** NO

#### Changes
- AI-powered diagram generation
- MCP integration
- New node field: `linkedMarkdownFile?: string` (optional, non-breaking)

---

### v0.1.0 - Initial Release

**Release Date:** 2025-10-12
**Breaking Changes:** N/A (initial release)

#### Initial Schema

**Node Types:**
- `c4` - Generic C4 node
- `system` - System node (Context diagrams)
- `person` - Person/Actor node (Context diagrams)
- `container` - Container node (Container diagrams)
- `cloudComponent` - Cloud service node (Component diagrams)

**File Format:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

---

## Schema Design Principles

### 1. Explicit Over Implicit

**Good:**
```typescript
icon: "cloud-cog"  // Explicit Lucide icon ID
type: "REST API"   // Clear semantic meaning
```

**Avoid:**
```typescript
containerType: "api"  // Ambiguous, limiting
```

### 2. Flexibility Over Constraints

- Prefer free-form strings over enums when appropriate
- Let users express intent naturally
- Use validation at UI level, not data level

### 3. Forward Compatibility

- Optional fields are safe to add
- Required fields require version bump
- Removals always break compatibility

### 4. Git-Friendly

- Human-readable JSON
- Consistent formatting
- Predictable structure for diffs

---

## Migration Strategy

### When Breaking Changes Occur

1. **Document the change** in this file
2. **Bump version** in manifest.json
3. **Update validation** to reject old schemas gracefully
4. **Notify users** in release notes
5. **Provide examples** of new format

### User Migration Workflow

```bash
# 1. Commit existing diagrams
git add *.bac4
git commit -m "Backup diagrams before v0.4.0 upgrade"

# 2. Upgrade BAC4 plugin
# (via Obsidian settings or BRAT)

# 3. Delete incompatible diagrams
rm Container_*.bac4

# 4. Recreate diagrams with new features
# (use BAC4 Dashboard or AI generation)

# 5. Commit new diagrams
git add *.bac4
git commit -m "Recreate diagrams for v0.4.0 schema"
```

---

## Validation Rules

### Schema Version Detection

**Current Approach:** Infer version from node data structure

```typescript
// Detect v0.3.0 (has containerType enum)
if ('containerType' in nodeData) {
  return '0.3.0';
}

// Detect v0.4.0 (has icon field)
if ('icon' in nodeData) {
  return '0.4.0';
}
```

**Future Approach:** Add explicit schema version to file

```json
{
  "schemaVersion": "0.4.0",
  "nodes": [...],
  "edges": [...]
}
```

### Validation Errors

When loading incompatible diagrams:

```typescript
// ErrorHandler displays user-friendly message
ErrorHandler.handleError(
  new Error('Incompatible schema'),
  `This diagram was created with an older version of BAC4.
   Please recreate it using the current version.`
);
```

---

## Future Schema Changes

### Planned for v0.5.0

**Explicit Schema Version Field:**
```json
{
  "schemaVersion": "0.5.0",
  "metadata": {
    "created": "2025-10-14T00:00:00Z",
    "updated": "2025-10-14T00:00:00Z",
    "author": "David Oliver"
  },
  "nodes": [...],
  "edges": [...]
}
```

**Benefits:**
- No more inference-based detection
- Enable automated migration scripts
- Track diagram lifecycle

### Considered for v0.6.0+

- **Diagram-level properties** (layout algorithm, zoom level)
- **Node templates** (reusable node configurations)
- **Edge styles** (dashed, dotted, thick)
- **Annotations** (comments, notes, highlights)

---

## Questions & Answers

**Q: Why not provide automatic migration?**
A: BAC4 is designed for Git-controlled environments. Users can always roll back. Manual recreation ensures users review and update diagrams intentionally.

**Q: What if I need my old diagrams?**
A: Git checkout the previous version, or downgrade the plugin via BRAT.

**Q: Will this happen often?**
A: No. Breaking changes are rare and always documented. Most releases are non-breaking.

**Q: Can I mix schema versions?**
A: No. All diagrams in a vault should use the same schema version.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-14 | Created schema versioning document | Claude Code |
| 2025-10-14 | Documented v0.4.0 Container Node changes | Claude Code |

---

**Last Updated:** 2025-10-14
**Document Version:** 1.0
**BAC4 Version:** 0.4.0 (planned)
