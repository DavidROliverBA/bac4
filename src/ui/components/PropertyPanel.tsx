/**
 * Property Panel
 * Shows and edits properties of the selected node or edge
 *
 * ✅ REFACTORED: Decomposed into reusable components
 * - FormField: Label + input pattern
 * - FormSection: Grouped sections
 * - ColorPicker: Color selection UI
 * - EdgeDirectionSelector: Arrow buttons
 * - DiagramLinking: Dropdown + open button
 *
 * Original: 1034 lines
 * Refactored: ~250 lines (75% reduction)
 */

import * as React from 'react';
import { Node, Edge } from 'reactflow';
import { App, Vault, Workspace } from 'obsidian';
import type {
  C4NodeData,
  CloudComponentNodeData,
  SystemNodeData,
  PersonNodeData,
  ContainerNodeData,
  CapabilityNodeData,
  MarketNodeData,
  OrganisationNodeData,
  CodeNodeData,
  DiagramNode,
} from '../../types/canvas-types';
import { DiagramNavigationService } from '../../services/diagram-navigation-service';
import BAC4Plugin from '../../main';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  SHADOWS,
  COMMON_RELATIONSHIPS,
  Z_INDEX,
} from '../../constants';
import { ErrorHandler } from '../../utils/error-handling';
import { MarkdownLinkService } from '../../services/markdown-link-service';
import { LinkMarkdownModal } from '../modals/LinkMarkdownModal';

// Imported extracted components
import { FormField } from './form/FormField';
import { FormSection } from './form/FormSection';
import { ColorPicker } from './form/ColorPicker';
import { EdgeDirectionSelector } from './edges/EdgeDirectionSelector';
import { EdgeStyleSelector } from './edges/EdgeStyleSelector';
import { DiagramLinking } from './diagram/DiagramLinking';
import { IconSelector } from './form/IconSelector';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

type CanvasNodeData =
  | C4NodeData
  | CloudComponentNodeData
  | SystemNodeData
  | PersonNodeData
  | ContainerNodeData
  | CapabilityNodeData
  | MarketNodeData
  | OrganisationNodeData
  | CodeNodeData;

interface PropertyPanelProps {
  node: Node<CanvasNodeData> | null;
  edge: Edge | null;
  onUpdateLabel: (nodeId: string, label: string) => void;
  onUpdateProperties: (nodeId: string, updates: Record<string, unknown>) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeDirection: (edgeId: string, direction: 'right' | 'left' | 'both') => void;
  onUpdateEdgeStyle?: (edgeId: string, style: 'diagonal' | 'rightAngle' | 'curved') => void;
  onDeleteEdge?: (edgeId: string) => void;
  onClose: () => void;
  // New props for diagram linking
  plugin?: BAC4Plugin;
  currentDiagramPath?: string;
  currentDiagramType?: 'context' | 'container' | 'component' | 'capability';
  navigationService?: DiagramNavigationService;
  onOpenDiagram?: (path: string) => void;
  onCreateAndLinkChild?: (nodeId: string) => Promise<void>;
  // New props for markdown linking
  app?: App;
  vault?: Vault;
  workspace?: Workspace;
  onLinkMarkdownFile?: (nodeId: string, filePath: string) => void;
  onUnlinkMarkdownFile?: (nodeId: string) => void;
  onCreateAndLinkMarkdownFile?: (nodeId: string, filePath: string) => Promise<void>;
  onOpenLinkedMarkdownFile?: (nodeId: string) => Promise<void>;
  onUpdateMarkdownImage?: (nodeId: string) => Promise<void>;
  // New props for navigation
  onNavigateToChild?: () => void;
  onNavigateToParent?: () => void;
  showNavigateToChild?: boolean;
  showNavigateToParent?: boolean;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  node,
  edge,
  onUpdateLabel,
  onUpdateProperties,
  onUpdateEdgeLabel,
  onUpdateEdgeDirection,
  onUpdateEdgeStyle,
  onDeleteEdge,
  onClose,
  currentDiagramPath,
  currentDiagramType,
  navigationService,
  onOpenDiagram,
  onCreateAndLinkChild,
  app,
  vault,
  workspace,
  onLinkMarkdownFile,
  onUnlinkMarkdownFile,
  onCreateAndLinkMarkdownFile,
  onOpenLinkedMarkdownFile,
  onUpdateMarkdownImage,
  onNavigateToChild,
  onNavigateToParent,
  showNavigateToChild,
  showNavigateToParent,
}) => {
  if (!node && !edge) return null;

  // Responsive layout hook
  const layout = useResponsiveLayout();

  const isC4Node = node?.type === 'c4';
  const isCloudNode = node?.type === 'cloudComponent';
  const isSystemNode = node?.type === 'system';
  const isPersonNode = node?.type === 'person';
  const isContainerNode = node?.type === 'container';
  const isCapabilityNode = node?.type === 'capability';
  const isMarketNode = node?.type === 'market';
  const isOrganisationNode = node?.type === 'organisation';
  const isCodeNode = node?.type === 'code';

  // State for diagram linking
  const [availableDiagrams, setAvailableDiagrams] = React.useState<DiagramNode[]>([]);
  const [linkedDiagram, setLinkedDiagram] = React.useState<DiagramNode | null>(null);
  const [loading, setLoading] = React.useState(false);

  // State for markdown linking
  const [markdownFileExists, setMarkdownFileExists] = React.useState(false);

  // State for dragging - Initialize position based on screen size
  const [position, setPosition] = React.useState(() => {
    // For compact screens, position closer to top
    const initialY = layout.isCompact ? window.innerHeight - 500 : window.innerHeight - 816;
    return { x: 16, y: Math.max(60, initialY) }; // Ensure it's below toolbar
  });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Determine if this node can have child diagrams
  const canHaveChildren =
    (isSystemNode && currentDiagramType === 'context') ||
    (isContainerNode && currentDiagramType === 'container') ||
    isCapabilityNode; // Capability nodes can always link to diagrams

  // Determine target diagram type
  // For capability nodes, we'll load all diagram types (handled in the effect)
  const targetDiagramType: 'container' | 'component' | 'capability' | 'context' | null = canHaveChildren
    ? isSystemNode
      ? 'container'
      : isContainerNode
      ? 'component'
      : isCapabilityNode
      ? 'capability' // Placeholder, we'll load all types
      : null
    : null;

  // Load available diagrams and existing link
  React.useEffect(() => {
    if (
      !canHaveChildren ||
      !node ||
      !navigationService ||
      !currentDiagramPath ||
      !targetDiagramType
    ) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // For capability nodes, load all diagram types (context, container, component, capability)
        if (isCapabilityNode) {
          const [contextDiagrams, containerDiagrams, componentDiagrams, capabilityDiagrams] = await Promise.all([
            navigationService.getDiagramsByType('context'),
            navigationService.getDiagramsByType('container'),
            navigationService.getDiagramsByType('component'),
            navigationService.getDiagramsByType('capability'),
          ]);
          // Combine all diagrams (DiagramLinking component already sorts alphabetically)
          const allDiagrams = [...contextDiagrams, ...containerDiagrams, ...componentDiagrams, ...capabilityDiagrams];
          setAvailableDiagrams(allDiagrams);
        } else {
          // For other nodes (system, container), load only the target type
          const diagrams = await navigationService.getDiagramsByType(targetDiagramType);
          setAvailableDiagrams(diagrams);
        }

        // Get existing link
        const existing = await navigationService.getExistingLink(currentDiagramPath, node.id);
        setLinkedDiagram(existing);
      } catch (error) {
        console.error('BAC4: Error loading diagram data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [canHaveChildren, node?.id, navigationService, currentDiagramPath, targetDiagramType, isCapabilityNode]);

  // Check if linked markdown file exists
  React.useEffect(() => {
    if (node?.data.linkedMarkdownPath && vault) {
      MarkdownLinkService.fileExists(vault, node.data.linkedMarkdownPath).then(
        setMarkdownFileExists
      );
    } else {
      setMarkdownFileExists(false);
    }
  }, [node?.data.linkedMarkdownPath, vault]);

  const handleLabelChange = (value: string) => {
    if (node) onUpdateLabel(node.id, value);
  };

  const handlePropertyChange = (key: string, value: unknown) => {
    if (node) onUpdateProperties(node.id, { [key]: value });
  };

  // Handle diagram link selection
  const handleLinkChange = async (selectedPath: string) => {
    if (!node || !navigationService || !currentDiagramPath) return;

    if (selectedPath === '[NEW]') {
      // Create new child diagram
      if (onCreateAndLinkChild) {
        setLoading(true);
        try {
          await onCreateAndLinkChild(node.id);
          // Reload linked diagram
          const updated = await navigationService.getExistingLink(currentDiagramPath, node.id);
          setLinkedDiagram(updated);
          handlePropertyChange('hasChildDiagram', true);
        } catch (error) {
          console.error('BAC4: Error creating child diagram:', error);
        } finally {
          setLoading(false);
        }
      }
    } else if (selectedPath === '[NONE]') {
      // Unlink
      if (linkedDiagram) {
        // Show warning
        if (
          confirm(
            'Warning: This will unlink the current diagram. The diagram file will not be deleted. Continue?'
          )
        ) {
          setLoading(true);
          try {
            await navigationService.unlinkNode(currentDiagramPath, node.id);
            setLinkedDiagram(null);
            handlePropertyChange('hasChildDiagram', false);
          } catch (error) {
            console.error('BAC4: Error unlinking diagram:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    } else {
      // Link to existing diagram
      if (linkedDiagram && selectedPath !== linkedDiagram.filePath) {
        // Show warning when changing existing link
        if (
          !confirm(
            'Warning: Changing the linked diagram will break existing relationships with this node. Continue?'
          )
        ) {
          return;
        }
      }

      setLoading(true);
      try {
        await navigationService.linkToExistingDiagram(
          currentDiagramPath,
          node.id,
          node.data.label,
          selectedPath
        );
        const updated = await navigationService.getDiagramByPath(selectedPath);
        setLinkedDiagram(updated);
        handlePropertyChange('hasChildDiagram', true);
      } catch (error) {
        console.error('BAC4: Error linking diagram:', error);
        ErrorHandler.handleError(error, 'Failed to link diagram. Check console for details.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Markdown linking handlers
  const handleLinkMarkdownFile = () => {
    if (!node || !app || !currentDiagramPath) return;

    const modal = new LinkMarkdownModal(
      app,
      node.data.label,
      currentDiagramPath,
      async (filePath, createIfMissing) => {
        if (createIfMissing) {
          await onCreateAndLinkMarkdownFile?.(node.id, filePath);
        } else {
          onLinkMarkdownFile?.(node.id, filePath);
        }
      }
    );
    modal.open();
  };

  const handleOpenMarkdownFile = async () => {
    if (!node) return;
    await onOpenLinkedMarkdownFile?.(node.id);
  };

  const handleUnlinkMarkdownFile = () => {
    if (!node) return;
    if (confirm('Unlink this markdown file? The file will not be deleted.')) {
      onUnlinkMarkdownFile?.(node.id);
    }
  };

  const handleCreateMarkdownFile = async () => {
    if (!node || !node.data.linkedMarkdownPath) return;
    await onCreateAndLinkMarkdownFile?.(node.id, node.data.linkedMarkdownPath);
  };

  const handleUpdateMarkdownImage = async () => {
    if (!node) return;
    await onUpdateMarkdownImage?.(node.id);
  };

  // Dragging handlers
  const handleDragMouseDown = React.useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  }, [position]);

  // Global mouse move and up handlers
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    // Explicit return for when isDragging is false
    return undefined;
  }, [isDragging, dragStart]);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: layout.propertyPanelWidth,
        maxHeight: layout.propertyPanelMaxHeight,
        background: UI_COLORS.backgroundPrimary,
        border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        borderRadius: BORDER_RADIUS.large,
        boxShadow: SHADOWS.strong,
        display: 'flex',
        flexDirection: 'column',
        zIndex: Z_INDEX.panel,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Draggable */}
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          padding: layout.panelPadding,
          borderBottom: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <h3 style={{ margin: 0, fontSize: layout.baseFontSize, fontWeight: 600 }}>
          {edge ? 'Edge Properties' : 'Node Properties'}
        </h3>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            color: UI_COLORS.textMuted,
            cursor: 'pointer',
            fontSize: FONT_SIZES.large,
            padding: '0',
          }}
        >
          ✕
        </button>
      </div>

      {/* Properties */}
      <div style={{ flex: 1, overflowY: 'auto', padding: layout.panelPadding }}>
        {/* Navigation Buttons - Only for nodes */}
        {node && (showNavigateToChild || showNavigateToParent) && (
          <div
            style={{
              display: 'flex',
              gap: SPACING.small,
              marginBottom: SPACING.container,
              paddingBottom: SPACING.container,
              borderBottom: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            }}
          >
            {showNavigateToParent && onNavigateToParent && (
              <button
                onClick={onNavigateToParent}
                style={{
                  flex: 1,
                  padding: SPACING.padding.input,
                  background: UI_COLORS.backgroundSecondary,
                  border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                  borderRadius: BORDER_RADIUS.normal,
                  color: UI_COLORS.textNormal,
                  cursor: 'pointer',
                  fontSize: FONT_SIZES.normal,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING.small,
                }}
                title="Navigate to parent diagram"
              >
                <span style={{ fontSize: FONT_SIZES.large }}>−</span>
                <span>Parent</span>
              </button>
            )}
            {showNavigateToChild && onNavigateToChild && (
              <button
                onClick={onNavigateToChild}
                style={{
                  flex: 1,
                  padding: SPACING.padding.input,
                  background: UI_COLORS.interactiveAccent,
                  border: 'none',
                  borderRadius: BORDER_RADIUS.normal,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: FONT_SIZES.normal,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING.small,
                }}
                title="Navigate to child diagram"
              >
                <span style={{ fontSize: FONT_SIZES.large }}>+</span>
                <span>Child</span>
              </button>
            )}
          </div>
        )}

        {/* Edge Properties */}
        {edge && (
          <>
            <FormField
              label="Relationship Label"
              value={String(edge.data?.label || edge.label || '')}
              onChange={(value) => onUpdateEdgeLabel(edge.id, value)}
              placeholder="e.g., uses, depends on, calls"
            />

            <FormSection label="Common Relationships">
              <div style={{ display: 'flex', gap: SPACING.small, flexWrap: 'wrap' }}>
                {COMMON_RELATIONSHIPS.map((label) => (
                  <button
                    key={label}
                    onClick={() => onUpdateEdgeLabel(edge.id, label)}
                    style={{
                      padding: SPACING.padding.button,
                      background: UI_COLORS.backgroundSecondary,
                      border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                      borderRadius: BORDER_RADIUS.small,
                      color: UI_COLORS.textNormal,
                      cursor: 'pointer',
                      fontSize: FONT_SIZES.small,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FormSection>

            <EdgeDirectionSelector
              label="Direction"
              value={(edge.data?.direction as 'right' | 'left' | 'both') || 'right'}
              onChange={(dir) => onUpdateEdgeDirection(edge.id, dir)}
            />

            {/* Edge Style Selector (v2.5.0) */}
            {onUpdateEdgeStyle && (
              <EdgeStyleSelector
                label="Edge Style"
                value={(edge.data?.style as 'diagonal' | 'rightAngle' | 'curved') || 'curved'}
                onChange={(style) => onUpdateEdgeStyle(edge.id, style)}
              />
            )}

            {/* Delete Edge Button */}
            {onDeleteEdge && (
              <div style={{ marginTop: SPACING.container }}>
                <button
                  onClick={() => {
                    if (confirm('Delete this edge? This action cannot be undone.')) {
                      onDeleteEdge(edge.id);
                      onClose();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: SPACING.padding.input,
                    background: '#E74C3C',
                    border: 'none',
                    borderRadius: BORDER_RADIUS.normal,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: FONT_SIZES.normal,
                    fontWeight: 600,
                  }}
                >
                  Delete Edge
                </button>
              </div>
            )}

            {/* Edge ID (read-only) */}
            <div
              style={{
                marginTop: SPACING.container,
                paddingTop: SPACING.container,
                borderTop: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              }}
            >
              <div style={{ fontSize: FONT_SIZES.extraSmall, color: UI_COLORS.textFaint }}>
                Edge ID: {edge.id}
              </div>
              <div
                style={{
                  fontSize: FONT_SIZES.extraSmall,
                  color: UI_COLORS.textFaint,
                  marginTop: SPACING.small,
                }}
              >
                From: {edge.source} → To: {edge.target}
              </div>
            </div>
          </>
        )}

        {/* Node Properties */}
        {node && (
          <>
            <FormField label="Label" value={node.data.label} onChange={handleLabelChange} />

            <ColorPicker
              label="Node Color"
              value={('color' in node.data ? node.data.color : undefined) || '#4A90E2'}
              onChange={(color) => handlePropertyChange('color', color)}
              showPresets={true}
            />

            {/* C4 Node specific properties */}
            {isC4Node && 'type' in node.data && (
              <>
                <FormSection label="Type">
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
                      padding: SPACING.padding.input,
                      background: UI_COLORS.backgroundSecondary,
                      border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                      borderRadius: BORDER_RADIUS.normal,
                      color: UI_COLORS.textNormal,
                      fontSize: FONT_SIZES.normal,
                    }}
                  >
                    <option value="context">Context</option>
                    <option value="container">Container</option>
                    <option value="component">Component</option>
                  </select>
                </FormSection>

                {'technology' in node.data && (
                  <FormField
                    label="Technology"
                    value={node.data.technology || ''}
                    onChange={(value) => handlePropertyChange('technology', value)}
                    placeholder="e.g., Node.js, React"
                  />
                )}

                <FormField
                  label="Description"
                  value={node.data.description || ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="Optional description"
                  rows={3}
                />
              </>
            )}

            {/* Cloud Component specific properties */}
            {isCloudNode && 'provider' in node.data && (
              <>
                <FormSection label="Provider & Category (Read-only)">
                  <div
                    style={{
                      padding: SPACING.padding.input,
                      background: UI_COLORS.backgroundSecondary,
                      borderRadius: BORDER_RADIUS.normal,
                      fontSize: FONT_SIZES.normal,
                      color: UI_COLORS.textMuted,
                    }}
                  >
                    {node.data.provider?.toUpperCase()} - {node.data.category || 'Component'}
                  </div>
                </FormSection>

                {/* Component Type - Shows EC2, Lambda, Fargate, etc. - Read-only */}
                <FormSection label="Type (Read-only)">
                  <div
                    style={{
                      padding: SPACING.padding.input,
                      background: UI_COLORS.backgroundSecondary,
                      borderRadius: BORDER_RADIUS.normal,
                      fontSize: FONT_SIZES.normal,
                      color: UI_COLORS.textMuted,
                    }}
                  >
                    {'componentType' in node.data ? (node.data.componentType || 'Not specified') : 'Not specified'}
                  </div>
                </FormSection>

                {'properties' in node.data &&
                  node.data.properties &&
                  Object.keys(node.data.properties).length > 0 && (
                    <FormSection label="Properties">
                      {Object.entries(node.data.properties as Record<string, unknown>).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: SPACING.large }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: FONT_SIZES.extraSmall,
                              color: UI_COLORS.textMuted,
                              marginBottom: SPACING.tiny,
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
                              padding: SPACING.padding.compact,
                              background: UI_COLORS.backgroundSecondary,
                              border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                              borderRadius: BORDER_RADIUS.small,
                              color: UI_COLORS.textNormal,
                              fontSize: FONT_SIZES.medium,
                            }}
                          />
                        </div>
                      ))}
                    </FormSection>
                  )}

                <FormField
                  label="Notes"
                  value={node.data.notes || ''}
                  onChange={(value) => handlePropertyChange('notes', value)}
                  type="textarea"
                  placeholder="Optional notes"
                  rows={3}
                />
              </>
            )}

            {/* System Node specific properties */}
            {isSystemNode && (
              <>
                <FormField
                  label="Description"
                  value={'description' in node.data ? node.data.description || '' : ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="System description"
                  rows={3}
                />

                <div style={{ marginBottom: SPACING.container }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.large,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={'external' in node.data ? node.data.external || false : false}
                      onChange={(e) => handlePropertyChange('external', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: FONT_SIZES.normal, color: UI_COLORS.textNormal }}>
                      External System
                    </span>
                  </label>
                </div>

                {/* Linked Container Diagram Dropdown */}
                {canHaveChildren && currentDiagramType === 'context' && navigationService && (
                  <DiagramLinking
                    label="Linked Container Diagram"
                    linkedDiagram={linkedDiagram}
                    availableDiagrams={availableDiagrams}
                    diagramType="container"
                    loading={loading}
                    onChange={handleLinkChange}
                    onOpenDiagram={onOpenDiagram}
                  />
                )}
              </>
            )}

            {/* Person Node specific properties */}
            {isPersonNode && (
              <FormField
                label="Role"
                value={'role' in node.data ? node.data.role || '' : ''}
                onChange={(value) => handlePropertyChange('role', value)}
                placeholder="e.g., Administrator, Customer"
              />
            )}

            {/* Container Node specific properties */}
            {isContainerNode && (
              <>
                {/* Icon Selector - Schema v0.4.0 */}
                <IconSelector
                  label="Icon"
                  value={'icon' in node.data ? (node.data.icon || 'box') : 'box'}
                  onChange={(iconId) => handlePropertyChange('icon', iconId)}
                  placeholder="Search icons (cloud, database, server...)"
                />

                {/* Type field (renamed from Technology) - Schema v0.4.0 */}
                <FormField
                  label="Type"
                  value={'type' in node.data ? node.data.type || '' : ''}
                  onChange={(value) => handlePropertyChange('type', value)}
                  placeholder="e.g., REST API, PostgreSQL, Redis Cache"
                />

                <FormField
                  label="Description"
                  value={'description' in node.data ? node.data.description || '' : ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="Container description"
                  rows={3}
                />

                {/* Linked Component Diagram Dropdown */}
                {canHaveChildren && currentDiagramType === 'container' && navigationService && (
                  <DiagramLinking
                    label="Linked Component Diagram"
                    linkedDiagram={linkedDiagram}
                    availableDiagrams={availableDiagrams}
                    diagramType="component"
                    loading={loading}
                    onChange={handleLinkChange}
                    onOpenDiagram={onOpenDiagram}
                  />
                )}
              </>
            )}

            {/* Capability Node specific properties */}
            {isCapabilityNode && (
              <>
                <FormField
                  label="Description"
                  value={'description' in node.data ? node.data.description || '' : ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="Capability description"
                  rows={3}
                />

                <FormField
                  label="Width"
                  value={String('width' in node.data ? node.data.width || 180 : 180)}
                  onChange={(value) => handlePropertyChange('width', Number(value) || 180)}
                  type="number"
                  placeholder="180"
                />

                <FormField
                  label="Height"
                  value={String('height' in node.data ? node.data.height || 100 : 100)}
                  onChange={(value) => handlePropertyChange('height', Number(value) || 100)}
                  type="number"
                  placeholder="100"
                />

                {/* Linked Diagram Dropdown - Can link to any diagram type */}
                {canHaveChildren && navigationService && (
                  <DiagramLinking
                    label="Linked Diagram"
                    linkedDiagram={linkedDiagram}
                    availableDiagrams={availableDiagrams}
                    diagramType="capability"
                    loading={loading}
                    onChange={handleLinkChange}
                    onOpenDiagram={onOpenDiagram}
                  />
                )}
              </>
            )}

            {/* Market Node specific properties (v2.0.0 - Layer 1) */}
            {isMarketNode && (
              <>
                <FormField
                  label="Market Size"
                  value={'marketSize' in node.data ? node.data.marketSize || '' : ''}
                  onChange={(value) => handlePropertyChange('marketSize', value)}
                  placeholder="e.g., $50B, 500K customers"
                />

                <FormField
                  label="Growth Rate"
                  value={'growthRate' in node.data ? node.data.growthRate || '' : ''}
                  onChange={(value) => handlePropertyChange('growthRate', value)}
                  placeholder="e.g., 12% CAGR, High growth"
                />

                <FormField
                  label="Description"
                  value={'description' in node.data ? node.data.description || '' : ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="Market segment description"
                  rows={3}
                />

                <FormField
                  label="Competitors"
                  value={'competitors' in node.data && node.data.competitors ? node.data.competitors.join(', ') : ''}
                  onChange={(value) => {
                    const competitors = value.split(',').map(c => c.trim()).filter(c => c.length > 0);
                    handlePropertyChange('competitors', competitors);
                  }}
                  placeholder="Comma-separated list (e.g., Company A, Company B)"
                />

                <FormField
                  label="Trends"
                  value={'trends' in node.data && node.data.trends ? node.data.trends.join(', ') : ''}
                  onChange={(value) => {
                    const trends = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                    handlePropertyChange('trends', trends);
                  }}
                  placeholder="Comma-separated list (e.g., AI adoption, Cloud migration)"
                />
              </>
            )}

            {/* Organisation Node specific properties (v2.0.0 - Layer 2) */}
            {isOrganisationNode && (
              <>
                <FormField
                  label="Business Unit"
                  value={'businessUnit' in node.data ? node.data.businessUnit || '' : ''}
                  onChange={(value) => handlePropertyChange('businessUnit', value)}
                  placeholder="e.g., Digital Health Division"
                />

                <FormField
                  label="Department"
                  value={'department' in node.data ? node.data.department || '' : ''}
                  onChange={(value) => handlePropertyChange('department', value)}
                  placeholder="e.g., Engineering, Product"
                />

                <FormField
                  label="Headcount"
                  value={String('headcount' in node.data ? node.data.headcount || '' : '')}
                  onChange={(value) => handlePropertyChange('headcount', Number(value) || 0)}
                  type="number"
                  placeholder="Team size"
                />

                <FormField
                  label="Location"
                  value={'location' in node.data ? node.data.location || '' : ''}
                  onChange={(value) => handlePropertyChange('location', value)}
                  placeholder="e.g., London, Remote"
                />

                <FormField
                  label="Description"
                  value={'description' in node.data ? node.data.description || '' : ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="Organisation unit description"
                  rows={3}
                />
              </>
            )}

            {/* Code Node specific properties (v2.0.0 - Layer 7) */}
            {isCodeNode && (
              <>
                <FormField
                  label="GitHub URL"
                  value={'githubUrl' in node.data ? node.data.githubUrl || '' : ''}
                  onChange={(value) => handlePropertyChange('githubUrl', value)}
                  placeholder="https://github.com/org/repo"
                />

                <FormField
                  label="Language"
                  value={'language' in node.data ? node.data.language || '' : ''}
                  onChange={(value) => handlePropertyChange('language', value)}
                  placeholder="e.g., TypeScript, Python, Java"
                />

                <FormSection label="Code Type">
                  <select
                    value={'codeType' in node.data ? node.data.codeType || 'file' : 'file'}
                    onChange={(e) => handlePropertyChange('codeType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: SPACING.padding.input,
                      background: UI_COLORS.backgroundSecondary,
                      border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                      borderRadius: BORDER_RADIUS.normal,
                      color: UI_COLORS.textNormal,
                      fontSize: FONT_SIZES.normal,
                    }}
                  >
                    <option value="file">File</option>
                    <option value="class">Class</option>
                    <option value="function">Function</option>
                    <option value="schema">Schema</option>
                    <option value="table">Table</option>
                  </select>
                </FormSection>

                <FormField
                  label="Repository"
                  value={'repo' in node.data ? node.data.repo || '' : ''}
                  onChange={(value) => handlePropertyChange('repo', value)}
                  placeholder="e.g., org/repo"
                />

                <FormField
                  label="Branch"
                  value={'branch' in node.data ? node.data.branch || '' : ''}
                  onChange={(value) => handlePropertyChange('branch', value)}
                  placeholder="e.g., main, develop"
                />

                <FormField
                  label="File Path"
                  value={'path' in node.data ? node.data.path || '' : ''}
                  onChange={(value) => handlePropertyChange('path', value)}
                  placeholder="e.g., src/services/AuthService.ts"
                />

                <FormField
                  label="Description"
                  value={'description' in node.data ? node.data.description || '' : ''}
                  onChange={(value) => handlePropertyChange('description', value)}
                  type="textarea"
                  placeholder="Code artifact description"
                  rows={3}
                />

                <FormField
                  label="Last Commit"
                  value={'lastCommit' in node.data ? node.data.lastCommit || '' : ''}
                  onChange={(value) => handlePropertyChange('lastCommit', value)}
                  placeholder="e.g., abc123 - Fixed authentication bug"
                />

                <FormField
                  label="Authors"
                  value={'authors' in node.data && node.data.authors ? node.data.authors.join(', ') : ''}
                  onChange={(value) => {
                    const authors = value.split(',').map(a => a.trim()).filter(a => a.length > 0);
                    handlePropertyChange('authors', authors);
                  }}
                  placeholder="Comma-separated list (e.g., Alice Smith, Bob Jones)"
                />
              </>
            )}

            {/* Linked Markdown Documentation */}
            {app && vault && workspace && (
              <FormSection label="Linked Documentation">
                {!node.data.linkedMarkdownPath ? (
                  // No file linked
                  <button
                    onClick={handleLinkMarkdownFile}
                    style={{
                      width: '100%',
                      padding: SPACING.padding.input,
                      background: UI_COLORS.interactiveAccent,
                      border: 'none',
                      borderRadius: BORDER_RADIUS.normal,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: FONT_SIZES.normal,
                      fontWeight: 600,
                    }}
                  >
                    Link to Markdown File
                  </button>
                ) : markdownFileExists ? (
                  // File exists
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.small,
                        padding: SPACING.padding.input,
                        background: UI_COLORS.backgroundSecondary,
                        borderRadius: BORDER_RADIUS.normal,
                        marginBottom: SPACING.small,
                      }}
                    >
                      <span style={{ fontSize: FONT_SIZES.normal }}>📄</span>
                      <span
                        style={{
                          fontSize: FONT_SIZES.small,
                          color: UI_COLORS.textNormal,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {MarkdownLinkService.getFileName(node.data.linkedMarkdownPath)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: SPACING.small, flexWrap: 'wrap' }}>
                      <button
                        onClick={handleOpenMarkdownFile}
                        title="Open linked markdown file"
                        style={{
                          padding: SPACING.padding.button,
                          background: UI_COLORS.interactiveNormal,
                          border: `1px solid ${UI_COLORS.border}`,
                          borderRadius: BORDER_RADIUS.normal,
                          color: UI_COLORS.textNormal,
                          cursor: 'pointer',
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        📄 Open File
                      </button>
                      <button
                        onClick={handleUpdateMarkdownImage}
                        title="Update diagram image in markdown file"
                        style={{
                          padding: SPACING.padding.button,
                          background: UI_COLORS.interactiveNormal,
                          border: `1px solid ${UI_COLORS.border}`,
                          borderRadius: BORDER_RADIUS.normal,
                          color: UI_COLORS.textNormal,
                          cursor: 'pointer',
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        🔄 Update Image
                      </button>
                      <button
                        onClick={handleUnlinkMarkdownFile}
                        title="Unlink markdown file from node"
                        style={{
                          padding: SPACING.padding.button,
                          background: UI_COLORS.interactiveNormal,
                          border: `1px solid ${UI_COLORS.border}`,
                          borderRadius: BORDER_RADIUS.normal,
                          color: UI_COLORS.textNormal,
                          cursor: 'pointer',
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        ❌ Unlink
                      </button>
                    </div>
                  </>
                ) : (
                  // File doesn't exist
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.small,
                        padding: SPACING.padding.input,
                        background: 'rgba(231, 76, 60, 0.1)',
                        borderRadius: BORDER_RADIUS.normal,
                        marginBottom: SPACING.small,
                      }}
                    >
                      <span style={{ fontSize: FONT_SIZES.normal }}>⚠️</span>
                      <span
                        style={{
                          fontSize: FONT_SIZES.small,
                          color: UI_COLORS.textNormal,
                          flex: 1,
                        }}
                      >
                        {MarkdownLinkService.getFileName(node.data.linkedMarkdownPath)} (not found)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: SPACING.small }}>
                      <button
                        onClick={handleCreateMarkdownFile}
                        style={{
                          flex: 1,
                          padding: SPACING.padding.input,
                          background: UI_COLORS.interactiveAccent,
                          border: 'none',
                          borderRadius: BORDER_RADIUS.normal,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: FONT_SIZES.normal,
                          fontWeight: 600,
                        }}
                      >
                        Create File
                      </button>
                      <button
                        onClick={handleLinkMarkdownFile}
                        style={{
                          padding: SPACING.padding.input,
                          background: UI_COLORS.backgroundSecondary,
                          border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                          borderRadius: BORDER_RADIUS.normal,
                          color: UI_COLORS.textNormal,
                          cursor: 'pointer',
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        Change Link
                      </button>
                    </div>
                  </>
                )}
              </FormSection>
            )}

            {/* Cross-References Section (v1.0.1) */}
            {node.data.crossReferences && node.data.crossReferences.length > 0 && (
              <FormSection label="Cross-References">
                <div
                  style={{
                    background: 'rgba(138, 180, 248, 0.1)',
                    border: `1px solid ${UI_COLORS.interactiveAccent}`,
                    borderRadius: BORDER_RADIUS.normal,
                    padding: SPACING.padding.input,
                    marginBottom: SPACING.small,
                  }}
                >
                  <div
                    style={{
                      fontSize: FONT_SIZES.small,
                      color: UI_COLORS.textMuted,
                      marginBottom: SPACING.small,
                    }}
                  >
                    🔗 This node shares its name with nodes in other diagrams:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.small }}>
                    {node.data.crossReferences.map((path, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onOpenDiagram) {
                            onOpenDiagram(path);
                          }
                        }}
                        style={{
                          padding: SPACING.padding.button,
                          background: UI_COLORS.backgroundSecondary,
                          border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                          borderRadius: BORDER_RADIUS.small,
                          color: UI_COLORS.textNormal,
                          cursor: 'pointer',
                          fontSize: FONT_SIZES.small,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING.small,
                        }}
                        title={`Open ${path}`}
                      >
                        <span>📄</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {path.split('/').pop()?.replace('.bac4', '') || path}
                        </span>
                        <span style={{ fontSize: FONT_SIZES.tiny }}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    color: UI_COLORS.textFaint,
                    fontStyle: 'italic',
                  }}
                >
                  Changes to this node may affect the linked diagrams above
                </div>
              </FormSection>
            )}

            {/* Reference Badge (v1.0.1) */}
            {node.data.isReference && (
              <div
                style={{
                  background: 'rgba(138, 180, 248, 0.15)',
                  border: `1px solid ${UI_COLORS.interactiveAccent}`,
                  borderRadius: BORDER_RADIUS.normal,
                  padding: SPACING.padding.input,
                  marginBottom: SPACING.container,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.small,
                }}
              >
                <span style={{ fontSize: FONT_SIZES.normal }}>🔗</span>
                <span style={{ fontSize: FONT_SIZES.small, color: UI_COLORS.textMuted }}>
                  This is a cross-referenced node
                </span>
              </div>
            )}

            {/* Node ID (read-only) */}
            <div
              style={{
                marginTop: SPACING.container,
                paddingTop: SPACING.container,
                borderTop: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              }}
            >
              <div style={{ fontSize: FONT_SIZES.extraSmall, color: UI_COLORS.textFaint }}>
                ID: {node.id}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
