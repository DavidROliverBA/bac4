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
  markerEnd,
  markerStart,
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
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill="var(--text-muted)"
              stroke="none"
            />
          </marker>
          <marker
            id="arrow-start"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 10 0 L 0 5 L 10 10 z"
              fill="var(--text-muted)"
              stroke="none"
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
          stroke: 'var(--text-muted)',
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
              background: 'var(--background-primary)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-normal)',
              border: '1px solid var(--background-modifier-border)',
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
