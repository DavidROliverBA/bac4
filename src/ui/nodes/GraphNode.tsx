/**
 * GraphNode Component
 *
 * Represents a diagram in the graph view (meta-diagram).
 * Shows diagram name, type, and parent/child counts.
 * Double-click to navigate to the diagram.
 *
 * @module GraphNode
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import type { GraphNodeData } from '../../types/canvas-types';
import { NodeChangeBadge } from '../components/ChangeBadge';

const DEFAULT_COLOR = '#E91E63'; // Pink color for graph nodes

/**
 * Graph node for displaying diagram relationships
 */
export const GraphNode: React.FC<NodeProps<GraphNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_COLOR;

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Map diagram type to display label
  const typeLabel = {
    market: 'Market',
    organisation: 'Organisation',
    capability: 'Capability',
    context: 'Context',
    container: 'Container',
    component: 'Component',
    code: 'Code',
    wardley: 'Wardley',
  }[data.diagramType];

  return (
    <div
      style={{
        minWidth: '160px',
        maxWidth: '180px',
        padding: '12px',
        borderRadius: BORDER_RADIUS.normal,
        border: `2px solid ${color}`,
        textAlign: 'center',
        backgroundColor: hexToRgba(color, 0.1),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.small,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
          : '0 1.5px 3px rgba(0,0,0,0.12)',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {data.changeIndicator && <NodeChangeBadge changeType={data.changeIndicator} />}

      {/* Handles on all four sides - both source and target for flexible routing */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: color, width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: color, width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: color, width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: color, width: '10px', height: '10px' }}
      />

      {/* Diagram name */}
      <div
        style={{
          fontWeight: 600,
          fontSize: FONT_SIZES.medium,
          marginBottom: SPACING.tiny,
          wordWrap: 'break-word',
          color: UI_COLORS.textNormal,
        }}
      >
        {data.label}
      </div>

      {/* Diagram type badge */}
      <div
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          background: hexToRgba(color, 0.2),
          borderRadius: BORDER_RADIUS.small,
          fontSize: FONT_SIZES.extraSmall,
          fontWeight: 600,
          color: color,
          marginBottom: SPACING.small,
        }}
      >
        {typeLabel}
      </div>

      {/* Parent/Child counts */}
      {(data.parentCount !== undefined || data.childCount !== undefined) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: SPACING.small,
            fontSize: FONT_SIZES.extraSmall,
            color: UI_COLORS.textMuted,
          }}
        >
          {data.parentCount !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>↑</span>
              <span>{data.parentCount}</span>
            </div>
          )}
          {data.childCount !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>↓</span>
              <span>{data.childCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
