# BAC4 v2.5.0 - Data Format Evolution

**Release Date:** October 22, 2025
**Status:** ✅ Production Ready
**Build Size:** 721.0kb
**Breaking Changes:** ⚠️ Yes - Requires migration for old diagrams

---

## 🎯 Overview

**v2.5.0 introduces a revolutionary dual-file format** that separates semantic data from presentation data, laying the foundation for advanced features like multiple layouts, graph database export, and enhanced knowledge management.

This release represents a **fundamental architectural improvement** that enables future capabilities while maintaining the power and simplicity of BAC4.

---

## ✨ What's New

### 1. Dual-File Format Architecture

**The Big Change:**
Instead of storing everything in one `.bac4` file, diagrams now use TWO files:

```
diagram.bac4          → Semantic data (WHAT)
├─ nodes              ├─ Node properties (label, description, technology)
├─ metadata           ├─ Knowledge (notes, URLs, attachments)
├─ knowledge          ├─ Metrics (uptime, cost, users)
└─ links              └─ Relationships (parent, children, dependencies)

diagram.bac4-graph    → Presentation data (HOW)
├─ timeline           ├─ Layout (x, y, width, height)
├─ snapshots          ├─ Edges (relationships with styles)
├─ layout             ├─ Annotations and highlights
└─ edges              └─ Visual groupings
```

**Why This Matters:**

#### 🎨 Multiple Layouts for Same Data
- Create different views of the same architecture
- Hierarchical view vs. flat view vs. Wardley Map
- Share diagrams with different stakeholders (executive vs. technical)

#### 🗃️ Graph Database Ready
- Direct migration path to Neo4j
- Nodes → Neo4j nodes with all properties
- Edges → Neo4j relationships
- Query architecture with Cypher

#### 📚 Enhanced Knowledge Management
- Rich metadata on every node
- URLs with types (documentation, monitoring, source code)
- Notes with authors and timestamps
- File attachments linked to nodes
- Team assignments and ownership

#### 📊 Metrics Tracking
- Business metrics (cost per month, users, transactions)
- Technical metrics (uptime, latency, error rate)
- Historical tracking across snapshots
- Exportable for dashboards

#### 🗺️ Wardley Mapping Integration
- Full Wardley Map support
- Visibility and evolution axes
- Inertia barrier modeling
- Link Wardley Maps to C4 diagrams

---

### 2. Enhanced Node Data Model

**New Properties Available:**

#### Knowledge Management
```json
"knowledge": {
  "notes": [
    {
      "author": "David Oliver",
      "content": "Migrated to Kubernetes Q3 2025",
      "created": "2025-10-15T10:00:00Z"
    }
  ],
  "urls": [
    {
      "label": "Production Dashboard",
      "url": "https://datadog.example.com/service",
      "type": "monitoring"
    },
    {
      "label": "Source Code",
      "url": "https://github.com/org/repo",
      "type": "source"
    }
  ],
  "attachments": [
    {
      "name": "Architecture Decision Record",
      "path": "docs/adr/001-kubernetes-migration.md"
    }
  ]
}
```

#### Metrics Tracking
```json
"metrics": {
  "uptime": 0.9995,
  "users": 1200,
  "cost_per_month_usd": 12000,
  "transactions_per_day": 50000,
  "latency_ms_p95": 250
}
```

#### Wardley Properties
```json
"wardley": {
  "visibility": 0.85,
  "evolution": 0.60,
  "evolutionStage": "product",
  "inertia": false
}
```

#### Enhanced Links
```json
"links": {
  "parent": "system-architecture",
  "children": ["user-service", "order-service"],
  "linkedDiagrams": [
    {
      "path": "Container/UserService.bac4",
      "relationship": "decomposes-to"
    }
  ],
  "externalSystems": ["payment-gateway", "email-service"],
  "dependencies": ["database", "cache", "message-queue"]
}
```

---

### 3. Automated Migration Workflow

**Migration Command:** `Migrate Diagrams to v2.5.0 Format`

**Features:**
- ✅ Automatic migration of all `.bac4` files in vault
- ✅ Backup creation (`.bac4.v1.backup`)
- ✅ Validation before and after migration
- ✅ Dry-run mode to preview changes
- ✅ Detailed migration report
- ✅ Rollback capability if needed

**What Happens:**
```bash
Before:
  diagram.bac4 (v1 format - nodes + edges + positions in one file)

After:
  diagram.bac4 (v2.5.0 - semantic data only)
  diagram.bac4-graph (v2.5.0 - presentation data)
  diagram.bac4.v1.backup (original file backup)
```

**Migration Report Generated:**
- Total files migrated
- Files skipped (already v2.5.0)
- Files failed (with error details)
- Upgrade instructions
- Rollback instructions

---

### 4. Wardley Mapping Support

**Full Wardley Map Capabilities:**

#### Visualization
- Evolution axis (Genesis → Custom → Product → Commodity)
- Visibility axis (visible vs. invisible to user)
- Component positioning based on maturity
- Inertia barriers
- Movement indicators

#### Components
- Wardley Component nodes with evolution stages
- Inertia nodes for resistance to change
- Links between components showing dependencies
- Value chain visualization

#### Integration with C4
- Link Wardley Maps to Context/Container diagrams
- Strategic view (Wardley) + technical view (C4)
- Unified architecture story

**Create Wardley Maps:**
- Command: `Create New Wardley Map`
- Full editing support
- Export to image/Canvas

---

### 5. Graph Database Export Path

**Neo4j Ready:**

The v2.5.0 format maps directly to graph databases:

```cypher
// Nodes become Neo4j nodes
CREATE (n:Component {
  id: "user-service",
  label: "User Service",
  technology: "Node.js",
  uptime: 0.999,
  cost_per_month_usd: 5000
})

// Edges become Neo4j relationships
CREATE (a)-[:DEPENDS_ON {
  label: "uses for authentication",
  direction: "right"
}]->(b)

// Query architecture
MATCH (s:Service)-[:DEPENDS_ON*]->(d:Database)
WHERE s.uptime < 0.99
RETURN s, d

// Find critical paths
MATCH path = shortestPath(
  (start:System)-[:DEPENDS_ON*]->(end:System)
)
RETURN path
```

**Future (v2.6.0):**
- Direct Neo4j export command
- Cypher query generation
- Graph analytics integration

---

## 🏗️ Technical Implementation

### New Services

**1. FileIOService** (`file-io-service.ts` - 400+ lines)
- Read/write dual-file format
- Merge/split operations (React Flow ↔ BAC4 format)
- Format validation
- Helper functions

**Key Functions:**
```typescript
readDiagram(vault, filePath) → {nodeFile, graphFile}
writeDiagram(vault, filePath, nodeFile, graphFile)
mergeNodesAndLayout(nodeFile, graphFile) → Node[]
splitNodesAndEdges(nodes, edges, current) → {nodeFile, graphFile}
```

**2. MigrationService** (`migration-service.ts` - 570 lines)
- Batch migration (all files in vault)
- Single file migration
- Backup creation
- Migration report generation
- Rollback functionality
- Migration status checking

**Key Functions:**
```typescript
migrateAllDiagrams(options) → MigrationStats
migrateSingleDiagram(file, options) → 'migrated' | 'skipped' | 'failed'
rollbackMigration() → void
getMigrationStatus(file) → {version, needsMigration, hasBackup}
```

**3. FormatConverter** (`format-converter.ts` - 550 lines)
- v1 → v2 conversion logic
- v2 → v1 conversion (backward compatibility)
- Format validation
- Node/edge transformation
- Type inference and defaults

**Key Functions:**
```typescript
convertV1ToV2(v1File, filePath) → {nodeFile, graphFile}
convertV2ToV1(nodeFile, graphFile) → v1File
validateV2Format(nodeFile, graphFile) → {valid, errors}
```

### Integration Points

**Updated Components:**
- **useFileOperations Hook** - Uses dual-file format for all I/O
- **Canvas View** - Loads both files on diagram open
- **Auto-save** - Saves both files with 300ms debounce
- **Create Diagram** - Creates both files for new diagrams
- **Timeline Service** - Works with graph file snapshots

### Type Definitions

**Complete v2.5.0 Types** (`bac4-v2-types.ts` - 500+ lines):
- `BAC4FileV2` - Node file structure
- `BAC4GraphFileV2` - Graph file structure
- `NodeV2` - Enhanced node properties
- `EdgeV2` - Enhanced edge properties
- `Snapshot` - Timeline snapshot structure
- `WardleyNodeProperties` - Wardley Map properties
- `NodeLinks` - Relationship tracking

---

## 📊 Statistics

### Code Changes
- **New Services:** 1,520 lines (FileIOService, MigrationService, FormatConverter)
- **Type Definitions:** 500+ lines (complete v2.5.0 types)
- **Updated Components:** useFileOperations, canvas-view integration
- **Total New Code:** ~2,000 lines

### File Format
- **v1 Format:** Single .bac4 file (all data)
- **v2.5.0 Format:** Dual files (.bac4 + .bac4-graph)
- **Size Impact:** Similar total size, better organization
- **Performance:** Same or better (lazy loading possible)

### Bundle Metrics
- **Size:** 721.0kb (same as v2.4.0)
- **Build Time:** 62ms
- **TypeScript Errors:** 0
- **Type Safety:** 100%

---

## 🔄 Migration Guide

### Automatic Migration (Recommended)

**Step 1: Backup Your Vault**
```bash
# Create full vault backup before migrating
cp -r ~/Documents/Vaults/MyVault ~/Documents/Vaults/MyVault-backup
```

**Step 2: Run Dry Run (Optional)**
```
1. Open command palette (Cmd/Ctrl+P)
2. Run: "Check Migration Status"
3. Review how many files need migration
```

**Step 3: Migrate All Diagrams**
```
1. Open command palette
2. Run: "Migrate Diagrams to v2.5.0 Format"
3. Confirm migration
4. Wait for completion
5. Review migration report (auto-opens)
```

**Step 4: Verify**
```
1. Open a few diagrams
2. Check that they load correctly
3. Make edits to confirm save works
4. Check for .bac4-graph files alongside .bac4 files
```

**Step 5: Clean Up (Optional)**
```
# After confirming everything works (wait a few days):
# Delete backup files
find ~/Documents/Vaults/MyVault -name "*.bac4.v1.backup" -delete
```

### Manual Migration

If automatic migration fails:

```typescript
// For a single file:
1. Run: "Migrate Single Diagram"
2. Select the diagram file
3. Review results

// For emergency rollback:
1. Run: "Rollback v2.5.0 Migration"
2. All .bac4.v1.backup files will be restored
3. .bac4-graph files will be deleted
```

---

## ⚠️ Breaking Changes

### File Format Change

**Old (v1):**
- Single `.bac4` file with everything

**New (v2.5.0):**
- `.bac4` file (semantic data)
- `.bac4-graph` file (presentation data)

**Impact:**
- Old plugins (v2.4.0 and earlier) cannot read v2.5.0 files
- Must run migration before v2.5.0 can open old diagrams
- Backups created automatically during migration

### New Diagrams

**All new diagrams created in v2.5.0 format:**
- Creates both `.bac4` and `.bac4-graph` files
- Cannot be opened by older plugin versions
- Forward-only migration (v1 → v2.5.0)

### Backward Compatibility

**v2.5.0 can read:**
- ✅ v2.5.0 format (dual-file)
- ⚠️ v1 format (with migration prompt)

**v2.4.0 and earlier can read:**
- ✅ v1 format only
- ❌ v2.5.0 format (not compatible)

**Recommendation:**
- Migrate all diagrams to v2.5.0
- Don't mix plugin versions
- Keep backups until confident

---

## 🎓 Usage Examples

### Example 1: Add Knowledge to a Node

```markdown
1. Open any diagram
2. Select a node
3. In Property Panel, add:
   - Notes: "This service will be deprecated in Q2 2026"
   - URL: "https://wiki.company.com/services/user-service"
   - Attachment: Link to ADR document
4. Save automatically persists to .bac4 file
```

### Example 2: Track Metrics

```markdown
1. Select a container node
2. Add metrics:
   - Uptime: 0.999
   - Cost per month: $5000
   - Users: 10000
3. View in property panel
4. Export metrics across all services (future feature)
```

### Example 3: Create Wardley Map

```markdown
1. Command: "Create New Wardley Map"
2. Add components with evolution stages
3. Position on axes:
   - Visibility (y-axis): How visible to users
   - Evolution (x-axis): Genesis → Custom → Product → Commodity
4. Add dependencies between components
5. Link to C4 Context diagram
```

### Example 4: Migrate Existing Diagrams

```markdown
1. Update plugin to v2.5.0
2. Open command palette
3. Run: "Check Migration Status"
   Result: "Found 47 diagrams (5 already v2.5.0, 42 need migration)"
4. Run: "Migrate Diagrams to v2.5.0 Format"
5. Review report: "✅ Migrated 42, Skipped 5, Failed 0"
6. Test a few diagrams
7. Delete backups after a week
```

---

## 🐛 Known Issues & Limitations

### Migration

1. **Large Vaults** - Migration of 100+ diagrams may take 1-2 minutes
2. **Memory** - Very large diagrams (50+ nodes) may use more memory during migration
3. **Validation** - Some edge cases in v1 format may fail validation

### Dual-File Format

1. **File Management** - Two files per diagram (might clutter file browser)
2. **Syncing** - Both files must be synced (use Obsidian Sync or git)
3. **Deletion** - Must delete both .bac4 and .bac4-graph files

### Backward Compatibility

1. **No Downgrade** - Once migrated to v2.5.0, cannot use older plugin versions
2. **Sharing** - Collaborators must all use v2.5.0 or later

---

## 🔮 What's Next (v2.6.0 - v3.0.0)

### v2.6.0 - Graph Database Export (Q1 2026)
- Direct Neo4j export
- Cypher query generation
- Graph analytics
- Relationship queries

### v3.0.0 - Enterprise Collaboration (Q2 2026)
- Multi-user editing
- Role-based access control
- Activity feeds and notifications
- Comments and annotations
- Estate dashboard
- Architecture drift detection

---

## 📝 Documentation Updates

**New Documentation:**
- Migration Guide (this file)
- Dual-File Format Specification
- Wardley Mapping Guide
- Knowledge Management Guide
- Metrics Tracking Guide

**Updated Documentation:**
- ROADMAP.md - v2.5.0 marked complete
- CLAUDE.md - v2.5.0 format explained
- README.md - Updated features list

---

## 🙏 Acknowledgments

**Built with:**
- React Flow for canvas
- TypeScript for type safety
- Obsidian API for integration
- Neo4j concepts for graph structure

**Inspired by:**
- Simon Wardley's mapping concepts
- C4 Model by Simon Brown
- Graph database design patterns
- Knowledge management best practices

---

## 🐛 Bug Reports

Found a bug? Please report at:
**https://github.com/DavidROliverBA/bac4/issues**

Include:
- Version: 2.5.0
- Migration status (migrated or new diagram)
- Error message
- Sample diagram (if possible)
- Expected vs actual behavior

---

## 🎉 Summary

**v2.5.0 is a foundational release** that transforms BAC4's data architecture:

✅ **Dual-File Format** - Semantic vs. presentation separation
✅ **Enhanced Data Model** - Knowledge, metrics, Wardley properties
✅ **Automated Migration** - Safe, validated, with backups
✅ **Wardley Mapping** - Full strategic planning support
✅ **Graph DB Ready** - Direct path to Neo4j
✅ **Future-Proof** - Enables v3.0+ collaboration features

**Breaking Change:** Requires migration, but automated and safe
**Benefits:** Multiple layouts, rich metadata, graph export, Wardley Maps
**Next:** Neo4j export (v2.6.0), Enterprise collaboration (v3.0.0)

---

**Enjoy BAC4 v2.5.0!** 🚀

*Generated: October 22, 2025*
*Build: 721.0kb production bundle*
*License: MIT*
