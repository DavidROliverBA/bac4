/**
 * Generic IT Server Components
 * Physical servers, racks, and on-premises infrastructure
 */

import { ComponentDefinition } from '../types';

export const itServerComponents: ComponentDefinition[] = [
  {
    id: 'it-server',
    name: 'Physical Server',
    provider: 'it',
    category: 'compute',
    description: 'On-premises server',
    icon: 'server',
    color: '#6B7280',
    tags: ['server', 'on-prem', 'hardware', 'physical'],
  },
  {
    id: 'it-rack-server',
    name: 'Rack Server',
    provider: 'it',
    category: 'compute',
    description: 'Rack-mounted server',
    icon: 'layers',
    color: '#6B7280',
    tags: ['server', 'rack', 'datacenter', 'on-prem'],
  },
  {
    id: 'it-blade-server',
    name: 'Blade Server',
    provider: 'it',
    category: 'compute',
    description: 'Blade server chassis',
    icon: 'box',
    color: '#6B7280',
    tags: ['server', 'blade', 'datacenter', 'dense'],
  },
  {
    id: 'it-nas',
    name: 'NAS',
    provider: 'it',
    category: 'storage',
    description: 'Network-attached storage',
    icon: 'hard-drive',
    color: '#6B7280',
    tags: ['storage', 'nas', 'network', 'file-server'],
  },
  {
    id: 'it-san',
    name: 'SAN',
    provider: 'it',
    category: 'storage',
    description: 'Storage area network',
    icon: 'database',
    color: '#6B7280',
    tags: ['storage', 'san', 'network', 'block-storage'],
  },
];
