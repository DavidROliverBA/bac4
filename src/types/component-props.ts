/**
 * Component Props Type Definitions
 *
 * Centralized prop interfaces for all React components in the BAC4 plugin.
 * Ensures type safety and consistency across component APIs.
 *
 * @module component-props
 */

import type { TFile } from 'obsidian';
import type BAC4Plugin from '../main';
import type {
  CanvasNode,
  CanvasEdge,
} from './canvas-types';
import type { ComponentDefinition } from '../../component-library/types';

/**
 * Property Panel props
 */
export interface PropertyPanelProps {
  selectedNode: CanvasNode | null;
  selectedEdge: CanvasEdge | null;
  onNodeUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onEdgeUpdate: (edgeId: string, updates: Partial<CanvasEdge>) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeDelete: (edgeId: string) => void;
  currentDiagramPath: string;
  plugin: BAC4Plugin;
  diagramType: 'context' | 'container' | 'component';
  onDiagramTypeChange?: (newType: 'context' | 'container' | 'component') => void;
}

/**
 * Unified Toolbar props
 */
export interface UnifiedToolbarProps {
  diagramType: 'context' | 'container' | 'component';
  onAddNode: (nodeType: string, nodeData: Record<string, unknown>) => void;
  onExportPNG: () => void;
  onExportJPEG: () => void;
  currentDiagramPath: string;
  plugin: BAC4Plugin;
  onDiagramTypeChange: (newType: 'context' | 'container' | 'component') => void;
  breadcrumbs: BreadcrumbItem[];
  onBreadcrumbClick: (path: string) => void;
  onRenameDiagram: () => void;
  onDeleteDiagram: () => void;
}

/**
 * Component Palette props
 */
export interface ComponentPaletteProps {
  onDragStart: (event: React.DragEvent, component: ComponentDefinition) => void;
  onAddComponent: (component: ComponentDefinition) => void;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  type: 'context' | 'container' | 'component' | 'current' | 'child' | string;
  id?: string;
}

/**
 * Breadcrumbs component props
 */
export interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

/**
 * Diagram Toolbar props
 */
export interface DiagramToolbarProps {
  diagramType: 'context' | 'container' | 'component';
  onAddNode: (nodeType: string, nodeData: Record<string, unknown>) => void;
}

/**
 * Diagram Type Switcher props
 */
export interface DiagramTypeSwitcherProps {
  currentType: 'context' | 'container' | 'component';
  onTypeChange: (newType: 'context' | 'container' | 'component') => void;
  disabled?: boolean;
}

/**
 * Node component base props
 */
export interface NodeComponentProps<T = Record<string, unknown>> {
  id: string;
  data: T;
  selected?: boolean;
  dragging?: boolean;
}

/**
 * Edge component base props
 */
export interface EdgeComponentProps<T = Record<string, unknown>> {
  id: string;
  data: T;
  selected?: boolean;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: 'top' | 'right' | 'bottom' | 'left';
  targetPosition: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Canvas View props
 */
export interface CanvasViewProps {
  file: TFile | null;
  plugin: BAC4Plugin;
}

/**
 * Rename Modal options
 */
export interface RenameModalOptions {
  currentName: string;
  onSubmit: (newName: string) => void;
  onCancel?: () => void;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg';
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Diagram metadata
 */
export interface DiagramMetadata {
  diagramType: 'context' | 'container' | 'component';
  createdAt: string;
  updatedAt: string;
  parentDiagramId?: string;
  parentNodeId?: string;
}
