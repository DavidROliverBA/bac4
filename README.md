# BAC4 - AI-Native Cloud Architecture Management for Obsidian

**Version:** 0.3.0 🎉
**Status:** Production-Ready ✅

An Obsidian plugin that transforms your vault into a comprehensive enterprise architecture management platform. Extends the C4 model with cloud-specific component mappings and provides **THREE WAYS** to create diagrams: manual, AI API, or natural conversation with Claude Desktop via MCP.

---

## 📦 Installation

### Method 1: Community Plugins (Recommended)

> **Note:** Coming soon to Obsidian Community Plugins! For now, use manual installation below.

1. Open Obsidian Settings
2. Navigate to **Community Plugins**
3. Disable **Restricted Mode** (if enabled)
4. Click **Browse** and search for "BAC4"
5. Click **Install**
6. Enable the plugin in the **Installed Plugins** list

### Method 2: Manual Installation from GitHub Release

1. **Download the latest release** from [GitHub Releases](https://github.com/DavidROliverBA/bac4-plugin/releases)
   - Download `bac4-plugin-v0.3.0.zip`

2. **Extract the files** to your vault's plugins folder:
   ```bash
   # Navigate to your vault's plugins directory
   cd /path/to/your-vault/.obsidian/plugins/

   # Create BAC4 plugin directory
   mkdir bac4-plugin

   # Extract the zip contents into the directory
   unzip ~/Downloads/bac4-plugin-v0.3.0.zip -d bac4-plugin/
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
4. Enter: `DavidROliverBA/bac4-plugin`
5. Enable BAC4 in Community Plugins

### Verify Installation

After installation, verify BAC4 is working:

1. Open Command Palette (Cmd+P / Ctrl+P)
2. Type "BAC4"
3. You should see commands like:
   - `BAC4: Open Dashboard`
   - `BAC4: Generate Context Diagram from Description`
   - `BAC4: Import MCP-Generated Diagram`

---

## ✨ Highlights

- 🎨 **Visual C4 Diagram Editor** with drag-and-drop canvas
- ☁️ **Cloud Component Libraries** for AWS, Azure, and GCP
- 🤖 **AI-Powered Diagram Generation** (Anthropic API)
- 💬 **MCP Integration** - Chat with Claude Desktop to generate diagrams
- 🔗 **Hierarchical Navigation** with drill-down (Context → Container → Component)
- 📤 **Export** diagrams as PNG, JPEG, or SVG
- 📁 **Git-Native** - All data stored as JSON for version control

---

## 🚀 Three Ways to Create Diagrams

### **1. Manual Creation** (Full Control)
Drag and drop nodes, connect with edges, customize everything.

### **2. AI API Generation** (Fast & Convenient)
1. Get Anthropic API key
2. Use "Generate Diagram from Description" command
3. Describe architecture in modal
4. Diagram generated in ~5-10 seconds

### **3. MCP Workflow** ⭐ **NEW in v0.2.0!**
1. Chat with Claude Desktop
2. Describe your architecture naturally
3. Claude writes diagram to your vault
4. Run "Import MCP-Generated Diagram"
5. Done! (~3-5 seconds)

**See:** [MCP Workflow Guide](docs/MCP_WORKFLOW_GUIDE.md)

---

## 📋 Features

### **Core Diagram Editor**
- ✅ Visual canvas powered by React Flow
- ✅ Context, Container, and Component diagram types
- ✅ Custom node types (System, Person, Container, Cloud Component)
- ✅ Directional edges with labels (→, ←, ↔)
- ✅ Property panel for editing node/edge properties
- ✅ Auto-save with 1-second debounce
- ✅ Export to PNG, JPEG, SVG

### **Hierarchical Navigation**
- ✅ Drill-down: Double-click nodes to open child diagrams
- ✅ Breadcrumb navigation back up the hierarchy
- ✅ Property panel linking: Connect diagrams via dropdowns
- ✅ Auto-create child diagrams with "[+ Create New...]"
- ✅ Central relationship tracking in `diagram-relationships.json`

### **Cloud Component Library**
- ✅ AWS services (Lambda, S3, DynamoDB, API Gateway, etc.)
- ✅ Drag & drop cloud components onto Component diagrams
- ✅ Component palette (top-right, context-aware)
- ✅ Extensible to Azure and GCP

### **AI Integration** ⭐ **NEW!**

#### **Anthropic API Method:**
- ✅ Three generation commands (Context, Container, Component)
- ✅ Beautiful description modal with examples
- ✅ Smart response parsing (handles markdown code blocks)
- ✅ Secure API key storage (password-masked)
- ✅ Cost: ~$0.01 per diagram

#### **MCP Method:**
- ✅ Natural conversation with Claude Desktop
- ✅ No API key needed (uses Claude Pro/Max subscription)
- ✅ Direct file writing to vault via MCP
- ✅ One-command import
- ✅ Fastest generation (~3-5 seconds)
- ✅ **Best for:** Complex diagrams, iterative refinement

**See:** [AI Integration Guide](docs/AI_INTEGRATION_COMPLETE.md)

### **File Management**
- ✅ `.bac4` file format (pure JSON)
- ✅ Auto-naming (Generated_context_[timestamp].bac4)
- ✅ Duplicate tab prevention
- ✅ Multi-tab support (each tab independent)
- ✅ Auto-registration in relationships file

---

## 🎯 Quick Start

### **For Users:**

1. **Install the plugin** (from Obsidian Community Plugins or manual install)
2. **Reload Obsidian** (Cmd+R or Ctrl+R)
3. **Create your first diagram:**
   - **Option A:** Cmd+P → "BAC4: Open Dashboard" → Drag nodes manually
   - **Option B:** Cmd+P → "Generate Context Diagram" → Use AI API
   - **Option C:** Chat with Claude Desktop → Import via MCP

### **For MCP Workflow:**

**Prerequisites:**
- Claude Desktop installed (https://claude.ai/download)
- Claude Pro or Max subscription
- obsidian-mcp-tools plugin installed

**Usage:**
1. Open Claude Desktop
2. Say: "Create a Container diagram for [your architecture]"
3. Claude writes file to your vault
4. In Obsidian: Cmd+P → "Import MCP-Generated Diagram"
5. Done! ✨

**Full Guide:** [MCP Workflow Guide](docs/MCP_WORKFLOW_GUIDE.md)

---

## 💻 Development Setup

### **Prerequisites**

- Node.js 18+ and npm
- Obsidian desktop application
- Git

### **Installation**

1. Clone the repository:
   ```bash
   git clone https://github.com/DavidROliverBA/bac4-plugin.git
   cd bac4-plugin
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
   ln -s /path/to/bac4-plugin /path/to/your-vault/.obsidian/plugins/bac4-plugin
   ```

5. Enable the plugin in Obsidian:
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "BAC4"

### **Development Commands**

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

### **Project Structure**

```
bac4-plugin/
├── src/
│   ├── core/              # Core plugin logic, settings
│   ├── ui/
│   │   ├── canvas-view.tsx       # Main React Flow canvas
│   │   ├── nodes/                # Custom node components
│   │   ├── components/           # UI components (toolbar, panels)
│   │   ├── modals/               # Modal dialogs
│   │   └── settings-tab.ts       # Settings UI
│   ├── services/
│   │   ├── mcp-service.ts        # AI/MCP integration
│   │   ├── component-library-service.ts
│   │   └── diagram-navigation-service.ts
│   ├── data/              # File I/O, parsing
│   ├── utils/             # Utility functions
│   └── main.ts            # Plugin entry point
├── component-library/     # Cloud component definitions
│   ├── aws/
│   └── saas/
├── tests/                 # Unit tests (104 passing, 29.65% coverage)
├── docs/                  # Documentation
│   ├── AI_INTEGRATION_COMPLETE.md
│   ├── MCP_WORKFLOW_GUIDE.md
│   ├── MCP_INTEGRATION_STATUS.md
│   └── CLAUDE.md          # Developer context guide
├── examples/
│   └── mcp-diagram-generation-example.md
├── manifest.json          # Obsidian plugin manifest
└── package.json           # Dependencies
```

---

## 🏗️ Architecture

BAC4 follows a layered plugin architecture:

### **Layers:**

1. **UI Layer** (React + React Flow)
   - Canvas editor with custom nodes/edges
   - Unified toolbar with all controls
   - Property panel for editing
   - Modal dialogs for AI generation

2. **Service Layer**
   - `MCPService` - AI/MCP integration
   - `DiagramNavigationService` - Hierarchy management
   - `ComponentLibraryService` - Cloud component library
   - `ErrorHandler` - Centralized error handling

3. **Data Layer**
   - `.bac4` JSON file format
   - `diagram-relationships.json` for hierarchy
   - File I/O with Obsidian vault API
   - Auto-save with debouncing

### **Key Technologies:**

- **Frontend:** React 19, TypeScript
- **Canvas:** React Flow (XyFlow)
- **AI:** Anthropic SDK, MCP
- **Build:** esbuild
- **Testing:** Jest, ts-jest (104 tests passing)
- **Formatting:** Prettier, ESLint

**Full details:** [CLAUDE.md](CLAUDE.md)

---

## 📊 Test Coverage

| Category | Coverage | Tests | Status |
|----------|----------|-------|--------|
| Overall | 29.65% | 104 passing | ✅ Solid |
| Error handling | 100% | 16 tests | ✅ Complete |
| Auto-naming | 100% | 17 tests | ✅ Complete |
| Canvas utilities | 100% | 43 tests | ✅ Complete |
| Data utilities | 94.39% | 28 tests | ✅ Excellent |

**Target:** 70% coverage for services (deferred - complex mocking)

---

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Type] | [+ Node Buttons] | [Breadcrumbs] | [Actions] ←──  │ Unified Toolbar
├─────────────────────────────────────────────────────────────┤
│                                                    ┌────────┐│
│                                                    │Cloud   ││ Component Palette
│                                                    │Library ││ (top-right)
│                                                    └────────┘│
│                  CANVAS AREA                                │
│          (React Flow with nodes and edges)                  │
│                                                             │
│ ┌──────────────┐                                           │
│ │ Property     │                                           │
│ │ Panel        │ ←─────────────────────────────────────────│ Property Panel
│ └──────────────┘                            (bottom-left)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Features Comparison

| Feature | Manual | API Method | MCP Method |
|---------|--------|------------|------------|
| Setup | None | API key | Already done |
| Speed | Minutes | 5-10 sec | 3-5 sec |
| Cost | Free | $0.01/diagram | Free (with Pro) |
| UX | Full control | Good modal | Natural chat |
| Complexity | Any | Limited tokens | Any size |
| Best For | Custom designs | Quick generation | Complex systems |

---

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete developer context guide
- **[MCP Workflow Guide](docs/MCP_WORKFLOW_GUIDE.md)** - How to use Claude Desktop integration
- **[AI Integration Complete](docs/AI_INTEGRATION_COMPLETE.md)** - Technical implementation details
- **[MCP Integration Status](docs/MCP_INTEGRATION_STATUS.md)** - Feature status
- **[Example Diagrams](examples/mcp-diagram-generation-example.md)** - Sample use cases
- **[AI Extension Points](docs/AI_EXTENSION_POINTS.md)** - Safe extension guide

---

## 🎯 Roadmap

### **v0.2.0 - AI Integration** ✅ **COMPLETE**
- ✅ Anthropic API integration
- ✅ Three generation commands
- ✅ Description modal with examples
- ✅ MCP workflow support
- ✅ Import command
- ✅ Settings UI

### **v0.3.0 - Enhanced User Experience** ✅ **COMPLETE**
- ✅ Comprehensive installation documentation
- ✅ BRAT plugin support for beta testing
- ✅ Improved onboarding experience
- ✅ GitHub release automation
- ✅ Verified multi-tab stability

### **v0.4.0 - Advanced AI Features** (Planned)
- ⏳ Real-time diagram validation
- ⏳ AI suggestions while editing
- ⏳ Diagram improvement command
- ⏳ Documentation generation
- ⏳ Semantic search across diagrams

### **v0.4.0 - Multi-Cloud** (Planned)
- ⏳ Azure component library
- ⏳ GCP component library
- ⏳ Multi-cloud architecture patterns

### **v1.0.0 - Enterprise Features** (Planned)
- ⏳ Planned vs. Actual tracking
- ⏳ Architectural drift detection
- ⏳ Estate dashboard
- ⏳ Team collaboration features

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Read [CLAUDE.md](CLAUDE.md) for developer context
2. Check [AI Extension Points](docs/AI_EXTENSION_POINTS.md) for safe areas to modify
3. Run tests: `npm test`
4. Format code: `npm run fix`
5. Submit PR with clear description

### **Code Quality Standards**

Before committing:

```bash
npm run fix        # Format and lint
npm run typecheck  # Verify types
npm test           # Run tests
npm run build      # Ensure it builds
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🔗 Links

- **GitHub:** https://github.com/DavidROliverBA/bac4-plugin
- **Obsidian:** https://obsidian.md
- **Claude Desktop:** https://claude.ai/download
- **Anthropic API:** https://console.anthropic.com
- **MCP Protocol:** https://modelcontextprotocol.io

---

## 🙏 Acknowledgments

- **Built with:** The BMAD Method (Breakthrough Method of Agile AI-driven Development)
- **AI Partner:** Claude Code (Anthropic)
- **Canvas Library:** React Flow / XyFlow
- **C4 Model:** Simon Brown (https://c4model.com)

---

## 🎉 What's New in v0.3.0

### **Major Improvements:**

📦 **Enhanced Installation Experience**
- Comprehensive installation documentation
- Support for BRAT plugin (beta testing)
- Three installation methods documented
- Step-by-step verification guide
- Clear instructions for manual installation from GitHub releases

🔧 **Stability & Polish**
- Verified multi-tab rendering stability
- Improved documentation structure
- Better onboarding for new users
- GitHub release automation
- Production-ready for wider distribution

📚 **Documentation Enhancements**
- Dedicated installation section in README
- Clear verification steps
- Multiple installation paths (Community Plugins, Manual, BRAT)
- Updated roadmap with v0.3.0 features

### **Technical Updates:**

- ✅ Updated to version 0.3.0 across all manifests
- ✅ Improved README structure and clarity
- ✅ Added BRAT plugin support instructions
- ✅ Enhanced installation verification steps
- ✅ Maintained stability: 104 tests passing, 0 TypeScript errors
- ✅ Bundle size: 533.7kb (optimized)

---

## 📜 Previous Releases

### v0.2.0 - AI Integration (2025-10-13)
- 🎨 AI-Powered diagram generation (API + MCP)
- 💬 Claude Desktop integration via MCP
- ⚙️ Settings UI for API configuration
- 📊 Complete documentation and examples

### v0.1.0 - Core Features (2025-10-12)
- 🎨 Visual C4 diagram editor
- 🔗 Hierarchical navigation and drill-down
- ☁️ AWS component library
- 📤 PNG/JPEG/SVG export

---

🤖 **Powered by AI, built for humans!**

*Last updated: 2025-10-13*

