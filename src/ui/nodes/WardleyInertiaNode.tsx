/**
 * Wardley Inertia Node - Barrier/Wall for Wardley Maps
 *
 * Represents inertia barriers on a Wardley Map:
 * - Visual barrier/wall appearance
 * - Shows reason for inertia
 * - Typically placed between components to show resistance to change
 *
 * Examples of inertia:
 * - Legacy systems
 * - Organizational resistance
 * - Regulatory barriers
 * - Vendor lock-in
 * - Cultural resistance
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS } from '../../constants';
import type { CanvasNodeData } from '../../types/canvas-types';

interface InertiaNodeData extends CanvasNodeData {
  wardley?: {
    inertiaReason?: string;
  };
}

export const WardleyInertiaNode: React.FC<NodeProps<InertiaNodeData>> = ({ data, selected }) => {
  const inertiaReason = data.wardley?.inertiaReason || data.label;

  const getNodeStyles = (): React.CSSProperties => {
    return {
      padding: '16px 12px',
      borderRadius: '4px',
      border: '3px dashed #ef4444',
      minWidth: '140px',
      maxWidth: '200px',
      textAlign: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: UI_COLORS.textNormal,
      fontFamily: UI_COLORS.fontInterface,
      fontSize: FONT_SIZES.small,
      fontWeight: 600,
      boxShadow: selected
        ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
        : '0 4px 12px rgba(239, 68, 68, 0.3)',
      position: 'relative',
      cursor: 'pointer',
      // Striped pattern to make it look like a barrier
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.05) 0px, rgba(239, 68, 68, 0.05) 10px, transparent 10px, transparent 20px)',
    };
  };

  return (
    <div style={getNodeStyles()}>
      {/* Barrier icon */}
      <div
        style={{
          fontSize: '24px',
          marginBottom: SPACING.small,
        }}
      >
        🚧
      </div>

      {/* Inertia badge */}
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          fontWeight: 700,
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          padding: '3px 10px',
          borderRadius: '12px',
          display: 'inline-block',
          marginBottom: SPACING.small,
          border: '1px solid #ef4444',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        INERTIA
      </div>

      {/* Reason for inertia */}
      <div
        style={{
          fontSize: FONT_SIZES.small,
          color: UI_COLORS.textNormal,
          fontWeight: 600,
          marginBottom: SPACING.small,
        }}
      >
        {inertiaReason}
      </div>

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.extraSmall,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.medium,
            fontWeight: 400,
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}
        >
          {data.description}
        </div>
      )}

      {/* Connection handles - typically inertia nodes connect to components they affect */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: '#ef4444',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#ef4444',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#ef4444',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          background: '#ef4444',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />

      {/* Helper text */}
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          color: UI_COLORS.textFaint,
          marginTop: SPACING.medium,
          fontStyle: 'italic',
        }}
      >
        Resistance to evolution
      </div>
    </div>
  );
};
