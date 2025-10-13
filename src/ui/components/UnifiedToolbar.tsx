/**
 * Unified Horizontal Toolbar
 *
 * Combines diagram type selector, node creation buttons, breadcrumbs, and diagram actions.
 * Refactored to use composable components from toolbar/components.
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
  /** Breadcrumb navigation items */
  breadcrumbs: Array<{ label: string; path: string; type: string }>;
  /** Current diagram path */
  currentPath: string;
  /** Navigate to different diagram */
  onNavigate: (path: string) => void;
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
 * Unified toolbar with diagram controls, breadcrumbs, and actions
 *
 * @example
 * ```tsx
 * <UnifiedToolbar
 *   currentType="context"
 *   onTypeChange={setDiagramType}
 *   onAddNode={handleAddNode}
 *   breadcrumbs={breadcrumbs}
 *   currentPath={currentPath}
 *   onNavigate={handleNavigate}
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
  breadcrumbs,
  currentPath,
  onNavigate,
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

      {/* Breadcrumbs (if present) */}
      {breadcrumbs.length > 0 && (
        <>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.tight, flex: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && (
                  <span style={{ color: UI_COLORS.textMuted, fontSize: FONT_SIZES.small }}>→</span>
                )}
                <button
                  onClick={() => crumb.path !== currentPath && onNavigate(crumb.path)}
                  disabled={crumb.path === currentPath}
                  style={{
                    padding: SPACING.padding.button,
                    background:
                      crumb.path === currentPath ? UI_COLORS.backgroundPrimaryAlt : 'transparent',
                    border: 'none',
                    borderRadius: BORDER_RADIUS.normal,
                    color: crumb.path === currentPath ? UI_COLORS.textNormal : UI_COLORS.textAccent,
                    cursor: crumb.path === currentPath ? 'default' : 'pointer',
                    fontSize: FONT_SIZES.small,
                    fontWeight: crumb.path === currentPath ? 600 : 500,
                    textDecoration: crumb.path === currentPath ? 'none' : 'underline',
                  }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      {/* Spacer to push actions to the right */}
      {breadcrumbs.length === 0 && <div style={{ flex: 1 }} />}

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
