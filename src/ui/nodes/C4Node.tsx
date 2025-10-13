import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  SHADOWS,
  NODE_DIMENSIONS,
  C4_TYPE_COLORS,
} from '../../constants';

/**
 * C4 Node Data Interface
 */
export interface C4NodeData {
  label: string;
  type: 'context' | 'container' | 'component';
  technology?: string;
  description?: string;
  color?: string;
}

/**
 * C4 Node Component
 * Custom node for C4 architecture diagrams
 */
export const C4Node: React.FC<NodeProps<C4NodeData>> = ({ data, selected }) => {
  const color = data.color || C4_TYPE_COLORS[data.type];

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getNodeStyles = () => {
    return {
      padding: SPACING.padding.card,
      borderRadius: BORDER_RADIUS.normal,
      border: 'none',
      minWidth: NODE_DIMENSIONS.minWidth,
      maxWidth: NODE_DIMENSIONS.maxWidth,
      textAlign: 'center' as const,
      backgroundColor: hexToRgba(color, 0.2),
      color: UI_COLORS.textNormal,
      fontFamily: 'var(--font-interface)',
      fontSize: FONT_SIZES.small,
      boxShadow: selected ? `0 0 0 3px ${UI_COLORS.interactiveAccent}` : '0 1px 4px rgba(0,0,0,0.15)',
    };
  };

  return (
    <div style={getNodeStyles()}>
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div style={{ fontWeight: 600, marginBottom: SPACING.tiny, fontSize: FONT_SIZES.small }}>
        {data.label}
      </div>

      {data.technology && (
        <div style={{ fontSize: FONT_SIZES.tiny, color: UI_COLORS.textMuted, marginBottom: SPACING.tiny }}>
          [{data.technology}]
        </div>
      )}

      {data.description && (
        <div style={{ fontSize: FONT_SIZES.tiny, color: UI_COLORS.textMuted, marginTop: SPACING.small }}>
          {data.description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
};
