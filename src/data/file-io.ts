import { Vault } from 'obsidian';
import { stringify as yamlStringify, parse as yamlParse } from 'yaml';

/**
 * File I/O Error Types
 */
export class FileIOError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileIOError';
  }
}

export class FileNotFoundError extends FileIOError {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}

export class ParseError extends FileIOError {
  constructor(path: string, format: 'JSON' | 'YAML', cause?: Error) {
    super(`Failed to parse ${format} file: ${path}`, cause);
    this.name = 'ParseError';
  }
}

/**
 * Read and parse a JSON file
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
 * Read and parse a YAML file
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
 * Check if a file exists
 */
export function fileExists(vault: Vault, filePath: string): boolean {
  return vault.getAbstractFileByPath(filePath) !== null;
}

/**
 * Delete a file if it exists
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
