/**
 * GCP Database Components
 */

import { ComponentDefinition } from '../types';

export const gcpDatabaseComponents: ComponentDefinition[] = [
  {
    id: 'gcp-cloud-sql',
    name: 'Cloud SQL',
    provider: 'gcp',
    category: 'database',
    description: 'Managed relational database',
    icon: 'database',
    color: '#4285F4',
    tags: ['database', 'sql', 'relational', 'managed', 'mysql', 'postgresql'],
    docsUrl: 'https://cloud.google.com/sql/docs',
  },
  {
    id: 'gcp-firestore',
    name: 'Firestore',
    provider: 'gcp',
    category: 'database',
    description: 'NoSQL document database',
    icon: 'file-text',
    color: '#4285F4',
    tags: ['database', 'nosql', 'document', 'firebase'],
    docsUrl: 'https://cloud.google.com/firestore/docs',
  },
  {
    id: 'gcp-bigtable',
    name: 'Bigtable',
    provider: 'gcp',
    category: 'database',
    description: 'NoSQL wide-column database',
    icon: 'table',
    color: '#4285F4',
    tags: ['database', 'nosql', 'bigtable', 'analytics'],
    docsUrl: 'https://cloud.google.com/bigtable/docs',
  },
  {
    id: 'gcp-spanner',
    name: 'Cloud Spanner',
    provider: 'gcp',
    category: 'database',
    description: 'Globally distributed relational database',
    icon: 'globe',
    color: '#4285F4',
    tags: ['database', 'sql', 'distributed', 'global'],
    docsUrl: 'https://cloud.google.com/spanner/docs',
  },
  {
    id: 'gcp-memorystore',
    name: 'Memorystore',
    provider: 'gcp',
    category: 'database',
    description: 'Managed Redis and Memcached',
    icon: 'zap',
    color: '#4285F4',
    tags: ['cache', 'redis', 'memcached', 'in-memory'],
    docsUrl: 'https://cloud.google.com/memorystore/docs',
  },
];
