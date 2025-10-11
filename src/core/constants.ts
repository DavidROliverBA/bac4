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
export const COMMAND_CREATE_PROJECT = 'bac4-create-project';
export const COMMAND_OPEN_SETTINGS = 'bac4-open-settings';

/**
 * Default settings
 */
export const DEFAULT_SETTINGS = {
  defaultProjectLocation: 'projects',
  enableAIFeatures: true,
  autoSaveInterval: 30000, // 30 seconds
  dashboardPath: 'BAC4/Context.bac4', // Default dashboard path
};
