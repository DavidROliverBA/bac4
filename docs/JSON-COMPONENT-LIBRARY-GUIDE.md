# JSON Component Library & Container Nodes Guide

**Version:** 1.0.0
**Date:** 2025-10-17

## Overview

BAC4 now supports a fully JSON-based component library system with resizable container nodes. This allows you to:

✅ **Add new components** without touching code
✅ **Define container components** (VPC, Subnet, ECS) that can hold other components
✅ **Customize components** with icons, colors, sizes, and documentation templates
✅ **Extend to new cloud providers** (Azure, GCP, etc.) easily

---

## 📁 File Structure

```
bac4/
├── component-library/
│   ├── components.json          # ⭐ Main component definitions (EDIT THIS)
│   ├── components-schema.json   # JSON schema for validation
│   ├── README.md               # Component library documentation
│   └── types.ts                # TypeScript type definitions
└── src/
    ├── services/
    │   └── component-library-service.ts  # Loads components from JSON
    ├── ui/nodes/
    │   └── CloudComponentNode.tsx        # Renders container nodes
    └── types/
        └── canvas-types.ts              # Updated with isContainer
```

---

## 🎨 Container Node Features

### What are Container Nodes?

Container nodes are special cloud components that can:
- **Be resized** by dragging corner handles
- **Contain other components** inside them (visual hierarchy)
- **Show dashed borders** to indicate they're containers
- **Have larger default dimensions** (e.g., VPC is 800x600px)

### Current Container Components

| Component | ID | Size | Purpose |
|-----------|-----|------|---------|
| **AWS VPC** | `aws-vpc` | 800x600 | Largest container - holds subnets |
| **AWS Subnet** | `aws-subnet` | 400x300 | Holds EC2, RDS, etc. |
| **AWS ECS** | `aws-ecs` | 500x350 | Container orchestration cluster |
| **AWS EKS** | `aws-eks` | 500x350 | Kubernetes cluster |

### Visual Hierarchy Example

```
┌─────────────────────────────────────────┐
│ VPC (800x600) - Resizable Container     │
│  ┌────────────────────────────────────┐ │
│  │ Subnet (400x300) - Nested Container│ │
│  │  ┌────────┐  ┌────────┐            │ │
│  │  │  EC2   │  │  RDS   │            │ │
│  │  │ (160x90)│ │ (160x90)│           │ │
│  │  └────────┘  └────────┘            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📝 Component JSON Structure

### Required Properties

Every component in `components.json` must have:

```json
{
  "id": "unique-id",              // Unique identifier
  "name": "Display Name",         // What users see
  "provider": "aws",              // aws, azure, gcp, saas, it
  "category": "networking",       // compute, storage, database, etc.
  "type": "specific-type",        // More specific than category
  "description": "Short desc",    // Component description
  "icon": "network",              // Lucide icon name
  "color": "#8C4FFF"             // Hex color code
}
```

### Container-Specific Properties

For container nodes, add:

```json
{
  "isContainer": true,            // ⭐ Enables resize & container behavior
  "defaultWidth": 800,            // Initial width in pixels
  "defaultHeight": 600,           // Initial height in pixels
  "defaultNoteText": "# Template" // Markdown documentation template
}
```

### Full Example: AWS VPC

```json
{
  "id": "aws-vpc",
  "name": "VPC",
  "provider": "aws",
  "category": "networking",
  "type": "network-isolation",
  "description": "Virtual Private Cloud - Isolated network environment",
  "defaultNoteText": "# VPC\n\nVirtual Private Cloud for AWS resources.\n\n## Configuration\n- **CIDR Block**: \n- **Region**: \n- **Availability Zones**: \n\n## Resources\n- Subnets: \n- Route Tables: \n- Internet Gateway: \n- NAT Gateway: \n\n## Security\n- Network ACLs: \n- Security Groups: ",
  "icon": "network",
  "isContainer": true,
  "defaultWidth": 800,
  "defaultHeight": 600,
  "color": "#8C4FFF",
  "defaultProps": {
    "cidr": "10.0.0.0/16"
  },
  "tags": ["network", "vpc", "isolation"],
  "docsUrl": "https://docs.aws.amazon.com/vpc/"
}
```

---

## 🚀 How to Add New Components

### Step 1: Edit components.json

1. Open `component-library/components.json`
2. Add your component to the `components` array

### Step 2: Define the Component

**Example: Adding Azure Virtual Network**

```json
{
  "id": "azure-vnet",
  "name": "Virtual Network",
  "provider": "azure",
  "category": "networking",
  "type": "network-isolation",
  "description": "Azure Virtual Network (VNet)",
  "defaultNoteText": "# Azure Virtual Network\n\n## Configuration\n- **Address Space**: \n- **Subnets**: \n- **DNS Servers**: \n\n## Security\n- Network Security Groups: \n- Route Tables: ",
  "icon": "network",
  "isContainer": true,
  "defaultWidth": 800,
  "defaultHeight": 600,
  "color": "#0078D4",
  "defaultProps": {
    "addressSpace": "10.0.0.0/16"
  },
  "tags": ["network", "vnet", "isolation"],
  "docsUrl": "https://docs.microsoft.com/en-us/azure/virtual-network/"
}
```

### Step 3: Rebuild & Reload

```bash
npm run build
```

Then reload Obsidian (Cmd+R).

---

## 🎯 Container Node Behavior

### Visual Indicators

**Regular Nodes:**
- Solid background color
- Centered text
- Fixed size (160x90px default)
- No resize handles

**Container Nodes:**
- Dashed border
- Left-aligned text
- Custom size (from JSON)
- **Resize handles when selected** (drag corners to resize)
- Lighter background (8% opacity vs 15%)
- Inset shadow

### How to Use

1. **Add a container node** (e.g., VPC) to the diagram
2. **Resize if needed** - Select the node, drag corner handles
3. **Add child components** - Drag EC2, RDS, etc. into the VPC
4. **Visual hierarchy** - Components inside appear "within" the container

### React Flow Integration

Container nodes use React Flow's `NodeResizer` component:

```tsx
{isContainer && (
  <NodeResizer
    color={color}
    isVisible={selected}
    minWidth={200}
    minHeight={150}
    handleStyle={{
      width: 10,
      height: 10,
      borderRadius: '50%',
    }}
  />
)}
```

---

## 🔧 Technical Implementation

### CloudComponentNode Updates

**File:** `src/ui/nodes/CloudComponentNode.tsx`

**Key Changes:**
1. Import `NodeResizer` from `reactflow`
2. Check `data.isContainer` property
3. Apply container-specific styles
4. Conditionally render `NodeResizer`

```tsx
const isContainer = data.isContainer || false;

const baseStyles = {
  padding: isContainer ? '16px' : SPACING.padding.card,
  border: isContainer ? `2px dashed ${hexToRgba(color, 0.5)}` : 'none',
  minWidth: isContainer ? 'auto' : NODE_DIMENSIONS.minWidth,
  // ... more container-specific styles
};
```

### Node Factory Updates

**File:** `src/ui/canvas/utils/node-factory.ts`

**Key Changes:**
1. Pass `isContainer` from component definition to node data
2. Set `style.width` and `style.height` for container nodes
3. Apply component color to node data

```tsx
const node: Node<CloudComponentNodeData> = {
  id,
  type: 'cloudComponent',
  position,
  data: {
    // ... other properties
    isContainer: component.isContainer || false,
    color: component.color,
  },
};

// Set dimensions for container nodes
if (component.isContainer && component.defaultWidth && component.defaultHeight) {
  node.style = {
    width: component.defaultWidth,
    height: component.defaultHeight,
  };
}
```

### Type Definitions

**File:** `src/types/canvas-types.ts`

Added `isContainer` to `CloudComponentNodeData`:

```tsx
export interface CloudComponentNodeData extends BaseNodeData {
  // ... existing properties
  isContainer?: boolean; // v1.0.0: Container support
}
```

---

## 📊 Component Properties Reference

### All Available Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `id` | string | ✅ Yes | - | Unique identifier |
| `name` | string | ✅ Yes | - | Display name |
| `provider` | string | ✅ Yes | - | Cloud provider |
| `category` | string | ✅ Yes | - | Component category |
| `type` | string | ✅ Yes | - | Specific type |
| `description` | string | ✅ Yes | - | Short description |
| `icon` | string | ✅ Yes | - | Lucide icon name |
| `color` | string | ✅ Yes | - | Hex color code |
| `defaultNoteText` | string | ❌ No | `""` | Markdown template |
| `isContainer` | boolean | ❌ No | `false` | Enable resize |
| `defaultWidth` | number | ❌ No | `160` | Initial width (px) |
| `defaultHeight` | number | ❌ No | `90` | Initial height (px) |
| `defaultProps` | object | ❌ No | `{}` | Custom properties |
| `tags` | array | ❌ No | `[]` | Search tags |
| `docsUrl` | string | ❌ No | `null` | Documentation URL |

### Provider Values

- `aws` - Amazon Web Services
- `azure` - Microsoft Azure
- `gcp` - Google Cloud Platform
- `saas` - Software as a Service
- `it` - IT / On-Premise
- `other` - Other providers

### Category Values

- `compute` - Virtual machines, functions
- `storage` - Object, block, file storage
- `database` - SQL, NoSQL databases
- `networking` - VPC, load balancers, DNS
- `security` - Firewalls, IAM, secrets
- `analytics` - Data processing, BI
- `integration` - API, messaging, queues
- `container` - Docker, Kubernetes
- `serverless` - Lambda, Cloud Functions
- `messaging` - SQS, SNS, Event Grid
- `cdn` - Content delivery networks
- `monitoring` - CloudWatch, Application Insights
- `other` - Uncategorized

---

## 🎨 Icon Reference

BAC4 uses [Lucide Icons](https://lucide.dev/icons/). Common icons for components:

| Icon | Usage |
|------|-------|
| `network` | VPC, VNet, networks |
| `server` | EC2, VMs, compute |
| `database` | RDS, SQL databases |
| `hard-drive` | EBS, block storage |
| `folder-tree` | EFS, file storage |
| `box` | Containers (ECS, Docker) |
| `boxes` | Kubernetes (EKS, AKS, GKE) |
| `function-square` | Lambda, Functions, serverless |
| `globe` | CDN, public services |
| `shield` | Security, firewalls |
| `git-fork` | Load balancers |
| `cpu` | Compute-intensive services |
| `container` | Fargate, serverless containers |
| `table` | DynamoDB, NoSQL |
| `archive` | Glacier, archive storage |
| `map-pin` | Route 53, DNS |
| `share-2` | API Gateway |

[Browse all 1000+ icons →](https://lucide.dev/icons/)

---

## 🔄 Migration from Old System

### What Changed?

**Before (v0.8.0):**
- Components defined in TypeScript files
- Hard-coded in `component-library/aws/*.ts`
- Required code changes to add components

**After (v1.0.0):**
- Components defined in `components.json`
- Single source of truth
- No code changes needed - just edit JSON

### Backwards Compatibility

✅ **Fully compatible** - No breaking changes to existing diagrams
✅ **Old components work** - Legacy TypeScript definitions still loaded
✅ **New format preferred** - Future components should use JSON

---

## 📝 Best Practices

### Component Naming

- **IDs**: Use lowercase with hyphens (e.g., `aws-vpc`, `azure-sql`)
- **Names**: Use official service names (e.g., "VPC", "Lambda", "S3")
- **Types**: Be specific (e.g., "network-isolation", "serverless-function")

### Container Sizing

- **VPC/VNet**: 800x600 (largest containers)
- **Subnets**: 400x300 (mid-sized)
- **Clusters (ECS/EKS)**: 500x350
- **Regular nodes**: 160x90 (default)

### Color Schemes

**AWS:**
- General/Compute: `#FF9900`
- Storage: `#569A31`
- Database: `#3B48CC`
- Networking: `#8C4FFF`

**Azure:**
- All services: `#0078D4`

**GCP:**
- All services: `#4285F4`

### Documentation Templates

```markdown
# Component Name

## Configuration
- **Property 1**:
- **Property 2**:

## Security
- Access Control:
- Encryption:

## Monitoring
- Metrics:
- Alerts:
```

---

## 🐛 Troubleshooting

### Components not showing in palette

1. Check JSON syntax (no trailing commas!)
2. Validate against schema: `components-schema.json`
3. Check browser console for errors
4. Rebuild: `npm run build`
5. Reload Obsidian (Cmd+R)

### Container not resizing

1. Ensure `"isContainer": true` in JSON
2. Ensure `defaultWidth` and `defaultHeight` are set
3. Select the node to see resize handles
4. Check browser console for React Flow errors

### Icons not displaying

1. Verify icon exists at [lucide.dev](https://lucide.dev/icons/)
2. Use exact icon name (case-sensitive)
3. Common mistake: `"server"` not `"Server"`

### Wrong colors

1. Use hex format: `"#FF9900"` (with #)
2. Avoid CSS color names (use hex instead)
3. Check alpha transparency in component rendering

---

## 📚 Related Documentation

- [Component Library README](../component-library/README.md)
- [JSON Schema](../component-library/components-schema.json)
- [Main Plugin README](../README.md)
- [React Flow Docs](https://reactflow.dev/)
- [Lucide Icons](https://lucide.dev/)

---

## ✅ Summary

You now have a **fully JSON-based, extensible component library** with:

✅ **18 AWS components** predefined
✅ **4 container nodes** (VPC, Subnet, ECS, EKS)
✅ **Resize functionality** for containers
✅ **Easy extensibility** - just edit JSON
✅ **No code changes needed** to add components

**Next Steps:**
1. Try adding a container node (VPC) to a diagram
2. Resize it by selecting and dragging corners
3. Add components inside it (EC2, RDS)
4. Experiment with adding new components to `components.json`

Happy diagramming! 🎉
