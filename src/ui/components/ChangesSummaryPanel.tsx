/**
 * ChangesSummaryPanel
 *
 * Displays a comprehensive list of changes between timeline snapshots.
 * Shows: Added, Modified, Removed, and Unchanged nodes and edges.
 *
 * @example
 * ```tsx
 * <ChangesSummaryPanel
 *   changeSet={changeSet}
 *   nodes={currentNodes}
 *   edges={currentEdges}
 *   beforeNodes={previousSnapshot.nodes}
 *   beforeEdges={previousSnapshot.edges}
 *   isVisible={showChanges}
 * />
 * ```
 */
import * as React from 'react';
import { Node, Edge } from 'reactflow';
import { ChangeSet } from '../../types/timeline';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../constants';

interface ChangesSummaryPanelProps {
  /** The change set to display */
  changeSet: ChangeSet;
  /** Current nodes (after snapshot) */
  nodes: Node[];
  /** Current edges (after snapshot) */
  edges: Edge[];
  /** Nodes from before snapshot (for showing removed node labels) */
  beforeNodes?: Node[];
  /** Edges from before snapshot (for showing removed edge labels) */
  beforeEdges?: Edge[];
  /** Whether the panel is visible */
  isVisible: boolean;
}

/**
 * ChangesSummaryPanel - Displays timeline changes
 */
export const ChangesSummaryPanel: React.FC<ChangesSummaryPanelProps> = ({
  changeSet,
  nodes,
  edges,
  beforeNodes = [],
  beforeEdges = [],
  isVisible,
}) => {
  if (!isVisible) {
    return null;
  }

  // Helper to get node label by ID
  const getNodeLabel = (nodeId: string, fromBefore = false): string => {
    const nodeList = fromBefore ? beforeNodes : nodes;
    const node = nodeList.find((n) => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  // Helper to get edge label by ID
  const getEdgeLabel = (edgeId: string, fromBefore = false): string => {
    const edgeList = fromBefore ? beforeEdges : edges;
    const edge = edgeList.find((e) => e.id === edgeId);
    const label = edge?.data?.label || (edge as any)?.label || 'connection';
    const sourceLabel = getNodeLabel(edge?.source || '', fromBefore);
    const targetLabel = getNodeLabel(edge?.target || '', fromBefore);
    return `${sourceLabel} → ${targetLabel} (${label})`;
  };

  // Render a section with a list of items
  const renderSection = (
    title: string,
    items: string[],
    color: string,
    icon: string,
    isEdge = false,
    fromBefore = false
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div style={{ marginBottom: SPACING.gap.wide }}>
        <div
          style={{
            fontSize: FONT_SIZES.small,
            fontWeight: 600,
            color: color,
            marginBottom: SPACING.gap.tight,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span>
            {title} ({items.length})
          </span>
        </div>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            fontSize: FONT_SIZES.small,
            color: UI_COLORS.textMuted,
          }}
        >
          {items.map((id) => (
            <li
              key={id}
              style={{
                padding: '4px 8px',
                marginBottom: '2px',
                backgroundColor: `${color}15`,
                borderRadius: BORDER_RADIUS.small,
                borderLeft: `3px solid ${color}`,
              }}
            >
              {isEdge ? getEdgeLabel(id, fromBefore) : getNodeLabel(id, fromBefore)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const totalChanges =
    changeSet.addedNodes.length +
    changeSet.modifiedNodes.length +
    changeSet.removedNodes.length +
    changeSet.addedEdges.length +
    changeSet.removedEdges.length;

  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        right: '16px',
        width: '300px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        backgroundColor: UI_COLORS.backgroundSecondary,
        border: `1px solid ${UI_COLORS.border}`,
        borderRadius: BORDER_RADIUS.normal,
        padding: SPACING.padding.card,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: FONT_SIZES.normal,
          fontWeight: 600,
          color: UI_COLORS.textNormal,
          marginBottom: SPACING.gap.wide,
          paddingBottom: SPACING.gap.tight,
          borderBottom: `2px solid ${UI_COLORS.border}`,
        }}
      >
        📊 Changes Summary
      </div>

      {/* Total Changes */}
      {totalChanges > 0 && (
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.gap.wide,
            padding: '8px',
            backgroundColor: UI_COLORS.interactiveAccent + '15',
            borderRadius: BORDER_RADIUS.small,
          }}
        >
          <strong>{totalChanges}</strong> total change{totalChanges !== 1 ? 's' : ''} detected
        </div>
      )}

      {/* Nodes Section */}
      <div style={{ marginBottom: SPACING.gap.section }}>
        <div
          style={{
            fontSize: FONT_SIZES.normal,
            fontWeight: 600,
            color: UI_COLORS.textNormal,
            marginBottom: SPACING.gap.normal,
          }}
        >
          Nodes
        </div>
        {renderSection('Added', changeSet.addedNodes, '#51CF66', '✨')}
        {renderSection('Modified', changeSet.modifiedNodes, '#FFD93D', '✏️')}
        {renderSection('Removed', changeSet.removedNodes, '#FF6B6B', '🗑️', false, true)}
        {renderSection('Unchanged', changeSet.unchangedNodes, '#888888', '📌')}
      </div>

      {/* Edges Section */}
      <div>
        <div
          style={{
            fontSize: FONT_SIZES.normal,
            fontWeight: 600,
            color: UI_COLORS.textNormal,
            marginBottom: SPACING.gap.normal,
          }}
        >
          Edges
        </div>
        {renderSection('Added', changeSet.addedEdges, '#51CF66', '✨', true)}
        {renderSection('Removed', changeSet.removedEdges, '#FF6B6B', '🗑️', true, true)}
        {renderSection('Unchanged', changeSet.unchangedEdges, '#888888', '📌', true)}
      </div>

      {/* Empty State */}
      {totalChanges === 0 && (
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: UI_COLORS.textMuted,
            textAlign: 'center',
            padding: '24px 16px',
          }}
        >
          No changes detected between snapshots
        </div>
      )}
    </div>
  );
};
