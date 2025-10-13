/**
 * FormSection Component
 * Labeled section container for grouping form elements
 *
 * <AI_MODIFIABLE>
 * This component wraps related form fields with a consistent label style.
 * Used for grouping related inputs in PropertyPanel.
 * </AI_MODIFIABLE>
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS } from '../../../constants';

interface FormSectionProps {
  label: string;
  children: React.ReactNode;
  marginBottom?: string;
}

/**
 * FormSection - Section with label and children
 *
 * Performance: Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * <FormSection label="Common Relationships">
 *   <div>...buttons...</div>
 * </FormSection>
 * ```
 */
export const FormSection: React.FC<FormSectionProps> = React.memo(
  ({ label, children, marginBottom = SPACING.container }) => {
    return (
      <div style={{ marginBottom }}>
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
        {children}
      </div>
    );
  }
);
