/**
 * v3.0.0 Modal Components
 *
 * Modals for name collisions, node deletion, and edge warnings
 *
 * @version 3.0.0
 */

import { Modal, App } from 'obsidian';
import { GlobalNode, GlobalEdge } from '../../types/graph-v3-types';

// ============================================================================
// Name Collision Modal
// ============================================================================

export interface NameCollisionResult {
  action: 'cancel' | 'add-existing' | 'create-new';
  newName?: string;
}

export class NameCollisionModal extends Modal {
  private existingNode: GlobalNode;
  private usageCount: number;
  private resolve: (result: NameCollisionResult) => void;

  constructor(
    app: App,
    existingNode: GlobalNode,
    usageCount: number,
    onResolve: (result: NameCollisionResult) => void
  ) {
    super(app);
    this.existingNode = existingNode;
    this.usageCount = usageCount;
    this.resolve = onResolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '⚠️ Node Name Already Exists' });

    contentEl.createEl('p', {
      text: `A node named "${this.existingNode.label}" already exists.`,
    });

    contentEl.createEl('p', {
      text: `Type: ${this.existingNode.type}`,
    });

    contentEl.createEl('p', {
      text: `Used in: ${this.usageCount} diagram${this.usageCount !== 1 ? 's' : ''}`,
    });

    contentEl.createEl('h3', { text: 'Options:' });

    // Option 1: Cancel
    const cancelBtn = contentEl.createEl('button', { text: "Cancel (don't create node)" });
    cancelBtn.style.cssText = 'display:block; width:100%; margin:8px 0; padding:12px;';
    cancelBtn.onclick = () => {
      this.resolve({ action: 'cancel' });
      this.close();
    };

    // Option 2: Add existing node
    const addBtn = contentEl.createEl('button', { text: 'Add existing node to this diagram' });
    addBtn.style.cssText = 'display:block; width:100%; margin:8px 0; padding:12px;';
    addBtn.onclick = () => {
      this.resolve({ action: 'add-existing' });
      this.close();
    };

    // Option 3: Create new with different name
    const createNewBtn = contentEl.createEl('button', {
      text: 'Create new node with different name',
    });
    createNewBtn.style.cssText = 'display:block; width:100%; margin:8px 0; padding:12px;';
    createNewBtn.onclick = () => {
      this.close();
      // Open name input modal
      new EnterNewNameModal(this.app, this.existingNode.label, (newName) => {
        if (newName) {
          this.resolve({ action: 'create-new', newName });
        } else {
          this.resolve({ action: 'cancel' });
        }
      }).open();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// ============================================================================
// Enter New Name Modal
// ============================================================================

class EnterNewNameModal extends Modal {
  private originalName: string;
  private resolve: (newName: string | null) => void;

  constructor(app: App, originalName: string, onResolve: (newName: string | null) => void) {
    super(app);
    this.originalName = originalName;
    this.resolve = onResolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Enter Unique Name' });

    contentEl.createEl('p', {
      text: `Original name "${this.originalName}" is already taken.`,
    });

    const input = contentEl.createEl('input', {
      type: 'text',
      placeholder: 'Enter unique name...',
    });
    input.style.cssText = 'width:100%; padding:8px; margin:12px 0;';
    input.value = this.originalName + ' 2';
    input.select();

    const btnContainer = contentEl.createDiv();
    btnContainer.style.cssText = 'display:flex; gap:8px; margin-top:16px;';

    const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.style.cssText = 'flex:1; padding:10px;';
    cancelBtn.onclick = () => {
      this.resolve(null);
      this.close();
    };

    const confirmBtn = btnContainer.createEl('button', { text: 'Create' });
    confirmBtn.style.cssText = 'flex:1; padding:10px; background:#5b5fc7; color:white;';
    confirmBtn.onclick = () => {
      const newName = input.value.trim();
      if (newName) {
        this.resolve(newName);
        this.close();
      }
    };

    // Enter key to confirm
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// ============================================================================
// Delete Node Modal
// ============================================================================

export interface DeleteNodeResult {
  action: 'cancel' | 'remove-from-diagram' | 'delete-globally';
}

export class DeleteNodeModal extends Modal {
  private node: GlobalNode;
  private diagramCount: number;
  private diagrams: string[];
  private edgeCount: number;
  private resolve: (result: DeleteNodeResult) => void;

  constructor(
    app: App,
    node: GlobalNode,
    diagramCount: number,
    diagrams: string[],
    edgeCount: number,
    onResolve: (result: DeleteNodeResult) => void
  ) {
    super(app);
    this.node = node;
    this.diagramCount = diagramCount;
    this.diagrams = diagrams;
    this.edgeCount = edgeCount;
    this.resolve = onResolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: `🗑️ Delete Node: "${this.node.label}"` });

    contentEl.createEl('p', {
      text: `This node appears in ${this.diagramCount} diagram${
        this.diagramCount !== 1 ? 's' : ''
      }:`,
    });

    const list = contentEl.createEl('ul');
    this.diagrams.slice(0, 5).forEach((path) => {
      list.createEl('li', { text: path });
    });
    if (this.diagrams.length > 5) {
      list.createEl('li', { text: `... and ${this.diagrams.length - 5} more` });
    }

    contentEl.createEl('p', {
      text: `This node has ${this.edgeCount} relationship${this.edgeCount !== 1 ? 's' : ''}.`,
    });

    contentEl.createEl('h3', { text: 'Options:' });

    // Option 1: Remove from this diagram only
    const removeBtn = contentEl.createEl('button', { text: 'Remove from this diagram only' });
    removeBtn.style.cssText = 'display:block; width:100%; margin:8px 0; padding:12px;';
    removeBtn.onclick = () => {
      this.resolve({ action: 'remove-from-diagram' });
      this.close();
    };

    // Option 2: Delete globally
    const deleteBtn = contentEl.createEl('button', { text: 'Delete globally (from all diagrams)' });
    deleteBtn.style.cssText =
      'display:block; width:100%; margin:8px 0; padding:12px; background:#dc3545; color:white;';
    deleteBtn.onclick = () => {
      this.close();
      // Confirmation modal
      new ConfirmGlobalDeleteModal(
        this.app,
        this.node,
        this.diagramCount,
        this.edgeCount,
        (confirmed) => {
          if (confirmed) {
            this.resolve({ action: 'delete-globally' });
          } else {
            this.resolve({ action: 'cancel' });
          }
        }
      ).open();
    };

    // Option 3: Cancel
    const cancelBtn = contentEl.createEl('button', { text: 'Cancel' });
    cancelBtn.style.cssText = 'display:block; width:100%; margin:8px 0; padding:12px;';
    cancelBtn.onclick = () => {
      this.resolve({ action: 'cancel' });
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// ============================================================================
// Confirm Global Delete Modal
// ============================================================================

class ConfirmGlobalDeleteModal extends Modal {
  private node: GlobalNode;
  private diagramCount: number;
  private edgeCount: number;
  private resolve: (confirmed: boolean) => void;

  constructor(
    app: App,
    node: GlobalNode,
    diagramCount: number,
    edgeCount: number,
    onResolve: (confirmed: boolean) => void
  ) {
    super(app);
    this.node = node;
    this.diagramCount = diagramCount;
    this.edgeCount = edgeCount;
    this.resolve = onResolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '⚠️ Confirm Global Deletion' });

    contentEl.createEl('p', {
      text: `Delete "${this.node.label}" from entire system?`,
    });

    contentEl.createEl('p', { text: 'This will:' });

    const list = contentEl.createEl('ul');
    list.createEl('li', { text: `✗ Remove from ${this.diagramCount} diagrams` });
    list.createEl('li', { text: `✗ Delete ${this.edgeCount} relationships` });
    list.createEl('li', { text: '✗ Remove from __graph__.json' });

    const warning = contentEl.createEl('p', {
      text: 'This action cannot be undone.',
    });
    warning.style.cssText = 'color:#dc3545; font-weight:600;';

    const btnContainer = contentEl.createDiv();
    btnContainer.style.cssText = 'display:flex; gap:8px; margin-top:16px;';

    const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.style.cssText = 'flex:1; padding:10px;';
    cancelBtn.onclick = () => {
      this.resolve(false);
      this.close();
    };

    const deleteBtn = btnContainer.createEl('button', { text: 'Delete Globally' });
    deleteBtn.style.cssText = 'flex:1; padding:10px; background:#dc3545; color:white;';
    deleteBtn.onclick = () => {
      this.resolve(true);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// ============================================================================
// Edge Change Warning Modal
// ============================================================================

export class EdgeChangeWarningModal extends Modal {
  private edge: GlobalEdge;
  private diagramCount: number;
  private diagrams: string[];
  private resolve: (confirmed: boolean) => void;

  constructor(
    app: App,
    edge: GlobalEdge,
    diagramCount: number,
    diagrams: string[],
    onResolve: (confirmed: boolean) => void
  ) {
    super(app);
    this.edge = edge;
    this.diagramCount = diagramCount;
    this.diagrams = diagrams;
    this.resolve = onResolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '⚠️ Edit Global Edge' });

    contentEl.createEl('p', {
      text: `This edge appears in ${this.diagramCount} diagram${
        this.diagramCount !== 1 ? 's' : ''
      }:`,
    });

    const list = contentEl.createEl('ul');
    this.diagrams.slice(0, 5).forEach((path) => {
      list.createEl('li', { text: path });
    });
    if (this.diagrams.length > 5) {
      list.createEl('li', { text: `... and ${this.diagrams.length - 5} more` });
    }

    contentEl.createEl('p', {
      text: 'Changing this edge will update it in ALL diagrams where both nodes are displayed.',
    });

    const btnContainer = contentEl.createDiv();
    btnContainer.style.cssText = 'display:flex; gap:8px; margin-top:16px;';

    const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.style.cssText = 'flex:1; padding:10px;';
    cancelBtn.onclick = () => {
      this.resolve(false);
      this.close();
    };

    const updateBtn = btnContainer.createEl('button', { text: 'Update Everywhere' });
    updateBtn.style.cssText = 'flex:1; padding:10px; background:#5b5fc7; color:white;';
    updateBtn.onclick = () => {
      this.resolve(true);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// ============================================================================
// Edge Delete Warning Modal
// ============================================================================

export class EdgeDeleteWarningModal extends Modal {
  private edge: GlobalEdge;
  private diagramCount: number;
  private resolve: (confirmed: boolean) => void;

  constructor(
    app: App,
    edge: GlobalEdge,
    diagramCount: number,
    onResolve: (confirmed: boolean) => void
  ) {
    super(app);
    this.edge = edge;
    this.diagramCount = diagramCount;
    this.resolve = onResolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '⚠️ Delete Global Edge' });

    const edgeLabel = this.edge.label || `${this.edge.source} → ${this.edge.target}`;

    contentEl.createEl('p', {
      text: `Delete edge: "${edgeLabel}"?`,
    });

    contentEl.createEl('p', {
      text: `This edge appears in ${this.diagramCount} diagram${
        this.diagramCount !== 1 ? 's' : ''
      }.`,
    });

    contentEl.createEl('p', {
      text: 'Deleting will remove it from ALL diagrams.',
    });

    const btnContainer = contentEl.createDiv();
    btnContainer.style.cssText = 'display:flex; gap:8px; margin-top:16px;';

    const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.style.cssText = 'flex:1; padding:10px;';
    cancelBtn.onclick = () => {
      this.resolve(false);
      this.close();
    };

    const deleteBtn = btnContainer.createEl('button', { text: 'Delete Everywhere' });
    deleteBtn.style.cssText = 'flex:1; padding:10px; background:#dc3545; color:white;';
    deleteBtn.onclick = () => {
      this.resolve(true);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
