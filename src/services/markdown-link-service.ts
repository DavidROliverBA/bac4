/**
 * Markdown Link Service
 *
 * Service for managing links between BAC4 diagram nodes and Obsidian markdown files.
 * Handles file existence checking, creation, opening, and path suggestions.
 *
 * @module MarkdownLinkService
 */

import { Vault, Workspace, TFile, TFolder, normalizePath } from 'obsidian';

/**
 * Markdown Link Service
 *
 * Static utility class for markdown file operations
 */
export class MarkdownLinkService {
  /**
   * Check if a markdown file exists in the vault
   *
   * @param vault - Obsidian vault instance
   * @param filePath - Vault-relative path (e.g., "notes/System1.md")
   * @returns Promise<boolean> - True if file exists
   */
  static async fileExists(vault: Vault, filePath: string): Promise<boolean> {
    const normalizedPath = normalizePath(filePath);
    const file = vault.getAbstractFileByPath(normalizedPath);
    return file instanceof TFile;
  }

  /**
   * Create a new markdown file with template content
   *
   * @param vault - Obsidian vault instance
   * @param filePath - Vault-relative path
   * @param nodeLabel - Node label for template
   * @param nodeType - Node type for template customization
   * @returns Promise<TFile> - Created file
   * @throws Error if file creation fails
   */
  static async createMarkdownFile(
    vault: Vault,
    filePath: string,
    nodeLabel: string,
    nodeType: string
  ): Promise<TFile> {
    const normalizedPath = normalizePath(filePath);

    // Validate path ends with .md
    if (!normalizedPath.endsWith('.md')) {
      throw new Error('File path must end with .md extension');
    }

    // Check if file already exists
    if (await this.fileExists(vault, normalizedPath)) {
      throw new Error('File already exists');
    }

    // Ensure parent folder exists
    const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
    if (folderPath && !(vault.getAbstractFileByPath(folderPath) instanceof TFolder)) {
      // Create parent folders if they don't exist
      await vault.createFolder(folderPath).catch(() => {
        // Folder might exist, ignore error
      });
    }

    // Get template content
    const content = this.getMarkdownTemplate(nodeLabel, nodeType);

    // Create file
    const file = await vault.create(normalizedPath, content);
    return file;
  }

  /**
   * Open a markdown file in Obsidian
   *
   * @param workspace - Obsidian workspace instance
   * @param vault - Obsidian vault instance
   * @param filePath - Vault-relative path
   * @param newTab - Open in new tab (default: false)
   * @throws Error if file doesn't exist or can't be opened
   */
  static async openMarkdownFile(
    workspace: Workspace,
    vault: Vault,
    filePath: string,
    newTab = false
  ): Promise<void> {
    const normalizedPath = normalizePath(filePath);
    const file = vault.getAbstractFileByPath(normalizedPath);

    if (!(file instanceof TFile)) {
      throw new Error('File not found');
    }

    // Open file in workspace
    const leaf = newTab ? workspace.getLeaf('tab') : workspace.getLeaf(false);
    await leaf.openFile(file);
  }

  /**
   * Suggest a markdown file path based on node label and diagram context
   *
   * @param nodeLabel - Node label (e.g., "System 1")
   * @param diagramPath - Current diagram path for context (e.g., "BAC4/Context.bac4")
   * @returns Suggested vault-relative path (e.g., "BAC4/docs/System_1.md")
   */
  static suggestFilePath(nodeLabel: string, diagramPath: string): string {
    // Sanitize node label for filename
    const sanitized = nodeLabel
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();

    // Get diagram folder
    const diagramFolder = diagramPath.substring(0, diagramPath.lastIndexOf('/'));
    const docsFolder = diagramFolder ? `${diagramFolder}/docs` : 'BAC4/docs';

    return `${docsFolder}/${sanitized}.md`;
  }

  /**
   * Get markdown template content for a node
   *
   * @param nodeLabel - Node label
   * @param nodeType - Node type (system, container, component, person, cloudComponent)
   * @returns Markdown template string
   */
  static getMarkdownTemplate(nodeLabel: string, nodeType: string): string {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (nodeType) {
      case 'system':
        return this.getSystemTemplate(nodeLabel, timestamp);
      case 'container':
        return this.getContainerTemplate(nodeLabel, timestamp);
      case 'cloudComponent':
        return this.getCloudComponentTemplate(nodeLabel, timestamp);
      case 'person':
        return this.getPersonTemplate(nodeLabel, timestamp);
      default:
        return this.getGenericTemplate(nodeLabel, timestamp);
    }
  }

  /**
   * System node template
   */
  private static getSystemTemplate(nodeLabel: string, timestamp: string): string {
    return `# ${nodeLabel}

*Created: ${timestamp}*

## Overview
Brief description of this system and its purpose in the architecture.

## Responsibilities
- Key responsibility 1
- Key responsibility 2
- Key responsibility 3

## Technology Stack
- Technology 1
- Technology 2
- Technology 3

## External Dependencies
- External system 1
- External system 2

## Related Diagrams
- Container diagram: [[]]
- Context diagram: [[]]

## Interfaces
### Public APIs
- API endpoint 1
- API endpoint 2

### Consumers
- Consumer 1
- Consumer 2

## Operational Notes
### Deployment
- Deployment details

### Monitoring
- Key metrics to monitor

### Disaster Recovery
- Recovery procedures

## Additional Notes
Add any additional context, decisions, or considerations here.
`;
  }

  /**
   * Container node template
   */
  private static getContainerTemplate(nodeLabel: string, timestamp: string): string {
    return `# ${nodeLabel}

*Created: ${timestamp}*

## Overview
Brief description of this container (application, service, database, etc.)

## Technology Stack
- Primary language/framework
- Runtime environment
- Key libraries

## Responsibilities
- Primary responsibility 1
- Primary responsibility 2

## Interfaces
### API Endpoints
- \`GET /endpoint1\` - Description
- \`POST /endpoint2\` - Description

### Events Published
- Event 1
- Event 2

### Events Consumed
- Event 1
- Event 2

## Dependencies
### Internal
- Container 1
- Container 2

### External
- External service 1
- External service 2

## Data Storage
- Database: [type]
- Schema: [key tables/collections]
- Caching: [strategy]

## Related Diagrams
- Component diagram: [[]]
- Container diagram: [[]]

## Deployment
- Environment: [staging/production]
- Infrastructure: [cloud/on-prem]
- Scaling: [strategy]

## Monitoring & Observability
- Metrics: [key metrics]
- Logging: [strategy]
- Alerting: [conditions]

## Additional Notes
Add any additional context, decisions, or considerations here.
`;
  }

  /**
   * Cloud component template
   */
  private static getCloudComponentTemplate(nodeLabel: string, timestamp: string): string {
    return `# ${nodeLabel}

*Created: ${timestamp}*

## Cloud Service Details
- **Provider:** [AWS/Azure/GCP/IT]
- **Service:** [service name]
- **Category:** [compute/storage/database/networking]
- **Region:** [region/location]

## Purpose
Why this cloud service is used in the architecture.

## Configuration
### Key Settings
- Setting 1: value
- Setting 2: value
- Setting 3: value

### Security
- IAM roles/permissions
- Network security groups
- Encryption settings

## Dependencies
### Upstream (Consumes from)
- Service 1
- Service 2

### Downstream (Provides to)
- Service 1
- Service 2

## Cost Considerations
- Pricing model: [on-demand/reserved/spot]
- Estimated monthly cost: $[amount]
- Cost optimization opportunities

## Operational Details
### Monitoring
- Key metrics to track
- Alerting thresholds

### Backup & Recovery
- Backup strategy
- Recovery time objective (RTO)
- Recovery point objective (RPO)

## Related Diagrams
- Component diagram: [[]]

## Additional Notes
Add any additional context, decisions, or considerations here.
`;
  }

  /**
   * Person node template
   */
  private static getPersonTemplate(nodeLabel: string, timestamp: string): string {
    return `# ${nodeLabel}

*Created: ${timestamp}*

## Role Description
Description of this user/actor and their role in the system.

## Responsibilities
- Primary task 1
- Primary task 2
- Primary task 3

## Systems Used
- System 1 - [purpose]
- System 2 - [purpose]

## Access Requirements
### Permissions
- Permission 1
- Permission 2

### Authentication
- Authentication method
- Access control

## User Journey
1. Step 1
2. Step 2
3. Step 3

## Pain Points
- Pain point 1
- Pain point 2

## Related Diagrams
- Context diagram: [[]]

## Additional Notes
Add any additional context about this user/actor.
`;
  }

  /**
   * Generic node template
   */
  private static getGenericTemplate(nodeLabel: string, timestamp: string): string {
    return `# ${nodeLabel}

*Created: ${timestamp}*

## Overview
Description of this architectural element.

## Details
- Detail 1
- Detail 2
- Detail 3

## Related Diagrams
- [[]]

## Additional Notes
Add any additional context, decisions, or considerations here.
`;
  }

  /**
   * Get just the filename from a path
   *
   * @param filePath - Full vault-relative path
   * @returns Just the filename with extension
   */
  static getFileName(filePath: string): string {
    return filePath.substring(filePath.lastIndexOf('/') + 1);
  }

  /**
   * Validate a markdown file path
   *
   * @param filePath - Path to validate
   * @returns Object with valid flag and error message
   */
  static validatePath(filePath: string): { valid: boolean; error?: string } {
    if (!filePath || filePath.trim() === '') {
      return { valid: false, error: 'Path cannot be empty' };
    }

    if (!filePath.endsWith('.md')) {
      return { valid: false, error: 'Path must end with .md extension' };
    }

    if (filePath.length > 255) {
      return { valid: false, error: 'Path is too long (max 255 characters)' };
    }

    // Check for invalid characters (Obsidian doesn't allow these in file names)
    const invalidChars = [':', '*', '?', '"', '<', '>', '|'];
    for (const char of invalidChars) {
      if (filePath.includes(char)) {
        return { valid: false, error: `Path contains invalid character: ${char}` };
      }
    }

    return { valid: true };
  }
}
