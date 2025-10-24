# Regression Testing Strategy - BAC4 Plugin

**Version:** 1.0.0
**Date:** 2025-10-24
**Purpose:** Prevent breaking existing functionality when implementing new features or fixes

---

## Executive Summary

This document outlines a comprehensive regression testing strategy to prevent features from breaking during development. The edge label editing issue highlighted the need for systematic testing before and after code changes.

---

## Problem Statement

**Recent Issue:** Edge label editing functionality stopped working (or appeared to stop working) after implementing snapshot color contamination fixes.

**Root Cause:**
- No automated regression tests for edge label editing
- Manual testing not performed before/after changes
- Code changes to `splitNodesAndEdges` could have inadvertently affected edge handling
- Data duplication in edge properties created confusion

**Impact:**
- User-reported bug
- Loss of confidence in plugin stability
- Time spent investigating and fixing

---

## Regression Testing Levels

### Level 1: Pre-Commit Checklist (Required)

Before committing ANY code changes, developers MUST:

1. **Run existing tests:**
   ```bash
   npm test
   npm run typecheck
   ```

2. **Run build:**
   ```bash
   npm run build
   ```

3. **Manual smoke test in Obsidian:**
   - Create a test diagram
   - Add 2 nodes, connect them
   - **Test node operations:**
     - ✅ Change node label
     - ✅ Change node color
     - ✅ Move node
     - ✅ Delete node
   - **Test edge operations:**
     - ✅ Change edge label
     - ✅ Change edge direction
     - ✅ Change edge style
     - ✅ Delete edge
   - **Test file operations:**
     - ✅ Save (wait 5 seconds for auto-save)
     - ✅ Close file
     - ✅ Reopen file
     - ✅ Verify all changes persisted

4. **Snapshot operations (if applicable):**
   - ✅ Create snapshot
   - ✅ Edit snapshot (change colors, add nodes)
   - ✅ Switch between snapshots
   - ✅ Close and reopen
   - ✅ Verify snapshot isolation

### Level 2: Automated Unit Tests

**Required Tests for Core Features:**

#### Test: Node Label Persistence
```typescript
describe('Node Label Persistence', () => {
  test('should save and load node labels correctly', () => {
    const nodes = [{ id: 'node-1', data: { label: 'Test Node' } }];
    const { nodeFile, graphFile } = splitNodesAndEdges(nodes, [], currentNodeFile, currentGraphFile);
    const loadedNodes = mergeNodesAndLayout(nodeFile, graphFile);
    expect(loadedNodes[0].data.label).toBe('Test Node');
  });
});
```

#### Test: Node Color Persistence
```typescript
describe('Node Color Persistence', () => {
  test('should save and load node colors correctly', () => {
    const nodes = [{ id: 'node-1', data: { label: 'Test', color: '#FF5733' } }];
    const { nodeFile, graphFile } = splitNodesAndEdges(nodes, [], currentNodeFile, currentGraphFile);
    const loadedNodes = mergeNodesAndLayout(nodeFile, graphFile);
    expect(loadedNodes[0].data.color).toBe('#FF5733');
  });
});
```

#### Test: Edge Label Persistence ⭐ NEW
```typescript
describe('Edge Label Persistence', () => {
  test('should save and load edge labels correctly', () => {
    const edges = [{
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      data: { label: 'uses', direction: 'right', style: 'curved' }
    }];
    const { nodeFile, graphFile } = splitNodesAndEdges([], edges, currentNodeFile, currentGraphFile);
    const loadedEdges = getEdgesFromGraph(graphFile);
    expect(loadedEdges[0].data.label).toBe('uses');
  });

  test('should preserve edge label after multiple save/load cycles', () => {
    const edges = [{
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      data: { label: 'initial label', direction: 'right', style: 'curved' }
    }];

    // First save/load
    const { nodeFile: nf1, graphFile: gf1 } = splitNodesAndEdges([], edges, currentNodeFile, currentGraphFile);
    const loaded1 = getEdgesFromGraph(gf1);

    // Update label
    loaded1[0].data.label = 'updated label';

    // Second save/load
    const { nodeFile: nf2, graphFile: gf2 } = splitNodesAndEdges([], loaded1, nf1, gf1);
    const loaded2 = getEdgesFromGraph(gf2);

    expect(loaded2[0].data.label).toBe('updated label');
  });
});
```

#### Test: Edge Direction Persistence ⭐ NEW
```typescript
describe('Edge Direction Persistence', () => {
  test('should save and load edge direction correctly', () => {
    const edges = [{
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      data: { label: 'uses', direction: 'both', style: 'curved' }
    }];
    const { nodeFile, graphFile } = splitNodesAndEdges([], edges, currentNodeFile, currentGraphFile);
    const loadedEdges = getEdgesFromGraph(graphFile);
    expect(loadedEdges[0].data.direction).toBe('both');
  });
});
```

#### Test: Node Position Persistence
```typescript
describe('Node Position Persistence', () => {
  test('should save and load node positions correctly', () => {
    const nodes = [{
      id: 'node-1',
      position: { x: 150, y: 200 },
      data: { label: 'Test' }
    }];
    const { nodeFile, graphFile } = splitNodesAndEdges(nodes, [], currentNodeFile, currentGraphFile);
    const loadedNodes = mergeNodesAndLayout(nodeFile, graphFile);
    expect(loadedNodes[0].position.x).toBe(150);
    expect(loadedNodes[0].position.y).toBe(200);
  });
});
```

#### Test: Snapshot Isolation ⭐ CRITICAL
```typescript
describe('Snapshot Isolation', () => {
  test('should not contaminate snapshots when changing colors', () => {
    // Create initial state
    const nodes = [{ id: 'node-1', data: { label: 'Test', color: '#00FF00' } }];
    const { nodeFile: nf1, graphFile: gf1 } = splitNodesAndEdges(nodes, [], emptyNodeFile, emptyGraphFile);

    // Create snapshot
    const gf2 = createSnapshot(gf1, 'Snapshot 1', '', null);

    // Load snapshot and change color
    const snapshotNodes = mergeNodesAndLayout(nf1, gf2, gf2.timeline.snapshots[1].id);
    snapshotNodes[0].data.color = '#FF0000';

    // Save snapshot
    const { nodeFile: nf3, graphFile: gf3 } = splitNodesAndEdges(snapshotNodes, [], nf1, gf2);

    // Load original snapshot
    const originalNodes = mergeNodesAndLayout(nf3, gf3, gf3.timeline.snapshots[0].id);

    // Verify isolation
    expect(snapshotNodes[0].data.color).toBe('#FF0000');
    expect(originalNodes[0].data.color).toBe('#00FF00');
  });
});
```

### Level 3: Integration Tests

**Required Integration Tests:**

#### Test: File Round-Trip
```typescript
describe('File Round-Trip Integration', () => {
  test('should preserve all data through save/load cycle', async () => {
    const vault = createMockVault();
    const nodes = [
      { id: 'node-1', data: { label: 'Node 1', color: '#FF0000' }, position: { x: 100, y: 100 } },
      { id: 'node-2', data: { label: 'Node 2', color: '#00FF00' }, position: { x: 200, y: 200 } }
    ];
    const edges = [
      { id: 'edge-1', source: 'node-1', target: 'node-2', data: { label: 'connects to', direction: 'right' } }
    ];

    // Save
    const { nodeFile, graphFile } = splitNodesAndEdges(nodes, edges, emptyNodeFile, emptyGraphFile);
    await writeDiagram(vault, 'test.bac4', nodeFile, graphFile);

    // Load
    const { nodeFile: loadedNF, graphFile: loadedGF } = await readDiagram(vault, 'test.bac4');
    const loadedNodes = mergeNodesAndLayout(loadedNF, loadedGF);
    const loadedEdges = getEdgesFromGraph(loadedGF);

    // Verify
    expect(loadedNodes).toHaveLength(2);
    expect(loadedEdges).toHaveLength(1);
    expect(loadedNodes[0].data.label).toBe('Node 1');
    expect(loadedNodes[0].data.color).toBe('#FF0000');
    expect(loadedEdges[0].data.label).toBe('connects to');
  });
});
```

### Level 4: Visual Regression Testing (Future)

**Proposed:** Use automated screenshot comparison to detect visual regressions

Tools:
- Percy.io
- Chromatic
- Playwright with screenshot comparison

Test scenarios:
- Node rendering (all types)
- Edge rendering (all directions and styles)
- Property panel layout
- Timeline panel layout
- Snapshot switching

---

## Test Coverage Requirements

### Critical Features (Must Test Before Every Commit)

1. **Node Operations:**
   - ✅ Create node
   - ✅ Update node label
   - ✅ Update node color
   - ✅ Move node
   - ✅ Delete node

2. **Edge Operations:**
   - ✅ Create edge
   - ✅ Update edge label ⭐
   - ✅ Update edge direction ⭐
   - ✅ Update edge style
   - ✅ Delete edge

3. **File Operations:**
   - ✅ Save diagram
   - ✅ Load diagram
   - ✅ Auto-save (300ms debounce)
   - ✅ Force save (before snapshot switch)

4. **Snapshot Operations:**
   - ✅ Create snapshot
   - ✅ Switch snapshot
   - ✅ Edit snapshot
   - ✅ Delete snapshot
   - ✅ Snapshot isolation (no contamination)

### Target Coverage Metrics

- **Unit Test Coverage:** 60% (current: 29.65%)
- **Integration Test Coverage:** 40%
- **Critical Path Coverage:** 100%

---

## Regression Test Automation

### CI/CD Pipeline

**Proposed GitHub Actions Workflow:**

```yaml
name: Regression Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Type checking
        run: npm run typecheck
      - name: Build
        run: npm run build
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### Pre-Commit Hooks

**Install husky for Git hooks:**

```bash
npm install --save-dev husky
npx husky install
```

**`.husky/pre-commit`:**
```bash
#!/bin/sh
npm test
npm run typecheck
npm run build
```

This ensures tests run BEFORE every commit.

---

## Change Impact Analysis

Before modifying ANY file, check this table:

| File Modified | Potential Impact | Required Tests |
|---------------|------------------|----------------|
| `file-io-service.ts` | **CRITICAL** - Affects all save/load | All persistence tests |
| `splitNodesAndEdges` | **CRITICAL** - Affects save format | All save/load tests |
| `mergeNodesAndLayout` | **CRITICAL** - Affects load format | All load tests |
| `getEdgesFromGraph` | **CRITICAL** - Affects edge loading | Edge persistence tests |
| `TimelineService.ts` | **HIGH** - Affects snapshots | Snapshot isolation tests |
| `useEdgeHandlers.ts` | **HIGH** - Affects edge editing | Edge update tests |
| `useNodeHandlers.ts` | **HIGH** - Affects node editing | Node update tests |
| `PropertyPanel.tsx` | **MEDIUM** - Affects UI only | Manual UI tests |
| `canvas-view.tsx` | **HIGH** - Affects entire editor | Full smoke test |

---

## Testing Checklist Template

**Copy this checklist for every PR/commit:**

```markdown
## Pre-Commit Testing Checklist

### Automated Tests
- [ ] `npm test` passes (all 348+ tests)
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run build` succeeds

### Manual Smoke Tests
- [ ] **Node Operations:**
  - [ ] Change node label → persists after reload
  - [ ] Change node color → persists after reload
  - [ ] Move node → persists after reload
- [ ] **Edge Operations:**
  - [ ] Change edge label → persists after reload
  - [ ] Change edge direction → persists after reload
  - [ ] Change edge style → persists after reload
- [ ] **Snapshot Operations:**
  - [ ] Create snapshot → auto-switches to new snapshot
  - [ ] Edit snapshot → changes isolated from other snapshots
  - [ ] Switch snapshots → force save prevents data loss
  - [ ] Close/reopen → last viewed snapshot loads

### Files Changed
- [ ] Ran impact analysis for each modified file
- [ ] Ran appropriate regression tests for affected areas

### Documentation
- [ ] Updated CHANGELOG.md
- [ ] Updated relevant documentation
- [ ] Added tests for new features

### Sign-Off
- [ ] I have tested all affected functionality
- [ ] No regressions detected
- [ ] Ready to commit
```

---

## What Went Wrong (Edge Label Issue)

### Timeline of Events

1. **Issue:** User reported edge labels not persisting
2. **Investigation:** Code review found:
   - Data duplication (`direction` in both properties and style)
   - Object spread ordering issues
   - No automated tests for edge label persistence
3. **Root Cause:** Likely combination of:
   - User closing file before auto-save (300ms delay)
   - Confusion from UI (wrong edge selected?)
   - OR actual bug from data duplication

### Lessons Learned

1. ✅ **Always add tests for user-facing features**
2. ✅ **Test before and after code changes**
3. ✅ **Use pre-commit hooks to enforce testing**
4. ✅ **Avoid data duplication in file format**
5. ✅ **Be explicit about object spread order**
6. ✅ **Add logging for debugging user issues**

---

## Recommended Actions

### Immediate (This Session)

1. ✅ Fix edge data handling (completed)
2. ✅ Add edge label persistence tests
3. ✅ Create regression testing strategy (this document)
4. 📝 Update CHANGELOG with fix

### Short-Term (Next Session)

1. Implement pre-commit hooks
2. Increase test coverage to 60%
3. Add integration tests for file round-trip
4. Set up CI/CD pipeline with automated tests

### Long-Term (Future Releases)

1. Visual regression testing with Percy/Chromatic
2. End-to-end tests with Playwright
3. Performance regression tests
4. Accessibility regression tests

---

## Summary

**Key Principle:** **No code changes without tests.**

Every feature must have:
1. Unit tests (logic)
2. Integration tests (file I/O)
3. Manual smoke test (UI)
4. Regression test (ensure no breaking changes)

This strategy ensures we never break existing functionality when adding new features or fixing bugs.

---

**Version History:**
- v1.0.0 (2025-10-24): Initial version created after edge label issue
