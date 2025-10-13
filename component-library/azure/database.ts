/**
 * Azure Database Components
 */

import { ComponentDefinition } from '../types';

export const azureDatabaseComponents: ComponentDefinition[] = [
  {
    id: 'azure-sql-database',
    name: 'SQL Database',
    provider: 'azure',
    category: 'database',
    description: 'Managed relational database',
    icon: 'database',
    color: '#0078D4',
    tags: ['database', 'sql', 'relational', 'managed'],
    docsUrl: 'https://docs.microsoft.com/azure/azure-sql/database/',
  },
  {
    id: 'azure-cosmos-db',
    name: 'Cosmos DB',
    provider: 'azure',
    category: 'database',
    description: 'Globally distributed NoSQL database',
    icon: 'globe',
    color: '#0078D4',
    tags: ['database', 'nosql', 'distributed', 'multi-model'],
    docsUrl: 'https://docs.microsoft.com/azure/cosmos-db/',
  },
  {
    id: 'azure-mysql',
    name: 'MySQL',
    provider: 'azure',
    category: 'database',
    description: 'Managed MySQL database',
    icon: 'database',
    color: '#0078D4',
    tags: ['database', 'mysql', 'relational', 'managed'],
    docsUrl: 'https://docs.microsoft.com/azure/mysql/',
  },
  {
    id: 'azure-postgresql',
    name: 'PostgreSQL',
    provider: 'azure',
    category: 'database',
    description: 'Managed PostgreSQL database',
    icon: 'database',
    color: '#0078D4',
    tags: ['database', 'postgresql', 'relational', 'managed'],
    docsUrl: 'https://docs.microsoft.com/azure/postgresql/',
  },
  {
    id: 'azure-redis-cache',
    name: 'Redis Cache',
    provider: 'azure',
    category: 'database',
    description: 'In-memory cache',
    icon: 'zap',
    color: '#0078D4',
    tags: ['cache', 'redis', 'in-memory'],
    docsUrl: 'https://docs.microsoft.com/azure/azure-cache-for-redis/',
  },
];
