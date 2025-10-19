# BAC4 Component Library

The BAC4 Component Library is a JSON-based, extensible system for defining cloud components that can be used in C4 Component diagrams.

## 📋 Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Component Properties](#component-properties)
- [Adding New Components](#adding-new-components)
- [Container Components](#container-components)
- [JSON Schema](#json-schema)

## Overview

Components are defined in a single JSON file (`components.json`) that the plugin reads at startup. This makes it easy to:

- ✅ Add new cloud providers (Azure, GCP, etc.)
- ✅ Add new components without touching code
- ✅ Update component metadata (icons, colors, descriptions)
- ✅ Define container components (VPC, Subnets, ECS clusters)
- ✅ Customize default documentation templates

## File Structure

```
component-library/
├── components.json          # Main component definitions (EDIT THIS)
├── components-schema.json   # JSON schema for validation
├── README.md               # This file
└── types.ts                # TypeScript type definitions
```

## Component Properties

Each component in `components.json` has the following properties:

### Required Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | string | Unique identifier | `"aws-vpc"` |
| `name` | string | Display name | `"VPC"` |
| `provider` | string | Cloud provider | `"aws"`, `"azure"`, `"gcp"` |
| `category` | string | Component category | `"networking"`, `"compute"` |
| `type` | string | Specific type | `"network-isolation"` |
| `description` | string | Short description | `"Virtual Private Cloud"` |
| `icon` | string | Lucide icon name | `"network"`, `"server"` |
| `color` | string | Hex color code | `"#8C4FFF"` |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultNoteText` | string | `""` | Markdown template for documentation |
| `isContainer` | boolean | `false` | Can contain other components |
| `defaultWidth` | number | `160` | Initial width in pixels |
| `defaultHeight` | number | `90` | Initial height in pixels |
| `defaultProps` | object | `{}` | Component-specific properties |
| `tags` | array | `[]` | Search tags |
| `docsUrl` | string | `null` | Official documentation URL |

## Adding New Components

### Example: Adding Azure Virtual Network

1. Open `components.json`
2. Add a new component to the `components` array:

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

3. Save the file
4. Rebuild the plugin: `npm run build`
5. Reload Obsidian

## Container Components

Container components can hold other components inside them (e.g., VPC, Subnet, ECS Cluster).

### Properties for Container Components

Set `isContainer: true` and provide larger dimensions:

```json
{
  "id": "aws-vpc",
  "name": "VPC",
  "isContainer": true,
  "defaultWidth": 800,
  "defaultHeight": 600,
  ...
}
```

### Current Container Components

- **AWS VPC** (`aws-vpc`) - 800x600px
- **AWS Subnet** (`aws-subnet`) - 400x300px
- **AWS ECS** (`aws-ecs`) - 500x350px
- **AWS EKS** (`aws-eks`) - 500x350px

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│ VPC (800x600)                       │
│  ┌──────────────────────────────┐   │
│  │ Subnet (400x300)             │   │
│  │  ┌────────┐  ┌────────┐      │   │
│  │  │  EC2   │  │  RDS   │      │   │
│  │  └────────┘  └────────┘      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Default Note Templates

The `defaultNoteText` property provides a markdown template for documentation notes. Use markdown formatting:

```json
{
  "defaultNoteText": "# Component Name\n\n## Configuration\n- **Property 1**: \n- **Property 2**: \n\n## Notes\n"
}
```

### Template Best Practices

1. **Use headings** (`#`, `##`, `###`) for structure
2. **Use bullet points** for lists
3. **Use bold** (`**text**`) for labels
4. **Leave blank lines** for user input
5. **Include relevant sections** (Configuration, Security, Networking, etc.)

## JSON Schema

The `components-schema.json` file defines the structure and validation rules. Key points:

- **Providers**: `aws`, `azure`, `gcp`, `saas`, `it`, `other`
- **Categories**: `compute`, `storage`, `database`, `networking`, `security`, `analytics`, `integration`, `container`, `serverless`, `messaging`, `cdn`, `monitoring`, `other`
- **Icons**: Must be valid [Lucide](https://lucide.dev/) icon names
- **Colors**: Hex format (`#RRGGBB`) or CSS color names
- **Dimensions**: Minimum 50px for width/height

## Available Icons

Common Lucide icons for components:

| Icon | Usage |
|------|-------|
| `network` | VPC, networks |
| `server` | EC2, VMs |
| `database` | RDS, databases |
| `hard-drive` | EBS, storage |
| `box` | Containers |
| `function-square` | Lambda, functions |
| `globe` | CDN, public services |
| `shield` | Security, firewalls |
| `git-fork` | Load balancers |
| `cpu` | Compute services |

[Browse all Lucide icons →](https://lucide.dev/icons/)

## Provider Color Schemes

Recommended colors for each provider:

| Provider | Primary Color | Usage |
|----------|--------------|-------|
| AWS | `#FF9900` | Compute, general |
| AWS | `#569A31` | Storage |
| AWS | `#3B48CC` | Database |
| AWS | `#8C4FFF` | Networking |
| Azure | `#0078D4` | All services |
| GCP | `#4285F4` | All services |
| SaaS | `#6B46C1` | Third-party |

## Extending the System

### Adding a New Cloud Provider

1. Add components with `"provider": "your-provider"`
2. Choose a consistent color scheme
3. Follow the provider's icon guidelines
4. Update this README with provider info

### Adding New Categories

If the existing categories don't fit, propose a new one:

1. Add category to `components-schema.json`
2. Update `types.ts` ComponentCategory type
3. Use the new category in components

### Backwards Compatibility

The JSON format is versioned. When making breaking changes:

1. Increment `version` in `components.json`
2. Update schema `$schema` version
3. Document migration steps in CHANGELOG

## Troubleshooting

**Components not showing:**
- Check JSON syntax (no trailing commas!)
- Validate against schema
- Check browser console for errors

**Icons not displaying:**
- Verify icon name at [lucide.dev](https://lucide.dev)
- Use exact icon name (case-sensitive)

**Container components not resizing:**
- Ensure `isContainer: true`
- Set `defaultWidth` and `defaultHeight`
- Check browser console for warnings

## Next Steps

See the main [README](../README.md) for:
- Plugin installation
- Usage guide
- Contributing guidelines
