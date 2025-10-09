/**
 * AWS Storage Components
 */

import { ComponentDefinition } from '../types';

export const awsStorageComponents: ComponentDefinition[] = [
  {
    id: 'aws-s3',
    name: 'S3',
    provider: 'aws',
    category: 'storage',
    description: 'Simple Storage Service - Object storage',
    icon: 'database',
    color: '#569A31',
    tags: ['storage', 'object', 'bucket'],
    docsUrl: 'https://docs.aws.amazon.com/s3/',
    defaultProps: {
      storageClass: 'STANDARD',
      versioning: false,
    },
  },
  {
    id: 'aws-ebs',
    name: 'EBS',
    provider: 'aws',
    category: 'storage',
    description: 'Elastic Block Store - Block storage volumes',
    icon: 'hard-drive',
    color: '#569A31',
    tags: ['storage', 'block', 'volume'],
    docsUrl: 'https://docs.aws.amazon.com/ebs/',
    defaultProps: {
      volumeType: 'gp3',
      size: 100,
    },
  },
  {
    id: 'aws-efs',
    name: 'EFS',
    provider: 'aws',
    category: 'storage',
    description: 'Elastic File System - Managed file storage',
    icon: 'folder',
    color: '#569A31',
    tags: ['storage', 'file', 'nfs'],
    docsUrl: 'https://docs.aws.amazon.com/efs/',
  },
  {
    id: 'aws-glacier',
    name: 'Glacier',
    provider: 'aws',
    category: 'storage',
    description: 'Long-term archive storage',
    icon: 'archive',
    color: '#569A31',
    tags: ['storage', 'archive', 'backup'],
    docsUrl: 'https://docs.aws.amazon.com/glacier/',
  },
];
