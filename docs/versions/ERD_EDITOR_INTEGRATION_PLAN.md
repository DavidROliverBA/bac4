# ERD Editor Integration Plan

**Status:** Investigation Complete - Ready for Implementation
**Date:** 2025-10-17
**Effort Estimate:** 16-24 hours
**Risk Level:** Medium

---

## 🎯 Goal

Integrate [@dineug/erd-editor](https://github.com/dineug/erd-editor) into BAC4 to enable:
1. **Double-click database nodes** on the canvas to open ERD editor
2. **Save ERD files** to the Obsidian vault (`.erd` extension)
3. **Double-click `.erd` files** in Obsidian to open the ERD editor view
4. **Bidirectional linking** between database nodes and ERD files

---

## 📚 Research Findings

### What is ERD Editor?

**ERD Editor** is an open-source Entity-Relationship Diagram editor developed by [@dineug](https://github.com/dineug).

**Key Features:**
- ✅ **Web Component** architecture (framework-agnostic)
- ✅ **MIT License** (permissive, commercial-friendly)
- ✅ **TypeScript** (98.7% - excellent type safety)
- ✅ **JSON storage format** (easy to serialize/deserialize)
- ✅ **SQL export/import** (supports multiple database vendors)
- ✅ **PWA support** (works offline)
- ✅ **Theming support** (can match Obsidian themes)
- ✅ **Local-first** (autosaves to browser by default)

**Technology Stack:**
- D3.js for visualization
- RxJS for reactive programming
- Vite build system
- TypeScript 5.8+
- Web Components standard

**Bundle Size:** ~200-300KB (estimated, includes D3 + RxJS)

### Package Installation

```bash
npm install @dineug/erd-editor
```

**Import:**
```typescript
import '@dineug/erd-editor';
```

**CDN Alternative:**
```html
<script type="module">
  import 'https://esm.run/@dineug/erd-editor';
</script>
```

### Web Component API

**Creation:**
```typescript
const editor = document.createElement('erd-editor');
document.body.appendChild(editor);
```

**Key Properties:**
- `value` - Get/set JSON data (ERD state)
- `readonly` - Enable/disable editing
- `systemDarkMode` - Match system theme
- `enableThemeBuilder` - Show theme controls

**Key Methods:**
- `setInitialValue(json)` - Load ERD without undo history
- `getSchemaSQL()` - Export as SQL
- `setSchemaSQL(sql)` - Import from SQL
- `focus()` / `blur()` - Focus control
- `clear()` - Reset editor
- `destroy()` - Cleanup

**Events:**
- `change` - Fires when ERD is modified
  ```typescript
  editor.addEventListener('change', (event) => {
    const data = event.target.value; // JSON
  });
  ```

### File Format

**ERD Editor uses JSON** for storage:
```json
{
  "$schema": "https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json",
  "version": "3.0.0",
  "settings": {
    "width": 2000,
    "height": 2000,
    "scrollTop": 0,
    "scrollLeft": 0,
    "zoomLevel": 1,
    "show": 511,
    "database": "MySQL",
    "databaseName": "",
    "canvasType": "ERD",
    "language": "GraphQL",
    "tableNameCase": "pascalCase",
    "columnNameCase": "camelCase",
    "bracketType": "none",
    "relationshipDataTypeSync": true,
    "relationshipOptimization": false,
    "columnOrder": [
      1,
      2,
      4,
      8,
      16,
      32,
      64
    ]
  },
  "doc": {
    "tableIds": [],
    "relationshipIds": [],
    "indexIds": [],
    "memoIds": []
  },
  "collections": {
    "tableEntities": {},
    "tableColumnEntities": {},
    "relationshipEntities": {},
    "indexEntities": {},
    "indexColumnEntities": {},
    "memoEntities": {}
  },
  "lww": {}
}
```

**Proposed File Extension:** `.erd` (consistent with project convention)

---

## 🏗️ Implementation Plan

### Phase 1: Foundation (4-6 hours)

#### 1.1 Install ERD Editor Package

**File:** `package.json`
```bash
npm install @dineug/erd-editor
```

**Expected size increase:** ~250KB to bundle

**Considerations:**
- ERD Editor has **large dependencies** (D3, RxJS, Framer Motion)
- May want to **code-split** to avoid loading unless needed
- Consider **lazy loading** when user opens ERD view

#### 1.2 Create ERD View Component

**New File:** `src/ui/erd-view.tsx` (~200 lines)

```typescript
/**
 * ERD Editor View
 *
 * Embeds @dineug/erd-editor web component in Obsidian view.
 * Manages ERD file loading, saving, and synchronization.
 */

import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import type BAC4Plugin from '../main';
import '@dineug/erd-editor'; // Load web component

export const VIEW_TYPE_ERD = 'bac4-erd';

interface ERDEditorProps {
  plugin: BAC4Plugin;
  filePath?: string;
}

const ERDEditorComponent: React.FC<ERDEditorProps> = ({ plugin, filePath }) => {
  const editorRef = React.useRef<HTMLElement | null>(null);
  const [erdData, setErdData] = React.useState<any>(null);

  // Load ERD file
  React.useEffect(() => {
    if (!filePath) return;

    const loadERD = async () => {
      const content = await plugin.app.vault.adapter.read(filePath);
      const data = JSON.parse(content);
      setErdData(data);
    };

    loadERD();
  }, [filePath, plugin]);

  // Initialize ERD editor
  React.useEffect(() => {
    const container = document.getElementById('erd-container');
    if (!container) return;

    const editor = document.createElement('erd-editor') as any;

    // Set initial data
    if (erdData) {
      editor.setInitialValue(erdData);
    }

    // Match Obsidian theme
    editor.systemDarkMode = true;

    // Auto-save on change
    let saveTimeout: NodeJS.Timeout;
    editor.addEventListener('change', (event: any) => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        const data = event.target.value;
        if (filePath) {
          await plugin.app.vault.adapter.write(
            filePath,
            JSON.stringify(data, null, 2)
          );
        }
      }, 1000); // 1-second debounce
    });

    container.appendChild(editor);
    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        (editorRef.current as any).destroy();
      }
    };
  }, [erdData, filePath, plugin]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div id="erd-container" style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export class BAC4ERDView extends ItemView {
  plugin: BAC4Plugin;
  root: ReactDOM.Root | null = null;
  filePath?: string;
  file?: TFile;

  constructor(leaf: WorkspaceLeaf, plugin: BAC4Plugin, filePath?: string) {
    super(leaf);
    this.plugin = plugin;
    this.filePath = filePath;
  }

  getViewType(): string {
    return VIEW_TYPE_ERD;
  }

  getDisplayText(): string {
    return this.filePath ? `ERD: ${this.filePath}` : 'ERD Editor';
  }

  getIcon(): string {
    return 'database';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.style.width = '100%';
    container.style.height = '100%';

    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <ERDEditorComponent plugin={this.plugin} filePath={this.filePath} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
```

**Key Design Decisions:**
- ✅ Use **React wrapper** for consistency with canvas-view
- ✅ **Auto-save with 1-second debounce** (same as canvas)
- ✅ **Match Obsidian theme** with `systemDarkMode`
- ✅ **Lazy load** editor component (only when view opens)

#### 1.3 Register ERD View and File Extension

**File:** `src/main.ts` (add to `onload()`)

```typescript
// Register ERD view
import { BAC4ERDView, VIEW_TYPE_ERD } from './ui/erd-view';

this.registerView(VIEW_TYPE_ERD, (leaf: WorkspaceLeaf) =>
  new BAC4ERDView(leaf, this)
);

// Register .erd file extension
this.registerExtensions(['erd'], VIEW_TYPE_ERD);
```

**Result:** Double-clicking `.erd` files in Obsidian now opens ERD editor view.

---

### Phase 2: Database Node Integration (6-8 hours)

#### 2.1 Update Database Node Types

**File:** `src/types/canvas-types.ts`

Add `linkedERDPath` to database node types:

```typescript
export interface CloudComponentNodeData extends BaseNodeData {
  provider?: 'aws' | 'azure' | 'gcp' | 'saas';
  componentId?: string;
  componentType?: string;
  category?: string;
  icon?: string;
  properties?: Record<string, unknown>;
  isContainer?: boolean;
  changeIndicator?: 'new' | 'modified' | 'removed' | null;
  linkedERDPath?: string; // NEW: Path to .erd file (v1.1.0)
}

// Also add to other database node types if needed
```

**Affected node types:**
- `CloudComponentNodeData` (AWS RDS, DynamoDB, Azure SQL, GCP Cloud SQL, etc.)
- Potentially `C4NodeData` if databases at C4 level

#### 2.2 Update Double-Click Handler

**File:** `src/ui/canvas/hooks/useNodeHandlers.ts`

Update `onNodeDoubleClick` to handle database nodes:

```typescript
const onNodeDoubleClick = React.useCallback(
  async (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
    console.log('=== BAC4 DOUBLE-CLICK START ===');
    console.log('Node:', { id: node.id, type: node.type, label: node.data.label });

    // NEW: Priority 1 - Check if database node with linkedERDPath
    if (isDatabaseNode(node) && 'linkedERDPath' in node.data && node.data.linkedERDPath) {
      console.log('BAC4: Node has linkedERDPath, opening ERD:', node.data.linkedERDPath);
      try {
        await plugin.openERDViewInNewTab(node.data.linkedERDPath);
        console.log('BAC4: ✅ Opened linked ERD');
        console.log('=== BAC4 DOUBLE-CLICK END ===');
        return;
      } catch (error) {
        console.error('BAC4: Error opening linked ERD:', error);
        ErrorHandler.handleError(error, 'Failed to open linked ERD');
        return;
      }
    }

    // NEW: Priority 2 - Database node without ERD - create it
    if (isDatabaseNode(node)) {
      console.log('BAC4: Database node without ERD, creating new ERD file');
      await handleCreateAndLinkERD(node);
      console.log('=== BAC4 DOUBLE-CLICK END ===');
      return;
    }

    // Existing priorities (linkedDiagramPath, linkedMarkdownPath, drill-down)
    // ...
  },
  [/* deps */]
);

/**
 * Check if node is a database node
 */
function isDatabaseNode(node: Node<CanvasNodeData>): boolean {
  // Database categories
  const databaseCategories = ['database'];

  // Database component types
  const databaseTypes = [
    'relational-database',
    'nosql-database',
    'cache-system',
    'data-warehouse'
  ];

  // Check if cloud component with database category
  if (node.type === 'cloudComponent' && 'category' in node.data) {
    return databaseCategories.includes(node.data.category as string);
  }

  // Check if has database type
  if ('type' in node.data) {
    return databaseTypes.includes(node.data.type as string);
  }

  return false;
}

/**
 * Create and link ERD file to database node
 */
const handleCreateAndLinkERD = React.useCallback(
  async (node: Node<CanvasNodeData>) => {
    if (!filePath) {
      ErrorHandler.showInfo('Please save this diagram first before creating ERD files.');
      return;
    }

    try {
      // Generate ERD file path
      const diagramDir = filePath.substring(0, filePath.lastIndexOf('/'));
      const erdFileName = `${sanitizeFileName(node.data.label)}.erd`;
      const erdPath = `${diagramDir}/${erdFileName}`;

      // Check if ERD file already exists
      const exists = await plugin.app.vault.adapter.exists(erdPath);
      if (exists) {
        // Open existing ERD
        await plugin.openERDViewInNewTab(erdPath);

        // Update node with linkedERDPath if not set
        if (!('linkedERDPath' in node.data) || !node.data.linkedERDPath) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? { ...n, data: { ...n.data, linkedERDPath: erdPath } }
                : n
            )
          );
        }
        return;
      }

      // Create new empty ERD file
      const emptyERD = {
        "$schema": "https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json",
        "version": "3.0.0",
        "settings": {
          "width": 2000,
          "height": 2000,
          "scrollTop": 0,
          "scrollLeft": 0,
          "zoomLevel": 1,
          "show": 511,
          "database": getDatabaseType(node),
          "databaseName": node.data.label,
          "canvasType": "ERD",
          "language": "GraphQL",
          "tableNameCase": "pascalCase",
          "columnNameCase": "camelCase",
          "bracketType": "none",
          "relationshipDataTypeSync": true,
          "relationshipOptimization": false,
          "columnOrder": [1, 2, 4, 8, 16, 32, 64]
        },
        "doc": {
          "tableIds": [],
          "relationshipIds": [],
          "indexIds": [],
          "memoIds": []
        },
        "collections": {
          "tableEntities": {},
          "tableColumnEntities": {},
          "relationshipEntities": {},
          "indexEntities": {},
          "indexColumnEntities": {},
          "memoEntities": {}
        },
        "lww": {}
      };

      await plugin.app.vault.adapter.write(
        erdPath,
        JSON.stringify(emptyERD, null, 2)
      );

      console.log('BAC4: ✅ Created ERD file:', erdPath);

      // Update node with linkedERDPath
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, linkedERDPath: erdPath } }
            : n
        )
      );

      // Open ERD editor
      await plugin.openERDViewInNewTab(erdPath);

      ErrorHandler.showSuccess('ERD file created');
    } catch (error) {
      console.error('BAC4: Error creating ERD file:', error);
      ErrorHandler.handleError(error, 'Failed to create ERD file');
    }
  },
  [filePath, plugin, setNodes]
);

/**
 * Determine database type from node
 */
function getDatabaseType(node: Node<CanvasNodeData>): string {
  // Map cloud component types to ERD database types
  const typeMap: Record<string, string> = {
    'aws-rds': 'MySQL',
    'aws-dynamodb': 'MongoDB',
    'azure-sql': 'MSSQL',
    'azure-cosmos': 'MongoDB',
    'gcp-sql': 'MySQL',
    'gcp-firestore': 'MongoDB',
    'tech-database': 'MySQL',
  };

  const componentId = 'componentId' in node.data ? node.data.componentId as string : '';
  return typeMap[componentId] || 'MySQL'; // Default to MySQL
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
```

**Result:**
- Double-clicking database nodes creates/opens ERD files
- ERD files saved in same directory as diagram
- Node tracks linkedERDPath in its data

#### 2.3 Add ERD Opening Method to Plugin

**File:** `src/main.ts`

```typescript
/**
 * Open ERD view in new tab
 * Similar to openCanvasViewInNewTab but for ERD files
 */
async openERDViewInNewTab(erdPath: string): Promise<void> {
  console.log('BAC4: Opening ERD view in new tab:', erdPath);

  // Check for existing tab with this ERD file
  const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ERD);
  const existingLeaf = leaves.find((leaf) => {
    const view = leaf.view as BAC4ERDView;
    return view.filePath === erdPath;
  });

  if (existingLeaf) {
    console.log('BAC4: ERD already open in tab, activating');
    this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
    return;
  }

  // Create new tab
  const leaf = this.app.workspace.getLeaf('tab');
  await leaf.setViewState({
    type: VIEW_TYPE_ERD,
    state: { file: erdPath, filePath: erdPath },
  });

  this.app.workspace.setActiveLeaf(leaf, { focus: true });
  console.log('BAC4: ✅ ERD view opened in new tab');
}
```

#### 2.4 Update PropertyPanel for ERD Linking

**File:** `src/ui/components/PropertyPanel.tsx`

Add ERD section for database nodes:

```tsx
{/* ERD Documentation (v1.1.0) - Only for database nodes */}
{isDatabaseNode(node) && (
  <div style={{ marginTop: SPACING.gap.section }}>
    <div style={{
      fontSize: FONT_SIZES.small,
      fontWeight: 600,
      color: UI_COLORS.textMuted,
      marginBottom: SPACING.gap.tight,
      textTransform: 'uppercase',
    }}>
      ERD Schema
    </div>

    {node.data.linkedERDPath ? (
      <div style={{ display: 'flex', gap: SPACING.gap.tight }}>
        <button
          onClick={handleOpenERDFile}
          style={{
            padding: SPACING.padding.button,
            fontSize: FONT_SIZES.small,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            backgroundColor: UI_COLORS.interactiveAccent,
            color: '#FFFFFF',
            cursor: 'pointer',
            fontWeight: 600,
            flex: 1,
          }}
        >
          📊 Open ERD
        </button>
        <button
          onClick={handleUnlinkERDFile}
          style={{
            padding: SPACING.padding.button,
            fontSize: FONT_SIZES.small,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            backgroundColor: UI_COLORS.backgroundSecondary,
            color: UI_COLORS.textMuted,
            cursor: 'pointer',
          }}
        >
          ❌ Unlink
        </button>
      </div>
    ) : (
      <button
        onClick={handleCreateAndLinkERD}
        style={{
          width: '100%',
          padding: SPACING.padding.button,
          fontSize: FONT_SIZES.small,
          borderRadius: BORDER_RADIUS.normal,
          border: `1px solid ${UI_COLORS.border}`,
          backgroundColor: UI_COLORS.backgroundSecondary,
          color: UI_COLORS.textNormal,
          cursor: 'pointer',
        }}
      >
        + Create ERD Schema
      </button>
    )}

    {node.data.linkedERDPath && (
      <div style={{
        marginTop: SPACING.gap.tiny,
        fontSize: FONT_SIZES.tiny,
        color: UI_COLORS.textFaint,
      }}>
        {node.data.linkedERDPath.split('/').pop()}
      </div>
    )}
  </div>
)}
```

**Handlers to add:**
```typescript
const handleOpenERDFile = React.useCallback(async () => {
  if (!node?.data.linkedERDPath) return;
  await onOpenLinkedERDFile(node.id);
}, [node, onOpenLinkedERDFile]);

const handleUnlinkERDFile = React.useCallback(() => {
  if (!node) return;
  onUnlinkERDFile(node.id);
}, [node, onUnlinkERDFile]);

const handleCreateAndLinkERD = React.useCallback(async () => {
  if (!node) return;
  await onCreateAndLinkERDFile(node.id);
}, [node, onCreateAndLinkERDFile]);
```

---

### Phase 3: File Management & Polish (4-6 hours)

#### 3.1 File Rename Listener

**File:** `src/main.ts`

Update the existing file rename listener to handle `.erd` files:

```typescript
// Existing rename listener
this.registerEvent(
  this.app.vault.on('rename', async (file, oldPath) => {
    console.log('BAC4: File renamed', { oldPath, newPath: file.path });

    // Existing .bac4 file handling
    if (file.path.endsWith('.bac4')) {
      // ... existing code
    }

    // NEW: .erd file handling
    if (file.path.endsWith('.erd')) {
      await this.updateERDReferences(oldPath, file.path);
    }

    // Existing .md file handling
    if (file.path.endsWith('.md')) {
      // ... existing code
    }
  })
);

/**
 * Update linkedERDPath references when ERD file is renamed
 */
async updateERDReferences(oldPath: string, newPath: string): Promise<void> {
  console.log('BAC4: Updating ERD references', { oldPath, newPath });

  const files = this.app.vault.getFiles().filter((f) => f.path.endsWith('.bac4'));

  for (const file of files) {
    try {
      const content = await this.app.vault.adapter.read(file.path);
      const data = JSON.parse(content) as BAC4FileV06;

      let modified = false;

      // Update linkedERDPath in nodes
      data.nodes = data.nodes.map((node) => {
        if ('linkedERDPath' in node.data && node.data.linkedERDPath === oldPath) {
          console.log('BAC4: Updating linkedERDPath in', file.path, 'node', node.id);
          modified = true;
          return {
            ...node,
            data: { ...node.data, linkedERDPath: newPath },
          };
        }
        return node;
      });

      if (modified) {
        // Update metadata
        if (data.metadata) {
          data.metadata.updatedAt = new Date().toISOString();
        }

        await this.app.vault.adapter.write(file.path, JSON.stringify(data, null, 2));
        console.log('BAC4: ✅ Updated ERD references in', file.path);
      }
    } catch (error) {
      console.error('BAC4: Error updating ERD references in', file.path, error);
    }
  }
}
```

#### 3.2 ERD Badge on Database Nodes

**File:** `src/ui/nodes/CloudComponentNode.tsx`

Add visual indicator when database node has linked ERD:

```tsx
{/* ERD indicator (v1.1.0) - positioned bottom-right */}
{hasLinkedERD && (
  <div
    style={{
      position: 'absolute',
      bottom: SPACING.tiny,
      right: SPACING.tiny,
      fontSize: '9px',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: color,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      cursor: 'help',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }}
    title={`ERD Schema: ${data.linkedERDPath?.split('/').pop()}`}
  >
    📊
  </div>
)}
```

#### 3.3 Command Palette Integration

**File:** `src/main.ts`

Add commands for ERD operations:

```typescript
// Create ERD for selected database node
this.addCommand({
  id: 'create-erd',
  name: 'Create ERD Schema for Database Node',
  callback: async () => {
    const activeLeaf = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
    if (!activeLeaf) {
      new Notice('No active BAC4 diagram');
      return;
    }

    // Get selected node from canvas view
    // Trigger ERD creation
    // ... implementation
  },
});

// Open ERD editor
this.addCommand({
  id: 'open-erd-editor',
  name: 'Open ERD Editor',
  callback: async () => {
    const erdFiles = this.app.vault.getFiles().filter((f) => f.path.endsWith('.erd'));

    if (erdFiles.length === 0) {
      new Notice('No ERD files found');
      return;
    }

    // Show file picker or open most recent
    // ... implementation
  },
});
```

#### 3.4 Theme Integration

**File:** `src/ui/erd-view.tsx`

Match ERD editor theme to Obsidian:

```typescript
// Detect Obsidian theme
const isDarkMode = document.body.classList.contains('theme-dark');

// Apply theme to ERD editor
editor.systemDarkMode = true;

// Optional: Custom theme matching Obsidian colors
const obsidianTheme = {
  canvas: {
    background: getComputedStyle(document.body).getPropertyValue('--background-primary'),
    grid: getComputedStyle(document.body).getPropertyValue('--background-modifier-border'),
  },
  table: {
    background: getComputedStyle(document.body).getPropertyValue('--background-secondary'),
    border: getComputedStyle(document.body).getPropertyValue('--background-modifier-border'),
  },
  text: {
    primary: getComputedStyle(document.body).getPropertyValue('--text-normal'),
    accent: getComputedStyle(document.body).getPropertyValue('--text-accent'),
  },
};

editor.setTheme(obsidianTheme);
```

---

### Phase 4: Testing & Documentation (2-4 hours)

#### 4.1 Test Cases

**Functional Tests:**
1. ✅ Double-click database node → Creates `.erd` file
2. ✅ Double-click database node with existing ERD → Opens ERD editor
3. ✅ Double-click `.erd` file in file explorer → Opens ERD editor
4. ✅ Edit ERD → Auto-saves after 1 second
5. ✅ Rename `.erd` file → Updates `linkedERDPath` in diagram
6. ✅ Delete `.erd` file → Node shows "Create ERD" button again
7. ✅ PropertyPanel "Open ERD" button → Opens ERD editor
8. ✅ PropertyPanel "Unlink" button → Removes `linkedERDPath`
9. ✅ Multiple tabs with different ERDs → No conflicts
10. ✅ Dark/light theme switching → ERD editor matches

**Edge Cases:**
- Database node in read-only snapshot → ERD opens read-only?
- ERD file corruption → Show error message
- Missing ERD file (deleted outside Obsidian) → Recreate option
- Very large ERDs (100+ tables) → Performance testing

#### 4.2 User Documentation

**New File:** `docs/ERD_INTEGRATION_GUIDE.md`

```markdown
# ERD Schema Integration

BAC4 integrates [ERD Editor](https://github.com/dineug/erd-editor) for database schema design.

## Quick Start

1. **Add a database node** to your diagram (RDS, DynamoDB, Azure SQL, etc.)
2. **Double-click the node** to create an ERD schema
3. **Design your schema** using the ERD editor
4. **Save automatically** - changes persist every second

## Features

### Database Node ERD Badge
Database nodes show a 📊 badge when they have a linked ERD schema.

### Property Panel Integration
Select a database node to see ERD controls:
- **Create ERD Schema** - Creates new `.erd` file
- **Open ERD** - Opens existing ERD editor
- **Unlink** - Removes ERD association

### File Types
ERD files use the `.erd` extension and are stored as JSON.

### SQL Export
ERD Editor supports exporting to SQL for:
- MySQL
- PostgreSQL
- MSSQL (SQL Server)
- Oracle
- SQLite

## Workflow Examples

### Microservices Architecture
```
Component Diagram
├── User Service (Container)
│   ├── REST API
│   └── PostgreSQL ← Double-click to design schema
├── Order Service (Container)
│   ├── REST API
│   └── MongoDB ← Double-click to design schema
```

### Cloud Data Pipeline
```
Component Diagram
├── S3 Bucket (raw data)
├── Lambda (ETL)
├── RDS (PostgreSQL) ← Design normalized schema
└── DynamoDB (cache) ← Design NoSQL schema
```

## Tips

- **Use consistent naming** - ERD files match node labels
- **Version control** - `.erd` files are JSON (git-friendly)
- **Collaboration** - Share ERD files with team
- **Export SQL** - Generate DDL from ERD editor
```

#### 4.3 Component Library Update

Update database components with ERD support notice:

**File:** `component-library/components.json`

Add to `defaultNoteText` for database components:

```json
{
  "id": "aws-rds",
  "defaultNoteText": "# RDS Instance\n\n💡 **Tip:** Double-click this node to design the database schema in ERD Editor.\n\n## Configuration\n- **Engine**: \n..."
}
```

---

## 📦 Deliverables

### New Files
1. ✅ `src/ui/erd-view.tsx` - ERD editor view component
2. ✅ `src/constants/erd-constants.ts` - ERD-specific constants
3. ✅ `docs/ERD_INTEGRATION_GUIDE.md` - User documentation
4. ✅ `docs/ERD_EDITOR_INTEGRATION_PLAN.md` - This file

### Modified Files
1. ✅ `package.json` - Add @dineug/erd-editor dependency
2. ✅ `src/main.ts` - Register ERD view, file extension, commands
3. ✅ `src/types/canvas-types.ts` - Add linkedERDPath property
4. ✅ `src/ui/canvas/hooks/useNodeHandlers.ts` - Double-click ERD handling
5. ✅ `src/ui/components/PropertyPanel.tsx` - ERD section for databases
6. ✅ `src/ui/nodes/CloudComponentNode.tsx` - ERD badge indicator
7. ✅ `component-library/components.json` - Update database templates
8. ✅ `esbuild.config.mjs` - May need to handle web component bundling

### Build Configuration
- ✅ Ensure web components are bundled correctly
- ✅ Consider code-splitting for ERD editor (lazy load)
- ✅ Test bundle size increase (target: <300KB)

---

## ⚠️ Technical Challenges

### 1. Web Component Integration
**Challenge:** ERD Editor is a web component, React Flow is React.
**Solution:** Use `ref` to mount web component in React container.
**Risk:** Low - standard pattern for web component integration.

### 2. Bundle Size
**Challenge:** ERD Editor has large dependencies (D3, RxJS, Framer Motion).
**Solution:** Code-split and lazy load only when ERD view opens.
**Risk:** Medium - may need dynamic imports.

```typescript
// Lazy load ERD editor
const loadERDEditor = async () => {
  await import('@dineug/erd-editor');
};
```

### 3. Theme Synchronization
**Challenge:** Keeping ERD editor theme in sync with Obsidian.
**Solution:** Listen to Obsidian theme changes and update editor.
**Risk:** Low - ERD Editor has good theming API.

```typescript
this.registerEvent(
  this.app.workspace.on('css-change', () => {
    // Update ERD editor theme
  })
);
```

### 4. File Format Compatibility
**Challenge:** ERD Editor updates may break file format.
**Solution:** Pin to specific version, test upgrades carefully.
**Risk:** Low - ERD Editor uses versioned JSON schema.

### 5. Performance with Large ERDs
**Challenge:** 100+ tables may slow down editor.
**Solution:** ERD Editor handles this natively (virtualization).
**Risk:** Low - built-in optimization.

---

## 🎯 Success Metrics

### Functional
- ✅ Database nodes create/open ERD files on double-click
- ✅ `.erd` files open in ERD editor view
- ✅ Auto-save works with 1-second debounce
- ✅ File renames update references
- ✅ Theme matches Obsidian

### Performance
- ✅ ERD view opens in <500ms
- ✅ Auto-save completes in <100ms
- ✅ Bundle size increase <300KB
- ✅ No lag with 50+ table ERD

### UX
- ✅ Intuitive double-click workflow
- ✅ Clear visual indicators (badge)
- ✅ PropertyPanel integration feels native
- ✅ No conflicts with existing features

---

## 🚀 Future Enhancements (Post-v1.1.0)

### Phase 5: Advanced Features (Optional)

#### SQL Generation from ERD
- Button to generate SQL DDL from ERD
- Save SQL to vault as `.sql` file
- Support multiple database vendors

#### ERD Preview in PropertyPanel
- Thumbnail preview of ERD schema
- Click to open full editor

#### Multi-Database ERDs
- Single ERD file with multiple database schemas
- Useful for microservices with multiple DBs

#### Schema Comparison
- Compare two ERD files
- Show diff (added/removed/modified tables)
- Useful for versioning

#### Import from Existing Database
- Connect to live database
- Reverse-engineer schema to ERD
- Requires database connection plugin

#### ERD Templates
- Pre-built ERD templates (e-commerce, SaaS, etc.)
- User-defined templates

---

## 📊 Effort Breakdown

| Phase | Task | Hours | Risk |
|-------|------|-------|------|
| **1** | Foundation | 4-6 | Low |
| | Install package | 1 | Low |
| | Create ERD view | 2-3 | Low |
| | Register view/extension | 1 | Low |
| **2** | Database Integration | 6-8 | Medium |
| | Update types | 1 | Low |
| | Double-click handler | 2-3 | Medium |
| | Plugin methods | 1-2 | Low |
| | PropertyPanel UI | 2 | Low |
| **3** | File Management | 4-6 | Medium |
| | Rename listener | 2 | Low |
| | ERD badge | 1 | Low |
| | Commands | 1-2 | Low |
| | Theme integration | 1-2 | Medium |
| **4** | Testing & Docs | 2-4 | Low |
| | Test cases | 1-2 | Low |
| | Documentation | 1-2 | Low |
| **Total** | | **16-24** | **Medium** |

---

## 🛠️ Development Workflow

### Step 1: Install & Experiment
```bash
npm install @dineug/erd-editor
```

Create a test HTML file to experiment with ERD Editor API:
```html
<!DOCTYPE html>
<html>
<body>
  <erd-editor id="editor"></erd-editor>
  <script type="module">
    import 'https://esm.run/@dineug/erd-editor';
    const editor = document.getElementById('editor');

    // Test basic operations
    editor.addEventListener('change', (e) => {
      console.log('ERD changed:', e.target.value);
    });
  </script>
</body>
</html>
```

### Step 2: Create ERD View
Implement `src/ui/erd-view.tsx` and test in isolation.

### Step 3: Register View
Add to `main.ts` and test opening `.erd` files.

### Step 4: Database Node Integration
Update double-click handler, test creating ERDs.

### Step 5: Polish
Add PropertyPanel integration, badges, themes.

### Step 6: Test & Document
Run all test cases, write documentation.

---

## ✅ Decision Points

### Q1: Should we lazy-load the ERD editor?
**Answer:** YES
**Reason:** Reduces initial bundle size, only loads when needed.

### Q2: Should ERD files be vault-relative or absolute?
**Answer:** Vault-relative (like linkedMarkdownPath)
**Reason:** Consistency with existing linking system.

### Q3: Should we support SQL import/export in BAC4?
**Answer:** YES, but in Phase 5
**Reason:** ERD Editor supports it natively, low effort.

### Q4: Should we allow ERDs for non-database nodes?
**Answer:** NO
**Reason:** ERD is database-specific, confusing for other nodes.

### Q5: Should we version ERD files?
**Answer:** Not initially, maybe Phase 5
**Reason:** ERD Editor's JSON format is git-friendly, manual versioning works.

### Q6: What database types should auto-detect?
**Answer:** MySQL (default), PostgreSQL, MSSQL, MongoDB, SQLite, Oracle
**Reason:** ERD Editor supports these natively.

---

## 🎓 Learning Resources

- [ERD Editor GitHub](https://github.com/dineug/erd-editor)
- [ERD Editor Docs](https://docs.erd-editor.io)
- [ERD Editor API Reference](https://docs.erd-editor.io/docs/api/erd-editor-element)
- [Web Components Standard](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

---

## 📝 Implementation Checklist

### Pre-Implementation
- [ ] Review ERD Editor documentation
- [ ] Test ERD Editor in standalone HTML
- [ ] Understand web component lifecycle
- [ ] Plan file structure and naming

### Phase 1: Foundation
- [ ] Install @dineug/erd-editor package
- [ ] Create src/ui/erd-view.tsx
- [ ] Create src/constants/erd-constants.ts
- [ ] Register VIEW_TYPE_ERD in main.ts
- [ ] Register .erd extension in main.ts
- [ ] Test: Open .erd file → ERD editor loads

### Phase 2: Database Integration
- [ ] Add linkedERDPath to CloudComponentNodeData
- [ ] Implement isDatabaseNode() helper
- [ ] Update onNodeDoubleClick handler
- [ ] Implement handleCreateAndLinkERD()
- [ ] Add openERDViewInNewTab() to plugin
- [ ] Test: Double-click DB node → ERD created

### Phase 3: PropertyPanel
- [ ] Add ERD section to PropertyPanel
- [ ] Implement handleOpenERDFile()
- [ ] Implement handleUnlinkERDFile()
- [ ] Implement handleCreateAndLinkERD()
- [ ] Test: PropertyPanel ERD controls work

### Phase 4: File Management
- [ ] Update file rename listener for .erd
- [ ] Implement updateERDReferences()
- [ ] Add ERD badge to CloudComponentNode
- [ ] Test: Rename .erd → references update

### Phase 5: Polish
- [ ] Add command palette commands
- [ ] Implement theme synchronization
- [ ] Add ERD tip to database component templates
- [ ] Test: Theme changes → ERD updates

### Phase 6: Testing
- [ ] Run all functional test cases
- [ ] Run edge case tests
- [ ] Performance testing (large ERDs)
- [ ] Cross-platform testing (Mac/Windows/Linux)

### Phase 7: Documentation
- [ ] Write ERD_INTEGRATION_GUIDE.md
- [ ] Update README.md with ERD feature
- [ ] Add to CHANGELOG.md
- [ ] Update component library JSON

### Phase 8: Deployment
- [ ] Build and test in development vault
- [ ] Build and test in production vault
- [ ] Tag release (v1.1.0)
- [ ] Create GitHub release with notes

---

## 🎉 Summary

**ERD Editor integration is FEASIBLE and STRAIGHTFORWARD.**

**Key Points:**
- ✅ MIT licensed, production-ready
- ✅ Web component design = easy integration
- ✅ JSON format = vault-friendly
- ✅ Good API for theme/data control
- ✅ Matches BAC4's architecture patterns
- ✅ Clear user workflow (double-click)
- ✅ 16-24 hours development time
- ✅ Medium risk (mostly web component nuances)

**Recommendation:** PROCEED with implementation.

This feature would significantly enhance BAC4's value for database-centric architectures and provide a seamless ERD design workflow within Obsidian.

---

**End of Plan**
