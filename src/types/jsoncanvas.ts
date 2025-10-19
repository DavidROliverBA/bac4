/**
 * JSONCanvas Type Definitions
 *
 * Type definitions for Obsidian's JSONCanvas format (v1.0)
 * Specification: https://jsoncanvas.org/spec/1.0/
 *
 * JSONCanvas is an open file format for infinite canvas data,
 * designed for longevity, readability, and interoperability.
 *
 * @module jsoncanvas
 */

/**
 * Canvas color type - hex string or preset number (1-6)
 *
 * Preset colors (implementation-specific):
 * - 1: Red
 * - 2: Orange
 * - 3: Yellow
 * - 4: Green
 * - 5: Cyan
 * - 6: Purple
 */
export type CanvasColor = string; // Hex (e.g., "#FF0000") or "1"-"6"

/**
 * Canvas node type discriminator
 */
export type CanvasNodeType = 'text' | 'file' | 'link' | 'group';

/**
 * Canvas edge end style
 */
export type EdgeEnd = 'none' | 'arrow';

/**
 * Canvas edge side anchor
 */
export type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Generic node properties shared by all node types
 */
interface BaseCanvasNode {
  /** Unique node identifier */
  id: string;
  /** X position in pixels */
  x: number;
  /** Y position in pixels */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Optional color */
  color?: CanvasColor;
}

/**
 * Text node - stores plain text with Markdown syntax
 */
export interface TextCanvasNode extends BaseCanvasNode {
  type: 'text';
  /** Text content (Markdown supported) */
  text: string;
}

/**
 * File node - references files or attachments
 */
export interface FileCanvasNode extends BaseCanvasNode {
  type: 'file';
  /** Path to file (vault-relative) */
  file: string;
  /** Optional subpath (heading/block reference starting with #) */
  subpath?: string;
}

/**
 * Link node - references a URL
 */
export interface LinkCanvasNode extends BaseCanvasNode {
  type: 'link';
  /** URL to link to */
  url: string;
}

/**
 * Group node - visual container for other nodes
 */
export interface GroupCanvasNode extends BaseCanvasNode {
  type: 'group';
  /** Optional group label */
  label?: string;
  /** Optional background image path */
  background?: string;
  /** Background image style */
  backgroundStyle?: 'cover' | 'ratio' | 'repeat';
}

/**
 * Union of all canvas node types
 */
export type JSONCanvasNode = TextCanvasNode | FileCanvasNode | LinkCanvasNode | GroupCanvasNode;

/**
 * Canvas edge connecting two nodes
 */
export interface JSONCanvasEdge {
  /** Unique edge identifier */
  id: string;
  /** Source node ID */
  fromNode: string;
  /** Target node ID */
  toNode: string;
  /** Optional source side anchor */
  fromSide?: EdgeSide;
  /** Optional target side anchor */
  toSide?: EdgeSide;
  /** Optional source end style (default: none) */
  fromEnd?: EdgeEnd;
  /** Optional target end style (default: arrow) */
  toEnd?: EdgeEnd;
  /** Optional edge color */
  color?: CanvasColor;
  /** Optional edge label */
  label?: string;
}

/**
 * Complete JSONCanvas file structure
 */
export interface JSONCanvasFile {
  /** Array of nodes (ordered by z-index, first = lowest) */
  nodes?: JSONCanvasNode[];
  /** Array of edges */
  edges?: JSONCanvasEdge[];
}

/**
 * Type guard to check if a value is a valid canvas color
 */
export function isCanvasColor(value: unknown): value is CanvasColor {
  if (typeof value !== 'string') return false;
  // Check if hex color
  if (value.match(/^#[0-9A-Fa-f]{6}$/)) return true;
  // Check if preset (1-6)
  if (value.match(/^[1-6]$/)) return true;
  return false;
}

/**
 * Type guard to check if a node is a text node
 */
export function isTextNode(node: JSONCanvasNode): node is TextCanvasNode {
  return node.type === 'text';
}

/**
 * Type guard to check if a node is a file node
 */
export function isFileNode(node: JSONCanvasNode): node is FileCanvasNode {
  return node.type === 'file';
}

/**
 * Type guard to check if a node is a link node
 */
export function isLinkNode(node: JSONCanvasNode): node is LinkCanvasNode {
  return node.type === 'link';
}

/**
 * Type guard to check if a node is a group node
 */
export function isGroupNode(node: JSONCanvasNode): node is GroupCanvasNode {
  return node.type === 'group';
}
