# Developer Guide: Adding Custom Diagram Types

**Last Updated:** 2025-10-12
**Difficulty:** Advanced
**Time Required:** 1-2 hours

## Overview

This guide walks you through adding a new diagram type to the BAC4 plugin. Diagram types define the hierarchy level and determine which nodes can be created on that diagram.

---

## Prerequisites

- Understanding of React and TypeScript
- Familiarity with the C4 model hierarchy
- Knowledge of BAC4's architecture
- Completion of [Adding Node Types](./adding-node-types.md) guide recommended

---

## Diagram Type Architecture

### What is a Diagram Type?

A diagram type defines:
1. **Hierarchy Level** - Position in the C4 model (Level 1, 2, 3, etc.)
2. **Available Nodes** - Which node types can be added
3. **Navigation Rules** - Drill-down and drill-up behavior
4. **File Organization** - How diagrams are stored and linked

### Existing Diagram Types

| Type | C4 Level | Available Nodes | Child Type | Purpose |
|------|----------|-----------------|------------|---------|
| `context` | Level 1 | System, Person | `container` | System landscape view |
| `container` | Level 2 | Containers (webapp, api, db, etc.) | `component` | System decomposition |
| `component` | Level 3 | Components, Cloud Services | None | Implementation view |

---

## Step-by-Step Guide

### Step 1: Add Diagram Type to Constants

**File:** `src/constants/validation-constants.ts`

```typescript
// <AI_MODIFIABLE>
/**
 * Valid diagram types
 */
export const DIAGRAM_TYPES = [
  'context',
  'container',
  'component',
  'deployment', // ← Add your new type here
] as const;

/**
 * Diagram type union (auto-generated from array)
 */
export type DiagramType = typeof DIAGRAM_TYPES[number];
// </AI_MODIFIABLE>
```

This automatically updates the TypeScript type union!

---

### Step 2: Define Node Tools for Your Diagram Type

**File:** `src/ui/components/toolbar/components/NodeCreationButtons.tsx`

Update the `getTools()` function to include your diagram type:

```typescript
// <AI_MODIFIABLE>
/**
 * Get available node tools for the current diagram type
 */
function getTools(diagramType: DiagramType): NodeTool[] {
  switch (diagramType) {
    case 'context':
      return [
        { type: 'system', label: '+ System', data: { label: 'New System' } },
        { type: 'person', label: '+ Person', data: { label: 'New User' } },
      ];

    case 'container':
      return [
        { type: 'container', label: '🌐 Web', data: { label: 'Web App', containerType: 'webapp' } },
        { type: 'container', label: '🔌 API', data: { label: 'API', containerType: 'api' } },
        // ... more container types
      ];

    case 'component':
      return [
        { type: 'c4', label: '+ Component', data: { label: 'Component' } },
      ];

    // ← Add your new diagram type here
    case 'deployment':
      return [
        { type: 'server', label: '🖥️ Server', data: { label: 'Server' } },
        { type: 'region', label: '🌍 Region', data: { label: 'Region' } },
        { type: 'zone', label: '📍 Zone', data: { label: 'Availability Zone' } },
      ];

    default:
      return [];
  }
}
// </AI_MODIFIABLE>
```

**Note:** Make sure the node types referenced exist (see [Adding Node Types](./adding-node-types.md)).

---

### Step 3: Update Navigation Rules

**File:** `src/ui/canvas/utils/canvas-utils.ts`

#### 3.1 Update Drill-Down Logic

```typescript
// <AI_MODIFIABLE>
/**
 * Get child diagram type for a given parent node type
 */
export function getChildDiagramType(
  parentNodeType: string
): DiagramType | null {
  if (parentNodeType === 'system') return 'container';
  if (parentNodeType === 'container') return 'component';
  // Add your custom logic:
  if (parentNodeType === 'region') return 'deployment'; // Example
  return null;
}
// </AI_MODIFIABLE>
```

#### 3.2 Update Auto-Create Logic

```typescript
// <AI_MODIFIABLE>
/**
 * Determine if child diagram should be auto-created
 */
export function shouldAutoCreateChild(
  parentDiagramType: DiagramType,
  nodeType: string
): boolean {
  // Context diagrams: auto-create for System nodes
  if (parentDiagramType === 'context' && nodeType === 'system') {
    return true;
  }

  // Container diagrams: auto-create for drillable containers
  if (parentDiagramType === 'container' && nodeType === 'container') {
    return true;
  }

  // Add your custom logic:
  if (parentDiagramType === 'deployment' && nodeType === 'region') {
    return true;
  }

  return false;
}
// </AI_MODIFIABLE>
```

---

### Step 4: Update Type Selector UI (Optional)

**File:** `src/ui/components/toolbar/components/DiagramTypeSelector.tsx`

If you want users to manually switch diagram types:

```typescript
// <AI_MODIFIABLE>
const diagramTypeOptions: DiagramType[] = [
  'context',
  'container',
  'component',
  'deployment', // ← Add your type
];

const diagramTypeLabels: Record<DiagramType, string> = {
  context: 'Context (L1)',
  container: 'Container (L2)',
  component: 'Component (L3)',
  deployment: 'Deployment', // ← Add label
};
// </AI_MODIFIABLE>
```

---

### Step 5: Update Diagram Labels (Optional)

**File:** `src/ui/canvas/utils/canvas-utils.ts`

For better UX, provide friendly labels for child diagram types:

```typescript
// <AI_MODIFIABLE>
/**
 * Get user-friendly label for child diagram type
 */
export function getChildTypeLabel(childType: DiagramType): string {
  const labels: Record<DiagramType, string> = {
    context: 'Context Diagram',
    container: 'Container Diagram',
    component: 'Component Diagram',
    deployment: 'Deployment Diagram', // ← Add your label
  };
  return labels[childType] || childType;
}
// </AI_MODIFIABLE>
```

---

## Advanced Configuration

### Custom Dashboard Integration

If you want your diagram type to appear in the BAC4 dashboard:

**File:** `src/commands/dashboard-commands.ts`

```typescript
// <AI_MODIFIABLE>
export async function createBAC4Dashboard(plugin: BAC4Plugin): Promise<void> {
  const vaultRoot = plugin.app.vault.getRoot();

  // Create initial diagram
  const contextPath = 'Context.bac4';

  // If your type is the root type instead:
  const deploymentPath = 'Deployment.bac4';

  // ... initialization logic
}
// </AI_MODIFIABLE>
```

---

### Hierarchical Relationships

Define parent-child relationships for your diagram type:

**File:** `src/services/diagram-navigation-service.ts`

```typescript
// <AI_MODIFIABLE>
/**
 * Create child diagram linked to parent node
 */
async createChildDiagram(
  parentPath: string,
  nodeId: string,
  nodeLabel: string,
  parentType: DiagramType,
  childType: DiagramType
): Promise<string> {
  // Validate parent-child relationship
  if (parentType === 'deployment' && childType === 'component') {
    // Custom validation logic
    // E.g., deployment diagrams can link to component diagrams
  }

  // ... existing logic
}
// </AI_MODIFIABLE>
```

---

### File Organization

Organize diagrams by type in folders:

**File:** `src/data/project-structure.ts`

```typescript
// <AI_MODIFIABLE>
/**
 * Get folder path for diagram type
 */
export function getDiagramFolder(type: DiagramType): string {
  const folders: Record<DiagramType, string> = {
    context: 'diagrams/context',
    container: 'diagrams/container',
    component: 'diagrams/component',
    deployment: 'diagrams/deployment', // ← Add your folder
  };
  return folders[type] || 'diagrams';
}
// </AI_MODIFIABLE>
```

---

## Testing Your Diagram Type

### 1. Type Validation

Test that TypeScript recognizes your diagram type:

```typescript
// This should work without errors:
const myType: DiagramType = 'deployment';

// This should fail:
const invalid: DiagramType = 'invalid'; // TS error ✅
```

### 2. Manual Testing

```bash
npm run dev  # Start development build
```

1. Open Obsidian
2. Create new diagram of your type
3. Test diagram type selector (if added)
4. Add nodes from toolbar
5. Test drill-down navigation
6. Verify auto-creation of child diagrams
7. Check file organization

### 3. Automated Testing

Create test file: `tests/ui/canvas/utils/diagram-type-validation.test.ts`

```typescript
import { isValidDiagramType } from '../../../src/constants/validation-constants';
import { getChildDiagramType, getChildTypeLabel } from '../../../src/ui/canvas/utils/canvas-utils';

describe('Diagram Type: deployment', () => {
  it('should validate deployment diagram type', () => {
    expect(isValidDiagramType('deployment')).toBe(true);
  });

  it('should provide child type for region nodes', () => {
    expect(getChildDiagramType('region')).toBe('deployment');
  });

  it('should provide friendly label', () => {
    expect(getChildTypeLabel('deployment')).toBe('Deployment Diagram');
  });
});
```

---

## Example: Adding "Deployment" Diagram Type

### Use Case

Add a "Deployment" diagram type for infrastructure visualization:
- Shows cloud regions, availability zones, servers
- Links from Component diagrams
- Contains deployment-specific nodes (Server, LoadBalancer, etc.)

### Implementation Steps

1. **Add to DIAGRAM_TYPES:**
   ```typescript
   export const DIAGRAM_TYPES = ['context', 'container', 'component', 'deployment'] as const;
   ```

2. **Define Deployment Nodes:**
   - Create `ServerNode.tsx` (see [Adding Node Types](./adding-node-types.md))
   - Create `RegionNode.tsx`
   - Create `LoadBalancerNode.tsx`

3. **Add Toolbar Buttons:**
   ```typescript
   case 'deployment':
     return [
       { type: 'server', label: '🖥️ Server', data: { label: 'Server' } },
       { type: 'region', label: '🌍 Region', data: { label: 'Region' } },
       { type: 'loadbalancer', label: '⚖️ LB', data: { label: 'Load Balancer' } },
     ];
   ```

4. **Configure Navigation:**
   ```typescript
   // Component nodes can drill down to Deployment
   export function getChildDiagramType(nodeType: string): DiagramType | null {
     if (nodeType === 'system') return 'container';
     if (nodeType === 'container') return 'component';
     if (nodeType === 'c4' && isDeployableComponent(nodeType)) return 'deployment';
     return null;
   }
   ```

5. **Test:**
   - Create Context → Container → Component diagram
   - Double-click Component node → creates Deployment diagram
   - Add deployment nodes (Server, Region, etc.)
   - Verify navigation breadcrumbs

---

## Common Patterns

### Branch Diagram Types

If your diagram type doesn't follow strict hierarchy:

```typescript
export function getChildDiagramType(nodeType: string): DiagramType | null {
  // Standard hierarchy
  if (nodeType === 'system') return 'container';

  // Branch: Some components can have deployment OR data flow views
  if (nodeType === 'component') {
    // Could return 'deployment' OR 'dataflow' based on node properties
    return 'deployment'; // Default branch
  }

  return null;
}
```

### Multiple Root Diagrams

Support multiple top-level diagram types:

```typescript
// In dashboard or initialization:
export const ROOT_DIAGRAM_TYPES: DiagramType[] = ['context', 'deployment'];

// Both can be created at vault root
// Both can drill down to their own hierarchies
```

### Conditional Navigation

Restrict drill-down based on node properties:

```typescript
export function canDrillDown(node: Node): boolean {
  // Only allow drill-down for specific node properties
  if (node.data.diagramType === 'deployment') {
    return node.data.deployable === true;
  }
  return ['system', 'container'].includes(node.type);
}
```

---

## Best Practices

### ✅ Do's

1. **Follow C4 Principles** - Keep hierarchy logical and clear
2. **Use Semantic Names** - Choose names that convey purpose (e.g., "deployment" not "type4")
3. **Document Purpose** - Explain what this diagram type represents
4. **Define Clear Boundaries** - Specify which nodes belong to which diagram type
5. **Support Navigation** - Implement drill-down/drill-up if hierarchical
6. **Test Thoroughly** - Verify all navigation paths work correctly
7. **Update Type Definitions** - Keep TypeScript types in sync

### ❌ Don'ts

1. **Don't Break Hierarchy** - Circular dependencies (A→B→A) cause confusion
2. **Don't Overcomplicate** - Keep navigation simple and predictable
3. **Don't Mix Concerns** - Each diagram type should have a clear purpose
4. **Don't Forget Type Safety** - Always update TypeScript unions
5. **Don't Hardcode** - Use constants for all diagram type references

---

## Troubleshooting

### Type Selector Doesn't Show New Type

**Problem:** Added to DIAGRAM_TYPES but doesn't appear in dropdown

**Solution:**
1. Check `DiagramTypeSelector.tsx` has updated options array
2. Verify `diagramTypeLabels` includes your type
3. Rebuild plugin: `npm run build`
4. Restart Obsidian

### Nodes Don't Appear in Toolbar

**Problem:** Added diagram type but toolbar is empty

**Solution:**
1. Check `NodeCreationButtons.tsx` `getTools()` has case for your type
2. Verify node types referenced are registered in `canvas-view.tsx`
3. Check browser console for errors

### Navigation Doesn't Work

**Problem:** Double-click doesn't create child diagram

**Solution:**
1. Verify `canDrillDown()` returns true for your node type
2. Check `getChildDiagramType()` returns correct child type
3. Ensure `shouldAutoCreateChild()` returns true (if using auto-create)
4. Check browser console for service errors

### TypeScript Errors

**Problem:** Type errors when using new diagram type

**Solution:**
1. Ensure added to `DIAGRAM_TYPES` array (generates union type)
2. Update all `DiagramType` type annotations
3. Run `npm run typecheck` to find remaining errors
4. Check all switch/case statements cover new type

---

## Diagram Type Checklist

Before submitting your new diagram type:

- [ ] Added to `DIAGRAM_TYPES` array in `validation-constants.ts`
- [ ] Added case to `getTools()` in `NodeCreationButtons.tsx`
- [ ] Defined navigation rules in `canvas-utils.ts`:
  - [ ] `canDrillDown()` logic
  - [ ] `getChildDiagramType()` logic
  - [ ] `shouldAutoCreateChild()` logic
- [ ] Added to type selector (if applicable):
  - [ ] `diagramTypeOptions` array
  - [ ] `diagramTypeLabels` object
- [ ] Added child type label in `getChildTypeLabel()`
- [ ] Created required node types (see [Adding Node Types](./adding-node-types.md))
- [ ] Updated file organization (if using folders)
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed:
  - [ ] Can create diagram of new type
  - [ ] Toolbar shows correct nodes
  - [ ] Navigation works (drill-down/drill-up)
  - [ ] Auto-creation works (if enabled)
  - [ ] Saves and reloads correctly
- [ ] Automated tests written (optional)
- [ ] Documentation updated (this file, README, etc.)

---

## Related Guides

- [Adding Node Types](./adding-node-types.md) - Create custom nodes for your diagram type
- [Adding Cloud Providers](./adding-cloud-providers.md) - Extend component library
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - General contribution guidelines

---

## Reference Files

Key files for diagram type implementation:

- **Constants:** `src/constants/validation-constants.ts`
- **Toolbar:** `src/ui/components/toolbar/components/NodeCreationButtons.tsx`
- **Type Selector:** `src/ui/components/toolbar/components/DiagramTypeSelector.tsx`
- **Navigation:** `src/ui/canvas/utils/canvas-utils.ts`
- **Services:** `src/services/diagram-navigation-service.ts`
- **File Organization:** `src/data/project-structure.ts`

---

## Need Help?

- Review existing diagram types in `src/constants/validation-constants.ts`
- Check C4 model documentation: https://c4model.com/
- See `docs/accessibility.md` for accessibility requirements
- See `docs/performance-optimizations.md` for performance tips

---

**Happy coding! 🚀**
