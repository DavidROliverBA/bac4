/**
 * Component Library Service
 *
 * Manages loading and accessing cloud component definitions for drag-and-drop
 * onto Component diagrams (C4 Level 3). Provides search, filtering, and grouping
 * capabilities for AWS, Azure, GCP, and SaaS components.
 *
 * **Responsibilities:**
 * - Load component libraries from JSON definitions
 * - Cache all components for fast access
 * - Filter by provider (AWS, Azure, GCP, SaaS)
 * - Filter by category (Compute, Storage, Database, etc.)
 * - Search components by name/description
 * - Group components for UI display
 *
 * **Architecture:**
 * - Component definitions stored in `component-library/` directory
 * - Each provider has a separate library file (aws.json, azure.json, etc.)
 * - Service provides a unified interface for all libraries
 *
 * @example
 * ```ts
 * const service = new ComponentLibraryService();
 * await service.initialize();
 *
 * // Get all AWS components
 * const awsComponents = service.getComponentsByProvider('aws');
 *
 * // Search for Lambda functions
 * const lambdas = service.searchComponents('lambda');
 *
 * // Group by category for UI display
 * const grouped = service.getComponentsGroupedByCategory();
 * ```
 *
 * @see {@link ComponentDefinition} for component structure
 * @see {@link ComponentLibrary} for library structure
 */

import {
  ComponentDefinition,
  ComponentLibrary,
  CloudProvider,
  ComponentCategory,
} from '../../component-library/types';
import {
  componentLibraries,
  getAllComponents,
  getComponentsByProvider,
  getComponentsByCategory,
  findComponentById,
  searchComponents,
} from '../../component-library';

export class ComponentLibraryService {
  private libraries: ComponentLibrary[];
  private componentsCache: ComponentDefinition[];

  constructor() {
    this.libraries = [];
    this.componentsCache = [];
  }

  /**
   * Initialize the service and load all component libraries
   *
   * Loads component definitions from all providers and caches them for fast access.
   * Should be called once during plugin initialization.
   *
   * @returns Promise that resolves when libraries are loaded
   * @example
   * ```ts
   * const service = new ComponentLibraryService();
   * await service.initialize();
   * console.log(`Loaded ${service.getAllComponents().length} components`);
   * ```
   */
  async initialize(): Promise<void> {
    this.libraries = componentLibraries;
    this.componentsCache = getAllComponents();
  }

  /**
   * Get all available libraries
   *
   * Returns metadata for each component library (name, version, provider).
   * Useful for displaying library information in UI.
   *
   * @returns Array of component library metadata
   */
  getLibraries(): ComponentLibrary[] {
    return this.libraries;
  }

  /**
   * Get all components from all libraries
   *
   * Returns the complete set of cloud components across all providers.
   * Components are cached for performance.
   *
   * @returns Array of all component definitions
   * @example
   * ```ts
   * const all = service.getAllComponents();
   * // Returns: [{ id: 'aws-lambda', name: 'Lambda', provider: 'aws', ... }, ...]
   * ```
   */
  getAllComponents(): ComponentDefinition[] {
    return this.componentsCache;
  }

  /**
   * Get components filtered by cloud provider
   *
   * Returns only components from a specific provider (AWS, Azure, GCP, SaaS).
   * Used to populate provider-specific component palettes.
   *
   * @param provider - Cloud provider to filter by
   * @returns Array of components from the specified provider
   * @example
   * ```ts
   * const awsComponents = service.getComponentsByProvider('aws');
   * // Returns: [Lambda, S3, DynamoDB, etc.]
   * ```
   */
  getComponentsByProvider(provider: CloudProvider): ComponentDefinition[] {
    return getComponentsByProvider(provider);
  }

  /**
   * Get components filtered by category
   *
   * Returns only components of a specific category (Compute, Storage, etc.).
   * Used for category-based filtering in component palette.
   *
   * @param category - Component category to filter by
   * @returns Array of components in the specified category
   * @example
   * ```ts
   * const storage = service.getComponentsByCategory('Storage');
   * // Returns: [S3, EBS, Glacier, Azure Blob, Google Cloud Storage, etc.]
   * ```
   */
  getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
    return getComponentsByCategory(category);
  }

  /**
   * Find a specific component by its unique ID
   *
   * @param id - Unique component ID (e.g., 'aws-lambda', 'azure-functions')
   * @returns Component definition if found, undefined otherwise
   * @example
   * ```ts
   * const lambda = service.findComponentById('aws-lambda');
   * // Returns: { id: 'aws-lambda', name: 'Lambda', provider: 'aws', ... }
   * ```
   */
  findComponentById(id: string): ComponentDefinition | undefined {
    return findComponentById(id);
  }

  /**
   * Search components by name or description
   *
   * Performs case-insensitive fuzzy search across component names and descriptions.
   * Used for component palette search box.
   *
   * @param query - Search string
   * @returns Array of matching components
   * @example
   * ```ts
   * const results = service.searchComponents('serverless');
   * // Returns: [Lambda, Azure Functions, Cloud Functions, etc.]
   * ```
   */
  searchComponents(query: string): ComponentDefinition[] {
    return searchComponents(query);
  }

  /**
   * Get list of unique cloud providers
   *
   * Returns all providers that have components in the library.
   * Used for populating provider filter dropdowns.
   *
   * @returns Array of unique provider names
   * @example
   * ```ts
   * const providers = service.getProviders();
   * // Returns: ['aws', 'azure', 'gcp', 'saas']
   * ```
   */
  getProviders(): CloudProvider[] {
    return [...new Set(this.componentsCache.map((c) => c.provider))];
  }

  /**
   * Get list of unique component categories
   *
   * Returns all categories that exist across all components.
   * Used for populating category filter dropdowns.
   *
   * @returns Array of unique category names
   * @example
   * ```ts
   * const categories = service.getCategories();
   * // Returns: ['Compute', 'Storage', 'Database', 'Networking', etc.]
   * ```
   */
  getCategories(): ComponentCategory[] {
    return [...new Set(this.componentsCache.map((c) => c.category))];
  }

  /**
   * Get components grouped by category
   *
   * Returns a Map with categories as keys and component arrays as values.
   * Used for rendering categorized component lists in UI.
   *
   * @returns Map of category → components
   * @example
   * ```ts
   * const grouped = service.getComponentsGroupedByCategory();
   * for (const [category, components] of grouped) {
   *   console.log(`${category}: ${components.length} components`);
   * }
   * // Output:
   * // Compute: 15 components
   * // Storage: 8 components
   * // Database: 12 components
   * ```
   */
  getComponentsGroupedByCategory(): Map<ComponentCategory, ComponentDefinition[]> {
    const grouped = new Map<ComponentCategory, ComponentDefinition[]>();

    for (const component of this.componentsCache) {
      const category = component.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(component);
    }

    return grouped;
  }

  /**
   * Get components grouped by provider
   *
   * Returns a Map with providers as keys and component arrays as values.
   * Used for rendering provider-specific component tabs in UI.
   *
   * @returns Map of provider → components
   * @example
   * ```ts
   * const grouped = service.getComponentsGroupedByProvider();
   * for (const [provider, components] of grouped) {
   *   console.log(`${provider}: ${components.length} components`);
   * }
   * // Output:
   * // aws: 45 components
   * // azure: 32 components
   * // gcp: 28 components
   * ```
   */
  getComponentsGroupedByProvider(): Map<CloudProvider, ComponentDefinition[]> {
    const grouped = new Map<CloudProvider, ComponentDefinition[]>();

    for (const component of this.componentsCache) {
      const provider = component.provider;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider)!.push(component);
    }

    return grouped;
  }
}
