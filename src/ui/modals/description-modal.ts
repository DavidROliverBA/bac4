import { App, Modal, Notice, Setting } from 'obsidian';

/**
 * Modal for inputting architecture descriptions for AI diagram generation
 *
 * This modal provides a text area where users can describe their architecture
 * in natural language. The description is then sent to MCP/Claude to generate
 * a C4 diagram automatically.
 *
 * @example
 * ```ts
 * const modal = new DescriptionModal(app, 'context');
 * const description = await modal.prompt();
 * if (description) {
 *   // Generate diagram from description
 * }
 * ```
 */
export class DescriptionModal extends Modal {
  private description = '';
  private diagramType: 'context' | 'container' | 'component';
  private onSubmit: (description: string) => void;
  private onCancel: () => void;

  constructor(
    app: App,
    diagramType: 'context' | 'container' | 'component',
    onSubmit: (description: string) => void,
    onCancel: () => void
  ) {
    super(app);
    this.diagramType = diagramType;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: `Generate ${this.capitalize(this.diagramType)} Diagram` });

    contentEl.createEl('p', {
      text: 'Describe your architecture in natural language, and AI will generate a C4 diagram for you.',
      cls: 'setting-item-description',
    });

    // Example section
    const exampleDiv = contentEl.createDiv({ cls: 'bac4-example-section' });
    exampleDiv.createEl('h3', { text: 'Example:' });
    exampleDiv.createEl('pre', {
      text: this.getExampleText(),
      cls: 'bac4-example-text',
    });

    // Text area for description
    const textAreaSetting = new Setting(contentEl)
      .setName('Architecture Description')
      .setDesc('Describe systems, actors, and their relationships');

    const textArea = textAreaSetting.controlEl.createEl('textarea', {
      cls: 'bac4-description-textarea',
      attr: {
        rows: '10',
        placeholder: this.getPlaceholder(),
      },
    });

    textArea.value = this.description;
    textArea.addEventListener('input', (e) => {
      this.description = (e.target as HTMLTextAreaElement).value;
    });

    // Buttons
    const buttonDiv = contentEl.createDiv({ cls: 'bac4-modal-buttons' });

    // Cancel button
    const cancelBtn = buttonDiv.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => {
      this.close();
      this.onCancel();
    });

    // Generate button
    const generateBtn = buttonDiv.createEl('button', {
      text: 'Generate Diagram',
      cls: 'mod-cta',
    });
    generateBtn.addEventListener('click', () => {
      if (!this.description.trim()) {
        new Notice('Please enter a description');
        return;
      }

      this.close();
      this.onSubmit(this.description);
    });

    // Focus text area
    textArea.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Get placeholder text based on diagram type
   */
  private getPlaceholder(): string {
    switch (this.diagramType) {
      case 'context':
        return `Example:
Create a system for e-commerce with:
- Customer (person who shops)
- Admin (person who manages)
- E-Commerce System (main system)
- Payment Gateway (external system)
- Shipping Service (external system)

Customer uses E-Commerce System
Admin manages E-Commerce System
E-Commerce System connects to Payment Gateway
E-Commerce System connects to Shipping Service`;

      case 'container':
        return `Example:
The E-Commerce System contains:
- Web Frontend (React app)
- Mobile App (iOS/Android)
- API Gateway
- Order Service
- Product Service
- PostgreSQL Database
- Redis Cache

Web Frontend calls API Gateway
Mobile App calls API Gateway
API Gateway routes to Order Service
Order Service writes to Database
All services use Redis Cache`;

      case 'component':
        return `Example:
The API Gateway is deployed on AWS with:
- API Controller
- Authentication Middleware
- Request Router
- AWS Lambda functions
- Amazon API Gateway
- AWS CloudWatch for logging
- DynamoDB for sessions

Requests flow through Amazon API Gateway to API Controller
Authentication Middleware validates tokens
Request Router determines which Lambda to invoke
CloudWatch logs all activity`;

      default:
        return 'Describe your architecture here...';
    }
  }

  /**
   * Get example text based on diagram type
   */
  private getExampleText(): string {
    switch (this.diagramType) {
      case 'context':
        return `A web application with Users and Admins.
The main System connects to a Payment API (external)
and an Email Service (external).

Users interact with System to place orders
Admins manage System configuration`;

      case 'container':
        return `Web App (React) for users
Mobile App (React Native) for users
API Server (Node.js) for backend
PostgreSQL for data storage
Redis for caching

Web App calls API Server
Mobile App calls API Server
API Server reads/writes PostgreSQL
API Server uses Redis for sessions`;

      case 'component':
        return `API Server deployed on AWS:
- Express Router
- Auth Middleware
- Business Logic
- AWS Lambda for functions
- DynamoDB for data
- CloudWatch for logs`;

      default:
        return '';
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
