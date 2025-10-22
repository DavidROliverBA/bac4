/**
 * Architecture Analyzer Service
 *
 * Provides comprehensive architecture analysis including complexity metrics,
 * dependency analysis, component cohesion, and architectural recommendations.
 *
 * @version 2.4.0
 */

import type { Node, Edge } from 'reactflow';
import type { CanvasNodeData, DiagramType } from '../types/canvas-types';
import type BAC4Plugin from '../main';

export interface ComplexityMetrics {
  cyclomaticComplexity: number; // Based on dependency graph
  couplingScore: number; // 0-100 (lower is better)
  cohesionScore: number; // 0-100 (higher is better)
  abstractionLevel: number; // 0-100
  instabilityScore: number; // 0-100
  mainSequenceDistance: number; // 0-1 (closer to 0 is better)
}

export interface DependencyAnalysis {
  totalDependencies: number;
  directDependencies: number;
  transitiveDependencies: number;
  circularDependencies: string[][];
  fanIn: Map<string, number>; // Number of incoming dependencies
  fanOut: Map<string, number>; // Number of outgoing dependencies
  criticalPath: string[]; // Longest dependency chain
  isolatedComponents: string[];
}

export interface CohesionAnalysis {
  componentGroups: ComponentGroup[];
  interGroupCoupling: number;
  intraGroupCohesion: number;
  suggestedMerges: string[][]; // Components that should be merged
  suggestedSplits: string[]; // Components that should be split
}

export interface ComponentGroup {
  id: string;
  name: string;
  components: string[];
  cohesionScore: number;
  purpose: string;
}

export interface TechnologyStackAnalysis {
  detectedPatterns: ArchitecturalPattern[];
  technologyLayers: TechnologyLayer[];
  recommendations: TechnologyRecommendation[];
}

export interface ArchitecturalPattern {
  name: string;
  confidence: number; // 0-100
  components: string[];
  description: string;
  benefits: string[];
  concerns: string[];
}

export interface TechnologyLayer {
  layer: DiagramType;
  technologies: string[];
  componentCount: number;
  complianceScore: number; // 0-100
}

export interface TechnologyRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'pattern' | 'technology' | 'refactoring' | 'optimization';
  title: string;
  description: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface ArchitectureAnalysisReport {
  diagramPath: string;
  diagramType: DiagramType;
  timestamp: string;
  complexity: ComplexityMetrics;
  dependencies: DependencyAnalysis;
  cohesion: CohesionAnalysis;
  technologyStack: TechnologyStackAnalysis;
  overallScore: number; // 0-100
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: TechnologyRecommendation[];
}

export class ArchitectureAnalyzerService {
  private plugin: BAC4Plugin;

  constructor(plugin: BAC4Plugin) {
    this.plugin = plugin;
  }

  /**
   * Perform comprehensive architecture analysis
   */
  async analyzeArchitecture(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType,
    diagramPath: string
  ): Promise<ArchitectureAnalysisReport> {
    // Analyze different aspects of the architecture
    const complexity = this.calculateComplexityMetrics(nodes, edges);
    const dependencies = this.analyzeDependencies(nodes, edges);
    const cohesion = this.analyzeCohesion(nodes, edges);
    const technologyStack = this.analyzeTechnologyStack(nodes, edges, diagramType);

    // Calculate overall score and grade
    const overallScore = this.calculateOverallScore(complexity, dependencies, cohesion, technologyStack);
    const qualityGrade = this.calculateQualityGrade(overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      complexity,
      dependencies,
      cohesion,
      technologyStack,
      diagramType
    );

    return {
      diagramPath,
      diagramType,
      timestamp: new Date().toISOString(),
      complexity,
      dependencies,
      cohesion,
      technologyStack,
      overallScore,
      qualityGrade,
      recommendations,
    };
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexityMetrics(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): ComplexityMetrics {
    // Cyclomatic complexity: M = E - N + 2P
    // Where E = edges, N = nodes, P = connected components
    const connectedComponents = this.countConnectedComponents(nodes, edges);
    const cyclomaticComplexity = edges.length - nodes.length + 2 * connectedComponents;

    // Coupling score: Based on average connections per node
    const avgConnections = edges.length / Math.max(nodes.length, 1);
    const couplingScore = Math.min(100, avgConnections * 10);

    // Cohesion score: Based on component grouping
    const cohesionScore = this.calculateCohesionScore(nodes, edges);

    // Abstraction level: Ratio of abstract/interface components
    const abstractionLevel = this.calculateAbstractionLevel(nodes);

    // Instability: I = Fan-out / (Fan-in + Fan-out)
    const instabilityScore = this.calculateInstability(nodes, edges);

    // Distance from main sequence: D = |A + I - 1|
    const mainSequenceDistance = Math.abs(abstractionLevel / 100 + instabilityScore / 100 - 1);

    return {
      cyclomaticComplexity,
      couplingScore: Math.round(couplingScore),
      cohesionScore,
      abstractionLevel,
      instabilityScore,
      mainSequenceDistance,
    };
  }

  /**
   * Analyze dependencies
   */
  private analyzeDependencies(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): DependencyAnalysis {
    const fanIn = new Map<string, number>();
    const fanOut = new Map<string, number>();

    // Initialize maps
    for (const node of nodes) {
      fanIn.set(node.id, 0);
      fanOut.set(node.id, 0);
    }

    // Calculate fan-in and fan-out
    for (const edge of edges) {
      fanOut.set(edge.source, (fanOut.get(edge.source) || 0) + 1);
      fanIn.set(edge.target, (fanIn.get(edge.target) || 0) + 1);
    }

    // Find circular dependencies
    const circularDependencies = this.findCircularDependencies(nodes, edges);

    // Find critical path (longest dependency chain)
    const criticalPath = this.findCriticalPath(nodes, edges);

    // Find isolated components
    const isolatedComponents = nodes
      .filter((node) => (fanIn.get(node.id) || 0) + (fanOut.get(node.id) || 0) === 0)
      .map((node) => node.id);

    // Calculate transitive dependencies
    const transitiveDeps = this.calculateTransitiveDependencies(nodes, edges);

    return {
      totalDependencies: edges.length,
      directDependencies: edges.length,
      transitiveDependencies: transitiveDeps,
      circularDependencies,
      fanIn,
      fanOut,
      criticalPath,
      isolatedComponents,
    };
  }

  /**
   * Analyze component cohesion
   */
  private analyzeCohesion(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): CohesionAnalysis {
    // Detect component groups using community detection algorithm
    const componentGroups = this.detectComponentGroups(nodes, edges);

    // Calculate inter-group coupling
    const interGroupCoupling = this.calculateInterGroupCoupling(componentGroups, edges);

    // Calculate intra-group cohesion
    const intraGroupCohesion = this.calculateIntraGroupCohesion(componentGroups, edges);

    // Suggest merges (tightly coupled components in different groups)
    const suggestedMerges = this.findMergeCandidates(componentGroups, edges);

    // Suggest splits (loosely cohesive components)
    const suggestedSplits = this.findSplitCandidates(componentGroups, edges);

    return {
      componentGroups,
      interGroupCoupling,
      intraGroupCohesion,
      suggestedMerges,
      suggestedSplits,
    };
  }

  /**
   * Analyze technology stack
   */
  private analyzeTechnologyStack(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): TechnologyStackAnalysis {
    // Detect architectural patterns
    const detectedPatterns = this.detectArchitecturalPatterns(nodes, edges, diagramType);

    // Analyze technology layers
    const technologyLayers = this.analyzeTechnologyLayers(nodes, diagramType);

    // Generate recommendations
    const recommendations = this.generateTechnologyRecommendations(
      nodes,
      edges,
      diagramType,
      detectedPatterns
    );

    return {
      detectedPatterns,
      technologyLayers,
      recommendations,
    };
  }

  /**
   * Detect architectural patterns in the diagram
   */
  private detectArchitecturalPatterns(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): ArchitecturalPattern[] {
    const patterns: ArchitecturalPattern[] = [];

    // Detect Layered Architecture
    const layeredPattern = this.detectLayeredArchitecture(nodes, edges);
    if (layeredPattern) patterns.push(layeredPattern);

    // Detect Microservices
    const microservicesPattern = this.detectMicroservices(nodes, edges);
    if (microservicesPattern) patterns.push(microservicesPattern);

    // Detect Event-Driven Architecture
    const eventDrivenPattern = this.detectEventDriven(nodes, edges);
    if (eventDrivenPattern) patterns.push(eventDrivenPattern);

    // Detect Hexagonal/Ports & Adapters
    const hexagonalPattern = this.detectHexagonal(nodes, edges);
    if (hexagonalPattern) patterns.push(hexagonalPattern);

    // Detect CQRS
    const cqrsPattern = this.detectCQRS(nodes, edges);
    if (cqrsPattern) patterns.push(cqrsPattern);

    return patterns;
  }

  /**
   * Detect layered architecture pattern
   */
  private detectLayeredArchitecture(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): ArchitecturalPattern | null {
    // Look for typical layer names
    const layerKeywords = ['presentation', 'ui', 'service', 'business', 'data', 'persistence', 'infrastructure'];

    const layerNodes = nodes.filter((node) =>
      layerKeywords.some((keyword) => node.data.label.toLowerCase().includes(keyword))
    );

    if (layerNodes.length < 2) return null;

    // Calculate confidence based on layer separation
    const confidence = Math.min(100, (layerNodes.length / nodes.length) * 100 + 20);

    return {
      name: 'Layered Architecture',
      confidence: Math.round(confidence),
      components: layerNodes.map((n) => n.id),
      description: 'Components are organized into distinct layers with clear separation of concerns.',
      benefits: [
        'Clear separation of concerns',
        'Easy to understand and maintain',
        'Well-established pattern',
      ],
      concerns: [
        'Potential for tight coupling between layers',
        'May become monolithic over time',
      ],
    };
  }

  /**
   * Detect microservices pattern
   */
  private detectMicroservices(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): ArchitecturalPattern | null {
    // Look for service-oriented keywords
    const serviceKeywords = ['service', 'api', 'microservice', 'ms-'];

    const serviceNodes = nodes.filter((node) =>
      serviceKeywords.some((keyword) => node.data.label.toLowerCase().includes(keyword))
    );

    // Need at least 3 services for microservices pattern
    if (serviceNodes.length < 3) return null;

    // Check for low coupling (services should be relatively independent)
    const avgCoupling = edges.length / Math.max(nodes.length, 1);
    if (avgCoupling > 3) return null; // Too tightly coupled

    const confidence = Math.min(100, (serviceNodes.length / nodes.length) * 100);

    return {
      name: 'Microservices Architecture',
      confidence: Math.round(confidence),
      components: serviceNodes.map((n) => n.id),
      description: 'Architecture composed of loosely coupled, independently deployable services.',
      benefits: [
        'Independent deployment and scaling',
        'Technology diversity',
        'Fault isolation',
      ],
      concerns: [
        'Increased operational complexity',
        'Distributed system challenges',
        'Network latency and reliability',
      ],
    };
  }

  /**
   * Detect event-driven architecture
   */
  private detectEventDriven(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): ArchitecturalPattern | null {
    const eventKeywords = ['event', 'queue', 'broker', 'pub', 'sub', 'message', 'kafka', 'rabbitmq'];

    const eventNodes = nodes.filter((node) =>
      eventKeywords.some((keyword) => node.data.label.toLowerCase().includes(keyword))
    );

    if (eventNodes.length === 0) return null;

    const confidence = Math.min(100, (eventNodes.length / nodes.length) * 150);

    return {
      name: 'Event-Driven Architecture',
      confidence: Math.round(confidence),
      components: eventNodes.map((n) => n.id),
      description: 'Components communicate through asynchronous event messages.',
      benefits: [
        'Loose coupling between components',
        'Scalability and resilience',
        'Asynchronous processing',
      ],
      concerns: [
        'Eventual consistency challenges',
        'Complex event flow debugging',
        'Message ordering issues',
      ],
    };
  }

  /**
   * Detect hexagonal/ports & adapters architecture
   */
  private detectHexagonal(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): ArchitecturalPattern | null {
    const portKeywords = ['port', 'adapter', 'interface', 'gateway', 'repository'];

    const portNodes = nodes.filter((node) =>
      portKeywords.some((keyword) => node.data.label.toLowerCase().includes(keyword))
    );

    if (portNodes.length < 2) return null;

    const confidence = Math.min(100, (portNodes.length / nodes.length) * 100 + 10);

    return {
      name: 'Hexagonal Architecture (Ports & Adapters)',
      confidence: Math.round(confidence),
      components: portNodes.map((n) => n.id),
      description: 'Core business logic is isolated from external dependencies through ports and adapters.',
      benefits: [
        'Testability through dependency inversion',
        'Technology independence',
        'Clear domain boundaries',
      ],
      concerns: [
        'Initial complexity overhead',
        'More boilerplate code',
      ],
    };
  }

  /**
   * Detect CQRS pattern
   */
  private detectCQRS(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[]
  ): ArchitecturalPattern | null {
    const cqrsKeywords = ['command', 'query', 'read', 'write', 'cqrs'];

    const cqrsNodes = nodes.filter((node) =>
      cqrsKeywords.some((keyword) => node.data.label.toLowerCase().includes(keyword))
    );

    // Need both command and query sides
    const hasCommand = cqrsNodes.some((n) =>
      n.data.label.toLowerCase().includes('command') ||
      n.data.label.toLowerCase().includes('write')
    );
    const hasQuery = cqrsNodes.some((n) =>
      n.data.label.toLowerCase().includes('query') ||
      n.data.label.toLowerCase().includes('read')
    );

    if (!hasCommand || !hasQuery) return null;

    const confidence = Math.min(100, (cqrsNodes.length / nodes.length) * 150 + 20);

    return {
      name: 'CQRS (Command Query Responsibility Segregation)',
      confidence: Math.round(confidence),
      components: cqrsNodes.map((n) => n.id),
      description: 'Separate models for read and write operations.',
      benefits: [
        'Optimized read and write paths',
        'Scalability of read vs write',
        'Clear separation of concerns',
      ],
      concerns: [
        'Eventual consistency complexity',
        'Increased system complexity',
        'Data synchronization challenges',
      ],
    };
  }

  /**
   * Analyze technology layers
   */
  private analyzeTechnologyLayers(
    nodes: Node<CanvasNodeData>[],
    diagramType: DiagramType
  ): TechnologyLayer[] {
    const layers: DiagramType[] = ['market', 'organisation', 'capability', 'context', 'container', 'component', 'code'];
    const result: TechnologyLayer[] = [];

    for (const layer of layers) {
      const layerNodes = nodes.filter((n) => n.type === layer);
      if (layerNodes.length === 0) continue;

      // Extract technology mentions from labels and descriptions
      const technologies = this.extractTechnologies(layerNodes);

      // Calculate compliance score (how well it follows layer principles)
      const complianceScore = this.calculateLayerCompliance(layerNodes, layer);

      result.push({
        layer,
        technologies,
        componentCount: layerNodes.length,
        complianceScore,
      });
    }

    return result;
  }

  /**
   * Extract technology mentions from nodes
   */
  private extractTechnologies(nodes: Node<CanvasNodeData>[]): string[] {
    const technologies = new Set<string>();
    const techPatterns = [
      /react/i, /angular/i, /vue/i, /node/i, /python/i, /java/i,
      /aws/i, /azure/i, /gcp/i, /docker/i, /kubernetes/i, /k8s/i,
      /postgres/i, /mysql/i, /mongo/i, /redis/i, /kafka/i,
      /rest/i, /graphql/i, /grpc/i, /http/i,
    ];

    for (const node of nodes) {
      const text = `${node.data.label} ${node.data.description || ''}`.toLowerCase();
      for (const pattern of techPatterns) {
        const match = text.match(pattern);
        if (match) {
          technologies.add(match[0]);
        }
      }
    }

    return Array.from(technologies);
  }

  /**
   * Calculate layer compliance score
   */
  private calculateLayerCompliance(
    nodes: Node<CanvasNodeData>[],
    layer: DiagramType
  ): number {
    let score = 100;

    // Check for proper naming conventions
    const hasDescriptions = nodes.filter((n) => n.data.description && n.data.description.trim() !== '').length;
    score -= (nodes.length - hasDescriptions) * 5;

    // Check for reasonable size (not too many components in one layer)
    if (nodes.length > 15) score -= 10;
    if (nodes.length > 25) score -= 20;

    return Math.max(0, score);
  }

  /**
   * Generate technology recommendations
   */
  private generateTechnologyRecommendations(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType,
    patterns: ArchitecturalPattern[]
  ): TechnologyRecommendation[] {
    const recommendations: TechnologyRecommendation[] = [];

    // Recommend patterns based on diagram characteristics
    if (nodes.length > 10 && patterns.length === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'pattern',
        title: 'Consider Implementing Architectural Pattern',
        description: 'Your diagram has grown complex. Consider adopting a well-known architectural pattern to improve maintainability.',
        benefits: [
          'Improved code organization',
          'Better separation of concerns',
          'Easier onboarding for new developers',
        ],
        effort: 'high',
        impact: 'high',
      });
    }

    // Recommend event-driven if too tightly coupled
    const avgCoupling = edges.length / Math.max(nodes.length, 1);
    if (avgCoupling > 3) {
      recommendations.push({
        priority: 'high',
        category: 'refactoring',
        title: 'Reduce Coupling with Event-Driven Architecture',
        description: 'Components are tightly coupled. Consider using events or message queues to decouple them.',
        benefits: [
          'Reduced dependencies',
          'Improved scalability',
          'Better fault isolation',
        ],
        effort: 'medium',
        impact: 'high',
      });
    }

    // Recommend microservices if monolithic
    if (nodes.length > 20 && !patterns.some((p) => p.name.includes('Microservices'))) {
      recommendations.push({
        priority: 'low',
        category: 'pattern',
        title: 'Consider Microservices Architecture',
        description: 'Your system is large and may benefit from decomposition into microservices.',
        benefits: [
          'Independent deployment',
          'Technology diversity',
          'Team autonomy',
        ],
        effort: 'high',
        impact: 'high',
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(
    complexity: ComplexityMetrics,
    dependencies: DependencyAnalysis,
    cohesion: CohesionAnalysis,
    technologyStack: TechnologyStackAnalysis,
    diagramType: DiagramType
  ): TechnologyRecommendation[] {
    const recommendations: TechnologyRecommendation[] = [];

    // Add technology stack recommendations
    recommendations.push(...technologyStack.recommendations);

    // Complexity-based recommendations
    if (complexity.couplingScore > 50) {
      recommendations.push({
        priority: 'high',
        category: 'refactoring',
        title: 'Reduce Component Coupling',
        description: `Coupling score is ${complexity.couplingScore}/100. High coupling makes the system fragile and hard to change.`,
        benefits: ['Easier to modify', 'Better testability', 'Reduced ripple effects'],
        effort: 'medium',
        impact: 'high',
      });
    }

    if (complexity.cohesionScore < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'refactoring',
        title: 'Improve Component Cohesion',
        description: `Cohesion score is ${complexity.cohesionScore}/100. Low cohesion indicates components have too many unrelated responsibilities.`,
        benefits: ['Clearer responsibilities', 'Easier to understand', 'Better reusability'],
        effort: 'medium',
        impact: 'medium',
      });
    }

    // Dependency-based recommendations
    if (dependencies.circularDependencies.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'refactoring',
        title: 'Break Circular Dependencies',
        description: `Found ${dependencies.circularDependencies.length} circular dependency chain(s). These create tight coupling and build issues.`,
        benefits: ['Cleaner dependencies', 'Easier builds', 'Better modularity'],
        effort: 'high',
        impact: 'high',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Calculate overall architecture score
   */
  private calculateOverallScore(
    complexity: ComplexityMetrics,
    dependencies: DependencyAnalysis,
    cohesion: CohesionAnalysis,
    technologyStack: TechnologyStackAnalysis
  ): number {
    let score = 100;

    // Complexity penalties
    score -= complexity.couplingScore * 0.3;
    score -= (100 - complexity.cohesionScore) * 0.2;
    score -= complexity.mainSequenceDistance * 20;

    // Dependency penalties
    score -= dependencies.circularDependencies.length * 10;
    score -= dependencies.isolatedComponents.length * 2;

    // Cohesion bonus
    score += cohesion.intraGroupCohesion * 0.1;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate quality grade from score
   */
  private calculateQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ========== Helper Methods ==========

  private countConnectedComponents(nodes: Node<CanvasNodeData>[], edges: Edge[]): number {
    const visited = new Set<string>();
    let count = 0;

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      const neighbors = edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => (e.source === nodeId ? e.target : e.source));

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
        count++;
      }
    }

    return count;
  }

  private calculateCohesionScore(nodes: Node<CanvasNodeData>[], edges: Edge[]): number {
    if (nodes.length === 0) return 100;

    // Calculate as ratio of actual connections to possible connections
    const possibleConnections = (nodes.length * (nodes.length - 1)) / 2;
    const actualConnections = edges.length;

    return Math.round((actualConnections / Math.max(possibleConnections, 1)) * 100);
  }

  private calculateAbstractionLevel(nodes: Node<CanvasNodeData>[]): number {
    const abstractKeywords = ['interface', 'abstract', 'base', 'contract', 'port'];
    const abstractNodes = nodes.filter((n) =>
      abstractKeywords.some((keyword) => n.data.label.toLowerCase().includes(keyword))
    );

    return Math.round((abstractNodes.length / Math.max(nodes.length, 1)) * 100);
  }

  private calculateInstability(nodes: Node<CanvasNodeData>[], edges: Edge[]): number {
    let totalFanOut = 0;
    let totalFanIn = 0;

    for (const node of nodes) {
      const fanOut = edges.filter((e) => e.source === node.id).length;
      const fanIn = edges.filter((e) => e.target === node.id).length;
      totalFanOut += fanOut;
      totalFanIn += fanIn;
    }

    const total = totalFanIn + totalFanOut;
    if (total === 0) return 0;

    return Math.round((totalFanOut / total) * 100);
  }

  private findCircularDependencies(nodes: Node<CanvasNodeData>[], edges: Edge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoing = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          dfs(edge.target, [...path]);
        } else if (recursionStack.has(edge.target)) {
          const cycleStart = path.indexOf(edge.target);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return cycles;
  }

  private findCriticalPath(nodes: Node<CanvasNodeData>[], edges: Edge[]): string[] {
    let longestPath: string[] = [];

    const dfs = (nodeId: string, path: string[]): void => {
      path.push(nodeId);
      if (path.length > longestPath.length) {
        longestPath = [...path];
      }

      const outgoing = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        if (!path.includes(edge.target)) {
          dfs(edge.target, [...path]);
        }
      }
    };

    for (const node of nodes) {
      dfs(node.id, []);
    }

    return longestPath;
  }

  private calculateTransitiveDependencies(nodes: Node<CanvasNodeData>[], edges: Edge[]): number {
    let count = 0;

    for (const node of nodes) {
      const visited = new Set<string>();
      const dfs = (nodeId: string): void => {
        visited.add(nodeId);
        const outgoing = edges.filter((e) => e.source === nodeId);
        for (const edge of outgoing) {
          if (!visited.has(edge.target)) {
            dfs(edge.target);
          }
        }
      };
      dfs(node.id);
      count += visited.size - 1; // Exclude the node itself
    }

    return count;
  }

  private detectComponentGroups(nodes: Node<CanvasNodeData>[], edges: Edge[]): ComponentGroup[] {
    // Simple grouping by connected components
    const visited = new Set<string>();
    const groups: ComponentGroup[] = [];
    let groupId = 0;

    const dfs = (nodeId: string, group: string[]): void => {
      visited.add(nodeId);
      group.push(nodeId);

      const neighbors = edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => (e.source === nodeId ? e.target : e.source));

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, group);
        }
      }
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const group: string[] = [];
        dfs(node.id, group);

        groups.push({
          id: `group-${groupId++}`,
          name: `Component Group ${groupId}`,
          components: group,
          cohesionScore: this.calculateGroupCohesion(group, edges),
          purpose: 'Auto-detected component group',
        });
      }
    }

    return groups;
  }

  private calculateGroupCohesion(group: string[], edges: Edge[]): number {
    const internalEdges = edges.filter(
      (e) => group.includes(e.source) && group.includes(e.target)
    ).length;

    const maxPossibleEdges = (group.length * (group.length - 1)) / 2;
    if (maxPossibleEdges === 0) return 100;

    return Math.round((internalEdges / maxPossibleEdges) * 100);
  }

  private calculateInterGroupCoupling(groups: ComponentGroup[], edges: Edge[]): number {
    const allComponents = new Set(groups.flatMap((g) => g.components));
    const interGroupEdges = edges.filter((e) => {
      const sourceGroup = groups.find((g) => g.components.includes(e.source));
      const targetGroup = groups.find((g) => g.components.includes(e.target));
      return sourceGroup !== targetGroup;
    }).length;

    return Math.round((interGroupEdges / Math.max(edges.length, 1)) * 100);
  }

  private calculateIntraGroupCohesion(groups: ComponentGroup[], edges: Edge[]): number {
    if (groups.length === 0) return 0;
    const avgCohesion = groups.reduce((sum, g) => sum + g.cohesionScore, 0) / groups.length;
    return Math.round(avgCohesion);
  }

  private findMergeCandidates(groups: ComponentGroup[], edges: Edge[]): string[][] {
    const candidates: string[][] = [];

    // Find groups that are tightly coupled
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const edgesBetween = edges.filter(
          (e) =>
            (groups[i].components.includes(e.source) && groups[j].components.includes(e.target)) ||
            (groups[j].components.includes(e.source) && groups[i].components.includes(e.target))
        ).length;

        // If more than 3 connections between groups, suggest merge
        if (edgesBetween > 3) {
          candidates.push([groups[i].id, groups[j].id]);
        }
      }
    }

    return candidates;
  }

  private findSplitCandidates(groups: ComponentGroup[], edges: Edge[]): string[] {
    const candidates: string[] = [];

    for (const group of groups) {
      // If group is large (>10 components) and has low cohesion (<40), suggest split
      if (group.components.length > 10 && group.cohesionScore < 40) {
        candidates.push(group.id);
      }
    }

    return candidates;
  }
}
