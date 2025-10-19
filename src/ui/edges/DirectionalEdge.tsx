/**
 * Directional Edge Component
 * Custom edge with direction property (right, left, both)
 *
 * Features intelligent routing that:
 * - Chooses edge exit/entry points based on node positions
 * - Uses horizontal sides (left/right) when nodes are within 45° of horizontal
 * - Uses vertical sides (top/bottom) when nodes are within 45° of vertical
 * - Always picks the shortest path
 * - Uses smooth step routing with right-angle turns
 */

import * as React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge, Position } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';

export interface DirectionalEdgeData {
  label?: string;
  direction?: 'right' | 'left' | 'both';
}

/**
 * Calculate optimal source and target positions based on node positions
 * Returns positions that create the shortest path
 */
function getOptimalPositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): { sourcePosition: Position; targetPosition: Position } {
  // Calculate vector from source to target
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;

  // Calculate angle in degrees (0° = right, 90° = down, 180° = left, 270° = up)
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // Normalize angle to 0-360
  const normalizedAngle = angle < 0 ? angle + 360 : angle;

  // Determine source position based on angle
  // Right: -45° to 45° (315° to 45°)
  // Bottom: 45° to 135°
  // Left: 135° to 225°
  // Top: 225° to 315°

  let sourcePosition: Position;
  let targetPosition: Position;

  if (normalizedAngle >= 315 || normalizedAngle < 45) {
    // Target is to the right
    sourcePosition = Position.Right;
    targetPosition = Position.Left;
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    // Target is below
    sourcePosition = Position.Bottom;
    targetPosition = Position.Top;
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    // Target is to the left
    sourcePosition = Position.Left;
    targetPosition = Position.Right;
  } else {
    // Target is above
    sourcePosition = Position.Top;
    targetPosition = Position.Bottom;
  }

  return { sourcePosition, targetPosition };
}

export const DirectionalEdge: React.FC<EdgeProps<DirectionalEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition: _sourcePosition,
  targetPosition: _targetPosition,
  data,
  style = {},
  markerEnd,
  markerStart,
}) => {
  // Calculate optimal positions based on node locations
  const { sourcePosition, targetPosition } = getOptimalPositions(
    sourceX,
    sourceY,
    targetX,
    targetY
  );

  // Calculate path using smooth step for right-angle routing
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8, // Smooth corners
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
