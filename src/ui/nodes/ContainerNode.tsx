/**
 * Container Node - For Container Diagrams (C4 Level 2)
 * Represents applications, data stores, microservices within a system
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';

export interface ContainerNodeData {
  label: string;
  containerType: 'webapp' | 'mobileapp' | 'api' | 'database' | 'queue' | 'service';
  technology?: string;
  description?: string;
  hasChildDiagram?: boolean;
  color?: string;
}

// <AI_MODIFIABLE>
// Container type icons - Add new container types here
const containerIcons = {
  webapp: '🌐',
  mobileapp: '📱',
  api: '🔌',
  database: '🗄️',
  queue: '📮',
  service: '⚙️',
};

// Container type colors - Add matching colors for new container types
const containerColors = {
  webapp: '#4A90E2',
  mobileapp: '#9B59B6',
  api: '#E67E22',
  database: '#16A085',
  queue: '#F39C12',
  service: '#34495E',
};
// </AI_MODIFIABLE>

export const ContainerNode: React.FC<NodeProps<ContainerNodeData>> = ({ data, selected }) => {
  const defaultColor = containerColors[data.containerType];
  const color = data.color || defaultColor;
  const icon = containerIcons[data.containerType];

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: BORDER_RADIUS.normal,
        border: 'none',
        minWidth: '90px',
        maxWidth: '130px',
        textAlign: 'center',
        backgroundColor: hexToRgba(color, 0.2),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.small,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
          : data.hasChildDiagram
            ? '0 2.5px 5px rgba(0,0,0,0.18)'
            : '0 1.5px 3px rgba(0,0,0,0.12)',
        position: 'relative',
      }}
    >
      {/* Connection handles - all four sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: color, width: '12px', height: '12px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: color, width: '12px', height: '12px' }}
      />

      {/* Drill-down indicator - Enhanced badge */}
      {data.hasChildDiagram && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: UI_COLORS.interactiveAccent,
            borderRadius: '50%',
            width: '12px',
            height: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FONT_SIZES.extraSmall,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            border: `1px solid ${UI_COLORS.backgroundPrimary}`,
            cursor: 'pointer',
          }}
          title="This container has a child diagram (double-click or right-click to open)"
        >
          📂
        </div>
      )}

      {/* Icon and Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.tiny,
          marginBottom: SPACING.small,
        }}
      >
        <span style={{ fontSize: FONT_SIZES.small }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: FONT_SIZES.small }}>{data.label}</span>
      </div>

      {/* Technology */}
      {data.technology && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
          }}
        >
          [{data.technology}]
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.small,
          }}
        >
          {data.description}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: color, width: '12px', height: '12px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: color, width: '12px', height: '12px' }}
      />
    </div>
  );
};
