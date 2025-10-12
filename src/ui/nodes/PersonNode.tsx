/**
 * Person Node - For Context Diagrams (C4 Level 1)
 * Represents a human user or actor
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  DEFAULT_NODE_COLOR,
} from '../../constants';

export interface PersonNodeData {
  label: string;
  role?: string;
  color?: string;
}

export const PersonNode: React.FC<NodeProps<PersonNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_NODE_COLOR;

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '140px',
        padding: SPACING.container,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: '12px', height: '12px' }} />

      {/* Person icon */}
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: hexToRgba(color, 0.3),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: SPACING.extraLarge,
          boxShadow: selected ? `0 0 0 3px ${UI_COLORS.interactiveAccent}` : '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        👤
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: UI_COLORS.fontInterface,
          fontSize: FONT_SIZES.large,
          fontWeight: 600,
          color: UI_COLORS.textNormal,
          textAlign: 'center',
          marginBottom: data.role ? SPACING.small : '0',
        }}
      >
        {data.label}
      </div>

      {/* Role */}
      {data.role && (
        <div
          style={{
            fontSize: FONT_SIZES.medium,
            color: UI_COLORS.textMuted,
            textAlign: 'center',
          }}
        >
          [{data.role}]
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: '12px', height: '12px' }} />
    </div>
  );
};
