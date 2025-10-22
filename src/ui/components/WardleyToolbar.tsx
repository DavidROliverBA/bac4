/**
 * Wardley Toolbar Component
 *
 * Specialized toolbar for Wardley Maps with controls for:
 * - Add Component button
 * - Add Inertia Barrier button
 * - Show Axes toggle
 * - Show Grid toggle
 * - Export to OWM button
 *
 * This appears when the diagram type is 'wardley'
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS, SHADOWS } from '../../constants';

interface WardleyToolbarProps {
  /**
   * Whether the Wardley axes are visible
   */
  showAxes: boolean;

  /**
   * Toggle axes visibility
   */
  onToggleAxes: () => void;

  /**
   * Whether the grid is visible
   */
  showGrid: boolean;

  /**
   * Toggle grid visibility
   */
  onToggleGrid: () => void;

  /**
   * Add a Wardley component
   */
  onAddComponent: () => void;

  /**
   * Add an inertia barrier
   */
  onAddInertia: () => void;

  /**
   * Export to Open Wardley Maps format
   */
  onExportOWM?: () => void;

  /**
   * Import from OWM format
   */
  onImportOWM?: () => void;

  /**
   * Background image URL (v2.5.0)
   */
  backgroundImage?: string;

  /**
   * Background image opacity (v2.5.0)
   */
  backgroundOpacity?: number;

  /**
   * Set background image (v2.5.0)
   */
  onSetBackgroundImage?: (imageUrl: string) => void;

  /**
   * Clear background image (v2.5.0)
   */
  onClearBackgroundImage?: () => void;

  /**
   * Set background opacity (v2.5.0)
   */
  onSetBackgroundOpacity?: (opacity: number) => void;
}

export const WardleyToolbar: React.FC<WardleyToolbarProps> = ({
  showAxes,
  onToggleAxes,
  showGrid,
  onToggleGrid,
  onAddComponent,
  onAddInertia,
  onExportOWM,
  onImportOWM,
  backgroundImage,
  backgroundOpacity = 0.3,
  onSetBackgroundImage,
  onClearBackgroundImage,
  onSetBackgroundOpacity,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onSetBackgroundImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onSetBackgroundImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.small,
        padding: SPACING.padding.input,
        background: UI_COLORS.backgroundPrimary,
        borderBottom: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {/* Wardley Map Badge */}
      <div
        style={{
          padding: '4px 12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: BORDER_RADIUS.normal,
          fontSize: FONT_SIZES.small,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          boxShadow: SHADOWS.subtle,
        }}
      >
        Wardley Map
      </div>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '24px',
          background: UI_COLORS.backgroundModifierBorder,
        }}
      />

      {/* Add Component Button */}
      <button
        onClick={onAddComponent}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.small,
          padding: SPACING.padding.button,
          background: UI_COLORS.interactiveAccent,
          border: 'none',
          borderRadius: BORDER_RADIUS.normal,
          color: '#fff',
          cursor: 'pointer',
          fontSize: FONT_SIZES.normal,
          fontWeight: 600,
          boxShadow: SHADOWS.subtle,
        }}
        title="Add a Wardley component to the map"
      >
        <span style={{ fontSize: FONT_SIZES.large }}>+</span>
        <span>Component</span>
      </button>

      {/* Add Inertia Button */}
      <button
        onClick={onAddInertia}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.small,
          padding: SPACING.padding.button,
          background: UI_COLORS.backgroundSecondary,
          border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          borderRadius: BORDER_RADIUS.normal,
          color: UI_COLORS.textNormal,
          cursor: 'pointer',
          fontSize: FONT_SIZES.normal,
          fontWeight: 600,
        }}
        title="Add an inertia barrier to show resistance to change"
      >
        <span style={{ fontSize: FONT_SIZES.large }}>🚧</span>
        <span>Inertia</span>
      </button>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '24px',
          background: UI_COLORS.backgroundModifierBorder,
        }}
      />

      {/* Show Axes Toggle */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.small,
          cursor: 'pointer',
          padding: SPACING.padding.button,
          background: showAxes ? UI_COLORS.interactiveNormal : UI_COLORS.backgroundSecondary,
          border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          borderRadius: BORDER_RADIUS.normal,
          fontSize: FONT_SIZES.normal,
          color: UI_COLORS.textNormal,
          userSelect: 'none',
        }}
        title="Show/hide evolution and visibility axes"
      >
        <input
          type="checkbox"
          checked={showAxes}
          onChange={onToggleAxes}
          style={{ cursor: 'pointer' }}
        />
        <span>Axes</span>
      </label>

      {/* Show Grid Toggle */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.small,
          cursor: 'pointer',
          padding: SPACING.padding.button,
          background: showGrid ? UI_COLORS.interactiveNormal : UI_COLORS.backgroundSecondary,
          border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          borderRadius: BORDER_RADIUS.normal,
          fontSize: FONT_SIZES.normal,
          color: UI_COLORS.textNormal,
          userSelect: 'none',
        }}
        title="Show/hide positioning grid"
      >
        <input
          type="checkbox"
          checked={showGrid}
          onChange={onToggleGrid}
          style={{ cursor: 'pointer' }}
        />
        <span>Grid</span>
      </label>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '24px',
          background: UI_COLORS.backgroundModifierBorder,
        }}
      />

      {/* Background Image Controls (v2.5.0) */}
      {onSetBackgroundImage && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.small,
              padding: SPACING.padding.button,
              background: backgroundImage ? UI_COLORS.interactiveNormal : UI_COLORS.backgroundSecondary,
              border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              borderRadius: BORDER_RADIUS.normal,
              color: UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
            }}
            title="Upload a reference image to trace over"
          >
            <span>🖼️</span>
            <span>{backgroundImage ? 'Change' : 'Add'} Background</span>
          </button>

          {backgroundImage && onClearBackgroundImage && (
            <button
              onClick={onClearBackgroundImage}
              style={{
                padding: SPACING.padding.button,
                background: UI_COLORS.backgroundSecondary,
                border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                borderRadius: BORDER_RADIUS.normal,
                color: UI_COLORS.textNormal,
                cursor: 'pointer',
                fontSize: FONT_SIZES.small,
              }}
              title="Remove background image"
            >
              ✕
            </button>
          )}

          {backgroundImage && onSetBackgroundOpacity && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.small,
                padding: SPACING.padding.button,
                background: UI_COLORS.backgroundSecondary,
                border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                borderRadius: BORDER_RADIUS.normal,
              }}
              title="Adjust background image opacity"
            >
              <span style={{ fontSize: FONT_SIZES.tiny, color: UI_COLORS.textMuted }}>
                Opacity:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={backgroundOpacity}
                onChange={(e) => onSetBackgroundOpacity(parseFloat(e.target.value))}
                style={{
                  width: '80px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: FONT_SIZES.tiny, color: UI_COLORS.textNormal, minWidth: '30px' }}>
                {Math.round(backgroundOpacity * 100)}%
              </span>
            </div>
          )}
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Import OWM Button (optional) */}
      {onImportOWM && (
        <button
          onClick={onImportOWM}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.small,
            padding: SPACING.padding.button,
            background: UI_COLORS.backgroundSecondary,
            border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            borderRadius: BORDER_RADIUS.normal,
            color: UI_COLORS.textNormal,
            cursor: 'pointer',
            fontSize: FONT_SIZES.small,
          }}
          title="Import from Open Wardley Maps (.owm) format"
        >
          <span>📥</span>
          <span>Import OWM</span>
        </button>
      )}

      {/* Export OWM Button (optional) */}
      {onExportOWM && (
        <button
          onClick={onExportOWM}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.small,
            padding: SPACING.padding.button,
            background: UI_COLORS.backgroundSecondary,
            border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            borderRadius: BORDER_RADIUS.normal,
            color: UI_COLORS.textNormal,
            cursor: 'pointer',
            fontSize: FONT_SIZES.small,
          }}
          title="Export to Open Wardley Maps (.owm) format"
        >
          <span>📤</span>
          <span>Export OWM</span>
        </button>
      )}

      {/* Help Icon */}
      <div
        style={{
          padding: SPACING.padding.button,
          fontSize: FONT_SIZES.normal,
          color: UI_COLORS.textMuted,
          cursor: 'help',
        }}
        title="Wardley Mapping: Position components by visibility (Y) and evolution (X). Dependencies flow upward."
      >
        ❓
      </div>
    </div>
  );
};
