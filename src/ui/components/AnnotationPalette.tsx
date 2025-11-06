/**
 * AnnotationPalette - Palette for adding annotations to diagrams
 *
 * Provides drag-and-drop interface for adding:
 * - Sticky notes (text annotations)
 * - Shapes (rectangles, circles, arrows)
 * - Text boxes
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../constants/ui-constants';

export type AnnotationType = 'sticky-note' | 'text-box';

interface AnnotationItem {
  type: AnnotationType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

interface AnnotationPaletteProps {
  /** Callback when annotation drag starts */
  onDragStart: (type: AnnotationType) => void;
  /** Callback when annotation is added (click instead of drag) */
  onAddAnnotation: (type: AnnotationType) => void;
}

const ANNOTATION_ITEMS: AnnotationItem[] = [
  {
    type: 'sticky-note',
    label: 'Sticky Note',
    icon: '📝',
    description: 'Add a sticky note',
    color: '#FFD700',
  },
  {
    type: 'text-box',
    label: 'Text Box',
    icon: '📄',
    description: 'Add a text box',
    color: '#E0E0E0',
  },
];

/**
 * AnnotationPalette Component
 *
 * Displays annotation types for drag-and-drop or click-to-add.
 */
export const AnnotationPalette: React.FC<AnnotationPaletteProps> = ({
  onDragStart,
  onAddAnnotation,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleDragStart = (event: React.DragEvent, type: AnnotationType) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/annotation', type);
    onDragStart(type);
  };

  const handleClick = (type: AnnotationType) => {
    onAddAnnotation(type);
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: '16px',
        top: '80px',
        width: isExpanded ? '200px' : '50px',
        backgroundColor: UI_COLORS.backgroundSecondary,
        border: `1px solid ${UI_COLORS.border}`,
        borderRadius: BORDER_RADIUS.normal,
        padding: SPACING.padding.card,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10,
        transition: 'width 0.2s ease-in-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isExpanded ? SPACING.gap.normal : '0',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span
          style={{
            fontSize: FONT_SIZES.small,
            fontWeight: 600,
            color: UI_COLORS.textNormal,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {isExpanded ? 'Annotations' : '📝'}
        </span>
        <span style={{ fontSize: FONT_SIZES.small, color: UI_COLORS.textMuted }}>
          {isExpanded ? '−' : '+'}
        </span>
      </div>

      {/* Annotation Items */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.gap.tiny }}>
          {ANNOTATION_ITEMS.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              onClick={() => handleClick(item.type)}
              style={{
                padding: SPACING.padding.card,
                backgroundColor: UI_COLORS.backgroundPrimary,
                border: `1px solid ${UI_COLORS.border}`,
                borderRadius: BORDER_RADIUS.small,
                cursor: 'grab',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.gap.tiny,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${item.color}20`;
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = UI_COLORS.backgroundPrimary;
                e.currentTarget.style.borderColor = UI_COLORS.border;
              }}
              title={item.description}
            >
              <span style={{ fontSize: FONT_SIZES.normal }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: FONT_SIZES.small,
                    color: UI_COLORS.textNormal,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions when expanded */}
      {isExpanded && (
        <div
          style={{
            marginTop: SPACING.gap.normal,
            padding: SPACING.padding.card,
            backgroundColor: `${UI_COLORS.interactiveAccent}10`,
            border: `1px solid ${UI_COLORS.interactiveAccent}40`,
            borderRadius: BORDER_RADIUS.small,
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
          }}
        >
          💡 Drag onto canvas or click to add
        </div>
      )}
    </div>
  );
};
