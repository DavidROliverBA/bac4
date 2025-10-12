/**
 * Export Menu Component
 *
 * Dropdown menu for exporting diagrams to various image formats (PNG, JPEG, SVG).
 * Includes click-outside-to-close functionality and loading states.
 *
 * @module ExportMenu
 */

import * as React from 'react';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  SHADOWS,
  TRANSITIONS,
  Z_INDEX,
} from '../../../../constants';

export interface ExportMenuProps {
  /** Export handler function */
  onExport: (format: 'png' | 'jpeg' | 'svg') => void;
  /** Whether export is currently in progress */
  isExporting?: boolean;
}

/**
 * Export dropdown menu with format options
 *
 * @example
 * ```tsx
 * const { handleExport, isExporting } = useExport({ diagramName: 'my-diagram' });
 *
 * <ExportMenu
 *   onExport={handleExport}
 *   isExporting={isExporting}
 * />
 * ```
 */
export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport, isExporting = false }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as globalThis.Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleExportClick = (format: 'png' | 'jpeg' | 'svg') => {
    setShowMenu(false);
    onExport(format);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        title="Export diagram"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.gap.tiny,
          padding: SPACING.padding.button,
          background: UI_COLORS.interactiveNormal,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: BORDER_RADIUS.normal,
          color: UI_COLORS.textNormal,
          cursor: isExporting ? 'not-allowed' : 'pointer',
          fontSize: FONT_SIZES.small,
          fontWeight: 500,
          opacity: isExporting ? 0.5 : 1,
          whiteSpace: 'nowrap',
          transition: `all ${TRANSITIONS.fast} ease`,
        }}
        onMouseEnter={(e) => {
          if (!isExporting) {
            e.currentTarget.style.background = UI_COLORS.interactiveHover;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = UI_COLORS.interactiveNormal;
        }}
      >
        <span>💾</span>
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <span style={{ fontSize: FONT_SIZES.tiny }}>{showMenu ? '▲' : '▼'}</span>
      </button>

      {/* Export Format Dropdown */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: SPACING.gap.tiny,
            background: UI_COLORS.backgroundPrimary,
            border: `1px solid ${UI_COLORS.border}`,
            borderRadius: BORDER_RADIUS.normal,
            boxShadow: SHADOWS.normal,
            zIndex: Z_INDEX.dropdown,
            overflow: 'hidden',
            minWidth: '180px',
          }}
        >
          <button
            onClick={() => handleExportClick('png')}
            style={{
              display: 'block',
              width: '100%',
              padding: SPACING.padding.input,
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${UI_COLORS.border}`,
              color: UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
              textAlign: 'left',
              transition: `background ${TRANSITIONS.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            PNG (High Quality)
          </button>
          <button
            onClick={() => handleExportClick('jpeg')}
            style={{
              display: 'block',
              width: '100%',
              padding: SPACING.padding.input,
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${UI_COLORS.border}`,
              color: UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
              textAlign: 'left',
              transition: `background ${TRANSITIONS.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            JPEG (Smaller Size)
          </button>
          <button
            onClick={() => handleExportClick('svg')}
            style={{
              display: 'block',
              width: '100%',
              padding: SPACING.padding.input,
              background: 'transparent',
              border: 'none',
              color: UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
              textAlign: 'left',
              transition: `background ${TRANSITIONS.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            SVG (Vector)
          </button>
        </div>
      )}
    </div>
  );
};
