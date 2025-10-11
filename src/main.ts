import { Plugin, WorkspaceLeaf } from 'obsidian';
import { BAC4Settings } from './core/settings';
import { DEFAULT_SETTINGS, COMMAND_OPEN_DASHBOARD, COMMAND_CREATE_PROJECT, COMMAND_OPEN_SETTINGS, VIEW_TYPE_CANVAS } from './core/constants';
import { BAC4SettingsTab } from './ui/settings-tab';
import { BAC4CanvasView } from './ui/canvas-view';
import './styles.css';

/**
 * BAC4 Plugin - Main entry point
 * AI-Native Cloud Architecture Management for Obsidian
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
        if (file.extension === 'bac4') {
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

    // Intercept file opens to prevent duplicate tabs for .bac4 files
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (file && file.extension === 'bac4') {
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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Open BAC4 Dashboard (main Context diagram)
   * Creates Context diagram and relationships file if they don't exist
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
