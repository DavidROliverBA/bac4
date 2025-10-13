/**
 * Breadcrumb Navigation Component
 * Shows forward link when a node with child is selected: Current → Child
 */

import * as React from 'react';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  TRANSITIONS,
  SHADOWS,
} from '../../constants';

interface Breadcrumb {
  label: string;
  path: string;
  type: 'context' | 'container' | 'component' | 'current' | 'child' | string;
}

interface BreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  breadcrumbs,
  onNavigate,
}) => {
  if (breadcrumbs.length === 0) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'context':
        return '🌍';
      case 'container':
        return '📦';
      case 'component':
        return '⚙️';
      case 'current':
        return '📍'; // Current location
      case 'child':
        return '🔗'; // Link to child
      default:
        return '📄';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.large,
        padding: SPACING.padding.input,
        background: UI_COLORS.backgroundPrimary,
        border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        borderRadius: BORDER_RADIUS.normal,
        fontSize: FONT_SIZES.medium,
        fontFamily: UI_COLORS.fontInterface,
      }}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isCurrent = crumb.type === 'current';
        const isChild = crumb.type === 'child';

        return (
          <React.Fragment key={crumb.path}>
            <button
              onClick={() => onNavigate(crumb.path)}
              disabled={isCurrent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.small,
                padding: SPACING.padding.input,
                background: isCurrent
                  ? UI_COLORS.backgroundSecondary
                  : isChild
                  ? UI_COLORS.interactiveAccent
                  : 'transparent',
                color: isCurrent
                  ? UI_COLORS.textNormal
                  : isChild
                  ? UI_COLORS.textOnAccent
                  : UI_COLORS.textMuted,
                border: isCurrent
                  ? `1px solid ${UI_COLORS.backgroundModifierBorder}`
                  : isChild
                  ? `2px solid ${UI_COLORS.interactiveAccent}`
                  : 'none',
                borderRadius: BORDER_RADIUS.normal,
                cursor: isCurrent ? 'default' : 'pointer',
                fontSize: FONT_SIZES.normal,
                fontWeight: isChild ? 600 : isCurrent ? 500 : 400,
                opacity: 1,
                transition: `all ${TRANSITIONS.normal} ${TRANSITIONS.easing}`,
                boxShadow: isChild ? SHADOWS.subtle : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent && isChild) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = SHADOWS.normal;
                } else if (!isCurrent) {
                  e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent && isChild) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = SHADOWS.subtle;
                } else if (!isCurrent) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              title={
                isCurrent
                  ? `Current diagram: ${crumb.label}`
                  : isChild
                  ? `Click to open child diagram: ${crumb.label}`
                  : `${crumb.type} diagram: ${crumb.label}`
              }
            >
              <span>{getTypeIcon(crumb.type)}</span>
              <span>{crumb.label}</span>
            </button>

            {!isLast && (
              <span
                style={{
                  color: UI_COLORS.textAccent,
                  fontSize: FONT_SIZES.extraLarge,
                  fontWeight: 600,
                }}
              >
                →
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
