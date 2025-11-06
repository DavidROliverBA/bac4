/**
 * ADR Service
 *
 * Service for creating and managing Architecture Decision Records (ADRs).
 * ADRs document important architectural decisions and link to diagram snapshots.
 *
 * Based on Michael Nygard's ADR format:
 * http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions
 *
 * @version 1.0.0
 */

import { App, TFile, TFolder } from 'obsidian';
import type { TimelineSnapshot, Timeline } from '../types/timeline';

/**
 * Options for creating an ADR
 */
export interface CreateADROptions {
  /** Title of the architectural decision */
  title: string;
  /** Path to the diagram file */
  diagramPath: string;
  /** Snapshot this ADR describes */
  snapshot: TimelineSnapshot;
  /** Previous snapshot for comparison (optional) */
  previousSnapshot?: TimelineSnapshot | null;
  /** Decision status (proposed, accepted, superseded, deprecated) */
  status?: 'proposed' | 'accepted' | 'superseded' | 'deprecated';
  /** Path where ADR should be created (optional, defaults to ADR folder) */
  targetPath?: string;
}

/**
 * ADRService - Manages Architecture Decision Records
 */
export class ADRService {
  private app: App;
  private adrFolder: string;

  constructor(app: App, adrFolder: string = 'ADRs') {
    this.app = app;
    this.adrFolder = adrFolder;
  }

  /**
   * Create an ADR from a diagram snapshot
   *
   * @param options - ADR creation options
   * @returns Path to the created ADR markdown file
   */
  async createADR(options: CreateADROptions): Promise<string> {
    const {
      title,
      diagramPath,
      snapshot,
      previousSnapshot = null,
      status = 'proposed',
      targetPath,
    } = options;

    // Ensure ADR folder exists
    await this.ensureADRFolder();

    // Generate ADR filename
    const filename = this.generateADRFilename(title);
    const adrPath = targetPath || `${this.adrFolder}/${filename}`;

    // Generate ADR content
    const content = this.generateADRContent({
      title,
      status,
      diagramPath,
      snapshot,
      previousSnapshot,
    });

    // Write ADR file
    await this.app.vault.create(adrPath, content);

    console.log('BAC4: Created ADR at', adrPath);
    return adrPath;
  }

  /**
   * Link an existing ADR to a snapshot
   *
   * @param snapshotId - Snapshot ID to link
   * @param adrPath - Path to ADR markdown file
   * @param timeline - Current timeline
   * @returns Updated timeline
   */
  linkADRToSnapshot(snapshotId: string, adrPath: string, timeline: Timeline): Timeline {
    const updatedSnapshots = timeline.snapshots.map((snapshot) =>
      snapshot.id === snapshotId ? { ...snapshot, adrPath } : snapshot
    );

    return {
      ...timeline,
      snapshots: updatedSnapshots,
    };
  }

  /**
   * Unlink an ADR from a snapshot
   *
   * @param snapshotId - Snapshot ID to unlink
   * @param timeline - Current timeline
   * @returns Updated timeline
   */
  unlinkADRFromSnapshot(snapshotId: string, timeline: Timeline): Timeline {
    const updatedSnapshots = timeline.snapshots.map((snapshot) =>
      snapshot.id === snapshotId ? { ...snapshot, adrPath: null } : snapshot
    );

    return {
      ...timeline,
      snapshots: updatedSnapshots,
    };
  }

  /**
   * Open an ADR file linked to a snapshot
   *
   * @param snapshot - Snapshot with linked ADR
   * @returns True if ADR was opened, false if not found
   */
  async openADR(snapshot: TimelineSnapshot): Promise<boolean> {
    if (!snapshot.adrPath) {
      console.warn('BAC4: Snapshot has no linked ADR');
      return false;
    }

    const file = this.app.vault.getAbstractFileByPath(snapshot.adrPath);
    if (!file || !(file instanceof TFile)) {
      console.error('BAC4: ADR file not found:', snapshot.adrPath);
      return false;
    }

    await this.app.workspace.getLeaf(true).openFile(file);
    return true;
  }

  /**
   * Generate ADR content using template
   */
  private generateADRContent(options: {
    title: string;
    status: string;
    diagramPath: string;
    snapshot: TimelineSnapshot;
    previousSnapshot: TimelineSnapshot | null;
  }): string {
    const { title, status, diagramPath, snapshot, previousSnapshot } = options;

    const date = new Date(snapshot.createdAt).toISOString().split('T')[0];

    let content = `# ADR: ${title}\n\n`;
    content += `**Status:** ${status}\n\n`;
    content += `**Date:** ${date}\n\n`;
    content += `**Diagram:** [[${diagramPath}]]\n\n`;
    content += `**Snapshot:** ${snapshot.label}\n\n`;

    if (snapshot.description) {
      content += `**Description:** ${snapshot.description}\n\n`;
    }

    content += `---\n\n`;

    // Context section
    content += `## Context\n\n`;
    content += `*Describe the forces at play, including technological, political, social, and project factors.*\n\n`;
    if (previousSnapshot) {
      content += `### Previous State\n\n`;
      content += `- **Snapshot:** ${previousSnapshot.label}\n`;
      content += `- **Nodes:** ${previousSnapshot.nodes.length}\n`;
      content += `- **Edges:** ${previousSnapshot.edges.length}\n\n`;
    }
    content += `### Current State\n\n`;
    content += `- **Snapshot:** ${snapshot.label}\n`;
    content += `- **Nodes:** ${snapshot.nodes.length}\n`;
    content += `- **Edges:** ${snapshot.edges.length}\n\n`;

    // Decision section
    content += `## Decision\n\n`;
    content += `*Describe the architectural decision and its rationale.*\n\n`;
    content += `We will...\n\n`;

    // Consequences section
    content += `## Consequences\n\n`;
    content += `*Describe the resulting context after applying the decision.*\n\n`;
    content += `### Positive\n\n`;
    content += `- \n\n`;
    content += `### Negative\n\n`;
    content += `- \n\n`;
    content += `### Neutral\n\n`;
    content += `- \n\n`;

    // Links section
    content += `## Related Decisions\n\n`;
    content += `*Link to related ADRs or documents.*\n\n`;

    // Footer
    content += `---\n\n`;
    content += `*Generated by BAC4 v1.0.0 on ${new Date().toISOString()}*\n`;

    return content;
  }

  /**
   * Generate ADR filename from title
   */
  private generateADRFilename(title: string): string {
    // Get next ADR number
    const adrNumber = this.getNextADRNumber();

    // Sanitize title for filename
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${adrNumber}-${sanitized}.md`;
  }

  /**
   * Get next ADR number by counting existing ADRs
   */
  private getNextADRNumber(): string {
    const adrFolderFile = this.app.vault.getAbstractFileByPath(this.adrFolder);
    if (!adrFolderFile || !(adrFolderFile instanceof TFolder)) {
      return '0001';
    }

    // Count ADR files matching pattern NNNN-*.md
    const adrFiles = adrFolderFile.children.filter((file) => {
      if (!(file instanceof TFile)) return false;
      return /^\d{4}-.*\.md$/.test(file.name);
    });

    const nextNumber = adrFiles.length + 1;
    return String(nextNumber).padStart(4, '0');
  }

  /**
   * Ensure ADR folder exists
   */
  private async ensureADRFolder(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.adrFolder);
    if (!folder) {
      await this.app.vault.createFolder(this.adrFolder);
      console.log('BAC4: Created ADR folder:', this.adrFolder);
    }
  }

  /**
   * List all ADRs in the vault
   */
  async listADRs(): Promise<TFile[]> {
    const adrFolderFile = this.app.vault.getAbstractFileByPath(this.adrFolder);
    if (!adrFolderFile || !(adrFolderFile instanceof TFolder)) {
      return [];
    }

    return adrFolderFile.children.filter(
      (file): file is TFile => file instanceof TFile && /^\d{4}-.*\.md$/.test(file.name)
    );
  }
}
