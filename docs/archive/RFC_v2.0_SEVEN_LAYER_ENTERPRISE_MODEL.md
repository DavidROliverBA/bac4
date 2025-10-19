# RFC: BAC4 v2.0 - Seven-Layer Enterprise Architecture Model

**Status**: 🔬 Request for Comments (RFC)
**Target Release**: v2.0.0 (Q2 2026)
**Breaking Change**: Yes (requires migration from v1.0)

---

## Summary

Transform BAC4 from a **C4 diagramming tool** into a comprehensive **Enterprise Architecture Platform** with:

1. **7 Architectural Layers**: Market → Organisation → Capability → Context → Container → Component → Code
2. **Native Obsidian Canvas**: Use JSONCanvas (.canvas) as primary format for visual editing
3. **Dual-Format Architecture**: .canvas for layout + .bac4 for metadata/timeline/semantics
4. **GitHub Integration**: Link diagrams to code repositories
5. **Full Traceability**: Navigate from business strategy → implementation

---

## Motivation

### Why This Change?

**Current BAC4 (v1.0)**:
- ✅ Excellent C4 model support (Context/Container/Component)
- ✅ Timeline tracking for architecture evolution
- ✅ Cloud component libraries
- ❌ Limited to technical architecture (no business context)
- ❌ Custom canvas rendering (not native Obsidian)
- ❌ Stops at code boundary (no implementation links)

**Market Gap**:
- **ArchiMate tools** are too heavy, expensive ($500+/year), and complex
- **C4 tools** lack business layers (Market, Organisation, Capability)
- **Obsidian Canvas** is too generic (no structured architecture)
- **Charkoal** (IDE tool) focuses on code, not architecture planning

**BAC4 v2.0 fills this gap**: Lightweight, Obsidian-native, enterprise-scope modeling from business to code.

---

## Proposed Architecture

### 1. Seven Layers

```
┌────────────────────────────────────────┐
│ Layer 1: MARKET                        │
│ - Market segments, customer needs      │
│ - Examples: "Healthcare", "FinTech"    │
└────────────────────────────────────────┘
                  ⬇
┌────────────────────────────────────────┐
│ Layer 2: ORGANISATION                  │
│ - Business units, departments, teams   │
│ - Examples: "Hospital A", "Cardiology" │
└────────────────────────────────────────┘
                  ⬇
┌────────────────────────────────────────┐
│ Layer 3: CAPABILITY                    │
│ - Business capabilities, functions     │
│ - Examples: "Patient Mgmt", "Billing"  │
└────────────────────────────────────────┘
                  ⬇
┌────────────────────────────────────────┐
│ Layer 4: CONTEXT (C4 Level 1) ✅       │
│ - System landscape (EXISTING)          │
│ - Examples: "EMR System", "Doctor"     │
└────────────────────────────────────────┘
                  ⬇
┌────────────────────────────────────────┐
│ Layer 5: CONTAINER (C4 Level 2) ✅     │
│ - High-level components (EXISTING)     │
│ - Examples: "API Gateway", "Database"  │
└────────────────────────────────────────┘
                  ⬇
┌────────────────────────────────────────┐
│ Layer 6: COMPONENT (C4 Level 3) ✅     │
│ - Internal structure (EXISTING)        │
│ - Examples: "Auth Service", "Lambda"   │
└────────────────────────────────────────┘
                  ⬇
┌────────────────────────────────────────┐
│ Layer 7: CODE / DATA ⭐ NEW            │
│ - Implementation artifacts             │
│ - Examples: "AuthController.ts", DB    │
│ - Links to: GitHub repos, files        │
└────────────────────────────────────────┘
```

### 2. Dual-Format Architecture

**User edits**: `.canvas` files (Obsidian's native Canvas)
**Plugin manages**: `.bac4` metadata (timeline, semantics, enrichment)

```
Healthcare_Market.canvas  ← User edits in Obsidian Canvas
Healthcare_Market.bac4    ← Plugin stores metadata
```

**Benefits**:
- ✅ Native Obsidian editing (fast, polished UX)
- ✅ Preserve timeline, annotations, semantic metadata
- ✅ Git-friendly (both are JSON)
- ✅ Interoperable with other tools

### 3. Navigation Model

**Drill-Down** (Top → Bottom):
```
Market → Organisation → Capability → Context → Container → Component → Code
```

**Example Journey**:
1. "Healthcare Market" → double-click "Hospital A"
2. Opens "Hospital A" (Organisation layer)
3. Double-click "Patient Management" capability
4. Opens "EMR System" (Context layer)
5. Continue drilling down to code files

**Breadcrumb**: Market / Healthcare / Hospital A / Patient Mgmt / EMR / API / AuthController.ts

---

## User Stories

### Story 1: Enterprise Architect

**As an enterprise architect,**
**I want to model business capabilities and map them to technical systems,**
**So that stakeholders understand how technology supports business goals.**

**Today**: Use ArchiMate ($500/year, steep learning curve)
**With BAC4 v2.0**: Model in Obsidian, navigate Market → Code, timeline evolution

### Story 2: Solution Architect (Existing User)

**As a solution architect,**
**I want to continue using C4 diagrams but add business context,**
**So that I can show how my systems fit into the broader enterprise.**

**Today**: Use BAC4 v1.0 (3 layers)
**With BAC4 v2.0**: Add Capability layer above Context, link to business capabilities

### Story 3: Technical Lead

**As a technical lead,**
**I want to link architecture diagrams to actual code in GitHub,**
**So that developers can navigate from diagrams to implementation.**

**Today**: Manually link to repos in markdown
**With BAC4 v2.0**: Code layer with direct GitHub links, see last commit, authors

---

## Phased Rollout Plan

### Phase 1: v1.1.0 - Foundations (Q1 2026, 4 weeks)

**Goal**: Prove dual-format works without disruption

**Features**:
- ✅ Dual-format: .canvas + .bac4
- ✅ Keep existing 3 layers (Context/Container/Component)
- ✅ Migration tool v1.0 → v1.1
- ✅ Timeline works with Canvas

**Success Criteria**:
- 80%+ migration success rate
- <1% sync conflict rate
- Positive user feedback

**Go/No-Go**: If v1.1 fails criteria, pause before v2.0

---

### Phase 2: v1.2.0 - GitHub Integration (Q1 2026, 3 weeks)

**Goal**: Validate Code layer value

**Features**:
- ✅ Code/Data layer (4th layer)
- ✅ GitHub repo linking
- ✅ Link nodes to code files
- ✅ Show last commit, authors

**Success Criteria**:
- 40%+ users adopt Code layer
- GitHub links work reliably
- Navigation Context → Container → Component → Code

---

### Phase 3: v2.0.0 - Full Enterprise Model (Q2 2026, 8 weeks)

**Goal**: Complete enterprise architecture platform

**Features**:
- ✅ Market, Organisation, Capability layers (7 total)
- ✅ Cross-layer traceability
- ✅ Custom Canvas rendering (C4 styling)
- ✅ Enterprise positioning

**Success Criteria**:
- 30%+ users create 7-layer diagrams
- Avg 4.5 layers per user
- 15%+ market layer usage

---

## What We're Asking

### Questions for Community

1. **Would you use business layers** (Market, Organisation, Capability)?
   - [ ] Yes, I need full enterprise modeling
   - [ ] Maybe, I'd try it
   - [ ] No, C4 layers are enough for me

2. **Would you use GitHub integration** (Code layer)?
   - [ ] Yes, linking diagrams to code is valuable
   - [ ] Maybe, depends on implementation
   - [ ] No, I don't need code links

3. **Is dual-format acceptable** (.canvas + .bac4)?
   - [ ] Yes, if it enables native Obsidian editing
   - [ ] Maybe, concerned about complexity
   - [ ] No, prefer single file format

4. **Migration concern**:
   - [ ] I'd migrate if there's a tool
   - [ ] I'd start fresh in v2.0
   - [ ] I'd stay on v1.0

5. **Pricing** (if enterprise features):
   - [ ] $49/year for 7 layers + GitHub is reasonable
   - [ ] I'd pay more for enterprise features
   - [ ] Should remain free

### What We Need From You

**Feedback**:
- 💬 Comment on this RFC with your thoughts
- 📊 Vote in the poll (link TBD)
- 🐛 Highlight potential issues

**Testing** (when ready):
- 🧪 Try v1.1.0 beta (dual-format)
- 📝 Report migration issues
- 🎨 Test Canvas editing UX

---

## Technical Details

### Dual-Format Sync

**How it works**:
1. User edits `.canvas` in Obsidian
2. File watcher detects change
3. Sync service updates `.bac4` metadata
4. Timeline, annotations, semantic types preserved

**Conflict Resolution**:
- Recent edit wins (timestamp-based)
- User can manually sync if needed
- Fallback: Edit .bac4 directly for metadata

### Timeline in Canvas

**Approach**: Multi-file snapshots
```
Payment_System.canvas          ← Current snapshot (live editing)
Payment_System.bac4            ← All snapshots + metadata
_snapshots/
  Payment_System_Before.canvas ← Snapshot 1 (read-only)
  Payment_System_After.canvas  ← Snapshot 2 (read-only)
```

### Migration

**v1.0 → v2.0**:
- Current snapshot → `.canvas`
- All snapshots → `.bac4` timeline
- Annotations preserved
- Node types mapped to semantic types

**Tool**: `MigrationServiceV2` (prototype ready)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Dual-format sync breaks** | 🔴 HIGH | Extensive testing, conflict UI, manual sync fallback |
| **Low adoption of new layers** | 🟡 MEDIUM | Start with Code layer (high demand), prove value first |
| **Performance issues** | 🟡 MEDIUM | Optimize file watchers, lazy loading, profiling |
| **User confusion** | 🟡 MEDIUM | Clear docs, tutorials, migration guide |

---

## Timeline

| Milestone | Date | Duration |
|-----------|------|----------|
| **RFC Feedback Period** | Oct 2025 | 2 weeks |
| **Prototype Testing** | Nov 2025 | 2 weeks |
| **Go/No-Go Decision** | Dec 2025 | - |
| **v1.1.0 Development** | Jan 2026 | 4 weeks |
| **v1.2.0 Development** | Feb 2026 | 3 weeks |
| **v2.0.0 Development** | Mar-Apr 2026 | 8 weeks |
| **v2.0.0 Release** | End of Apr 2026 | - |

**Total**: ~6 months from RFC to release

---

## Alternatives Considered

### Alternative 1: Stay with v1.0 (C4 only)
- **Pro**: No breaking change, lower risk
- **Con**: Limited market differentiation, no business context
- **Verdict**: ❌ Misses strategic opportunity

### Alternative 2: Export-only (no dual-format)
- **Pro**: Lower complexity
- **Con**: Not a platform, limited Canvas integration
- **Verdict**: ❌ Doesn't achieve vision

### Alternative 3: Full migration to Canvas (no .bac4)
- **Pro**: Simpler single format
- **Con**: Lose timeline, annotations, semantic metadata
- **Verdict**: ❌ Unacceptable feature loss

---

## Success Metrics

### Adoption (6 months post-v2.0)

- **30%** of users create 7-layer diagrams
- **Avg 4.5 layers** per user
- **15%** market layer usage
- **40%** GitHub integration usage
- **60%** prefer Canvas editing over custom view

### Quality

- **0 critical bugs** in first month
- **<5 minor bugs** in first month
- **80%+ test coverage** on new code
- **<100ms snapshot switching** (p95)

### Business

- **500 Pro users** @ $49/year = $24,500 ARR
- **10 Enterprise orgs** @ $199/year = $1,990 ARR
- **Total ARR**: $26,490 (Year 1)

---

## How to Provide Feedback

**GitHub Discussion**: [Link TBD]

**Vote**: [Poll TBD]

**Email**: [Contact if needed]

**Deadline**: 2 weeks from RFC publication

---

## Conclusion

BAC4 v2.0 represents a strategic evolution from **C4 diagramming tool** → **Enterprise Architecture Platform**.

By adding 4 new layers (Market, Organisation, Capability, Code) and embracing Obsidian's native Canvas, we position BAC4 as:
- **More comprehensive** than C4-only tools
- **More accessible** than heavy enterprise tools (ArchiMate)
- **More integrated** than standalone solutions

**But we need your feedback** to ensure this is the right direction.

Please share your thoughts, vote in the poll, and help shape BAC4's future.

---

**Thank you for being part of the BAC4 community!** 🙏

**Prepared By**: David Oliver + Claude Code
**Date**: October 19, 2025
**RFC Version**: 1.0
