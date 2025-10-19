/**
 * Duplicate Node Warning Modal
 *
 * Shows when a user renames a node to a name that already exists elsewhere.
 * Offers to create a cross-reference or cancel the rename.
 */

import { App, Modal } from 'obsidian';
import type { NodeReference } from '../../services/node-registry-service';

export class DuplicateNodeWarningModal extends Modal {
  private nodeName: string;
  private references: NodeReference[];
  private onConfirm: () => void;
  private onCancel: () => void;

  constructor(
    app: App,
    nodeName: string,
    references: NodeReference[],
    onConfirm: () => void,
    onCancel: () => void
  ) {
    super(app);
    this.nodeName = nodeName;
    this.references = references;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('bac4-duplicate-warning-modal');

    // Title
    contentEl.createEl('h2', { text: '⚠️ Duplicate Node Name' });

    // Warning message
    const message = contentEl.createDiv({ cls: 'duplicate-warning-message' });
    message.createEl('p', {
      text: `A node with the name "${this.nodeName}" already exists in ${this.references.length} other diagram${this.references.length > 1 ? 's' : ''}:`,
    });

    // List of existing references
    const referenceList = message.createEl('ul', { cls: 'duplicate-reference-list' });
    this.references.forEach((ref) => {
      const li = referenceList.createEl('li');
      li.createEl('strong', { text: ref.diagramName });
      li.createSpan({ text: ` (${ref.nodeType})` });
    });

    // Explanation
    message.createEl('p', {
      text: 'If you continue, this node will be marked as a cross-reference, and you can navigate between related nodes in different diagrams.',
      cls: 'duplicate-explanation',
    });

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelButton.addEventListener('click', () => {
      this.onCancel();
      this.close();
    });

    const continueButton = buttonContainer.createEl('button', {
      text: 'Continue and Create Reference',
      cls: 'mod-cta',
    });
    continueButton.addEventListener('click', () => {
      this.onConfirm();
      this.close();
    });

    // Styling
    const style = contentEl.createEl('style');
    style.textContent = `
      .bac4-duplicate-warning-modal {
        padding: 20px;
      }

      .duplicate-warning-message {
        margin: 16px 0;
        color: var(--text-normal);
      }

      .duplicate-warning-message p {
        margin: 12px 0;
        line-height: 1.6;
      }

      .duplicate-explanation {
        font-size: 0.9em;
        color: var(--text-muted);
        background: var(--background-secondary);
        padding: 12px;
        border-radius: 6px;
        border-left: 3px solid var(--interactive-accent);
      }

      .duplicate-reference-list {
        margin: 12px 0;
        padding-left: 24px;
        background: var(--background-secondary);
        border-radius: 6px;
        padding: 12px 12px 12px 32px;
      }

      .duplicate-reference-list li {
        margin: 6px 0;
        color: var(--text-normal);
      }

      .duplicate-reference-list strong {
        color: var(--text-accent);
      }

      .modal-button-container {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
      }

      .modal-button-container button {
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
    `;
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
