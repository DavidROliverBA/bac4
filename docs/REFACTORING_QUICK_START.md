# BAC4 Plugin - Refactoring Quick Start Guide

**For developers/AI agents ready to start refactoring immediately**

## TL;DR

The BAC4 Plugin codebase is functional but needs refactoring for long-term maintainability. This guide provides the fastest path to improve code quality.

**Most Important Files:**
1. `canvas-view.tsx` (1,243 lines) - **Needs splitting**
2. `PropertyPanel.tsx` (1,002 lines) - **Needs splitting**
3. `diagram-navigation-service.ts` (616 lines) - **Needs documentation**

---

## Quick Wins (Start Here)

### 1. Extract Constants (2 hours)

Create `src/constants/ui-constants.ts`:
```typescript
export const FONT_SIZES = {
  tiny: '9px',
  small: '11px',
  normal: '13px',
  medium: '14px',
} as const;

export const SPACING = {
  inputPadding: '6px 8px',
  buttonPadding: '4px 8px',
  gap: {
    small: '4px',
    medium: '6px',
    large: '8px',
  },
} as const;

export const UI_COLORS = {
  backgroundPrimary: 'var(--background-primary)',
  backgroundSecondary: 'var(--background-secondary)',
  textNormal: 'var(--text-normal)',
  textMuted: 'var(--text-muted)',
  interactiveNormal: 'var(--interactive-normal)',
  interactiveHover: 'var(--interactive-hover)',
  interactiveAccent: 'var(--interactive-accent)',
} as const;
```

**Find/Replace in all files:**
- `'11px'` → `FONT_SIZES.small`
- `'13px'` → `FONT_SIZES.normal`
- `'6px 8px'` → `SPACING.inputPadding`
- `'var(--background-primary)'` → `UI_COLORS.backgroundPrimary`

---

### 2. Add JSDoc to Services (3 hours)

**Template:**
```typescript
/**
 * Creates a child diagram and links it to a parent node
 *
 * This is the core method for hierarchical navigation. It handles:
 * - Creating the child diagram file
 * - Registering it in diagram-relationships.json
 * - Creating the parent→child relationship
 *
 * @param parentPath - Path to parent diagram file (e.g., "Context.bac4")
 * @param parentNodeId - ID of node in parent diagram (e.g., "node-1")
 * @param parentNodeLabel - Display name of parent node (e.g., "Payment System")
 * @param parentDiagramType - Type of parent diagram
 * @param childDiagramType - Type of child diagram to create
 * @returns Path to created child diagram
 *
 * @example
 * ```typescript
 * const childPath = await createChildDiagram(
 *   'Context.bac4',
 *   'node-1',
 *   'Payment System',
 *   'context',
 *   'container'
 * );
 * // Returns: 'Payment_System.bac4'
 * ```
 *
 * <AI_MODIFIABLE>
 * To add deeper nesting (e.g., component→detail):
 * 1. Add new type to diagram type union
 * 2. Update childDiagramType parameter
 * 3. Update relationship logic
 * </AI_MODIFIABLE>
 */
async createChildDiagram(
  parentPath: string,
  parentNodeId: string,
  parentNodeLabel: string,
  parentDiagramType: 'context' | 'container',
  childDiagramType: 'container' | 'component',
  suggestedFileName?: string
): Promise<string> {
  // ... implementation
}
```

**Files to Document:**
1. `src/services/diagram-navigation-service.ts` - All 15 public methods
2. `src/services/component-library-service.ts` - All public methods
3. `src/utils/frontmatter-parser.ts` - All exported functions

---

### 3. Split Canvas View (6 hours)

**Step 1:** Create hook for node operations
```typescript
// src/ui/canvas/hooks/useNodeHandlers.ts

/**
 * Custom hook for node-related event handlers
 */
export function useNodeHandlers(
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  filePath: string,
  navigationService: DiagramNavigationService
) {
  const updateNodeLabel = useCallback(async (nodeId: string, newLabel: string) => {
    // Move logic from canvas-view.tsx here
  }, [nodes, setNodes, filePath, navigationService]);

  const handleCreateOrOpenChildDiagram = useCallback(async (node: Node) => {
    // Move logic from canvas-view.tsx here
  }, [filePath, navigationService]);

  return {
    updateNodeLabel,
    handleCreateOrOpenChildDiagram,
  };
}
```

**Step 2:** Use hook in canvas-view.tsx
```typescript
// src/ui/canvas-view.tsx

const CanvasEditor: React.FC<CanvasEditorProps> = ({ plugin, filePath }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeData>([]);

  // Extract to hook
  const { updateNodeLabel, handleCreateOrOpenChildDiagram } = useNodeHandlers(
    nodes,
    setNodes,
    filePath,
    navigationService
  );

  // Rest of component...
};
```

**Hooks to Create:**
- `useNodeHandlers.ts` - Node operations (updateNodeLabel, handleCreateOrOpenChildDiagram)
- `useEdgeHandlers.ts` - Edge operations (updateEdgeLabel, updateEdgeDirection)
- `useFileOperations.ts` - File I/O (auto-save effect, load diagram)
- `useDiagramActions.ts` - Diagram operations (rename, delete, type change)

---

## Priority Refactoring Order

### Week 1: Foundation
**Goal:** Make code easier to work with

**Day 1-2:** Constants extraction
- Create constants files
- Replace magic numbers
- Replace CSS variable strings

**Day 3-4:** JSDoc documentation
- Document all service methods
- Document utility functions
- Add `<AI_MODIFIABLE>` markers

**Day 5:** Type safety
- Remove all `any` types
- Create missing interfaces
- Add strict null checks

### Week 2: Canvas View
**Goal:** Break down 1,243-line file

**Day 1-2:** Extract hooks
- Create hooks directory
- Move node handlers
- Move edge handlers
- Move file operations

**Day 3-4:** Extract utilities
- Create utils directory
- Move auto-naming logic
- Move node factory
- Move helper functions

**Day 5:** Testing
- Add tests for hooks
- Add tests for utilities
- Verify functionality

### Week 3: Property Panel
**Goal:** Break down 1,002-line file

**Day 1-2:** Extract sections
- Create sections directory
- One file per node type
- Extract edge properties

**Day 3:** Create reusable components
- LinkedDiagramDropdown
- ColorPicker
- PropertyInput

**Day 4-5:** Testing
- Test each section
- Test linking logic
- Verify functionality

---

## Refactoring Checklist

Before starting any refactoring:
- [ ] Create git branch: `refactor/[feature-name]`
- [ ] Run existing build: `npm run build`
- [ ] Note any warnings/errors

During refactoring:
- [ ] Extract one piece at a time
- [ ] Test after each extraction
- [ ] Keep build passing
- [ ] Add JSDoc as you go

After refactoring:
- [ ] Build succeeds: `npm run build`
- [ ] No new TypeScript errors
- [ ] Test in Obsidian
- [ ] Document changes
- [ ] Commit with descriptive message

---

## Common Patterns to Extract

### Pattern 1: Inline Styles
**Before:**
```typescript
style={{
  padding: '6px 8px',
  background: 'var(--background-primary)',
  fontSize: '11px',
}}
```

**After:**
```typescript
import { SPACING, UI_COLORS, FONT_SIZES } from '@/constants/ui-constants';

style={{
  padding: SPACING.inputPadding,
  background: UI_COLORS.backgroundPrimary,
  fontSize: FONT_SIZES.small,
}}
```

### Pattern 2: Long Functions
**Before:**
```typescript
const handleSomething = () => {
  // 70+ lines of code
};
```

**After:**
```typescript
// Extract to custom hook
const { handleSomething } = useSomethingHandler();

// Or extract to utility
import { handleSomething } from '@/utils/something-utils';
```

### Pattern 3: Repeated Logic
**Before:**
```typescript
// In component A
const getExportElement = () => {
  const viewport = document.querySelector('.react-flow__viewport');
  return viewport || document.querySelector('.react-flow');
};

// In component B
const getExportElement = () => {
  const viewport = document.querySelector('.react-flow__viewport');
  return viewport || document.querySelector('.react-flow');
};
```

**After:**
```typescript
// In utils/canvas-utils.ts
export function getCanvasViewport(): HTMLElement | null {
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  return viewport || document.querySelector('.react-flow') as HTMLElement;
}

// In both components
import { getCanvasViewport } from '@/utils/canvas-utils';
const element = getCanvasViewport();
```

---

## Extension Point Markers

Add these comments at key extension points:

```typescript
/**
 * <AI_MODIFIABLE>
 * To add a new node type:
 * 1. Create node component in src/ui/nodes/YourNode.tsx
 * 2. Add to nodeTypes object below
 * 3. Add to UnifiedToolbar getTools() method
 * 4. Add to PropertyPanel for node-specific properties
 * </AI_MODIFIABLE>
 */
const nodeTypes: NodeTypes = {
  c4: C4Node,
  cloudComponent: CloudComponentNode,
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
  // Add new types here
};
```

**Key Extension Points:**
1. `canvas-view.tsx:nodeTypes` - Add node types
2. `UnifiedToolbar.tsx:getTools()` - Add node creation buttons
3. `PropertyPanel.tsx` - Add node property sections
4. `diagram-navigation-service.ts` - Add diagram hierarchy logic
5. `component-library-service.ts` - Add cloud providers

---

## Testing Strategy

### Quick Test After Refactoring

```bash
# 1. Build
npm run build

# 2. Check for TypeScript errors
npm run typecheck

# 3. Test in Obsidian
# - Open test vault
# - Create diagram
# - Add nodes
# - Link diagrams
# - Export diagram
```

### Unit Tests (Future)

```typescript
// Example test for auto-naming
describe('getAutoName', () => {
  it('should generate sequential names', () => {
    const nodes = [
      { type: 'system', data: { label: 'System 1' } },
      { type: 'system', data: { label: 'System 2' } },
    ];

    const result = getAutoName('system', nodes);
    expect(result).toBe('System 3');
  });
});
```

---

## Emergency Rollback

If refactoring breaks something:

```bash
# 1. Stash changes
git stash

# 2. Verify old code works
npm run build

# 3. Create bug report
# Document what broke and why

# 4. Return to refactoring
git stash pop

# 5. Fix issue or rollback that change
```

---

## Success Metrics

After refactoring, you should see:

**File Sizes:**
- ✅ canvas-view.tsx: <300 lines (from 1,243)
- ✅ PropertyPanel.tsx: <300 lines (from 1,002)
- ✅ No files >500 lines

**Documentation:**
- ✅ All exported functions have JSDoc
- ✅ All services have examples
- ✅ All extension points marked

**Code Quality:**
- ✅ No `any` types
- ✅ No functions >50 lines
- ✅ No magic numbers
- ✅ Consistent patterns

---

## Questions & Support

**Common Questions:**

Q: **What if I break something?**
A: Use git branches, test frequently, and keep commits small.

Q: **Which files should I refactor first?**
A: Start with constants extraction (low risk, high value).

Q: **How do I know when to stop?**
A: When files are <500 lines and functions are <50 lines.

Q: **Should I refactor everything at once?**
A: No! Refactor incrementally, one module at a time.

Q: **What if tests don't exist?**
A: Add basic manual testing, plan unit tests for phase 4.

---

## Resources

**Full Documentation:**
- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - Comprehensive plan
- [CLAUDE.md](../CLAUDE.md) - Project overview
- [architecture.md](./architecture.md) - System architecture (TODO)

**Code Standards:**
- TypeScript strict mode enabled
- ESLint rules (to be added)
- Prettier for formatting

**Tools:**
- VSCode with TypeScript plugin
- ESLint extension
- Prettier extension

---

**Last Updated:** 2025-10-11
**Version:** 1.0
**Status:** Ready to start
