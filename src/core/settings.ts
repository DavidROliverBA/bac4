/**
 * BAC4 Plugin Settings Interface
 * v2.0.2: Added graph layout preferences
 * v2.1.0: Added graph filter preferences
 */
export interface BAC4Settings {
  defaultProjectLocation: string;
  enableAIFeatures: boolean;
  autoSaveInterval: number;
  dashboardPath: string; // Path to main Context diagram
  graphLayout?: string; // v2.0.2: Layout algorithm for graph view
  graphFilter?: GraphFilterSettings; // v2.1.0: Filter settings for graph view
  mcp: MCPSettings;
}

/**
 * Graph Filter Settings
 * v2.1.0: Filtering options for graph view
 */
export interface GraphFilterSettings {
  layers: string[]; // Empty = show all layers
  connectionFilter: 'all' | 'isolated' | 'hub' | 'connected-to';
  minConnections: number; // Minimum connections for 'hub' filter
}

/**
 * MCP (Model Context Protocol) Settings
 * Note: Using "MCP" naming for user-facing features, but technically uses Anthropic API
 */
export interface MCPSettings {
  enabled: boolean; // Enable AI features
  apiKey: string; // Anthropic API key
  autoValidate: boolean; // Real-time diagram validation
  autoSuggest: boolean; // AI suggestions while editing
}
