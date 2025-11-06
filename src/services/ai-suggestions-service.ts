/**
 * AI Suggestions Service
 *
 * Provides AI-powered suggestions for diagram improvements, missing components,
 * relationships, and architectural patterns.
 *
 * @version 2.4.0
 */

import type { Node, Edge } from 'reactflow';
import type { CanvasNodeData, DiagramType } from '../types/canvas-types';
import type BAC4Plugin from '../main';

export interface DiagramSuggestion {
  id: string;
  type: 'node' | 'edge' | 'pattern' | 'refactoring' | 'best-practice';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  autoApplicable: boolean;
  confidence: number; // 0-100
}

export interface NodeSuggestion extends DiagramSuggestion {
  type: 'node';
  suggestedNode: {
    nodeType: string;
    label: string;
    description: string;
    position?: { x: number; y: number };
    layer?: DiagramType;
  };
  relatedNodes: string[];
}

export interface EdgeSuggestion extends DiagramSuggestion {
  type: 'edge';
  suggestedEdge: {
    source: string;
    target: string;
    label?: string;
    direction?: 'right' | 'left' | 'both';
    description: string;
  };
}

export interface PatternSuggestion extends DiagramSuggestion {
  type: 'pattern';
  patternName: string;
  components: Array<{
    nodeType: string;
    label: string;
    description: string;
    role: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    label: string;
  }>;
}

export interface RefactoringSuggestion extends DiagramSuggestion {
  type: 'refactoring';
  affectedNodes: string[];
  affectedEdges: string[];
  steps: string[];
  expectedOutcome: string;
}

export interface BestPracticeSuggestion extends DiagramSuggestion {
  type: 'best-practice';
  category: 'naming' | 'documentation' | 'structure' | 'separation';
  affectedNodes: string[];
  improvementSteps: string[];
}

export interface SuggestionsReport {
  diagramPath: string;
  diagramType: DiagramType;
  timestamp: string;
  suggestions: DiagramSuggestion[];
  summary: {
    total: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    autoApplicable: number;
  };
}

export class AISuggestionsService {
  private plugin: BAC4Plugin;

  constructor(plugin: BAC4Plugin) {
    this.plugin = plugin;
  }

  /**
   * Generate comprehensive suggestions for a diagram
   */
  async generateSuggestions(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType,
    diagramPath: string
  ): Promise<SuggestionsReport> {
    const suggestions: DiagramSuggestion[] = [];

    // Generate different types of suggestions
    suggestions.push(...this.suggestMissingComponents(nodes, edges, diagramType));
    suggestions.push(...this.suggestMissingRelationships(nodes, edges, diagramType));
    suggestions.push(...this.suggestArchitecturalPatterns(nodes, edges, diagramType));
    suggestions.push(...this.suggestRefactorings(nodes, edges, diagramType));
    suggestions.push(...this.suggestBestPractices(nodes, edges, diagramType));

    // Sort by priority and confidence
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    const summary = {
      total: suggestions.length,
      highPriority: suggestions.filter((s) => s.priority === 'high').length,
      mediumPriority: suggestions.filter((s) => s.priority === 'medium').length,
      lowPriority: suggestions.filter((s) => s.priority === 'low').length,
      autoApplicable: suggestions.filter((s) => s.autoApplicable).length,
    };

    return {
      diagramPath,
      diagramType,
      timestamp: new Date().toISOString(),
      suggestions,
      summary,
    };
  }

  /**
   * Suggest missing components based on diagram type and existing components
   */
  private suggestMissingComponents(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): NodeSuggestion[] {
    const suggestions: NodeSuggestion[] = [];

    // Context diagram suggestions
    if (diagramType === 'context') {
      suggestions.push(...this.suggestContextComponents(nodes, edges));
    }

    // Container diagram suggestions
    if (diagramType === 'container') {
      suggestions.push(...this.suggestContainerComponents(nodes, edges));
    }

    // Component diagram suggestions
    if (diagramType === 'component') {
      suggestions.push(...this.suggestComponentComponents(nodes, edges));
    }

    // Capability diagram suggestions
    if (diagramType === 'capability') {
      suggestions.push(...this.suggestCapabilityComponents(nodes, edges));
    }

    return suggestions;
  }

  /**
   * Suggest context-level components
   */
  private suggestContextComponents(nodes: Node<CanvasNodeData>[], edges: Edge[]): NodeSuggestion[] {
    const suggestions: NodeSuggestion[] = [];

    // Check for missing typical context components
    const hasDatabase = nodes.some((n) => n.data.label.toLowerCase().includes('database'));
    const hasAuth = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('auth') ||
        n.data.label.toLowerCase().includes('identity')
    );
    const hasAPI = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('api') || n.data.label.toLowerCase().includes('gateway')
    );
    const hasMonitoring = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('monitor') ||
        n.data.label.toLowerCase().includes('logging') ||
        n.data.label.toLowerCase().includes('observability')
    );

    if (!hasDatabase && nodes.length > 2) {
      suggestions.push({
        id: 'suggest-database',
        type: 'node',
        priority: 'medium',
        title: 'Consider Adding Data Storage',
        description: 'Most systems require persistent data storage.',
        rationale: 'Your context diagram appears to lack a data storage component.',
        autoApplicable: false,
        confidence: 70,
        suggestedNode: {
          nodeType: 'system',
          label: 'Database',
          description: 'Persistent data storage for the system',
          layer: 'context',
        },
        relatedNodes: [],
      });
    }

    if (!hasAuth && nodes.length > 3) {
      suggestions.push({
        id: 'suggest-auth',
        type: 'node',
        priority: 'high',
        title: 'Consider Adding Authentication/Authorization',
        description: 'Security is critical for most enterprise systems.',
        rationale: 'No authentication or identity management component detected.',
        autoApplicable: false,
        confidence: 80,
        suggestedNode: {
          nodeType: 'system',
          label: 'Identity Provider',
          description: 'Handles user authentication and authorization',
          layer: 'context',
        },
        relatedNodes: [],
      });
    }

    if (!hasAPI && nodes.length > 3) {
      suggestions.push({
        id: 'suggest-api-gateway',
        type: 'node',
        priority: 'medium',
        title: 'Consider Adding API Gateway',
        description: 'API Gateway provides centralized entry point and cross-cutting concerns.',
        rationale: 'Multiple systems detected without a central API gateway.',
        autoApplicable: false,
        confidence: 65,
        suggestedNode: {
          nodeType: 'system',
          label: 'API Gateway',
          description: 'Central entry point for all API requests',
          layer: 'context',
        },
        relatedNodes: [],
      });
    }

    if (!hasMonitoring && nodes.length > 4) {
      suggestions.push({
        id: 'suggest-monitoring',
        type: 'node',
        priority: 'medium',
        title: 'Add Monitoring and Observability',
        description: 'Monitoring is essential for production systems.',
        rationale: 'No monitoring, logging, or observability component found.',
        autoApplicable: false,
        confidence: 75,
        suggestedNode: {
          nodeType: 'system',
          label: 'Monitoring & Logging',
          description: 'Centralized monitoring, logging, and alerting',
          layer: 'context',
        },
        relatedNodes: [],
      });
    }

    return suggestions;
  }

  /**
   * Suggest container-level components
   */
  private suggestContainerComponents(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): NodeSuggestion[] {
    const suggestions: NodeSuggestion[] = [];

    const hasWebApp = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('web') ||
        n.data.label.toLowerCase().includes('frontend') ||
        n.data.label.toLowerCase().includes('ui')
    );

    const hasAPI = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('api') || n.data.label.toLowerCase().includes('service')
    );

    const hasCache = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('cache') || n.data.label.toLowerCase().includes('redis')
    );

    const hasQueue = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('queue') ||
        n.data.label.toLowerCase().includes('message')
    );

    if (!hasWebApp && nodes.length > 0) {
      suggestions.push({
        id: 'suggest-web-app',
        type: 'node',
        priority: 'medium',
        title: 'Add Web Application',
        description: 'Most systems have a user-facing web interface.',
        rationale: 'No web application or frontend component detected.',
        autoApplicable: false,
        confidence: 60,
        suggestedNode: {
          nodeType: 'container',
          label: 'Web Application',
          description: 'User-facing web interface',
          layer: 'container',
        },
        relatedNodes: [],
      });
    }

    if (!hasAPI && nodes.length > 0) {
      suggestions.push({
        id: 'suggest-api',
        type: 'node',
        priority: 'high',
        title: 'Add API/Backend Service',
        description: 'Backend API service to handle business logic.',
        rationale: 'No API or backend service component found.',
        autoApplicable: false,
        confidence: 75,
        suggestedNode: {
          nodeType: 'container',
          label: 'API Service',
          description: 'Backend API handling business logic',
          layer: 'container',
        },
        relatedNodes: [],
      });
    }

    if (!hasCache && edges.length > 10) {
      suggestions.push({
        id: 'suggest-cache',
        type: 'node',
        priority: 'low',
        title: 'Consider Adding Cache Layer',
        description: 'Caching can significantly improve performance.',
        rationale: 'Complex system detected without caching layer.',
        autoApplicable: false,
        confidence: 55,
        suggestedNode: {
          nodeType: 'container',
          label: 'Cache',
          description: 'Distributed cache for performance optimization',
          layer: 'container',
        },
        relatedNodes: [],
      });
    }

    if (!hasQueue && nodes.length > 5) {
      suggestions.push({
        id: 'suggest-queue',
        type: 'node',
        priority: 'medium',
        title: 'Consider Message Queue',
        description: 'Message queues enable asynchronous processing and decoupling.',
        rationale: 'Large system that could benefit from asynchronous communication.',
        autoApplicable: false,
        confidence: 65,
        suggestedNode: {
          nodeType: 'container',
          label: 'Message Queue',
          description: 'Asynchronous message processing',
          layer: 'container',
        },
        relatedNodes: [],
      });
    }

    return suggestions;
  }

  /**
   * Suggest component-level components
   */
  private suggestComponentComponents(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): NodeSuggestion[] {
    const suggestions: NodeSuggestion[] = [];

    const hasController = nodes.some((n) => n.data.label.toLowerCase().includes('controller'));
    const hasService = nodes.some((n) => n.data.label.toLowerCase().includes('service'));
    const hasRepository = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('repository') ||
        n.data.label.toLowerCase().includes('dao')
    );
    const hasValidator = nodes.some((n) => n.data.label.toLowerCase().includes('validat'));

    if (!hasController && nodes.length > 0) {
      suggestions.push({
        id: 'suggest-controller',
        type: 'node',
        priority: 'medium',
        title: 'Add Controller/Handler',
        description: 'Controllers handle incoming requests and orchestrate responses.',
        rationale: 'No controller or request handler component found.',
        autoApplicable: false,
        confidence: 70,
        suggestedNode: {
          nodeType: 'component',
          label: 'Controller',
          description: 'Handles HTTP requests and responses',
          layer: 'component',
        },
        relatedNodes: [],
      });
    }

    if (!hasService && nodes.length > 1) {
      suggestions.push({
        id: 'suggest-service',
        type: 'node',
        priority: 'high',
        title: 'Add Service Layer',
        description: 'Service layer encapsulates business logic.',
        rationale: 'No service layer component detected.',
        autoApplicable: false,
        confidence: 80,
        suggestedNode: {
          nodeType: 'component',
          label: 'Service',
          description: 'Business logic and orchestration',
          layer: 'component',
        },
        relatedNodes: [],
      });
    }

    if (!hasRepository && nodes.length > 2) {
      suggestions.push({
        id: 'suggest-repository',
        type: 'node',
        priority: 'high',
        title: 'Add Repository/DAO',
        description: 'Repository pattern abstracts data access.',
        rationale: 'No data access layer component found.',
        autoApplicable: false,
        confidence: 75,
        suggestedNode: {
          nodeType: 'component',
          label: 'Repository',
          description: 'Data access abstraction',
          layer: 'component',
        },
        relatedNodes: [],
      });
    }

    if (!hasValidator && nodes.length > 3) {
      suggestions.push({
        id: 'suggest-validator',
        type: 'node',
        priority: 'low',
        title: 'Consider Adding Validator',
        description: 'Input validation prevents invalid data from entering the system.',
        rationale: 'No validation component detected.',
        autoApplicable: false,
        confidence: 60,
        suggestedNode: {
          nodeType: 'component',
          label: 'Validator',
          description: 'Input validation and sanitization',
          layer: 'component',
        },
        relatedNodes: [],
      });
    }

    return suggestions;
  }

  /**
   * Suggest capability-level components
   */
  private suggestCapabilityComponents(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): NodeSuggestion[] {
    const suggestions: NodeSuggestion[] = [];

    const hasCustomerMgmt = nodes.some((n) => n.data.label.toLowerCase().includes('customer'));
    const hasOrderMgmt = nodes.some((n) => n.data.label.toLowerCase().includes('order'));
    const hasPayment = nodes.some((n) => n.data.label.toLowerCase().includes('payment'));
    const hasNotification = nodes.some((n) => n.data.label.toLowerCase().includes('notif'));
    const hasReporting = nodes.some(
      (n) =>
        n.data.label.toLowerCase().includes('report') ||
        n.data.label.toLowerCase().includes('analytics')
    );

    // Suggest common business capabilities based on what exists
    if (hasOrderMgmt && !hasCustomerMgmt) {
      suggestions.push({
        id: 'suggest-customer-mgmt',
        type: 'node',
        priority: 'high',
        title: 'Add Customer Management',
        description: 'Order management typically requires customer management.',
        rationale: 'Order management detected without customer management capability.',
        autoApplicable: false,
        confidence: 85,
        suggestedNode: {
          nodeType: 'capability',
          label: 'Customer Management',
          description: 'Manage customer information and relationships',
          layer: 'capability',
        },
        relatedNodes: nodes
          .filter((n) => n.data.label.toLowerCase().includes('order'))
          .map((n) => n.id),
      });
    }

    if ((hasOrderMgmt || hasCustomerMgmt) && !hasPayment) {
      suggestions.push({
        id: 'suggest-payment',
        type: 'node',
        priority: 'high',
        title: 'Add Payment Processing',
        description: 'E-commerce systems require payment processing.',
        rationale: 'Order/customer management detected without payment capability.',
        autoApplicable: false,
        confidence: 80,
        suggestedNode: {
          nodeType: 'capability',
          label: 'Payment Processing',
          description: 'Handle payment transactions and billing',
          layer: 'capability',
        },
        relatedNodes: nodes
          .filter(
            (n) =>
              n.data.label.toLowerCase().includes('order') ||
              n.data.label.toLowerCase().includes('customer')
          )
          .map((n) => n.id),
      });
    }

    if (nodes.length > 2 && !hasNotification) {
      suggestions.push({
        id: 'suggest-notification',
        type: 'node',
        priority: 'medium',
        title: 'Add Notification Capability',
        description: 'Systems need to notify users of important events.',
        rationale: 'No notification capability detected.',
        autoApplicable: false,
        confidence: 70,
        suggestedNode: {
          nodeType: 'capability',
          label: 'Notification',
          description: 'Send notifications via email, SMS, push',
          layer: 'capability',
        },
        relatedNodes: [],
      });
    }

    if (nodes.length > 4 && !hasReporting) {
      suggestions.push({
        id: 'suggest-reporting',
        type: 'node',
        priority: 'medium',
        title: 'Add Reporting/Analytics',
        description: 'Business insights require reporting capabilities.',
        rationale: 'Complex system without reporting capability.',
        autoApplicable: false,
        confidence: 65,
        suggestedNode: {
          nodeType: 'capability',
          label: 'Reporting & Analytics',
          description: 'Generate reports and business insights',
          layer: 'capability',
        },
        relatedNodes: [],
      });
    }

    return suggestions;
  }

  /**
   * Suggest missing relationships between existing components
   */
  private suggestMissingRelationships(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): EdgeSuggestion[] {
    const suggestions: EdgeSuggestion[] = [];

    // Find components that are likely related but not connected
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Check if already connected
        const alreadyConnected = edges.some(
          (e) =>
            (e.source === nodeA.id && e.target === nodeB.id) ||
            (e.source === nodeB.id && e.target === nodeA.id)
        );

        if (alreadyConnected) continue;

        // Check for semantic relationships
        const relationship = this.detectSemanticRelationship(nodeA, nodeB);
        if (relationship) {
          suggestions.push({
            id: `suggest-edge-${nodeA.id}-${nodeB.id}`,
            type: 'edge',
            priority: relationship.priority,
            title: `Connect "${nodeA.data.label}" to "${nodeB.data.label}"`,
            description: relationship.description,
            rationale: relationship.rationale,
            autoApplicable: false,
            confidence: relationship.confidence,
            suggestedEdge: {
              source: nodeA.id,
              target: nodeB.id,
              label: relationship.label,
              description: relationship.edgeDescription,
            },
          });
        }
      }
    }

    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Detect semantic relationship between two nodes
   */
  private detectSemanticRelationship(
    nodeA: Node<CanvasNodeData>,
    nodeB: Node<CanvasNodeData>
  ): {
    priority: 'high' | 'medium' | 'low';
    description: string;
    rationale: string;
    label: string;
    edgeDescription: string;
    confidence: number;
  } | null {
    const labelA = nodeA.data.label.toLowerCase();
    const labelB = nodeB.data.label.toLowerCase();

    // Controller -> Service relationship
    if (labelA.includes('controller') && labelB.includes('service')) {
      return {
        priority: 'high',
        description: 'Controllers typically depend on services',
        rationale: 'Standard layered architecture pattern',
        label: 'uses',
        edgeDescription: 'Controller uses service for business logic',
        confidence: 90,
      };
    }

    // Service -> Repository relationship
    if (labelA.includes('service') && labelB.includes('repository')) {
      return {
        priority: 'high',
        description: 'Services typically depend on repositories for data access',
        rationale: 'Standard repository pattern',
        label: 'uses',
        edgeDescription: 'Service uses repository for data access',
        confidence: 90,
      };
    }

    // Web App -> API relationship
    if (
      (labelA.includes('web') || labelA.includes('frontend')) &&
      (labelB.includes('api') || labelB.includes('backend'))
    ) {
      return {
        priority: 'high',
        description: 'Frontend typically calls backend API',
        rationale: 'Standard client-server architecture',
        label: 'calls',
        edgeDescription: 'Web application calls API',
        confidence: 85,
      };
    }

    // API -> Database relationship
    if (
      (labelA.includes('api') || labelA.includes('service')) &&
      (labelB.includes('database') || labelB.includes('db'))
    ) {
      return {
        priority: 'medium',
        description: 'APIs typically need data persistence',
        rationale: 'Most services require data storage',
        label: 'reads/writes',
        edgeDescription: 'Service accesses database',
        confidence: 75,
      };
    }

    // Auth -> Any Service relationship
    if (labelA.includes('auth') || labelA.includes('identity')) {
      return {
        priority: 'medium',
        description: 'Services typically depend on authentication',
        rationale: 'Security is a cross-cutting concern',
        label: 'authenticates',
        edgeDescription: 'Service uses authentication',
        confidence: 70,
      };
    }

    return null;
  }

  /**
   * Suggest architectural patterns
   */
  private suggestArchitecturalPatterns(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): PatternSuggestion[] {
    const suggestions: PatternSuggestion[] = [];

    // Suggest CQRS if read/write split would help
    if (nodes.length > 5 && edges.length > 10) {
      suggestions.push({
        id: 'suggest-cqrs',
        type: 'pattern',
        priority: 'low',
        title: 'Consider CQRS Pattern',
        description: 'Separate read and write models for better scalability.',
        rationale: 'Complex system that could benefit from read/write separation.',
        autoApplicable: false,
        confidence: 60,
        patternName: 'CQRS',
        components: [
          {
            nodeType: 'component',
            label: 'Command Handler',
            description: 'Handles write operations',
            role: 'command',
          },
          {
            nodeType: 'component',
            label: 'Query Handler',
            description: 'Handles read operations',
            role: 'query',
          },
          {
            nodeType: 'container',
            label: 'Event Store',
            description: 'Stores domain events',
            role: 'storage',
          },
        ],
        relationships: [
          { from: 'Command Handler', to: 'Event Store', label: 'writes events' },
          { from: 'Query Handler', to: 'Event Store', label: 'reads events' },
        ],
      });
    }

    // Suggest Event Sourcing if many state changes
    if (
      nodes.some(
        (n) =>
          n.data.label.toLowerCase().includes('audit') ||
          n.data.label.toLowerCase().includes('history')
      )
    ) {
      suggestions.push({
        id: 'suggest-event-sourcing',
        type: 'pattern',
        priority: 'low',
        title: 'Consider Event Sourcing',
        description: 'Store state changes as events for complete audit trail.',
        rationale: 'Audit/history requirements detected.',
        autoApplicable: false,
        confidence: 65,
        patternName: 'Event Sourcing',
        components: [
          {
            nodeType: 'container',
            label: 'Event Store',
            description: 'Append-only store of events',
            role: 'storage',
          },
          {
            nodeType: 'component',
            label: 'Event Publisher',
            description: 'Publishes events to subscribers',
            role: 'publisher',
          },
        ],
        relationships: [{ from: 'Event Publisher', to: 'Event Store', label: 'persists to' }],
      });
    }

    return suggestions;
  }

  /**
   * Suggest refactorings
   */
  private suggestRefactorings(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    // Find god objects (too many connections)
    const godObjects = nodes.filter((node) => {
      const connections = edges.filter((e) => e.source === node.id || e.target === node.id).length;
      return connections > 8;
    });

    for (const godObject of godObjects) {
      suggestions.push({
        id: `refactor-god-object-${godObject.id}`,
        type: 'refactoring',
        priority: 'high',
        title: `Split "${godObject.data.label}"`,
        description: 'This component has too many responsibilities.',
        rationale: `Component has ${edges.filter((e) => e.source === godObject.id || e.target === godObject.id).length} connections, indicating multiple responsibilities.`,
        autoApplicable: false,
        confidence: 85,
        affectedNodes: [godObject.id],
        affectedEdges: edges
          .filter((e) => e.source === godObject.id || e.target === godObject.id)
          .map((e) => e.id),
        steps: [
          'Identify distinct responsibilities within the component',
          'Create separate components for each responsibility',
          'Redistribute connections to new components',
          'Remove or refactor the original component',
        ],
        expectedOutcome: 'Better separation of concerns, easier to test and maintain',
      });
    }

    return suggestions;
  }

  /**
   * Suggest best practices
   */
  private suggestBestPractices(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): BestPracticeSuggestion[] {
    const suggestions: BestPracticeSuggestion[] = [];

    // Check for missing descriptions
    const noDescription = nodes.filter(
      (n) => !n.data.description || n.data.description.trim() === ''
    );
    if (noDescription.length > 0) {
      suggestions.push({
        id: 'best-practice-descriptions',
        type: 'best-practice',
        priority: 'medium',
        title: 'Add Component Descriptions',
        description: 'Documentation improves maintainability.',
        rationale: `${noDescription.length} component(s) are missing descriptions.`,
        autoApplicable: false,
        confidence: 100,
        category: 'documentation',
        affectedNodes: noDescription.map((n) => n.id),
        improvementSteps: [
          'Add concise descriptions to all components',
          'Explain the purpose and responsibilities',
          'Document key dependencies and interfaces',
        ],
      });
    }

    // Check for poor naming
    const poorNames = nodes.filter(
      (n) => n.data.label.length < 3 || /^(test|temp|foo|bar)$/i.test(n.data.label)
    );
    if (poorNames.length > 0) {
      suggestions.push({
        id: 'best-practice-naming',
        type: 'best-practice',
        priority: 'high',
        title: 'Improve Component Names',
        description: 'Clear names improve understanding.',
        rationale: `${poorNames.length} component(s) have unclear names.`,
        autoApplicable: false,
        confidence: 90,
        category: 'naming',
        affectedNodes: poorNames.map((n) => n.id),
        improvementSteps: [
          'Use descriptive, meaningful names',
          'Follow consistent naming conventions',
          'Avoid generic names like "test" or "temp"',
        ],
      });
    }

    // Check for unlabeled edges
    const unlabeledEdges = edges.filter((e) => !e.data?.label || e.data.label.trim() === '');
    if (unlabeledEdges.length > edges.length / 2 && edges.length > 3) {
      suggestions.push({
        id: 'best-practice-edge-labels',
        type: 'best-practice',
        priority: 'low',
        title: 'Add Relationship Labels',
        description: 'Labels clarify the nature of relationships.',
        rationale: `${unlabeledEdges.length} of ${edges.length} relationships are unlabeled.`,
        autoApplicable: false,
        confidence: 80,
        category: 'documentation',
        affectedNodes: [],
        improvementSteps: [
          'Add labels to relationships',
          'Use verbs like "uses", "calls", "depends on"',
          'Be specific about the interaction',
        ],
      });
    }

    return suggestions;
  }
}
