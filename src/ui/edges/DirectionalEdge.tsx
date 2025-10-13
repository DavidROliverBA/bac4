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
  markerEnd,
  markerStart,
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
  // Using simple arrow strings that React Flow understands
  const getMarkers = () => {
    switch (direction) {
      case 'right':
        return {
          markerEnd: 'arrow',
          markerStart: undefined,
        };
      case 'left':
        return {
          markerEnd: undefined,
          markerStart: 'arrow',
        };
      case 'both':
        return {
          markerEnd: 'arrow',
          markerStart: 'arrow',
        };
      default:
        return {
          markerEnd: 'arrow',
          markerStart: undefined,
        };
    }
  };

  const markers = getMarkers();

  return (
    <>
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
