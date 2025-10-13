/**
 * Generic IT Device Components
 * Computers, laptops, displays, and end-user devices
 */

import { ComponentDefinition } from '../types';

export const itDeviceComponents: ComponentDefinition[] = [
  {
    id: 'it-laptop',
    name: 'Laptop',
    provider: 'it',
    category: 'compute',
    description: 'Portable computer',
    icon: 'laptop',
    color: '#6B7280',
    tags: ['device', 'computer', 'laptop', 'portable'],
  },
  {
    id: 'it-desktop',
    name: 'Desktop PC',
    provider: 'it',
    category: 'compute',
    description: 'Desktop computer',
    icon: 'monitor',
    color: '#6B7280',
    tags: ['device', 'computer', 'desktop', 'workstation'],
  },
  {
    id: 'it-workstation',
    name: 'Workstation',
    provider: 'it',
    category: 'compute',
    description: 'High-performance computer',
    icon: 'cpu',
    color: '#6B7280',
    tags: ['device', 'computer', 'workstation', 'high-performance'],
  },
  {
    id: 'it-display',
    name: 'Display/Monitor',
    provider: 'it',
    category: 'other',
    description: 'Computer monitor or display',
    icon: 'tv',
    color: '#6B7280',
    tags: ['device', 'display', 'monitor', 'screen'],
  },
  {
    id: 'it-mobile-device',
    name: 'Mobile Device',
    provider: 'it',
    category: 'compute',
    description: 'Smartphone or tablet',
    icon: 'smartphone',
    color: '#6B7280',
    tags: ['device', 'mobile', 'smartphone', 'tablet'],
  },
];
