# Developer Guide: Adding Cloud Providers

**Last Updated:** 2025-10-12
**Difficulty:** Intermediate
**Time Required:** 1-2 hours

## Overview

This guide walks you through adding a new cloud provider to the BAC4 component library. Cloud providers (AWS, Azure, GCP, etc.) supply pre-defined components that users can drag onto Component diagrams.

---

## Prerequisites

- Understanding of TypeScript
- Familiarity with cloud service architectures
- Basic knowledge of BAC4's component library structure

---

## Component Library Architecture

### What is a Cloud Provider?

A cloud provider in BAC4:
1. **Component Definitions** - JSON-like objects defining cloud services
2. **Category Organization** - Services grouped by type (compute, storage, database, etc.)
3. **Visual Properties** - Icons, colors, default configurations
4. **Metadata** - Tags, documentation links, descriptions

### Existing Providers

| Provider | Status | Components | Location |
|----------|--------|------------|----------|
| **AWS** | ✅ Complete | 20+ | `component-library/aws/` |
| **Azure** | 🚧 Planned | - | `component-library/azure/` |
| **GCP** | 🚧 Planned | - | `component-library/gcp/` |
| **SaaS** | 🚧 Planned | - | `component-library/saas/` |

---

## Step-by-Step Guide

### Step 1: Create Provider Directory

Create a folder for your cloud provider:

```bash
mkdir -p component-library/azure
```

**Directory Structure:**
```
component-library/
├── azure/              # ← Your new provider
│   ├── index.ts       # Main export
│   ├── compute.ts     # Compute services
│   ├── storage.ts     # Storage services
│   ├── database.ts    # Database services
│   ├── networking.ts  # Networking services
│   └── ...            # Other categories
├── aws/               # Existing AWS provider
├── types.ts           # Shared types
└── index.ts           # Global export
```

---

### Step 2: Add Provider to Types

**File:** `component-library/types.ts`

```typescript
// <AI_MODIFIABLE>
/**
 * Cloud provider types
 */
export type CloudProvider =
  | 'aws'
  | 'azure'  // ← Add your provider here
  | 'gcp'
  | 'saas';
// </AI_MODIFIABLE>
```

This automatically updates the TypeScript union type!

---

### Step 3: Define Component Categories

Create category files for your provider. Start with **compute** as an example:

**File:** `component-library/azure/compute.ts`

```typescript
/**
 * Azure Compute Components
 */

import { ComponentDefinition } from '../types';

// <AI_MODIFIABLE>
export const azureComputeComponents: ComponentDefinition[] = [
  {
    id: 'azure-vm',                           // Unique ID (use provider-service format)
    name: 'Virtual Machine',                  // Display name
    provider: 'azure',                        // Provider type
    category: 'compute',                      // Component category
    description: 'Azure Virtual Machines',    // Short description
    icon: 'server',                           // Icon identifier (Lucide icon name)
    color: '#0078D4',                         // Azure brand color
    tags: ['compute', 'vm', 'iaas'],          // Search tags
    docsUrl: 'https://docs.microsoft.com/en-us/azure/virtual-machines/',
    defaultProps: {
      // Default properties users can edit
      size: 'Standard_B1s',
      os: 'Ubuntu 22.04',
    },
  },
  {
    id: 'azure-functions',
    name: 'Azure Functions',
    provider: 'azure',
    category: 'serverless',
    description: 'Event-driven serverless compute',
    icon: 'function-square',
    color: '#0078D4',
    tags: ['serverless', 'faas', 'function'],
    docsUrl: 'https://docs.microsoft.com/en-us/azure/azure-functions/',
    defaultProps: {
      runtime: 'dotnet',
      trigger: 'HTTP',
    },
  },
  {
    id: 'azure-container-instances',
    name: 'Container Instances',
    provider: 'azure',
    category: 'container',
    description: 'Run containers without servers',
    icon: 'box',
    color: '#0078D4',
    tags: ['container', 'docker', 'serverless'],
    docsUrl: 'https://docs.microsoft.com/en-us/azure/container-instances/',
  },
  // Add more compute components...
];
// </AI_MODIFIABLE>
```

---

### Step 4: Create Additional Category Files

Follow the same pattern for other categories:

#### **Storage** - `component-library/azure/storage.ts`

```typescript
import { ComponentDefinition } from '../types';

export const azureStorageComponents: ComponentDefinition[] = [
  {
    id: 'azure-blob-storage',
    name: 'Blob Storage',
    provider: 'azure',
    category: 'storage',
    description: 'Object storage for unstructured data',
    icon: 'database',
    color: '#0078D4',
    tags: ['storage', 'blob', 'object'],
    docsUrl: 'https://docs.microsoft.com/en-us/azure/storage/blobs/',
  },
  {
    id: 'azure-files',
    name: 'Azure Files',
    provider: 'azure',
    category: 'storage',
    description: 'Managed file shares',
    icon: 'folder',
    color: '#0078D4',
    tags: ['storage', 'file', 'smb'],
    docsUrl: 'https://docs.microsoft.com/en-us/azure/storage/files/',
  },
  // More storage components...
];
```

#### **Database** - `component-library/azure/database.ts`

```typescript
import { ComponentDefinition } from '../types';

export const azureDatabaseComponents: ComponentDefinition[] = [
  {
    id: 'azure-sql',
    name: 'Azure SQL Database',
    provider: 'azure',
    category: 'database',
    description: 'Managed relational database',
    icon: 'database',
    color: '#0078D4',
    tags: ['database', 'sql', 'relational'],
    docsUrl: 'https://docs.microsoft.com/en-us/azure/azure-sql/',
  },
  {
    id: 'azure-cosmos-db',
    name: 'Cosmos DB',
    provider: 'azure',
    category: 'database',
    description: 'Globally distributed NoSQL database',
    icon: 'globe',
    color: '#0078D4',
    tags: ['database', 'nosql', 'global'],
    docsUrl: 'https://docs.microsoft.com/en-us/azure/cosmos-db/',
  },
  // More database components...
];
```

---

### Step 5: Create Provider Index

**File:** `component-library/azure/index.ts`

```typescript
/**
 * Azure Component Library
 */

import { ComponentLibrary } from '../types';
import { azureComputeComponents } from './compute';
import { azureStorageComponents } from './storage';
import { azureDatabaseComponents } from './database';
// Import other categories...

// <AI_MODIFIABLE>
/**
 * Complete Azure component library
 */
export const azureLibrary: ComponentLibrary = {
  name: 'Azure',
  version: '1.0.0',
  provider: 'azure',
  components: [
    ...azureComputeComponents,
    ...azureStorageComponents,
    ...azureDatabaseComponents,
    // Add other categories...
  ],
};

// Export category arrays for convenience
export { azureComputeComponents } from './compute';
export { azureStorageComponents } from './storage';
export { azureDatabaseComponents } from './database';
// Export other categories...
// </AI_MODIFIABLE>
```

---

### Step 6: Register in Global Index

**File:** `component-library/index.ts`

```typescript
/**
 * Component Library Index
 * Central export point for all component libraries
 */

export * from './types';
export * from './aws';
export * from './azure'; // ← Add your provider

import { ComponentLibrary } from './types';
import { awsLibrary } from './aws';
import { azureLibrary } from './azure'; // ← Import your library

// <AI_MODIFIABLE>
/**
 * All available component libraries
 */
export const componentLibraries: ComponentLibrary[] = [
  awsLibrary,
  azureLibrary, // ← Add your library here
];
// </AI_MODIFIABLE>

// Existing helper functions work automatically!
// - getAllComponents()
// - getComponentsByProvider('azure')
// - getComponentsByCategory('compute')
// - searchComponents('virtual machine')
```

---

## Component Definition Reference

### Required Fields

```typescript
interface ComponentDefinition {
  id: string;                    // REQUIRED: Unique ID (format: provider-service)
  name: string;                  // REQUIRED: Display name
  provider: CloudProvider;       // REQUIRED: Provider type
  category: ComponentCategory;   // REQUIRED: Component category
  description: string;           // REQUIRED: Short description
  icon: string;                  // REQUIRED: Icon identifier
  color: string;                 // REQUIRED: Hex color code
}
```

### Optional Fields

```typescript
interface ComponentDefinition {
  // ... required fields ...

  defaultProps?: Record<string, any>;  // Default editable properties
  tags?: string[];                      // Search/filter tags
  docsUrl?: string;                     // Documentation link
}
```

---

## Icon Guidelines

### Available Icons

BAC4 uses **Lucide icons** (React Flow's icon library). Common icons for cloud components:

| Service Type | Recommended Icon | Example |
|--------------|------------------|---------|
| Virtual Machine | `server` | EC2, VM, Compute Engine |
| Serverless | `function-square` | Lambda, Functions, Cloud Run |
| Container | `box` | ECS, Container Instances |
| Orchestration | `boxes` | EKS, AKS, GKE |
| Database | `database` | RDS, SQL Database, Cloud SQL |
| Storage | `hard-drive` | S3, Blob Storage, Cloud Storage |
| Networking | `network` | VPC, VNet, Subnet |
| Load Balancer | `scale` | ALB, Load Balancer, GLB |
| CDN | `globe` | CloudFront, CDN, Cloud CDN |
| Queue | `list-ordered` | SQS, Queue Storage, Pub/Sub |
| Cache | `zap` | ElastiCache, Redis, Memorystore |

**Find more icons:** https://lucide.dev/icons/

---

## Color Guidelines

### Brand Colors

Use official brand colors for consistency:

| Provider | Primary Color | Hex Code |
|----------|---------------|----------|
| AWS | Orange | `#FF9900` |
| Azure | Blue | `#0078D4` |
| GCP | Blue | `#4285F4` |
| SaaS (Generic) | Gray | `#6B7280` |

### Category Color Variations

You can also vary colors by category:

```typescript
const azureColors = {
  compute: '#0078D4',    // Standard blue
  storage: '#008272',    // Green-blue
  database: '#0063B1',   // Dark blue
  networking: '#50E6FF', // Light blue
  security: '#FF6F00',   // Orange
};

// Usage:
{
  id: 'azure-blob-storage',
  // ...
  color: azureColors.storage,
}
```

---

## Testing Your Provider

### 1. Build and Verify

```bash
npm run build
```

Check for TypeScript errors. Ensure:
- All imports resolve
- Types are correct
- No compilation errors

### 2. Manual Testing

1. **Open Obsidian** with BAC4 plugin loaded
2. **Create Component Diagram**
3. **Open Component Palette** (top-right corner)
4. **Verify your provider appears**:
   - Provider tab (e.g., "Azure")
   - Components listed correctly
   - Icons display properly
   - Colors match brand

5. **Drag component to canvas**:
   - Component appears with correct styling
   - Default properties populated
   - Can edit in Property Panel

### 3. Search Testing

Test search functionality:

```typescript
// In browser console (Obsidian DevTools):
import { searchComponents } from './component-library';

// Should find your components:
searchComponents('virtual machine');  // → Azure VM
searchComponents('serverless');       // → Azure Functions, Lambda, etc.
searchComponents('azure');            // → All Azure components
```

---

## Advanced Features

### Custom Properties

Define editable properties for components:

```typescript
{
  id: 'azure-vm',
  name: 'Virtual Machine',
  // ...
  defaultProps: {
    size: 'Standard_B1s',
    os: 'Ubuntu 22.04',
    diskType: 'SSD',
    region: 'eastus',
  },
}
```

Users can edit these in the Property Panel.

### Service-Specific Icons

For services without good Lucide matches, use emoji:

```typescript
{
  id: 'azure-ai-ml',
  name: 'Azure Machine Learning',
  // ...
  icon: '🤖',  // Emoji as fallback
  color: '#0078D4',
}
```

### Multi-Category Components

Some services fit multiple categories:

```typescript
{
  id: 'azure-aks',
  name: 'AKS',
  provider: 'azure',
  category: 'container',  // Primary category
  // ...
  tags: ['container', 'kubernetes', 'orchestration', 'compute'],  // Multi-category via tags
}
```

### Regional Services

Add region information for global services:

```typescript
{
  id: 'azure-cosmos-db',
  name: 'Cosmos DB',
  // ...
  defaultProps: {
    primaryRegion: 'eastus',
    replicaRegions: ['westus', 'northeurope'],
    consistencyLevel: 'Session',
  },
}
```

---

## Component Library Best Practices

### ✅ Do's

1. **Use Official Names** - Match cloud provider's service names exactly
2. **Consistent Naming** - Use provider-service format for IDs (e.g., `azure-vm`)
3. **Comprehensive Tags** - Add all relevant search terms
4. **Accurate Descriptions** - Brief but precise (< 50 chars)
5. **Link Documentation** - Always include `docsUrl`
6. **Group Logically** - Organize by service category
7. **Brand Colors** - Use official provider colors
8. **Default Properties** - Add common configuration options

### ❌ Don'ts

1. **Don't Duplicate IDs** - Each component must have unique ID
2. **Don't Mix Providers** - Keep each provider in separate files
3. **Don't Overcomplicate** - Keep definitions simple and focused
4. **Don't Forget Types** - Always use proper TypeScript types
5. **Don't Use Custom Icons** - Stick to Lucide icons or emoji

---

## Example: Complete Azure Provider

### Minimal Azure Provider (10 Components)

**component-library/azure/index.ts:**
```typescript
import { ComponentLibrary } from '../types';

export const azureLibrary: ComponentLibrary = {
  name: 'Azure',
  version: '1.0.0',
  provider: 'azure',
  components: [
    // Compute
    { id: 'azure-vm', name: 'Virtual Machine', provider: 'azure', category: 'compute', description: 'Azure VMs', icon: 'server', color: '#0078D4' },
    { id: 'azure-functions', name: 'Functions', provider: 'azure', category: 'serverless', description: 'Serverless compute', icon: 'function-square', color: '#0078D4' },

    // Storage
    { id: 'azure-blob', name: 'Blob Storage', provider: 'azure', category: 'storage', description: 'Object storage', icon: 'database', color: '#0078D4' },
    { id: 'azure-files', name: 'Files', provider: 'azure', category: 'storage', description: 'File shares', icon: 'folder', color: '#0078D4' },

    // Database
    { id: 'azure-sql', name: 'SQL Database', provider: 'azure', category: 'database', description: 'Managed SQL', icon: 'database', color: '#0078D4' },
    { id: 'azure-cosmos', name: 'Cosmos DB', provider: 'azure', category: 'database', description: 'NoSQL database', icon: 'globe', color: '#0078D4' },

    // Networking
    { id: 'azure-vnet', name: 'Virtual Network', provider: 'azure', category: 'networking', description: 'Network isolation', icon: 'network', color: '#0078D4' },
    { id: 'azure-lb', name: 'Load Balancer', provider: 'azure', category: 'networking', description: 'Traffic distribution', icon: 'scale', color: '#0078D4' },

    // Container
    { id: 'azure-aci', name: 'Container Instances', provider: 'azure', category: 'container', description: 'Serverless containers', icon: 'box', color: '#0078D4' },
    { id: 'azure-aks', name: 'AKS', provider: 'azure', category: 'container', description: 'Kubernetes service', icon: 'boxes', color: '#0078D4' },
  ],
};
```

Then register in `component-library/index.ts`:
```typescript
import { azureLibrary } from './azure';

export const componentLibraries: ComponentLibrary[] = [
  awsLibrary,
  azureLibrary, // ← Add this line
];
```

Done! Your Azure provider is now available in the component palette.

---

## Troubleshooting

### Components Don't Appear in Palette

**Problem:** Added Azure provider but components not showing

**Solution:**
1. Check `componentLibraries` array in `component-library/index.ts`
2. Verify provider is exported from provider folder
3. Rebuild plugin: `npm run build`
4. Restart Obsidian
5. Check browser console for import errors

### Wrong Icons Display

**Problem:** Icons show as blank or incorrect

**Solution:**
1. Verify icon name matches Lucide icons: https://lucide.dev/icons/
2. Check for typos in icon names (case-sensitive)
3. Use emoji as fallback if no match: `icon: '☁️'`

### Search Not Working

**Problem:** Can't find components by searching

**Solution:**
1. Add comprehensive `tags` array to each component
2. Include service name variations (abbreviations, aliases)
3. Test with `searchComponents()` helper function

### TypeScript Errors

**Problem:** Type errors when adding provider

**Solution:**
1. Ensure added to `CloudProvider` union in `types.ts`
2. Verify all `ComponentDefinition` fields are present
3. Run `npm run typecheck` to find remaining errors
4. Check imports are correctly resolved

---

## Component Library Checklist

Before submitting your new cloud provider:

- [ ] Created provider directory in `component-library/`
- [ ] Added provider to `CloudProvider` type in `types.ts`
- [ ] Created category files:
  - [ ] `compute.ts` (minimum 3 components)
  - [ ] `storage.ts` (minimum 2 components)
  - [ ] `database.ts` (minimum 2 components)
  - [ ] `networking.ts` (optional)
  - [ ] Others as needed
- [ ] Created provider `index.ts` with library export
- [ ] Registered in global `component-library/index.ts`
- [ ] All components have:
  - [ ] Unique IDs (provider-service format)
  - [ ] Correct provider value
  - [ ] Valid category
  - [ ] Description under 50 chars
  - [ ] Valid Lucide icon or emoji
  - [ ] Brand color (hex format)
  - [ ] Comprehensive tags array
  - [ ] Documentation URL
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed:
  - [ ] Provider tab appears in palette
  - [ ] All components listed
  - [ ] Icons display correctly
  - [ ] Drag to canvas works
  - [ ] Colors match brand
  - [ ] Search finds components
- [ ] Minimum 10 components defined

---

## Related Guides

- [Adding Node Types](./adding-node-types.md) - Create custom nodes
- [Adding Diagram Types](./adding-diagram-types.md) - Create new diagram types
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - General contribution guidelines

---

## Reference Files

Key files for cloud provider implementation:

- **Types:** `component-library/types.ts`
- **Global Index:** `component-library/index.ts`
- **AWS Example:** `component-library/aws/`
- **Helper Functions:** `getAllComponents()`, `searchComponents()`, etc.

---

## Resources

- **Lucide Icons:** https://lucide.dev/icons/
- **AWS Architecture Icons:** https://aws.amazon.com/architecture/icons/
- **Azure Icons:** https://docs.microsoft.com/en-us/azure/architecture/icons/
- **GCP Icons:** https://cloud.google.com/icons
- **C4 Model:** https://c4model.com/

---

**Happy coding! ☁️**
