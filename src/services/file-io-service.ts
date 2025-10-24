/**
 * File I/O Service: Dual-File Format Operations
 *
 * Handles reading and writing the new v2.5.0 dual-file format:
 * - .bac4 files: Nodes (semantic data)
 * - .bac4-graph files: Relationships + layout (presentation data)
 *
 * @version 2.5.0
 */

import { Vault, TFile } from 'obsidian';
import type { Node, Edge } from 'reactflow';
import type {
  BAC4FileV2,
  BAC4GraphFileV2,
  NodeV2,
  EdgeV2,
  Snapshot,
  NodeType,
  EdgeType,
  Direction,
  MarkerType,
  HandlePosition,
  LayoutInfo,
} from '../types/bac4-v2-types';

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Read .bac4 file (nodes only)
 */
export async function readBAC4File(
  vault: Vault,
  filePath: string
): Promise<BAC4FileV2> {
  const file = vault.getAbstractFileByPath(filePath);

  if (!(file instanceof TFile)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await vault.read(file);
  const data = JSON.parse(content);

  // Validate format
  if (data.version !== '2.5.0') {
    throw new Error(
      `Invalid file version: ${data.version}. Expected 2.5.0. File may need migration.`
    );
  }

  return data as BAC4FileV2;
}

/**
 * Read .bac4-graph file (relationships + layout)
 */
export async function readBAC4GraphFile(
  vault: Vault,
  filePath: string
): Promise<BAC4GraphFileV2> {
  const file = vault.getAbstractFileByPath(filePath);

  if (!(file instanceof TFile)) {
    throw new Error(`Graph file not found: ${filePath}`);
  }

  const content = await vault.read(file);
  const data = JSON.parse(content);

  // Validate format
  if (data.version !== '2.5.0') {
    throw new Error(
      `Invalid graph file version: ${data.version}. Expected 2.5.0.`
    );
  }

  return data as BAC4GraphFileV2;
}

/**
 * Read both .bac4 and .bac4-graph files
 */
export async function readDiagram(
  vault: Vault,
  bac4FilePath: string
): Promise<{ nodeFile: BAC4FileV2; graphFile: BAC4GraphFileV2 }> {
  const graphFilePath = bac4FilePath.replace('.bac4', '.bac4-graph');

  const nodeFile = await readBAC4File(vault, bac4FilePath);
  const graphFile = await readBAC4GraphFile(vault, graphFilePath);

  return { nodeFile, graphFile };
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Write .bac4 file (nodes only)
 */
export async function writeBAC4File(
  vault: Vault,
  filePath: string,
  nodeFile: BAC4FileV2
): Promise<void> {
  // Update timestamp
  nodeFile.metadata.updated = new Date().toISOString();

  const content = JSON.stringify(nodeFile, null, 2);
  const file = vault.getAbstractFileByPath(filePath);

  if (file instanceof TFile) {
    await vault.modify(file, content);
  } else {
    // File not found in cache, try to create it
    try {
      await vault.create(filePath, content);
    } catch (error) {
      // If "file already exists", try to find and modify it (handles case-insensitive FS)
      if (error.message && error.message.includes('already exists')) {
        // Try exact path first
        let existingFile = vault.getAbstractFileByPath(filePath);

        // If not found, search directory for case-insensitive match
        if (!existingFile) {
          const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
          const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
          const dir = vault.getAbstractFileByPath(dirPath);

          if (dir && 'children' in dir) {
            const match = dir.children.find(
              (child) => child.name.toLowerCase() === fileName.toLowerCase()
            );
            if (match instanceof TFile) {
              existingFile = match;
            }
          }
        }

        if (existingFile instanceof TFile) {
          await vault.modify(existingFile, content);
        } else {
          throw error; // Re-throw if we still can't find it
        }
      } else {
        throw error; // Re-throw other errors
      }
    }
  }
}

/**
 * Write .bac4-graph file (relationships + layout)
 */
export async function writeBAC4GraphFile(
  vault: Vault,
  filePath: string,
  graphFile: BAC4GraphFileV2
): Promise<void> {
  // Update timestamp
  graphFile.metadata.updated = new Date().toISOString();

  const content = JSON.stringify(graphFile, null, 2);
  const file = vault.getAbstractFileByPath(filePath);

  if (file instanceof TFile) {
    await vault.modify(file, content);
  } else {
    // File not found in cache, try to create it
    try {
      await vault.create(filePath, content);
    } catch (error) {
      // If "file already exists", try to find and modify it (handles case-insensitive FS)
      if (error.message && error.message.includes('already exists')) {
        // Try exact path first
        let existingFile = vault.getAbstractFileByPath(filePath);

        // If not found, search directory for case-insensitive match
        if (!existingFile) {
          const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
          const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
          const dir = vault.getAbstractFileByPath(dirPath);

          if (dir && 'children' in dir) {
            const match = dir.children.find(
              (child) => child.name.toLowerCase() === fileName.toLowerCase()
            );
            if (match instanceof TFile) {
              existingFile = match;
            }
          }
        }

        if (existingFile instanceof TFile) {
          await vault.modify(existingFile, content);
        } else {
          throw error; // Re-throw if we still can't find it
        }
      } else {
        throw error; // Re-throw other errors
      }
    }
  }
}

/**
 * Write both .bac4 and .bac4-graph files
 */
export async function writeDiagram(
  vault: Vault,
  bac4FilePath: string,
  nodeFile: BAC4FileV2,
  graphFile: BAC4GraphFileV2
): Promise<void> {
  const graphFilePath = bac4FilePath.replace('.bac4', '.bac4-graph');

  await writeBAC4File(vault, bac4FilePath, nodeFile);
  await writeBAC4GraphFile(vault, graphFilePath, graphFile);
}

// ============================================================================
// Merge/Split Operations (React Flow ↔ BAC4 Format)
// ============================================================================

/**
 * Merge node data + layout data → React Flow nodes
 */
export function mergeNodesAndLayout(
  nodeFile: BAC4FileV2,
  graphFile: BAC4GraphFileV2,
  snapshotId?: string
): Node[] {
  // Get current snapshot
  const snapshot = snapshotId
    ? graphFile.timeline.snapshots.find((s) => s.id === snapshotId)
    : graphFile.timeline.snapshots.find(
        (s) => s.id === graphFile.timeline.currentSnapshotId
      );

  if (!snapshot) {
    throw new Error('No current snapshot found in graph file');
  }

  // ✅ FIX: Handle missing layout gracefully (might happen with old/corrupted files)
  if (!snapshot.layout) {
    console.warn(`Snapshot ${snapshot.id} has no layout data, using defaults for all nodes`);
  }

  // Determine if this is the current snapshot or a historical one
  const isCurrentSnapshot = snapshot.id === graphFile.timeline.currentSnapshotId;

  // Merge each node
  const nodes: Node[] = Object.values(nodeFile.nodes).map((node) => {
    const layout = snapshot.layout?.[node.id];

    // Only warn if node is missing from CURRENT snapshot
    // Historical snapshots are expected to not have newer nodes
    if (!layout && isCurrentSnapshot) {
      console.warn(
        `⚠️ BAC4 v2.5: Node ${node.id} ("${node.properties.label}") missing from current snapshot layout, using defaults (0, 0). ` +
        `This usually means the node was added but auto-save hasn't completed yet.`
      );
    }

    return {
      id: node.id,
      type: node.type,
      position: {
        x: layout?.x || 0,
        y: layout?.y || 0,
      },
      width: layout?.width || 200,
      height: layout?.height || 100,
      data: {
        // Core properties
        label: node.properties.label,
        description: node.properties.description,
        technology: node.properties.technology,
        team: node.properties.team,

        // Additional properties
        ...node.properties,

        // Knowledge
        knowledge: node.knowledge,

        // Metrics
        metrics: node.metrics,

        // Wardley properties
        wardley: node.wardley,

        // Links
        links: node.links,

        // Style
        color: node.style.color,
        icon: node.style.icon,
        shape: node.style.shape,
      },
    };
  });

  return nodes;
}

/**
 * Get edges from graph file
 */
export function getEdgesFromGraph(
  graphFile: BAC4GraphFileV2,
  snapshotId?: string
): Edge[] {
  // Get current snapshot
  const snapshot = snapshotId
    ? graphFile.timeline.snapshots.find((s) => s.id === snapshotId)
    : graphFile.timeline.snapshots.find(
        (s) => s.id === graphFile.timeline.currentSnapshotId
      );

  if (!snapshot) {
    throw new Error('No current snapshot found in graph file');
  }

  // Convert edges
  const edges: Edge[] = snapshot.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'default',
    data: {
      label: edge.properties.label,
      direction: edge.style.direction,
      ...edge.properties,
    },
    style: {
      stroke: edge.style.color,
      strokeWidth: 2,
    },
    markerEnd: edge.style.markerEnd,
    sourceHandle: edge.handles.sourceHandle,
    targetHandle: edge.handles.targetHandle,
  }));

  return edges;
}

/**
 * Split React Flow nodes/edges → BAC4 format (for saving)
 */
export function splitNodesAndEdges(
  nodes: Node[],
  edges: Edge[],
  currentNodeFile: BAC4FileV2,
  currentGraphFile: BAC4GraphFileV2
): { nodeFile: BAC4FileV2; graphFile: BAC4GraphFileV2 } {
  // Update nodes in node file (semantic data only)
  const updatedNodes: Record<string, NodeV2> = {};

  for (const reactFlowNode of nodes) {
    // Get existing node to preserve fields not in React Flow
    const existingNode = currentNodeFile.nodes[reactFlowNode.id];

    updatedNodes[reactFlowNode.id] = {
      id: reactFlowNode.id,
      type: (reactFlowNode.type || 'system') as NodeType,
      properties: {
        label: reactFlowNode.data.label,
        description: reactFlowNode.data.description || '',
        technology: reactFlowNode.data.technology,
        team: reactFlowNode.data.team,
        // Preserve other properties
        ...(existingNode?.properties || {}),
        ...extractNodeProperties(reactFlowNode.data),
      },
      knowledge: reactFlowNode.data.knowledge || {
        notes: [],
        urls: [],
        attachments: [],
      },
      metrics: reactFlowNode.data.metrics || {},
      wardley: reactFlowNode.data.wardley,
      links: reactFlowNode.data.links || {
        parent: null,
        children: [],
        linkedDiagrams: [],
        externalSystems: [],
        dependencies: [],
      },
      style: {
        color: reactFlowNode.data.color || '#3b82f6',
        icon: reactFlowNode.data.icon,
        shape: reactFlowNode.data.shape,
      },
    };
  }

  // Create updated node file
  const nodeFile: BAC4FileV2 = {
    ...currentNodeFile,
    nodes: updatedNodes,
  };

  // Update graph file with new layout and edges
  const currentSnapshot = currentGraphFile.timeline.snapshots.find(
    (s) => s.id === currentGraphFile.timeline.currentSnapshotId
  );

  if (!currentSnapshot) {
    throw new Error('No current snapshot found');
  }

  // Update layout
  const layout: Record<string, LayoutInfo> = {};
  for (const node of nodes) {
    layout[node.id] = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 200,
      height: node.height || 100,
      locked: false,
    };
  }

  // Update edges
  const graphEdges: EdgeV2[] = edges.map((edge) => {
    const direction = (edge.data?.direction as Direction) || 'right';
    const markerEnd = (typeof edge.markerEnd === 'string' ? edge.markerEnd : edge.markerEnd?.type || 'arrowclosed') as MarkerType;
    const edgeType = (edge.type && ['uses', 'sends-data-to', 'depends-on', 'contains', 'implements'].includes(edge.type)
      ? edge.type
      : 'default') as EdgeType;
    const sourceHandle = (edge.sourceHandle || 'right') as HandlePosition;
    const targetHandle = (edge.targetHandle || 'left') as HandlePosition;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edgeType,
      properties: {
        label: edge.data?.label,
        ...edge.data,
      },
      style: {
        direction,
        lineType: 'solid',
        color: (typeof edge.style?.stroke === 'string' ? edge.style.stroke : '#888888'),
        markerEnd,
      },
      handles: {
        sourceHandle,
        targetHandle,
      },
    };
  });

  // Update current snapshot
  const updatedSnapshot: Snapshot = {
    ...currentSnapshot,
    layout,
    edges: graphEdges,
  };

  // Update graph file
  const graphFile: BAC4GraphFileV2 = {
    ...currentGraphFile,
    timeline: {
      ...currentGraphFile.timeline,
      snapshots: currentGraphFile.timeline.snapshots.map((s) =>
        s.id === currentSnapshot.id ? updatedSnapshot : s
      ),
    },
  };

  return { nodeFile, graphFile };
}

/**
 * Extract node properties from React Flow data
 * Filters out special properties that are stored separately in v2.5.0 format
 */
function extractNodeProperties(data: Record<string, unknown>): Record<string, unknown> {
  const {
    label: _label,
    description: _description,
    technology: _technology,
    team: _team,
    knowledge: _knowledge,
    metrics: _metrics,
    wardley: _wardley,
    links: _links,
    color: _color,
    icon: _icon,
    shape: _shape,
    ...rest
  } = data;

  return rest;
}

// ============================================================================
// Snapshot Management
// ============================================================================

/**
 * Create new snapshot in graph file
 */
export function createSnapshot(
  graphFile: BAC4GraphFileV2,
  label: string,
  description: string,
  timestamp: string | null
): BAC4GraphFileV2 {
  const currentSnapshot = graphFile.timeline.snapshots.find(
    (s) => s.id === graphFile.timeline.currentSnapshotId
  );

  if (!currentSnapshot) {
    throw new Error('No current snapshot found');
  }

  // Create new snapshot (copy of current)
  const newSnapshot: Snapshot = {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    label,
    description,
    timestamp,
    created: new Date().toISOString(),
    layout: { ...currentSnapshot.layout },
    edges: [...currentSnapshot.edges],
    groups: [...currentSnapshot.groups],
    annotations: [...currentSnapshot.annotations],
  };

  return {
    ...graphFile,
    timeline: {
      snapshots: [...graphFile.timeline.snapshots, newSnapshot],
      currentSnapshotId: newSnapshot.id,
      snapshotOrder: [...graphFile.timeline.snapshotOrder, newSnapshot.id],
    },
  };
}

/**
 * Switch to different snapshot
 */
export function switchSnapshot(
  graphFile: BAC4GraphFileV2,
  snapshotId: string
): BAC4GraphFileV2 {
  const snapshot = graphFile.timeline.snapshots.find((s) => s.id === snapshotId);

  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  return {
    ...graphFile,
    timeline: {
      ...graphFile.timeline,
      currentSnapshotId: snapshotId,
    },
  };
}

/**
 * Delete snapshot
 */
export function deleteSnapshot(
  graphFile: BAC4GraphFileV2,
  snapshotId: string
): BAC4GraphFileV2 {
  // Can't delete last snapshot
  if (graphFile.timeline.snapshots.length === 1) {
    throw new Error('Cannot delete last snapshot');
  }

  // Can't delete current snapshot (switch first)
  if (graphFile.timeline.currentSnapshotId === snapshotId) {
    throw new Error('Cannot delete current snapshot. Switch to another first.');
  }

  return {
    ...graphFile,
    timeline: {
      ...graphFile.timeline,
      snapshots: graphFile.timeline.snapshots.filter((s) => s.id !== snapshotId),
      snapshotOrder: graphFile.timeline.snapshotOrder.filter(
        (id) => id !== snapshotId
      ),
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if file exists
 */
export function fileExists(vault: Vault, filePath: string): boolean {
  const file = vault.getAbstractFileByPath(filePath);
  return file instanceof TFile;
}

/**
 * Get graph file path from bac4 file path
 */
export function getGraphFilePath(bac4FilePath: string): string {
  return bac4FilePath.replace('.bac4', '.bac4-graph');
}

/**
 * Get bac4 file path from graph file path
 */
export function getBAC4FilePath(graphFilePath: string): string {
  return graphFilePath.replace('.bac4-graph', '.bac4');
}

/**
 * Validate that node file and graph file are compatible
 */
export function validateFileCompatibility(
  nodeFile: BAC4FileV2,
  graphFile: BAC4GraphFileV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check versions match
  if (nodeFile.version !== graphFile.version) {
    errors.push(
      `Version mismatch: node file ${nodeFile.version} vs graph file ${graphFile.version}`
    );
  }

  // Check that graph file references correct node file
  const nodeFileName = nodeFile.metadata.title.replace(/[^a-zA-Z0-9-]/g, '_') + '.bac4';
  if (graphFile.metadata.nodeFile && graphFile.metadata.nodeFile !== nodeFileName) {
    console.warn(
      `Graph file references different node file: ${graphFile.metadata.nodeFile}`
    );
    // Not an error, just a warning
  }

  // Check that all nodes in layout exist in node file
  for (const snapshot of graphFile.timeline.snapshots) {
    for (const nodeId of Object.keys(snapshot.layout)) {
      if (!nodeFile.nodes[nodeId]) {
        errors.push(
          `Snapshot ${snapshot.id} references non-existent node: ${nodeId}`
        );
      }
    }

    // Check that all edge nodes exist
    for (const edge of snapshot.edges) {
      if (!nodeFile.nodes[edge.source]) {
        errors.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
      }
      if (!nodeFile.nodes[edge.target]) {
        errors.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
