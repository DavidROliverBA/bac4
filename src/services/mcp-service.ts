import { TFile } from 'obsidian';
import Anthropic from '@anthropic-ai/sdk';
import type BAC4Plugin from '../main';
import type { Node, Edge } from 'reactflow';
import type { CanvasNodeData, EdgeData } from '../types/canvas-types';

/**
 * MCP Service - Handles communication with Model Context Protocol server
 *
 * This service enables AI-powered features like:
 * - Generating diagrams from natural language descriptions
 * - Searching across all diagrams semantically
 * - Generating documentation from diagrams
 * - Validating diagram structure
 */
export class MCPService {
  constructor(private plugin: BAC4Plugin) {}

  /**
   * Check if AI service is available and configured
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if AI features are enabled
      const settings = this.plugin.settings;
      if (!settings.mcp?.enabled) {
        console.log('BAC4 AI: AI features are disabled in settings');
        return false;
      }

      // Check if API key is configured
      if (!settings.mcp?.apiKey || settings.mcp.apiKey.trim() === '') {
        console.log('BAC4 AI: API key not configured');
        return false;
      }

      console.log('BAC4 AI: AI service is available');
      return true;
    } catch (error) {
      console.error('BAC4 AI: Error checking AI availability:', error);
      return false;
    }
  }

  /**
   * Generate a diagram from natural language description
   *
   * @param description - Natural language description of the architecture
   * @param diagramType - Type of diagram to generate (context, container, component)
   * @returns Generated nodes and edges
   */
  async generateDiagram(
    description: string,
    diagramType: 'context' | 'container' | 'component'
  ): Promise<{ nodes: Node<CanvasNodeData>[]; edges: Edge<EdgeData>[] }> {
    console.log('BAC4 MCP: Generating diagram from description:', description);
    console.log('BAC4 MCP: Diagram type:', diagramType);

    try {
      // Build the prompt for Claude
      const prompt = this.buildDiagramGenerationPrompt(description, diagramType);

      // Send to MCP (using Obsidian's vault as context)
      const result = await this.sendToMCP(prompt);

      // Parse the response
      const diagramData = this.parseDiagramResponse(result, diagramType);

      return diagramData;
    } catch (error) {
      console.error('BAC4 MCP: Error generating diagram:', error);
      throw error;
    }
  }

  /**
   * Search across all diagrams using semantic search
   *
   * @param query - Natural language query
   * @returns Matching nodes and their containing diagrams
   */
  async searchDiagrams(query: string): Promise<DiagramSearchResult[]> {
    console.log('BAC4 MCP: Searching diagrams with query:', query);

    try {
      // Get all .bac4 files
      const bac4Files = this.plugin.app.vault
        .getFiles()
        .filter((file) => file.extension === 'bac4');

      // Build search prompt
      const prompt = this.buildSearchPrompt(query, bac4Files);

      // Send to MCP
      const result = await this.sendToMCP(prompt);

      // Parse results
      return this.parseSearchResponse(result);
    } catch (error) {
      console.error('BAC4 MCP: Error searching diagrams:', error);
      throw error;
    }
  }

  /**
   * Generate markdown documentation from diagrams
   *
   * @param diagramPaths - Paths to diagrams to document
   * @returns Generated markdown documentation
   */
  async generateDocumentation(diagramPaths: string[]): Promise<string> {
    console.log('BAC4 MCP: Generating documentation for:', diagramPaths);

    try {
      // Read all diagram files
      const diagrams = await Promise.all(
        diagramPaths.map(async (path) => {
          const file = this.plugin.app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile) {
            const content = await this.plugin.app.vault.read(file);
            return { path, content: JSON.parse(content) };
          }
          return null;
        })
      );

      const validDiagrams = diagrams.filter((d) => d !== null);

      // Build documentation prompt
      const prompt = this.buildDocumentationPrompt(validDiagrams);

      // Send to MCP
      const result = await this.sendToMCP(prompt);

      return result;
    } catch (error) {
      console.error('BAC4 MCP: Error generating documentation:', error);
      throw error;
    }
  }

  /**
   * Send a prompt to Claude AI and get response
   * Uses Anthropic API directly (not MCP protocol)
   */
  private async sendToMCP(prompt: string): Promise<string> {
    console.log('BAC4 AI: Sending prompt to Claude:', prompt.substring(0, 100) + '...');

    try {
      // Get API key from settings
      const apiKey = this.plugin.settings.mcp.apiKey;
      if (!apiKey) {
        throw new Error('Anthropic API key not configured');
      }

      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: apiKey,
        // Note: In Electron/Obsidian, we need to allow direct browser access
        dangerouslyAllowBrowser: true,
      });

      // Send message to Claude
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929', // Latest Claude model
        max_tokens: 4096, // Enough for diagram JSON
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      console.log('BAC4 AI: Received response from Claude');
      return textContent.text;
    } catch (error) {
      console.error('BAC4 AI: Error communicating with Claude:', error);

      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('authentication')) {
          throw new Error('Invalid API key. Please check your Anthropic API key in settings.');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }

      throw error;
    }
  }

  /**
   * Build prompt for diagram generation
   */
  private buildDiagramGenerationPrompt(
    description: string,
    diagramType: 'context' | 'container' | 'component'
  ): string {
    const examples = this.getExampleDiagram(diagramType);

    return `Generate a C4 ${diagramType} diagram from the following description.

DESCRIPTION:
${description}

REQUIREMENTS:
- Return ONLY valid JSON matching the BAC4 format
- Use appropriate node types for ${diagramType} level
- Position nodes for good visual layout (avoid overlaps)
- Create meaningful edge labels
- Follow C4 model best practices
- IMPORTANT: For edges, always set sourceHandle: null and targetHandle: null (React Flow will auto-calculate closest connection point)

EXAMPLE FORMAT:
${examples}

Generate the diagram as JSON:`;
  }

  /**
   * Build prompt for semantic search
   */
  private buildSearchPrompt(query: string, files: TFile[]): string {
    return `Search the following BAC4 diagrams for: "${query}"

Available diagrams:
${files.map((f) => `- ${f.path}`).join('\n')}

Return matching nodes and their relationships as a list.`;
  }

  /**
   * Build prompt for documentation generation
   */
  private buildDocumentationPrompt(diagrams: Array<{ path: string; content: unknown }>): string {
    return `Generate comprehensive architecture documentation from these BAC4 diagrams:

${diagrams
  .map(
    (d) => `
File: ${d.path}
${JSON.stringify(d.content, null, 2)}
`
  )
  .join('\n---\n')}

Create a markdown document with:
1. System overview
2. Component breakdown
3. Relationships and dependencies
4. Technology stack (if evident)`;
  }

  /**
   * Get example diagram structure for the given type
   */
  private getExampleDiagram(diagramType: string): string {
    switch (diagramType) {
      case 'context':
        return JSON.stringify(
          {
            nodes: [
              {
                id: 'node-1',
                type: 'person',
                position: { x: 100, y: 100 },
                data: { label: 'User', description: 'System user' },
              },
              {
                id: 'node-2',
                type: 'system',
                position: { x: 300, y: 100 },
                data: { label: 'System', external: false, description: 'Main system' },
              },
            ],
            edges: [
              {
                id: 'edge-1',
                source: 'node-1',
                sourceHandle: null,
                target: 'node-2',
                targetHandle: null,
                type: 'directional',
                data: { label: 'uses', direction: 'right' },
              },
            ],
          },
          null,
          2
        );

      case 'container':
        return JSON.stringify(
          {
            nodes: [
              {
                id: 'node-1',
                type: 'container',
                position: { x: 100, y: 100 },
                data: {
                  label: 'Web App',
                  containerType: 'webapp',
                  description: 'Frontend application',
                },
              },
              {
                id: 'node-2',
                type: 'container',
                position: { x: 300, y: 100 },
                data: { label: 'API', containerType: 'api', description: 'Backend API' },
              },
            ],
            edges: [
              {
                id: 'edge-1',
                source: 'node-1',
                sourceHandle: null,
                target: 'node-2',
                targetHandle: null,
                type: 'directional',
                data: { label: 'calls', direction: 'right' },
              },
            ],
          },
          null,
          2
        );

      case 'component':
        return JSON.stringify(
          {
            nodes: [
              {
                id: 'node-1',
                type: 'cloudComponent',
                position: { x: 100, y: 100 },
                data: {
                  label: 'Lambda Function',
                  componentId: 'aws-lambda',
                  provider: 'aws',
                  category: 'serverless',
                },
              },
            ],
            edges: [],
          },
          null,
          2
        );

      default:
        return '{}';
    }
  }

  /**
   * Parse diagram generation response
   */
  private parseDiagramResponse(
    response: string,
    _diagramType: string
  ): { nodes: Node<CanvasNodeData>[]; edges: Edge<EdgeData>[] } {
    try {
      // Extract JSON from response (Claude might wrap it in markdown code blocks)
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);

      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      const parsed = JSON.parse(jsonStr);

      // Sanitize edges to remove explicit handle specifications
      // This allows React Flow to automatically connect to the closest handle
      const sanitizedEdges = (parsed.edges || []).map((edge: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sourceHandle, targetHandle, ...rest } = edge as Record<string, unknown>;
        // Explicitly set to null to let React Flow calculate closest handle
        return {
          ...rest,
          sourceHandle: null,
          targetHandle: null,
        };
      });

      return {
        nodes: parsed.nodes || [],
        edges: sanitizedEdges,
      };
    } catch (error) {
      console.error('BAC4 MCP: Error parsing diagram response:', error);
      throw new Error('Failed to parse diagram from AI response');
    }
  }

  /**
   * Parse search response
   */
  private parseSearchResponse(_response: string): DiagramSearchResult[] {
    // TODO: Implement search response parsing
    return [];
  }
}

/**
 * Search result interface
 */
export interface DiagramSearchResult {
  diagramPath: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  relevance: number;
}
