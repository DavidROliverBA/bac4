/**
 * Organisation Node - For Organisation Diagrams (Layer 2)
 * Represents business units, departments, and teams
 *
 * v2.0.0: New node type for enterprise architecture Layer 2
 * Features:
 * - Business unit and department hierarchy
 * - Headcount and location display
 * - Links to Capability diagrams (Layer 3)
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import type { OrganisationNodeData } from '../../types/canvas-types';
import { NodeChangeBadge } from '../components/ChangeBadge';

// Default values
const DEFAULT_COLOR = '#3498DB'; // Blue for organisation layer
const DEFAULT_WIDTH = 180;

export const OrganisationNode: React.FC<NodeProps<OrganisationNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_COLOR;

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: BORDER_RADIUS.normal,
        border: `1.5px solid ${color}`,
        minWidth: DEFAULT_WIDTH,
        maxWidth: '240px',
        textAlign: 'center',
        backgroundColor: hexToRgba(color, 0.15),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.small,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
          : '0 2px 5px rgba(0,0,0,0.12)',
        position: 'relative',
      }}
    >
      {/* Change badge (v1.0.0 timeline) */}
      {data.changeIndicator && <NodeChangeBadge changeType={data.changeIndicator} />}

      {/* Cross-reference badge - shows when node exists in multiple diagrams */}
      {data.isReference && data.crossReferences && data.crossReferences.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: UI_COLORS.interactiveAccent,
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
          title={`Shared across ${data.crossReferences.length + 1} diagrams:\n${data.crossReferences.map((path) => path.split('/').pop()?.replace('.bac4', '')).join('\n')}`}
        >
          {data.crossReferences.length + 1}
        </div>
      )}

      {/* Connection handles - all four sides */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: color, width: '12px', height: '12px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: color, width: '12px', height: '12px' }}
      />

      {/* Label */}
      <div
        style={{
          fontWeight: 700,
          fontSize: FONT_SIZES.medium,
          marginBottom: SPACING.small,
          color: color,
        }}
      >
        {data.label}
      </div>

      {/* Business Unit */}
      {data.businessUnit && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
            fontWeight: 600,
          }}
        >
          {data.businessUnit}
        </div>
      )}

      {/* Department */}
      {data.department && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
          }}
        >
          {data.department}
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.small,
            marginBottom: SPACING.small,
            fontStyle: 'italic',
          }}
        >
          {data.description}
        </div>
      )}

      {/* Metadata row: Headcount and Location */}
      {(data.headcount !== undefined || data.location) && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
            marginTop: SPACING.small,
            paddingTop: SPACING.small,
            borderTop: `1px solid ${hexToRgba(color, 0.3)}`,
            display: 'flex',
            justifyContent: 'center',
            gap: SPACING.medium,
          }}
        >
          {data.headcount !== undefined && (
            <span>
              <strong>Team:</strong> {data.headcount}
            </span>
          )}
          {data.location && (
            <span>
              <strong>Location:</strong> {data.location}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: color, width: '12px', height: '12px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: color, width: '12px', height: '12px' }}
      />
    </div>
  );
};
