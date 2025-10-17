# Contributing to BAC4 Plugin

Thank you for your interest in contributing to the BAC4 Plugin! This guide will help you get started with contributing to this Obsidian plugin for AI-native cloud architecture management.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Extension Guides](#extension-guides)
- [Need Help?](#need-help)

---

## Code of Conduct

This project follows a simple code of conduct:

- **Be respectful** - Treat all contributors with respect
- **Be constructive** - Provide helpful feedback
- **Be collaborative** - Work together to improve the project
- **Be patient** - Remember everyone is learning

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v8 or higher
- **Git**
- **Obsidian** desktop app (for testing)
- **TypeScript** knowledge (recommended)
- **React** knowledge (recommended)

### Quick Start

1. **Fork the repository**
   ```bash
   # On GitHub, click "Fork" button
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/bac4.git
   cd bac4
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build the plugin**
   ```bash
   npm run build
   ```

5. **Symlink to Obsidian vault** (for testing)
   ```bash
   # macOS/Linux
   ln -s $(pwd) /path/to/your/vault/.obsidian/plugins/bac4

   # Windows (run as Administrator)
   mklink /D "C:\path\to\vault\.obsidian\plugins\bac4" "C:\path\to\bac4"
   ```

6. **Enable in Obsidian**
   - Settings → Community Plugins → Enable "BAC4"

---

## Development Setup

### Development Mode

Run in watch mode to automatically rebuild on changes:

```bash
npm run dev
```

Then reload the plugin in Obsidian:
- Windows/Linux: `Ctrl + R`
- macOS: `Cmd + R`

### IDE Setup

**Recommended: Visual Studio Code**

Install extensions:
- ESLint
- Prettier
- TypeScript
- React Developer Tools (for Obsidian DevTools)

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Project Structure

```
bac4/
├── src/                          # Source code
│   ├── main.ts                   # Plugin entry point
│   ├── core/                     # Core plugin functionality
│   │   ├── constants.ts          # Plugin constants
│   │   └── settings.ts           # Plugin settings
│   ├── ui/                       # React components
│   │   ├── canvas-view.tsx       # Main canvas view
│   │   ├── nodes/                # Custom node components
│   │   ├── edges/                # Custom edge components
│   │   ├── components/           # UI components
│   │   └── canvas/               # Canvas utilities and hooks
│   ├── services/                 # Business logic
│   │   ├── component-library-service.ts
│   │   └── diagram-navigation-service.ts
│   ├── data/                     # Data layer
│   │   ├── file-io.ts
│   │   └── project-structure.ts
│   ├── constants/                # Application constants
│   │   ├── ui-constants.ts
│   │   ├── timing-constants.ts
│   │   ├── validation-constants.ts
│   │   └── export-constants.ts
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── commands/                 # Plugin commands
├── component-library/            # Cloud component definitions
│   ├── aws/                      # AWS services
│   ├── azure/                    # Azure services (planned)
│   ├── gcp/                      # GCP services (planned)
│   └── types.ts                  # Library types
├── tests/                        # Test files
├── docs/                         # Documentation
│   └── guides/                   # Developer guides
├── styles.css                    # Plugin styles
├── manifest.json                 # Obsidian manifest
└── package.json                  # Dependencies
```

---

## Development Workflow

### Branching Strategy

- **main** - Production-ready code
- **feature/your-feature-name** - New features
- **fix/bug-description** - Bug fixes
- **refactor/area-name** - Code refactoring

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test thoroughly**
   ```bash
   npm test              # Run tests
   npm run typecheck     # Check TypeScript
   npm run lint          # Check code style
   npm run fix           # Auto-fix formatting
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add Azure component library
fix: resolve edge label update bug
docs: update installation guide
refactor: extract FormField component
test: add canvas-utils test suite
```

---

## Coding Standards

### General Principles

1. **Component Size Policy** 🚨 **CRITICAL**
   - Files **MUST NOT** exceed 500 lines → Refactor immediately
   - Files **SHOULD NOT** exceed 300 lines → Plan refactoring
   - Functions **SHOULD NOT** exceed 50 lines → Extract helpers
   - React components **SHOULD NOT** exceed 200 lines → Extract child components

2. **Separation of Concerns**
   - **Components** = UI rendering only
   - **Services** = Business logic, file operations
   - **Utilities** = Pure functions, helpers

3. **Constants Usage**
   - **ALWAYS** import from `src/constants/*`
   - **NEVER** use inline values for spacing, colors, timings
   - **ADD** new constants if used 2+ times across files

### TypeScript Standards

✅ **Do:**
```typescript
// Use proper interfaces
interface NodeData {
  label: string;
  color?: string;
}

// Use type guards
function isValidType(value: unknown): value is DiagramType {
  return typeof value === 'string' && DIAGRAM_TYPES.includes(value as DiagramType);
}

// Import constants
import { SPACING, UI_COLORS, FONT_SIZES } from '../../constants';
```

❌ **Don't:**
```typescript
// No 'any' types
const data: any = getData();

// No inline values
style={{ padding: '6px 8px', fontSize: '11px' }}

// No hardcoded strings
if (type === 'context') { /* ... */ }
```

### React Component Standards

✅ **Do:**
```typescript
/**
 * ComponentName - Brief description
 *
 * @example
 * ```tsx
 * <ComponentName prop={value} />
 * ```
 */
export const ComponentName: React.FC<Props> = React.memo(({ prop1, prop2 }) => {
  // Use constants
  const styles = {
    padding: SPACING.padding.card,
    fontSize: FONT_SIZES.normal,
    color: UI_COLORS.textNormal,
  };

  // Use useCallback for handlers
  const handleClick = React.useCallback(() => {
    // Handler logic
  }, [dependencies]);

  return <div style={styles}>...</div>;
});
```

### JSDoc Documentation

Document all public functions, components, and complex logic:

```typescript
/**
 * Creates a child diagram linked to a parent node
 *
 * This establishes a hierarchical relationship between diagrams, allowing
 * users to drill down from Context → Container → Component.
 *
 * @param parentPath - Absolute path to parent diagram file
 * @param nodeId - ID of parent node to link from
 * @param nodeLabel - Label of parent node, used for child diagram filename
 * @param parentType - Type of parent diagram ("context" or "container")
 * @param childType - Type of child to create ("container" or "component")
 * @returns Absolute path to the created child diagram
 *
 * @throws {Error} If parent diagram doesn't exist in relationships file
 *
 * @example
 * ```typescript
 * const childPath = await service.createChildDiagram(
 *   'Context.bac4',
 *   'node-1',
 *   'Payment System',
 *   'context',
 *   'container'
 * );
 * ```
 */
async createChildDiagram(...) { ... }
```

### Extension Points

Look for `<AI_MODIFIABLE>` tags in the codebase - these mark safe extension points:

```typescript
// <AI_MODIFIABLE>
const nodeTypes: NodeTypes = {
  c4: C4Node,
  system: SystemNode,
  // Add your new node type here:
  // yourNodeType: YourNode,
};
// </AI_MODIFIABLE>
```

---

## Testing Guidelines

### Running Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Writing Tests

Create test files next to source files:

```
src/utils/canvas-utils.ts
tests/utils/canvas-utils.test.ts
```

**Example test:**
```typescript
import { canDrillDown } from '../../src/ui/canvas/utils/canvas-utils';

describe('canDrillDown', () => {
  it('should allow system nodes in context diagrams', () => {
    expect(canDrillDown('system', 'context')).toBe(true);
  });

  it('should not allow person nodes to drill down', () => {
    expect(canDrillDown('person', 'context')).toBe(false);
  });
});
```

### Test Coverage Goals

- **Critical utilities:** 100% coverage (error handling, auto-naming, canvas utils)
- **Services:** 70% coverage (incremental additions)
- **Components:** Optional (tsx excluded from Jest)

---

## Submitting Changes

### Before You Submit

1. **Run all checks:**
   ```bash
   npm run typecheck   # TypeScript
   npm test            # Tests
   npm run lint        # Linting
   npm run fix         # Auto-fix issues
   npm run build       # Ensure it builds
   ```

2. **Test in Obsidian:**
   - Create/edit diagrams
   - Test navigation
   - Verify no console errors

3. **Update documentation:**
   - Update README if needed
   - Add comments to complex code
   - Update relevant guides in `docs/guides/`

### Creating a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/my-new-feature
   ```

2. **Create PR on GitHub:**
   - Use descriptive title (following commit convention)
   - Explain what changed and why
   - Reference any related issues
   - Add screenshots for UI changes

3. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tested in Obsidian
   - [ ] Added/updated tests
   - [ ] All tests passing
   - [ ] TypeScript compiles
   - [ ] No lint errors

   ## Screenshots (if applicable)
   [Add screenshots here]

   ## Additional Notes
   Any additional context
   ```

4. **Respond to feedback:**
   - Address reviewer comments
   - Make requested changes
   - Re-test after changes

---

## Extension Guides

Comprehensive guides for extending BAC4:

- **[Adding Node Types](./docs/guides/adding-node-types.md)** - Create custom diagram nodes
- **[Adding Diagram Types](./docs/guides/adding-diagram-types.md)** - Extend the C4 hierarchy
- **[Adding Cloud Providers](./docs/guides/adding-cloud-providers.md)** - Add Azure, GCP, etc.

Each guide includes:
- Step-by-step instructions
- Code examples
- Testing procedures
- Troubleshooting tips

---

## Project Guidelines

### Performance

- Use `React.memo()` for pure components
- Use `useCallback()` for event handlers
- Avoid inline object/array creation in props
- See `docs/performance-optimizations.md` for details

### Accessibility

- Add ARIA labels to interactive elements
- Use semantic HTML
- Support keyboard navigation
- Test with keyboard only (unplug mouse!)
- See `docs/accessibility.md` for details

### Security

- Never commit secrets or API keys
- Validate all user inputs
- Sanitize file paths
- Use Obsidian's API for file operations (not Node.js `fs`)

---

## Need Help?

### Resources

- **Documentation:** `docs/` directory
- **Developer Guides:** `docs/guides/`
- **Code Comments:** Look for JSDoc comments
- **Extension Points:** Search for `<AI_MODIFIABLE>` tags

### Getting Support

- **Issues:** [GitHub Issues](https://github.com/DavidROliverBA/bac4/issues)
- **Discussions:** Use GitHub Discussions for questions
- **Pull Requests:** Open draft PRs for early feedback

### Common Questions

**Q: How do I add a new node type?**
A: See `docs/guides/adding-node-types.md`

**Q: How do I test changes?**
A: Symlink to Obsidian vault, run `npm run dev`, reload plugin with `Cmd+R`

**Q: Where should I add business logic?**
A: In `src/services/` - keep components presentational

**Q: How do I fix TypeScript errors?**
A: Run `npm run typecheck` to see all errors, never use `any` as an escape hatch

**Q: Can I use emojis in code?**
A: Only in user-facing content (node icons, etc.), not in code comments

---

## Recognition

Contributors are recognized in the following ways:

- Listed in GitHub contributors
- Mentioned in release notes for significant contributions
- Credited in commit co-authorship for pair programming

---

## License

By contributing to BAC4 Plugin, you agree that your contributions will be licensed under the project's license.

---

## Thank You!

Thank you for contributing to BAC4 Plugin! Your efforts help make cloud architecture management more accessible and AI-friendly.

**Happy coding! 🚀**
