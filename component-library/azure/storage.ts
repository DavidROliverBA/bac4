/**
 * Azure Storage Components
 */

import { ComponentDefinition } from '../types';

export const azureStorageComponents: ComponentDefinition[] = [
  {
    id: 'azure-blob-storage',
    name: 'Blob Storage',
    provider: 'azure',
    category: 'storage',
    description: 'Object storage for unstructured data',
    icon: 'database',
    color: '#0078D4',
    tags: ['storage', 'blob', 'object', 's3'],
    docsUrl: 'https://docs.microsoft.com/azure/storage/blobs/',
  },
  {
    id: 'azure-file-storage',
    name: 'File Storage',
    provider: 'azure',
    category: 'storage',
    description: 'Managed file shares',
    icon: 'folder',
    color: '#0078D4',
    tags: ['storage', 'files', 'smb', 'nfs'],
    docsUrl: 'https://docs.microsoft.com/azure/storage/files/',
  },
  {
    id: 'azure-disk-storage',
    name: 'Disk Storage',
    provider: 'azure',
    category: 'storage',
    description: 'Block storage for VMs',
    icon: 'hard-drive',
    color: '#0078D4',
    tags: ['storage', 'disk', 'block', 'vm'],
    docsUrl: 'https://docs.microsoft.com/azure/virtual-machines/disks-types',
  },
  {
    id: 'azure-queue-storage',
    name: 'Queue Storage',
    provider: 'azure',
    category: 'messaging',
    description: 'Message queue for async processing',
    icon: 'list',
    color: '#0078D4',
    tags: ['queue', 'messaging', 'async'],
    docsUrl: 'https://docs.microsoft.com/azure/storage/queues/',
  },
];
