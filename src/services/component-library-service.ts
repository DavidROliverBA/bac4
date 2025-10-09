/**
 * Component Library Service
 * Manages loading and accessing cloud component definitions
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
   */
  async initialize(): Promise<void> {
    this.libraries = componentLibraries;
    this.componentsCache = getAllComponents();
  }

  /**
   * Get all available libraries
   */
  getLibraries(): ComponentLibrary[] {
    return this.libraries;
  }

  /**
   * Get all components
   */
  getAllComponents(): ComponentDefinition[] {
    return this.componentsCache;
  }

  /**
   * Get components by provider
   */
  getComponentsByProvider(provider: CloudProvider): ComponentDefinition[] {
    return getComponentsByProvider(provider);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
    return getComponentsByCategory(category);
  }

  /**
   * Find component by ID
   */
  findComponentById(id: string): ComponentDefinition | undefined {
    return findComponentById(id);
  }

  /**
   * Search components
   */
  searchComponents(query: string): ComponentDefinition[] {
    return searchComponents(query);
  }

  /**
   * Get unique providers
   */
  getProviders(): CloudProvider[] {
    return [...new Set(this.componentsCache.map((c) => c.provider))];
  }

  /**
   * Get unique categories
   */
  getCategories(): ComponentCategory[] {
    return [...new Set(this.componentsCache.map((c) => c.category))];
  }

  /**
   * Get components grouped by category
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
