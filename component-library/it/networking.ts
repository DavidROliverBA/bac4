/**
 * Generic IT Networking Components
 * Routers, switches, firewalls, and network equipment
 */

import { ComponentDefinition } from '../types';

export const itNetworkingComponents: ComponentDefinition[] = [
  {
    id: 'it-router',
    name: 'Router',
    provider: 'it',
    category: 'networking',
    description: 'Network router',
    icon: 'radio',
    color: '#6B7280',
    tags: ['networking', 'router', 'gateway'],
  },
  {
    id: 'it-switch',
    name: 'Network Switch',
    provider: 'it',
    category: 'networking',
    description: 'Ethernet switch',
    icon: 'network',
    color: '#6B7280',
    tags: ['networking', 'switch', 'ethernet'],
  },
  {
    id: 'it-firewall',
    name: 'Firewall',
    provider: 'it',
    category: 'security',
    description: 'Network firewall',
    icon: 'shield',
    color: '#6B7280',
    tags: ['networking', 'firewall', 'security'],
  },
  {
    id: 'it-access-point',
    name: 'Wireless Access Point',
    provider: 'it',
    category: 'networking',
    description: 'WiFi access point',
    icon: 'wifi',
    color: '#6B7280',
    tags: ['networking', 'wifi', 'wireless', 'access-point'],
  },
  {
    id: 'it-load-balancer',
    name: 'Load Balancer',
    provider: 'it',
    category: 'networking',
    description: 'Hardware load balancer',
    icon: 'scale',
    color: '#6B7280',
    tags: ['networking', 'load-balancer', 'traffic'],
  },
];
