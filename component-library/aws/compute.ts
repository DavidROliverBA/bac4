/**
 * AWS Compute Components
 */

import { ComponentDefinition } from '../types';

export const awsComputeComponents: ComponentDefinition[] = [
  {
    id: 'aws-ec2',
    name: 'EC2',
    provider: 'aws',
    category: 'compute',
    description: 'Elastic Compute Cloud - Virtual servers',
    icon: 'server',
    color: '#FF9900',
    tags: ['compute', 'vm', 'instance'],
    docsUrl: 'https://docs.aws.amazon.com/ec2/',
    defaultProps: {
      instanceType: 't3.micro',
      os: 'Amazon Linux 2',
    },
  },
  {
    id: 'aws-lambda',
    name: 'Lambda',
    provider: 'aws',
    category: 'serverless',
    description: 'Serverless compute service',
    icon: 'function-square',
    color: '#FF9900',
    tags: ['serverless', 'faas', 'function'],
    docsUrl: 'https://docs.aws.amazon.com/lambda/',
    defaultProps: {
      runtime: 'nodejs20.x',
      memory: 128,
    },
  },
  {
    id: 'aws-ecs',
    name: 'ECS',
    provider: 'aws',
    category: 'container',
    description: 'Elastic Container Service',
    icon: 'box',
    color: '#FF9900',
    tags: ['container', 'docker', 'orchestration'],
    docsUrl: 'https://docs.aws.amazon.com/ecs/',
    defaultProps: {
      launchType: 'FARGATE',
    },
  },
  {
    id: 'aws-eks',
    name: 'EKS',
    provider: 'aws',
    category: 'container',
    description: 'Elastic Kubernetes Service',
    icon: 'boxes',
    color: '#FF9900',
    tags: ['kubernetes', 'k8s', 'container'],
    docsUrl: 'https://docs.aws.amazon.com/eks/',
  },
  {
    id: 'aws-fargate',
    name: 'Fargate',
    provider: 'aws',
    category: 'container',
    description: 'Serverless compute for containers',
    icon: 'container',
    color: '#FF9900',
    tags: ['serverless', 'container'],
    docsUrl: 'https://docs.aws.amazon.com/fargate/',
  },
];
