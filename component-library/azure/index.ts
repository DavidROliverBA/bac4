/**
 * Azure Component Library
 * Aggregates all Azure component definitions
 */

import { ComponentLibrary } from '../types';
import { azureComputeComponents } from './compute';
import { azureStorageComponents } from './storage';
import { azureDatabaseComponents } from './database';
import { azureNetworkingComponents } from './networking';

export const azureLibrary: ComponentLibrary = {
  name: 'Azure Services',
  version: '1.0.0',
  provider: 'azure',
  components: [
    ...azureComputeComponents,
    ...azureStorageComponents,
    ...azureDatabaseComponents,
    ...azureNetworkingComponents,
  ],
};

export * from './compute';
export * from './storage';
export * from './database';
export * from './networking';
