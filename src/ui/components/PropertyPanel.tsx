/**
 * Property Panel
 * Shows and edits properties of the selected node or edge
 */

import * as React from 'react';
import { Node, Edge } from 'reactflow';
import { C4NodeData } from '../nodes/C4Node';
import { CloudComponentNodeData } from '../nodes/CloudComponentNode';
import { SystemNodeData } from '../nodes/SystemNode';
import { PersonNodeData } from '../nodes/PersonNode';
import { ContainerNodeData } from '../nodes/ContainerNode';

type CanvasNodeData = C4NodeData | CloudComponentNodeData | SystemNodeData | PersonNodeData | ContainerNodeData;

interface PropertyPanelProps {
  node: Node<CanvasNodeData> | null;
  edge: Edge | null;
  onUpdateLabel: (nodeId: string, label: string) => void;
  onUpdateProperties: (nodeId: string, updates: any) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeDirection: (edgeId: string, direction: 'right' | 'left' | 'both') => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  node,
  edge,
  onUpdateLabel,
  onUpdateProperties,
  onUpdateEdgeLabel,
  onUpdateEdgeDirection,
  onClose,
}) => {
  if (!node && !edge) return null;

  const isC4Node = node?.type === 'c4';
  const isCloudNode = node?.type === 'cloudComponent';
  const isSystemNode = node?.type === 'system';
  const isPersonNode = node?.type === 'person';
  const isContainerNode = node?.type === 'container';

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

            {/* Direction selector */}
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
                Direction
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'right' as const, icon: '→', label: 'Arrow right' },
                  { value: 'left' as const, icon: '←', label: 'Arrow left' },
                  { value: 'both' as const, icon: '↔', label: 'Arrow both ends' },
                ].map((option) => {
                  const currentDirection = (edge as any).data?.direction || (edge as any).direction || 'right';
                  const isSelected = currentDirection === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onUpdateEdgeDirection(edge.id, option.value)}
                      title={option.label}
                      aria-label={option.label}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: isSelected ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                        border: isSelected
                          ? '2px solid var(--interactive-accent)'
                          : '1px solid var(--background-modifier-border)',
                        borderRadius: '4px',
                        color: isSelected ? 'var(--text-on-accent)' : 'var(--text-normal)',
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--background-modifier-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--background-secondary)';
                        }
                      }}
                    >
                      {option.icon}
                    </button>
                  );
                })}
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

        {/* Node Color Customization - Available for all node types */}
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
              Node Color
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={(node.data as any).color || '#4A90E2'}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                style={{
                  width: '48px',
                  height: '32px',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={(node.data as any).color || '#4A90E2'}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                placeholder="#4A90E2"
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  color: 'var(--text-normal)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            {/* Preset colors */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[
                { name: 'Blue', value: '#4A90E2' },
                { name: 'Green', value: '#7ED321' },
                { name: 'Orange', value: '#F5A623' },
                { name: 'Purple', value: '#9B59B6' },
                { name: 'Red', value: '#E74C3C' },
                { name: 'Teal', value: '#16A085' },
                { name: 'Gray', value: '#95A5A6' },
                { name: 'Pink', value: '#E91E63' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePropertyChange('color', preset.value)}
                  title={preset.name}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: preset.value,
                    border: (node.data as any).color === preset.value
                      ? '2px solid var(--interactive-accent)'
                      : '1px solid var(--background-modifier-border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
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

        {/* System Node specific properties */}
        {isSystemNode && (
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
                Description
              </label>
              <textarea
                value={'description' in node.data ? (node.data.description || '') : ''}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                placeholder="System description"
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={'external' in node.data ? (node.data.external || false) : false}
                  onChange={(e) => handlePropertyChange('external', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-normal)' }}>External System</span>
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={'hasChildDiagram' in node.data ? (node.data.hasChildDiagram || false) : false}
                  onChange={(e) => handlePropertyChange('hasChildDiagram', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-normal)' }}>Has Child Diagram 🔍</span>
              </label>
            </div>
          </>
        )}

        {/* Person Node specific properties */}
        {isPersonNode && (
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
              Role
            </label>
            <input
              type="text"
              value={'role' in node.data ? (node.data.role || '') : ''}
              onChange={(e) => handlePropertyChange('role', e.target.value)}
              placeholder="e.g., Administrator, Customer"
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

        {/* Container Node specific properties */}
        {isContainerNode && (
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
                Container Type
              </label>
              <select
                value={'containerType' in node.data ? node.data.containerType : 'service'}
                onChange={(e) => handlePropertyChange('containerType', e.target.value as any)}
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
                <option value="webapp">Web App 🌐</option>
                <option value="mobileapp">Mobile App 📱</option>
                <option value="api">API 🔌</option>
                <option value="database">Database 🗄️</option>
                <option value="queue">Message Queue 📮</option>
                <option value="service">Service ⚙️</option>
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
                value={'technology' in node.data ? (node.data.technology || '') : ''}
                onChange={(e) => handlePropertyChange('technology', e.target.value)}
                placeholder="e.g., Node.js, PostgreSQL"
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
                value={'description' in node.data ? (node.data.description || '') : ''}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                placeholder="Container description"
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={'hasChildDiagram' in node.data ? (node.data.hasChildDiagram || false) : false}
                  onChange={(e) => handlePropertyChange('hasChildDiagram', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-normal)' }}>Has Child Diagram 🔍</span>
              </label>
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
