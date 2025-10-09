/**
 * AWS Component Library
 * Aggregates all AWS component definitions
 */

import { ComponentLibrary } from '../types';
import { awsComputeComponents } from './compute';
import { awsStorageComponents } from './storage';
import { awsDatabaseComponents } from './database';
import { awsNetworkingComponents } from './networking';

export const awsLibrary: ComponentLibrary = {
  name: 'AWS Components',
  version: '1.0.0',
  provider: 'aws',
  components: [
    ...awsComputeComponents,
    ...awsStorageComponents,
    ...awsDatabaseComponents,
    ...awsNetworkingComponents,
  ],
};

export * from './compute';
export * from './storage';
export * from './database';
export * from './networking';
