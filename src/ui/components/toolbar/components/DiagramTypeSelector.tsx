/**
 * Diagram Type Selector Component
 *
 * Dropdown selector for switching between Context, Container, and Component diagram types.
 * Part of the unified toolbar.
 *
 * @module DiagramTypeSelector
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../../../constants';

export interface DiagramTypeSelectorProps {
  /** Current diagram type */
  currentType: 'context' | 'container' | 'component';
  /** Callback when type changes */
  onTypeChange: (newType: 'context' | 'container' | 'component') => void;
}

/**
 * Diagram type selector dropdown
 *
 * @example
 * ```tsx
 * <DiagramTypeSelector
 *   currentType="context"
 *   onTypeChange={(newType) => setDiagramType(newType)}
 * />
 * ```
 */
export const DiagramTypeSelector: React.FC<DiagramTypeSelectorProps> = ({
  currentType,
  onTypeChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as 'context' | 'container' | 'component';
    onTypeChange(newType);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.normal }}>
      <label
        style={{
          fontSize: FONT_SIZES.small,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          textTransform: 'uppercase',
        }}
      >
        Type:
      </label>
      <select
        value={currentType}
        onChange={handleChange}
        style={{
          padding: SPACING.padding.button,
          borderRadius: BORDER_RADIUS.normal,
          border: `1px solid ${UI_COLORS.border}`,
          background: UI_COLORS.backgroundPrimary,
          color: UI_COLORS.textNormal,
          fontSize: FONT_SIZES.small,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-interface)',
        }}
      >
        <option value="context">Context</option>
        <option value="container">Container</option>
        <option value="component">Component</option>
      </select>
    </div>
  );
};
