# bac4 - The Solution Architects Toolbox

**Version:** 2.3.0
**Status:** Production-Ready

An Obsidian plugin that transforms your vault into a comprehensive enterprise architecture management platform. Implements a 7-layer enterprise architecture model extending the C4 approach from market strategy to implementation code.

---

## 7-Layer Enterprise Architecture Model

BAC4 v2.0 implements a complete enterprise architecture framework:

1. **Layer 1: Market** - Market segments, customer needs, trends
2. **Layer 2: Organisation** - Business units, departments, teams
3. **Layer 3: Capability** - Business capabilities and functions
4. **Layer 4: Context** - C4 Level 1 - System landscape
5. **Layer 5: Container** - C4 Level 2 - Technical containers
6. **Layer 6: Component** - C4 Level 3 - Internal components
7. **Layer 7: Code** - Implementation artifacts, code repositories

Each layer has specialized node types and validation rules to ensure architectural consistency.

---

## Installation

### Method 1: Community Plugins (Recommended)

> **Note:** Coming soon to Obsidian Community Plugins! For now, use manual installation below.

1. Open Obsidian Settings
2. Navigate to **Community Plugins**
3. Disable **Restricted Mode** (if enabled)
4. Click **Browse** and search for "BAC4"
5. Click **Install**
6. Enable the plugin in the **Installed Plugins** list

### Method 2: Manual Installation from GitHub Release

1. **Download the latest release** from [GitHub Releases](https://github.com/DavidROliverBA/bac4/releases)
   - Download `bac4-v2.0.0.zip`

2. **Extract the files** to your vault's plugins folder:
   ```bash
   # Navigate to your vault's plugins directory
   cd /path/to/your-vault/.obsidian/plugins/

   # Create BAC4 plugin directory
   mkdir bac4

   # Extract the zip contents into the directory
   unzip ~/Downloads/bac4-v2.0.0.zip -d bac4/
   ```

3. **Enable the plugin** in Obsidian:
   - Open Obsidian Settings
   - Go to **Community Plugins**
   - Find "BAC4" in your installed plugins
   - Toggle it **ON**

4. **Reload Obsidian** (Cmd+R on Mac, Ctrl+R on Windows/Linux)

### Method 3: Manual Installation (BRAT)

If you use the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat):

1. Install and enable BRAT from Community Plugins
2. Open BRAT settings
3. Click **Add Beta plugin**
4. Enter: `DavidROliverBA/bac4`
5. Enable BAC4 in Community Plugins

### Verify Installation

After installation, verify BAC4 is working:

1. Open Command Palette (Cmd+P / Ctrl+P)
2. Type "BAC4"
3. You should see commands like:
   - `BAC4: Create New Market Diagram (Layer 1)`
   - `BAC4: Create New Organisation Diagram (Layer 2)`
   - `BAC4: Create New Capability Diagram (Layer 3)`
   - `BAC4: Create New Context Diagram (Layer 4)`
   - And more for each layer...

---

## Features

### Core Architecture Editor

- Visual canvas powered by React Flow
- 7 specialized diagram types (one per layer)
- Layer-specific validation rules
- Custom node types for each architectural layer
- Directional edges with labels
- Property panel for editing node/edge properties
- Auto-save with debouncing

### 7-Layer Node Types

**Layer 1: Market**
- Market segment nodes with market size, growth rate, competitors, trends

**Layer 2: Organisation**
- Organisation nodes with business units, departments, headcount, locations

**Layer 3: Capability**
- Capability nodes for business and technical capabilities

**Layer 4: Context (C4 Level 1)**
- System and Person nodes for system landscape diagrams

**Layer 5: Container (C4 Level 2)**
- Container nodes for applications, databases, file systems

**Layer 6: Component (C4 Level 3)**
- Component and Cloud Component nodes for internal components
- AWS, Azure, GCP component libraries

**Layer 7: Code**
- Code artifact nodes with GitHub integration
- Support for files, classes, functions, schemas, tables

### Hierarchical Navigation

- Drill-down: Double-click nodes to open child diagrams
- Property panel linking: Connect diagrams via dropdowns
- Self-contained links embedded in node data
- Auto-update references when files are renamed
- Layer validation prevents mixing incompatible node types

### Cloud Component Library

- AWS services (Lambda, S3, DynamoDB, API Gateway, etc.)
- Drag & drop cloud components onto Component diagrams
- Component palette (context-aware)
- Extensible to Azure and GCP

### Export Options

- PNG, JPEG, SVG export
- Obsidian Canvas format (.canvas)
- Native Graph View with diagram relationships

### File Management

- `.bac4` file format (timeline-based JSON)
- Version metadata embedded
- Git-friendly JSON format
- Multi-tab support
- Auto-registration of node relationships

---

## Quick Start

### Create Your First Diagram

1. **Install the plugin** (see Installation above)
2. **Reload Obsidian** (Cmd+R or Ctrl+R)
3. **Open Command Palette** (Cmd+P)
4. **Choose layer:**
   - `BAC4: Create New Market Diagram (Layer 1)` - Start with market strategy
   - `BAC4: Create New Context Diagram (Layer 4)` - Start with system architecture
   - Or any other layer based on your needs

### Basic Workflow

1. **Select diagram type** using the layer selector dropdown
2. **Add nodes** by clicking toolbar buttons or dragging
3. **Connect nodes** by dragging from one node to another
4. **Edit properties** using the right-side property panel
5. **Link to child diagrams** via property panel dropdowns
6. **Export** using toolbar buttons (PNG, SVG, Canvas)

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Obsidian desktop application
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DavidROliverBA/bac4.git
   cd bac4
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Link to Obsidian vault for testing:
   ```bash
   # Create a symlink in your vault's plugins folder
   ln -s /path/to/bac4 /path/to/your-vault/.obsidian/plugins/bac4
   ```

5. Enable the plugin in Obsidian:
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "BAC4"

### Development Commands

```bash
npm run dev          # Watch mode with hot reload
npm run build        # Production build
npm test             # Run unit tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Coverage report
npm run lint         # Lint TypeScript
npm run format       # Format with Prettier
npm run fix          # Format + lint fix
npm run typecheck    # TypeScript checking
```

### Project Structure

```
bac4/
├── src/
│   ├── core/              # Core plugin logic, settings
│   ├── ui/
│   │   ├── canvas-view.tsx       # Main React Flow canvas
│   │   ├── nodes/                # Custom node components
│   │   ├── components/           # UI components (toolbar, panels)
│   │   ├── modals/               # Modal dialogs
│   │   └── settings-tab.ts       # Settings UI
│   ├── services/
│   │   ├── diagram-navigation-service.ts
│   │   └── component-library-service.ts
│   ├── data/              # File I/O, parsing
│   ├── utils/             # Utility functions
│   │   └── layer-validation.ts  # Layer validation rules
│   └── main.ts            # Plugin entry point
├── component-library/     # Cloud component definitions
│   ├── aws/
│   └── saas/
├── tests/                 # Unit tests
├── docs/                  # Documentation
│   ├── versions/          # Historical version docs
│   └── releases/          # Release notes
├── manifest.json          # Obsidian plugin manifest
└── package.json           # Dependencies
```

---

## Architecture

BAC4 follows a layered plugin architecture:

### Layers

1. **UI Layer** (React + React Flow)
   - Canvas editor with custom nodes/edges
   - Unified toolbar with layer selector
   - Property panel for editing
   - Layer-specific validation

2. **Service Layer**
   - `DiagramNavigationService` - Hierarchy management
   - `ComponentLibraryService` - Cloud component library
   - `ErrorHandler` - Centralized error handling

3. **Data Layer**
   - `.bac4` timeline-based JSON format
   - File I/O with Obsidian vault API
   - Auto-save with debouncing
   - Layer validation utilities

### Key Technologies

- **Frontend:** React 19, TypeScript
- **Canvas:** React Flow (XyFlow)
- **Build:** esbuild
- **Testing:** Jest, ts-jest
- **Formatting:** Prettier, ESLint

---

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete developer context guide
- **[Layer Validation](src/utils/layer-validation.ts)** - Node type validation rules
- **[Version History](docs/versions/)** - Historical documentation

---

## Roadmap

BAC4 has an ambitious roadmap to become the definitive enterprise architecture platform. See **[ROADMAP.md](ROADMAP.md)** for the complete strategic vision.

### Near-Term Highlights

**v2.3.0 - Enhanced Navigation & UX** (Q4 2025)
- Click-through navigation between layers
- Breadcrumb trail across architectural layers
- Enhanced drill-down experience
- Accessibility improvements

**v2.4.0 - AI Integration** (Q1 2026)
- AI-powered diagram generation ✅ *Started in v2.2.0*
- Design analysis and anti-pattern detection
- Anthropic Claude API integration ✅ *Complete*
- MCP workflow support ✅ *Complete*

**v2.5.0 - Data Format Evolution** (Q1 2026) 🚧 *In Development*
- Dual-file format (semantic + presentation separation)
- Wardley Mapping support
- Graph database readiness
- Enhanced knowledge management

**v3.0.0 - Enterprise Features** (Q2 2026)
- Planned vs. Actual tracking
- Architectural drift detection
- Estate dashboard
- Team collaboration and role-based access

### Strategic Themes

1. **Dynamic Documentation & Modeling** - Visual + narrative architecture artifacts
2. **AI-Driven Insights** - Automated analysis, validation, and recommendations
3. **SDLC Integration** - Native integration with IDEs, CI/CD, and repositories
4. **Advanced Search & Traceability** - Semantic search and impact analysis
5. **Enterprise Knowledge Graph** - Connected systems, APIs, teams, and capabilities
6. **Standards Support** - TOGAF, ArchiMate, BPMN, UML interoperability
7. **Tacit Knowledge Capture** - Meeting transcripts, whiteboard recognition
8. **Security & Governance** - RBAC, audit trails, compliance
9. **Personalization** - Role-based views and intelligent workflows

**[View Complete Roadmap →](ROADMAP.md)**

---

## Contributing

Contributions are welcome! Please:

1. Read [CLAUDE.md](CLAUDE.md) for developer context
2. Run tests: `npm test`
3. Format code: `npm run fix`
4. Submit PR with clear description

### Code Quality Standards

Before committing:

```bash
npm run fix        # Format and lint
npm run typecheck  # Verify types
npm test           # Run tests
npm run build      # Ensure it builds
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Links

- **GitHub:** https://github.com/DavidROliverBA/bac4
- **Obsidian:** https://obsidian.md
- **C4 Model:** https://c4model.com

---

## Acknowledgments

- **Built with:** The BMAD Method (Breakthrough Method of Agile AI-driven Development)
- **AI Partner:** Claude Code (Anthropic)
- **Canvas Library:** React Flow / XyFlow
- **C4 Model:** Simon Brown

---

**Powered by AI, built for humans!**

*Last updated: 2025-10-22 (v2.3.0)*
