/**
 * Annotation Buttons Component
 *
 * Provides buttons in the toolbar for adding annotations to diagrams.
 * Replaces the floating AnnotationPalette for better UX.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../../../constants';
import type { AnnotationType } from '../../AnnotationPalette';

interface AnnotationButtonsProps {
  /** Callback when annotation type is selected */
  onAddAnnotation: (type: AnnotationType) => void;
}

interface AnnotationButton {
  type: AnnotationType;
  label: string;
  icon: string;
  title: string;
}

const ANNOTATION_BUTTONS: AnnotationButton[] = [
  {
    type: 'sticky-note',
    label: 'Note',
    icon: '📝',
    title: 'Add sticky note (double-click to edit)',
  },
  {
    type: 'text-box',
    label: 'Text',
    icon: '📄',
    title: 'Add text box (double-click to edit)',
  },
];

/**
 * Annotation Buttons - Toolbar component for adding annotations
 *
 * @example
 * ```tsx
 * <AnnotationButtons
 *   onAddAnnotation={(type) => handleAddAnnotation(type)}
 * />
 * ```
 */
export const AnnotationButtons: React.FC<AnnotationButtonsProps> = ({ onAddAnnotation }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.gap.tight,
      }}
    >
      {ANNOTATION_BUTTONS.map((button) => (
        <button
          key={button.type}
          onClick={() => onAddAnnotation(button.type)}
          title={button.title}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.gap.tiny,
            padding: SPACING.padding.toolbarButton,
            background: UI_COLORS.backgroundPrimary,
            border: `1px solid ${UI_COLORS.border}`,
            borderRadius: BORDER_RADIUS.small,
            color: UI_COLORS.textNormal,
            fontSize: FONT_SIZES.small,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
            e.currentTarget.style.borderColor = UI_COLORS.interactiveAccent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = UI_COLORS.backgroundPrimary;
            e.currentTarget.style.borderColor = UI_COLORS.border;
          }}
        >
          <span style={{ fontSize: FONT_SIZES.normal }}>{button.icon}</span>
          <span style={{ fontWeight: 500 }}>{button.label}</span>
        </button>
      ))}
    </div>
  );
};
