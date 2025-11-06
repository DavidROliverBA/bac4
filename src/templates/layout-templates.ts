/**
 * Layout Templates
 *
 * Pre-configured layout templates for common view types.
 * Used when creating new layouts to provide sensible defaults.
 *
 * @version 2.6.0
 */

import { ViewType, GraphConfig, LayoutAlgorithm } from '../types/bac4-v2-types';

export interface LayoutTemplate {
  viewType: ViewType;
  displayName: string;
  description: string;
  icon: string;
  config: GraphConfig;
}

export const LAYOUT_TEMPLATES: Record<ViewType, LayoutTemplate> = {
  'c4-context': {
    viewType: 'c4-context',
    displayName: 'C4 Context View',
    description: 'Traditional C4 Context diagram with hierarchical layout',
    icon: '🏢',
    config: {
      layoutAlgorithm: 'hierarchical',
      gridEnabled: true,
      showMinimap: true,
      gridSize: 20,
      snapToGrid: true,
      nodeSpacing: { x: 200, y: 150 },
      axisLabels: undefined,
    },
  },

  'c4-container': {
    viewType: 'c4-container',
    displayName: 'C4 Container View',
    description: 'C4 Container diagram grouped by system boundaries',
    icon: '📦',
    config: {
      layoutAlgorithm: 'hierarchical',
      gridEnabled: true,
      showMinimap: true,
      gridSize: 15,
      snapToGrid: true,
      nodeSpacing: { x: 180, y: 120 },
      axisLabels: undefined,
    },
  },

  'c4-component': {
    viewType: 'c4-component',
    displayName: 'C4 Component View',
    description: 'Detailed C4 Component diagram with compact layout',
    icon: '🧩',
    config: {
      layoutAlgorithm: 'hierarchical',
      gridEnabled: true,
      showMinimap: false,
      gridSize: 10,
      snapToGrid: true,
      nodeSpacing: { x: 150, y: 100 },
      axisLabels: undefined,
    },
  },

  wardley: {
    viewType: 'wardley',
    displayName: 'Wardley Map',
    description: 'Wardley Map with evolution and visibility axes',
    icon: '📈',
    config: {
      layoutAlgorithm: 'manual',
      gridEnabled: false,
      showMinimap: false,
      gridSize: 20,
      snapToGrid: false,
      nodeSpacing: { x: 150, y: 100 },
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
    },
  },

  custom: {
    viewType: 'custom',
    displayName: 'Custom Layout',
    description: 'Blank canvas for custom layouts',
    icon: '✨',
    config: {
      layoutAlgorithm: 'manual',
      gridEnabled: true,
      showMinimap: true,
      gridSize: 20,
      snapToGrid: false,
      nodeSpacing: { x: 200, y: 150 },
      axisLabels: undefined,
    },
  },
};

/**
 * Get template for a view type
 */
export function getLayoutTemplate(viewType: ViewType): LayoutTemplate {
  return LAYOUT_TEMPLATES[viewType] || LAYOUT_TEMPLATES.custom;
}

/**
 * Get all available templates
 */
export function getAllLayoutTemplates(): LayoutTemplate[] {
  return Object.values(LAYOUT_TEMPLATES);
}

/**
 * Get template by display name
 */
export function getLayoutTemplateByName(
  displayName: string
): LayoutTemplate | undefined {
  return Object.values(LAYOUT_TEMPLATES).find(
    (template) => template.displayName === displayName
  );
}

/**
 * Suggest template based on diagram type
 */
export function suggestTemplate(diagramType: string): LayoutTemplate {
  switch (diagramType) {
    case 'context':
      return LAYOUT_TEMPLATES['c4-context'];
    case 'container':
      return LAYOUT_TEMPLATES['c4-container'];
    case 'component':
      return LAYOUT_TEMPLATES['c4-component'];
    case 'wardley':
      return LAYOUT_TEMPLATES.wardley;
    default:
      return LAYOUT_TEMPLATES.custom;
  }
}
