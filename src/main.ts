import { Plugin } from 'obsidian';
import { BAC4Settings } from './core/settings';
import { DEFAULT_SETTINGS, COMMAND_OPEN_DASHBOARD, COMMAND_CREATE_PROJECT, COMMAND_OPEN_SETTINGS } from './core/constants';
import { BAC4SettingsTab } from './ui/settings-tab';

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

    // Register commands
    this.registerCommands();

    // Register settings tab
    this.addSettingTab(new BAC4SettingsTab(this.app, this));

    // Register ribbon icon
    this.addRibbonIcon('layout-dashboard', 'BAC4 Dashboard', () => {
      console.log('BAC4 Dashboard clicked');
      // TODO: Open dashboard view
    });

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

  private registerCommands() {
    // Open Dashboard
    this.addCommand({
      id: COMMAND_OPEN_DASHBOARD,
      name: 'Open Dashboard',
      callback: () => {
        console.log('Open Dashboard command executed');
        // TODO: Implement dashboard opening
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
