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
import type { DiagramType } from '../../../../types/canvas-types';

export interface NodeTool {
  type: string;
  label: string;
  data: Record<string, unknown>;
}

export interface NodeCreationButtonsProps {
  /** Current diagram type */
  diagramType: DiagramType;
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
 * v2.0.0: Added Market, Organisation, and Code layers
 *
 * @param diagramType - Current diagram type
 * @returns Array of node tool definitions
 */
function getTools(diagramType: DiagramType): NodeTool[] {
  switch (diagramType) {
    case 'market':
      // Layer 1: Market segments, customer types, trends
      return [
        {
          type: 'market',
          label: '+ Market',
          data: { label: 'New Market Segment' },
        },
      ];
    case 'organisation':
      // Layer 2: Business units, departments, teams
      return [
        {
          type: 'organisation',
          label: '+ Organisation',
          data: { label: 'New Business Unit' },
        },
      ];
    case 'capability':
      // Layer 3: Business/technical capabilities
      return [
        {
          type: 'capability',
          label: '+ Capability',
          data: { label: 'New Capability', width: 180, height: 100 },
        },
      ];
    case 'context':
      // Layer 4: C4 Level 1 - System landscape
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
      // Layer 5: C4 Level 2 - Technical containers
      return [
        {
          type: 'container',
          label: '+ Container',
          data: { label: 'New Container', icon: 'box', type: '' },
        },
      ];
    case 'component':
      // Layer 6: C4 Level 3 - Internal components
      return [
        {
          type: 'c4',
          label: '+ Component',
          data: { label: 'New Component', type: 'component' },
        },
      ];
    case 'code':
      // Layer 7: Implementation artifacts
      return [
        {
          type: 'code',
          label: '+ Code',
          data: { label: 'New Code Artifact', codeType: 'file' },
        },
      ];
    case 'graph':
      // Graph nodes are auto-generated from existing diagrams, not manually created
      return [];
    default:
      return [];
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
