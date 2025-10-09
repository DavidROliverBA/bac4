import { App, PluginSettingTab, Setting } from 'obsidian';
import BAC4Plugin from '../main';

/**
 * BAC4 Settings Tab
 */
export class BAC4SettingsTab extends PluginSettingTab {
  plugin: BAC4Plugin;

  constructor(app: App, plugin: BAC4Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'BAC4 Settings' });

    // Default Project Location
    new Setting(containerEl)
      .setName('Default project location')
      .setDesc('Default folder for BAC4 projects (relative to vault root)')
      .addText((text) =>
        text
          .setPlaceholder('projects')
          .setValue(this.plugin.settings.defaultProjectLocation)
          .onChange(async (value) => {
            this.plugin.settings.defaultProjectLocation = value;
            await this.plugin.saveSettings();
          })
      );

    // Enable AI Features
    new Setting(containerEl)
      .setName('Enable AI features')
      .setDesc('Enable AI-assisted architecture via Model Context Protocol (requires Claude Code)')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAIFeatures)
          .onChange(async (value) => {
            this.plugin.settings.enableAIFeatures = value;
            await this.plugin.saveSettings();
          })
      );

    // Auto-save Interval
    new Setting(containerEl)
      .setName('Auto-save interval')
      .setDesc('Auto-save diagram changes every N seconds (0 to disable)')
      .addText((text) =>
        text
          .setPlaceholder('30')
          .setValue(String(this.plugin.settings.autoSaveInterval / 1000))
          .onChange(async (value) => {
            const seconds = parseInt(value) || 0;
            this.plugin.settings.autoSaveInterval = seconds * 1000;
            await this.plugin.saveSettings();
          })
      );
  }
}
