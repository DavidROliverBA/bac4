/**
 * Frontmatter Parser Utility
 * Parses YAML frontmatter from markdown files
 */

import type { Node, Edge } from 'reactflow';

export interface FrontmatterData {
  bac4_diagram?: boolean;
  bac4_type?: 'context' | 'container' | 'component';
  bac4_data?: string;
  bac4_created?: string;
  bac4_updated?: string;
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontmatter: FrontmatterData;
  body: string;
  hasFrontmatter: boolean;
}

/**
 * Parse markdown content with YAML frontmatter
 */
export function parseFrontmatter(content: string): ParsedMarkdown {
  // Check for frontmatter delimiters
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter found
    return {
      frontmatter: {},
      body: content,
      hasFrontmatter: false,
    };
  }

  const [, frontmatterText, body] = match;

  try {
    // Parse YAML frontmatter
    const frontmatter = parseYAML(frontmatterText);
    return {
      frontmatter,
      body: body.trim(),
      hasFrontmatter: true,
    };
  } catch (error) {
    console.error('BAC4: Error parsing frontmatter:', error);
    // Return content as body if parsing fails
    return {
      frontmatter: {},
      body: content,
      hasFrontmatter: false,
    };
  }
}

/**
 * Simple YAML parser for frontmatter
 * Handles basic key-value pairs and multiline strings
 */
function parseYAML(yamlText: string): FrontmatterData {
  const result: FrontmatterData = {};
  const lines = yamlText.split('\n');
  let currentKey: string | null = null;
  let multilineValue: string[] = [];
  let inMultiline = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) continue;

    // Check for multiline string (key: |)
    if (line.match(/^([a-zA-Z0-9_]+):\s*\|$/)) {
      const key = line.match(/^([a-zA-Z0-9_]+):/)?.[1];
      if (key) {
        currentKey = key;
        inMultiline = true;
        multilineValue = [];
      }
      continue;
    }

    // If in multiline mode, collect indented lines
    if (inMultiline) {
      // Check if line is indented (part of multiline value)
      if (line.startsWith('  ')) {
        multilineValue.push(line.substring(2)); // Remove 2-space indent
      } else {
        // End of multiline value
        if (currentKey) {
          result[currentKey] = multilineValue.join('\n');
        }
        inMultiline = false;
        currentKey = null;
        multilineValue = [];
        // Process this line as normal key-value
        i--; // Reprocess this line
      }
      continue;
    }

    // Parse key-value pairs
    const keyValueMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;

      // Parse value type
      if (value === 'true') {
        result[key] = true;
      } else if (value === 'false') {
        result[key] = false;
      } else if (value.match(/^\d+$/)) {
        result[key] = parseInt(value, 10);
      } else if (value.match(/^\d+\.\d+$/)) {
        result[key] = parseFloat(value);
      } else {
        // String value (remove quotes if present)
        result[key] = value.replace(/^["'](.*)["']$/, '$1');
      }
    }
  }

  // Handle trailing multiline value
  if (inMultiline && currentKey) {
    result[currentKey] = multilineValue.join('\n');
  }

  return result;
}

/**
 * Build markdown content with frontmatter
 */
export function buildMarkdownWithFrontmatter(
  frontmatter: FrontmatterData,
  body: string
): string {
  const yamlLines: string[] = [];

  // Add frontmatter fields
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'boolean') {
      yamlLines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      yamlLines.push(`${key}: ${value}`);
    } else if (typeof value === 'string') {
      // Check if multiline
      if (value.includes('\n')) {
        yamlLines.push(`${key}: |`);
        // Indent each line with 2 spaces
        const indentedLines = value.split('\n').map(line => `  ${line}`);
        yamlLines.push(...indentedLines);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    } else if (Array.isArray(value)) {
      yamlLines.push(`${key}:`);
      value.forEach(item => {
        yamlLines.push(`  - ${item}`);
      });
    }
  }

  // Combine frontmatter and body
  return `---\n${yamlLines.join('\n')}\n---\n\n${body.trim()}\n`;
}

/**
 * Check if content has BAC4 diagram frontmatter
 */
export function hasBac4Diagram(content: string): boolean {
  const { frontmatter } = parseFrontmatter(content);
  return frontmatter.bac4_diagram === true || !!frontmatter.bac4_data;
}

/**
 * Extract diagram data from frontmatter
 */
export function extractDiagramData(content: string): {
  nodes: Node[];
  edges: Edge[];
} | null {
  const { frontmatter } = parseFrontmatter(content);

  if (!frontmatter.bac4_data) {
    return null;
  }

  try {
    const data = JSON.parse(frontmatter.bac4_data);
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  } catch (error) {
    console.error('BAC4: Error parsing diagram data from frontmatter:', error);
    return null;
  }
}
