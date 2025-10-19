/**
 * Component Library Types
 * Defines the structure for cloud component definitions
 */

// <AI_MODIFIABLE>
/**
 * Cloud provider types
 * Add new cloud providers here (e.g., 'azure', 'gcp', 'digitalocean', etc.)
 */
export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'saas' | 'it';
// </AI_MODIFIABLE>

// <AI_MODIFIABLE>
/**
 * Component category types
 * Add new categories here for organizing cloud components
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
// </AI_MODIFIABLE>

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

  /** Component type (more specific than category) */
  type: string;

  /** Short description */
  description: string;

  /** Default markdown text for documentation notes */
  defaultNoteText?: string;

  /** Icon name or SVG path */
  icon: string;

  /** Whether this component can contain other components (e.g., VPC, Subnet) */
  isContainer?: boolean;

  /** Default width in pixels */
  defaultWidth?: number;

  /** Default height in pixels */
  defaultHeight?: number;

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
