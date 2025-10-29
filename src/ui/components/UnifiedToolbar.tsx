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
import { LayoutSelector } from './LayoutSelector';
import type { Timeline } from '../../types/timeline';
import type { DiagramType } from '../../types/canvas-types';
import type { AnnotationType } from './AnnotationPalette';
import type { LayoutInfo } from '../../services/layout-manager-service';

export interface UnifiedToolbarProps {
  /** Current diagram type */
  currentType: DiagramType;
  /** Callback when diagram type changes */
  onTypeChange: (newType: DiagramType) => void;
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
  /** Bring node forward (increase z-index) */
  onBringNodeForward?: () => void;
  /** Send node backward (decrease z-index) */
  onSendNodeBackward?: () => void;
  /** Optional callback to add timeline snapshot */
  onAddSnapshot?: () => void;
  /** Diagram name for export filename */
  diagramName?: string;
  /** File path for React Flow instance ID (v2.6.1 - multi-tab export fix) */
  filePath?: string | null;
  /** Timeline for export watermark (v1.0.0) */
  timeline?: Timeline | null;
  /** Available layouts (v2.6.0) */
  layouts?: LayoutInfo[];
  /** Current layout (v2.6.0) */
  currentLayout?: LayoutInfo | null;
  /** Callback when layout should be switched (v2.6.0) */
  onLayoutSwitch?: (graphPath: string) => void;
  /** Callback to create new layout (v2.6.0) */
  onCreateLayout?: () => void;
  /** Callback to rename layout (v2.6.0) */
  onRenameLayout?: (graphPath: string) => void;
  /** Callback to delete layout (v2.6.0) */
  onDeleteLayout?: (graphPath: string) => void;
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
  onBringNodeForward,
  onSendNodeBackward,
  onAddSnapshot,
  diagramName = 'diagram',
  filePath,
  timeline,
  layouts,
  currentLayout,
  onLayoutSwitch,
  onCreateLayout,
  onRenameLayout,
  onDeleteLayout,
}) => {
  // Generate React Flow ID for multi-tab export support (v2.6.1)
  const reactFlowId = React.useMemo(
    () => (filePath ? `rf-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : 'rf-default'),
    [filePath]
  );

  const { handleExport, isExporting } = useExport({ diagramName, timeline, reactFlowId });

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

      {/* Layout Selector (v2.6.0 - Multiple Layouts) */}
      {layouts && currentLayout && onLayoutSwitch && onCreateLayout && onRenameLayout && onDeleteLayout && (
        <>
          <Divider />
          <LayoutSelector
            layouts={layouts}
            currentLayout={currentLayout}
            onLayoutSwitch={onLayoutSwitch}
            onCreateLayout={onCreateLayout}
            onRenameLayout={onRenameLayout}
            onDeleteLayout={onDeleteLayout}
          />
        </>
      )}

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
          onBringNodeForward={onBringNodeForward}
          onSendNodeBackward={onSendNodeBackward}
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
