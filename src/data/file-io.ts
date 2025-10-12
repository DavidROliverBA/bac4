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

import { Vault } from 'obsidian';
import { stringify as yamlStringify, parse as yamlParse } from 'yaml';

/**
 * Base error class for all file I/O operations
 *
 * @class FileIOError
 * @extends Error
 */
export class FileIOError extends Error {
  constructor(message: string, public readonly cause?: Error) {
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

    const content = await vault.read(file as any);

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
export async function writeJSON(vault: Vault, filePath: string, data: any): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);

    const file = vault.getAbstractFileByPath(filePath);
    if (file) {
      await vault.modify(file as any, content);
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

    const content = await vault.read(file as any);

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
export async function writeYAML(vault: Vault, filePath: string, data: any): Promise<void> {
  try {
    const content = yamlStringify(data);

    const file = vault.getAbstractFileByPath(filePath);
    if (file) {
      await vault.modify(file as any, content);
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
