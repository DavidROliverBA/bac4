/**
 * AWS Database Components
 */

import { ComponentDefinition } from '../types';

export const awsDatabaseComponents: ComponentDefinition[] = [
  {
    id: 'aws-rds',
    name: 'RDS',
    provider: 'aws',
    category: 'database',
    description: 'Relational Database Service',
    icon: 'database',
    color: '#3B48CC',
    tags: ['database', 'relational', 'sql'],
    docsUrl: 'https://docs.aws.amazon.com/rds/',
    defaultProps: {
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
    },
  },
  {
    id: 'aws-dynamodb',
    name: 'DynamoDB',
    provider: 'aws',
    category: 'database',
    description: 'NoSQL database service',
    icon: 'table',
    color: '#3B48CC',
    tags: ['database', 'nosql', 'key-value'],
    docsUrl: 'https://docs.aws.amazon.com/dynamodb/',
    defaultProps: {
      billingMode: 'PAY_PER_REQUEST',
    },
  },
  {
    id: 'aws-elasticache',
    name: 'ElastiCache',
    provider: 'aws',
    category: 'database',
    description: 'In-memory caching service',
    icon: 'zap',
    color: '#3B48CC',
    tags: ['cache', 'redis', 'memcached'],
    docsUrl: 'https://docs.aws.amazon.com/elasticache/',
    defaultProps: {
      engine: 'redis',
      nodeType: 'cache.t3.micro',
    },
  },
  {
    id: 'aws-redshift',
    name: 'Redshift',
    provider: 'aws',
    category: 'database',
    description: 'Data warehouse service',
    icon: 'bar-chart',
    color: '#3B48CC',
    tags: ['database', 'warehouse', 'analytics'],
    docsUrl: 'https://docs.aws.amazon.com/redshift/',
  },
  {
    id: 'aws-aurora',
    name: 'Aurora',
    provider: 'aws',
    category: 'database',
    description: 'MySQL and PostgreSQL compatible relational database',
    icon: 'database',
    color: '#3B48CC',
    tags: ['database', 'relational', 'mysql', 'postgres'],
    docsUrl: 'https://docs.aws.amazon.com/aurora/',
    defaultProps: {
      engine: 'aurora-postgresql',
    },
  },
];
