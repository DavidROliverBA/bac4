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
  /** Currently selected annotation ID (null if none selected) */
  selectedAnnotationId: string | null;
  /** Delete node callback */
  onDeleteNode: () => void;
  /** Delete annotation callback */
  onDeleteAnnotation: () => void;
  /** Optional rename diagram callback */
  onRenameDiagram?: () => void;
  /** Bring node forward (increase z-index) */
  onBringNodeForward?: () => void;
  /** Send node backward (decrease z-index) */
  onSendNodeBackward?: () => void;
}

/**
 * Diagram action buttons (rename, delete)
 *
 * @example
 * ```tsx
 * <DiagramActions
 *   selectedNode={selectedNode}
 *   selectedAnnotationId={selectedAnnotationId}
 *   onDeleteNode={() => handleDeleteNode()}
 *   onDeleteAnnotation={() => handleDeleteAnnotation()}
 *   onRenameDiagram={() => handleRename()}
 * />
 * ```
 */
export const DiagramActions: React.FC<DiagramActionsProps> = ({
  selectedNode,
  selectedAnnotationId,
  onDeleteNode,
  onDeleteAnnotation,
  onRenameDiagram,
  onBringNodeForward,
  onSendNodeBackward,
}) => {
  // Determine what's selected and what to delete
  const hasSelection = selectedNode || selectedAnnotationId;
  const isNodeSelected = !!selectedNode;
  const isAnnotationSelected = !!selectedAnnotationId;

  // Prepare delete button properties
  const handleDelete = () => {
    console.log('BAC4: DiagramActions handleDelete called');
    console.log(
      'BAC4: isNodeSelected =',
      isNodeSelected,
      ', isAnnotationSelected =',
      isAnnotationSelected
    );

    if (isNodeSelected) {
      console.log('BAC4: Calling onDeleteNode()');
      onDeleteNode();
    } else if (isAnnotationSelected) {
      console.log('BAC4: Calling onDeleteAnnotation()');
      onDeleteAnnotation();
    } else {
      console.log('BAC4: ❌ Nothing selected, no action taken');
    }
  };

  const getDeleteTitle = () => {
    if (isNodeSelected) {
      return `Delete node: ${selectedNode.data.label}`;
    }
    if (isAnnotationSelected) {
      return `Delete annotation`;
    }
    return 'Select a node or annotation to delete';
  };

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

      {/* Z-Order Controls - only show when node selected */}
      {isNodeSelected && onBringNodeForward && (
        <ToolbarButton
          icon="⬆️"
          label="Forward"
          onClick={onBringNodeForward}
          title="Bring node forward (increase z-index)"
        />
      )}
      {isNodeSelected && onSendNodeBackward && (
        <ToolbarButton
          icon="⬇️"
          label="Backward"
          onClick={onSendNodeBackward}
          title="Send node backward (decrease z-index)"
        />
      )}

      {/* Delete Button - works for both nodes and annotations */}
      <ToolbarButton
        icon="🗑️"
        label="Delete"
        onClick={handleDelete}
        disabled={!hasSelection}
        variant="danger"
        title={getDeleteTitle()}
      />
    </div>
  );
};
