/**
 * View type identifiers
 */
export const VIEW_TYPE_DASHBOARD = 'bac4-dashboard';
export const VIEW_TYPE_CANVAS = 'bac4-canvas';
export const VIEW_TYPE_PROMPT_LIBRARY = 'bac4-prompt-library';

/**
 * Command identifiers
 */
export const COMMAND_OPEN_DASHBOARD = 'bac4-open-dashboard';
export const COMMAND_OPEN_SETTINGS = 'bac4-open-settings';

/**
 * Default settings
 * v2.0.0: Simplified for 7-layer architecture model
 * v2.0.2: Added graph layout preferences
 * v2.1.0: Added graph filter preferences
 */
export const DEFAULT_SETTINGS = {
  defaultProjectLocation: 'projects',
  enableAIFeatures: false,  // Reserved for future AI integration
  autoSaveInterval: 30000,  // 30 seconds
  dashboardPath: 'BAC4/Context.bac4', // Default dashboard path
  graphLayout: 'hierarchical',  // Layout algorithm: 'hierarchical', 'grid', 'force-directed', 'circular'
  graphFilter: {
    layers: [],  // Empty = show all layers
    connectionFilter: 'all',  // 'all', 'isolated', 'hub', 'connected-to'
    minConnections: 5,  // Minimum connections for 'hub' filter
  },
  mcp: {
    enabled: false,         // Reserved for future AI integration (v2.2.0+)
    apiKey: '',
    autoValidate: false,
    autoSuggest: false,
  },
};
