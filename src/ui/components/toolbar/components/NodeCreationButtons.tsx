/**
 * Node Creation Buttons Component
 *
 * Displays appropriate node creation buttons based on the current diagram type.
 * Buttons support both click-to-add and drag-and-drop functionality.
 *
 * @module NodeCreationButtons
 */

import * as React from 'react';
import { SPACING } from '../../../../constants';
import { ToolbarButton } from './ToolbarButton';

export interface NodeTool {
  type: string;
  label: string;
  data: Record<string, unknown>;
}

export interface NodeCreationButtonsProps {
  /** Current diagram type */
  diagramType: 'context' | 'container' | 'component';
  /** Callback when node should be added */
  onAddNode: (nodeType: string, nodeData: Record<string, unknown>) => void;
}

// <AI_MODIFIABLE>
/**
 * Get available node tools for the current diagram type
 *
 * Add new diagram types and their corresponding node tools here.
 * Follow the existing pattern for consistency.
 *
 * @param diagramType - Current diagram type
 * @returns Array of node tool definitions
 */
function getTools(diagramType: 'context' | 'container' | 'component'): NodeTool[] {
  switch (diagramType) {
    case 'context':
      return [
        { type: 'system', label: '+ System', data: { label: 'New System', external: false } },
        { type: 'person', label: '+ Person', data: { label: 'New User' } },
        {
          type: 'system',
          label: '+ External',
          data: { label: 'External System', external: true },
        },
      ];
    case 'container':
      return [
        {
          type: 'container',
          label: '+ Container',
          data: { label: 'New Container', icon: 'box', type: '' },
        },
      ];
    case 'component':
      return [
        {
          type: 'c4',
          label: '+ Component',
          data: { label: 'New Component', type: 'component' },
        },
      ];
    // Add new diagram types here:
    // case 'yourDiagramType':
    //   return [
    //     { type: 'yourNodeType', label: '+ Your Node', data: { label: 'New Node' } },
    //   ];
  }
}
// </AI_MODIFIABLE>

/**
 * Node creation buttons with drag-and-drop support
 *
 * @example
 * ```tsx
 * <NodeCreationButtons
 *   diagramType="context"
 *   onAddNode={(type, data) => addNode(type, data)}
 * />
 * ```
 */
export const NodeCreationButtons: React.FC<NodeCreationButtonsProps> = ({
  diagramType,
  onAddNode,
}) => {
  const tools = getTools(diagramType);

  const handleDragStart = (event: React.DragEvent, tool: NodeTool) => {
    event.dataTransfer.setData(
      'application/bac4node',
      JSON.stringify({ type: tool.type, data: tool.data })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ display: 'flex', gap: SPACING.gap.tight, flexWrap: 'wrap' }}>
      {tools.map((tool) => (
        <ToolbarButton
          key={tool.label}
          label={tool.label}
          onClick={() => onAddNode(tool.type, tool.data)}
          title={`Add ${tool.label} (click or drag)`}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, tool)}
        />
      ))}
    </div>
  );
};
