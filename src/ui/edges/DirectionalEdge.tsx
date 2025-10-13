/**
 * Directional Edge Component
 * Custom edge with direction property (right, left, both)
 *
 * NOTE: Markers are set on the edge data when creating/updating edges,
 * not in this component. This component just renders the edge path and label.
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
  // Calculate path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Render edge path - markers are passed through from edge data */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
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
