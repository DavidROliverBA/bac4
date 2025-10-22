/**
 * Wardley Mapping Type Definitions
 *
 * Types specific to Wardley Mapping functionality in BAC4.
 * Extends the base v2.5.0 format with Wardley-specific properties.
 *
 * @version 2.5.0
 */

import type {
  WardleyProperties,
  EvolutionStage,
  NodeV2,
  BAC4GraphFileV2,
} from './bac4-v2-types';

// ============================================================================
// Wardley Node Data (for React Flow)
// ============================================================================

export interface WardleyNodeData {
  label: string;
  description?: string;
  technology?: string;
  team?: string;
  wardley?: WardleyProperties;
  knowledge?: {
    notes: any[];
    urls: any[];
    attachments: any[];
  };
  metrics?: Record<string, any>;
  links?: {
    linkedDiagrams: any[];
    dependencies: string[];
  };
  color?: string;
}

// ============================================================================
// Wardley Canvas Configuration
// ============================================================================

export interface WardleyCanvasConfig {
  width: number;
  height: number;
  margin: number;
  gridEnabled: boolean;
  gridSize: number;
  showEvolutionStages: boolean;
  showInertiaBarriers: boolean;
  axisLabels: WardleyAxisLabelsConfig;
}

export interface WardleyAxisLabelsConfig {
  x: {
    genesis: string;
    custom: string;
    product: string;
    commodity: string;
  };
  y: {
    top: string;
    bottom: string;
  };
}

export const DEFAULT_WARDLEY_CONFIG: WardleyCanvasConfig = {
  width: 1000,
  height: 800,
  margin: 100,
  gridEnabled: true,
  gridSize: 20,
  showEvolutionStages: true,
  showInertiaBarriers: true,
  axisLabels: {
    x: {
      genesis: 'Genesis',
      custom: 'Custom Built',
      product: 'Product (+rental)',
      commodity: 'Commodity (+utility)',
    },
    y: {
      top: 'Visible',
      bottom: 'Invisible',
    },
  },
};

// ============================================================================
// Wardley Mapping OWM Format (for Import/Export)
// ============================================================================

/**
 * Open Wardley Maps (OWM) format for interoperability
 */
export interface OWMMap {
  title: string;
  evolution?: string[];
  style?: 'wardley' | 'plain';
  components: OWMComponent[];
  anchors?: OWMComponent[];
  markets?: OWMComponent[];
  pipelines?: OWMPipeline[];
  dependencies: OWMDependency[];
  evolutions?: OWMEvolution[];
  notes?: OWMNote[];
  annotations?: OWMAnnotation[];
}

export interface OWMComponent {
  name: string;
  visibility: number; // Y-axis (0-1)
  evolution: number; // X-axis (0-1)
  label?: {
    x: number;
    y: number;
  };
  inertia?: boolean;
}

export interface OWMPipeline {
  name: string;
  visibility: number;
  evolution: number;
}

export interface OWMDependency {
  from: string;
  to: string;
}

export interface OWMEvolution {
  from: string;
  to?: string; // Optional: rename during evolution
  evolution: number; // Target evolution position
}

export interface OWMNote {
  text: string;
  x: number;
  y: number;
}

export interface OWMAnnotation {
  text: string;
  x: number;
  y: number;
}

// ============================================================================
// Wardley Analysis Results
// ============================================================================

export interface WardleyAnalysis {
  componentCount: number;
  dependencyCount: number;
  evolutionDistribution: Record<EvolutionStage, number>;
  visibilityDistribution: {
    visible: number; // visibility > 0.6
    intermediate: number; // 0.3 <= visibility <= 0.6
    invisible: number; // visibility < 0.3
  };
  inertiaComponents: string[];
  strategicRecommendations: StrategyRecommendation[];
}

export interface StrategyRecommendation {
  component: string;
  currentStage: EvolutionStage;
  recommendation: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================================================
// Evolution Tracking
// ============================================================================

export interface EvolutionTracking {
  componentId: string;
  componentLabel: string;
  snapshots: EvolutionSnapshot[];
  totalMovement: number; // Total evolution change
  velocity: number; // Evolution units per time period
  stagnant: boolean; // True if no movement across snapshots
}

export interface EvolutionSnapshot {
  snapshotId: string;
  snapshotLabel: string;
  timestamp: string | null;
  visibility: number;
  evolution: number;
  evolutionStage: EvolutionStage;
}

// ============================================================================
// Build/Buy/Outsource Recommendations
// ============================================================================

export interface BuildBuyDecision {
  component: string;
  evolutionStage: EvolutionStage;
  recommendation: 'build' | 'buy' | 'outsource' | 'commodity';
  reasoning: string;
  considerations: string[];
  estimatedCost?: string;
  timeframe?: string;
}

export const BUILD_BUY_RULES: Record<
  EvolutionStage,
  {
    recommendation: 'build' | 'buy' | 'outsource' | 'commodity';
    reasoning: string;
  }
> = {
  genesis: {
    recommendation: 'build',
    reasoning:
      'Novel and experimental. Custom development required for competitive advantage.',
  },
  custom: {
    recommendation: 'build',
    reasoning:
      'Bespoke solutions needed. Consider build vs buy based on strategic importance.',
  },
  product: {
    recommendation: 'buy',
    reasoning: 'Mature product market. Off-the-shelf solutions available.',
  },
  commodity: {
    recommendation: 'outsource',
    reasoning:
      'Standardized utility. Use managed services or outsource to focus on strategic areas.',
  },
};

// ============================================================================
// Competitive Analysis
// ============================================================================

export interface CompetitiveAnalysis {
  maps: CompetitiveMap[];
  comparisonMatrix: ComparisonMatrix;
  insights: CompetitiveInsight[];
}

export interface CompetitiveMap {
  id: string;
  label: string; // "Our Company" | "Competitor A" | "Competitor B"
  components: Array<{
    name: string;
    visibility: number;
    evolution: number;
  }>;
}

export interface ComparisonMatrix {
  components: string[]; // Unique component names
  positions: Record<
    string,
    {
      // component name
      [mapId: string]: {
        // map id
        visibility: number;
        evolution: number;
      } | null; // null if component doesn't exist in this map
    }
  >;
}

export interface CompetitiveInsight {
  type: 'advantage' | 'disadvantage' | 'parity';
  component: string;
  description: string;
  recommendation?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate build/buy/outsource recommendation
 */
export function generateBuildBuyRecommendation(
  component: NodeV2
): BuildBuyDecision {
  const wardley = component.wardley;
  if (!wardley) {
    throw new Error('Component does not have Wardley properties');
  }

  const rule = BUILD_BUY_RULES[wardley.evolutionStage];

  const considerations: string[] = [];

  // Add stage-specific considerations
  if (wardley.evolutionStage === 'genesis') {
    considerations.push('High risk, high reward');
    considerations.push('Requires R&D investment');
    considerations.push('Potential for competitive differentiation');
  } else if (wardley.evolutionStage === 'custom') {
    considerations.push('Evaluate strategic importance');
    considerations.push('Consider specialist expertise required');
    considerations.push('Assess build vs buy trade-offs');
  } else if (wardley.evolutionStage === 'product') {
    considerations.push('Mature vendor market available');
    considerations.push('Lower risk than custom build');
    considerations.push('Evaluate vendor lock-in');
  } else if (wardley.evolutionStage === 'commodity') {
    considerations.push('Focus resources on strategic areas');
    considerations.push('Use managed services or SaaS');
    considerations.push('Minimize operational overhead');
  }

  // Add inertia consideration
  if (wardley.inertia) {
    considerations.push(`⚠️ Inertia: ${wardley.inertiaReason || 'Resistance to change'}`);
  }

  return {
    component: component.properties.label,
    evolutionStage: wardley.evolutionStage,
    recommendation: rule.recommendation,
    reasoning: rule.reasoning,
    considerations,
  };
}

/**
 * Analyze Wardley Map
 */
export function analyzeWardleyMap(nodes: NodeV2[]): WardleyAnalysis {
  const wardleyNodes = nodes.filter((n) => n.wardley);

  const evolutionDistribution: Record<EvolutionStage, number> = {
    genesis: 0,
    custom: 0,
    product: 0,
    commodity: 0,
  };

  const visibilityDistribution = {
    visible: 0,
    intermediate: 0,
    invisible: 0,
  };

  const inertiaComponents: string[] = [];
  const recommendations: StrategyRecommendation[] = [];

  for (const node of wardleyNodes) {
    const wardley = node.wardley!;

    // Evolution distribution
    evolutionDistribution[wardley.evolutionStage]++;

    // Visibility distribution
    if (wardley.visibility > 0.6) {
      visibilityDistribution.visible++;
    } else if (wardley.visibility >= 0.3) {
      visibilityDistribution.intermediate++;
    } else {
      visibilityDistribution.invisible++;
    }

    // Inertia
    if (wardley.inertia) {
      inertiaComponents.push(node.properties.label);
    }

    // Generate recommendations
    if (wardley.evolutionStage === 'custom' && wardley.evolution > 0.4) {
      recommendations.push({
        component: node.properties.label,
        currentStage: wardley.evolutionStage,
        recommendation: 'Consider productization or purchasing off-the-shelf solution',
        reason: 'Component approaching product stage. Evaluate build vs buy trade-offs.',
        priority: 'medium',
      });
    }

    if (wardley.inertia && wardley.evolutionStage !== 'commodity') {
      recommendations.push({
        component: node.properties.label,
        currentStage: wardley.evolutionStage,
        recommendation: 'Address inertia to enable evolution',
        reason: wardley.inertiaReason || 'Resistance to change blocking evolution',
        priority: 'high',
      });
    }
  }

  return {
    componentCount: wardleyNodes.length,
    dependencyCount: 0, // Calculate from graph file
    evolutionDistribution,
    visibilityDistribution,
    inertiaComponents,
    strategicRecommendations: recommendations,
  };
}

/**
 * Track component evolution across snapshots
 */
export function trackEvolution(
  componentId: string,
  snapshots: Array<{
    id: string;
    label: string;
    timestamp: string | null;
    nodeData: NodeV2;
  }>
): EvolutionTracking {
  const evolutionSnapshots: EvolutionSnapshot[] = snapshots.map((s) => ({
    snapshotId: s.id,
    snapshotLabel: s.label,
    timestamp: s.timestamp,
    visibility: s.nodeData.wardley?.visibility || 0,
    evolution: s.nodeData.wardley?.evolution || 0,
    evolutionStage: s.nodeData.wardley?.evolutionStage || 'custom',
  }));

  const firstEvolution = evolutionSnapshots[0]?.evolution || 0;
  const lastEvolution =
    evolutionSnapshots[evolutionSnapshots.length - 1]?.evolution || 0;
  const totalMovement = lastEvolution - firstEvolution;

  // Calculate velocity (evolution per snapshot)
  const velocity = snapshots.length > 1 ? totalMovement / (snapshots.length - 1) : 0;

  const stagnant = Math.abs(totalMovement) < 0.05; // Less than 5% movement

  return {
    componentId,
    componentLabel: snapshots[0]?.nodeData.properties.label || componentId,
    snapshots: evolutionSnapshots,
    totalMovement,
    velocity,
    stagnant,
  };
}
