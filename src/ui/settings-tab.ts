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
        toggle.setValue(this.plugin.settings.enableAIFeatures).onChange(async (value) => {
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

    // AI Settings Section
    containerEl.createEl('h3', { text: 'AI Assistant Settings' });

    // MCP/AI Features Toggle
    new Setting(containerEl)
      .setName('Enable AI diagram generation')
      .setDesc('Use Claude AI to generate diagrams from natural language descriptions')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.mcp.enabled).onChange(async (value) => {
          this.plugin.settings.mcp.enabled = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show/hide API key field
        })
      );

    // Anthropic API Key (only show if AI features enabled)
    if (this.plugin.settings.mcp.enabled) {
      new Setting(containerEl)
        .setName('Anthropic API key')
        .setDesc('Your Anthropic API key for Claude AI. Get one at https://console.anthropic.com/')
        .addText((text) => {
          text
            .setPlaceholder('sk-ant-...')
            .setValue(this.plugin.settings.mcp.apiKey)
            .onChange(async (value) => {
              this.plugin.settings.mcp.apiKey = value;
              await this.plugin.saveSettings();
            });
          text.inputEl.type = 'password'; // Hide API key
          return text;
        });

      // Auto-validate toggle
      new Setting(containerEl)
        .setName('Auto-validate diagrams')
        .setDesc(
          'Real-time AI validation while editing (may impact performance and use API credits)'
        )
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.mcp.autoValidate).onChange(async (value) => {
            this.plugin.settings.mcp.autoValidate = value;
            await this.plugin.saveSettings();
          })
        );

      // Auto-suggest toggle
      new Setting(containerEl)
        .setName('Auto-suggest improvements')
        .setDesc('AI suggestions while creating diagrams (may use API credits)')
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.mcp.autoSuggest).onChange(async (value) => {
            this.plugin.settings.mcp.autoSuggest = value;
            await this.plugin.saveSettings();
          })
        );
    }
  }
}
