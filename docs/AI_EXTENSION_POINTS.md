# AI Extension Points - BAC4 Plugin

**Purpose:** This document identifies all locations in the codebase where AI assistants and developers can safely extend functionality. Each extension point is marked with `<AI_MODIFIABLE>` tags in the source code.

**Last Updated:** 2025-10-13

---

## Overview

The BAC4 plugin has **7 primary extension points** that allow safe addition of new functionality without breaking existing features:

1. **Node Types** - Add new node components
2. **Edge Types** - Add new edge/relationship types
3. **Cloud Providers** - Add Azure, GCP, or other cloud libraries
4. **Diagram Types** - Extend beyond Context/Container/Component
5. **Node Creation Tools** - Add node buttons to toolbar
6. **Constants** - Add edge labels, colors, container types
7. **Component Library** - Add cloud services to existing providers

---

## Extension Point 1: Node Types

**Location:** `src/ui/canvas-view.tsx:55-73`

**Purpose:** Register new custom node components for React Flow

**How to Extend:**
1. Create new node component in `src/ui/nodes/YourNode.tsx`
2. Import the component
3. Add to `nodeTypes` object

**Example:**
```typescript
// <AI_MODIFIABLE>
// Custom node types mapping
// Add new node types here following the pattern:
// yourNodeType: YourNodeComponent,
const nodeTypes: NodeTypes = {
  c4: C4Node,
  cloudComponent: CloudComponentNode,
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
  // Add: database: DatabaseNode,
};
// </AI_MODIFIABLE>
```

**Steps:**
1. Create `src/ui/nodes/DatabaseNode.tsx`
2. Import: `import { DatabaseNode } from './nodes/DatabaseNode';`
3. Add to object: `database: DatabaseNode,`

**Related Files:**
- `src/constants/validation-constants.ts` - Add to NODE_TYPES array
- Node component template in CLAUDE.md

---

## Extension Point 2: Edge Types

**Location:** `src/ui/canvas-view.tsx:67-72`

**Purpose:** Register new custom edge/relationship components

**How to Extend:**
1. Create new edge component in `src/ui/edges/YourEdge.tsx`
2. Import the component
3. Add to `edgeTypes` object

**Example:**
```typescript
// <AI_MODIFIABLE>
// Custom edge types mapping
// Add new edge types here following the pattern:
// yourEdgeType: YourEdgeComponent,
const edgeTypes: EdgeTypes = {
  directional: DirectionalEdge,
  // Add: dashed: DashedEdge,
  // Add: animated: AnimatedEdge,
};
// </AI_MODIFIABLE>
```

**Current Edge:** `DirectionalEdge` - supports →, ←, ↔ arrows

**Use Cases for New Edge Types:**
- Dashed edges (for optional/future relationships)
- Animated edges (for data flow visualization)
- Thick edges (for high-bandwidth connections)
- Color-coded edges (for different protocols)

---

## Extension Point 3: Cloud Providers

**Location:** `component-library/index.ts:12-20`

**Purpose:** Add new cloud provider libraries (Azure, GCP, etc.)

**How to Extend:**
1. Create `component-library/azure/index.ts`
2. Define Azure components following AWS pattern
3. Import and add to `componentLibraries` array

**Example:**
```typescript
// <AI_MODIFIABLE>
/**
 * All available component libraries
 * Add new cloud providers here following the pattern:
 * 1. Import library: import { azureLibrary } from './azure';
 * 2. Add to array: [awsLibrary, azureLibrary]
 */
export const componentLibraries: ComponentLibrary[] = [
  awsLibrary,
  // Add: azureLibrary,
  // Add: gcpLibrary,
];
// </AI_MODIFIABLE>
```

**Steps to Add Azure:**
1. Create `component-library/azure/`
2. Create `component-library/azure/index.ts`
3. Define Azure services following `component-library/aws/index.ts` pattern
4. Import in `component-library/index.ts`
5. Add to array

**Component Definition Format:**
```typescript
{
  id: 'azure-functions',
  name: 'Azure Functions',
  provider: 'azure',
  category: 'Compute',
  icon: 'zap',
  description: 'Serverless compute service',
  tags: ['serverless', 'faas'],
}
```

---

## Extension Point 4: Diagram Types

**Location:** `src/constants/validation-constants.ts:92-104`

**Purpose:** Add new C4 hierarchy levels or custom diagram types

**How to Extend:**
1. Add new type to `DIAGRAM_TYPES` array
2. TypeScript type is auto-generated
3. Add node creation tools for new type
4. Update drill-down logic if needed

**Example:**
```typescript
// <AI_MODIFIABLE>
/**
 * Valid diagram types
 * Add new diagram types here to extend the C4 hierarchy.
 * The type union is auto-generated from this array.
 */
export const DIAGRAM_TYPES = [
  'context',
  'container',
  'component',
  // Add: 'code',        // C4 Level 4 - Code level
  // Add: 'deployment',  // Deployment diagrams
  // Add: 'sequence',    // Sequence diagrams
] as const;

/**
 * Diagram type union (auto-generated)
 */
export type DiagramType = typeof DIAGRAM_TYPES[number];
// </AI_MODIFIABLE>
```

**Related Changes:**
1. Add case in `NodeCreationButtons.tsx` getTools() function
2. Update `DiagramNavigationService` if new type has children
3. Add auto-naming logic in `canvas-utils.ts`

---

## Extension Point 5: Node Creation Tools

**Location:** `src/ui/components/toolbar/components/NodeCreationButtons.tsx:27-92`

**Purpose:** Define which node buttons appear for each diagram type

**How to Extend:**
1. Add new case to `getTools()` function
2. Define node tools with type, label, and default data

**Example:**
```typescript
// <AI_MODIFIABLE>
function getTools(diagramType: 'context' | 'container' | 'component'): NodeTool[] {
  switch (diagramType) {
    case 'context':
      return [
        { type: 'system', label: '+ System', data: { label: 'New System', external: false } },
        { type: 'person', label: '+ Person', data: { label: 'New User' } },
        { type: 'system', label: '+ External', data: { label: 'External System', external: true } },
      ];
    case 'container':
      return [
        { type: 'container', label: '🌐 Web', data: { label: 'Web Application', containerType: 'webapp' } },
        { type: 'container', label: '📱 Mobile', data: { label: 'Mobile App', containerType: 'mobileapp' } },
        { type: 'container', label: '🔌 API', data: { label: 'API Service', containerType: 'api' } },
        { type: 'container', label: '🗄️ DB', data: { label: 'Database', containerType: 'database' } },
        { type: 'container', label: '📮 Queue', data: { label: 'Message Queue', containerType: 'queue' } },
      ];
    case 'component':
      return [
        { type: 'c4', label: '+ Component', data: { label: 'New Component', type: 'component' } },
      ];
    // Add new diagram types here:
    // case 'deployment':
    //   return [
    //     { type: 'server', label: '🖥️ Server', data: { label: 'Server' } },
    //     { type: 'cluster', label: '☸️ Cluster', data: { label: 'K8s Cluster' } },
    //   ];
  }
}
// </AI_MODIFIABLE>
```

**Button Format:**
- `type` - Node type (must match registered nodeTypes)
- `label` - Button label (emoji + text for visual appeal)
- `data` - Default data for new nodes

---

## Extension Point 6A: Edge Relationship Labels

**Location:** `src/constants/validation-constants.ts:135-149`

**Purpose:** Add common edge labels for quick selection in PropertyPanel

**How to Extend:**
1. Add new labels to `COMMON_RELATIONSHIPS` array
2. Labels appear in PropertyPanel dropdown

**Example:**
```typescript
// <AI_MODIFIABLE>
/**
 * Common relationship labels
 * Add new edge label presets here for quick selection in PropertyPanel
 */
export const COMMON_RELATIONSHIPS = [
  'uses',
  'depends on',
  'calls',
  'reads',
  'writes',
  'sends to',
  'contains',
  // Add: 'triggers',
  // Add: 'subscribes to',
  // Add: 'publishes to',
  // Add: 'authenticates with',
] as const;
// </AI_MODIFIABLE>
```

**Use Case:** Users can quickly select these labels instead of typing them manually.

---

## Extension Point 6B: Container Types

**Location:** `src/constants/validation-constants.ts:151-169`

**Purpose:** Define types of containers (webapp, API, database, etc.)

**How to Extend:**
1. Add new type to `CONTAINER_TYPES` array
2. Add corresponding case in `ContainerNode.tsx` for icon/color
3. Add to node creation tools

**Example:**
```typescript
// <AI_MODIFIABLE>
/**
 * Container types
 * Add new container types here (must also add icons and colors in ContainerNode.tsx)
 */
export const CONTAINER_TYPES = [
  'webapp',
  'mobileapp',
  'api',
  'database',
  'queue',
  'service',
  // Add: 'cache',      // Redis, Memcached
  // Add: 'cdn',        // CloudFlare, CloudFront
  // Add: 'scheduler',  // Cron, Airflow
  // Add: 'filestore',  // S3, Azure Blob
] as const;

/**
 * Container type union (auto-generated)
 */
export type ContainerType = typeof CONTAINER_TYPES[number];
// </AI_MODIFIABLE>
```

**Related Changes:**
1. Update `ContainerNode.tsx` to add icon and color for new type
2. Add button to `NodeCreationButtons.tsx` container case

---

## Extension Point 6C: Color Presets

**Location:** `src/constants/ui-constants.ts:184-204`

**Purpose:** Define node color presets for PropertyPanel color picker

**How to Extend:**
1. Add new colors to `COLOR_PRESETS` array
2. Colors appear in PropertyPanel ColorPicker

**Example:**
```typescript
// <AI_MODIFIABLE>
/**
 * Color presets for node customization
 * Add new color presets here to appear in ColorPicker component
 */
export const COLOR_PRESETS = [
  { name: 'Blue', value: '#4A90E2' },
  { name: 'Green', value: '#7ED321' },
  { name: 'Orange', value: '#F5A623' },
  { name: 'Purple', value: '#9B59B6' },
  { name: 'Red', value: '#E74C3C' },
  { name: 'Teal', value: '#1ABC9C' },
  { name: 'Yellow', value: '#F1C40F' },
  { name: 'Pink', value: '#E91E63' },
  // Add: { name: 'Cyan', value: '#00BCD4' },
  // Add: { name: 'Lime', value: '#CDDC39' },
] as const;
// </AI_MODIFIABLE>
```

---

## Extension Point 7: Component Library - Add Services to Existing Providers

**Location:** `component-library/aws/index.ts` (and future azure, gcp)

**Purpose:** Add new cloud services to existing provider libraries

**How to Extend:**
1. Add new service to `components` array in provider file
2. Follow existing pattern for consistency

**Example Adding EC2 Auto Scaling:**
```typescript
{
  id: 'aws-autoscaling',
  name: 'Auto Scaling',
  provider: 'aws',
  category: 'Compute',
  icon: 'trending-up',
  description: 'Automatically scale EC2 capacity',
  tags: ['scaling', 'ec2', 'elasticity'],
},
```

**Component Properties:**
- `id` - Unique identifier (format: `provider-servicename`)
- `name` - Display name
- `provider` - Cloud provider (`'aws'`, `'azure'`, `'gcp'`, `'saas'`)
- `category` - Service category (must match ComponentCategory type)
- `icon` - Lucide icon name
- `description` - Brief service description
- `tags` - Search keywords

---

## Summary of All Extension Points

| # | Location | Purpose | Complexity |
|---|----------|---------|------------|
| 1 | `canvas-view.tsx:55` | Node Types | Medium |
| 2 | `canvas-view.tsx:67` | Edge Types | Medium |
| 3 | `component-library/index.ts:12` | Cloud Providers | High |
| 4 | `validation-constants.ts:92` | Diagram Types | High |
| 5 | `NodeCreationButtons.tsx:27` | Node Tools | Low |
| 6A | `validation-constants.ts:135` | Edge Labels | Easy |
| 6B | `validation-constants.ts:151` | Container Types | Medium |
| 6C | `ui-constants.ts:184` | Color Presets | Easy |
| 7 | `component-library/aws/index.ts` | Add Services | Easy |

**Complexity Guide:**
- **Easy:** Add to array, no other changes needed
- **Low:** Add to array + update one other file
- **Medium:** Add to array + create component + update 2-3 files
- **High:** Add to array + create multiple files + update services

---

## How to Use This Document

### For AI Assistants

When a user requests to add functionality, search this document for the appropriate extension point:

**User Request:** "Add Azure cloud provider"
→ **Extension Point 3:** Cloud Providers

**User Request:** "Add new edge label 'triggers'"
→ **Extension Point 6A:** Edge Relationship Labels

**User Request:** "Add server node for deployment diagrams"
→ **Extension Point 1:** Node Types + **Extension Point 4:** Diagram Types

### For Developers

1. **Find extension point** in this document
2. **Locate code** using file path and line number
3. **Look for `<AI_MODIFIABLE>` tags** in source code
4. **Follow existing pattern** for consistency
5. **Update related files** as noted in "Related Changes"

---

## Testing Your Extension

After adding new functionality:

1. **Build:** `npm run build`
2. **Install:** Copy to test vault
3. **Reload:** Restart Obsidian
4. **Test:**
   - New node type: Can you add it to diagram?
   - New edge type: Does it render correctly?
   - New cloud provider: Does it appear in palette?
   - New diagram type: Does toolbar show correct tools?
   - New edge label: Does it appear in dropdown?
   - New color: Does it appear in color picker?

---

## Related Documentation

- **CLAUDE.md** - "Common Tasks" section with component templates
- **Adding a New Node Type** - CLAUDE.md:365-370
- **Adding a Cloud Provider** - CLAUDE.md:371-375
- **Modifying Canvas Behavior** - CLAUDE.md:377-380
- **Component Templates** - CLAUDE.md:696-762
- **Coding Standards** - CLAUDE.md:355-795

---

## Future Extension Points (Phase 8)

These areas will become extension points in future phases:

- **Export Formats** - Add PDF, Mermaid, PlantUML export
- **Validation Rules** - Custom diagram validation
- **Keyboard Shortcuts** - Custom hotkeys
- **Context Menu Items** - Right-click menu actions
- **Settings** - Plugin configuration options
- **Themes** - Custom color schemes

---

## Maintenance

**When adding new extension points:**
1. Mark code with `<AI_MODIFIABLE>` tags
2. Add entry to this document with:
   - Location (file + line number)
   - Purpose
   - Example code
   - Related changes
3. Update "Summary of All Extension Points" table
4. Commit with message: `docs: Add AI extension point for [feature]`

**When modifying existing extension points:**
1. Update line numbers in this document
2. Update example code if pattern changes
3. Note breaking changes if any

---

## Questions?

**For AI Assistants:** Refer to CLAUDE.md for detailed implementation guidance
**For Developers:** See CONTRIBUTING.md (Phase 8) or open GitHub issue

**Last Updated:** 2025-10-13
**Version:** BAC4 Plugin v0.1.0
