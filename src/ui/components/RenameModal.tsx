/**
 * Rename Modal
 * Obsidian-compatible modal for renaming diagrams
 * Replaces browser prompt() which doesn't work in Electron
 */

import { App, Modal } from 'obsidian';

interface RenameModalOptions {
  currentName: string;
  onSubmit: (newName: string) => void;
  onCancel?: () => void;
}

export class RenameModal extends Modal {
  private currentName: string;
  private onSubmit: (newName: string) => void;
  private onCancel?: () => void;
  private inputEl: HTMLInputElement | null = null;

  constructor(app: App, options: RenameModalOptions) {
    super(app);
    this.currentName = options.currentName;
    this.onSubmit = options.onSubmit;
    this.onCancel = options.onCancel;
  }

  onOpen(): void {
    const { contentEl } = this;

    // Clear any existing content
    contentEl.empty();

    // Add title
    contentEl.createEl('h2', { text: 'Rename Diagram' });

    // Create form
    const formEl = contentEl.createEl('form', {
      cls: 'bac4-rename-form',
    });

    formEl.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 12px 0;
    `;

    // Add label
    const labelEl = formEl.createEl('label', {
      text: 'New diagram name:',
      cls: 'bac4-rename-label',
    });
    labelEl.style.cssText = `
      font-weight: 600;
      color: var(--text-normal);
      margin-bottom: 4px;
    `;

    // Add input field
    this.inputEl = formEl.createEl('input', {
      type: 'text',
      value: this.currentName,
      cls: 'bac4-rename-input',
    });

    this.inputEl.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      background: var(--background-primary);
      color: var(--text-normal);
      font-size: 14px;
      font-family: var(--font-interface);
    `;

    // Focus and select the input text
    this.inputEl.focus();
    this.inputEl.select();

    // Add button container
    const buttonContainer = formEl.createEl('div', {
      cls: 'bac4-rename-buttons',
    });

    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    `;

    // Add Cancel button
    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      type: 'button',
      cls: 'bac4-rename-cancel',
    });

    cancelBtn.style.cssText = `
      padding: 6px 16px;
      background: var(--background-secondary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      color: var(--text-normal);
      cursor: pointer;
      font-size: 14px;
    `;

    cancelBtn.addEventListener('click', () => {
      this.onCancel?.();
      this.close();
    });

    // Add Rename button
    const submitBtn = buttonContainer.createEl('button', {
      text: 'Rename',
      type: 'submit',
      cls: 'bac4-rename-submit mod-cta',
    });

    submitBtn.style.cssText = `
      padding: 6px 16px;
      background: var(--interactive-accent);
      border: 1px solid var(--interactive-accent);
      border-radius: 4px;
      color: var(--text-on-accent);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;

    // Handle form submission
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = this.inputEl?.value.trim() || '';

      if (!newName) {
        // Show validation error
        this.inputEl?.setCustomValidity('Name cannot be empty');
        this.inputEl?.reportValidity();
        return;
      }

      if (newName === this.currentName) {
        // No change, just close
        this.close();
        return;
      }

      // Submit the new name
      this.onSubmit(newName);
      this.close();
    });

    // Handle Enter key
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        formEl.dispatchEvent(new Event('submit'));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
