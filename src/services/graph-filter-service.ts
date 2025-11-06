/**
 * Graph Filter Service
 *
 * Provides filtering capabilities for the graph view.
 * Filters diagrams by layer, connections, search terms, etc.
 *
 * v2.0.2: Phase 4 - Filtering & Search
 *
 * @module graph-filter-service
 */

import type { DiagramMetadata } from './layout/LayoutEngine';
import type { DiagramType } from '../types/canvas-types';
import { countRelationships } from './layout/LayoutEngine';

/**
 * Filter criteria for graph view
 */
export interface GraphFilter {
  /**
   * Include only specific layers (if empty, include all)
   */
  layers?: DiagramType[];

  /**
   * Search term to filter diagram names
   */
  searchTerm?: string;

  /**
   * Connection filter type
   */
  connectionFilter?: 'all' | 'isolated' | 'hub' | 'connected-to';

  /**
   * Specific diagram path for 'connected-to' filter
   */
  connectedToDiagram?: string;

  /**
   * Minimum connections for 'hub' filter
   */
  minConnections?: number;
}

/**
 * Service for filtering graph diagrams
 */
export class GraphFilterService {
  /**
   * Filter diagrams based on criteria
   *
   * @param diagrams - Array of all diagram metadata
   * @param filter - Filter criteria
   * @returns Filtered array of diagram metadata
   */
  static filterDiagrams(diagrams: DiagramMetadata[], filter: GraphFilter): DiagramMetadata[] {
    let filtered = diagrams;

    // Layer filter
    if (filter.layers && filter.layers.length > 0) {
      filtered = filtered.filter((d) => filter.layers!.includes(d.diagramType));
    }

    // Search term filter
    if (filter.searchTerm && filter.searchTerm.trim().length > 0) {
      const searchLower = filter.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.displayName.toLowerCase().includes(searchLower) ||
          d.path.toLowerCase().includes(searchLower)
      );
    }

    // Connection filter
    if (filter.connectionFilter && filter.connectionFilter !== 'all') {
      filtered = this.applyConnectionFilter(
        filtered,
        diagrams, // Need full list for counting relationships
        filter.connectionFilter,
        filter.connectedToDiagram,
        filter.minConnections
      );
    }

    return filtered;
  }

  /**
   * Apply connection-based filtering
   *
   * @param diagrams - Diagrams to filter
   * @param allDiagrams - Full list of diagrams (for relationship counting)
   * @param filterType - Type of connection filter
   * @param connectedToDiagram - Diagram path for 'connected-to' filter
   * @param minConnections - Minimum connections for 'hub' filter
   * @returns Filtered diagrams
   * @private
   */
  private static applyConnectionFilter(
    diagrams: DiagramMetadata[],
    allDiagrams: DiagramMetadata[],
    filterType: 'isolated' | 'hub' | 'connected-to',
    connectedToDiagram?: string,
    minConnections: number = 5
  ): DiagramMetadata[] {
    switch (filterType) {
      case 'isolated':
        // Show only diagrams with no connections
        return diagrams.filter((d) => {
          const { parentCount, childCount } = countRelationships(d.path, allDiagrams);
          return parentCount === 0 && childCount === 0;
        });

      case 'hub':
        // Show only diagrams with many connections (default: >= 5)
        return diagrams.filter((d) => {
          const { parentCount, childCount } = countRelationships(d.path, allDiagrams);
          return parentCount + childCount >= minConnections;
        });

      case 'connected-to':
        // Show only diagrams connected to a specific diagram
        if (!connectedToDiagram) {
          console.warn('BAC4: connected-to filter requires connectedToDiagram parameter');
          return diagrams;
        }

        return diagrams.filter((d) => {
          // Include the target diagram itself
          if (d.path === connectedToDiagram) {
            return true;
          }

          // Check if this diagram links to the target
          if (d.linkedDiagramPaths.includes(connectedToDiagram)) {
            return true;
          }

          // Check if target links to this diagram
          const targetDiagram = allDiagrams.find((ad) => ad.path === connectedToDiagram);
          if (targetDiagram && targetDiagram.linkedDiagramPaths.includes(d.path)) {
            return true;
          }

          return false;
        });

      default:
        return diagrams;
    }
  }

  /**
   * Get count of diagrams by layer
   *
   * Useful for showing layer distribution statistics.
   *
   * @param diagrams - Array of diagram metadata
   * @returns Map of layer to count
   */
  static getLayerDistribution(diagrams: DiagramMetadata[]): Map<DiagramType, number> {
    const distribution = new Map<DiagramType, number>();

    diagrams.forEach((d) => {
      const count = distribution.get(d.diagramType) || 0;
      distribution.set(d.diagramType, count + 1);
    });

    return distribution;
  }

  /**
   * Get statistics about diagram connections
   *
   * @param diagrams - Array of diagram metadata
   * @returns Connection statistics
   */
  static getConnectionStatistics(diagrams: DiagramMetadata[]): {
    mostConnected: DiagramMetadata | null;
    mostConnections: number;
    isolatedCount: number;
    averageConnections: number;
  } {
    let mostConnected: DiagramMetadata | null = null;
    let mostConnections = 0;
    let isolatedCount = 0;
    let totalConnections = 0;

    diagrams.forEach((d) => {
      const { parentCount, childCount } = countRelationships(d.path, diagrams);
      const connections = parentCount + childCount;

      totalConnections += connections;

      if (connections === 0) {
        isolatedCount++;
      }

      if (connections > mostConnections) {
        mostConnections = connections;
        mostConnected = d;
      }
    });

    const averageConnections = diagrams.length > 0 ? totalConnections / diagrams.length : 0;

    return {
      mostConnected,
      mostConnections,
      isolatedCount,
      averageConnections,
    };
  }
}
