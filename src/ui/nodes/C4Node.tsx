import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

/**
 * C4 Node Data Interface
 */
export interface C4NodeData {
  label: string;
  type: 'context' | 'container' | 'component';
  technology?: string;
  description?: string;
  color?: string;
}

/**
 * C4 Node Component
 * Custom node for C4 architecture diagrams
 */
export const C4Node: React.FC<NodeProps<C4NodeData>> = ({ data, selected }) => {
  // Default colors by type
  const typeColors = {
    context: '#4A90E2',
    container: '#7ED321',
    component: '#F5A623',
  };

  const color = data.color || typeColors[data.type];

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getNodeStyles = () => {
    return {
      padding: '12px 16px',
      borderRadius: '8px',
      border: `2px solid ${color}`,
      minWidth: '150px',
      maxWidth: '250px',
      textAlign: 'center' as const,
      backgroundColor: hexToRgba(color, 0.1),
      color: 'var(--text-normal)',
      fontFamily: 'var(--font-interface)',
      fontSize: '14px',
      boxShadow: selected ? '0 0 0 2px var(--interactive-accent)' : '0 2px 4px rgba(0,0,0,0.1)',
    };
  };

  return (
    <div style={getNodeStyles()}>
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
        {data.label}
      </div>

      {data.technology && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          [{data.technology}]
        </div>
      )}

      {data.description && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          {data.description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
};
