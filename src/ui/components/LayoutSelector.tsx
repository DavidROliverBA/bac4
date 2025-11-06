/**
 * Layout Selector Component
 *
 * Dropdown UI for switching between multiple presentation layouts.
 * Shows all available layouts for the current node file.
 *
 * @version 2.6.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { LayoutInfo } from '../../services/layout-manager-service';
import { getLayoutTemplate } from '../../templates/layout-templates';

interface LayoutSelectorProps {
  layouts: LayoutInfo[];
  currentLayout: LayoutInfo | null;
  onLayoutSwitch: (graphPath: string) => void;
  onCreateLayout: () => void;
  onRenameLayout: (graphPath: string) => void;
  onDeleteLayout: (graphPath: string) => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  layouts,
  currentLayout,
  onLayoutSwitch,
  onCreateLayout,
  onRenameLayout,
  onDeleteLayout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getViewTypeIcon = (viewType: string): string => {
    const template = getLayoutTemplate(viewType as any);
    return template?.icon || '📄';
  };

  const handleLayoutClick = (graphPath: string) => {
    onLayoutSwitch(graphPath);
    setIsOpen(false);
  };

  const handleCreateClick = () => {
    onCreateLayout();
    setIsOpen(false);
  };

  const handleRenameClick = (e: React.MouseEvent, graphPath: string) => {
    e.stopPropagation();
    onRenameLayout(graphPath);
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, graphPath: string) => {
    e.stopPropagation();
    onDeleteLayout(graphPath);
    setIsOpen(false);
  };

  if (!currentLayout) return null;

  return (
    <div className="bac4-layout-selector" ref={dropdownRef}>
      <button
        className="bac4-layout-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch layout"
        aria-expanded={isOpen}
      >
        <span className="bac4-layout-selector-icon">{getViewTypeIcon(currentLayout.viewType)}</span>
        <span className="bac4-layout-selector-title">{currentLayout.title}</span>
        <span className="bac4-layout-selector-arrow">▾</span>
      </button>

      {isOpen && (
        <div className="bac4-layout-selector-dropdown">
          <div className="bac4-layout-selector-section">
            <div className="bac4-layout-selector-section-title">Layouts</div>
            {layouts.map((layout) => (
              <button
                key={layout.graphPath}
                className={`bac4-layout-selector-item ${
                  layout.isCurrent ? 'bac4-layout-selector-item-current' : ''
                }`}
                onClick={() => handleLayoutClick(layout.graphPath)}
              >
                <span className="bac4-layout-selector-item-icon">
                  {getViewTypeIcon(layout.viewType)}
                </span>
                <span className="bac4-layout-selector-item-title">
                  {layout.title}
                  {layout.isDefault && (
                    <span className="bac4-layout-selector-item-badge">default</span>
                  )}
                </span>
                {layout.isCurrent && <span className="bac4-layout-selector-item-checkmark">✓</span>}
                {!layout.isDefault && (
                  <div className="bac4-layout-selector-item-actions">
                    <button
                      className="bac4-layout-selector-item-action"
                      onClick={(e) => handleRenameClick(e, layout.graphPath)}
                      title="Rename layout"
                      aria-label="Rename layout"
                    >
                      ✏️
                    </button>
                    <button
                      className="bac4-layout-selector-item-action"
                      onClick={(e) => handleDeleteClick(e, layout.graphPath)}
                      title="Delete layout"
                      aria-label="Delete layout"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="bac4-layout-selector-divider" />

          <button className="bac4-layout-selector-create" onClick={handleCreateClick}>
            <span className="bac4-layout-selector-create-icon">+</span>
            <span>Create New Layout</span>
          </button>
        </div>
      )}
    </div>
  );
};
