/**
 * Diagram Actions Component
 *
 * Action buttons for diagram operations (rename, delete).
 * Displays rename and delete buttons with appropriate states and permissions.
 *
 * @module DiagramActions
 */

import * as React from 'react';
import { Node } from 'reactflow';
import { ToolbarButton } from './ToolbarButton';
import { SPACING } from '../../../../constants';

export interface DiagramActionsProps {
  /** Currently selected node (null if none selected) */
  selectedNode: Node | null;
  /** Delete node callback */
  onDeleteNode: () => void;
  /** Optional rename diagram callback */
  onRenameDiagram?: () => void;
}

/**
 * Diagram action buttons (rename, delete)
 *
 * @example
 * ```tsx
 * <DiagramActions
 *   selectedNode={selectedNode}
 *   onDeleteNode={() => handleDelete()}
 *   onRenameDiagram={() => handleRename()}
 * />
 * ```
 */
export const DiagramActions: React.FC<DiagramActionsProps> = ({
  selectedNode,
  onDeleteNode,
  onRenameDiagram,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.tight }}>
      {/* Rename Diagram Button */}
      {onRenameDiagram && (
        <ToolbarButton
          icon="✏️"
          label="Rename"
          onClick={onRenameDiagram}
          title="Rename this diagram"
        />
      )}

      {/* Delete Node Button */}
      <ToolbarButton
        icon="🗑️"
        label="Delete"
        onClick={onDeleteNode}
        disabled={!selectedNode}
        variant="danger"
        title={selectedNode ? `Delete node: ${selectedNode.data.label}` : 'Select a node to delete'}
      />
    </div>
  );
};
