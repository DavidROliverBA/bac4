/**
 * Edge Style Selector Component
 *
 * Allows users to choose the visual style of edges:
 * - Diagonal: Straight diagonal lines (Wardley Map style)
 * - Right Angle: Orthogonal/step path with right angles
 * - Curved: Smooth bezier curves (default React Flow style)
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../../constants';
import { FormSection } from '../form/FormSection';

interface EdgeStyleSelectorProps {
  label: string;
  value: 'diagonal' | 'rightAngle' | 'curved';
  onChange: (style: 'diagonal' | 'rightAngle' | 'curved') => void;
}

export const EdgeStyleSelector: React.FC<EdgeStyleSelectorProps> = ({ label, value, onChange }) => {
  const buttons: Array<{
    value: 'diagonal' | 'rightAngle' | 'curved';
    label: string;
    icon: string;
  }> = [
    { value: 'diagonal', label: 'Diagonal', icon: '⟍' },
    { value: 'rightAngle', label: 'Right Angle', icon: '⌐' },
    { value: 'curved', label: 'Curved', icon: '⌒' },
  ];

  return (
    <FormSection label={label}>
      <div style={{ display: 'flex', gap: SPACING.small }}>
        {buttons.map((button) => (
          <button
            key={button.value}
            onClick={() => onChange(button.value)}
            style={{
              flex: 1,
              padding: SPACING.padding.button,
              background:
                value === button.value
                  ? UI_COLORS.interactiveAccent
                  : UI_COLORS.backgroundSecondary,
              border:
                value === button.value ? 'none' : `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              borderRadius: BORDER_RADIUS.normal,
              color: value === button.value ? '#fff' : UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.normal,
              fontWeight: value === button.value ? 600 : 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: SPACING.tiny,
            }}
            title={button.label}
          >
            <span style={{ fontSize: FONT_SIZES.large }}>{button.icon}</span>
            <span style={{ fontSize: FONT_SIZES.tiny }}>{button.label}</span>
          </button>
        ))}
      </div>
    </FormSection>
  );
};
