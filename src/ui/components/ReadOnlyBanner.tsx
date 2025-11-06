/**
 * ReadOnlyBanner Component
 *
 * Displays a prominent banner when viewing a frozen (read-only) snapshot.
 * Provides a quick action to switch back to the editable "Current" snapshot.
 *
 * @module ReadOnlyBanner
 */

import * as React from 'react';

interface ReadOnlyBannerProps {
  /** The label of the snapshot being viewed (e.g., "Stage 1") */
  snapshotLabel: string;
  /** Callback to switch back to the current working snapshot */
  onSwitchToCurrent: () => void;
}

/**
 * Banner displayed when viewing read-only frozen snapshots
 *
 * Shows lock icon, snapshot name, and action button to switch to Current.
 */
export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({
  snapshotLabel,
  onSwitchToCurrent,
}) => {
  return (
    <div
      style={{
        width: '100%',
        padding: '10px 16px',
        background: 'linear-gradient(90deg, #FFA500 0%, #FF8C00 100%)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #FF8C00',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>🔒</span>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>
          Viewing "{snapshotLabel}" (Read-Only)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', opacity: 0.9 }}>Frozen snapshots cannot be edited</span>
        <button
          onClick={onSwitchToCurrent}
          style={{
            background: '#FFFFFF',
            color: '#FF8C00',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FFF8DC';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>✏️</span>
          <span>Switch to Current</span>
        </button>
      </div>
    </div>
  );
};
