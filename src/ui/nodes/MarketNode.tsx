/**
 * Market Node - For Market Diagrams (Layer 1)
 * Represents market segments, customer types, and market trends
 *
 * v2.0.0: New node type for enterprise architecture Layer 1
 * Features:
 * - Market size and growth rate display
 * - Competitor tracking
 * - Trend visualization
 * - Links to Organisation diagrams (Layer 2)
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import type { MarketNodeData } from '../../types/canvas-types';
import { NodeChangeBadge } from '../components/ChangeBadge';

// Default values
const DEFAULT_COLOR = '#E74C3C'; // Red for market layer
const DEFAULT_WIDTH = 200;

export const MarketNode: React.FC<NodeProps<MarketNodeData>> = ({ data, selected }) => {
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
        padding: '14px 18px',
        borderRadius: BORDER_RADIUS.large,
        border: `2px solid ${color}`,
        minWidth: DEFAULT_WIDTH,
        maxWidth: '280px',
        textAlign: 'left',
        backgroundColor: hexToRgba(color, 0.1),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.small,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
          : '0 2px 6px rgba(0,0,0,0.15)',
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
          title={`Shared across ${data.crossReferences.length + 1} diagrams:\n${data.crossReferences.map(path => path.split('/').pop()?.replace('.bac4', '')).join('\n')}`}
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

      {/* Market Size */}
      {data.marketSize && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
          }}
        >
          <strong>Size:</strong> {data.marketSize}
        </div>
      )}

      {/* Growth Rate */}
      {data.growthRate && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
          }}
        >
          <strong>Growth:</strong> {data.growthRate}
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.small,
            marginBottom: SPACING.tiny,
            fontStyle: 'italic',
          }}
        >
          {data.description}
        </div>
      )}

      {/* Competitors */}
      {data.competitors && data.competitors.length > 0 && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
            marginTop: SPACING.small,
            paddingTop: SPACING.small,
            borderTop: `1px solid ${hexToRgba(color, 0.3)}`,
          }}
        >
          <strong>Competitors:</strong> {data.competitors.join(', ')}
        </div>
      )}

      {/* Trends */}
      {data.trends && data.trends.length > 0 && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
            marginTop: SPACING.tiny,
          }}
        >
          <strong>Trends:</strong> {data.trends.join(', ')}
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
