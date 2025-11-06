/**
 * ChangeBadge - Visual indicator for node/edge changes
 *
 * Displays a colored badge showing whether a node/edge was:
 * - Added (green)
 * - Modified (blue)
 * - Removed (red)
 *
 * Used when comparing timeline snapshots to show architectural changes.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { ChangeIndicator } from '../../types/timeline';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/ui-constants';

interface ChangeBadgeProps {
  /** Type of change to display */
  changeType: ChangeIndicator;
  /** Optional: Show full label or just icon */
  compact?: boolean;
}

/**
 * Get badge color based on change type
 */
function getBadgeColor(changeType: ChangeIndicator): string {
  switch (changeType) {
    case 'new':
      return '#4CAF50'; // Green
    case 'modified':
      return '#2196F3'; // Blue
    case 'removed':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray fallback
  }
}

/**
 * Get badge label based on change type
 */
function getBadgeLabel(changeType: ChangeIndicator): string {
  switch (changeType) {
    case 'new':
      return 'New';
    case 'modified':
      return 'Modified';
    case 'removed':
      return 'Removed';
    default:
      return 'Unknown';
  }
}

/**
 * Get badge icon based on change type
 */
function getBadgeIcon(changeType: ChangeIndicator): string {
  switch (changeType) {
    case 'new':
      return '+';
    case 'modified':
      return '~';
    case 'removed':
      return '−';
    default:
      return '?';
  }
}

/**
 * ChangeBadge Component
 *
 * Displays a visual indicator for changes in timeline snapshots.
 */
export const ChangeBadge: React.FC<ChangeBadgeProps> = ({ changeType, compact = false }) => {
  const color = getBadgeColor(changeType);
  const label = getBadgeLabel(changeType);
  const icon = getBadgeIcon(changeType);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.gap.tiny,
        padding: compact ? '2px 6px' : '4px 8px',
        backgroundColor: color,
        color: '#FFFFFF',
        fontSize: FONT_SIZES.small,
        fontWeight: 600,
        borderRadius: BORDER_RADIUS.normal,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
      title={`${label} in this snapshot`}
    >
      <span style={{ fontSize: compact ? '10px' : '12px' }}>{icon}</span>
      {!compact && <span>{label}</span>}
    </div>
  );
};

/**
 * NodeChangeBadge - Positioned badge for React Flow nodes
 *
 * Displays change badge in top-right corner of node.
 */
interface NodeChangeBadgeProps {
  changeType: ChangeIndicator;
}

export const NodeChangeBadge: React.FC<NodeChangeBadgeProps> = ({ changeType }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        zIndex: 10,
      }}
    >
      <ChangeBadge changeType={changeType} compact />
    </div>
  );
};

/**
 * EdgeChangeBadge - Badge for edge changes
 *
 * Can be displayed inline or as overlay on edge label.
 */
interface EdgeChangeBadgeProps {
  changeType: ChangeIndicator;
  /** Display inline with edge label */
  inline?: boolean;
}

export const EdgeChangeBadge: React.FC<EdgeChangeBadgeProps> = ({ changeType, inline = false }) => {
  if (inline) {
    return (
      <div style={{ marginLeft: SPACING.gap.tiny }}>
        <ChangeBadge changeType={changeType} compact />
      </div>
    );
  }

  return <ChangeBadge changeType={changeType} compact />;
};
