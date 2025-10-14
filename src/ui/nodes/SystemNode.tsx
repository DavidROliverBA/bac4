/**
 * System Node - For Context Diagrams (C4 Level 1)
 * Represents a software system in the system landscape
 * v0.6.0: Supports linkedDiagramPath and linkedMarkdownPath
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, DEFAULT_NODE_COLOR } from '../../constants';
import type { SystemNodeData } from '../../types/canvas-types';

export const SystemNode: React.FC<NodeProps<SystemNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_NODE_COLOR;

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Determine if node has linked files (v0.6.0)
  const hasLinkedDiagram = !!data.linkedDiagramPath;
  const hasLinkedMarkdown = !!data.linkedMarkdownPath;
  const hasAnyLink = hasLinkedDiagram || hasLinkedMarkdown;

  const getNodeStyles = () => {
    return {
      padding: '10px 12px',
      borderRadius: '6px',
      border: 'none',
      minWidth: '100px',
      maxWidth: '150px',
      textAlign: 'center' as const,
      backgroundColor: data.external ? 'rgba(128, 128, 128, 0.3)' : hexToRgba(color, 0.25),
      color: UI_COLORS.textNormal,
      fontFamily: UI_COLORS.fontInterface,
      fontSize: FONT_SIZES.small,
      fontWeight: 600,
      boxShadow: selected
        ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
        : hasAnyLink
          ? '0 3px 6px rgba(0,0,0,0.2)'
          : '0 2px 4px rgba(0,0,0,0.15)',
      position: 'relative' as const,
    };
  };

  return (
    <div style={getNodeStyles()}>
      {/* Connection handles - all four sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: color, width: '14px', height: '14px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: color, width: '14px', height: '14px' }}
      />

      {/* Plus icon badge for linked files (v0.6.0) */}
      {hasAnyLink && (
        <div
          style={{
            position: 'absolute',
            top: SPACING.tiny,
            right: SPACING.tiny,
            fontSize: '10px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            cursor: 'help',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          title={
            hasLinkedDiagram
              ? `Linked to: ${data.linkedDiagramPath?.split('/').pop()}`
              : `Documentation: ${data.linkedMarkdownPath?.split('/').pop()}`
          }
        >
          +
        </div>
      )}

      {/* Label */}
      <div style={{ marginBottom: data.description ? SPACING.large : '0' }}>{data.label}</div>

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.extraSmall,
            color: UI_COLORS.textMuted,
            fontWeight: 400,
            marginTop: SPACING.medium,
          }}
        >
          {data.description}
        </div>
      )}

      {/* External badge */}
      {data.external && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
            marginTop: SPACING.medium,
            fontStyle: 'italic',
          }}
        >
          External System
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: color, width: '14px', height: '14px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: color, width: '14px', height: '14px' }}
      />
    </div>
  );
};
