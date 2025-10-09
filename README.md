# BAC4 - AI-Native Cloud Architecture Management for Obsidian

An Obsidian plugin that transforms your vault into a comprehensive enterprise architecture management platform. Extends the C4 model with cloud-specific component mappings, tracks planned vs. actual architecture states, and provides AI-assisted architecture creation via Model Context Protocol.

## Features

- **C4 Diagram Editor**: Visual canvas for Context, Container, and Component diagrams
- **Cloud-Aware Components**: Pre-built libraries for AWS, Azure, and GCP services
- **Planned vs. Actual Tracking**: Detect architectural drift between design and implementation
- **Estate Dashboard**: Portfolio-level visibility across all architectural projects
- **AI-Assisted Architecture**: Generate and modify diagrams using natural language prompts
- **Git-Native**: All data stored as markdown/YAML/JSON for version control

## Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Obsidian desktop application
- Git

### Installation

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
   - Enable "BAC4 - Cloud Architecture Management"

### Development Commands

- `npm run dev` - Watch mode with hot reload
- `npm run build` - Production build
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Lint TypeScript code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run fix` - Run format + lint:fix
- `npm run typecheck` - TypeScript type checking

### Project Structure

```
bac4-plugin/
├── src/
│   ├── core/           # Core plugin logic
│   ├── ui/             # UI components (canvas, dashboard, etc.)
│   ├── services/       # Business logic services
│   ├── data/           # Data models and I/O
│   ├── utils/          # Utility functions
│   └── main.ts         # Plugin entry point
├── component-library/  # Cloud component definitions
│   ├── aws/
│   └── saas/
├── tests/              # Test files
├── docs/               # Documentation
├── manifest.json       # Obsidian plugin manifest
├── package.json        # Node dependencies
└── tsconfig.json       # TypeScript configuration
```

## Architecture

BAC4 follows a layered plugin architecture:

- **UI Layer**: Canvas editor, dashboard, prompt library, settings
- **Service Layer**: Project manager, diagram service, component library, MCP client
- **Data Layer**: File I/O, parsing, caching

See `docs/architecture.md` for detailed technical architecture.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Running Tests

```bash
npm test
```

### Code Quality

Before committing:

```bash
npm run fix        # Format and lint
npm run typecheck  # Verify types
npm test           # Run tests
```

## License

MIT License - see LICENSE file for details

## Links

- [Project Brief](./docs/brief.md)
- [PRD](./docs/prd.md)
- [Architecture](./docs/architecture.md)
- [GitHub Repository](https://github.com/DavidROliverBA/bac4-plugin)

## Acknowledgments

Built using the BMAD Method (Breakthrough Method of Agile AI-driven Development).

🤖 Initial project structure generated with Claude Code
