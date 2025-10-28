/**
 * Layout Management Modals
 *
 * Modals for creating, renaming, and managing layouts
 *
 * @version 2.6.0
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import { ViewType } from '../../types/bac4-v2-types';
import { getLayoutTemplate, getAllLayoutTemplates } from '../../templates/layout-templates';

/**
 * Create New Layout Modal
 */
export class CreateLayoutModal extends Modal {
  private layoutName = '';
  private viewType: ViewType = 'custom';
  private copyFromCurrent = false;
  private onSubmit: (layoutName: string, viewType: ViewType, copyFromCurrent: boolean) => void;

  constructor(
    app: App,
    suggestedViewType: ViewType,
    onSubmit: (layoutName: string, viewType: ViewType, copyFromCurrent: boolean) => void
  ) {
    super(app);
    this.viewType = suggestedViewType;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.empty();
    contentEl.addClass('bac4-create-layout-modal');

    contentEl.createEl('h2', { text: 'Create New Layout' });

    // Layout Name
    new Setting(contentEl)
      .setName('Layout Name')
      .setDesc('Give your layout a descriptive name')
      .addText((text) => {
        text
          .setPlaceholder('e.g., Wardley Map View')
          .setValue(this.layoutName)
          .onChange((value) => {
            this.layoutName = value;
          });
        text.inputEl.focus();
      });

    // Layout Type
    const templates = getAllLayoutTemplates();
    new Setting(contentEl)
      .setName('Layout Type')
      .setDesc('Choose a template for your layout')
      .addDropdown((dropdown) => {
        templates.forEach((template) => {
          dropdown.addOption(
            template.viewType,
            `${template.icon} ${template.displayName}`
          );
        });
        dropdown.setValue(this.viewType).onChange((value) => {
          this.viewType = value as ViewType;
        });
      });

    // Description of selected template
    const descEl = contentEl.createDiv('bac4-layout-template-desc');
    this.updateDescription(descEl);

    // Copy from current
    new Setting(contentEl)
      .setName('Initial Layout')
      .setDesc('Start with a blank layout or copy the current one')
      .addToggle((toggle) => {
        toggle.setValue(this.copyFromCurrent).onChange((value) => {
          this.copyFromCurrent = value;
        });
        toggle.toggleEl.setAttribute(
          'aria-label',
          'Copy current layout'
        );
      });

    // Buttons
    const buttonContainer = contentEl.createDiv('bac4-modal-buttons');

    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      cls: 'bac4-modal-button-secondary',
    });
    cancelBtn.addEventListener('click', () => this.close());

    const createBtn = buttonContainer.createEl('button', {
      text: 'Create Layout',
      cls: 'bac4-modal-button-primary',
    });
    createBtn.addEventListener('click', () => this.handleSubmit());

    // Enter key submits
    contentEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSubmit();
      }
    });
  }

  private updateDescription(el: HTMLElement) {
    const template = getLayoutTemplate(this.viewType);
    if (template) {
      el.setText(template.description);
    }
  }

  private handleSubmit() {
    if (!this.layoutName.trim()) {
      new Notice('Please enter a layout name');
      return;
    }

    this.onSubmit(this.layoutName.trim(), this.viewType, this.copyFromCurrent);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/**
 * Rename Layout Modal
 */
export class RenameLayoutModal extends Modal {
  private layoutName: string;
  private onSubmit: (newName: string) => void;

  constructor(
    app: App,
    currentName: string,
    onSubmit: (newName: string) => void
  ) {
    super(app);
    this.layoutName = currentName;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.empty();
    contentEl.addClass('bac4-rename-layout-modal');

    contentEl.createEl('h2', { text: 'Rename Layout' });

    new Setting(contentEl)
      .setName('New Name')
      .setDesc('Enter a new name for this layout')
      .addText((text) => {
        text
          .setPlaceholder('Layout name')
          .setValue(this.layoutName)
          .onChange((value) => {
            this.layoutName = value;
          });
        text.inputEl.focus();
        text.inputEl.select();
      });

    // Buttons
    const buttonContainer = contentEl.createDiv('bac4-modal-buttons');

    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      cls: 'bac4-modal-button-secondary',
    });
    cancelBtn.addEventListener('click', () => this.close());

    const renameBtn = buttonContainer.createEl('button', {
      text: 'Rename',
      cls: 'bac4-modal-button-primary',
    });
    renameBtn.addEventListener('click', () => this.handleSubmit());

    // Enter key submits
    contentEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit();
      }
    });
  }

  private handleSubmit() {
    if (!this.layoutName.trim()) {
      new Notice('Please enter a layout name');
      return;
    }

    this.onSubmit(this.layoutName.trim());
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/**
 * Delete Layout Confirmation Modal
 */
export class DeleteLayoutModal extends Modal {
  private layoutName: string;
  private onConfirm: () => void;

  constructor(
    app: App,
    layoutName: string,
    onConfirm: () => void
  ) {
    super(app);
    this.layoutName = layoutName;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.empty();
    contentEl.addClass('bac4-delete-layout-modal');

    contentEl.createEl('h2', { text: 'Delete Layout' });

    const warningEl = contentEl.createDiv('bac4-modal-warning');
    warningEl.createEl('p', {
      text: `Are you sure you want to delete "${this.layoutName}"?`,
    });
    warningEl.createEl('p', {
      text: 'This action cannot be undone. The semantic data (.bac4 file) will not be affected.',
    });

    // Buttons
    const buttonContainer = contentEl.createDiv('bac4-modal-buttons');

    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      cls: 'bac4-modal-button-secondary',
    });
    cancelBtn.addEventListener('click', () => this.close());

    const deleteBtn = buttonContainer.createEl('button', {
      text: 'Delete Layout',
      cls: 'bac4-modal-button-danger',
    });
    deleteBtn.addEventListener('click', () => {
      this.onConfirm();
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
