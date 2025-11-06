/**
 * Link Markdown Modal
 *
 * Modal dialog for linking a BAC4 diagram node to an Obsidian markdown file.
 * Provides file path input with autocomplete, suggestions, and validation.
 *
 * @module LinkMarkdownModal
 */

import { App, Modal, Setting, TFile } from 'obsidian';
import { MarkdownLinkService } from '../../services/markdown-link-service';

/**
 * Callback type for when user links a file
 */
export type LinkCallback = (filePath: string, createIfMissing: boolean) => void;

/**
 * Link Markdown Modal
 *
 * Modal for selecting or creating a markdown file to link to a node
 */
export class LinkMarkdownModal extends Modal {
  private filePath: string;
  private createIfMissing: boolean;
  private suggestedPath: string;
  private onLink: LinkCallback;
  private existingFiles: string[];

  /**
   * Create a new LinkMarkdownModal
   *
   * @param app - Obsidian app instance
   * @param nodeLabel - Label of the node being linked
   * @param diagramPath - Path of the current diagram
   * @param onLink - Callback when user confirms link
   */
  constructor(app: App, nodeLabel: string, diagramPath: string, onLink: LinkCallback) {
    super(app);
    this.onLink = onLink;
    this.createIfMissing = false;

    // Generate suggested path
    this.suggestedPath = MarkdownLinkService.suggestFilePath(nodeLabel, diagramPath);
    this.filePath = this.suggestedPath;

    // Get list of existing markdown files for autocomplete
    this.existingFiles = this.app.vault
      .getMarkdownFiles()
      .map((file: TFile) => file.path)
      .sort();
  }

  /**
   * Called when modal is opened
   */
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Title
    contentEl.createEl('h2', { text: 'Link Node to Markdown File' });

    // File path input with suggestions
    new Setting(contentEl)
      .setName('File path')
      .setDesc(`Suggested: ${this.suggestedPath}`)
      .addText((text) => {
        text
          .setPlaceholder('path/to/file.md')
          .setValue(this.filePath)
          .onChange((value) => {
            this.filePath = value;
            this.validateAndUpdateUI();
          });

        // Make input wider
        text.inputEl.style.width = '100%';

        // Add datalist for autocomplete
        const datalistId = 'markdown-files-datalist';
        text.inputEl.setAttribute('list', datalistId);

        const datalist = contentEl.createEl('datalist', { attr: { id: datalistId } });
        this.existingFiles.forEach((filePath) => {
          datalist.createEl('option', { value: filePath });
        });

        // Focus input
        setTimeout(() => text.inputEl.focus(), 50);
      });

    // File existence status
    const statusEl = contentEl.createDiv({ cls: 'bac4-link-status' });
    this.updateStatusDisplay(statusEl);

    // Create if missing checkbox
    new Setting(contentEl)
      .setName("Create file if it doesn't exist")
      .setDesc("Automatically create the markdown file with a template if it doesn't exist")
      .addToggle((toggle) => {
        toggle.setValue(this.createIfMissing).onChange((value) => {
          this.createIfMissing = value;
          this.updateStatusDisplay(statusEl);
        });
      });

    // Buttons
    new Setting(contentEl)
      .addButton((btn) => {
        btn
          .setButtonText('Link File')
          .setCta()
          .onClick(() => {
            this.handleLink();
          });
      })
      .addButton((btn) => {
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
        });
      });

    // Add some styling
    contentEl.style.padding = '20px';
  }

  /**
   * Validate path and update UI
   */
  private async validateAndUpdateUI() {
    // Find status element
    const statusEl = this.contentEl.querySelector('.bac4-link-status') as HTMLElement;
    if (statusEl) {
      await this.updateStatusDisplay(statusEl);
    }
  }

  /**
   * Update the status display element
   */
  private async updateStatusDisplay(statusEl: HTMLElement) {
    statusEl.empty();

    // Validate path
    const validation = MarkdownLinkService.validatePath(this.filePath);
    if (!validation.valid) {
      statusEl.createEl('div', {
        text: `⚠️ ${validation.error}`,
        attr: { style: 'color: var(--text-error); margin-top: 8px;' },
      });
      return;
    }

    // Check if file exists
    const exists = await MarkdownLinkService.fileExists(this.app.vault, this.filePath);

    if (exists) {
      statusEl.createEl('div', {
        text: '✅ File exists and will be linked',
        attr: { style: 'color: var(--text-success); margin-top: 8px;' },
      });
    } else if (this.createIfMissing) {
      statusEl.createEl('div', {
        text: '📝 File will be created with template',
        attr: { style: 'color: var(--text-accent); margin-top: 8px;' },
      });
    } else {
      statusEl.createEl('div', {
        text: '⚠️ File does not exist (enable "Create if missing" to create it)',
        attr: { style: 'color: var(--text-warning); margin-top: 8px;' },
      });
    }
  }

  /**
   * Handle link button click
   */
  private async handleLink() {
    // Validate path
    const validation = MarkdownLinkService.validatePath(this.filePath);
    if (!validation.valid) {
      // Error already shown in status display
      return;
    }

    // Check if file exists
    const exists = await MarkdownLinkService.fileExists(this.app.vault, this.filePath);

    // If file doesn't exist and createIfMissing is false, warn user
    if (!exists && !this.createIfMissing) {
      const statusEl = this.contentEl.querySelector('.bac4-link-status') as HTMLElement;
      if (statusEl) {
        statusEl.empty();
        statusEl.createEl('div', {
          text: '⚠️ File does not exist. Enable "Create if missing" or choose an existing file.',
          attr: { style: 'color: var(--text-error); margin-top: 8px; font-weight: 600;' },
        });
      }
      return;
    }

    // Call callback
    this.onLink(this.filePath, this.createIfMissing);

    // Close modal
    this.close();
  }

  /**
   * Called when modal is closed
   */
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
