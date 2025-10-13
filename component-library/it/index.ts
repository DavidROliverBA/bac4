/**
 * Generic IT Component Library
 * Aggregates all generic IT infrastructure components
 */

import { ComponentLibrary } from '../types';
import { itDeviceComponents } from './devices';
import { itServerComponents } from './servers';
import { itPeripheralComponents } from './peripherals';
import { itNetworkingComponents } from './networking';

export const itLibrary: ComponentLibrary = {
  name: 'Generic IT',
  version: '1.0.0',
  provider: 'it',
  components: [
    ...itDeviceComponents,
    ...itServerComponents,
    ...itPeripheralComponents,
    ...itNetworkingComponents,
  ],
};

export * from './devices';
export * from './servers';
export * from './peripherals';
export * from './networking';
