# ADR 004: Service Layer Architecture for Business Logic

**Date:** 2025-10-12
**Status:** Accepted
**Deciders:** Development Team
**Related:** Code Organization, Separation of Concerns, Refactoring Phases 1-3

---

## Context

BAC4 Plugin has complex business logic for:
- Diagram navigation and hierarchy management
- Component library loading and management
- File operations and validation
- Relationship tracking and updates

**Challenge:** Where should business logic live to maintain:
- Clean separation of concerns (UI vs logic)
- Testability (unit tests without React)
- Reusability (same logic across multiple components)
- Maintainability (clear boundaries between layers)

## Decision

**We implement a Service Layer Architecture: Business logic lives in service classes, React components remain purely presentational.**

## Alternatives Considered

### 1. **Service Layer Architecture** (CHOSEN)
- Business logic in dedicated service classes
- Services injected into components
- Components call service methods
- **Structure:**
  ```
  src/
  ├── services/              # Business logic
  │   ├── diagram-navigation-service.ts
  │   └── component-library-service.ts
  ├── ui/                    # Presentation
  │   ├── canvas-view.tsx
  │   └── components/
  ```
- **Pros:**
  - Clear separation of concerns
  - Highly testable (no React needed)
  - Reusable across components
  - Easy to mock in tests
  - Single responsibility principle
- **Cons:**
  - Slightly more code (service class + component)
  - Need to pass services to components

### 2. **Logic in React Components**
- All business logic inside components
- Use hooks and state management
- **Pros:**
  - Simple - everything in one place
  - No additional abstractions
- **Cons:**
  - ❌ Components become huge (500+ lines)
  - ❌ Difficult to test (need React testing library)
  - ❌ Hard to reuse logic across components
  - ❌ Mixing concerns (UI + business logic)
  - ❌ Complex components are hard to maintain

### 3. **Custom Hooks as Logic Layer**
- Extract logic into custom hooks
- Components call hooks
- **Example:**
  ```typescript
  function useDiagramNavigation() {
    const createChild = async (parent, child) => { /* logic */ };
    return { createChild };
  }
  ```
- **Pros:**
  - React-native approach
  - Can use React features (useEffect, etc.)
- **Cons:**
  - ❌ Still tied to React (hooks can't be called outside components)
  - ❌ Difficult to test without component
  - ❌ Logic mixed with React lifecycle
  - ❌ Hard to reuse in non-React contexts (future CLI, API)

### 4. **Redux/State Management**
- Business logic in Redux actions/thunks
- Components dispatch actions
- **Pros:**
  - Centralized state management
  - Time-travel debugging
- **Cons:**
  - ❌ Overkill for plugin size
  - ❌ Steep learning curve
  - ❌ Lots of boilerplate
  - ❌ Not needed for local-only plugin

### 5. **Utility Functions**
- Business logic as pure functions
- No classes, just functions
- **Pros:**
  - Simple and functional
  - Easy to test
- **Cons:**
  - ❌ No state management
  - ❌ Need to pass all dependencies
  - ❌ Difficult to mock (no dependency injection)
  - ❌ No encapsulation

## Rationale

Service Layer Architecture was chosen because:

1. **Separation of Concerns:** UI (React components) vs Business Logic (Services) are clearly separated
2. **Testability:** Services are plain TypeScript classes, easy to unit test without React
3. **Reusability:** Same service can be used by multiple components or even future CLI
4. **Dependency Injection:** Easy to inject dependencies (plugin, vault) for testing
5. **Encapsulation:** Services encapsulate complex logic with clean public APIs
6. **Maintainability:** Clear boundaries make code easier to understand and modify
7. **Single Responsibility:** Each service has one clear purpose

**Key Insight:** React components should only handle rendering and user interactions. All business logic (file operations, validation, relationship management) belongs in services.

## Consequences

### Positive

- ✅ **Clean Components:** Components < 300 lines, purely presentational
- ✅ **Easy Testing:** Services tested with simple unit tests (no React testing library)
- ✅ **Reusable Logic:** Same service used by canvas, property panel, toolbar
- ✅ **Clear APIs:** Service methods document what the plugin can do
- ✅ **Mockable:** Easy to mock services for component tests
- ✅ **Maintainable:** Clear separation makes debugging easier

### Negative

- ⚠️ **More Files:** Need separate service files (acceptable tradeoff)
- ⚠️ **Dependency Passing:** Need to pass services to components (React context could help)

### Neutral

- 📝 **Service Lifecycle:** Services created once and shared across components
- 📝 **Error Handling:** Services throw errors, components handle UI feedback

## Implementation Details

### Service Structure

**Example: DiagramNavigationService**
```typescript
/**
 * DiagramNavigationService
 * Manages diagram hierarchy, navigation, and relationships
 */
export class DiagramNavigationService {
  private plugin: BAC4Plugin;
  private relationshipsFile: string;

  constructor(plugin: BAC4Plugin) {
    this.plugin = plugin;
    this.relationshipsFile = 'diagram-relationships.json';
  }

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
    // Business logic here
    // - Validate inputs
    // - Check if child already exists
    // - Create child diagram file
    // - Update relationships file
    // - Return child path
  }

  /**
   * Get breadcrumbs for diagram hierarchy
   */
  async getBreadcrumbs(diagramPath: string): Promise<BreadcrumbItem[]> {
    // Business logic here
  }

  // ... more methods
}
```

### Component Usage

**Component calls service methods:**
```typescript
const CanvasEditor: React.FC<Props> = ({ plugin, filePath }) => {
  // Create service instance
  const [navigationService] = React.useState(() =>
    new DiagramNavigationService(plugin)
  );

  // Use service methods
  const handleCreateChild = async (node: Node) => {
    try {
      const childPath = await navigationService.createChildDiagram(
        filePath,
        node.id,
        node.data.label,
        'context',
        'container'
      );
      // Update UI
    } catch (error) {
      // Show error to user
      ErrorHandler.handleError(error, 'Failed to create child diagram');
    }
  };

  return <div>...</div>;
};
```

### Service Responsibilities

**DiagramNavigationService:**
- Register diagrams in relationships file
- Create child diagrams
- Link diagrams (parent-child)
- Get breadcrumbs (hierarchy path)
- Validate relationships
- Cleanup orphaned entries

**ComponentLibraryService:**
- Load component libraries (AWS, Azure, GCP)
- Get components by provider
- Get components by category
- Search components
- Validate component definitions

**Future Services:**
- `ExportService` - Handle diagram exports (PNG, SVG, PDF)
- `ImportService` - Import from other formats (PlantUML, Mermaid)
- `ValidationService` - Validate diagram structure
- `SearchService` - Search across diagrams

### Testing Services

**Unit test without React:**
```typescript
describe('DiagramNavigationService', () => {
  let service: DiagramNavigationService;
  let mockPlugin: MockPlugin;

  beforeEach(() => {
    mockPlugin = new MockPlugin();
    service = new DiagramNavigationService(mockPlugin);
  });

  it('should create child diagram', async () => {
    const childPath = await service.createChildDiagram(
      'Context.bac4',
      'node-1',
      'Payment System',
      'context',
      'container'
    );

    expect(childPath).toBe('Payment System.bac4');
    expect(mockPlugin.vault.adapter.write).toHaveBeenCalled();
  });
});
```

## Service Design Principles

1. **Single Responsibility:** Each service has one clear domain (navigation, component library, etc.)
2. **Dependency Injection:** Services receive dependencies via constructor
3. **Public API:** Methods are well-documented with JSDoc
4. **Error Handling:** Services throw typed errors, components handle UI
5. **Async/Await:** All file operations are async
6. **Validation:** Services validate inputs before operations
7. **Immutability:** Services don't mutate passed objects

## Component Design Principles

1. **Presentation Only:** Components render UI, handle user events
2. **Call Services:** Components orchestrate services, don't contain business logic
3. **Error Display:** Components show errors to users (notices, modals)
4. **State Management:** Components manage local UI state only
5. **No File Operations:** Components NEVER call vault API directly

## Layered Architecture

```
┌─────────────────────────────────────┐
│         UI Layer (React)            │
│  - canvas-view.tsx                  │
│  - components/                      │
│  - nodes/                           │
└─────────────┬───────────────────────┘
              │ calls
┌─────────────▼───────────────────────┐
│      Service Layer (Business)       │
│  - diagram-navigation-service.ts    │
│  - component-library-service.ts     │
└─────────────┬───────────────────────┘
              │ uses
┌─────────────▼───────────────────────┐
│       Data Layer (File I/O)         │
│  - file-io.ts                       │
│  - project-structure.ts             │
└─────────────┬───────────────────────┘
              │ uses
┌─────────────▼───────────────────────┐
│      Obsidian API (Platform)        │
│  - vault.adapter                    │
│  - workspace                        │
└─────────────────────────────────────┘
```

## References

- Implementation: `src/services/`
- Example: `src/services/diagram-navigation-service.ts`
- Related: Refactoring Phase 2 (Structural Refactoring)
- Testing: `tests/services/` (future)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-10-12 | Development Team | Initial ADR |
