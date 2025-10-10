/**
 * Property Panel
 * Shows and edits properties of the selected node or edge
 */

import * as React from 'react';
import { Node, Edge } from 'reactflow';
import { C4NodeData } from '../nodes/C4Node';
import { CloudComponentNodeData } from '../nodes/CloudComponentNode';

interface PropertyPanelProps {
  node: Node<C4NodeData | CloudComponentNodeData> | null;
  edge: Edge | null;
  onUpdateLabel: (nodeId: string, label: string) => void;
  onUpdateProperties: (nodeId: string, updates: any) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  node,
  edge,
  onUpdateLabel,
  onUpdateProperties,
  onUpdateEdgeLabel,
  onClose,
}) => {
  if (!node && !edge) return null;

  const isC4Node = node?.type === 'c4';
  const isCloudNode = node?.type === 'cloudComponent';

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (node) onUpdateLabel(node.id, e.target.value);
  };

  const handlePropertyChange = (key: string, value: any) => {
    if (node) onUpdateProperties(node.id, { [key]: value });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '16px',
        bottom: '16px',
        width: '300px',
        maxHeight: '400px',
        background: 'var(--background-primary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--background-modifier-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          {edge ? 'Edge Properties' : 'Node Properties'}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
          }}
        >
          ✕
        </button>
      </div>

      {/* Properties */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* Edge Properties */}
        {edge && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Relationship Label
              </label>
              <input
                type="text"
                value={String(edge.label || '')}
                onChange={(e) => onUpdateEdgeLabel(edge.id, e.target.value)}
                placeholder="e.g., uses, depends on, calls"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  color: 'var(--text-normal)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Common relationship templates */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Common Relationships
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['uses', 'depends on', 'calls', 'reads', 'writes', 'sends to', 'contains'].map((label) => (
                  <button
                    key={label}
                    onClick={() => onUpdateEdgeLabel(edge.id, label)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--background-secondary)',
                      border: '1px solid var(--background-modifier-border)',
                      borderRadius: '3px',
                      color: 'var(--text-normal)',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edge ID (read-only) */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--background-modifier-border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                Edge ID: {edge.id}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>
                From: {edge.source} → To: {edge.target}
              </div>
            </div>
          </>
        )}

        {/* Node Label */}
        {node && (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              Label
            </label>
            <input
              type="text"
              value={node.data.label}
              onChange={handleLabelChange}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--background-secondary)',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                color: 'var(--text-normal)',
                fontSize: '13px',
              }}
            />
          </div>
        )}

        {/* C4 Node specific properties */}
        {isC4Node && 'type' in node.data && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Type
              </label>
              <select
                value={node.data.type}
                onChange={(e) =>
                  handlePropertyChange(
                    'type',
                    e.target.value as 'context' | 'container' | 'component'
                  )
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  color: 'var(--text-normal)',
                  fontSize: '13px',
                }}
              >
                <option value="context">Context</option>
                <option value="container">Container</option>
                <option value="component">Component</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Technology
              </label>
              <input
                type="text"
                value={node.data.technology || ''}
                onChange={(e) => handlePropertyChange('technology', e.target.value)}
                placeholder="e.g., Node.js, React"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  color: 'var(--text-normal)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Description
              </label>
              <textarea
                value={node.data.description || ''}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                placeholder="Optional description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  color: 'var(--text-normal)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}

        {/* Cloud Component specific properties */}
        {isCloudNode && 'component' in node.data && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Component Type
              </label>
              <div
                style={{
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                {node.data.component.name} ({node.data.component.provider})
              </div>
            </div>

            {'properties' in node.data && node.data.properties && Object.keys(node.data.properties).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Properties
                </label>
                {Object.entries(node.data.properties).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        marginBottom: '2px',
                      }}
                    >
                      {key}
                    </label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => {
                        if ('properties' in node.data && node.data.properties) {
                          const newProps = { ...node.data.properties, [key]: e.target.value };
                          handlePropertyChange('properties', newProps);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        background: 'var(--background-secondary)',
                        border: '1px solid var(--background-modifier-border)',
                        borderRadius: '3px',
                        color: 'var(--text-normal)',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Notes
              </label>
              <textarea
                value={node.data.notes || ''}
                onChange={(e) => handlePropertyChange('notes', e.target.value)}
                placeholder="Optional notes"
                rows={3}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  color: 'var(--text-normal)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}

        {/* Node ID (read-only) */}
        {node && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--background-modifier-border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
              ID: {node.id}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
