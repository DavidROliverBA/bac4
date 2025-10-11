/**
 * System Node - For Context Diagrams (C4 Level 1)
 * Represents a software system in the system landscape
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface SystemNodeData {
  label: string;
  description?: string;
  external?: boolean;
  hasChildDiagram?: boolean;
  color?: string;
}

export const SystemNode: React.FC<NodeProps<SystemNodeData>> = ({ data, selected }) => {
  const color = data.color || '#4A90E2';

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getNodeStyles = () => {
    // Enhanced border for nodes with children
    const borderStyle = data.external
      ? '2px dashed #666'
      : data.hasChildDiagram
      ? `4px solid ${color}`
      : `3px solid ${color}`;

    return {
      padding: '20px 24px',
      borderRadius: '12px',
      border: borderStyle,
      minWidth: '200px',
      maxWidth: '300px',
      textAlign: 'center' as const,
      backgroundColor: data.external ? 'rgba(128, 128, 128, 0.1)' : hexToRgba(color, 0.15),
      color: 'var(--text-normal)',
      fontFamily: 'var(--font-interface)',
      fontSize: '16px',
      fontWeight: 600,
      boxShadow: selected
        ? '0 0 0 3px var(--interactive-accent)'
        : data.hasChildDiagram
        ? '0 6px 12px rgba(0,0,0,0.2)'
        : '0 4px 8px rgba(0,0,0,0.15)',
      position: 'relative' as const,
    };
  };

  return (
    <div style={getNodeStyles()}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: '14px', height: '14px' }} />

      {/* Drill-down indicator - Enhanced badge */}
      {data.hasChildDiagram && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'var(--interactive-accent)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '2px solid var(--background-primary)',
            cursor: 'pointer',
          }}
          title="This node has a child diagram (double-click or right-click to open)"
        >
          📂
        </div>
      )}

      {/* Label */}
      <div style={{ marginBottom: data.description ? '8px' : '0' }}>
        {data.label}
      </div>

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontWeight: 400,
            marginTop: '8px',
          }}
        >
          {data.description}
        </div>
      )}

      {/* External badge */}
      {data.external && (
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-faint)',
            marginTop: '8px',
            fontStyle: 'italic',
          }}
        >
          External System
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: '14px', height: '14px' }} />
    </div>
  );
};
