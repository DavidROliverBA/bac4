/**
 * Person Node - For Context Diagrams (C4 Level 1)
 * Represents a human user or actor
 * v0.6.0: Supports linkedMarkdownPath
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, DEFAULT_NODE_COLOR } from '../../constants';
import type { PersonNodeData } from '../../types/canvas-types';

export const PersonNode: React.FC<NodeProps<PersonNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_NODE_COLOR;

  // Determine if node has linked markdown file (v0.6.0)
  const hasLinkedMarkdown = !!data.linkedMarkdownPath;

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
        minWidth: '70px',
        padding: SPACING.large,
        position: 'relative',
      }}
    >
      {/* Connection handles - all four sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: color, width: '12px', height: '12px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: color, width: '12px', height: '12px' }}
      />

      {/* Person icon */}
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: hexToRgba(color, 0.3),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          marginBottom: SPACING.medium,
          boxShadow: selected
            ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
            : '0 2px 4px rgba(0,0,0,0.15)',
          position: 'relative',
        }}
      >
        👤

        {/* Plus icon badge for linked markdown (v0.6.0) */}
        {hasLinkedMarkdown && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              fontSize: '10px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              cursor: 'help',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            title={`Documentation: ${data.linkedMarkdownPath?.split('/').pop()}`}
          >
            +
          </div>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: UI_COLORS.fontInterface,
          fontSize: FONT_SIZES.small,
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
            fontSize: FONT_SIZES.extraSmall,
            color: UI_COLORS.textMuted,
            textAlign: 'center',
          }}
        >
          [{data.role}]
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
