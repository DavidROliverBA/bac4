/**
 * Azure Networking Components
 */

import { ComponentDefinition } from '../types';

export const azureNetworkingComponents: ComponentDefinition[] = [
  {
    id: 'azure-virtual-network',
    name: 'Virtual Network',
    provider: 'azure',
    category: 'networking',
    description: 'Private network in Azure',
    icon: 'network',
    color: '#0078D4',
    tags: ['networking', 'vpc', 'vnet', 'network'],
    docsUrl: 'https://docs.microsoft.com/azure/virtual-network/',
  },
  {
    id: 'azure-load-balancer',
    name: 'Load Balancer',
    provider: 'azure',
    category: 'networking',
    description: 'Layer 4 load balancer',
    icon: 'scale',
    color: '#0078D4',
    tags: ['networking', 'load-balancer', 'traffic'],
    docsUrl: 'https://docs.microsoft.com/azure/load-balancer/',
  },
  {
    id: 'azure-application-gateway',
    name: 'Application Gateway',
    provider: 'azure',
    category: 'networking',
    description: 'Layer 7 load balancer',
    icon: 'shield',
    color: '#0078D4',
    tags: ['networking', 'load-balancer', 'waf', 'gateway'],
    docsUrl: 'https://docs.microsoft.com/azure/application-gateway/',
  },
  {
    id: 'azure-cdn',
    name: 'CDN',
    provider: 'azure',
    category: 'cdn',
    description: 'Content delivery network',
    icon: 'globe',
    color: '#0078D4',
    tags: ['cdn', 'content', 'delivery', 'cache'],
    docsUrl: 'https://docs.microsoft.com/azure/cdn/',
  },
  {
    id: 'azure-traffic-manager',
    name: 'Traffic Manager',
    provider: 'azure',
    category: 'networking',
    description: 'DNS-based traffic routing',
    icon: 'signpost',
    color: '#0078D4',
    tags: ['networking', 'traffic', 'dns', 'routing'],
    docsUrl: 'https://docs.microsoft.com/azure/traffic-manager/',
  },
];
