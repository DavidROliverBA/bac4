/**
 * BAC4 Plugin Settings Interface
 */
export interface BAC4Settings {
  defaultProjectLocation: string;
  enableAIFeatures: boolean;
  autoSaveInterval: number;
  dashboardPath: string; // Path to main Context diagram
  mcp: MCPSettings;
}

/**
 * MCP (Model Context Protocol) Settings
 * Note: Using "MCP" naming for user-facing features, but technically uses Anthropic API
 */
export interface MCPSettings {
  enabled: boolean;           // Enable AI features
  apiKey: string;             // Anthropic API key
  autoValidate: boolean;      // Real-time diagram validation
  autoSuggest: boolean;       // AI suggestions while editing
}
