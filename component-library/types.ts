/**
 * Component Library Types
 * Defines the structure for cloud component definitions
 */

/**
 * Cloud provider types
 */
export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'saas';

/**
 * Component category types
 */
export type ComponentCategory =
  | 'compute'
  | 'storage'
  | 'database'
  | 'networking'
  | 'security'
  | 'analytics'
  | 'integration'
  | 'container'
  | 'serverless'
  | 'messaging'
  | 'cdn'
  | 'monitoring'
  | 'other';

/**
 * Component definition
 */
export interface ComponentDefinition {
  /** Unique identifier for the component */
  id: string;

  /** Display name */
  name: string;

  /** Cloud provider */
  provider: CloudProvider;

  /** Component category */
  category: ComponentCategory;

  /** Short description */
  description: string;

  /** Icon name or SVG path */
  icon: string;

  /** Default color for visual representation */
  color: string;

  /** Default properties */
  defaultProps?: Record<string, any>;

  /** Tags for search/filtering */
  tags?: string[];

  /** Documentation URL */
  docsUrl?: string;
}

/**
 * Component instance on canvas
 */
export interface ComponentInstance {
  /** Instance ID */
  id: string;

  /** Component definition ID */
  componentId: string;

  /** Display label */
  label: string;

  /** Custom properties */
  properties: Record<string, any>;

  /** Position on canvas */
  position: { x: number; y: number };

  /** Optional notes */
  notes?: string;
}

/**
 * Component library
 */
export interface ComponentLibrary {
  /** Library name */
  name: string;

  /** Library version */
  version: string;

  /** Provider */
  provider: CloudProvider;

  /** Components in this library */
  components: ComponentDefinition[];
}
