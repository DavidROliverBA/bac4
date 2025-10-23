import { Plugin, WorkspaceLeaf, TFile, Notice, Modal, App } from 'obsidian';
import { BAC4Settings } from './core/settings';
import {
  DEFAULT_SETTINGS,
  COMMAND_OPEN_DASHBOARD,
  COMMAND_OPEN_SETTINGS,
  VIEW_TYPE_CANVAS,
} from './core/constants';
import { BAC4SettingsTab } from './ui/settings-tab';
import { BAC4CanvasView } from './ui/canvas-view';
import { hasBac4Diagram } from './utils/frontmatter-parser';
import { TimelineService } from './services/TimelineService';
import { NodeRegistryService } from './services/node-registry-service';
import { MigrationService } from './services/migration-service';
import { AIValidationService } from './services/ai-validation-service';
import { ArchitectureAnalyzerService } from './services/architecture-analyzer-service';
import { AISuggestionsService } from './services/ai-suggestions-service';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts-service';
import './styles.css';
import '../styles/navigation.css';
import '../styles/accessibility.css';

/**
 * BAC4 Plugin - Main entry point
 *
 * v2.0.0: 7-Layer Enterprise Architecture Management for Obsidian
 *
 * Provides visual diagram editing for enterprise architecture across 7 layers:
 * Market → Organisation → Capability → Context → Container → Component → Code
 *
 * **Core Features:**
 * - 7-layer enterprise architecture model
 * - Layer-specific validation and node types
 * - Visual diagram editor with timeline versioning
 * - Hierarchical drill-down navigation
 * - Cloud component libraries (AWS/Azure/GCP)
 * - Export to Canvas format
 * - Graph view of diagram relationships
 * - Self-contained .bac4 file format
 *
 * **Plugin Lifecycle:**
 * 1. onload() - Initialize views, commands, event handlers
 * 2. User interacts with diagrams
 * 3. onunload() - Clean up and save settings
 *
 * @class BAC4Plugin
 * @extends Plugin
 *
 * @example
 * ```ts
 * // Plugin is automatically instantiated by Obsidian
 * // Access via: this.app.plugins.plugins['bac4']
 * ```
 */
export default class BAC4Plugin extends Plugin {
  settings!: BAC4Settings;
  aiValidation!: AIValidationService;
  architectureAnalyzer!: ArchitectureAnalyzerService;
  aiSuggestions!: AISuggestionsService;
  keyboardShortcuts!: KeyboardShortcutsService;

  async onload() {
    console.log('Loading BAC4 Plugin v' + this.manifest.version);

    // Load settings
    await this.loadSettings();

    // Initialize AI Services (v2.4.0: AI-powered analysis and validation)
    this.aiValidation = new AIValidationService(this);
    this.architectureAnalyzer = new ArchitectureAnalyzerService(this);
    this.aiSuggestions = new AISuggestionsService(this);
    console.log('BAC4: AI services initialized (validation, analyzer, suggestions)');

    // Initialize Keyboard Shortcuts Service (v2.3.0: Navigation shortcuts)
    this.keyboardShortcuts = new KeyboardShortcutsService(this);
    console.log('BAC4: Keyboard shortcuts service initialized');

    // Initialize Node Registry (v1.0.1: Track node names across all diagrams)
    const registry = NodeRegistryService.getInstance();
    await registry.initialize(this.app.vault);
    console.log('BAC4: Node registry initialized with', registry.getUniqueNodeCount(), 'unique node names');

    // Register canvas view
    this.registerView(VIEW_TYPE_CANVAS, (leaf: WorkspaceLeaf) => new BAC4CanvasView(leaf, this));

    // Register .bac4 file extension to open with canvas view
    this.registerExtensions(['bac4'], VIEW_TYPE_CANVAS);

    // Override file menu handler to prevent duplicate tabs
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'bac4') {
          menu.addItem((item) => {
            item
              .setTitle('Open in BAC4 Canvas')
              .setIcon('layout-dashboard')
              .onClick(async () => {
                await this.openCanvasView(file.path);
              });
          });
        }
      })
    );

    // Register commands
    this.registerCommands();

    // Register settings tab
    this.addSettingTab(new BAC4SettingsTab(this.app, this));

    // Register ribbon icon - using '4' for BAC4
    this.addRibbonIcon('dice-4', 'BAC4', async () => {
      await this.openDashboard();
    });

    // Intercept file opens to handle both .bac4 and .md diagram files
    this.registerEvent(
      this.app.workspace.on('file-open', async (file) => {
        if (!file) return;

        // Handle .bac4 files - log for debugging
        if (file.extension === 'bac4') {
          console.log('BAC4: file-open event for', file.path);
        }

        // Handle .md files - check for BAC4 diagram frontmatter
        if (file.extension === 'md') {
          console.log('BAC4: Checking markdown file for diagram data:', file.path);

          try {
            // Read file content
            const content = await this.app.vault.read(file as TFile);

            // Check if it has BAC4 diagram frontmatter
            if (hasBac4Diagram(content)) {
              console.log('BAC4: Found BAC4 diagram in markdown, switching to canvas view');

              // Get active leaf
              const activeLeaf = this.app.workspace.activeLeaf;

              // Check if already in canvas view
              if (activeLeaf && activeLeaf.view.getViewType() !== VIEW_TYPE_CANVAS) {
                // Switch to canvas view
                await activeLeaf.setViewState({
                  type: VIEW_TYPE_CANVAS,
                  state: { file: file.path },
                });
              }
            }
          } catch (error) {
            console.error('BAC4: Error checking markdown file:', error);
          }
        }
      })
    );

    // Register canvas modification listener (v2.0.1: Save graph layout when Canvas is edited)
    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        if (!(file instanceof TFile)) return;

        // Only care about graph view canvas file
        if (file.path === 'BAC4/__graph_view__.canvas') {
          console.log('BAC4: Graph view canvas modified, saving layout...');
          // Debounce: wait 1 second before saving to avoid too many writes
          clearTimeout((this as any).graphLayoutSaveTimeout);
          (this as any).graphLayoutSaveTimeout = setTimeout(async () => {
            await this.saveGraphLayoutFromCanvas(file);
          }, 1000);
        }
      })
    );

    // Register file deletion listener (v2.0.1: Clean up graph layout)
    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (!(file instanceof TFile)) return;

        // Handle .bac4 file deletions in graph layout
        if (file.extension === 'bac4') {
          const { GraphLayoutService } = await import('./services/graph-layout-service');
          await GraphLayoutService.handleDiagramDeletion(this.app.vault, file.path);
        }
      })
    );

    // Register file rename listener (v0.6.0: Auto-update linkedDiagramPath and linkedMarkdownPath)
    // v2.0.1: Also update graph layout file
    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!(file instanceof TFile)) return;

        // Handle .bac4 file renames in graph layout
        if (file.extension === 'bac4') {
          const { GraphLayoutService } = await import('./services/graph-layout-service');
          await GraphLayoutService.handleDiagramRename(this.app.vault, oldPath, file.path);
        }

        // Only care about .bac4 and .md file renames for diagram references
        if (file.extension !== 'bac4' && file.extension !== 'md') return;

        console.log('BAC4: File renamed from', oldPath, 'to', file.path);

        // Find all .bac4 files in vault
        const allBac4Files = this.app.vault.getFiles().filter((f) => f.extension === 'bac4');

        console.log('BAC4: Checking', allBac4Files.length, '.bac4 files for references to renamed file');

        let updatedCount = 0;

        // Check each .bac4 file for references to the old path
        for (const bac4File of allBac4Files) {
          try {
            const content = await this.app.vault.read(bac4File);
            const data = JSON.parse(content);

            if (!data.nodes || !Array.isArray(data.nodes)) continue;

            let needsUpdate = false;

            // Update linkedDiagramPath and linkedMarkdownPath in nodes
            const updatedNodes = (data.nodes as Array<{ id: string; data?: { linkedDiagramPath?: string; linkedMarkdownPath?: string } }>).map((node) => {
              const updatedNode = { ...node };

              // Check linkedDiagramPath
              if (updatedNode.data?.linkedDiagramPath === oldPath) {
                console.log('BAC4: Updating linkedDiagramPath in', bac4File.path, 'node', node.id);
                updatedNode.data.linkedDiagramPath = file.path;
                needsUpdate = true;
              }

              // Check linkedMarkdownPath
              if (updatedNode.data?.linkedMarkdownPath === oldPath) {
                console.log('BAC4: Updating linkedMarkdownPath in', bac4File.path, 'node', node.id);
                updatedNode.data.linkedMarkdownPath = file.path;
                needsUpdate = true;
              }

              return updatedNode;
            });

            // Save updated file if changes were made
            if (needsUpdate) {
              data.nodes = updatedNodes;

              // Update updatedAt timestamp if metadata exists (v0.6.0 format)
              if (data.metadata) {
                data.metadata.updatedAt = new Date().toISOString();
              }

              await this.app.vault.modify(bac4File, JSON.stringify(data, null, 2));
              updatedCount++;
              console.log('BAC4: ✅ Updated', bac4File.path);
            }
          } catch (error) {
            console.error('BAC4: Error processing', bac4File.path, error);
          }
        }

        if (updatedCount > 0) {
          new Notice(`Updated ${updatedCount} diagram(s) with renamed file reference`);
          console.log('BAC4: ✅ File rename complete:', updatedCount, 'diagrams updated');
        } else {
          console.log('BAC4: No diagrams needed updating for this rename');
        }
      })
    );

    console.log('BAC4 Plugin loaded successfully');
  }

  async onunload() {
    console.log('Unloading BAC4 Plugin...');

    // Clear any pending graph layout save timeout
    if ((this as any).graphLayoutSaveTimeout) {
      clearTimeout((this as any).graphLayoutSaveTimeout);
    }

    // Save settings
    await this.saveSettings();

    console.log('BAC4 Plugin unloaded');
  }

  /**
   * Load plugin settings from disk
   *
   * Loads saved settings from Obsidian's data.json, merging with defaults.
   *
   * @returns Promise that resolves when settings are loaded
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Save plugin settings to disk
   *
   * Persists current settings to Obsidian's data.json.
   *
   * @returns Promise that resolves when settings are saved
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Open BAC4 Dashboard (main Context diagram)
   *
   * Opens or creates the main Context diagram (system landscape view).
   * This is the entry point for the diagram hierarchy. If the Context
   * diagram doesn't exist, it will be created along with the relationships
   * file for tracking diagram hierarchy.
   *
   * **Auto-creation:**
   * - Creates dashboard directory if needed
   * - Creates empty Context.bac4 if it doesn't exist
   * - Initializes diagram-relationships.json
   * - Registers Context diagram in relationships
   *
   * @returns Promise that resolves when dashboard is opened
   *
   * @example
   * ```ts
   * // Open dashboard from command palette
   * await plugin.openDashboard();
   * // Context.bac4 opens in canvas view
   * ```
   */
  async openDashboard(): Promise<void> {
    console.log('BAC4: Opening dashboard...');

    // Get dashboard path from settings
    const contextPath = this.settings.dashboardPath;

    // Check if Context diagram exists
    const contextExists = await this.app.vault.adapter.exists(contextPath);

    if (!contextExists) {
      console.log('BAC4: Context diagram does not exist, creating at:', contextPath);

      // Create directory if needed
      const lastSlash = contextPath.lastIndexOf('/');
      if (lastSlash > 0) {
        const dir = contextPath.substring(0, lastSlash);
        if (!(await this.app.vault.adapter.exists(dir))) {
          console.log('BAC4: Creating directory:', dir);
          await this.app.vault.createFolder(dir);
        }
      }

      // Create empty Context diagram (v1.0.0 format with timeline)
      const now = new Date().toISOString();
      const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
      const emptyDiagram = {
        version: '1.0.0',
        metadata: {
          diagramType: 'context',
          createdAt: now,
          updatedAt: now,
        },
        timeline: initialTimeline,
      };
      await this.app.vault.adapter.write(contextPath, JSON.stringify(emptyDiagram, null, 2));
      console.log('BAC4: Created empty Context diagram with v1.0.0 format');
    }

    // Open Context diagram (v0.6.0: No registration needed, self-contained diagrams)
    await this.openCanvasView(contextPath);
    console.log('BAC4: Dashboard opened successfully');
  }

  /**
   * Check if diagram is already open and activate it
   *
   * @param filePath - Path to check
   * @returns true if found and activated, false if not found
   * @private
   */
  private checkAndActivateExistingDiagram(filePath: string): boolean {
    const existingLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
    const existingLeaf = existingLeaves.find((leaf) => {
      const view = leaf.view as { file?: { path?: string } };
      return view.file?.path === filePath;
    });

    if (existingLeaf) {
      console.log('BAC4: Diagram already open, activating existing tab:', filePath);
      this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
      return true;
    }

    return false;
  }

  /**
   * Open diagram file (unified method)
   *
   * Single source of truth for opening diagrams.
   * Handles duplicate detection and tab management.
   *
   * @param filePath - Path to .bac4 file to open
   * @param options - Opening options
   * @returns Promise that resolves when diagram is opened
   * @private
   */
  private async openDiagram(filePath: string, options: { newTab?: boolean } = {}): Promise<void> {
    console.log('BAC4: Opening diagram:', filePath, 'newTab:', options.newTab);

    // Check if already open
    if (this.checkAndActivateExistingDiagram(filePath)) {
      return; // Already open, activated it
    }

    // Get file
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      console.error('BAC4: File not found:', filePath);
      return;
    }

    // Get leaf (new tab or current)
    const leaf = options.newTab
      ? this.app.workspace.getLeaf('tab')
      : this.app.workspace.getLeaf(false);

    // Open file
    await leaf.openFile(file as TFile);

    // Activate
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    console.log('BAC4: Diagram opened successfully');
  }

  /**
   * Open canvas view in a NEW tab (for child diagram navigation)
   *
   * Used for drill-down navigation to keep parent diagram visible.
   * When double-clicking a node with a child diagram, this opens the
   * child in a new tab instead of replacing the current view.
   *
   * @param filePath - Path to the .bac4 diagram file to open
   * @returns Promise that resolves when new tab is opened
   *
   * @example
   * ```ts
   * // User double-clicks "API Gateway" node in Context diagram
   * await plugin.openCanvasViewInNewTab('API_Gateway.bac4');
   * // Opens API_Gateway container diagram in new tab
   * ```
   */
  async openCanvasViewInNewTab(filePath: string): Promise<void> {
    return this.openDiagram(filePath, { newTab: true });
  }

  /**
   * Open canvas view for a diagram file
   *
   * Primary method for opening .bac4 diagrams in the canvas view.
   * Handles multiple scenarios:
   * - No path: Create new "Untitled" diagram
   * - Path provided: Use unified openDiagram() method
   *
   * **Duplicate Prevention:**
   * Uses unified duplicate detection via openDiagram()
   *
   * @param filePath - Optional path to .bac4 file. If omitted, creates new diagram.
   * @returns Promise that resolves when diagram is opened
   *
   * @example
   * ```ts
   * // Create new diagram
   * await plugin.openCanvasView();
   * // Creates Untitled.bac4
   *
   * // Open existing diagram
   * await plugin.openCanvasView('MySystem.bac4');
   * // Opens MySystem.bac4 in canvas view
   * ```
   */
  async openCanvasView(filePath?: string): Promise<void> {
    const { workspace } = this.app;

    // If no file path provided, create a new diagram file
    if (!filePath) {
      // Ensure BAC4 directory exists
      if (!(await this.app.vault.adapter.exists('BAC4'))) {
        console.log('BAC4: Creating BAC4 directory');
        await this.app.vault.createFolder('BAC4');
      }

      // Always create a new diagram file in BAC4 folder
      // Use simple "Untitled" name, add number if file exists
      let fileName = 'Untitled.bac4';
      let fullPath = `BAC4/${fileName}`;
      let counter = 1;

      while (this.app.vault.getAbstractFileByPath(fullPath)) {
        counter++;
        fileName = `Untitled ${counter}.bac4`;
        fullPath = `BAC4/${fileName}`;
      }

      console.log('BAC4: Creating new diagram file:', fullPath);

      // Create in BAC4 folder
      // v1.0.0 format with timeline
      const now = new Date().toISOString();
      const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
      const initialData = {
        version: '1.0.0',
        metadata: {
          diagramType: 'context',
          createdAt: now,
          updatedAt: now,
        },
        timeline: initialTimeline,
      };

      const file = await this.app.vault.create(fullPath, JSON.stringify(initialData, null, 2));

      // Open the file directly (v0.6.0: No registration needed, self-contained diagrams)
      const leaf = workspace.getLeaf(false);
      await leaf.openFile(file);
      return;
    }

    // If filePath provided, use unified opening method
    await this.openDiagram(filePath, { newTab: false });
  }

  /**
   * Register all plugin commands
   *
   * v2.0.0 Commands:
   * - Open Dashboard: Opens main Context diagram
   * - Create Layer Diagrams: All 7 layers (Market → Code)
   * - Timeline: Add snapshots for versioning
   * - Graph View: Visualize diagram relationships
   * - Export: Convert to Canvas format
   * - Settings: Plugin configuration
   *
   * @private
   */
  private registerCommands() {
    // Open Dashboard
    this.addCommand({
      id: COMMAND_OPEN_DASHBOARD,
      name: 'Open Dashboard',
      callback: async () => {
        await this.openDashboard();
      },
    });

    // Open Settings
    this.addCommand({
      id: COMMAND_OPEN_SETTINGS,
      name: 'Open Settings',
      callback: () => {
        console.log('Open Settings command executed');
        // @ts-ignore - Obsidian internal API
        this.app.setting.open();
        // @ts-ignore - Obsidian internal API
        this.app.setting.openTabById(this.manifest.id);
      },
    });

    // Timeline Commands
    this.addCommand({
      id: 'bac4-add-snapshot',
      name: 'Add Timeline Snapshot',
      checkCallback: (checking: boolean) => {
        // Only enable if a BAC4 diagram is open
        const activeView = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
        if (!activeView) {
          return false;
        }

        if (!checking) {
          // Call the handleAddSnapshot method exposed by the view
          if (activeView.handleAddSnapshot) {
            activeView.handleAddSnapshot();
          } else {
            new Notice('Timeline not initialized yet. Please wait a moment and try again.');
          }
        }

        return true;
      },
    });

    // Diagram Creation Commands (v2.0.0: 7-layer enterprise architecture model)
    this.addCommand({
      id: 'bac4-create-market-diagram',
      name: 'Create New Market Diagram (Layer 1)',
      callback: async () => {
        await this.createNewDiagram('market');
      },
    });

    this.addCommand({
      id: 'bac4-create-organisation-diagram',
      name: 'Create New Organisation Diagram (Layer 2)',
      callback: async () => {
        await this.createNewDiagram('organisation');
      },
    });

    this.addCommand({
      id: 'bac4-create-capability-diagram',
      name: 'Create New Capability Diagram (Layer 3)',
      callback: async () => {
        await this.createNewDiagram('capability');
      },
    });

    this.addCommand({
      id: 'bac4-create-context-diagram',
      name: 'Create New Context Diagram (Layer 4)',
      callback: async () => {
        await this.createNewDiagram('context');
      },
    });

    this.addCommand({
      id: 'bac4-create-container-diagram',
      name: 'Create New Container Diagram (Layer 5)',
      callback: async () => {
        await this.createNewDiagram('container');
      },
    });

    this.addCommand({
      id: 'bac4-create-component-diagram',
      name: 'Create New Component Diagram (Layer 6)',
      callback: async () => {
        await this.createNewDiagram('component');
      },
    });

    this.addCommand({
      id: 'bac4-create-code-diagram',
      name: 'Create New Code Diagram (Layer 7)',
      callback: async () => {
        await this.createNewDiagram('code');
      },
    });

    // Wardley Map Command (v2.5.0)
    this.addCommand({
      id: 'bac4-create-wardley-map',
      name: 'Create New Wardley Map',
      callback: async () => {
        await this.createNewDiagram('wardley');
      },
    });

    // Graph View Command (Cmd+Shift+G)
    this.addCommand({
      id: 'bac4-open-graph-view',
      name: 'Open Graph View',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'g' }],
      callback: async () => {
        await this.openGraphView();
      },
    });

    // Export to Canvas Command
    this.addCommand({
      id: 'bac4-export-to-canvas',
      name: 'Export Diagram to Canvas',
      checkCallback: (checking: boolean) => {
        // Only enable if a BAC4 diagram is open
        const activeView = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
        if (!activeView) {
          return false;
        }

        if (!checking) {
          this.exportDiagramToCanvas(activeView);
        }

        return true;
      },
    });

    // Reset Graph Layout Command (v2.0.1)
    this.addCommand({
      id: 'bac4-reset-graph-layout',
      name: 'Reset Graph Layout',
      callback: async () => {
        await this.resetGraphLayout();
      },
    });

    // Graph Layout Selection Commands (v2.0.2: Phase 3)
    this.addCommand({
      id: 'bac4-set-layout-hierarchical',
      name: 'Graph View: Set Hierarchical Layout',
      callback: async () => {
        await this.setGraphLayout('hierarchical');
      },
    });

    this.addCommand({
      id: 'bac4-set-layout-grid',
      name: 'Graph View: Set Grid Layout',
      callback: async () => {
        await this.setGraphLayout('grid');
      },
    });

    this.addCommand({
      id: 'bac4-set-layout-force-directed',
      name: 'Graph View: Set Force-Directed Layout',
      callback: async () => {
        await this.setGraphLayout('force-directed');
      },
    });

    this.addCommand({
      id: 'bac4-set-layout-circular',
      name: 'Graph View: Set Circular Layout',
      callback: async () => {
        await this.setGraphLayout('circular');
      },
    });

    // Graph Filter Commands (v2.1.0: Phase 4)
    this.addCommand({
      id: 'bac4-filter-only-market',
      name: 'Graph View: Show Only Market Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['market'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-only-organisation',
      name: 'Graph View: Show Only Organisation Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['organisation'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-only-capability',
      name: 'Graph View: Show Only Capability Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['capability'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-only-context',
      name: 'Graph View: Show Only Context Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['context'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-only-container',
      name: 'Graph View: Show Only Container Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['container'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-only-component',
      name: 'Graph View: Show Only Component Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['component'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-only-code',
      name: 'Graph View: Show Only Code Layer',
      callback: async () => {
        await this.setGraphFilter({ layers: ['code'] });
      },
    });

    this.addCommand({
      id: 'bac4-filter-isolated',
      name: 'Graph View: Show Isolated Diagrams',
      callback: async () => {
        await this.setGraphFilter({ connectionFilter: 'isolated' });
      },
    });

    this.addCommand({
      id: 'bac4-filter-hub',
      name: 'Graph View: Show Hub Diagrams (5+ connections)',
      callback: async () => {
        await this.setGraphFilter({ connectionFilter: 'hub', minConnections: 5 });
      },
    });

    this.addCommand({
      id: 'bac4-filter-reset',
      name: 'Graph View: Reset Filters',
      callback: async () => {
        await this.resetGraphFilters();
      },
    });

    // Graph Statistics Command (v2.1.0: Phase 5)
    this.addCommand({
      id: 'bac4-show-graph-stats',
      name: 'Graph View: Show Statistics',
      callback: async () => {
        await this.showGraphStatistics();
      },
    });

    // ========================================================================
    // Migration Commands (v2.5.0)
    // ========================================================================

    this.addCommand({
      id: 'migrate-to-v2-5',
      name: 'Migrate Diagrams to v2.5.0 Format',
      callback: async () => {
        const migrationService = new MigrationService(this.app);

        // Confirm before migrating
        const confirmModal = new ConfirmationModal(
          this.app,
          'Migrate to v2.5.0 Format',
          `This will migrate all .bac4 files to the new v2.5.0 format.

**What will happen:**
• Each .bac4 file will be split into two files:
  - .bac4 (nodes/semantic data)
  - .bac4-graph (relationships/layout)
• Backups will be created (.bac4.v1.backup)
• A migration report will be generated

**This is a breaking change.** Old plugins will not work with new format.

Continue with migration?`,
          async () => {
            new Notice('Starting migration...', 3000);
            const stats = await migrationService.migrateAllDiagrams({
              dryRun: false,
              createBackups: true,
            });

            if (stats.failed > 0) {
              new Notice(
                `Migration completed with errors. ${stats.migrated} migrated, ${stats.failed} failed. See report for details.`,
                10000
              );
            } else {
              new Notice(
                `Migration complete! ${stats.migrated} diagrams migrated successfully.`,
                5000
              );
            }
          }
        );
        confirmModal.open();
      },
    });

    this.addCommand({
      id: 'dry-run-migration',
      name: 'Dry Run Migration (Test Only)',
      callback: async () => {
        new Notice('Running dry run migration (no changes will be made)...', 3000);

        const migrationService = new MigrationService(this.app);
        const stats = await migrationService.dryRunMigration();

        const message = `Dry run complete!

Would migrate: ${stats.migrated}
Would skip: ${stats.skipped}
Would fail: ${stats.failed}

No changes were made. Run "Migrate Diagrams to v2.5.0" to perform actual migration.`;

        new Notice(message, 10000);
        console.log('BAC4 v2.5: Dry run results:', stats);
      },
    });

    this.addCommand({
      id: 'rollback-migration',
      name: 'Rollback v2.5.0 Migration (Emergency)',
      callback: async () => {
        const confirmModal = new ConfirmationModal(
          this.app,
          'Rollback Migration',
          `This will rollback the v2.5.0 migration.

**What will happen:**
• Restore original .bac4 files from backups
• Delete .bac4-graph files
• Delete backup files

**Warning:** This will undo all changes made during migration.

Continue with rollback?`,
          async () => {
            new Notice('Rolling back migration...', 3000);

            const migrationService = new MigrationService(this.app);
            await migrationService.rollbackMigration();
          }
        );
        confirmModal.open();
      },
    });

    this.addCommand({
      id: 'show-migration-status',
      name: 'Show Migration Status',
      callback: async () => {
        const migrationService = new MigrationService(this.app);
        const bac4Files = this.app.vault.getFiles().filter((f) => f.path.endsWith('.bac4'));

        if (bac4Files.length === 0) {
          new Notice('No .bac4 files found in vault');
          return;
        }

        let v1Count = 0;
        let v2Count = 0;
        let unknownCount = 0;

        for (const file of bac4Files) {
          try {
            const status = await migrationService.getMigrationStatus(file);
            if (status.version === '2.5.0') {
              v2Count++;
            } else if (status.version.startsWith('2.') || status.version.startsWith('1.')) {
              v1Count++;
            } else {
              unknownCount++;
            }
          } catch (error) {
            unknownCount++;
          }
        }

        const message = `Migration Status:

Total .bac4 files: ${bac4Files.length}
• v2.5.0 (new format): ${v2Count}
• v1 (old format): ${v1Count}
• Unknown/Error: ${unknownCount}

${
  v1Count > 0
    ? `\n⚠️ ${v1Count} files need migration. Run "Migrate Diagrams to v2.5.0".`
    : '✅ All files are up to date!'
}`;

        new Notice(message, 10000);
        console.log('BAC4 v2.5: Migration status:', { v1Count, v2Count, unknownCount });
      },
    });

    // ========================================================================
    // AI Commands (v2.4.0)
    // ========================================================================

    this.addCommand({
      id: 'bac4-validate-diagram',
      name: 'AI: Validate Current Diagram',
      checkCallback: (checking: boolean) => {
        const activeView = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
        if (!activeView) return false;

        if (!checking) {
          this.runDiagramValidation(activeView);
        }
        return true;
      },
    });

    this.addCommand({
      id: 'bac4-analyze-architecture',
      name: 'AI: Analyze Architecture',
      checkCallback: (checking: boolean) => {
        const activeView = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
        if (!activeView) return false;

        if (!checking) {
          this.runArchitectureAnalysis(activeView);
        }
        return true;
      },
    });

    this.addCommand({
      id: 'bac4-suggest-improvements',
      name: 'AI: Suggest Improvements',
      checkCallback: (checking: boolean) => {
        const activeView = this.app.workspace.getActiveViewOfType(BAC4CanvasView);
        if (!activeView) return false;

        if (!checking) {
          this.runDiagramSuggestions(activeView);
        }
        return true;
      },
    });
  }

  /**
   * Create a new diagram of a specific type
   *
   * v2.0.0: Creates diagrams for any of the 7 layers
   * v2.5.0: Added Wardley Map support
   *
   * @param diagramType - Type of diagram to create
   */
  private async createNewDiagram(
    diagramType: 'market' | 'organisation' | 'capability' | 'context' | 'container' | 'component' | 'code' | 'wardley'
  ): Promise<void> {
    console.log('BAC4 v2.5: Creating new diagram:', diagramType);

    // Ensure BAC4 directory exists
    if (!(await this.app.vault.adapter.exists('BAC4'))) {
      console.log('BAC4 v2.5: Creating BAC4 directory');
      await this.app.vault.createFolder('BAC4');
    }

    // Generate unique file name in BAC4 folder
    const typeLabel = diagramType.charAt(0).toUpperCase() + diagramType.slice(1);
    let fileName = `New ${typeLabel}.bac4`;
    let filePath = `BAC4/${fileName}`;
    let counter = 1;

    while (this.app.vault.getAbstractFileByPath(filePath)) {
      counter++;
      fileName = `New ${typeLabel} ${counter}.bac4`;
      filePath = `BAC4/${fileName}`;
    }

    console.log('BAC4 v2.5: Creating diagram files:', filePath);

    // Create diagram with v2.5.0 dual-file format
    const { createDefaultBAC4File, createDefaultGraphFile } = await import('./types/bac4-v2-types');
    const { writeDiagram } = await import('./services/file-io-service');

    const nodeFile = createDefaultBAC4File(
      `New ${typeLabel}`,
      diagramType as any,
      diagramType as any
    );

    const graphFile = createDefaultGraphFile(
      fileName,
      `New ${typeLabel}`,
      diagramType === 'wardley' ? 'wardley' : 'c4-context'
    );

    await writeDiagram(this.app.vault, filePath, nodeFile, graphFile);
    console.log('BAC4 v2.5: Created dual files (node + graph):', filePath);

    // Open the new diagram
    await this.openCanvasView(filePath);

    new Notice(`Created ${fileName}`);
  }

  /**
   * Export current diagram to JSONCanvas format
   *
   * Creates a .canvas file from the current BAC4 diagram for viewing in
   * Obsidian's native Canvas. This is a lossy export (loses timeline, C4 styling,
   * annotations) but allows viewing in native Canvas.
   *
   * @param view - Active BAC4 canvas view
   */
  private async exportDiagramToCanvas(view: BAC4CanvasView): Promise<void> {
    try {
      console.log('BAC4: Exporting diagram to Canvas format...');

      // Get nodes and edges from view
      const nodes = view.getNodes();
      const edges = view.getEdges();

      if (!nodes || !edges) {
        new Notice('No diagram data to export');
        return;
      }

      // Get current file path
      const filePath = view.getFilePath();
      if (!filePath) {
        new Notice('Please save the diagram first');
        return;
      }

      // Generate export path
      const exportPath = filePath.replace('.bac4', '.canvas');

      // Check if export already exists
      const existingFile = this.app.vault.getAbstractFileByPath(exportPath);
      if (existingFile) {
        new Notice('Canvas export already exists. Delete it first to re-export.');
        return;
      }

      // Import exporter
      const { JSONCanvasExporter } = await import('./services/jsoncanvas-exporter');

      // Convert to Canvas format
      const canvasData = JSONCanvasExporter.exportDiagramToCanvas(nodes, edges);

      // Validate before saving
      if (!JSONCanvasExporter.validate(canvasData)) {
        console.error('BAC4: Generated invalid canvas data during export');
        new Notice('Failed to export - invalid canvas data');
        return;
      }

      const canvasJson = JSONCanvasExporter.serialize(canvasData, true);

      // Create .canvas file
      await this.app.vault.create(exportPath, canvasJson);

      console.log('BAC4: Exported to', exportPath);
      new Notice(`✅ Exported to ${exportPath.split('/').pop()}`);

    } catch (error) {
      console.error('BAC4: Export to Canvas failed:', error);
      new Notice('Failed to export diagram to Canvas');
    }
  }

  /**
   * Open the graph view
   *
   * The graph view is a special meta-visualization that shows all diagrams
   * in the vault and their relationships. As of v1.0.1, this uses Obsidian's
   * native Canvas format (.canvas) for better UX and interoperability.
   *
   * **Features:**
   * - Native Obsidian Canvas view (editable, better performance)
   * - File nodes link to .bac4 diagrams (click to open)
   * - Auto-regenerated each time (always fresh)
   * - User can manually rearrange layout
   */
  private async openGraphView(): Promise<void> {
    console.log('BAC4: Opening graph view (native Canvas format)...');

    // Ensure BAC4 directory exists
    if (!(await this.app.vault.adapter.exists('BAC4'))) {
      console.log('BAC4: Creating BAC4 directory');
      await this.app.vault.createFolder('BAC4');
    }

    // Use .canvas extension for native Obsidian Canvas
    const filePath = 'BAC4/__graph_view__.canvas';

    // Check if temp file exists and delete it (always regenerate fresh)
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      console.log('BAC4: Deleting existing graph view to regenerate');
      await this.app.vault.delete(existingFile as TFile);
    }

    // Generate graph data
    const { GraphGenerationService } = await import('./services/graph-generation-service');
    const { JSONCanvasExporter } = await import('./services/jsoncanvas-exporter');

    console.log('BAC4: Generating graph data...');
    const layoutType = this.settings.graphLayout || 'hierarchical';

    // Ensure graphFilter exists (for users upgrading from older versions)
    const filter = this.settings.graphFilter || {
      layers: [],
      connectionFilter: 'all' as const,
      minConnections: 5,
    };

    const { nodes, edges } = await GraphGenerationService.generateGraph(this.app.vault, layoutType, filter);
    console.log(`BAC4: Generated ${nodes.length} nodes, ${edges.length} edges with ${layoutType} layout`);

    // Convert to JSONCanvas format
    const canvasData = JSONCanvasExporter.exportGraphToCanvas(nodes, edges);

    // Validate before saving
    if (!JSONCanvasExporter.validate(canvasData)) {
      console.error('BAC4: Generated invalid canvas data');
      new Notice('Failed to generate graph view - invalid data');
      return;
    }

    const canvasJson = JSONCanvasExporter.serialize(canvasData, true);

    // Create .canvas file
    const file = await this.app.vault.create(filePath, canvasJson);
    console.log('BAC4: Graph view .canvas file created');

    // Open in native Obsidian Canvas view
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file as TFile);

    new Notice(`Graph View - ${nodes.length} diagrams found (Cmd+Shift+G)`);
  }

  /**
   * Reset graph layout to default
   *
   * Deletes saved layout file, causing next graph view to use default hierarchical layout.
   *
   * v2.0.1: Phase 2 - Persistent Layout
   */
  private async resetGraphLayout(): Promise<void> {
    console.log('BAC4: Resetting graph layout...');

    const { GraphLayoutService } = await import('./services/graph-layout-service');

    try {
      await GraphLayoutService.resetLayout(this.app.vault);
      new Notice('Graph layout reset to default. Reopen graph view to see changes.');
    } catch (error) {
      console.error('BAC4: Error resetting graph layout:', error);
      new Notice('Failed to reset graph layout');
    }
  }

  /**
   * Set graph layout algorithm
   *
   * Changes the layout algorithm used for graph view and reopens it.
   *
   * v2.0.2: Phase 3 - Layout Options
   *
   * @param layoutType - Layout algorithm to use
   */
  private async setGraphLayout(layoutType: string): Promise<void> {
    console.log('BAC4: Setting graph layout to:', layoutType);

    // Update settings
    this.settings.graphLayout = layoutType;
    await this.saveSettings();

    // Reopen graph view with new layout
    new Notice(`Graph layout set to ${layoutType}. Reopening graph view...`);
    await this.openGraphView();
  }

  /**
   * Set graph filter
   *
   * Applies filter to graph view and reopens it.
   *
   * v2.1.0: Phase 4 - Filtering & Search
   *
   * @param filter - Partial filter to apply (merged with existing)
   */
  private async setGraphFilter(filter: Partial<typeof this.settings.graphFilter>): Promise<void> {
    console.log('BAC4: Setting graph filter:', filter);

    // Ensure graphFilter exists (for users upgrading from older versions)
    if (!this.settings.graphFilter) {
      this.settings.graphFilter = {
        layers: [],
        connectionFilter: 'all',
        minConnections: 5,
      };
    }

    // Merge with existing filter
    this.settings.graphFilter = { ...this.settings.graphFilter, ...filter };
    await this.saveSettings();

    // Reopen graph view with new filter
    const filterDesc = this.describeFilter(filter);
    new Notice(`Graph filter set: ${filterDesc}. Reopening graph view...`);
    await this.openGraphView();
  }

  /**
   * Reset graph filters
   *
   * Clears all filters and reopens graph view.
   *
   * v2.1.0: Phase 4 - Filtering & Search
   */
  private async resetGraphFilters(): Promise<void> {
    console.log('BAC4: Resetting graph filters');

    // Reset to defaults
    this.settings.graphFilter = {
      layers: [],
      connectionFilter: 'all',
      minConnections: 5,
    };
    await this.saveSettings();

    // Reopen graph view
    new Notice('Graph filters reset. Showing all diagrams...');
    await this.openGraphView();
  }

  /**
   * Describe filter in human-readable format
   *
   * @param filter - Filter to describe
   * @returns Human-readable description
   * @private
   */
  private describeFilter(filter: Partial<typeof this.settings.graphFilter>): string {
    if (filter.layers && filter.layers.length > 0) {
      return `${filter.layers.join(', ')} layer`;
    }
    if (filter.connectionFilter === 'isolated') {
      return 'isolated diagrams';
    }
    if (filter.connectionFilter === 'hub') {
      return `hub diagrams (${filter.minConnections}+ connections)`;
    }
    return 'custom filter';
  }

  /**
   * Show graph statistics
   *
   * Displays statistics about diagram distribution and connections.
   *
   * v2.1.0: Phase 5 - Statistics & Analytics
   */
  private async showGraphStatistics(): Promise<void> {
    console.log('BAC4: Generating graph statistics...');

    const { GraphGenerationService } = await import('./services/graph-generation-service');
    const { GraphFilterService } = await import('./services/graph-filter-service');

    // Get all diagrams
    const diagramFiles = await GraphGenerationService.getAllDiagrams(this.app.vault);
    const allMetadata = [];
    for (const file of diagramFiles) {
      const metadata = await GraphGenerationService.parseDiagramMetadata(this.app.vault, file);
      if (metadata) {
        allMetadata.push(metadata);
      }
    }

    // Calculate statistics
    const layerDist = GraphFilterService.getLayerDistribution(allMetadata);
    const connStats = GraphFilterService.getConnectionStatistics(allMetadata);

    // Format layer distribution
    const layerOrder = ['market', 'organisation', 'capability', 'context', 'container', 'component', 'code'];
    const layerLines = layerOrder.map((layer) => {
      const count = layerDist.get(layer as any) || 0;
      const pct = allMetadata.length > 0 ? ((count / allMetadata.length) * 100).toFixed(1) : '0.0';
      const layerName = layer.charAt(0).toUpperCase() + layer.slice(1);
      return `├─ ${layerName.padEnd(14)} ${count.toString().padStart(2)} diagrams (${pct.padStart(5)}%)`;
    });

    // Build statistics message
    const stats = `
BAC4 Graph Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layer Distribution:
${layerLines.join('\n')}
└─ Total:         ${allMetadata.length} diagrams

Connection Statistics:
├─ Most connected: ${connStats.mostConnected?.displayName || 'None'} (${connStats.mostConnections} connections)
├─ Isolated:       ${connStats.isolatedCount} diagrams
└─ Average:        ${connStats.averageConnections.toFixed(1)} connections

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    // Create modal to display statistics
    const modal = document.createElement('div');
    modal.style.cssText = 'white-space: pre; font-family: monospace; font-size: 12px; padding: 20px;';
    modal.textContent = stats;

    // Show in notice (for simplicity - could be a custom modal later)
    console.log(stats);
    new Notice('Graph statistics generated - see console', 10000);

    // Also copy to clipboard
    navigator.clipboard.writeText(stats);
    new Notice('Statistics copied to clipboard', 3000);
  }

  /**
   * Save graph layout from Canvas file
   *
   * Reads node positions from __graph_view__.canvas and saves to layout file.
   * Called when user manually arranges nodes in Canvas view.
   *
   * v2.0.1: Phase 2 - Persistent Layout
   *
   * @param canvasFile - The graph view canvas file
   */
  private async saveGraphLayoutFromCanvas(canvasFile: TFile): Promise<void> {
    try {
      console.log('BAC4: Saving graph layout from Canvas modifications...');

      // Read canvas file
      const content = await this.app.vault.read(canvasFile);
      const canvasData = JSON.parse(content);

      if (!canvasData.nodes || !Array.isArray(canvasData.nodes)) {
        console.warn('BAC4: Canvas file has no nodes, skipping layout save');
        return;
      }

      const { GraphLayoutService } = await import('./services/graph-layout-service');
      const positions = new Map<string, { x: number; y: number; width: number; height: number }>();

      // Extract positions from canvas nodes
      // Canvas file nodes have 'file' property containing diagram path
      for (const node of canvasData.nodes) {
        if (node.type === 'file' && node.file) {
          const diagramPath = node.file;
          positions.set(diagramPath, {
            x: node.x || 0,
            y: node.y || 0,
            width: node.width || 200,
            height: node.height || 80,
          });
        }
      }

      if (positions.size > 0) {
        await GraphLayoutService.saveLayout(this.app.vault, positions);
        console.log(`BAC4: Saved ${positions.size} node positions from Canvas`);
      }
    } catch (error) {
      console.error('BAC4: Error saving graph layout from Canvas:', error);
    }
  }

  /**
   * Run AI validation on current diagram (v2.4.0)
   */
  private async runDiagramValidation(view: BAC4CanvasView): Promise<void> {
    new Notice('Running AI validation...');

    try {
      // Get nodes and edges from the view
      const nodes = view.getNodes ? view.getNodes() : [];
      const edges = view.getEdges ? view.getEdges() : [];
      const diagramType = view.getDiagramType ? view.getDiagramType() : 'context';
      const filePath = view.file?.path || 'Unknown';

      // Run validation
      const report = await this.aiValidation.validateDiagram(nodes, edges, diagramType, filePath);

      // Create validation report markdown
      const reportContent = this.formatValidationReport(report);

      // Create or update validation report file
      const reportPath = `BAC4/Validation-${view.file?.basename || 'Report'}.md`;
      const existingFile = this.app.vault.getAbstractFileByPath(reportPath);

      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, reportContent);
      } else {
        await this.app.vault.create(reportPath, reportContent);
      }

      // Open report
      const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
      if (reportFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(reportFile);
      }

      new Notice(`Validation complete! Score: ${report.score}/100 (${report.summary.errors} errors, ${report.summary.warnings} warnings)`);
    } catch (error) {
      console.error('BAC4: Validation error:', error);
      new Notice('Validation failed. See console for details.');
    }
  }

  /**
   * Run architecture analysis on current diagram (v2.4.0)
   */
  private async runArchitectureAnalysis(view: BAC4CanvasView): Promise<void> {
    new Notice('Running architecture analysis...');

    try {
      const nodes = view.getNodes ? view.getNodes() : [];
      const edges = view.getEdges ? view.getEdges() : [];
      const diagramType = view.getDiagramType ? view.getDiagramType() : 'context';
      const filePath = view.file?.path || 'Unknown';

      // Run analysis
      const report = await this.architectureAnalyzer.analyzeArchitecture(nodes, edges, diagramType, filePath);

      // Create analysis report markdown
      const reportContent = this.formatAnalysisReport(report);

      // Create or update analysis report file
      const reportPath = `BAC4/Analysis-${view.file?.basename || 'Report'}.md`;
      const existingFile = this.app.vault.getAbstractFileByPath(reportPath);

      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, reportContent);
      } else {
        await this.app.vault.create(reportPath, reportContent);
      }

      // Open report
      const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
      if (reportFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(reportFile);
      }

      new Notice(`Analysis complete! Grade: ${report.qualityGrade} (Score: ${report.overallScore}/100)`);
    } catch (error) {
      console.error('BAC4: Analysis error:', error);
      new Notice('Analysis failed. See console for details.');
    }
  }

  /**
   * Run AI suggestions on current diagram (v2.4.0)
   */
  private async runDiagramSuggestions(view: BAC4CanvasView): Promise<void> {
    new Notice('Generating AI suggestions...');

    try {
      const nodes = view.getNodes ? view.getNodes() : [];
      const edges = view.getEdges ? view.getEdges() : [];
      const diagramType = view.getDiagramType ? view.getDiagramType() : 'context';
      const filePath = view.file?.path || 'Unknown';

      // Generate suggestions
      const report = await this.aiSuggestions.generateSuggestions(nodes, edges, diagramType, filePath);

      // Create suggestions report markdown
      const reportContent = this.formatSuggestionsReport(report);

      // Create or update suggestions report file
      const reportPath = `BAC4/Suggestions-${view.file?.basename || 'Report'}.md`;
      const existingFile = this.app.vault.getAbstractFileByPath(reportPath);

      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, reportContent);
      } else {
        await this.app.vault.create(reportPath, reportContent);
      }

      // Open report
      const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
      if (reportFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(reportFile);
      }

      new Notice(`${report.summary.total} suggestions generated (${report.summary.highPriority} high priority)`);
    } catch (error) {
      console.error('BAC4: Suggestions error:', error);
      new Notice('Suggestion generation failed. See console for details.');
    }
  }

  /**
   * Format validation report as markdown
   */
  private formatValidationReport(report: any): string {
    return `# Diagram Validation Report

**Diagram:** ${report.diagramPath}
**Type:** ${report.diagramType}
**Timestamp:** ${report.timestamp}
**Score:** ${report.score}/100

## Summary

- ❌ **Errors:** ${report.summary.errors}
- ⚠️ **Warnings:** ${report.summary.warnings}
- ℹ️ **Info:** ${report.summary.info}

## Issues

${report.issues.length === 0 ? '✅ No issues found!' : report.issues.map((issue: any) => `
### ${this.getSeverityIcon(issue.severity)} ${issue.title}

**Severity:** ${issue.severity}
**Type:** ${issue.type}

${issue.description}

${issue.suggestion ? `**Suggestion:** ${issue.suggestion}` : ''}

${issue.affectedNodes.length > 0 ? `**Affected Nodes:** ${issue.affectedNodes.join(', ')}` : ''}
${issue.affectedEdges.length > 0 ? `**Affected Edges:** ${issue.affectedEdges.join(', ')}` : ''}
`).join('\n---\n')}

---

*Generated by BAC4 AI Validation Service v2.4.0*
`;
  }

  /**
   * Format analysis report as markdown
   */
  private formatAnalysisReport(report: any): string {
    return `# Architecture Analysis Report

**Diagram:** ${report.diagramPath}
**Type:** ${report.diagramType}
**Timestamp:** ${report.timestamp}
**Overall Score:** ${report.overallScore}/100
**Quality Grade:** ${report.qualityGrade}

## Complexity Metrics

- **Cyclomatic Complexity:** ${report.complexity.cyclomaticComplexity}
- **Coupling Score:** ${report.complexity.couplingScore}/100
- **Cohesion Score:** ${report.complexity.cohesionScore}/100
- **Abstraction Level:** ${report.complexity.abstractionLevel}%
- **Instability Score:** ${report.complexity.instabilityScore}/100
- **Main Sequence Distance:** ${report.complexity.mainSequenceDistance.toFixed(2)}

## Dependency Analysis

- **Total Dependencies:** ${report.dependencies.totalDependencies}
- **Direct Dependencies:** ${report.dependencies.directDependencies}
- **Transitive Dependencies:** ${report.dependencies.transitiveDependencies}
- **Circular Dependencies:** ${report.dependencies.circularDependencies.length}
- **Isolated Components:** ${report.dependencies.isolatedComponents.length}
- **Critical Path Length:** ${report.dependencies.criticalPath.length}

## Cohesion Analysis

- **Component Groups:** ${report.cohesion.componentGroups.length}
- **Inter-Group Coupling:** ${report.cohesion.interGroupCoupling}%
- **Intra-Group Cohesion:** ${report.cohesion.intraGroupCohesion}%
- **Suggested Merges:** ${report.cohesion.suggestedMerges.length}
- **Suggested Splits:** ${report.cohesion.suggestedSplits.length}

## Detected Architectural Patterns

${report.technologyStack.detectedPatterns.length === 0 ? '*No patterns detected*' : report.technologyStack.detectedPatterns.map((pattern: any) => `
### ${pattern.name} (Confidence: ${pattern.confidence}%)

${pattern.description}

**Benefits:**
${pattern.benefits.map((b: string) => `- ${b}`).join('\n')}

**Concerns:**
${pattern.concerns.map((c: string) => `- ${c}`).join('\n')}
`).join('\n')}

## Recommendations

${report.recommendations.map((rec: any, i: number) => `
### ${i + 1}. ${rec.title}

**Priority:** ${rec.priority.toUpperCase()}
**Category:** ${rec.category}
**Effort:** ${rec.effort} | **Impact:** ${rec.impact}

${rec.description}

**Benefits:**
${rec.benefits.map((b: string) => `- ${b}`).join('\n')}
`).join('\n')}

---

*Generated by BAC4 Architecture Analyzer Service v2.4.0*
`;
  }

  /**
   * Format suggestions report as markdown
   */
  private formatSuggestionsReport(report: any): string {
    return `# AI Suggestions Report

**Diagram:** ${report.diagramPath}
**Type:** ${report.diagramType}
**Timestamp:** ${report.timestamp}

## Summary

- **Total Suggestions:** ${report.summary.total}
- **High Priority:** ${report.summary.highPriority}
- **Medium Priority:** ${report.summary.mediumPriority}
- **Low Priority:** ${report.summary.lowPriority}
- **Auto-Applicable:** ${report.summary.autoApplicable}

## Suggestions

${report.suggestions.map((sug: any, i: number) => `
### ${i + 1}. ${sug.title}

**Priority:** ${sug.priority.toUpperCase()} | **Type:** ${sug.type} | **Confidence:** ${sug.confidence}%

${sug.description}

**Rationale:** ${sug.rationale}

${sug.autoApplicable ? '✅ **Can be auto-applied**' : ''}
`).join('\n---\n')}

---

*Generated by BAC4 AI Suggestions Service v2.4.0*
`;
  }

  /**
   * Get severity icon for validation issues
   */
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  }
}

/**
 * Confirmation Modal for Migration Commands
 *
 * Simple modal that shows a message and asks for confirmation.
 * Used by migration commands to ensure user intent.
 *
 * v2.5.0
 */
class ConfirmationModal extends Modal {
  constructor(
    app: App,
    private title: string,
    private message: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: this.title });
    contentEl.createEl('p', { text: this.message, attr: { style: 'white-space: pre-wrap' } });

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const confirmButton = buttonContainer.createEl('button', { text: 'Continue' });
    confirmButton.style.flex = '1';
    confirmButton.addEventListener('click', () => {
      this.close();
      this.onConfirm();
    });

    const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelButton.style.flex = '1';
    cancelButton.addEventListener('click', () => {
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
