/**
 * Navigation Breadcrumbs Component
 *
 * Displays the current navigation path with clickable breadcrumbs.
 * Shows hierarchy from root to current diagram.
 *
 * @version 2.3.0
 */

import * as React from 'react';
import type { NavigationEntry } from '../../services/navigation-history-service';
import type BAC4Plugin from '../../main';

interface NavigationBreadcrumbsProps {
  plugin: BAC4Plugin;
  breadcrumbs: NavigationEntry[];
  onNavigate: (entry: NavigationEntry) => void;
}

export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({
  breadcrumbs,
  onNavigate,
}) => {
  if (breadcrumbs.length === 0) {
    return null;
  }

  const getDisplayName = (filePath: string): string => {
    const fileName = filePath.split('/').pop() || filePath;
    return fileName.replace('.bac4', '');
  };

  const getLayerIcon = (diagramType?: string): string => {
    const icons: Record<string, string> = {
      market: '🏪',
      organisation: '🏢',
      capability: '⚙️',
      context: '🌐',
      container: '📦',
      component: '🔧',
      code: '💻',
      wardley: '📊',
      graph: '🕸️',
    };
    return icons[diagramType || ''] || '📄';
  };

  return (
    <div className="bac4-breadcrumbs" role="navigation" aria-label="Breadcrumb navigation">
      <div className="bac4-breadcrumbs-container">
        {breadcrumbs.map((entry, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const displayName = getDisplayName(entry.filePath);
          const icon = getLayerIcon(entry.diagramType);

          return (
            <React.Fragment key={`${entry.filePath}-${entry.timestamp}`}>
              {index > 0 && (
                <span className="bac4-breadcrumb-separator" aria-hidden="true">
                  →
                </span>
              )}
              <button
                className={`bac4-breadcrumb-item ${isLast ? 'bac4-breadcrumb-current' : ''}`}
                onClick={() => !isLast && onNavigate(entry)}
                disabled={isLast}
                aria-current={isLast ? 'page' : undefined}
                title={entry.filePath}
              >
                <span className="bac4-breadcrumb-icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="bac4-breadcrumb-label">{displayName}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
