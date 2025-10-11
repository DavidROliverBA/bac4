/**
 * Person Node - For Context Diagrams (C4 Level 1)
 * Represents a human user or actor
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface PersonNodeData {
  label: string;
  role?: string;
  color?: string;
}

export const PersonNode: React.FC<NodeProps<PersonNodeData>> = ({ data, selected }) => {
  const color = data.color || '#7ED321';

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '140px',
        padding: '16px',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: '12px', height: '12px' }} />

      {/* Person icon */}
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: selected ? '3px solid var(--interactive-accent)' : `2px solid ${color}`,
          backgroundColor: hexToRgba(color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '12px',
          boxShadow: selected ? '0 0 0 2px var(--interactive-accent)' : '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        👤
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: 'var(--font-interface)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-normal)',
          textAlign: 'center',
          marginBottom: data.role ? '4px' : '0',
        }}
      >
        {data.label}
      </div>

      {/* Role */}
      {data.role && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          [{data.role}]
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: '12px', height: '12px' }} />
    </div>
  );
};
