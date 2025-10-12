/**
 * Component Library Index
 * Central export point for all component libraries
 */

export * from './types';
export * from './aws';

import { ComponentLibrary } from './types';
import { awsLibrary } from './aws';

// <AI_MODIFIABLE>
/**
 * All available component libraries
 * Add new cloud providers here following the pattern:
 * 1. Import library: import { azureLibrary } from './azure';
 * 2. Add to array: [awsLibrary, azureLibrary]
 */
export const componentLibraries: ComponentLibrary[] = [awsLibrary];
// </AI_MODIFIABLE>

/**
 * Get all components from all libraries
 */
export function getAllComponents() {
  return componentLibraries.flatMap((lib) => lib.components);
}

/**
 * Get components by provider
 */
export function getComponentsByProvider(provider: string) {
  return componentLibraries
    .filter((lib) => lib.provider === provider)
    .flatMap((lib) => lib.components);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string) {
  return getAllComponents().filter((comp) => comp.category === category);
}

/**
 * Find component by ID
 */
export function findComponentById(id: string) {
  return getAllComponents().find((comp) => comp.id === id);
}

/**
 * Search components by query
 */
export function searchComponents(query: string) {
  const lowerQuery = query.toLowerCase();
  return getAllComponents().filter(
    (comp) =>
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.description.toLowerCase().includes(lowerQuery) ||
      comp.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
