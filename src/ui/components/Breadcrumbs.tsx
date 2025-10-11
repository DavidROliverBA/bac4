/**
 * Breadcrumb Navigation Component
 * Shows forward link when a node with child is selected: Current → Child
 */

import * as React from 'react';

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
  currentPath,
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
        gap: '8px',
        padding: '6px 12px',
        background: 'var(--background-primary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'var(--font-interface)',
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
                gap: '4px',
                padding: '6px 12px',
                background: isCurrent
                  ? 'var(--background-secondary)'
                  : isChild
                  ? 'var(--interactive-accent)'
                  : 'transparent',
                color: isCurrent
                  ? 'var(--text-normal)'
                  : isChild
                  ? 'var(--text-on-accent)'
                  : 'var(--text-muted)',
                border: isCurrent
                  ? '1px solid var(--background-modifier-border)'
                  : isChild
                  ? '2px solid var(--interactive-accent)'
                  : 'none',
                borderRadius: '6px',
                cursor: isCurrent ? 'default' : 'pointer',
                fontSize: '13px',
                fontWeight: isChild ? 600 : isCurrent ? 500 : 400,
                opacity: 1,
                transition: 'all 0.2s ease',
                boxShadow: isChild ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent && isChild) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                } else if (!isCurrent) {
                  e.currentTarget.style.background = 'var(--background-modifier-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent && isChild) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
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
                  color: 'var(--text-accent)',
                  fontSize: '16px',
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
