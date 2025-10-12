/**
 * Directional Edge Component
 * Custom edge with direction property (right, left, both)
 */

import * as React from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
} from '../../constants';

export interface DirectionalEdgeData {
  label?: string;
  direction?: 'right' | 'left' | 'both';
}

export const DirectionalEdge: React.FC<EdgeProps<DirectionalEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}) => {
  const direction = data?.direction || 'right';

  // Calculate path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Define marker configuration based on direction
  const getMarkers = () => {
    switch (direction) {
      case 'right':
        return {
          markerEnd: 'url(#arrow-end)',
          markerStart: undefined,
        };
      case 'left':
        return {
          markerEnd: undefined,
          markerStart: 'url(#arrow-start)',
        };
      case 'both':
        return {
          markerEnd: 'url(#arrow-end)',
          markerStart: 'url(#arrow-start)',
        };
      default:
        return {
          markerEnd: 'url(#arrow-end)',
          markerStart: undefined,
        };
    }
  };

  const markers = getMarkers();

  return (
    <>
      {/* Define arrow markers in SVG defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="arrow-end"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={UI_COLORS.textMuted}
              stroke={UI_COLORS.textMuted}
              strokeWidth="1"
            />
          </marker>
          <marker
            id="arrow-start"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path
              d="M 10 0 L 0 5 L 10 10 z"
              fill={UI_COLORS.textMuted}
              stroke={UI_COLORS.textMuted}
              strokeWidth="1"
            />
          </marker>
        </defs>
      </svg>

      {/* Render edge path with markers */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markers.markerEnd}
        markerStart={markers.markerStart}
        style={{
          stroke: UI_COLORS.textMuted,
          strokeWidth: 2,
          ...style,
        }}
      />

      {/* Render label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: UI_COLORS.backgroundPrimary,
              padding: SPACING.padding.button,
              borderRadius: BORDER_RADIUS.normal,
              fontSize: FONT_SIZES.medium,
              fontWeight: 500,
              color: UI_COLORS.textNormal,
              border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
