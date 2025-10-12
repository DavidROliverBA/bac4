/**
 * Toolbar Button Component
 *
 * Reusable button component for the unified toolbar.
 * Provides consistent styling, hover effects, and optional icons.
 *
 * @module ToolbarButton
 */

import * as React from 'react';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  TRANSITIONS,
} from '../../../../constants';

export interface ToolbarButtonProps {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon (emoji or unicode character) */
  icon?: string;
  /** Optional title (hover tooltip) */
  title?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Variant styling */
  variant?: 'normal' | 'danger';
  /** Allow drag and drop */
  draggable?: boolean;
  /** Drag start handler */
  onDragStart?: (event: React.DragEvent) => void;
}

/**
 * Reusable toolbar button with consistent styling
 *
 * @example
 * ```tsx
 * <ToolbarButton
 *   label="Add System"
 *   icon="+"
 *   onClick={() => handleAddNode('system')}
 *   title="Add a new system node"
 * />
 * ```
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  label,
  onClick,
  icon,
  title,
  disabled = false,
  variant = 'normal',
  draggable = false,
  onDragStart,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Determine colors based on variant and state
  const getBackgroundColor = () => {
    if (disabled) {
      return UI_COLORS.backgroundSecondary;
    }
    if (variant === 'danger') {
      return isHovered ? UI_COLORS.dangerBackgroundHover : UI_COLORS.dangerBackground;
    }
    return isHovered ? UI_COLORS.interactiveHover : UI_COLORS.interactiveNormal;
  };

  const getBorderColor = () => {
    if (variant === 'danger' && !disabled) {
      return UI_COLORS.dangerBorder;
    }
    return UI_COLORS.border;
  };

  const getTextColor = () => {
    if (disabled) {
      return UI_COLORS.textMuted;
    }
    if (variant === 'danger') {
      return UI_COLORS.dangerText;
    }
    return UI_COLORS.textNormal;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      draggable={draggable}
      onDragStart={onDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: icon ? SPACING.gap.tiny : undefined,
        padding: SPACING.padding.button,
        background: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: BORDER_RADIUS.normal,
        color: getTextColor(),
        cursor: disabled ? 'not-allowed' : draggable ? 'grab' : 'pointer',
        fontSize: FONT_SIZES.small,
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: `all ${TRANSITIONS.fast} ease`,
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};
