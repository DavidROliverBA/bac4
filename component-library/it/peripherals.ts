/**
 * Generic IT Peripheral Components
 * Printers, scanners, and other peripherals
 */

import { ComponentDefinition } from '../types';

export const itPeripheralComponents: ComponentDefinition[] = [
  {
    id: 'it-printer',
    name: 'Printer',
    provider: 'it',
    category: 'other',
    description: 'Network or local printer',
    icon: 'printer',
    color: '#6B7280',
    tags: ['device', 'printer', 'peripheral', 'output'],
  },
  {
    id: 'it-scanner',
    name: 'Scanner',
    provider: 'it',
    category: 'other',
    description: 'Document scanner',
    icon: 'scan',
    color: '#6B7280',
    tags: ['device', 'scanner', 'peripheral', 'input'],
  },
  {
    id: 'it-multifunction',
    name: 'Multifunction Device',
    provider: 'it',
    category: 'other',
    description: 'Printer/scanner/copier combo',
    icon: 'printer',
    color: '#6B7280',
    tags: ['device', 'printer', 'scanner', 'copier', 'mfp'],
  },
];
