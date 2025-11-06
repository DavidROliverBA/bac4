/**
 * File I/O Utilities
 *
 * Provides type-safe, error-handled file operations for reading and writing
 * JSON and YAML files in an Obsidian vault. Includes custom error types
 * for better error handling and debugging.
 *
 * **Features:**
 * - Type-safe JSON/YAML reading with generics
 * - Auto-create files if they don't exist
 * - Custom error hierarchy for granular error handling
 * - Pretty-print JSON formatting
 * - File existence checking
 * - Safe file deletion
 *
 * @module file-io
 * @example
 * ```ts
 * import { readJSON, writeJSON, fileExists } from './data/file-io';
 *
 * // Read typed JSON
 * const config = await readJSON<AppConfig>(vault, 'config.json');
 *
 * // Write JSON with auto-formatting
 * await writeJSON(vault, 'data.json', { foo: 'bar' });
 *
 * // Check existence
 * if (fileExists(vault, 'settings.json')) {
 *   // ...
 * }
 * ```
 */

import { Vault, TFile } from 'obsidian';
import { Node, Edge } from 'reactflow';
import { stringify as yamlStringify, parse as yamlParse } from 'yaml';
import { BAC4FileV1, isBAC4FileV1, Timeline } from '../types/timeline';
import { TimelineService } from '../services/TimelineService';

/**
 * Base error class for all file I/O operations
 *
 * @class FileIOError
 * @extends Error
 */
export class FileIOError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'FileIOError';
  }
}

/**
 * Error thrown when a requested file does not exist
 *
 * @class FileNotFoundError
 * @extends FileIOError
 */
export class FileNotFoundError extends FileIOError {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when JSON or YAML parsing fails
 *
 * @class ParseError
 * @extends FileIOError
 */
export class ParseError extends FileIOError {
  constructor(path: string, format: 'JSON' | 'YAML', cause?: Error) {
    super(`Failed to parse ${format} file: ${path}`, cause);
    this.name = 'ParseError';
  }
}

/**
 * Read and parse a JSON file with type safety
 *
 * Reads a JSON file from the vault and parses it into the specified type.
 * Throws FileNotFoundError if file doesn't exist, ParseError if JSON is invalid.
 *
 * @template T - The expected type of the parsed JSON
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the JSON file (relative to vault root)
 * @returns Promise resolving to the parsed JSON object
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {ParseError} If JSON parsing fails
 * @throws {FileIOError} For other I/O errors
 *
 * @example
 * ```ts
 * interface Config {
 *   theme: string;
 *   autoSave: boolean;
 * }
 *
 * const config = await readJSON<Config>(vault, 'config.json');
 * console.log(config.theme); // Type-safe access
 * ```
 */
export async function readJSON<T>(vault: Vault, filePath: string): Promise<T> {
  try {
    const file = vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new FileNotFoundError(filePath);
    }

    const content = await vault.read(file as TFile);

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new ParseError(filePath, 'JSON', error as Error);
    }
  } catch (error) {
    if (error instanceof FileIOError) {
      throw error;
    }
    throw new FileIOError(`Failed to read JSON file: ${filePath}`, error as Error);
  }
}

/**
 * Write object to JSON file with pretty-print formatting
 *
 * Serializes the provided data to JSON with 2-space indentation.
 * Creates the file if it doesn't exist, otherwise modifies existing file.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the JSON file (relative to vault root)
 * @param data - Data to serialize to JSON
 * @returns Promise resolving when write completes
 * @throws {FileIOError} If write operation fails
 *
 * @example
 * ```ts
 * const data = {
 *   nodes: [{ id: '1', label: 'System A' }],
 *   edges: []
 * };
 *
 * await writeJSON(vault, 'diagram.json', data);
 * // Creates or updates diagram.json with formatted JSON
 * ```
 */
export async function writeJSON(vault: Vault, filePath: string, data: unknown): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);

    const file = vault.getAbstractFileByPath(filePath);
    if (file) {
      await vault.modify(file as TFile, content);
    } else {
      await vault.create(filePath, content);
    }
  } catch (error) {
    throw new FileIOError(`Failed to write JSON file: ${filePath}`, error as Error);
  }
}

/**
 * Read and parse a YAML file with type safety
 *
 * Reads a YAML file from the vault and parses it into the specified type.
 * Throws FileNotFoundError if file doesn't exist, ParseError if YAML is invalid.
 *
 * @template T - The expected type of the parsed YAML
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the YAML file (relative to vault root)
 * @returns Promise resolving to the parsed YAML object
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {ParseError} If YAML parsing fails
 * @throws {FileIOError} For other I/O errors
 *
 * @example
 * ```ts
 * interface Metadata {
 *   title: string;
 *   tags: string[];
 * }
 *
 * const meta = await readYAML<Metadata>(vault, 'metadata.yml');
 * console.log(meta.tags); // Type-safe access
 * ```
 */
export async function readYAML<T>(vault: Vault, filePath: string): Promise<T> {
  try {
    const file = vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new FileNotFoundError(filePath);
    }

    const content = await vault.read(file as TFile);

    try {
      return yamlParse(content) as T;
    } catch (error) {
      throw new ParseError(filePath, 'YAML', error as Error);
    }
  } catch (error) {
    if (error instanceof FileIOError) {
      throw error;
    }
    throw new FileIOError(`Failed to read YAML file: ${filePath}`, error as Error);
  }
}

/**
 * Write object to YAML file
 *
 * Serializes the provided data to YAML format.
 * Creates the file if it doesn't exist, otherwise modifies existing file.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the YAML file (relative to vault root)
 * @param data - Data to serialize to YAML
 * @returns Promise resolving when write completes
 * @throws {FileIOError} If write operation fails
 *
 * @example
 * ```ts
 * const metadata = {
 *   title: 'My Diagram',
 *   created: new Date(),
 *   tags: ['architecture', 'cloud']
 * };
 *
 * await writeYAML(vault, 'diagram.meta.yml', metadata);
 * ```
 */
export async function writeYAML(vault: Vault, filePath: string, data: unknown): Promise<void> {
  try {
    const content = yamlStringify(data);

    const file = vault.getAbstractFileByPath(filePath);
    if (file) {
      await vault.modify(file as TFile, content);
    } else {
      await vault.create(filePath, content);
    }
  } catch (error) {
    throw new FileIOError(`Failed to write YAML file: ${filePath}`, error as Error);
  }
}

/**
 * Check if a file exists in the vault
 *
 * Fast synchronous check for file existence.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to check (relative to vault root)
 * @returns True if file exists, false otherwise
 *
 * @example
 * ```ts
 * if (fileExists(vault, 'config.json')) {
 *   const config = await readJSON(vault, 'config.json');
 * } else {
 *   // Create default config
 *   await writeJSON(vault, 'config.json', defaultConfig);
 * }
 * ```
 */
export function fileExists(vault: Vault, filePath: string): boolean {
  return vault.getAbstractFileByPath(filePath) !== null;
}

/**
 * Delete a file if it exists
 *
 * Safely deletes a file from the vault. Returns false if file doesn't exist
 * instead of throwing an error.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the file to delete (relative to vault root)
 * @returns Promise resolving to true if deleted, false if file didn't exist
 * @throws {FileIOError} If deletion fails for reasons other than file not existing
 *
 * @example
 * ```ts
 * const deleted = await deleteFile(vault, 'temp.json');
 * if (deleted) {
 *   console.log('Temp file removed');
 * } else {
 *   console.log('Temp file did not exist');
 * }
 * ```
 */
export async function deleteFile(vault: Vault, filePath: string): Promise<boolean> {
  try {
    const file = vault.getAbstractFileByPath(filePath);
    if (!file) {
      return false;
    }

    await vault.delete(file);
    return true;
  } catch (error) {
    throw new FileIOError(`Failed to delete file: ${filePath}`, error as Error);
  }
}

// ============================================================================
// BAC4 v1.0.0 File Format Operations
// ============================================================================

/**
 * Error thrown when a BAC4 file has invalid format
 *
 * @class InvalidFormatError
 * @extends FileIOError
 */
export class InvalidFormatError extends FileIOError {
  constructor(path: string, reason: string) {
    super(`Invalid BAC4 file format: ${path} - ${reason}`);
    this.name = 'InvalidFormatError';
  }
}

/**
 * Migrate old BAC4 file (v0.6.0) to v1.0.0 format
 *
 * Takes a legacy file with just nodes/edges and wraps it in v1.0.0 timeline structure.
 *
 * @param data - Old format data (with nodes/edges)
 * @param diagramType - Diagram type to use (defaults to 'context')
 * @returns Migrated BAC4FileV1 data
 */
function migrateToV1(
  data: unknown,
  diagramType: 'context' | 'container' | 'component' = 'context'
): BAC4FileV1 {
  const now = new Date().toISOString();

  // Type guard: ensure data is an object
  const dataObj = (typeof data === 'object' && data !== null ? data : {}) as Record<
    string,
    unknown
  >;

  // Extract nodes and edges from old format
  const nodes = (Array.isArray(dataObj.nodes) ? dataObj.nodes : []) as Node[];
  const edges = (Array.isArray(dataObj.edges) ? dataObj.edges : []) as Edge[];

  // Create timeline with initial snapshot
  const timeline: Timeline = TimelineService.createInitialTimeline(nodes, edges, 'Current');

  // Try to detect diagram type from nodes if not provided
  let detectedType = diagramType;
  const metadata = dataObj.metadata as Record<string, unknown> | undefined;
  if (metadata?.diagramType && typeof metadata.diagramType === 'string') {
    detectedType = metadata.diagramType as 'context' | 'container' | 'component';
  } else if (nodes.length > 0) {
    // Simple heuristic: check first node type
    const firstNodeType = nodes[0].type;
    if (firstNodeType === 'system' || firstNodeType === 'person') {
      detectedType = 'context';
    } else if (firstNodeType === 'container') {
      detectedType = 'container';
    } else if (firstNodeType === 'cloudComponent') {
      detectedType = 'component';
    }
  }

  const migratedData: BAC4FileV1 = {
    version: '1.0.0',
    metadata: {
      diagramType: detectedType,
      createdAt: (metadata?.createdAt as string) || now,
      updatedAt: now,
    },
    timeline,
  };

  console.log(
    `BAC4: ✅ Migrated old format to v1.0.0 (${nodes.length} nodes, ${edges.length} edges)`
  );

  return migratedData;
}

/**
 * Read and validate a BAC4 v1.0.0 diagram file
 *
 * Reads a .bac4 file, validates it's v1.0.0 format, and returns the parsed data.
 * Automatically migrates old v0.6.0 files to v1.0.0 format.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the .bac4 file (relative to vault root)
 * @returns Promise resolving to the parsed BAC4 v1.0.0 file
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {ParseError} If JSON parsing fails
 * @throws {FileIOError} For other I/O errors
 *
 * @example
 * ```ts
 * const diagram = await readBAC4File(vault, 'Context.bac4');
 * console.log(diagram.version); // '1.0.0'
 * console.log(diagram.timeline.snapshots.length); // Number of snapshots
 * ```
 */
export async function readBAC4File(vault: Vault, filePath: string): Promise<BAC4FileV1> {
  try {
    // Read raw JSON
    const data = await readJSON<unknown>(vault, filePath);

    // Check if it's v1.0.0 format
    if (isBAC4FileV1(data)) {
      console.log(
        `BAC4: Loaded v1.0.0 file "${filePath}" with ${data.timeline.snapshots.length} snapshot(s)`
      );
      return data;
    }

    // Check if it's old format (v0.6.0 or earlier)
    // Old formats have nodes/edges but no timeline, OR version !== "1.0.0"
    const hasNodesEdges =
      typeof data === 'object' && data !== null && 'nodes' in data && 'edges' in data;

    const hasNoTimeline = typeof data === 'object' && data !== null && !('timeline' in data);

    const isOldFormat = hasNodesEdges && hasNoTimeline;

    if (isOldFormat) {
      console.log(`BAC4: Detected old format file "${filePath}", migrating to v1.0.0...`);

      // Migrate to v1.0.0
      const migratedData = migrateToV1(data);

      // Save migrated version back to file
      await writeBAC4File(vault, filePath, migratedData);
      console.log(`BAC4: ✅ Migration complete, file saved as v1.0.0`);

      return migratedData;
    }

    // Unknown format
    throw new InvalidFormatError(
      filePath,
      'File must be v1.0.0 format with timeline, or old format with nodes/edges'
    );
  } catch (error) {
    if (error instanceof FileIOError) {
      throw error;
    }
    throw new FileIOError(`Failed to read BAC4 file: ${filePath}`, error as Error);
  }
}

/**
 * Write a BAC4 v1.0.0 diagram file
 *
 * Saves a complete BAC4 v1.0.0 file with timeline data.
 * Updates the metadata.updatedAt timestamp automatically.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the .bac4 file (relative to vault root)
 * @param data - BAC4 v1.0.0 file data
 * @returns Promise resolving when write completes
 * @throws {FileIOError} If write operation fails
 *
 * @example
 * ```ts
 * const diagram: BAC4FileV1 = {
 *   version: '1.0.0',
 *   metadata: {
 *     diagramType: 'context',
 *     createdAt: new Date().toISOString(),
 *     updatedAt: new Date().toISOString(),
 *   },
 *   timeline: timeline,
 * };
 *
 * await writeBAC4File(vault, 'Context.bac4', diagram);
 * ```
 */
export async function writeBAC4File(
  vault: Vault,
  filePath: string,
  data: BAC4FileV1
): Promise<void> {
  try {
    // Update timestamp
    const updatedData: BAC4FileV1 = {
      ...data,
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    await writeJSON(vault, filePath, updatedData);

    console.log(
      `BAC4: Saved v1.0.0 file "${filePath}" with ${data.timeline.snapshots.length} snapshot(s)`
    );
  } catch (error) {
    throw new FileIOError(`Failed to write BAC4 file: ${filePath}`, error as Error);
  }
}

/**
 * Create a new BAC4 v1.0.0 file with initial timeline
 *
 * Creates a new diagram file with v1.0.0 format and a single "Current" snapshot.
 * Useful for creating new diagrams from scratch.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the .bac4 file to create (relative to vault root)
 * @param diagramType - Type of diagram ('context', 'container', 'component')
 * @param nodes - Initial nodes (optional, defaults to empty)
 * @param edges - Initial edges (optional, defaults to empty)
 * @returns Promise resolving to the created BAC4FileV1 object
 * @throws {FileIOError} If file creation fails
 *
 * @example
 * ```ts
 * // Create empty Context diagram
 * await createBAC4File(vault, 'Context.bac4', 'context');
 *
 * // Create Container diagram with initial nodes
 * const nodes = [
 *   { id: 'node-1', type: 'container', data: { label: 'API' }, position: { x: 100, y: 100 } }
 * ];
 * await createBAC4File(vault, 'Container.bac4', 'container', nodes);
 * ```
 */
export async function createBAC4File(
  vault: Vault,
  filePath: string,
  diagramType: 'context' | 'container' | 'component',
  nodes: Node[] = [],
  edges: Edge[] = []
): Promise<BAC4FileV1> {
  try {
    const now = new Date().toISOString();

    // Create initial timeline with single snapshot
    const timeline: Timeline = TimelineService.createInitialTimeline(nodes, edges, 'Current');

    const data: BAC4FileV1 = {
      version: '1.0.0',
      metadata: {
        diagramType,
        createdAt: now,
        updatedAt: now,
      },
      timeline,
    };

    await writeBAC4File(vault, filePath, data);

    console.log(`BAC4: Created new v1.0.0 file "${filePath}" (${diagramType})`);

    return data;
  } catch (error) {
    throw new FileIOError(`Failed to create BAC4 file: ${filePath}`, error as Error);
  }
}

/**
 * Get timeline from BAC4 file
 *
 * Quick accessor to get just the timeline data from a file.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the .bac4 file
 * @returns Promise resolving to the timeline
 * @throws {FileIOError} If file read fails
 *
 * @example
 * ```ts
 * const timeline = await getTimelineFromFile(vault, 'Context.bac4');
 * console.log(`Current snapshot: ${timeline.currentSnapshotId}`);
 * ```
 */
export async function getTimelineFromFile(vault: Vault, filePath: string): Promise<Timeline> {
  const data = await readBAC4File(vault, filePath);
  return data.timeline;
}

/**
 * Update timeline in BAC4 file
 *
 * Updates just the timeline portion of a BAC4 file, preserving metadata.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to the .bac4 file
 * @param timeline - Updated timeline data
 * @returns Promise resolving when update completes
 * @throws {FileIOError} If file operations fail
 *
 * @example
 * ```ts
 * // Add new snapshot
 * const data = await readBAC4File(vault, 'Context.bac4');
 * const { snapshot, timeline } = TimelineService.createSnapshot(
 *   nodes, edges, annotations,
 *   { label: 'Phase 2' },
 *   data.timeline
 * );
 * await updateTimelineInFile(vault, 'Context.bac4', timeline);
 * ```
 */
export async function updateTimelineInFile(
  vault: Vault,
  filePath: string,
  timeline: Timeline
): Promise<void> {
  try {
    const data = await readBAC4File(vault, filePath);

    const updatedData: BAC4FileV1 = {
      ...data,
      timeline,
    };

    await writeBAC4File(vault, filePath, updatedData);

    console.log(`BAC4: Updated timeline in "${filePath}"`);
  } catch (error) {
    throw new FileIOError(`Failed to update timeline in file: ${filePath}`, error as Error);
  }
}

/**
 * Check if file is v1.0.0 format
 *
 * Quick check to see if a file exists and is v1.0.0 format without throwing errors.
 *
 * @param vault - Obsidian vault instance
 * @param filePath - Path to check
 * @returns Promise resolving to true if file is v1.0.0, false otherwise
 *
 * @example
 * ```ts
 * if (await isBAC4v1File(vault, 'Context.bac4')) {
 *   // Safe to load
 *   const data = await readBAC4File(vault, 'Context.bac4');
 * } else {
 *   console.error('Not a v1.0.0 file');
 * }
 * ```
 */
export async function isBAC4v1File(vault: Vault, filePath: string): Promise<boolean> {
  try {
    if (!fileExists(vault, filePath)) {
      return false;
    }

    const data = await readJSON<unknown>(vault, filePath);
    return isBAC4FileV1(data);
  } catch {
    return false;
  }
}
