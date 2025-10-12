# BAC4 Plugin - Comprehensive Refactoring Plan

**Version:** 1.0
**Date:** 2025-10-11
**Status:** Planning Phase

## Executive Summary

This document outlines a comprehensive refactoring plan for the BAC4 Plugin codebase to maximize clarity, maintainability, and ease of future extension by AI agents or developers. The refactoring is organized into phases with clear priorities, estimates, and success criteria.

**Current State:**
- **Total LOC:** ~5,400 lines across 30+ TypeScript files
- **Largest Files:** canvas-view.tsx (1,243 lines), PropertyPanel.tsx (1,002 lines)
- **Key Issues:** Large monolithic components, inline styles, magic numbers, limited documentation
- **Code Quality:** Functional but needs structure for long-term maintainability

**Refactoring Goals:**
1. Reduce complexity of large files (target: <500 lines per file)
2. Extract reusable utilities and constants
3. Add comprehensive documentation
4. Standardize patterns and error handling
5. Mark extension points for AI/developer modifications

---

## Phase 1: Foundation (Priority: HIGH)

**Goal:** Establish baseline standards and extract low-hanging fruit
**Estimated Effort:** 8-12 hours
**Impact:** High - Sets foundation for all future work

### 1.1 Constants Extraction

**Files to Create:**
```
src/constants/
├── ui-constants.ts          # UI dimensions, colors, spacing
├── export-constants.ts      # Export settings (pixelRatio, quality)
├── timing-constants.ts      # Debounce times, delays
└── validation-constants.ts  # Limits, constraints
```

**Inline Values to Extract:**

| Current Location | Value | Proposed Constant |
|------------------|-------|-------------------|
| Multiple files | `'var(--background-primary)'` | `UI_COLORS.backgroundPrimary` |
| Multiple files | `'11px'`, `'13px'` | `FONT_SIZES.small`, `FONT_SIZES.normal` |
| canvas-view.tsx:167 | `1000` (debounce) | `TIMING.autoSaveDebounce` |
| UnifiedToolbar.tsx:98 | `pixelRatio: 2` | `EXPORT.defaultPixelRatio` |
| PropertyPanel.tsx | `'6px 8px'` padding | `SPACING.inputPadding` |

**Action Items:**
- [ ] Create constants directory structure
- [ ] Extract all magic numbers (>20 occurrences)
- [ ] Extract all CSS variable references
- [ ] Replace inline values throughout codebase
- [ ] Document each constant with JSDoc

**Files Affected:** All UI components, canvas-view.tsx, UnifiedToolbar.tsx, PropertyPanel.tsx

---

### 1.2 JSDoc Documentation

**Standard Template:**
```typescript
/**
 * Brief one-line description of function/component
 *
 * Detailed description of what this does and why it exists.
 * Include any important context or architectural decisions.
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 *
 * @example
 * ```typescript
 * const result = functionName(arg1, arg2);
 * ```
 *
 * @remarks
 * - Any important notes
 * - Edge cases to be aware of
 *
 * <AI_MODIFIABLE>
 * Extension point: Describe how to extend this
 * </AI_MODIFIABLE>
 */
```

**Priority Targets:**

1. **Services** (Highest priority)
   - `diagram-navigation-service.ts` - All public methods
   - `component-library-service.ts` - All public methods

2. **Core Components**
   - `canvas-view.tsx` - CanvasEditor component, major handlers
   - `PropertyPanel.tsx` - PropertyPanel component, handlers
   - `UnifiedToolbar.tsx` - UnifiedToolbar component, handlers

3. **Utilities**
   - `frontmatter-parser.ts` - All exported functions
   - `file-io.ts` - All exported functions

**Action Items:**
- [ ] Add JSDoc to all exported functions (60+ functions)
- [ ] Add JSDoc to all React components (25+ components)
- [ ] Add JSDoc to all interfaces/types (30+ types)
- [ ] Add `@example` for complex functions
- [ ] Add `<AI_MODIFIABLE>` markers at extension points

**Estimated Time:** 6-8 hours

---

### 1.3 Type Safety Improvements

**Current Issues:**
- Some `any` types in canvas-view.tsx (reactFlowInstance, event handlers)
- Missing interfaces for complex data structures
- Inconsistent type imports

**Action Items:**
- [ ] Create `src/types/canvas-types.ts` for canvas-specific types
- [ ] Create `src/types/component-props.ts` for all component prop interfaces
- [ ] Replace all `any` types with proper types
- [ ] Export types from centralized locations
- [ ] Add strict null checks where missing

**Files Affected:**
- canvas-view.tsx (10+ `any` types)
- PropertyPanel.tsx
- All node components

---

## Phase 2: Structural Refactoring (Priority: HIGH)

**Goal:** Break down monolithic files into manageable modules
**Estimated Effort:** 12-16 hours
**Impact:** High - Major improvement to maintainability

### 2.1 Canvas View Decomposition

**Current:** canvas-view.tsx (1,243 lines)
**Target:** Main file <300 lines, logic split across modules

**New Structure:**
```
src/ui/canvas/
├── canvas-view.tsx              # Main component (250 lines)
├── hooks/
│   ├── useCanvasState.ts        # State management
│   ├── useNodeHandlers.ts       # Node event handlers
│   ├── useEdgeHandlers.ts       # Edge event handlers
│   ├── useDiagramActions.ts     # Rename, delete, type change
│   └── useFileOperations.ts     # Load/save operations
├── utils/
│   ├── canvas-utils.ts          # Helper functions
│   ├── node-factory.ts          # Node creation logic
│   └── auto-naming.ts           # Auto-naming logic
└── types/
    └── canvas-types.ts          # Canvas-specific types
```

**Functions to Extract:**

| Current Function | New Location | Reason |
|------------------|--------------|--------|
| `updateNodeLabel` | `hooks/useNodeHandlers.ts` | Node-specific logic |
| `handleCreateOrOpenChildDiagram` | `hooks/useNodeHandlers.ts` | Complex 70-line function |
| `getAutoName` | `utils/auto-naming.ts` | Utility function |
| `generateNodeId` | `utils/node-factory.ts` | Utility function |
| `addNodeGeneric` | `utils/node-factory.ts` | Node creation |
| Auto-save effect | `hooks/useFileOperations.ts` | File I/O logic |

**Action Items:**
- [ ] Create hooks directory and files
- [ ] Extract state management to custom hooks
- [ ] Move node handlers to dedicated hook
- [ ] Move edge handlers to dedicated hook
- [ ] Extract auto-save logic
- [ ] Create utility modules
- [ ] Update canvas-view.tsx to use hooks
- [ ] Add tests for extracted utilities

**Estimated Time:** 8-10 hours

---

### 2.2 Property Panel Decomposition

**Current:** PropertyPanel.tsx (1,002 lines)
**Target:** Main file <300 lines, UI sections split into sub-components

**New Structure:**
```
src/ui/components/property-panel/
├── PropertyPanel.tsx            # Main container (200 lines)
├── sections/
│   ├── NodeLabelSection.tsx     # Label input
│   ├── NodeColorSection.tsx     # Color picker + presets
│   ├── EdgePropertiesSection.tsx # Edge label + direction
│   ├── C4NodeSection.tsx        # C4-specific properties
│   ├── CloudNodeSection.tsx     # Cloud component properties
│   ├── SystemNodeSection.tsx    # System node + linking
│   ├── PersonNodeSection.tsx    # Person node properties
│   └── ContainerNodeSection.tsx # Container node + linking
├── components/
│   ├── LinkedDiagramDropdown.tsx # Reusable linking dropdown
│   ├── ColorPicker.tsx          # Color picker component
│   └── PropertyInput.tsx        # Styled input component
└── hooks/
    └── useDiagramLinking.ts     # Diagram linking logic
```

**Benefits:**
- Each section <100 lines, easy to understand
- Reusable `LinkedDiagramDropdown` for both System and Container nodes
- Testable in isolation
- Clear separation of concerns

**Action Items:**
- [ ] Create property-panel directory structure
- [ ] Extract each node type section
- [ ] Create reusable LinkedDiagramDropdown component
- [ ] Extract color picker logic
- [ ] Extract diagram linking hook
- [ ] Update main PropertyPanel to compose sections
- [ ] Add prop-types and documentation

**Estimated Time:** 6-8 hours

---

### 2.3 Unified Toolbar Decomposition

**Current:** UnifiedToolbar.tsx (489 lines)
**Target:** Main file <200 lines, export logic separated

**New Structure:**
```
src/ui/components/toolbar/
├── UnifiedToolbar.tsx           # Main toolbar (150 lines)
├── components/
│   ├── DiagramTypeSelector.tsx  # Type dropdown
│   ├── NodeCreationButtons.tsx  # Node buttons
│   ├── BreadcrumbNav.tsx        # Breadcrumbs (or reuse existing)
│   ├── ExportMenu.tsx           # Export dropdown
│   ├── DiagramActions.tsx       # Rename, Delete buttons
│   └── ToolbarButton.tsx        # Reusable button component
└── hooks/
    └── useExport.ts             # Export logic
```

**Action Items:**
- [ ] Extract export logic to custom hook
- [ ] Create sub-components for toolbar sections
- [ ] Create reusable ToolbarButton component
- [ ] Reduce duplication in button styles
- [ ] Update main toolbar to compose components

**Estimated Time:** 4-6 hours

---

## Phase 3: Pattern Standardization (Priority: MEDIUM)

**Goal:** Establish consistent patterns across codebase
**Estimated Effort:** 8-10 hours
**Impact:** Medium - Improves consistency and predictability

### 3.1 Error Handling Standardization

**Current Issues:**
- Mix of `alert()`, `console.error()`, and silent failures
- No centralized error handling
- Inconsistent user feedback

**Proposed Pattern:**
```typescript
// src/utils/error-handling.ts

export class DiagramError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'DiagramError';
  }
}

export const ErrorHandler = {
  handleError(error: Error | DiagramError, userMessage?: string): void {
    console.error('BAC4 Error:', error);

    if (userMessage) {
      // Use Obsidian Notice instead of alert
      new Notice(userMessage);
    }
  },

  handleAsync<T>(
    promise: Promise<T>,
    errorMessage: string
  ): Promise<T | null> {
    return promise.catch((error) => {
      this.handleError(error, errorMessage);
      return null;
    });
  }
};
```

**Action Items:**
- [ ] Create error handling utility
- [ ] Replace all `alert()` with `Notice`
- [ ] Wrap async operations with error handler
- [ ] Add error boundaries for React components
- [ ] Document error handling patterns

**Estimated Time:** 3-4 hours

---

### 3.2 Style Standardization

**Current Issues:**
- Inline styles throughout (1000+ occurrences)
- Repeated style objects
- Inconsistent styling patterns

**Options:**

**Option A: CSS Modules** (Recommended for new components)
```typescript
// component.module.css
.button {
  padding: var(--spacing-input);
  background: var(--color-bg-primary);
}

// component.tsx
import styles from './component.module.css';
<button className={styles.button}>
```

**Option B: Styled Objects** (For existing components)
```typescript
// src/styles/component-styles.ts
export const buttonStyles = {
  base: {
    padding: SPACING.inputPadding,
    background: UI_COLORS.backgroundPrimary,
    // ...
  },
  hover: {
    background: UI_COLORS.backgroundHover,
  }
};
```

**Action Items:**
- [ ] Create style utilities/constants
- [ ] Extract common style objects
- [ ] Create reusable styled components
- [ ] Document styling approach
- [ ] Gradually migrate inline styles

**Estimated Time:** 4-6 hours (initial), ongoing

---

### 3.3 Event Handler Patterns

**Current Issues:**
- Mix of inline handlers and callbacks
- Inconsistent naming (`handle*`, `on*`)
- Some handlers very long (70+ lines)

**Proposed Standards:**
```typescript
// Pattern 1: Simple handlers (inline)
onClick={() => doSomething()}

// Pattern 2: Component handlers (prefixed with 'handle')
const handleNodeClick = useCallback((event, node) => {
  // Handler logic
}, [dependencies]);

// Pattern 3: Prop handlers (prefixed with 'on')
interface Props {
  onNodeClick: (node: Node) => void;
  onEdgeClick: (edge: Edge) => void;
}

// Pattern 4: Complex handlers (extract to custom hook)
const { handleCreateChild, handleLinkDiagram } = useDiagramActions();
```

**Action Items:**
- [ ] Standardize handler naming
- [ ] Extract long handlers to hooks
- [ ] Document handler patterns
- [ ] Add type safety to all handlers

**Estimated Time:** 2-3 hours

---

## Phase 4: Advanced Improvements (Priority: MEDIUM)

**Goal:** Add advanced features for maintainability
**Estimated Effort:** 10-12 hours
**Impact:** Medium - Quality of life improvements

### 4.1 Testing Infrastructure

**Current State:** No tests
**Target:** Core logic covered with unit tests

**Test Structure:**
```
src/__tests__/
├── unit/
│   ├── services/
│   │   ├── diagram-navigation-service.test.ts
│   │   └── component-library-service.test.ts
│   ├── utils/
│   │   ├── auto-naming.test.ts
│   │   ├── frontmatter-parser.test.ts
│   │   └── error-handling.test.ts
│   └── hooks/
│       ├── useNodeHandlers.test.ts
│       └── useFileOperations.test.ts
├── integration/
│   ├── canvas-view.test.tsx
│   └── property-panel.test.tsx
└── setup.ts
```

**Priority Tests:**
1. **Services** (Critical path)
   - DiagramNavigationService methods
   - ComponentLibraryService loading

2. **Utilities** (Pure functions, easy to test)
   - Auto-naming logic
   - Frontmatter parsing
   - Error handling

3. **Custom Hooks** (Business logic)
   - Node handlers
   - File operations

**Action Items:**
- [ ] Set up Jest/Vitest configuration
- [ ] Add testing utilities for React components
- [ ] Write tests for services (>80% coverage)
- [ ] Write tests for utilities (>90% coverage)
- [ ] Add CI/CD test runner
- [ ] Document testing approach

**Estimated Time:** 8-10 hours

---

### 4.2 Performance Optimization

**Potential Improvements:**

1. **Memoization**
   - Memoize expensive computations in canvas-view
   - Use `React.memo` for pure components
   - Optimize re-renders with `useMemo`/`useCallback`

2. **Lazy Loading**
   - Code-split large components
   - Lazy load cloud component library
   - Defer non-critical initialization

3. **Debouncing**
   - Already has auto-save debounce (1s)
   - Add debounce to search/filter operations

**Action Items:**
- [ ] Profile render performance
- [ ] Identify re-render hotspots
- [ ] Add React.memo to pure components
- [ ] Add lazy loading for heavy components
- [ ] Document performance considerations

**Estimated Time:** 2-3 hours

---

### 4.3 Accessibility (a11y)

**Current Issues:**
- Some buttons lack proper labels
- Keyboard navigation could be improved
- Color contrast may not meet WCAG standards

**Action Items:**
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Test color contrast ratios
- [ ] Add focus indicators
- [ ] Test with screen readers

**Estimated Time:** 3-4 hours

---

## Phase 5: Documentation & Developer Experience (Priority: LOW)

**Goal:** Make codebase easy to understand and extend
**Estimated Effort:** 6-8 hours
**Impact:** Low immediate impact, high long-term value

### 5.1 Code Examples & Patterns

**Create:**
```
docs/development/
├── adding-node-types.md         # Step-by-step guide
├── adding-diagram-types.md      # Extending C4 model
├── adding-cloud-providers.md    # Azure, GCP support
├── styling-guide.md             # Style conventions
├── testing-guide.md             # Writing tests
└── architecture.md              # System architecture
```

**Action Items:**
- [ ] Document common development tasks
- [ ] Create code examples for extensions
- [ ] Add architectural decision records (ADRs)
- [ ] Create contribution guide

**Estimated Time:** 4-5 hours

---

### 5.2 AI Extension Markers

**Add `<AI_MODIFIABLE>` tags to:**

1. **src/ui/components/UnifiedToolbar.tsx**
```typescript
/**
 * Get tools for current diagram type
 *
 * <AI_MODIFIABLE>
 * To add new node types:
 * 1. Add case for new diagram type
 * 2. Return array of tool definitions with type, label, and default data
 * 3. Ensure node type is registered in canvas-view.tsx nodeTypes
 * </AI_MODIFIABLE>
 */
const getTools = () => { /* ... */ };
```

2. **src/services/diagram-navigation-service.ts**
```typescript
/**
 * <AI_MODIFIABLE>
 * To add deeper nesting levels:
 * 1. Add new diagram type to type union
 * 2. Update createChildDiagram to handle new parent→child relationships
 * 3. Update canHaveChildren logic in PropertyPanel
 * </AI_MODIFIABLE>
 */
```

3. **src/ui/canvas-view.tsx**
```typescript
/**
 * Custom node types mapping
 *
 * <AI_MODIFIABLE>
 * To register a new node type:
 * 1. Import the node component
 * 2. Add to this nodeTypes object with a unique key
 * 3. Use the key when creating nodes
 * </AI_MODIFIABLE>
 */
const nodeTypes: NodeTypes = { /* ... */ };
```

**Action Items:**
- [ ] Identify all extension points (20+ locations)
- [ ] Add markers with clear instructions
- [ ] Document marker convention
- [ ] Create index of all extension points

**Estimated Time:** 2-3 hours

---

## Phase 6: Technical Debt Resolution (Priority: LOW)

**Goal:** Clean up legacy code and improve architecture
**Estimated Effort:** 6-8 hours
**Impact:** Low - Nice to have improvements

### 6.1 Remove Dead Code

**Identified:**
- `DiagramToolbar.tsx` - Appears unused (202 lines)
- `Breadcrumbs.tsx` - May be unused (142 lines, check if replaced by UnifiedToolbar)
- `DiagramTypeSwitcher.tsx` - May be unused (86 lines)

**Action Items:**
- [ ] Verify unused files
- [ ] Remove confirmed dead code
- [ ] Update imports

**Estimated Time:** 1-2 hours

---

### 6.2 Dependency Updates

**Current Dependencies:**
- Review package.json for outdated packages
- Update React Flow to latest version
- Update TypeScript to 5.x

**Action Items:**
- [ ] Audit dependencies
- [ ] Update to latest stable versions
- [ ] Test after updates
- [ ] Document breaking changes

**Estimated Time:** 2-3 hours

---

### 6.3 Configuration Consolidation

**Create:**
```
src/config/
├── app-config.ts                # Application configuration
├── diagram-config.ts            # Diagram defaults
└── export-config.ts             # Export settings
```

**Action Items:**
- [ ] Centralize all configuration
- [ ] Make configuration environment-aware
- [ ] Document all config options

**Estimated Time:** 2-3 hours

---

## Implementation Roadmap

### Sprint 1: Foundation (2-3 days)
- [ ] Constants extraction
- [ ] JSDoc documentation for services
- [ ] Type safety improvements

**Deliverables:**
- Constants modules created
- All service methods documented
- Zero `any` types in services

---

### Sprint 2: Canvas Refactoring (3-4 days)
- [ ] Canvas view decomposition
- [ ] Extract hooks
- [ ] Create utility modules

**Deliverables:**
- canvas-view.tsx reduced to <300 lines
- 5+ custom hooks created
- Utilities testable in isolation

---

### Sprint 3: Property Panel Refactoring (2-3 days)
- [ ] Property panel decomposition
- [ ] Extract sections
- [ ] Create reusable components

**Deliverables:**
- PropertyPanel.tsx reduced to <300 lines
- 8+ section components created
- LinkedDiagramDropdown reusable

---

### Sprint 4: Standardization (2-3 days)
- [ ] Error handling
- [ ] Style standardization
- [ ] Event handler patterns

**Deliverables:**
- ErrorHandler utility created
- Style constants established
- Handler patterns documented

---

### Sprint 5: Testing & Polish (3-4 days)
- [ ] Test infrastructure
- [ ] Unit tests for services
- [ ] Integration tests for components
- [ ] Documentation updates

**Deliverables:**
- >70% test coverage for services
- >50% coverage for utilities
- All extension points marked

---

## Success Metrics

### Code Quality Metrics
- **File Size:** No files >500 lines (current: 2 files >1000 lines)
- **Function Size:** No functions >50 lines (current: several 70+ line functions)
- **Documentation:** 100% of exported functions have JSDoc
- **Type Safety:** Zero `any` types in production code
- **Test Coverage:** >70% for services, >50% overall

### Developer Experience Metrics
- **Time to Add Node Type:** <30 minutes (with guide)
- **Time to Add Diagram Type:** <2 hours (with guide)
- **Time to Understand Component:** <15 minutes (with docs)
- **Build Time:** <5 seconds (current: ~30ms)

### Maintainability Metrics
- **Cyclomatic Complexity:** <10 per function
- **Duplicate Code:** <3% (use code analysis tools)
- **Dead Code:** 0% (all code reachable)

---

## Risk Assessment

### High Risk
- **Breaking Changes:** Refactoring may introduce bugs
  - *Mitigation:* Add tests before refactoring, test after each phase

### Medium Risk
- **Scope Creep:** Refactoring reveals more issues
  - *Mitigation:* Stick to plan, document additional issues for future

### Low Risk
- **Performance Regression:** New abstractions may slow down
  - *Mitigation:* Profile before/after, optimize if needed

---

## Maintenance Plan

### After Refactoring
1. **Code Reviews:** All PRs require review for pattern adherence
2. **Linting:** ESLint rules enforce standards
3. **Documentation:** Update docs with code changes
4. **Testing:** Maintain test coverage >70%
5. **Periodic Audits:** Review codebase quarterly

---

## Appendix A: File-by-File Analysis

### High Priority Files

#### canvas-view.tsx (1,243 lines)
- **Issues:** Monolithic, many responsibilities, long functions
- **Priority:** HIGH
- **Effort:** 8-10 hours
- **Strategy:** Extract hooks and utilities, split into modules

#### PropertyPanel.tsx (1,002 lines)
- **Issues:** Many node types in one file, repeated patterns
- **Priority:** HIGH
- **Effort:** 6-8 hours
- **Strategy:** Extract sections, create reusable components

#### diagram-navigation-service.ts (616 lines)
- **Issues:** Good structure, needs documentation
- **Priority:** MEDIUM
- **Effort:** 2-3 hours
- **Strategy:** Add JSDoc, extract constants

#### UnifiedToolbar.tsx (489 lines)
- **Issues:** Export logic embedded, some duplication
- **Priority:** MEDIUM
- **Effort:** 4-6 hours
- **Strategy:** Extract export hook, create sub-components

### Medium Priority Files

#### main.ts (308 lines)
- **Issues:** Good structure, some TODOs
- **Priority:** LOW
- **Effort:** 1-2 hours
- **Strategy:** Add documentation, clean up TODOs

#### ComponentPalette.tsx (249 lines)
- **Issues:** Good structure, minor improvements
- **Priority:** LOW
- **Effort:** 1 hour
- **Strategy:** Add documentation

#### frontmatter-parser.ts (205 lines)
- **Issues:** Good structure, needs tests
- **Priority:** MEDIUM
- **Effort:** 2-3 hours
- **Strategy:** Add tests, document edge cases

### Low Priority Files

All node components (87-143 lines each)
- **Issues:** Well-structured, minor documentation needed
- **Priority:** LOW
- **Effort:** 2-3 hours total
- **Strategy:** Add JSDoc, standardize patterns

---

## Appendix B: Extension Points Catalog

### For AI/Developer Modification

1. **Add Node Type**
   - File: `src/ui/components/UnifiedToolbar.tsx:getTools()`
   - File: `src/ui/canvas-view.tsx:nodeTypes`
   - File: Create new `src/ui/nodes/YourNode.tsx`

2. **Add Diagram Type**
   - File: `src/types/diagram-relationships.ts` (add to type union)
   - File: `src/services/diagram-navigation-service.ts:createChildDiagram()`
   - File: `src/ui/components/UnifiedToolbar.tsx:getTools()`

3. **Add Cloud Provider**
   - Directory: `component-library/azure/` or `component-library/gcp/`
   - File: `src/services/component-library-service.ts:initialize()`

4. **Add Export Format**
   - File: `src/ui/components/UnifiedToolbar.tsx:handleExport()`
   - Import appropriate library (e.g., `html-to-pdf`)

5. **Customize Node Appearance**
   - File: `src/ui/nodes/[NodeType].tsx`
   - Modify styles in node component

6. **Add Property Panel Section**
   - File: `src/ui/components/PropertyPanel.tsx`
   - Add conditional section based on node type

---

## Appendix C: Tools & Automation

### Recommended Tools

1. **Code Analysis**
   - ESLint with TypeScript plugin
   - Prettier for formatting
   - SonarQube for complexity analysis

2. **Testing**
   - Jest for unit tests
   - React Testing Library for components
   - Playwright for E2E tests (future)

3. **Documentation**
   - TypeDoc for API documentation
   - Docusaurus for developer guides
   - Mermaid for diagrams

4. **CI/CD**
   - GitHub Actions for automated testing
   - Husky for pre-commit hooks
   - Dependabot for dependency updates

### Scripts to Add

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "analyze": "source-map-explorer dist/main.js",
    "docs": "typedoc --out docs/api src"
  }
}
```

---

## Conclusion

This refactoring plan provides a comprehensive roadmap for improving the BAC4 Plugin codebase. By following these phases incrementally, the codebase will become:

- **More Maintainable:** Smaller files, clear patterns, comprehensive docs
- **More Testable:** Extracted logic, pure functions, good test coverage
- **More Extensible:** Marked extension points, documented patterns
- **More Consistent:** Standardized error handling, styling, naming
- **AI-Friendly:** Clear structure, documented intent, marked modification points

**Total Estimated Effort:** 60-80 hours (spread across 5 sprints)

**Recommended Approach:** Execute sprints 1-3 first (foundation + major refactoring), then evaluate priorities for sprints 4-5 based on team needs.

---

**Document Version History:**
- v1.0 (2025-10-11): Initial comprehensive refactoring plan created
