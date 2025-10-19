import { TFile } from 'obsidian';
import type BAC4Plugin from '../main';
import type {
  DiagramNode,
} from '../types/canvas-types';
import { TimelineService } from './TimelineService';

/** Path to the central relationships file */
const RELATIONSHIPS_FILE = 'diagram-relationships.json';

/**
 * Diagram Navigation Service (v0.6.0: Simplified for self-contained diagrams)
 *
 * Manages C4 Model diagram hierarchy and navigation using embedded links.
 * In v0.6.0, diagrams are self-contained with linkedDiagramPath stored in node data.
 *
 * **v0.6.0 Architecture:**
 * - Self-contained .bac4 files with embedded metadata
 * - Links stored in node.data.linkedDiagramPath (NOT external file)
 * - NO diagram-relationships.json dependency
 * - File-rename listener auto-updates all linked paths
 *
 * **Core Responsibilities:**
 * - Create child diagrams (drill-down)
 * - Find child diagrams (read from node data)
 * - Rename diagram files
 * - Sanitize filenames
 *
 * **Deprecated/Refactoring Needed:**
 * - updateDiagramType() - should update diagram file metadata
 * - getDiagramsByType() - should scan vault for .bac4 files
 * - linkToExistingDiagram() - should update node data
 * - unlinkNode() - should update node data
 * - navigateToParent() - needs parent tracking redesign
 *
 * @example
 * ```ts
 * // Initialize service
 * const navService = new DiagramNavigationService(plugin);
 *
 * // Create child diagram (drill-down)
 * const childPath = await navService.createChildDiagram(
 *   'MySystem.bac4',
 *   'node-123',
 *   'API Gateway',
 *   'context',
 *   'container'
 * );
 * // Component updates node.data.linkedDiagramPath in React state
 * // Auto-save persists to disk
 *
 * // Find child diagram
 * const childPath = await navService.findChildDiagram('MySystem.bac4', 'node-123');
 * // Reads from node.data.linkedDiagramPath in diagram file
 * ```
 */
export class DiagramNavigationService {
  /** Path to the deprecated relationships file (v0.6.0: no longer used) */
  public readonly relationshipsPath = RELATIONSHIPS_FILE;

  /**
   * Creates a new DiagramNavigationService
   * @param plugin - The BAC4 plugin instance for accessing Obsidian vault APIs
   */
  constructor(private plugin: BAC4Plugin) {}

  /**
   * Update diagram type (v0.6.0: Updates file metadata directly)
   *
   * Updates the metadata.diagramType field in the diagram file.
   * No longer depends on diagram-relationships.json.
   *
   * @param filePath - Path to .bac4 diagram file
   * @param newType - New diagram type ('context', 'container', or 'component')
   */
  async updateDiagramType(
    filePath: string,
    newType: 'context' | 'container' | 'component'
  ): Promise<void> {
    console.log('BAC4: Updating diagram type (v0.6.0):', filePath, '->', newType);

    try {
      // Read diagram file
      const content = await this.plugin.app.vault.adapter.read(filePath);
      const data = JSON.parse(content);

      // Update metadata
      if (!data.metadata) {
        data.metadata = {};
      }
      data.metadata.diagramType = newType;
      data.metadata.updatedAt = new Date().toISOString();

      // Write back
      await this.plugin.app.vault.adapter.write(filePath, JSON.stringify(data, null, 2));
      console.log('BAC4: ✅ Updated diagram type in file metadata');
    } catch (error) {
      console.error('BAC4: Error updating diagram type:', error);
      throw error;
    }
  }

  /**
   * Get diagram by file path (v0.6.0: reads from .bac4 file metadata)
   *
   * Reads the diagram file directly and extracts metadata to create DiagramNode.
   * No longer depends on diagram-relationships.json.
   *
   * @param filePath - Path to .bac4 diagram file
   * @returns DiagramNode with metadata or null if file doesn't exist
   */
  async getDiagramByPath(filePath: string): Promise<DiagramNode | null> {
    try {
      // Check if file exists
      const fileExists = await this.plugin.app.vault.adapter.exists(filePath);
      if (!fileExists) {
        console.log('BAC4 NavService: Diagram file not found:', filePath);
        return null;
      }

      // Read diagram file
      const content = await this.plugin.app.vault.adapter.read(filePath);
      const data = JSON.parse(content);

      // Extract metadata (v0.6.0 format)
      const diagramType = data.metadata?.diagramType || 'context';
      const createdAt = data.metadata?.createdAt || new Date().toISOString();
      const updatedAt = data.metadata?.updatedAt || new Date().toISOString();

      // Create DiagramNode from file data
      const fileName = filePath.split('/').pop() || filePath;
      const displayName = fileName.replace('.bac4', '');

      return {
        id: `diagram-${Date.now()}`, // Generate ID (not used for v0.6.0 matching)
        filePath,
        displayName,
        type: diagramType as 'context' | 'container' | 'component',
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('BAC4 NavService: Error reading diagram file:', filePath, error);
      return null;
    }
  }

  /**
   * Create a child diagram for a node (drill-down functionality) - v0.6.0
   *
   * Creates a new .bac4 file and links it to the parent node using embedded
   * linkedDiagramPath in the parent diagram file. This enables drill-down
   * navigation from Context → Container or Container → Component diagrams.
   *
   * **v0.6.0 Architecture:**
   * - Self-contained diagrams with embedded metadata
   * - Links stored in node.data.linkedDiagramPath (NOT external file)
   * - NO diagram-relationships.json dependency
   * - Parent diagram file is updated to set node.data.linkedDiagramPath
   *
   * **Behavior:**
   * - Sanitizes parent node label for filename (spaces → underscores)
   * - Creates file in same directory as parent
   * - If file exists, updates parent node link only
   *
   * @param parentPath - Path to the parent .bac4 file
   * @param parentNodeId - ID of the node in parent diagram
   * @param parentNodeLabel - Label of the node (used for naming child file)
   * @param parentDiagramType - Type of parent diagram ('context' or 'container')
   * @param childDiagramType - Type of child diagram ('container' or 'component')
   * @param suggestedFileName - Optional custom filename (without .bac4 extension)
   * @returns Path to the created or existing child diagram file
   *
   * @example
   * ```ts
   * // Double-click "API Gateway" node in Context diagram
   * const childPath = await navService.createChildDiagram(
   *   'MySystem.bac4',
   *   'node-api-123',
   *   'API Gateway',
   *   'context',
   *   'container'
   * );
   * // Creates: API_Gateway.bac4
   * // Updates: MySystem.bac4 → node-api-123.data.linkedDiagramPath = 'API_Gateway.bac4'
   * ```
   */
  async createChildDiagram(
    parentPath: string,
    parentNodeId: string,
    parentNodeLabel: string,
    _parentDiagramType: 'context' | 'container',
    childDiagramType: 'container' | 'component',
    suggestedFileName?: string
  ): Promise<string> {
    console.log('BAC4: createChildDiagram (v0.6.0)', {
      parentPath,
      parentNodeId,
      parentNodeLabel,
      childDiagramType,
    });

    // Generate child filename
    const parentFile = this.plugin.app.vault.getAbstractFileByPath(parentPath);
    if (!parentFile) {
      throw new Error(`Parent file not found: ${parentPath}`);
    }
    const parentDir = parentFile.parent || this.plugin.app.vault.getRoot();

    // Use suggested name or generate from parent node label
    let childFileName: string;
    if (suggestedFileName) {
      childFileName = suggestedFileName.endsWith('.bac4')
        ? suggestedFileName
        : `${suggestedFileName}.bac4`;
    } else {
      const sanitizedLabel = this.sanitizeLabelForFilename(parentNodeLabel);
      childFileName = `${sanitizedLabel}.bac4`;
    }

    // Create child diagram path
    const childPath = parentDir.path ? `${parentDir.path}/${childFileName}` : childFileName;

    // Check if file already exists
    const existingFile = this.plugin.app.vault.getAbstractFileByPath(childPath);
    if (existingFile) {
      console.log('BAC4: Child diagram file already exists at', childPath);
      console.log('BAC4: Returning existing child path (component will update linkedDiagramPath)');
      return childPath;
    }

    // File doesn't exist, create it
    console.log('BAC4: Creating new child diagram file with type:', childDiagramType);

    // Create initial diagram data (v1.0.0 format with timeline)
    const now = new Date().toISOString();
    const initialTimeline = TimelineService.createInitialTimeline([], [], 'Current');
    const initialData = {
      version: '1.0.0',
      metadata: {
        diagramType: childDiagramType,
        createdAt: now,
        updatedAt: now,
      },
      timeline: initialTimeline,
    };

    // Write child file
    await this.plugin.app.vault.create(childPath, JSON.stringify(initialData, null, 2));
    console.log('BAC4: ✅ Created child diagram file:', childPath);

    // Return child path - let the calling component update parent node's linkedDiagramPath
    // The component will update React state, and auto-save will persist to disk
    console.log('BAC4: ✅ Child diagram created (v1.0.0)');
    return childPath;
  }

  /**
   * Sanitize a label for use in filename
   */
  private sanitizeLabelForFilename(label: string): string {
    return label
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  /**
   * Find child diagram for a specific parent node (v1.0.0)
   *
   * Reads the parent diagram file and checks if the node has a linkedDiagramPath.
   * Supports both v1.0.0 (timeline/snapshots) and legacy formats.
   *
   * @param parentPath - Path to parent .bac4 file
   * @param parentNodeId - ID of node to check
   * @returns Path to child diagram or null if not linked
   */
  async findChildDiagram(parentPath: string, parentNodeId: string): Promise<string | null> {
    console.log('BAC4 NavService: Finding child for parent:', parentPath, 'nodeId:', parentNodeId);

    try {
      // Read parent diagram file
      const parentContent = await this.plugin.app.vault.adapter.read(parentPath);
      const parentData = JSON.parse(parentContent);

      // Extract nodes (v1.0.0 uses timeline snapshots, legacy uses root-level nodes)
      let nodes: Array<{ id: string; data?: { linkedDiagramPath?: string } }>;

      if (parentData.timeline) {
        // v1.0.0 format - get working snapshot (first in order)
        const workingSnapshotId = parentData.timeline.snapshotOrder?.[0];
        const workingSnapshot = parentData.timeline.snapshots?.find((s: { id: string }) => s.id === workingSnapshotId);

        if (!workingSnapshot) {
          console.error('BAC4 NavService: Working snapshot not found in timeline');
          return null;
        }

        nodes = workingSnapshot.nodes || [];
        console.log('BAC4 NavService: Using v1.0.0 timeline format, working snapshot:', workingSnapshotId);
      } else {
        // Legacy format
        nodes = parentData.nodes || [];
        console.log('BAC4 NavService: Using legacy format');
      }

      // Find the node
      const node = nodes.find((n) => n.id === parentNodeId);
      if (!node) {
        console.log('BAC4 NavService: Node not found:', parentNodeId);
        return null;
      }

      // Check if node has linkedDiagramPath
      const linkedPath = node.data?.linkedDiagramPath;
      if (!linkedPath) {
        console.log('BAC4 NavService: Node has no linkedDiagramPath');
        return null;
      }

      console.log('BAC4 NavService: Found child diagram:', linkedPath);
      return linkedPath;
    } catch (error) {
      console.error('BAC4 NavService: Error reading parent diagram:', error);
      return null;
    }
  }

  // v0.6.0: buildBreadcrumbs() removed - not used in v0.6.0 UI
  // v0.6.0: getParentDiagram() removed - parent tracking via embedded links

  /**
   * Navigate to parent diagram (v1.0.0: Scans vault for parent)
   *
   * Finds the parent diagram by scanning all .bac4 files for a node that
   * has linkedDiagramPath pointing to the current diagram.
   * Supports both v1.0.0 (timeline/snapshots) and legacy formats.
   *
   * @param currentPath - Path to current .bac4 file
   * @returns Path to parent diagram, or null if no parent found
   */
  async navigateToParent(currentPath: string): Promise<string | null> {
    console.log('BAC4: Finding parent for', currentPath);

    try {
      // Get all .bac4 files in vault
      const allFiles = this.plugin.app.vault.getFiles().filter((f) => f.extension === 'bac4');

      // Search each file for a node linking to current diagram
      for (const file of allFiles) {
        // Skip the current file
        if (file.path === currentPath) continue;

        try {
          const content = await this.plugin.app.vault.adapter.read(file.path);
          const data = JSON.parse(content);

          // Extract nodes based on format
          let nodes: Array<{ data?: { linkedDiagramPath?: string } }> = [];

          if (data.timeline) {
            // v1.0.0 format - get working snapshot (first in order)
            const workingSnapshotId = data.timeline.snapshotOrder?.[0];
            const workingSnapshot = data.timeline.snapshots?.find((s: { id: string }) => s.id === workingSnapshotId);
            nodes = workingSnapshot?.nodes || [];
          } else {
            // Legacy format
            nodes = data.nodes || [];
          }

          // Check if any node links to current diagram
          const hasLink = nodes.some(
            (node) => node.data?.linkedDiagramPath === currentPath
          );

          if (hasLink) {
            console.log('BAC4: Found parent diagram:', file.path);
            return file.path;
          }
        } catch (error) {
          // Skip files that can't be read or parsed
          console.warn('BAC4: Could not read file:', file.path, error);
          continue;
        }
      }

      console.log('BAC4: No parent diagram found');
      return null;
    } catch (error) {
      console.error('BAC4: Error finding parent:', error);
      return null;
    }
  }

  // v0.6.0: unregisterDiagram() removed - no registry to maintain
  // v0.6.0: getChildDiagrams() removed - not used

  /**
   * Rename a diagram file (v0.6.0: simplified, no relationships file)
   *
   * Renames the .bac4 file in the vault. The main.ts file-rename listener
   * will automatically update any linkedDiagramPath references in other diagrams.
   */
  async renameDiagram(oldPath: string, newName: string): Promise<string> {
    console.log('BAC4: Renaming diagram from', oldPath, 'to', newName);

    // Get the file
    const file = this.plugin.app.vault.getAbstractFileByPath(oldPath);
    if (!file) {
      throw new Error('File not found');
    }

    // Ensure new name has .bac4 extension
    const fileName = newName.endsWith('.bac4') ? newName : `${newName}.bac4`;

    // Get parent directory
    const parentPath = file.parent?.path || '';
    const newPath = parentPath ? `${parentPath}/${fileName}` : fileName;

    // Check if new path already exists
    const existing = this.plugin.app.vault.getAbstractFileByPath(newPath);
    if (existing && existing.path !== oldPath) {
      throw new Error('A file with that name already exists');
    }

    // Rename the file in vault
    // v0.6.0: The file-rename listener in main.ts will update any linkedDiagramPath references
    await this.plugin.app.fileManager.renameFile(file as TFile, newPath);

    console.log('BAC4: ✅ Rename complete:', newPath);
    return newPath;
  }

  /**
   * Get all diagrams of a specific type (v0.6.0: Scans vault for .bac4 files)
   *
   * Scans all .bac4 files in the vault and returns those matching the specified type.
   * No longer depends on diagram-relationships.json.
   *
   * @param type - Diagram type to filter by ('context', 'container', or 'component')
   * @returns Array of DiagramNode objects matching the type
   */
  async getDiagramsByType(type: 'context' | 'container' | 'component'): Promise<DiagramNode[]> {
    console.log('BAC4 NavService: Getting diagrams of type:', type);

    try {
      // Get all .bac4 files in vault
      const allFiles = this.plugin.app.vault.getFiles().filter((f) => f.extension === 'bac4');
      const diagrams: DiagramNode[] = [];

      // Read each file and check its type
      for (const file of allFiles) {
        try {
          const content = await this.plugin.app.vault.adapter.read(file.path);
          const data = JSON.parse(content);

          // Get diagram type from metadata
          const diagramType = data.metadata?.diagramType || 'context';

          // If it matches the requested type, create DiagramNode
          if (diagramType === type) {
            diagrams.push({
              id: `diagram-${Date.now()}-${file.path}`,
              filePath: file.path,
              displayName: file.basename,
              type: diagramType as 'context' | 'container' | 'component',
              createdAt: data.metadata?.createdAt || new Date().toISOString(),
              updatedAt: data.metadata?.updatedAt || new Date().toISOString(),
            });
          }
        } catch (error) {
          // Skip files that can't be read or parsed
          console.warn('BAC4: Could not read diagram file:', file.path, error);
          continue;
        }
      }

      console.log(`BAC4 NavService: Found ${diagrams.length} diagrams of type ${type}`);
      return diagrams;
    } catch (error) {
      console.error('BAC4 NavService: Error getting diagrams by type:', error);
      return [];
    }
  }

  /**
   * Link a parent node to an existing child diagram (v1.0.0)
   *
   * Creates or updates a parent-child relationship to point to an existing
   * diagram file. Supports both v1.0.0 (timeline/snapshots) and legacy formats.
   *
   * @param parentPath - Path to the parent .bac4 file
   * @param parentNodeId - ID of the node in parent diagram
   * @param parentNodeLabel - Label of the node (for relationship metadata)
   * @param childDiagramPath - Path to the existing child .bac4 file
   * @throws Error if parent or child diagram not found
   *
   * @example
   * ```ts
   * // Link "API Gateway" node to pre-existing "API_Services.bac4"
   * await navService.linkToExistingDiagram(
   *   'MySystem.bac4',
   *   'node-api-123',
   *   'API Gateway',
   *   'diagrams/API_Services.bac4'
   * );
   * // Now double-clicking node opens API_Services.bac4
   * ```
   */
  async linkToExistingDiagram(
    parentPath: string,
    parentNodeId: string,
    _parentNodeLabel: string,
    childDiagramPath: string
  ): Promise<void> {
    console.log('BAC4: Linking node to existing diagram (v1.0.0)', {
      parentPath,
      parentNodeId,
      childDiagramPath,
    });

    try {
      // 1. Read parent diagram file
      const content = await this.plugin.app.vault.adapter.read(parentPath);
      const data = JSON.parse(content);

      // 2. Determine format and update nodes
      if (data.timeline) {
        // v1.0.0 format - update working snapshot (first in order)
        const workingSnapshotId = data.timeline.snapshotOrder?.[0];
        const snapshotIndex = data.timeline.snapshots?.findIndex((s: { id: string }) => s.id === workingSnapshotId);

        if (snapshotIndex === -1 || snapshotIndex === undefined) {
          throw new Error('Working snapshot not found in timeline');
        }

        const nodes = data.timeline.snapshots[snapshotIndex].nodes || [];
        const nodeIndex = nodes.findIndex((n: { id: string }) => n.id === parentNodeId);

        if (nodeIndex === -1) {
          throw new Error(`Node ${parentNodeId} not found in working snapshot`);
        }

        // Set linkedDiagramPath
        if (!nodes[nodeIndex].data) {
          nodes[nodeIndex].data = {};
        }
        nodes[nodeIndex].data.linkedDiagramPath = childDiagramPath;

        // Update metadata
        if (!data.metadata) {
          data.metadata = {};
        }
        data.metadata.updatedAt = new Date().toISOString();

        console.log('BAC4: Updated working snapshot with link (v1.0.0)');
      } else {
        // Legacy format
        const nodeIndex = data.nodes.findIndex((n: { id: string }) => n.id === parentNodeId);
        if (nodeIndex === -1) {
          throw new Error(`Node ${parentNodeId} not found in diagram`);
        }

        // Set linkedDiagramPath
        if (!data.nodes[nodeIndex].data) {
          data.nodes[nodeIndex].data = {};
        }
        data.nodes[nodeIndex].data.linkedDiagramPath = childDiagramPath;

        // Update metadata
        if (!data.metadata) {
          data.metadata = {};
        }
        data.metadata.updatedAt = new Date().toISOString();

        console.log('BAC4: Updated legacy format with link');
      }

      // 3. Write back
      await this.plugin.app.vault.adapter.write(parentPath, JSON.stringify(data, null, 2));
      console.log('BAC4: ✅ Linked node to diagram in file');
    } catch (error) {
      console.error('BAC4: Error linking diagram:', error);
      throw error;
    }
  }

  /**
   * Check if a node has an existing link
   */
  async getExistingLink(parentPath: string, parentNodeId: string): Promise<DiagramNode | null> {
    const childPath = await this.findChildDiagram(parentPath, parentNodeId);
    if (!childPath) {
      return null;
    }
    return await this.getDiagramByPath(childPath);
  }

  /**
   * Unlink a node from its child diagram (v1.0.0)
   *
   * Removes the linkedDiagramPath from the node's data in the parent diagram file.
   * Supports both v1.0.0 (timeline/snapshots) and legacy formats.
   *
   * @param parentPath - Path to parent .bac4 file
   * @param parentNodeId - ID of node to unlink
   */
  async unlinkNode(parentPath: string, parentNodeId: string): Promise<void> {
    console.log('BAC4: Unlinking node (v1.0.0)', { parentPath, parentNodeId });

    try {
      // 1. Read parent diagram file
      const content = await this.plugin.app.vault.adapter.read(parentPath);
      const data = JSON.parse(content);

      // 2. Determine format and update nodes
      if (data.timeline) {
        // v1.0.0 format - update working snapshot (first in order)
        const workingSnapshotId = data.timeline.snapshotOrder?.[0];
        const snapshotIndex = data.timeline.snapshots?.findIndex((s: { id: string }) => s.id === workingSnapshotId);

        if (snapshotIndex === -1 || snapshotIndex === undefined) {
          throw new Error('Working snapshot not found in timeline');
        }

        const nodes = data.timeline.snapshots[snapshotIndex].nodes || [];
        const nodeIndex = nodes.findIndex((n: { id: string }) => n.id === parentNodeId);

        if (nodeIndex === -1) {
          console.warn('BAC4: Node not found in working snapshot, nothing to unlink');
          return;
        }

        // Remove linkedDiagramPath
        if (nodes[nodeIndex].data && nodes[nodeIndex].data.linkedDiagramPath) {
          delete nodes[nodeIndex].data.linkedDiagramPath;
          console.log('BAC4: Removed linkedDiagramPath from working snapshot (v1.0.0)');
        } else {
          console.log('BAC4: Node has no linkedDiagramPath to remove');
        }

        // Update metadata
        if (!data.metadata) {
          data.metadata = {};
        }
        data.metadata.updatedAt = new Date().toISOString();
      } else {
        // Legacy format
        const nodeIndex = data.nodes.findIndex((n: { id: string }) => n.id === parentNodeId);
        if (nodeIndex === -1) {
          console.warn('BAC4: Node not found, nothing to unlink');
          return;
        }

        // Remove linkedDiagramPath
        if (data.nodes[nodeIndex].data && data.nodes[nodeIndex].data.linkedDiagramPath) {
          delete data.nodes[nodeIndex].data.linkedDiagramPath;
          console.log('BAC4: Removed linkedDiagramPath from node data (legacy)');
        } else {
          console.log('BAC4: Node has no linkedDiagramPath to remove');
        }

        // Update metadata
        if (!data.metadata) {
          data.metadata = {};
        }
        data.metadata.updatedAt = new Date().toISOString();
      }

      // 3. Write back
      await this.plugin.app.vault.adapter.write(parentPath, JSON.stringify(data, null, 2));
      console.log('BAC4: ✅ Unlinked node in file');
    } catch (error) {
      console.error('BAC4: Error unlinking node:', error);
      throw error;
    }
  }
}
