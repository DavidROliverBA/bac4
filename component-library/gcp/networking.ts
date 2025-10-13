/**
 * GCP Networking Components
 */

import { ComponentDefinition } from '../types';

export const gcpNetworkingComponents: ComponentDefinition[] = [
  {
    id: 'gcp-vpc',
    name: 'VPC Network',
    provider: 'gcp',
    category: 'networking',
    description: 'Virtual private cloud network',
    icon: 'network',
    color: '#4285F4',
    tags: ['networking', 'vpc', 'network', 'private'],
    docsUrl: 'https://cloud.google.com/vpc/docs',
  },
  {
    id: 'gcp-load-balancing',
    name: 'Cloud Load Balancing',
    provider: 'gcp',
    category: 'networking',
    description: 'Global load balancing',
    icon: 'scale',
    color: '#4285F4',
    tags: ['networking', 'load-balancer', 'traffic', 'global'],
    docsUrl: 'https://cloud.google.com/load-balancing/docs',
  },
  {
    id: 'gcp-cloud-cdn',
    name: 'Cloud CDN',
    provider: 'gcp',
    category: 'cdn',
    description: 'Content delivery network',
    icon: 'globe',
    color: '#4285F4',
    tags: ['cdn', 'content', 'delivery', 'cache'],
    docsUrl: 'https://cloud.google.com/cdn/docs',
  },
  {
    id: 'gcp-cloud-dns',
    name: 'Cloud DNS',
    provider: 'gcp',
    category: 'networking',
    description: 'Managed DNS service',
    icon: 'signpost',
    color: '#4285F4',
    tags: ['networking', 'dns', 'domain'],
    docsUrl: 'https://cloud.google.com/dns/docs',
  },
  {
    id: 'gcp-cloud-armor',
    name: 'Cloud Armor',
    provider: 'gcp',
    category: 'security',
    description: 'DDoS protection and WAF',
    icon: 'shield',
    color: '#4285F4',
    tags: ['security', 'waf', 'ddos', 'protection'],
    docsUrl: 'https://cloud.google.com/armor/docs',
  },
];
