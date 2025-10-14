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
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import { DiagramTypeSelector } from './toolbar/components/DiagramTypeSelector';
import { NodeCreationButtons } from './toolbar/components/NodeCreationButtons';
import { ExportMenu } from './toolbar/components/ExportMenu';
import { DiagramActions } from './toolbar/components/DiagramActions';
import { useExport } from './toolbar/hooks/useExport';

export interface UnifiedToolbarProps {
  /** Current diagram type */
  currentType: 'context' | 'container' | 'component';
  /** Callback when diagram type changes */
  onTypeChange: (newType: 'context' | 'container' | 'component') => void;
  /** Callback when node should be added */
  onAddNode: (nodeType: string, nodeData: Record<string, unknown>) => void;
  /** Currently selected node */
  selectedNode: Node | null;
  /** Delete selected node */
  onDeleteNode: () => void;
  /** Optional callback to rename diagram */
  onRenameDiagram?: () => void;
  /** Diagram name for export filename */
  diagramName?: string;
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
  selectedNode,
  onDeleteNode,
  onRenameDiagram,
  diagramName = 'diagram',
}) => {
  const { handleExport, isExporting } = useExport({ diagramName });

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

      {/* Spacer to push actions to the right */}
      <div style={{ flex: 1 }} />

      {/* Diagram Actions - Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.tight }}>
        <DiagramActions
          selectedNode={selectedNode}
          onDeleteNode={onDeleteNode}
          onRenameDiagram={onRenameDiagram}
        />

        <ExportMenu onExport={handleExport} isExporting={isExporting} />
      </div>
    </div>
  );
};
