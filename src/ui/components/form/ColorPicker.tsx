/**
 * ColorPicker Component
 * Color input with hex field and preset buttons
 *
 * <AI_MODIFIABLE>
 * This component combines:
 * - Native color picker input
 * - Hex code text input
 * - Preset color buttons
 * Extracted from PropertyPanel.tsx lines 434-501
 * </AI_MODIFIABLE>
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS, COLOR_PRESETS } from '../../../constants';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
}

/**
 * ColorPicker - Color selection UI with presets
 *
 * Performance: Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * <ColorPicker
 *   label="Node Color"
 *   value={node.data.color || '#4A90E2'}
 *   onChange={(color) => handlePropertyChange('color', color)}
 *   showPresets={true}
 * />
 * ```
 */
export const ColorPicker: React.FC<ColorPickerProps> = React.memo(
  ({ label, value, onChange, showPresets = true }) => {
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

        {/* Color picker + hex input */}
        <div style={{ display: 'flex', gap: SPACING.large, alignItems: 'center' }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '48px',
              height: '32px',
              border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              borderRadius: BORDER_RADIUS.normal,
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#4A90E2"
            style={{
              flex: 1,
              padding: SPACING.padding.input,
              background: UI_COLORS.backgroundSecondary,
              border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              borderRadius: BORDER_RADIUS.normal,
              color: UI_COLORS.textNormal,
              fontSize: FONT_SIZES.normal,
              fontFamily: 'monospace',
            }}
          />
        </div>

        {/* Preset colors */}
        {showPresets && (
          <div
            style={{
              display: 'flex',
              gap: SPACING.small,
              marginTop: SPACING.large,
              flexWrap: 'wrap',
            }}
          >
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onChange(preset.value)}
                title={preset.name}
                style={{
                  width: '24px',
                  height: '24px',
                  background: preset.value,
                  border:
                    value === preset.value
                      ? `2px solid ${UI_COLORS.interactiveAccent}`
                      : `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                  borderRadius: BORDER_RADIUS.normal,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
