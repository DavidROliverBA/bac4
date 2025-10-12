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
      padding: SPACING.padding.node,
      borderRadius: BORDER_RADIUS.large,
      border: 'none',
      minWidth: NODE_DIMENSIONS.minWidth,
      maxWidth: NODE_DIMENSIONS.maxWidth,
      textAlign: 'center' as const,
      backgroundColor: hexToRgba(color, 0.2),
      color: UI_COLORS.textNormal,
      fontFamily: 'var(--font-interface)',
      fontSize: FONT_SIZES.large,
      boxShadow: selected ? `0 0 0 3px ${UI_COLORS.interactiveAccent}` : SHADOWS.normal,
    };
  };

  return (
    <div style={getNodeStyles()}>
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div style={{ fontWeight: 600, marginBottom: SPACING.gap.tiny }}>
        {data.label}
      </div>

      {data.technology && (
        <div style={{ fontSize: FONT_SIZES.normal, color: UI_COLORS.textMuted, marginBottom: SPACING.gap.tiny }}>
          [{data.technology}]
        </div>
      )}

      {data.description && (
        <div style={{ fontSize: FONT_SIZES.small, color: UI_COLORS.textMuted, marginTop: SPACING.gap.normal }}>
          {data.description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
};
