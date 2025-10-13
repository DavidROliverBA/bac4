/**
 * Azure Compute Components
 */

import { ComponentDefinition } from '../types';

export const azureComputeComponents: ComponentDefinition[] = [
  {
    id: 'azure-vm',
    name: 'Virtual Machines',
    provider: 'azure',
    category: 'compute',
    description: 'IaaS virtual machines in Azure',
    icon: 'server',
    color: '#0078D4',
    tags: ['compute', 'vm', 'iaas', 'virtual-machine'],
    docsUrl: 'https://docs.microsoft.com/azure/virtual-machines/',
  },
  {
    id: 'azure-functions',
    name: 'Azure Functions',
    provider: 'azure',
    category: 'serverless',
    description: 'Event-driven serverless compute',
    icon: 'function-square',
    color: '#0078D4',
    tags: ['serverless', 'faas', 'functions', 'event-driven'],
    docsUrl: 'https://docs.microsoft.com/azure/azure-functions/',
  },
  {
    id: 'azure-app-service',
    name: 'App Service',
    provider: 'azure',
    category: 'compute',
    description: 'PaaS for web apps and APIs',
    icon: 'globe',
    color: '#0078D4',
    tags: ['paas', 'web', 'api', 'hosting'],
    docsUrl: 'https://docs.microsoft.com/azure/app-service/',
  },
  {
    id: 'azure-aks',
    name: 'AKS',
    provider: 'azure',
    category: 'container',
    description: 'Azure Kubernetes Service',
    icon: 'boxes',
    color: '#0078D4',
    tags: ['kubernetes', 'k8s', 'container', 'orchestration'],
    docsUrl: 'https://docs.microsoft.com/azure/aks/',
  },
  {
    id: 'azure-container-instances',
    name: 'Container Instances',
    provider: 'azure',
    category: 'container',
    description: 'Serverless containers',
    icon: 'box',
    color: '#0078D4',
    tags: ['container', 'serverless', 'docker'],
    docsUrl: 'https://docs.microsoft.com/azure/container-instances/',
  },
];
