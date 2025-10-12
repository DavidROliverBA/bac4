/**
 * Diagram Type Switch Warning Modal
 * Warns user before switching diagram type and clearing elements
 */

import { App, Modal } from 'obsidian';

interface DiagramTypeSwitchModalOptions {
  currentType: string;
  newType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export class DiagramTypeSwitchModal extends Modal {
  private options: DiagramTypeSwitchModalOptions;

  constructor(app: App, options: DiagramTypeSwitchModalOptions) {
    super(app);
    this.options = options;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Title
    contentEl.createEl('h2', { text: 'Warning: Switching Diagram Type' });

    // Warning message
    const warningDiv = contentEl.createDiv({ cls: 'bac4-warning-message' });
    warningDiv.createEl('p', {
      text: `You are about to switch from ${this.options.currentType.toUpperCase()} to ${this.options.newType.toUpperCase()} diagram.`,
    });
    warningDiv.createEl('p', {
      text: 'This will clear all current elements from the diagram.',
      cls: 'bac4-warning-emphasis',
    });
    warningDiv.createEl('p', {
      text: 'This action cannot be undone.',
      cls: 'bac4-warning-emphasis',
    });
    warningDiv.createEl('p', {
      text: 'Do you want to continue?',
    });

    // Button container
    const buttonContainer = contentEl.createDiv({ cls: 'bac4-modal-buttons' });

    // Cancel button
    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel',
      cls: 'bac4-modal-button bac4-modal-button-cancel',
    });
    cancelButton.addEventListener('click', () => {
      this.options.onCancel();
      this.close();
    });

    // Continue button
    const continueButton = buttonContainer.createEl('button', {
      text: 'Continue',
      cls: 'bac4-modal-button bac4-modal-button-confirm mod-warning',
    });
    continueButton.addEventListener('click', () => {
      this.options.onConfirm();
      this.close();
    });

    // Add inline styles for modal
    const style = contentEl.createEl('style');
    style.textContent = `
      .bac4-warning-message {
        margin: 20px 0;
        padding: 16px;
        background: var(--background-modifier-error-hover);
        border: 2px solid var(--background-modifier-error);
        border-radius: 8px;
      }

      .bac4-warning-emphasis {
        font-weight: 600;
        color: var(--text-error);
      }

      .bac4-modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
      }

      .bac4-modal-button {
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }

      .bac4-modal-button-cancel {
        background: var(--interactive-normal);
        color: var(--text-normal);
        border: 1px solid var(--background-modifier-border);
      }

      .bac4-modal-button-cancel:hover {
        background: var(--interactive-hover);
      }

      .bac4-modal-button-confirm {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
      }

      .bac4-modal-button-confirm:hover {
        background: var(--interactive-accent-hover);
      }
    `;
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
