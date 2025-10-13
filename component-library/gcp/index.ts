/**
 * GCP Component Library
 * Aggregates all Google Cloud Platform component definitions
 */

import { ComponentLibrary } from '../types';
import { gcpComputeComponents } from './compute';
import { gcpStorageComponents } from './storage';
import { gcpDatabaseComponents } from './database';
import { gcpNetworkingComponents } from './networking';

export const gcpLibrary: ComponentLibrary = {
  name: 'GCP Services',
  version: '1.0.0',
  provider: 'gcp',
  components: [
    ...gcpComputeComponents,
    ...gcpStorageComponents,
    ...gcpDatabaseComponents,
    ...gcpNetworkingComponents,
  ],
};

export * from './compute';
export * from './storage';
export * from './database';
export * from './networking';
