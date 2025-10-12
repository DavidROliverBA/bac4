/**
 * Diagram Type Switcher Component
 * Dropdown to switch between Context, Container, and Component diagram types
 */

import * as React from 'react';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  SHADOWS,
} from '../../constants';

interface DiagramTypeSwitcherProps {
  currentType: 'context' | 'container' | 'component';
  onTypeChange: (newType: 'context' | 'container' | 'component') => void;
  disabled?: boolean;
}

export const DiagramTypeSwitcher: React.FC<DiagramTypeSwitcherProps> = ({
  currentType,
  onTypeChange,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as 'context' | 'container' | 'component';
    onTypeChange(newType);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.medium,
        background: UI_COLORS.backgroundSecondary,
        padding: SPACING.padding.card,
        borderRadius: BORDER_RADIUS.large,
        boxShadow: SHADOWS.normal,
        minWidth: '180px',
      }}
    >
      <div
        style={{
          fontSize: FONT_SIZES.small,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Diagram Type
      </div>

      <select
        value={currentType}
        onChange={handleChange}
        disabled={disabled}
        style={{
          padding: SPACING.padding.input,
          borderRadius: BORDER_RADIUS.normal,
          border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          background: UI_COLORS.backgroundPrimary,
          color: UI_COLORS.textNormal,
          fontSize: FONT_SIZES.normal,
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: UI_COLORS.fontInterface,
          width: '100%',
        }}
      >
        <option value="context">Context (Level 1)</option>
        <option value="container">Container (Level 2)</option>
        <option value="component">Component (Level 3)</option>
      </select>

      {/* Type description */}
      <div
        style={{
          fontSize: FONT_SIZES.small,
          color: UI_COLORS.textFaint,
          fontStyle: 'italic',
          marginTop: SPACING.tiny,
        }}
      >
        {currentType === 'context' && 'Systems and people'}
        {currentType === 'container' && 'Apps, services, databases'}
        {currentType === 'component' && 'Code components + cloud'}
      </div>
    </div>
  );
};
