/**
 * Cloud Component Node
 * Custom node for cloud service components (AWS, Azure, GCP, SaaS)
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ComponentDefinition } from '../../../component-library/types';

/**
 * Cloud Component Node Data Interface
 */
export interface CloudComponentNodeData {
  label: string;
  component: ComponentDefinition;
  properties?: Record<string, any>;
  notes?: string;
  color?: string;
}

/**
 * Cloud Component Node Component
 */
export const CloudComponentNode: React.FC<NodeProps<CloudComponentNodeData>> = ({
  data,
  selected,
}) => {
  const color = data.color || data.component.color;

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
      boxShadow: selected
        ? '0 0 0 2px var(--interactive-accent)'
        : '0 2px 4px rgba(0,0,0,0.1)',
      borderColor: color,
      position: 'relative' as const,
    };

    return baseStyles;
  };

  const providerBadgeStyles = {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '3px',
    backgroundColor: color,
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  };

  return (
    <div style={getNodeStyles()}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color }}
      />

      {/* Provider badge */}
      <div style={providerBadgeStyles}>{data.component.provider}</div>

      {/* Component name */}
      <div style={{ fontWeight: 600, marginBottom: '4px', marginTop: '8px' }}>
        {data.label}
      </div>

      {/* Component type */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginBottom: '4px',
          fontStyle: 'italic',
        }}
      >
        {data.component.name}
      </div>

      {/* Properties */}
      {data.properties && Object.keys(data.properties).length > 0 && (
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-faint)',
            marginTop: '8px',
            borderTop: '1px solid var(--background-modifier-border)',
            paddingTop: '6px',
          }}
        >
          {Object.entries(data.properties)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key}>
                {key}: {String(value)}
              </div>
            ))}
        </div>
      )}

      {/* Notes indicator */}
      {data.notes && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '4px',
            fontSize: '10px',
            color: 'var(--text-faint)',
          }}
        >
          📝
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color }}
      />
    </div>
  );
};
