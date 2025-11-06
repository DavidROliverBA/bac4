/**
 * Capability Node - For Capability Diagrams
 * Represents business or technical capabilities with flexible styling and linking
 *
 * Features:
 * - Color customization
 * - Resizable (custom width and height)
 * - Links to markdown documents
 * - Links to component, container, or context diagrams
 */

import * as React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import type { CapabilityNodeData } from '../../types/canvas-types';
import { NodeChangeBadge } from '../components/ChangeBadge';

// Default values
const DEFAULT_COLOR = '#9B59B6';
const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 100;

export const CapabilityNode: React.FC<NodeProps<CapabilityNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_COLOR;
  const width = data.width || DEFAULT_WIDTH;
  const height = data.height || DEFAULT_HEIGHT;

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      {/* Node Resizer - allows interactive resizing */}
      <NodeResizer color={color} isVisible={selected} minWidth={120} minHeight={60} />

      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          padding: '12px 16px',
          borderRadius: BORDER_RADIUS.normal,
          border: 'none',
          textAlign: 'center',
          backgroundColor: hexToRgba(color, 0.2),
          color: UI_COLORS.textNormal,
          fontFamily: UI_COLORS.fontInterface,
          fontSize: FONT_SIZES.small,
          boxShadow: selected
            ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
            : '0 1.5px 3px rgba(0,0,0,0.12)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
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
            fontWeight: 600,
            fontSize: FONT_SIZES.medium,
            marginBottom: data.description ? SPACING.small : 0,
            wordWrap: 'break-word',
            width: '100%',
          }}
        >
          {data.label}
        </div>

        {/* Description */}
        {data.description && (
          <div
            style={{
              fontSize: FONT_SIZES.tiny,
              color: UI_COLORS.textMuted,
              wordWrap: 'break-word',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.description}
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
    </>
  );
};
