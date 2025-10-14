import { TFile } from 'obsidian';
import type BAC4Plugin from '../main';
import type {
  DiagramRelationshipsData,
  DiagramNode,
  DiagramRelationship,
} from '../types/canvas-types';
import type { BreadcrumbItem } from '../types/component-props';

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
   * Ensure relationships file exists (DEPRECATED in v0.6.0)
   *
   * v0.6.0: This method is deprecated and does nothing. Relationships file
   * is no longer used - diagrams are self-contained with embedded links.
   *
   * @deprecated Use v0.6.0 architecture with embedded linkedDiagramPath
   * @returns Promise that resolves immediately
   */
  async ensureRelationshipsFile(): Promise<void> {
    // v0.6.0: No-op - relationships file is deprecated
    console.log('BAC4: ensureRelationshipsFile() called (v0.6.0: deprecated, no-op)');
  }

  /**
   * Get relationships data file (v0.6.0: Return empty if doesn't exist, don't create)
   *
   * In v0.6.0, this file is deprecated. Methods that use it should handle
   * empty results gracefully. We no longer auto-create this file.
   */
  private async getRelationshipsData(): Promise<DiagramRelationshipsData> {
    try {
      const content = await this.plugin.app.vault.adapter.read(RELATIONSHIPS_FILE);
      return JSON.parse(content);
    } catch (error) {
      // v0.6.0: File doesn't exist, return empty structure (don't create file)
      console.log('BAC4: diagram-relationships.json not found (v0.6.0: this is expected)');
      return {
        version: '1.0.0',
        diagrams: [],
        relationships: [],
        updatedAt: new Date().toISOString(),
      };
    }
  }

  // v0.6.0: saveRelationshipsData() removed - no longer needed
  // v0.6.0: registerDiagram() removed - diagrams are self-contained
  // v0.6.0: updateDiagramName() removed - names stored in diagram file metadata

  /**
   * Update diagram type
   */
  async updateDiagramType(
    filePath: string,
    newType: 'context' | 'container' | 'component'
  ): Promise<void> {
    const data = await this.getRelationshipsData();
    const diagram = data.diagrams.find((d) => d.filePath === filePath);

    if (diagram) {
      diagram.type = newType;
      diagram.updatedAt = new Date().toISOString();
      await this.saveRelationshipsData(data);
      console.log('BAC4: Updated diagram type:', filePath, '->', newType);
    } else {
      console.warn('BAC4: Diagram not found in relationships:', filePath);
    }
  }

  /**
   * Get diagram by file path
   */
  async getDiagramByPath(filePath: string): Promise<DiagramNode | null> {
    const data = await this.getRelationshipsData();
    return data.diagrams.find((d) => d.filePath === filePath) || null;
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
    parentDiagramType: 'context' | 'container',
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

    // Create initial diagram data (v0.6.0 format with metadata)
    const initialData = {
      version: '0.6.0',
      metadata: {
        diagramType: childDiagramType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: [],
      edges: [],
    };

    // Write child file
    await this.plugin.app.vault.create(childPath, JSON.stringify(initialData, null, 2));
    console.log('BAC4: ✅ Created child diagram file:', childPath);

    // v0.6.0: Return child path - let the calling component update parent node's linkedDiagramPath
    // The component will update React state, and auto-save will persist to disk
    console.log('BAC4: ✅ Child diagram created (v0.6.0)');
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
   * Find child diagram for a specific parent node (v0.6.0)
   *
   * Reads the parent diagram file and checks if the node has a linkedDiagramPath.
   * No external relationships file needed - link is embedded in node data.
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

      // Find the node
      const node = parentData.nodes.find((n: any) => n.id === parentNodeId);
      if (!node) {
        console.log('BAC4 NavService: Node not found:', parentNodeId);
        return null;
      }

      // Check if node has linkedDiagramPath (v0.6.0)
      const linkedPath = node.data?.linkedDiagramPath;
      if (!linkedPath) {
        console.log('BAC4 NavService: Node has no linkedDiagramPath');
        return null;
      }

      console.log('BAC4 NavService: Found child diagram (v0.6.0):', linkedPath);
      return linkedPath;
    } catch (error) {
      console.error('BAC4 NavService: Error reading parent diagram:', error);
      return null;
    }
  }

  // v0.6.0: buildBreadcrumbs() removed - not used in v0.6.0 UI
  // v0.6.0: getParentDiagram() removed - parent tracking via embedded links

  /**
   * Navigate to parent diagram (v0.6.0: Scans vault for parent)
   *
   * Finds the parent diagram by scanning all .bac4 files for a node that
   * has linkedDiagramPath pointing to the current diagram.
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

          // Check if any node links to current diagram
          if (data.nodes && Array.isArray(data.nodes)) {
            const hasLink = data.nodes.some(
              (node: any) => node.data?.linkedDiagramPath === currentPath
            );

            if (hasLink) {
              console.log('BAC4: Found parent diagram:', file.path);
              return file.path;
            }
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
   * Update parent node label in relationship (DEPRECATED in v0.6.0)
   *
   * @deprecated No longer needed - labels are stored in nodes, not relationships
   */
  async updateParentNodeLabel(
    parentPath: string,
    parentNodeId: string,
    newLabel: string
  ): Promise<void> {
    // v0.6.0: No-op - labels stored in node data, not relationships file
    console.log('BAC4: updateParentNodeLabel() called (v0.6.0: deprecated, no-op)', {
      parentPath,
      parentNodeId,
      newLabel,
    });
  }

  /**
   * Get all diagrams of a specific type
   */
  async getDiagramsByType(type: 'context' | 'container' | 'component'): Promise<DiagramNode[]> {
    const data = await this.getRelationshipsData();
    return data.diagrams.filter((d) => d.type === type);
  }

  /**
   * Link a parent node to an existing child diagram
   *
   * Creates or updates a parent-child relationship to point to an existing
   * diagram file. Useful for connecting nodes to diagrams created separately.
   * Replaces any existing link for this node.
   *
   * @param parentPath - Path to the parent .bac4 file
   * @param parentNodeId - ID of the node in parent diagram
   * @param parentNodeLabel - Label of the node (for relationship metadata)
   * @param childDiagramPath - Path to the existing child .bac4 file
   * @throws Error if parent or child diagram not found in registry
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
    parentNodeLabel: string,
    childDiagramPath: string
  ): Promise<void> {
    console.log('BAC4: Linking node to existing diagram', {
      parentPath,
      parentNodeId,
      childDiagramPath,
    });

    const data = await this.getRelationshipsData();

    // Get parent diagram
    const parentDiagram = data.diagrams.find((d) => d.filePath === parentPath);
    if (!parentDiagram) {
      throw new Error('Parent diagram not found');
    }

    // Get child diagram
    const childDiagram = data.diagrams.find((d) => d.filePath === childDiagramPath);
    if (!childDiagram) {
      throw new Error('Child diagram not found');
    }

    // Check if a relationship already exists for this node
    const existingRel = data.relationships.find(
      (r) => r.parentDiagramId === parentDiagram.id && r.parentNodeId === parentNodeId
    );

    if (existingRel) {
      // Update existing relationship
      console.log('BAC4: Updating existing relationship');
      existingRel.childDiagramId = childDiagram.id;
      existingRel.parentNodeLabel = parentNodeLabel;
    } else {
      // Create new relationship
      console.log('BAC4: Creating new relationship');
      const relationship: DiagramRelationship = {
        parentDiagramId: parentDiagram.id,
        childDiagramId: childDiagram.id,
        parentNodeId,
        parentNodeLabel,
        createdAt: new Date().toISOString(),
      };
      data.relationships.push(relationship);
    }

    await this.saveRelationshipsData(data);
    console.log('BAC4: ✅ Linked node to diagram');
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
   * Unlink a node from its child diagram
   */
  async unlinkNode(parentPath: string, parentNodeId: string): Promise<void> {
    console.log('BAC4: Unlinking node', { parentPath, parentNodeId });

    const data = await this.getRelationshipsData();
    const parentDiagram = data.diagrams.find((d) => d.filePath === parentPath);

    if (!parentDiagram) {
      console.warn('BAC4: Parent diagram not found');
      return;
    }

    // Remove the relationship
    data.relationships = data.relationships.filter(
      (r) => !(r.parentDiagramId === parentDiagram.id && r.parentNodeId === parentNodeId)
    );

    await this.saveRelationshipsData(data);
    console.log('BAC4: ✅ Unlinked node');
  }
}
