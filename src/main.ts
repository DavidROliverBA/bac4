import { Plugin, WorkspaceLeaf, TFile, Notice } from 'obsidian';
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
import './styles.css';

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

  async onload() {
    console.log('Loading BAC4 Plugin v' + this.manifest.version);

    // Load settings
    await this.loadSettings();

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
  }

  /**
   * Create a new diagram of a specific type
   *
   * v2.0.0: Creates diagrams for any of the 7 layers
   *
   * @param diagramType - Type of diagram to create
   */
  private async createNewDiagram(
    diagramType: 'market' | 'organisation' | 'capability' | 'context' | 'container' | 'component' | 'code'
  ): Promise<void> {
    console.log('BAC4: Creating new diagram:', diagramType);

    // Ensure BAC4 directory exists
    if (!(await this.app.vault.adapter.exists('BAC4'))) {
      console.log('BAC4: Creating BAC4 directory');
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

    console.log('BAC4: Creating diagram file:', filePath);

    // Create diagram with v1.0.0 format
    const now = new Date().toISOString();
    const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
    const diagramData = {
      version: '1.0.0',
      metadata: {
        diagramType,
        createdAt: now,
        updatedAt: now,
      },
      timeline: initialTimeline,
    };

    const file = await this.app.vault.create(filePath, JSON.stringify(diagramData, null, 2));
    console.log('BAC4: Diagram created:', file.path);

    // Open the new diagram
    await this.openCanvasView(file.path);

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
    const { nodes, edges } = await GraphGenerationService.generateGraph(this.app.vault, layoutType);
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
}
