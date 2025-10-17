import { Plugin, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { BAC4Settings } from './core/settings';
import {
  DEFAULT_SETTINGS,
  COMMAND_OPEN_DASHBOARD,
  COMMAND_CREATE_PROJECT,
  COMMAND_OPEN_SETTINGS,
  VIEW_TYPE_CANVAS,
} from './core/constants';
import { BAC4SettingsTab } from './ui/settings-tab';
import { BAC4CanvasView } from './ui/canvas-view';
import { hasBac4Diagram } from './utils/frontmatter-parser';
import { TimelineService } from './services/TimelineService';
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
    this.addRibbonIcon('dice-4', 'BAC4 Dashboard', async () => {
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

    // Register file rename listener (v0.6.0: Auto-update linkedDiagramPath and linkedMarkdownPath)
    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!(file instanceof TFile)) return;

        // Only care about .bac4 and .md file renames
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

      const file = await this.app.vault.create(fileName, JSON.stringify(initialData, null, 2));

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
   * Registers commands that appear in the command palette:
   * - Open Dashboard: Opens main Context diagram
   * - Create New Project: Project structure creation (TODO)
   * - Open Settings: Opens plugin settings tab
   * - Generate Diagram from Description: AI-powered diagram generation
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

    // MCP-Powered Commands
    // Generate Context Diagram from Description
    this.addCommand({
      id: 'bac4-generate-context-diagram',
      name: 'Generate Context Diagram from Description',
      callback: async () => {
        await this.generateDiagramFromDescription('context');
      },
    });

    // Generate Container Diagram from Description
    this.addCommand({
      id: 'bac4-generate-container-diagram',
      name: 'Generate Container Diagram from Description',
      callback: async () => {
        await this.generateDiagramFromDescription('container');
      },
    });

    // Generate Component Diagram from Description
    this.addCommand({
      id: 'bac4-generate-component-diagram',
      name: 'Generate Component Diagram from Description',
      callback: async () => {
        await this.generateDiagramFromDescription('component');
      },
    });

    // MCP Direct Generation - Import from File
    this.addCommand({
      id: 'bac4-import-mcp-generated-diagram',
      name: 'Import MCP-Generated Diagram',
      callback: async () => {
        await this.importMCPGeneratedDiagram();
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
  }

  /**
   * Generate diagram from natural language description using MCP
   *
   * @param diagramType - Type of diagram to generate
   */
  private async generateDiagramFromDescription(
    diagramType: 'context' | 'container' | 'component'
  ): Promise<void> {
    console.log('BAC4: Generating diagram from description:', diagramType);

    // Check if MCP is enabled
    if (!this.settings.mcp.enabled) {
      new Notice('MCP features are disabled. Enable them in settings.');
      return;
    }

    // Import modal dynamically
    const { DescriptionModal } = await import('./ui/modals/description-modal');

    // Show modal and wait for user input
    const modal = new DescriptionModal(
      this.app,
      diagramType,
      async (description: string) => {
        // User submitted description
        console.log('BAC4: User provided description:', description);

        try {
          // Show loading notice
          const loadingNotice = new Notice('Generating diagram with AI...', 0);

          // Import MCP service
          const { MCPService } = await import('./services/mcp-service');
          const mcpService = new MCPService(this);

          // Check if AI service is available
          const available = await mcpService.isAvailable();
          if (!available) {
            loadingNotice.hide();

            // Check if it's because API key is missing
            if (!this.settings.mcp.apiKey || this.settings.mcp.apiKey.trim() === '') {
              new Notice('Please configure your Anthropic API key in BAC4 settings first.', 8000);
            } else {
              new Notice('AI service not available. Please check your configuration.', 5000);
            }
            return;
          }

          // Generate diagram
          try {
            const { nodes, edges } = await mcpService.generateDiagram(description, diagramType);

            loadingNotice.hide();

            // Create new diagram file
            const timestamp = Date.now();
            const fileName = `Generated_${diagramType}_${timestamp}.bac4`;
            const filePath = `BAC4/${fileName}`;

            // Ensure BAC4 directory exists
            if (!(await this.app.vault.adapter.exists('BAC4'))) {
              await this.app.vault.createFolder('BAC4');
            }

            // Create file (v1.0.0 format with timeline)
            const now = new Date().toISOString();
            const initialTimeline = TimelineService.createInitialTimeline(nodes, edges, 'Current');
            const diagramData = {
              version: '1.0.0',
              metadata: {
                diagramType,
                createdAt: now,
                updatedAt: now,
              },
              timeline: initialTimeline,
            };

            await this.app.vault.create(
              filePath,
              JSON.stringify(diagramData, null, 2)
            );

            // Open the diagram (v0.6.0: No registration needed, self-contained diagrams)
            await this.openCanvasView(filePath);

            new Notice(`Created ${fileName}`);
          } catch (error) {
            loadingNotice.hide();
            console.error('BAC4: Error generating diagram:', error);
            new Notice('Failed to generate diagram. MCP integration is in development.');

            // For now, create an empty diagram as fallback
            const timestamp = Date.now();
            const fileName = `Generated_${diagramType}_${timestamp}.bac4`;
            const filePath = `BAC4/${fileName}`;

            // Ensure BAC4 directory exists
            if (!(await this.app.vault.adapter.exists('BAC4'))) {
              await this.app.vault.createFolder('BAC4');
            }

            // Create empty diagram (v1.0.0 format with timeline)
            const now = new Date().toISOString();
            const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
            const emptyDiagram = {
              version: '1.0.0',
              metadata: {
                diagramType,
                createdAt: now,
                updatedAt: now,
              },
              timeline: initialTimeline,
            };

            await this.app.vault.create(
              filePath,
              JSON.stringify(emptyDiagram, null, 2)
            );

            // Open the diagram (v0.6.0: No registration needed, self-contained diagrams)
            await this.openCanvasView(filePath);

            new Notice(`Created empty ${fileName}. MCP integration coming soon!`);
          }
        } catch (error) {
          console.error('BAC4: Error in diagram generation flow:', error);
          new Notice('An error occurred while generating the diagram.');
        }
      },
      () => {
        // User cancelled
        console.log('BAC4: User cancelled diagram generation');
      }
    );

    modal.open();
  }

  /**
   * Import a diagram that was generated via MCP (Claude directly writing to vault)
   *
   * This allows Claude Code to generate diagrams by writing .bac4 files directly
   * to the vault through MCP, then the plugin can open and register them.
   */
  private async importMCPGeneratedDiagram(): Promise<void> {
    console.log('BAC4: Importing MCP-generated diagram');

    // Look for the most recently created .bac4 file in BAC4/ directory
    const bac4Files = this.app.vault.getFiles().filter(
      (file) => file.extension === 'bac4' && file.path.startsWith('BAC4/')
    );

    if (bac4Files.length === 0) {
      new Notice('No BAC4 diagrams found. Ask Claude to create one first!');
      return;
    }

    // Sort by creation time (most recent first)
    bac4Files.sort((a, b) => b.stat.ctime - a.stat.ctime);
    const mostRecent = bac4Files[0];

    console.log('BAC4: Most recent diagram:', mostRecent.path);

    // Open the diagram (v0.6.0: No registration needed, self-contained diagrams)
    await this.openCanvasView(mostRecent.path);

    new Notice(`Imported ${mostRecent.basename}`);
  }
}
