/**
 * GCP Compute Components
 */

import { ComponentDefinition } from '../types';

export const gcpComputeComponents: ComponentDefinition[] = [
  {
    id: 'gcp-compute-engine',
    name: 'Compute Engine',
    provider: 'gcp',
    category: 'compute',
    description: 'Virtual machines on Google Cloud',
    icon: 'server',
    color: '#4285F4',
    tags: ['compute', 'vm', 'instance', 'iaas'],
    docsUrl: 'https://cloud.google.com/compute/docs',
  },
  {
    id: 'gcp-cloud-functions',
    name: 'Cloud Functions',
    provider: 'gcp',
    category: 'serverless',
    description: 'Event-driven serverless functions',
    icon: 'function-square',
    color: '#4285F4',
    tags: ['serverless', 'faas', 'functions', 'event-driven'],
    docsUrl: 'https://cloud.google.com/functions/docs',
  },
  {
    id: 'gcp-app-engine',
    name: 'App Engine',
    provider: 'gcp',
    category: 'compute',
    description: 'PaaS for web apps',
    icon: 'globe',
    color: '#4285F4',
    tags: ['paas', 'web', 'hosting'],
    docsUrl: 'https://cloud.google.com/appengine/docs',
  },
  {
    id: 'gcp-gke',
    name: 'GKE',
    provider: 'gcp',
    category: 'container',
    description: 'Google Kubernetes Engine',
    icon: 'boxes',
    color: '#4285F4',
    tags: ['kubernetes', 'k8s', 'container', 'orchestration'],
    docsUrl: 'https://cloud.google.com/kubernetes-engine/docs',
  },
  {
    id: 'gcp-cloud-run',
    name: 'Cloud Run',
    provider: 'gcp',
    category: 'serverless',
    description: 'Serverless containers',
    icon: 'box',
    color: '#4285F4',
    tags: ['serverless', 'container', 'docker'],
    docsUrl: 'https://cloud.google.com/run/docs',
  },
];
