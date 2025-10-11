/**
 * Container Node - For Container Diagrams (C4 Level 2)
 * Represents applications, data stores, microservices within a system
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ContainerNodeData {
  label: string;
  containerType: 'webapp' | 'mobileapp' | 'api' | 'database' | 'queue' | 'service';
  technology?: string;
  description?: string;
  hasChildDiagram?: boolean;
  color?: string;
}

const containerIcons = {
  webapp: '🌐',
  mobileapp: '📱',
  api: '🔌',
  database: '🗄️',
  queue: '📮',
  service: '⚙️',
};

const containerColors = {
  webapp: '#4A90E2',
  mobileapp: '#9B59B6',
  api: '#E67E22',
  database: '#16A085',
  queue: '#F39C12',
  service: '#34495E',
};

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
        padding: '16px 20px',
        borderRadius: '8px',
        border: data.hasChildDiagram ? `3px solid ${color}` : `2px solid ${color}`,
        minWidth: '180px',
        maxWidth: '260px',
        textAlign: 'center',
        backgroundColor: hexToRgba(color, 0.08),
        color: 'var(--text-normal)',
        fontFamily: 'var(--font-interface)',
        fontSize: '14px',
        boxShadow: selected
          ? '0 0 0 2px var(--interactive-accent)'
          : data.hasChildDiagram
          ? '0 5px 10px rgba(0,0,0,0.18)'
          : '0 3px 6px rgba(0,0,0,0.12)',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: '12px', height: '12px' }} />

      {/* Drill-down indicator - Enhanced badge */}
      {data.hasChildDiagram && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'var(--interactive-accent)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '2px solid var(--background-primary)',
            cursor: 'pointer',
          }}
          title="This container has a child diagram (double-click or right-click to open)"
        >
          📂
        </div>
      )}

      {/* Icon and Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontWeight: 600 }}>{data.label}</span>
      </div>

      {/* Technology */}
      {data.technology && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}
        >
          [{data.technology}]
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '8px',
          }}
        >
          {data.description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: '12px', height: '12px' }} />
    </div>
  );
};
