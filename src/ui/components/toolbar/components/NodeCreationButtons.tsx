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

/**
 * Get available node tools for the current diagram type
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
          label: '🌐 Web',
          data: { label: 'Web Application', containerType: 'webapp' },
        },
        {
          type: 'container',
          label: '📱 Mobile',
          data: { label: 'Mobile App', containerType: 'mobileapp' },
        },
        {
          type: 'container',
          label: '🔌 API',
          data: { label: 'API Service', containerType: 'api' },
        },
        {
          type: 'container',
          label: '🗄️ DB',
          data: { label: 'Database', containerType: 'database' },
        },
        {
          type: 'container',
          label: '📮 Queue',
          data: { label: 'Message Queue', containerType: 'queue' },
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
  }
}

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
