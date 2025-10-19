/**
 * Diagram Type Selector Component
 *
 * Dropdown selector for switching between all 7 enterprise architecture layers.
 * v2.0.0: Extended to support full 7-layer model.
 * Part of the unified toolbar.
 *
 * @module DiagramTypeSelector
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../../../constants';
import type { DiagramType } from '../../../../types/canvas-types';

export interface DiagramTypeSelectorProps {
  /** Current diagram type */
  currentType: DiagramType;
  /** Callback when type changes */
  onTypeChange: (newType: DiagramType) => void;
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
    const newType = event.target.value as DiagramType;
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
        Layer:
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
        {/* 7-Layer Enterprise Architecture Model (v2.0.0) */}
        <option value="market">Layer 1: Market</option>
        <option value="organisation">Layer 2: Organisation</option>
        <option value="capability">Layer 3: Capability</option>
        <option value="context">Layer 4: Context</option>
        <option value="container">Layer 5: Container</option>
        <option value="component">Layer 6: Component</option>
        <option value="code">Layer 7: Code</option>
        <option value="graph">Meta: Graph View</option>
      </select>
    </div>
  );
};
