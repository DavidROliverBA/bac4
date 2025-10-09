/**
 * AWS Networking Components
 */

import { ComponentDefinition } from '../types';

export const awsNetworkingComponents: ComponentDefinition[] = [
  {
    id: 'aws-vpc',
    name: 'VPC',
    provider: 'aws',
    category: 'networking',
    description: 'Virtual Private Cloud',
    icon: 'network',
    color: '#8C4FFF',
    tags: ['network', 'vpc', 'isolation'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/',
    defaultProps: {
      cidr: '10.0.0.0/16',
    },
  },
  {
    id: 'aws-alb',
    name: 'ALB',
    provider: 'aws',
    category: 'networking',
    description: 'Application Load Balancer',
    icon: 'git-fork',
    color: '#8C4FFF',
    tags: ['load-balancer', 'http', 'https'],
    docsUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/',
  },
  {
    id: 'aws-nlb',
    name: 'NLB',
    provider: 'aws',
    category: 'networking',
    description: 'Network Load Balancer',
    icon: 'git-fork',
    color: '#8C4FFF',
    tags: ['load-balancer', 'tcp', 'udp'],
    docsUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/',
  },
  {
    id: 'aws-cloudfront',
    name: 'CloudFront',
    provider: 'aws',
    category: 'cdn',
    description: 'Content Delivery Network',
    icon: 'globe',
    color: '#8C4FFF',
    tags: ['cdn', 'cache', 'distribution'],
    docsUrl: 'https://docs.aws.amazon.com/cloudfront/',
  },
  {
    id: 'aws-route53',
    name: 'Route 53',
    provider: 'aws',
    category: 'networking',
    description: 'DNS web service',
    icon: 'map-pin',
    color: '#8C4FFF',
    tags: ['dns', 'routing'],
    docsUrl: 'https://docs.aws.amazon.com/route53/',
  },
  {
    id: 'aws-api-gateway',
    name: 'API Gateway',
    provider: 'aws',
    category: 'networking',
    description: 'API management service',
    icon: 'share-2',
    color: '#8C4FFF',
    tags: ['api', 'rest', 'websocket'],
    docsUrl: 'https://docs.aws.amazon.com/apigateway/',
  },
];
