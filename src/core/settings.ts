/**
 * BAC4 Plugin Settings Interface
 */
export interface BAC4Settings {
  defaultProjectLocation: string;
  enableAIFeatures: boolean;
  autoSaveInterval: number;
  dashboardPath: string; // Path to main Context diagram
}
