/**
 * Cloud Component Node
 * Custom node for cloud service components (AWS, Azure, GCP, SaaS)
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { CloudComponentNodeData } from '../../types/canvas-types';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS, NODE_DIMENSIONS } from '../../constants';

/**
 * Cloud Component Node Component
 */
export const CloudComponentNode: React.FC<NodeProps<CloudComponentNodeData>> = ({
  data,
  selected,
}) => {
  // Default colors by provider
  const providerColors: Record<string, string> = {
    aws: '#FF9900',
    azure: '#0078D4',
    gcp: '#4285F4',
    saas: '#7C3AED',
  };

  const color = data.color || providerColors[data.provider || 'saas'] || '#7C3AED';

  const getNodeStyles = () => {
    // Convert hex to rgba with alpha
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const baseStyles = {
      padding: SPACING.padding.card,
      borderRadius: BORDER_RADIUS.normal,
      border: 'none',
      minWidth: NODE_DIMENSIONS.minWidth,
      maxWidth: NODE_DIMENSIONS.maxWidth,
      textAlign: 'center' as const,
      backgroundColor: hexToRgba(color, 0.15),
      color: UI_COLORS.textNormal,
      fontFamily: UI_COLORS.fontInterface,
      fontSize: FONT_SIZES.small,
      boxShadow: selected
        ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
        : '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative' as const,
    };

    return baseStyles;
  };

  const providerBadgeStyles = {
    position: 'absolute' as const,
    top: SPACING.tiny,
    right: SPACING.tiny,
    fontSize: '7px',
    padding: '2px 4px',
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: color,
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  };

  const componentTypeBadgeStyles = {
    position: 'absolute' as const,
    top: SPACING.tiny,
    left: SPACING.tiny,
    fontSize: '7px',
    padding: '2px 4px',
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: color,
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  };

  return (
    <div style={getNodeStyles()}>
      {/* Connection handles - all four sides */}
      <Handle type="target" position={Position.Top} id="top" style={{ background: color }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: color }} />

      {/* Component Type badge (left side) */}
      {data.componentType && (
        <div style={componentTypeBadgeStyles}>{data.componentType}</div>
      )}

      {/* Provider badge (right side) */}
      <div style={providerBadgeStyles}>{data.provider || 'CLOUD'}</div>

      {/* Component name */}
      <div
        style={{
          fontWeight: 600,
          marginBottom: SPACING.tiny,
          marginTop: SPACING.medium,
          fontSize: FONT_SIZES.small,
        }}
      >
        {data.label}
      </div>

      {/* Component category */}
      {data.category && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
            fontStyle: 'italic',
          }}
        >
          {data.category}
        </div>
      )}

      {/* Properties */}
      {data.properties && Object.keys(data.properties).length > 0 && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
            marginTop: SPACING.small,
            borderTop: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            paddingTop: SPACING.tiny,
          }}
        >
          {Object.entries(data.properties)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key}>
                {key}: {String(value)}
              </div>
            ))}
        </div>
      )}

      {/* Notes indicator */}
      {data.notes && (
        <div
          style={{
            position: 'absolute',
            bottom: SPACING.tiny,
            left: SPACING.tiny,
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
          }}
        >
          📝
        </div>
      )}

      <Handle type="source" position={Position.Right} id="right" style={{ background: color }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: color }} />
    </div>
  );
};
