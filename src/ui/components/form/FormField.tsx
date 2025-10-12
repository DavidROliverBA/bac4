/**
 * FormField Component
 * Reusable form field with label and input/textarea
 *
 * <AI_MODIFIABLE>
 * This component follows the extracted pattern from PropertyPanel.tsx
 * - Consistent label styling (uppercase, small font, muted color)
 * - Flexible input element (input, textarea, select)
 * - Full width layout
 * </AI_MODIFIABLE>
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../../constants';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'number';
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

/**
 * FormField - Label + input with consistent styling
 *
 * Performance: Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Label"
 *   value={node.data.label}
 *   onChange={(value) => handlePropertyChange('label', value)}
 *   placeholder="Enter label"
 * />
 * ```
 */
export const FormField: React.FC<FormFieldProps> = React.memo(({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  rows = 3,
  disabled = false,
}) => {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: SPACING.padding.input,
    background: UI_COLORS.backgroundSecondary,
    border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
    borderRadius: BORDER_RADIUS.normal,
    color: UI_COLORS.textNormal,
    fontSize: FONT_SIZES.normal,
    fontFamily: UI_COLORS.fontInterface,
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical' as const,
  };

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
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          style={textareaStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
        />
      )}
    </div>
  );
});
