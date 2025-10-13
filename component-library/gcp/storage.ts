/**
 * GCP Storage Components
 */

import { ComponentDefinition } from '../types';

export const gcpStorageComponents: ComponentDefinition[] = [
  {
    id: 'gcp-cloud-storage',
    name: 'Cloud Storage',
    provider: 'gcp',
    category: 'storage',
    description: 'Object storage for unstructured data',
    icon: 'database',
    color: '#4285F4',
    tags: ['storage', 'object', 'bucket', 's3'],
    docsUrl: 'https://cloud.google.com/storage/docs',
  },
  {
    id: 'gcp-filestore',
    name: 'Filestore',
    provider: 'gcp',
    category: 'storage',
    description: 'Managed file storage',
    icon: 'folder',
    color: '#4285F4',
    tags: ['storage', 'files', 'nfs'],
    docsUrl: 'https://cloud.google.com/filestore/docs',
  },
  {
    id: 'gcp-persistent-disk',
    name: 'Persistent Disk',
    provider: 'gcp',
    category: 'storage',
    description: 'Block storage for VMs',
    icon: 'hard-drive',
    color: '#4285F4',
    tags: ['storage', 'disk', 'block', 'vm'],
    docsUrl: 'https://cloud.google.com/persistent-disk',
  },
];
