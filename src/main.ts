import { Plugin, WorkspaceLeaf, TFile } from 'obsidian';
import { BAC4Settings } from './core/settings';
import { DEFAULT_SETTINGS, COMMAND_OPEN_DASHBOARD, COMMAND_CREATE_PROJECT, COMMAND_OPEN_SETTINGS, VIEW_TYPE_CANVAS } from './core/constants';
import { BAC4SettingsTab } from './ui/settings-tab';
import { BAC4CanvasView } from './ui/canvas-view';
import { hasBac4Diagram } from './utils/frontmatter-parser';
import './styles.css';

/**
 * BAC4 Plugin - Main entry point
 *
 * AI-Native Cloud Architecture Management for Obsidian.
 * Provides visual C4 model diagram editing with cloud component libraries,
 * hierarchical navigation, and MCP integration for AI-assisted architecture.
 *
 * **Core Features:**
 * - Visual C4 diagram editing (Context, Container, Component)
 * - Hierarchical drill-down navigation
 * - AWS/Azure/GCP component libraries
 * - Automatic diagram relationships
 * - Dashboard for system landscape view
 * - .bac4 file format for diagrams
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
 * // Access via: this.app.plugins.plugins['bac4-plugin']
 * ```
 */
export default class BAC4Plugin extends Plugin {
  settings!: BAC4Settings;

  async onload() {
    console.log('Loading BAC4 Plugin v' + this.manifest.version);

    // Load settings
    await this.loadSettings();

    // Register canvas view
    this.registerView(
      VIEW_TYPE_CANVAS,
      (leaf: WorkspaceLeaf) => new BAC4CanvasView(leaf, this)
    );

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

    // Register ribbon icon
    this.addRibbonIcon('layout-dashboard', 'BAC4 Dashboard', async () => {
      await this.openDashboard();
    });

    // Intercept file opens to handle both .bac4 and .md diagram files
    this.registerEvent(
      this.app.workspace.on('file-open', async (file) => {
        if (!file) return;

        // Handle .bac4 files - prevent duplicate tabs
        if (file.extension === 'bac4') {
          console.log('BAC4: file-open event for', file.path);

          // Use setTimeout to ensure all leaves are fully loaded
          setTimeout(() => {
            // Check if this file is already open in another leaf
            const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
            console.log('BAC4: Found', leaves.length, 'canvas leaves');

            const leavesWithThisFile = leaves.filter((leaf) => {
              const view = leaf.view as any;
              console.log('BAC4: Checking leaf with file:', view.file?.path);
              return view.file?.path === file.path;
            });

            console.log('BAC4: Found', leavesWithThisFile.length, 'leaves with file', file.path);

            // If the file is open in more than one leaf, close duplicates
            if (leavesWithThisFile.length > 1) {
              console.log('BAC4: Detected duplicate tabs for', file.path, '- keeping only one');
              // Keep the active one, close others
              const activeLeaf = this.app.workspace.activeLeaf;
              const duplicates = leavesWithThisFile.filter((leaf) => leaf !== activeLeaf);

              console.log('BAC4: Closing', duplicates.length, 'duplicate tabs');
              duplicates.forEach((leaf) => leaf.detach());
            }
          }, 50); // Wait 50ms for view to fully initialize
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
                  state: { file: file.path }
                });
              }
            }
          } catch (error) {
            console.error('BAC4: Error checking markdown file:', error);
          }
        }
      })
    );

    console.log('BAC4 Plugin loaded successfully');
  }

  async onunload() {
    console.log('Unloading BAC4 Plugin...');

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

      // Create empty Context diagram
      const emptyDiagram = {
        nodes: [],
        edges: [],
      };
      await this.app.vault.adapter.write(contextPath, JSON.stringify(emptyDiagram, null, 2));
      console.log('BAC4: Created empty Context diagram');
    }

    // Initialize relationships file
    const { DiagramNavigationService } = await import('./services/diagram-navigation-service');
    const navService = new DiagramNavigationService(this);
    await navService.ensureRelationshipsFile();
    console.log('BAC4: Ensured relationships file exists');

    // Register Context diagram in relationships (if not already registered)
    await navService.registerDiagram(contextPath, 'Context', 'context');
    console.log('BAC4: Registered Context diagram');

    // Open Context diagram
    await this.openCanvasView(contextPath);
    console.log('BAC4: Dashboard opened successfully');
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
    console.log('BAC4: Opening canvas in new tab:', filePath);

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      console.error('BAC4: File not found:', filePath);
      return;
    }

    // Force new tab
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.openFile(file as any);

    // Activate the new tab
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    console.log('BAC4: Opened in new tab');
  }

  /**
   * Open canvas view for a diagram file
   *
   * Primary method for opening .bac4 diagrams in the canvas view.
   * Handles multiple scenarios:
   * - No path: Create new "Untitled" diagram
   * - Path provided + already open: Activate existing tab
   * - Path provided + not open: Open in current/new leaf
   *
   * **Duplicate Prevention:**
   * Checks if file is already open before creating new leaf.
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
      // Always create a new diagram file
      // Use simple "Untitled" name, add number if file exists
      let fileName = 'Untitled.bac4';
      let counter = 1;

      while (this.app.vault.getAbstractFileByPath(fileName)) {
        counter++;
        fileName = `Untitled ${counter}.bac4`;
      }

      console.log('BAC4: Creating new diagram file:', fileName);

      // Create in default location (root of vault)
      // Simple structure: just nodes and edges (metadata in relationships.json)
      const initialData = {
        nodes: [],
        edges: [],
      };

      const file = await this.app.vault.create(fileName, JSON.stringify(initialData, null, 2));

      // Auto-register in relationships file
      const { DiagramNavigationService } = await import('./services/diagram-navigation-service');
      const navService = new DiagramNavigationService(this);
      await navService.registerDiagram(file.path, file.basename, 'context');

      // Open the file directly - this triggers onLoadFile
      const leaf = workspace.getLeaf(false);
      await leaf.openFile(file);
      return;
    }

    // If filePath provided, check if it's already open
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file) {
      // Check if this file is already open in a canvas view
      const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CANVAS);
      const existingLeaf = existingLeaves.find((leaf) => {
        const view = leaf.view as any;
        return view.file?.path === filePath;
      });

      if (existingLeaf) {
        // File already open, activate that leaf
        workspace.setActiveLeaf(existingLeaf, { focus: true });
        return;
      }

      // File not open, create new leaf
      const leaf = workspace.getLeaf(false);
      await leaf.openFile(file as any);
    }
  }

  /**
   * Register all plugin commands
   *
   * Registers commands that appear in the command palette:
   * - Open Dashboard: Opens main Context diagram
   * - Create New Project: Project structure creation (TODO)
   * - Open Settings: Opens plugin settings tab
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

    // Create New Project
    this.addCommand({
      id: COMMAND_CREATE_PROJECT,
      name: 'Create New Project',
      callback: () => {
        console.log('Create New Project command executed');
        // TODO: Implement project creation
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
  }
}
