/**
 * Wardley Edge Component
 *
 * Custom edge for Wardley Maps that renders as a straight diagonal line.
 * In Wardley Mapping, dependencies flow from higher visibility (top) to lower visibility (bottom),
 * showing the value chain relationship clearly.
 *
 * Features:
 * - Straight diagonal line (no curves or steps)
 * - Arrow at target end
 * - Label positioned at midpoint
 * - Color coding based on relationship type
 *
 * @version 2.5.0
 */

import * as React from 'react';
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  Position,
} from 'reactflow';
import { UI_COLORS, FONT_SIZES } from '../../constants';

export const WardleyEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerStart,
  markerEnd,
  selected,
}) => {
  // v2.5.0: Get edge style (default to 'diagonal' for Wardley Maps)
  const edgeStyle = data?.style || 'diagonal';

  // Calculate path based on selected style
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (edgeStyle === 'diagonal') {
    // Straight diagonal line (default for Wardley Maps)
    edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } else if (edgeStyle === 'rightAngle') {
    // Right-angle path with smooth corners
    const [path, x, y] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition || Position.Right,
      targetX,
      targetY,
      targetPosition: targetPosition || Position.Left,
      borderRadius: 8,
    });
    edgePath = path;
    labelX = x;
    labelY = y;
  } else {
    // Curved bezier path
    const [path, x, y] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition || Position.Right,
      targetX,
      targetY,
      targetPosition: targetPosition || Position.Left,
    });
    edgePath = path;
    labelX = x;
    labelY = y;
  }

  // Calculate midpoint for label (keeping original variable names for backward compat)
  const midX = labelX;
  const midY = labelY;

  // Get label from data
  const label = data?.label || '';

  // Determine edge color based on selection or relationship type
  const edgeColor = selected ? UI_COLORS.interactiveAccent : data?.color || UI_COLORS.textMuted;

  // Calculate label rotation to align with edge
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI);

  // Keep label readable (don't let it be upside down)
  const labelRotation = angle > 90 || angle < -90 ? angle + 180 : angle;

  return (
    <>
      {/* Main edge path - straight diagonal line with directional arrows */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={edgeColor}
        strokeWidth={selected ? 2.5 : 2}
        fill="none"
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: data?.dashed ? '5,5' : 'none',
        }}
      />

      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px) rotate(${labelRotation}deg)`,
              pointerEvents: 'all',
              fontSize: FONT_SIZES.small,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: UI_COLORS.backgroundPrimary,
              border: `1px solid ${edgeColor}`,
              color: edgeColor,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Hover/selection indicator - invisible wider path for easier clicking */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={20}
        fill="none"
        style={{ cursor: 'pointer' }}
      />
    </>
  );
};
