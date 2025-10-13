/**
 * EdgeDirectionSelector Component
 * Three-button group for selecting edge direction (→, ←, ↔)
 *
 * <AI_MODIFIABLE>
 * This component provides directional arrow selection for edges.
 * Extracted from PropertyPanel.tsx lines 327-388
 * - Visual arrow icons (Unicode arrows)
 * - Selected state styling
 * - Hover effects
 * </AI_MODIFIABLE>
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS, TRANSITIONS } from '../../../constants';

interface EdgeDirectionSelectorProps {
  label: string;
  value: 'right' | 'left' | 'both';
  onChange: (direction: 'right' | 'left' | 'both') => void;
}

/**
 * EdgeDirectionSelector - Arrow direction button group
 *
 * @example
 * ```tsx
 * <EdgeDirectionSelector
 *   label="Direction"
 *   value={edge.data?.direction || 'right'}
 *   onChange={(dir) => onUpdateEdgeDirection(edge.id, dir)}
 * />
 * ```
 */
export const EdgeDirectionSelector: React.FC<EdgeDirectionSelectorProps> = ({
  label,
  value,
  onChange,
}) => {
  const options = [
    { value: 'right' as const, icon: '→', label: 'Arrow right' },
    { value: 'left' as const, icon: '←', label: 'Arrow left' },
    { value: 'both' as const, icon: '↔', label: 'Arrow both ends' },
  ];

  return (
    <div style={{ marginBottom: SPACING.container }}>
      <label
        style={{
          display: 'block',
          fontSize: FONT_SIZES.small,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          marginBottom: SPACING.small,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: SPACING.large }}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <DirectionButton
              key={option.value}
              option={option}
              isSelected={isSelected}
              onClick={() => onChange(option.value)}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * DirectionButton - Individual arrow button with hover effects
 */
const DirectionButton: React.FC<{
  option: { value: 'right' | 'left' | 'both'; icon: string; label: string };
  isSelected: boolean;
  onClick: () => void;
}> = ({ option, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      title={option.label}
      aria-label={option.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flex: 1,
        padding: '12px 8px',
        background: isSelected
          ? UI_COLORS.interactiveAccent
          : isHovered
            ? UI_COLORS.backgroundModifierHover
            : UI_COLORS.backgroundSecondary,
        border: isSelected
          ? `2px solid ${UI_COLORS.interactiveAccent}`
          : `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        borderRadius: BORDER_RADIUS.normal,
        color: isSelected ? UI_COLORS.textOnAccent : UI_COLORS.textNormal,
        cursor: 'pointer',
        fontSize: FONT_SIZES.icon,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${TRANSITIONS.normal} ${TRANSITIONS.easing}`,
      }}
    >
      {option.icon}
    </button>
  );
};
