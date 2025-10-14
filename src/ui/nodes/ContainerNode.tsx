/**
 * Container Node - For Container Diagrams (C4 Level 2)
 * Represents applications, data stores, microservices within a system
 *
 * Schema Version: 0.4.0 - Replaced containerType enum with flexible icon field
 * Schema Version: 0.6.0 - Supports linkedDiagramPath and linkedMarkdownPath
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { setIcon } from 'obsidian';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import type { ContainerNodeData } from '../../types/canvas-types';

// Default values
const DEFAULT_ICON = 'box';
const DEFAULT_COLOR = '#4A90E2';

export const ContainerNode: React.FC<NodeProps<ContainerNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_COLOR;
  const iconRef = React.useRef<HTMLSpanElement>(null);

  // Render Lucide icon using Obsidian API
  React.useEffect(() => {
    if (iconRef.current) {
      iconRef.current.innerHTML = '';  // Clear existing
      setIcon(iconRef.current, data.icon || DEFAULT_ICON);
    }
  }, [data.icon]);

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
        padding: '12px 16px',
        borderRadius: BORDER_RADIUS.normal,
        border: 'none',
        minWidth: '160px',
        maxWidth: '240px',
        textAlign: 'center',
        backgroundColor: hexToRgba(color, 0.2),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.small,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
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
        {/* Lucide Icon */}
        <span
          ref={iconRef}
          style={{
            fontSize: FONT_SIZES.small,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        />
        <span style={{ fontWeight: 600, fontSize: FONT_SIZES.small }}>{data.label}</span>
      </div>

      {/* Type (formerly Technology) */}
      {data.type && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
          }}
        >
          [{data.type}]
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
