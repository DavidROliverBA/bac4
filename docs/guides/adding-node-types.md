# Developer Guide: Adding Custom Node Types

**Last Updated:** 2025-10-12
**Difficulty:** Intermediate
**Time Required:** 30-60 minutes

## Overview

This guide walks you through adding a new custom node type to the BAC4 plugin. Node types define the visual appearance and data structure of nodes that appear on the canvas.

---

## Prerequisites

- Understanding of React and TypeScript
- Familiarity with React Flow's node system
- Knowledge of Obsidian plugin structure

---

## Node Type Architecture

### What is a Node Type?

A node type consists of:
1. **Data Interface** - TypeScript interface defining node properties
2. **React Component** - Visual representation of the node
3. **Registration** - Adding the node to React Flow's `nodeTypes` object

### Existing Node Types

| Node Type | Used In | Purpose |
|-----------|---------|---------|
| `system` | Context diagrams | Represents software systems |
| `person` | Context diagrams | Represents users/actors |
| `container` | Container diagrams | Represents apps, APIs, databases |
| `cloudComponent` | Component diagrams | Represents cloud services (AWS, etc.) |
| `c4` | All diagrams | Generic fallback node |

---

## Step-by-Step Guide

### Step 1: Create the Node Component File

Create a new file in `src/ui/nodes/YourNode.tsx`:

```typescript
/**
 * YourNode - For [Diagram Type]
 * Brief description of what this node represents
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
} from '../../constants';

// <AI_MODIFIABLE>
// Step 1: Define your node's data interface
export interface YourNodeData {
  label: string;                    // Required: Node label
  description?: string;             // Optional: Node description
  color?: string;                   // Optional: Custom color
  // Add your custom properties here:
  // customProp?: string;
}
// </AI_MODIFIABLE>

/**
 * YourNode Component
 *
 * @example
 * ```tsx
 * // Used in canvas-view.tsx nodeTypes:
 * const nodeTypes = {
 *   yourNode: YourNode,
 *   // ...
 * };
 * ```
 */
export const YourNode: React.FC<NodeProps<YourNodeData>> = ({
  data,
  selected
}) => {
  const color = data.color || '#4A90E2'; // Default color

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      style={{
        padding: SPACING.padding.card,
        borderRadius: BORDER_RADIUS.large,
        border: 'none',
        minWidth: '180px',
        maxWidth: '260px',
        textAlign: 'center',
        backgroundColor: hexToRgba(color, 0.2),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.large,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
          : '0 3px 6px rgba(0,0,0,0.12)',
        position: 'relative',
      }}
    >
      {/* Top connection handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: color,
          width: '12px',
          height: '12px'
        }}
      />

      {/* Label */}
      <div style={{ fontWeight: 600, marginBottom: SPACING.medium }}>
        {data.label}
      </div>

      {/* Description (optional) */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.large,
          }}
        >
          {data.description}
        </div>
      )}

      {/* Bottom connection handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          width: '12px',
          height: '12px'
        }}
      />
    </div>
  );
};
```

---

### Step 2: Register the Node Type

**File:** `src/ui/canvas-view.tsx`

1. **Import your node component:**

```typescript
// Find the imports section (around line 15-25)
import { SystemNode } from './nodes/SystemNode';
import { PersonNode } from './nodes/PersonNode';
import { ContainerNode } from './nodes/ContainerNode';
import { CloudComponentNode } from './nodes/CloudComponentNode';
import { C4Node } from './nodes/C4Node';
import { YourNode } from './nodes/YourNode'; // ← Add this
```

2. **Add to nodeTypes object:**

```typescript
// Find nodeTypes definition (around line 56)
// <AI_MODIFIABLE>
const nodeTypes: NodeTypes = {
  c4: C4Node,
  cloudComponent: CloudComponentNode,
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
  yourNode: YourNode, // ← Add this
};
// </AI_MODIFIABLE>
```

---

### Step 3: Add to Toolbar (Optional)

**File:** `src/ui/components/UnifiedToolbar.tsx`

If you want users to create this node type from the toolbar:

```typescript
// Find the getTools() function (around line 100-150)

const getTools = (): ToolConfig[] => {
  // Add your node type to appropriate diagram type
  if (diagramType === 'context') {
    return [
      {
        type: 'system',
        label: 'System',
        icon: '🖥️',
        description: 'Add a system node',
      },
      {
        type: 'person',
        label: 'Person',
        icon: '👤',
        description: 'Add a person/actor node',
      },
      // <AI_MODIFIABLE>
      {
        type: 'yourNode',
        label: 'Your Node',
        icon: '✨', // Choose an emoji
        description: 'Add your custom node',
      },
      // </AI_MODIFIABLE>
    ];
  }
  // ...
};
```

---

### Step 4: Add Auto-Naming Support (Optional)

**File:** `src/ui/canvas/utils/auto-naming.ts`

If you want auto-naming (e.g., "YourNode 1", "YourNode 2"):

```typescript
// <AI_MODIFIABLE>
export function getAutoName(
  nodeType: string,
  nodes: Node<CanvasNodeData>[]
): string {
  // Find existing case statements (around line 15-45)

  switch (nodeType) {
    case 'system':
      return generateName('System', nodes, 'system');
    case 'container':
      return generateName('Container', nodes, 'container');
    // ... other cases ...
    case 'yourNode':
      return generateName('YourNode', nodes, 'yourNode'); // ← Add this
    default:
      return 'New Node';
  }
}
// </AI_MODIFIABLE>
```

---

### Step 5: Update Type Definitions (Optional)

**File:** `src/types/canvas.ts`

If you need to extend type definitions:

```typescript
// <AI_MODIFIABLE>
export type NodeType =
  | 'c4'
  | 'system'
  | 'person'
  | 'container'
  | 'cloudComponent'
  | 'yourNode'; // ← Add this

export type CanvasNodeData =
  | SystemNodeData
  | PersonNodeData
  | ContainerNodeData
  | CloudComponentNodeData
  | C4NodeData
  | YourNodeData; // ← Add this
// </AI_MODIFIABLE>
```

---

## Advanced Features

### Drill-Down Capability

If your node should support drill-down (like System and Container nodes):

```typescript
export interface YourNodeData {
  label: string;
  description?: string;
  color?: string;
  hasChildDiagram?: boolean; // ← Add this
}

export const YourNode: React.FC<NodeProps<YourNodeData>> = ({ data, selected }) => {
  // ... existing code ...

  return (
    <div style={nodeStyles}>
      <Handle type="target" position={Position.Top} />

      {/* Drill-down indicator badge */}
      {data.hasChildDiagram && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: UI_COLORS.interactiveAccent,
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FONT_SIZES.medium,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: `2px solid ${UI_COLORS.backgroundPrimary}`,
            cursor: 'pointer',
          }}
          title="This node has a child diagram (double-click to open)"
        >
          📂
        </div>
      )}

      {/* Label and content */}
      <div>{data.label}</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

Then update `src/ui/canvas/utils/canvas-utils.ts`:

```typescript
// <AI_MODIFIABLE>
export function canDrillDown(nodeType: string): boolean {
  return ['system', 'container', 'yourNode'].includes(nodeType);
}

export function getChildDiagramType(
  parentNodeType: string
): 'container' | 'component' | null {
  if (parentNodeType === 'system') return 'container';
  if (parentNodeType === 'container') return 'component';
  if (parentNodeType === 'yourNode') return 'component'; // ← Or whatever makes sense
  return null;
}
// </AI_MODIFIABLE>
```

---

### Icons and Visual Variations

Add type-specific icons like ContainerNode:

```typescript
const yourNodeIcons = {
  typeA: '🎨',
  typeB: '📊',
  typeC: '🔧',
};

const yourNodeColors = {
  typeA: '#E74C3C',
  typeB: '#3498DB',
  typeC: '#2ECC71',
};

export interface YourNodeData {
  label: string;
  subType: 'typeA' | 'typeB' | 'typeC';
  color?: string;
}

export const YourNode: React.FC<NodeProps<YourNodeData>> = ({ data }) => {
  const defaultColor = yourNodeColors[data.subType];
  const color = data.color || defaultColor;
  const icon = yourNodeIcons[data.subType];

  return (
    <div style={nodeStyles}>
      {/* Icon and label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.medium }}>
        <span style={{ fontSize: FONT_SIZES.icon }}>{icon}</span>
        <span>{data.label}</span>
      </div>
    </div>
  );
};
```

---

## Testing Your Node

### 1. Manual Testing

```bash
npm run dev  # Start development build
```

1. Open Obsidian
2. Create or open a `.bac4` diagram
3. Look for your node in the toolbar
4. Click to add to canvas
5. Test interactions:
   - Select node
   - Edit properties in Property Panel
   - Connect to other nodes
   - Save and reload

### 2. Automated Testing

Create test file: `tests/ui/nodes/YourNode.test.tsx`

```typescript
import * as React from 'react';
import { render } from '@testing-library/react';
import { YourNode, YourNodeData } from '../../../src/ui/nodes/YourNode';

describe('YourNode', () => {
  it('should render label', () => {
    const data: YourNodeData = {
      label: 'Test Node',
    };

    const { getByText } = render(
      <YourNode
        id="test-1"
        data={data}
        selected={false}
      />
    );

    expect(getByText('Test Node')).toBeTruthy();
  });

  it('should render description when provided', () => {
    const data: YourNodeData = {
      label: 'Test Node',
      description: 'Test description',
    };

    const { getByText } = render(
      <YourNode
        id="test-1"
        data={data}
        selected={false}
      />
    );

    expect(getByText('Test description')).toBeTruthy();
  });
});
```

---

## Common Patterns

### External/Internal Variants

Like SystemNode's external flag:

```typescript
export interface YourNodeData {
  label: string;
  external?: boolean;
}

export const YourNode: React.FC<NodeProps<YourNodeData>> = ({ data }) => {
  return (
    <div
      style={{
        backgroundColor: data.external
          ? 'rgba(128, 128, 128, 0.3)'
          : hexToRgba(color, 0.25),
      }}
    >
      {data.label}
      {data.external && <div>External</div>}
    </div>
  );
};
```

### Technology Stack Display

Like ContainerNode's technology field:

```typescript
export interface YourNodeData {
  label: string;
  technology?: string;
}

export const YourNode: React.FC<NodeProps<YourNodeData>> = ({ data }) => {
  return (
    <div>
      <div>{data.label}</div>
      {data.technology && (
        <div style={{
          fontSize: FONT_SIZES.small,
          color: UI_COLORS.textMuted
        }}>
          [{data.technology}]
        </div>
      )}
    </div>
  );
};
```

---

## Best Practices

### ✅ Do's

1. **Always use constants** - Import from `src/constants/*`
2. **Keep components under 200 lines** - Extract helpers if needed
3. **Use TypeScript interfaces** - No `any` types
4. **Document with JSDoc** - Explain purpose and usage
5. **Support theming** - Use Obsidian CSS variables via `UI_COLORS`
6. **Handle selection state** - Apply visual feedback when `selected={true}`
7. **Provide connection handles** - Top (target) and bottom (source)
8. **Use semantic colors** - Choose colors that convey meaning

### ❌ Don'ts

1. **Don't hardcode values** - Use constants for spacing, colors, sizes
2. **Don't exceed component size limits** - Max 200 lines per component
3. **Don't add business logic** - Keep nodes presentational, logic goes in services
4. **Don't forget accessibility** - Add ARIA labels, keyboard support
5. **Don't break React Flow patterns** - Follow their conventions

---

## Troubleshooting

### Node Doesn't Appear on Canvas

**Problem:** Added node to toolbar but nothing happens when clicked

**Solution:**
1. Check `nodeTypes` registration in `canvas-view.tsx`
2. Ensure node type string matches exactly (case-sensitive)
3. Check browser console for React errors

### Node Renders Incorrectly

**Problem:** Node looks broken or misaligned

**Solution:**
1. Ensure you're importing constants correctly
2. Check for missing `position: 'relative'` on container
3. Verify Handle components are present
4. Check CSS conflicts in browser DevTools

### Type Errors

**Problem:** TypeScript errors when using custom properties

**Solution:**
1. Update `CanvasNodeData` type union in `src/types/canvas.ts`
2. Ensure interface is exported from node component
3. Check NodeProps generic: `NodeProps<YourNodeData>`

### Auto-Naming Not Working

**Problem:** Nodes aren't auto-named

**Solution:**
1. Check `auto-naming.ts` includes your node type
2. Ensure `getAutoName()` switch case exists
3. Verify toolbar config uses correct `type` value

---

## Examples from Existing Nodes

### Simple Node: PersonNode

**Characteristics:**
- No drill-down
- No sub-types
- Basic styling

**File:** `src/ui/nodes/PersonNode.tsx` (128 lines)

### Complex Node: ContainerNode

**Characteristics:**
- Sub-types (webapp, api, database, etc.)
- Type-specific icons and colors
- Drill-down capability
- Technology stack display

**File:** `src/ui/nodes/ContainerNode.tsx` (170 lines)

---

## Checklist

Before submitting your new node type:

- [ ] Created node component in `src/ui/nodes/YourNode.tsx`
- [ ] Defined `YourNodeData` interface
- [ ] Imported and registered in `canvas-view.tsx` nodeTypes
- [ ] Added to toolbar in `UnifiedToolbar.tsx` (if applicable)
- [ ] Added auto-naming support in `auto-naming.ts` (if applicable)
- [ ] Updated type definitions in `src/types/canvas.ts` (if applicable)
- [ ] Component under 200 lines
- [ ] All constants imported (no hardcoded values)
- [ ] JSDoc documentation added
- [ ] Handles (top/bottom) present
- [ ] Selected state styling implemented
- [ ] Manual testing completed
- [ ] Automated tests written (optional but recommended)

---

## Related Guides

- [Adding Diagram Types](./adding-diagram-types.md) - Create new diagram types
- [Adding Cloud Providers](./adding-cloud-providers.md) - Extend component library
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - General contribution guidelines

---

## Need Help?

- Check existing nodes in `src/ui/nodes/` for reference
- Review React Flow documentation: https://reactflow.dev/
- See `docs/accessibility.md` for accessibility requirements
- See `docs/performance-optimizations.md` for performance tips

---

**Happy coding! 🚀**
