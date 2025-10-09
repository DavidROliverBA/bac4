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
}

/**
 * C4 Node Component
 * Custom node for C4 architecture diagrams
 */
export const C4Node: React.FC<NodeProps<C4NodeData>> = ({ data, selected }) => {
  const getNodeStyles = () => {
    const baseStyles = {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '2px solid',
      minWidth: '150px',
      maxWidth: '250px',
      textAlign: 'center' as const,
      backgroundColor: 'var(--background-primary)',
      color: 'var(--text-normal)',
      fontFamily: 'var(--font-interface)',
      fontSize: '14px',
      boxShadow: selected ? '0 0 0 2px var(--interactive-accent)' : '0 2px 4px rgba(0,0,0,0.1)',
    };

    const typeStyles = {
      context: {
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
      },
      container: {
        borderColor: '#7ED321',
        backgroundColor: 'rgba(126, 211, 33, 0.1)',
      },
      component: {
        borderColor: '#F5A623',
        backgroundColor: 'rgba(245, 166, 35, 0.1)',
      },
    };

    return { ...baseStyles, ...typeStyles[data.type] };
  };

  return (
    <div style={getNodeStyles()}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

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

      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};
