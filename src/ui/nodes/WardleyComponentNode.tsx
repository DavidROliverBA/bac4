/**
 * Wardley Component Node - For Wardley Maps
 *
 * Represents a component on a Wardley Map with:
 * - Visibility (Y-axis): How visible to users (0-1)
 * - Evolution (X-axis): How evolved/commoditized (0-1)
 * - Evolution Stage: Genesis → Custom → Product → Commodity
 * - Inertia: Resistance to change
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS } from '../../constants';
import { getEvolutionStageColor, getEvolutionStage } from '../../types/bac4-v2-types';
import type { CanvasNodeData } from '../../types/canvas-types';

interface WardleyNodeData extends CanvasNodeData {
  wardley?: {
    visibility: number;
    evolution: number;
    evolutionStage: 'genesis' | 'custom' | 'product' | 'commodity';
    inertia: boolean;
    inertiaReason?: string;
  };
}

export const WardleyComponentNode: React.FC<NodeProps<WardleyNodeData>> = ({ data, selected }) => {
  // Get Wardley properties
  const wardley = data.wardley;

  if (!wardley) {
    // Fallback if no Wardley data (shouldn't happen, but be defensive)
    return (
      <div style={{ padding: '10px', background: '#fee', color: '#c00', borderRadius: '4px' }}>
        Missing Wardley data
      </div>
    );
  }

  // Get color based on evolution stage
  const stageColor = getEvolutionStageColor(wardley.evolutionStage);

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getNodeStyles = (): React.CSSProperties => {
    return {
      padding: '12px 14px',
      borderRadius: '8px',
      border: `2px solid ${stageColor}`,
      minWidth: '100px',
      maxWidth: '180px',
      textAlign: 'center',
      backgroundColor: hexToRgba(stageColor, 0.15),
      color: UI_COLORS.textNormal,
      fontFamily: UI_COLORS.fontInterface,
      fontSize: FONT_SIZES.small,
      fontWeight: 600,
      boxShadow: selected
        ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
        : '0 3px 8px rgba(0,0,0,0.2)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };
  };

  // Evolution stage label
  const stageLabels = {
    genesis: 'Genesis',
    custom: 'Custom',
    product: 'Product',
    commodity: 'Commodity',
  };

  return (
    <div style={getNodeStyles()}>
      {/* Inertia indicator badge */}
      {wardley.inertia && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            zIndex: 10,
            border: '2px solid white',
          }}
          title={wardley.inertiaReason || 'This component has inertia (resistance to change)'}
        >
          ⚠️
        </div>
      )}

      {/* Connection handles - all four sides for flexible routing */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: stageColor,
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: stageColor,
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: stageColor,
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          background: stageColor,
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />

      {/* Component label */}
      <div
        style={{
          marginBottom: SPACING.small,
          fontSize: FONT_SIZES.normal,
          fontWeight: 700,
        }}
      >
        {data.label}
      </div>

      {/* Evolution stage badge */}
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          fontWeight: 600,
          color: stageColor,
          backgroundColor: hexToRgba(stageColor, 0.2),
          padding: '2px 8px',
          borderRadius: '12px',
          display: 'inline-block',
          marginBottom: SPACING.small,
          border: `1px solid ${stageColor}`,
        }}
      >
        {stageLabels[wardley.evolutionStage]}
      </div>

      {/* Coordinates display */}
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          color: UI_COLORS.textMuted,
          marginTop: SPACING.small,
          lineHeight: 1.3,
        }}
      >
        <div>V: {wardley.visibility.toFixed(2)}</div>
        <div>E: {wardley.evolution.toFixed(2)}</div>
      </div>

      {/* Description (if exists) */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.extraSmall,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.medium,
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          {data.description}
        </div>
      )}
    </div>
  );
};
