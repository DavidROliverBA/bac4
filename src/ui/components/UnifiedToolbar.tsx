/**
 * Unified Horizontal Toolbar
 *
 * Combines diagram type selector, node creation buttons, and diagram actions.
 * Refactored to use composable components from toolbar/components.
 *
 * v0.6.0: Removed breadcrumbs (use Obsidian's back/forward navigation instead)
 *
 * @module UnifiedToolbar
 */

import * as React from 'react';
import { Node } from 'reactflow';
import { SPACING, UI_COLORS } from '../../constants';
import { DiagramTypeSelector } from './toolbar/components/DiagramTypeSelector';
import { NodeCreationButtons } from './toolbar/components/NodeCreationButtons';
import { AnnotationButtons } from './toolbar/components/AnnotationButtons';
import { ExportMenu } from './toolbar/components/ExportMenu';
import { DiagramActions } from './toolbar/components/DiagramActions';
import { useExport } from './toolbar/hooks/useExport';
import type { Timeline } from '../../types/timeline';
import type { AnnotationType } from './AnnotationPalette';

export interface UnifiedToolbarProps {
  /** Current diagram type */
  currentType: 'context' | 'container' | 'component';
  /** Callback when diagram type changes */
  onTypeChange: (newType: 'context' | 'container' | 'component') => void;
  /** Callback when node should be added */
  onAddNode: (nodeType: string, nodeData: Record<string, unknown>) => void;
  /** Callback when annotation should be added */
  onAddAnnotation: (type: AnnotationType) => void;
  /** Currently selected node */
  selectedNode: Node | null;
  /** Currently selected annotation ID */
  selectedAnnotationId: string | null;
  /** Delete selected node */
  onDeleteNode: () => void;
  /** Delete selected annotation */
  onDeleteAnnotation: () => void;
  /** Optional callback to rename diagram */
  onRenameDiagram?: () => void;
  /** Optional callback to add timeline snapshot */
  onAddSnapshot?: () => void;
  /** Diagram name for export filename */
  diagramName?: string;
  /** Timeline for export watermark (v1.0.0) */
  timeline?: Timeline | null;
}

/**
 * Vertical divider for toolbar sections
 */
const Divider: React.FC = () => (
  <div
    style={{
      width: '1px',
      height: '24px',
      background: UI_COLORS.border,
    }}
  />
);

/**
 * Unified toolbar with diagram controls and actions
 *
 * v0.6.0: Removed breadcrumbs - use Obsidian's back/forward buttons instead
 *
 * @example
 * ```tsx
 * <UnifiedToolbar
 *   currentType="context"
 *   onTypeChange={setDiagramType}
 *   onAddNode={handleAddNode}
 *   selectedNode={selectedNode}
 *   onDeleteNode={handleDeleteNode}
 *   onRenameDiagram={handleRenameDiagram}
 *   diagramName="my-diagram"
 * />
 * ```
 */
export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  currentType,
  onTypeChange,
  onAddNode,
  onAddAnnotation,
  selectedNode,
  selectedAnnotationId,
  onDeleteNode,
  onDeleteAnnotation,
  onRenameDiagram,
  onAddSnapshot,
  diagramName = 'diagram',
  timeline,
}) => {
  const { handleExport, isExporting } = useExport({ diagramName, timeline });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.gap.wide,
        padding: SPACING.padding.section,
        background: UI_COLORS.backgroundSecondary,
        borderBottom: `1px solid ${UI_COLORS.border}`,
        flexWrap: 'wrap',
      }}
    >
      {/* Diagram Type Selector */}
      <DiagramTypeSelector currentType={currentType} onTypeChange={onTypeChange} />

      <Divider />

      {/* Node Creation Buttons */}
      <NodeCreationButtons diagramType={currentType} onAddNode={onAddNode} />

      <Divider />

      {/* Annotation Buttons */}
      <AnnotationButtons onAddAnnotation={onAddAnnotation} />

      {/* Spacer to push actions to the right */}
      <div style={{ flex: 1 }} />

      {/* Diagram Actions - Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.tight }}>
        <DiagramActions
          selectedNode={selectedNode}
          selectedAnnotationId={selectedAnnotationId}
          onDeleteNode={onDeleteNode}
          onDeleteAnnotation={onDeleteAnnotation}
          onRenameDiagram={onRenameDiagram}
        />

        {/* Add Snapshot Button - Always visible */}
        {onAddSnapshot && (
          <button
            onClick={onAddSnapshot}
            title="Add timeline snapshot (capture current diagram state)"
            style={{
              padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
              fontSize: '11px',
              borderRadius: '4px',
              border: `1px solid ${UI_COLORS.border}`,
              backgroundColor: UI_COLORS.interactiveAccent,
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            📸 Snapshot
          </button>
        )}

        <ExportMenu onExport={handleExport} isExporting={isExporting} />
      </div>
    </div>
  );
};
