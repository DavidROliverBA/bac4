/**
 * Diagram Navigation Service
 * Manages C4 Model diagram hierarchy and navigation using central relationships file
 */

import { TFile } from 'obsidian';
import BAC4Plugin from '../main';
import {
  DiagramRelationshipsData,
  DiagramNode,
  DiagramRelationship,
  BreadcrumbItem,
} from '../types/diagram-relationships';

const RELATIONSHIPS_FILE = 'diagram-relationships.json';

export class DiagramNavigationService {
  public readonly relationshipsPath = RELATIONSHIPS_FILE;

  constructor(private plugin: BAC4Plugin) {}

  /**
   * Ensure relationships file exists (public method for initialization)
   */
  async ensureRelationshipsFile(): Promise<void> {
    await this.getRelationshipsData(); // This will create file if it doesn't exist
  }

  /**
   * Get or create the relationships data file
   */
  private async getRelationshipsData(): Promise<DiagramRelationshipsData> {
    try {
      const content = await this.plugin.app.vault.adapter.read(RELATIONSHIPS_FILE);
      return JSON.parse(content);
    } catch (error) {
      // File doesn't exist, create default structure
      const defaultData: DiagramRelationshipsData = {
        version: '1.0.0',
        diagrams: [],
        relationships: [],
        updatedAt: new Date().toISOString(),
      };
      await this.saveRelationshipsData(defaultData);
      return defaultData;
    }
  }

  /**
   * Save relationships data to file
   */
  private async saveRelationshipsData(data: DiagramRelationshipsData): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await this.plugin.app.vault.adapter.write(
      RELATIONSHIPS_FILE,
      JSON.stringify(data, null, 2)
    );
  }

  /**
   * Register a new diagram in the relationships file
   */
  async registerDiagram(
    filePath: string,
    displayName: string,
    type: 'context' | 'container' | 'component'
  ): Promise<string> {
    const data = await this.getRelationshipsData();

    // Check if diagram already exists
    const existing = data.diagrams.find((d) => d.filePath === filePath);
    if (existing) {
      console.log('BAC4: Diagram already registered:', filePath);
      return existing.id;
    }

    // Generate unique ID
    const id = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const diagram: DiagramNode = {
      id,
      filePath,
      displayName,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.diagrams.push(diagram);
    await this.saveRelationshipsData(data);

    console.log('BAC4: Registered diagram:', diagram);
    return id;
  }

  /**
   * Update diagram display name
   */
  async updateDiagramName(filePath: string, newDisplayName: string): Promise<void> {
    const data = await this.getRelationshipsData();
    const diagram = data.diagrams.find((d) => d.filePath === filePath);

    if (diagram) {
      diagram.displayName = newDisplayName;
      diagram.updatedAt = new Date().toISOString();
      await this.saveRelationshipsData(data);
      console.log('BAC4: Updated diagram name:', filePath, '->', newDisplayName);
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
   * Create a child diagram for a node
   * User can name the file anything they want
   */
  async createChildDiagram(
    parentPath: string,
    parentNodeId: string,
    parentNodeLabel: string,
    parentDiagramType: 'context' | 'container',
    childDiagramType: 'container' | 'component',
    suggestedFileName?: string
  ): Promise<string> {
    // Get or register parent diagram
    let parentDiagram = await this.getDiagramByPath(parentPath);
    if (!parentDiagram) {
      // Auto-register parent if not already registered
      const parentFile = this.plugin.app.vault.getAbstractFileByPath(parentPath);
      const parentDisplayName = parentFile?.basename || 'Diagram';
      const parentId = await this.registerDiagram(
        parentPath,
        parentDisplayName,
        parentDiagramType
      );
      parentDiagram = await this.getDiagramByPath(parentPath);
    }

    if (!parentDiagram) {
      throw new Error('Failed to register parent diagram');
    }

    // Generate child filename
    const parentFile = this.plugin.app.vault.getAbstractFileByPath(parentPath);
    const parentDir = parentFile?.parent || this.plugin.app.vault.getRoot();

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

      // Check if diagram is registered
      let existingChild = await this.getDiagramByPath(childPath);

      // If not registered, register it now
      if (!existingChild) {
        console.log('BAC4: Registering existing child diagram');
        await this.registerDiagram(childPath, parentNodeLabel, childDiagramType);
        existingChild = await this.getDiagramByPath(childPath);
      }

      // Check if relationship exists
      const data = await this.getRelationshipsData();
      const relationshipExists = data.relationships.find(
        (r) => r.parentDiagramId === parentDiagram.id && r.parentNodeId === parentNodeId
      );

      // Create relationship if it doesn't exist
      if (!relationshipExists && existingChild) {
        console.log('BAC4: Creating relationship for existing file');
        const relationship: DiagramRelationship = {
          parentDiagramId: parentDiagram.id,
          childDiagramId: existingChild.id,
          parentNodeId,
          parentNodeLabel,
          createdAt: new Date().toISOString(),
        };
        data.relationships.push(relationship);
        await this.saveRelationshipsData(data);
        console.log('BAC4: Created relationship:', relationship);
      }

      return childPath;
    }

    // File doesn't exist, create it
    console.log('BAC4: Creating new child diagram file');

    // Create initial diagram data (no metadata in file anymore)
    const initialData = {
      nodes: [],
      edges: [],
    };

    // Write file
    await this.plugin.app.vault.create(childPath, JSON.stringify(initialData, null, 2));

    // Register child diagram
    const childId = await this.registerDiagram(childPath, parentNodeLabel, childDiagramType);

    // Create relationship
    const data = await this.getRelationshipsData();
    const relationship: DiagramRelationship = {
      parentDiagramId: parentDiagram.id,
      childDiagramId: childId,
      parentNodeId,
      parentNodeLabel,
      createdAt: new Date().toISOString(),
    };
    data.relationships.push(relationship);
    await this.saveRelationshipsData(data);

    console.log('BAC4: Created child diagram:', childPath);
    console.log('BAC4: Created relationship:', relationship);
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
   * Find child diagram for a specific parent node
   */
  async findChildDiagram(parentPath: string, parentNodeId: string): Promise<string | null> {
    console.log('BAC4 NavService: Finding child for parent:', parentPath, 'nodeId:', parentNodeId);

    const data = await this.getRelationshipsData();
    const parentDiagram = data.diagrams.find((d) => d.filePath === parentPath);

    if (!parentDiagram) {
      console.log('BAC4 NavService: Parent diagram not found in relationships');
      return null;
    }

    // Find relationship
    const relationship = data.relationships.find(
      (r) => r.parentDiagramId === parentDiagram.id && r.parentNodeId === parentNodeId
    );

    if (!relationship) {
      console.log('BAC4 NavService: No relationship found for node:', parentNodeId);
      return null;
    }

    // Get child diagram
    const childDiagram = data.diagrams.find((d) => d.id === relationship.childDiagramId);
    if (!childDiagram) {
      console.log('BAC4 NavService: Child diagram not found in registry');
      return null;
    }

    console.log('BAC4 NavService: Found child diagram:', childDiagram.filePath);
    return childDiagram.filePath;
  }

  /**
   * Build breadcrumb trail for a diagram
   */
  async buildBreadcrumbs(currentPath: string): Promise<BreadcrumbItem[]> {
    const breadcrumbs: BreadcrumbItem[] = [];
    const data = await this.getRelationshipsData();

    console.log('BAC4 NavService: Building breadcrumbs for', currentPath);

    let currentDiagram = data.diagrams.find((d) => d.filePath === currentPath);

    // If diagram not registered, auto-register it
    if (!currentDiagram) {
      console.log('BAC4 NavService: Diagram not registered, auto-registering');
      const file = this.plugin.app.vault.getAbstractFileByPath(currentPath);
      if (file) {
        await this.registerDiagram(currentPath, file.basename, 'context');
        currentDiagram = await this.getDiagramByPath(currentPath);
      }
    }

    if (!currentDiagram) {
      console.log('BAC4 NavService: Could not find or register diagram');
      return [];
    }

    // Walk up the parent chain
    const visited = new Set<string>();
    let current = currentDiagram;

    while (current && !visited.has(current.id)) {
      visited.add(current.id);

      breadcrumbs.unshift({
        label: current.displayName,
        path: current.filePath,
        type: current.type,
        id: current.id,
      });

      // Find parent relationship
      const parentRel = data.relationships.find((r) => r.childDiagramId === current.id);

      if (!parentRel) {
        // Root diagram
        break;
      }

      // Get parent diagram
      const parent = data.diagrams.find((d) => d.id === parentRel.parentDiagramId);
      if (!parent) {
        console.warn('BAC4 NavService: Parent diagram not found for relationship');
        break;
      }

      current = parent;
    }

    console.log('BAC4 NavService: Final breadcrumbs:', breadcrumbs);
    return breadcrumbs;
  }

  /**
   * Navigate to parent diagram
   */
  async navigateToParent(currentPath: string): Promise<string | null> {
    const data = await this.getRelationshipsData();
    const currentDiagram = data.diagrams.find((d) => d.filePath === currentPath);

    if (!currentDiagram) {
      return null;
    }

    // Find parent relationship
    const parentRel = data.relationships.find((r) => r.childDiagramId === currentDiagram.id);
    if (!parentRel) {
      return null;
    }

    // Get parent diagram
    const parent = data.diagrams.find((d) => d.id === parentRel.parentDiagramId);
    return parent?.filePath || null;
  }

  /**
   * Remove diagram from relationships (when file is deleted)
   */
  async unregisterDiagram(filePath: string): Promise<void> {
    const data = await this.getRelationshipsData();
    const diagram = data.diagrams.find((d) => d.filePath === filePath);

    if (!diagram) {
      return;
    }

    // Remove diagram
    data.diagrams = data.diagrams.filter((d) => d.id !== diagram.id);

    // Remove all relationships involving this diagram
    data.relationships = data.relationships.filter(
      (r) => r.parentDiagramId !== diagram.id && r.childDiagramId !== diagram.id
    );

    await this.saveRelationshipsData(data);
    console.log('BAC4: Unregistered diagram:', filePath);
  }

  /**
   * Get all child diagrams of a parent
   */
  async getChildDiagrams(parentPath: string): Promise<DiagramNode[]> {
    const data = await this.getRelationshipsData();
    const parentDiagram = data.diagrams.find((d) => d.filePath === parentPath);

    if (!parentDiagram) {
      return [];
    }

    // Find all child relationships
    const childRels = data.relationships.filter((r) => r.parentDiagramId === parentDiagram.id);

    // Get child diagrams
    const children: DiagramNode[] = [];
    for (const rel of childRels) {
      const child = data.diagrams.find((d) => d.id === rel.childDiagramId);
      if (child) {
        children.push(child);
      }
    }

    return children;
  }

  /**
   * Rename a diagram file and update relationships
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
    await this.plugin.app.fileManager.renameFile(file as TFile, newPath);

    // Update relationships.json with new path
    const data = await this.getRelationshipsData();
    const diagram = data.diagrams.find((d) => d.filePath === oldPath);

    if (diagram) {
      diagram.filePath = newPath;
      diagram.displayName = fileName.replace('.bac4', '');
      diagram.updatedAt = new Date().toISOString();
      await this.saveRelationshipsData(data);
      console.log('BAC4: Updated diagram path in relationships');
    }

    console.log('BAC4: Rename complete:', newPath);
    return newPath;
  }

  /**
   * Update parent node label in relationship
   */
  async updateParentNodeLabel(
    parentPath: string,
    parentNodeId: string,
    newLabel: string
  ): Promise<void> {
    console.log('BAC4: Updating parent node label in relationships', {
      parentPath,
      parentNodeId,
      newLabel,
    });

    const data = await this.getRelationshipsData();
    const parentDiagram = data.diagrams.find((d) => d.filePath === parentPath);

    if (!parentDiagram) {
      console.warn('BAC4: Parent diagram not found in relationships');
      return;
    }

    // Find and update the relationship
    const relationship = data.relationships.find(
      (r) => r.parentDiagramId === parentDiagram.id && r.parentNodeId === parentNodeId
    );

    if (relationship) {
      relationship.parentNodeLabel = newLabel;
      await this.saveRelationshipsData(data);
      console.log('BAC4: ✅ Updated parent node label in relationship');
    } else {
      console.warn('BAC4: Relationship not found for node:', parentNodeId);
    }
  }
}
