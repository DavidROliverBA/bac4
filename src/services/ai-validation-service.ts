/**
 * AI Validation Service
 *
 * Provides AI-powered diagram validation, anti-pattern detection,
 * and architecture smell detection.
 *
 * @version 2.4.0
 */

import type { Node, Edge } from 'reactflow';
import type { CanvasNodeData, DiagramType } from '../types/canvas-types';
import type BAC4Plugin from '../main';

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: 'anti-pattern' | 'architecture-smell' | 'compliance' | 'best-practice';
  title: string;
  description: string;
  affectedNodes: string[];
  affectedEdges: string[];
  suggestion?: string;
  autoFixable?: boolean;
}

export interface ValidationReport {
  diagramPath: string;
  diagramType: DiagramType;
  timestamp: string;
  issues: ValidationIssue[];
  score: number; // 0-100
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export class AIValidationService {
  private plugin: BAC4Plugin;

  constructor(plugin: BAC4Plugin) {
    this.plugin = plugin;
  }

  /**
   * Validate a diagram for anti-patterns, architecture smells, and compliance
   */
  async validateDiagram(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType,
    diagramPath: string
  ): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];

    // Run all validation checks
    issues.push(...this.detectAntiPatterns(nodes, edges, diagramType));
    issues.push(...this.detectArchitectureSmells(nodes, edges, diagramType));
    issues.push(...this.checkCompliance(nodes, edges, diagramType));
    issues.push(...this.checkBestPractices(nodes, edges, diagramType));

    // Calculate score
    const score = this.calculateScore(issues);

    // Generate summary
    const summary = {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      diagramPath,
      diagramType,
      timestamp: new Date().toISOString(),
      issues,
      score,
      summary,
    };
  }

  /**
   * Detect anti-patterns in the diagram
   */
  private detectAntiPatterns(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Anti-pattern: Circular dependencies
    const cycles = this.findCircularDependencies(nodes, edges);
    if (cycles.length > 0) {
      issues.push({
        id: 'circular-dependencies',
        severity: 'error',
        type: 'anti-pattern',
        title: 'Circular Dependencies Detected',
        description: `Found ${cycles.length} circular dependency chain(s). This creates tight coupling and makes the system harder to maintain.`,
        affectedNodes: cycles.flat(),
        affectedEdges: [],
        suggestion:
          'Break circular dependencies by introducing interfaces, dependency inversion, or event-driven architecture.',
        autoFixable: false,
      });
    }

    // Anti-pattern: God object (too many connections)
    const godObjects = this.findGodObjects(nodes, edges);
    for (const node of godObjects) {
      issues.push({
        id: `god-object-${node.id}`,
        severity: 'warning',
        type: 'anti-pattern',
        title: 'God Object Detected',
        description: `Node "${node.data.label}" has too many connections (${this.getConnectionCount(node.id, edges)}). This violates the Single Responsibility Principle.`,
        affectedNodes: [node.id],
        affectedEdges: edges.filter((e) => e.source === node.id || e.target === node.id).map((e) => e.id),
        suggestion: 'Split this component into smaller, more focused components with single responsibilities.',
        autoFixable: false,
      });
    }

    // Anti-pattern: Tight coupling (bidirectional dependencies)
    const tightlyCoupled = this.findTightlyCoupledNodes(nodes, edges);
    for (const pair of tightlyCoupled) {
      issues.push({
        id: `tight-coupling-${pair[0]}-${pair[1]}`,
        severity: 'warning',
        type: 'anti-pattern',
        title: 'Tight Coupling Detected',
        description: `Nodes "${pair[0]}" and "${pair[1]}" have bidirectional dependencies, indicating tight coupling.`,
        affectedNodes: pair,
        affectedEdges: edges.filter((e) =>
          (e.source === pair[0] && e.target === pair[1]) ||
          (e.source === pair[1] && e.target === pair[0])
        ).map((e) => e.id),
        suggestion: 'Consider using interfaces or events to decouple these components.',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Detect architecture smells
   */
  private detectArchitectureSmells(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Smell: Orphaned nodes (no connections)
    const orphans = nodes.filter((node) => this.getConnectionCount(node.id, edges) === 0);
    if (orphans.length > 0) {
      for (const node of orphans) {
        issues.push({
          id: `orphan-${node.id}`,
          severity: 'info',
          type: 'architecture-smell',
          title: 'Orphaned Component',
          description: `Node "${node.data.label}" has no connections. It may be incomplete or unused.`,
          affectedNodes: [node.id],
          affectedEdges: [],
          suggestion: 'Connect this component to the architecture or remove it if unused.',
          autoFixable: false,
        });
      }
    }

    // Smell: Hub node (central bottleneck)
    const hubs = nodes.filter((node) => this.getConnectionCount(node.id, edges) > 10);
    for (const node of hubs) {
      issues.push({
        id: `hub-${node.id}`,
        severity: 'warning',
        type: 'architecture-smell',
        title: 'Central Hub Detected',
        description: `Node "${node.data.label}" is a central hub with ${this.getConnectionCount(node.id, edges)} connections. This creates a single point of failure.`,
        affectedNodes: [node.id],
        affectedEdges: [],
        suggestion: 'Consider distributing responsibilities or using a message broker pattern.',
        autoFixable: false,
      });
    }

    // Smell: Deep dependency chains
    const deepChains = this.findDeepDependencyChains(nodes, edges, 5);
    if (deepChains.length > 0) {
      issues.push({
        id: 'deep-chains',
        severity: 'warning',
        type: 'architecture-smell',
        title: 'Deep Dependency Chains',
        description: `Found ${deepChains.length} dependency chain(s) longer than 5 levels. Deep chains increase complexity and fragility.`,
        affectedNodes: deepChains.flat(),
        affectedEdges: [],
        suggestion: 'Flatten the architecture by reducing layers or introducing facades.',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check compliance with layer separation and naming conventions
   */
  private checkCompliance(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Compliance: Naming conventions
    const badNames = nodes.filter((node) => !this.hasGoodName(node.data.label));
    for (const node of badNames) {
      issues.push({
        id: `naming-${node.id}`,
        severity: 'info',
        type: 'compliance',
        title: 'Naming Convention',
        description: `Node "${node.data.label}" doesn't follow recommended naming conventions.`,
        affectedNodes: [node.id],
        affectedEdges: [],
        suggestion: 'Use clear, descriptive names that explain the component\'s purpose.',
        autoFixable: false,
      });
    }

    // Compliance: Missing descriptions
    const noDescription = nodes.filter((node) => !node.data.description || node.data.description.trim() === '');
    if (noDescription.length > 0) {
      issues.push({
        id: 'missing-descriptions',
        severity: 'info',
        type: 'compliance',
        title: 'Missing Descriptions',
        description: `${noDescription.length} node(s) are missing descriptions. Documentation is important for maintainability.`,
        affectedNodes: noDescription.map((n) => n.id),
        affectedEdges: [],
        suggestion: 'Add descriptions to all components explaining their purpose and responsibilities.',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check best practices
   */
  private checkBestPractices(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    diagramType: DiagramType
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Best practice: Reasonable diagram size
    if (nodes.length > 20) {
      issues.push({
        id: 'diagram-too-large',
        severity: 'info',
        type: 'best-practice',
        title: 'Large Diagram',
        description: `This diagram has ${nodes.length} nodes. Consider splitting into multiple diagrams for better readability.`,
        affectedNodes: [],
        affectedEdges: [],
        suggestion: 'Split large diagrams into logical groups or layers.',
        autoFixable: false,
      });
    }

    // Best practice: Edge labels
    const unlabeledEdges = edges.filter((e) => !e.data?.label || e.data.label.trim() === '');
    if (unlabeledEdges.length > edges.length / 2 && edges.length > 0) {
      issues.push({
        id: 'unlabeled-edges',
        severity: 'info',
        type: 'best-practice',
        title: 'Unlabeled Relationships',
        description: `${unlabeledEdges.length} of ${edges.length} relationships are unlabeled. Labels improve diagram clarity.`,
        affectedNodes: [],
        affectedEdges: unlabeledEdges.map((e) => e.id),
        suggestion: 'Add labels to relationships describing the interaction (e.g., "uses", "sends data to", "depends on").',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Find circular dependencies using DFS
   */
  private findCircularDependencies(nodes: Node<CanvasNodeData>[], edges: Edge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Find outgoing edges
      const outgoing = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          dfs(edge.target, [...path]);
        } else if (recursionStack.has(edge.target)) {
          // Found cycle
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

  /**
   * Find god objects (nodes with too many connections)
   */
  private findGodObjects(nodes: Node<CanvasNodeData>[], edges: Edge[]): Node<CanvasNodeData>[] {
    const threshold = 8; // More than 8 connections is considered a god object
    return nodes.filter((node) => this.getConnectionCount(node.id, edges) > threshold);
  }

  /**
   * Find tightly coupled nodes (bidirectional dependencies)
   */
  private findTightlyCoupledNodes(nodes: Node<CanvasNodeData>[], edges: Edge[]): string[][] {
    const pairs: string[][] = [];
    const checked = new Set<string>();

    for (const node of nodes) {
      const outgoing = edges.filter((e) => e.source === node.id).map((e) => e.target);
      const incoming = edges.filter((e) => e.target === node.id).map((e) => e.source);

      for (const target of outgoing) {
        if (incoming.includes(target)) {
          const pairKey = [node.id, target].sort().join('-');
          if (!checked.has(pairKey)) {
            pairs.push([node.id, target]);
            checked.add(pairKey);
          }
        }
      }
    }

    return pairs;
  }

  /**
   * Find deep dependency chains
   */
  private findDeepDependencyChains(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    maxDepth: number
  ): string[][] {
    const chains: string[][] = [];

    const dfs = (nodeId: string, path: string[], depth: number): void => {
      if (depth > maxDepth) {
        chains.push([...path]);
        return;
      }

      const outgoing = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        if (!path.includes(edge.target)) {
          dfs(edge.target, [...path, edge.target], depth + 1);
        }
      }
    };

    for (const node of nodes) {
      dfs(node.id, [node.id], 0);
    }

    return chains;
  }

  /**
   * Get connection count for a node
   */
  private getConnectionCount(nodeId: string, edges: Edge[]): number {
    return edges.filter((e) => e.source === nodeId || e.target === nodeId).length;
  }

  /**
   * Check if a name follows good conventions
   */
  private hasGoodName(name: string): boolean {
    // Check for:
    // - Not too short (< 3 chars)
    // - Not generic (test, temp, foo, bar, etc.)
    // - Has some structure (not all lowercase single word)
    if (name.length < 3) return false;

    const generic = ['test', 'temp', 'foo', 'bar', 'example', 'sample', 'todo', 'tbd'];
    if (generic.includes(name.toLowerCase())) return false;

    return true;
  }

  /**
   * Calculate overall score (0-100)
   */
  private calculateScore(issues: ValidationIssue[]): number {
    let score = 100;

    // Deduct points based on severity
    for (const issue of issues) {
      if (issue.severity === 'error') score -= 15;
      else if (issue.severity === 'warning') score -= 5;
      else if (issue.severity === 'info') score -= 1;
    }

    return Math.max(0, score);
  }
}
