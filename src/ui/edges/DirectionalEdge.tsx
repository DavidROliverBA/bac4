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
  MarkerType,
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
  // Using React Flow's MarkerType enum
  // CRITICAL: width and height are required, default to 0 (invisible)!
  const getMarkers = () => {
    switch (direction) {
      case 'right':
        return {
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#888888',
            width: 20,
            height: 20,
          },
          markerStart: undefined,
        };
      case 'left':
        return {
          markerEnd: undefined,
          markerStart: {
            type: MarkerType.ArrowClosed,
            color: '#888888',
            width: 20,
            height: 20,
          },
        };
      case 'both':
        return {
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#888888',
            width: 20,
            height: 20,
          },
          markerStart: {
            type: MarkerType.ArrowClosed,
            color: '#888888',
            width: 20,
            height: 20,
          },
        };
      default:
        return {
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#888888',
            width: 20,
            height: 20,
          },
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
          stroke: '#888888',
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
