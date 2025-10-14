/**
 * IconSelector Component
 * Searchable icon picker using Lucide icons from Obsidian API
 *
 * Features:
 * - Search through ALL Lucide icons (1,600+)
 * - Preview selected icon
 * - Categorized icon browsing
 * - Popular icons shown first
 * - Infinite scroll for large lists
 *
 * Schema Version: 0.4.0
 */

import * as React from 'react';
import { getIconIds, setIcon } from 'obsidian';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../../constants';

interface IconSelectorProps {
  label: string;
  value: string; // Current icon ID (e.g., "cloud-cog", "database")
  onChange: (iconId: string) => void;
  placeholder?: string;
}


/**
 * IconSelector - Searchable icon picker with Lucide icons
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const IconSelector: React.FC<IconSelectorProps> = React.memo(
  ({ label, value, onChange, placeholder = 'Search icons...' }) => {
    const [search, setSearch] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [filteredIcons, setFilteredIcons] = React.useState<string[]>([]);
    const [displayLimit, setDisplayLimit] = React.useState(50);
    const [totalIconCount, setTotalIconCount] = React.useState(0);
    const previewRef = React.useRef<HTMLSpanElement>(null);
    const gridRef = React.useRef<HTMLDivElement>(null);

    // Load and filter icons
    React.useEffect(() => {
      const allIcons = getIconIds()
        .filter((id) => !id.startsWith('lucide-'))
        .sort();

      setTotalIconCount(allIcons.length);

      let filtered: string[] = [];

      if (search) {
        // Filter by search term
        filtered = allIcons.filter((id) =>
          id.toLowerCase().includes(search.toLowerCase())
        );
      } else {
        // Show all icons
        filtered = allIcons;
      }

      setFilteredIcons(filtered);
      setDisplayLimit(50); // Reset display limit when filter changes
    }, [search]);

    // Handle scroll for infinite loading
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;

      // Load more when scrolled 80% down
      if (scrollPercentage > 0.8 && displayLimit < filteredIcons.length) {
        setDisplayLimit(prev => Math.min(prev + 50, filteredIcons.length));
      }
    }, [filteredIcons.length, displayLimit]);

    // Render preview icon
    React.useEffect(() => {
      if (previewRef.current && value) {
        previewRef.current.innerHTML = '';
        setIcon(previewRef.current, value);
      }
    }, [value]);

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

        {/* Current icon preview */}
        {value && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.small,
              padding: SPACING.padding.input,
              background: UI_COLORS.backgroundSecondary,
              borderRadius: BORDER_RADIUS.normal,
              marginBottom: SPACING.small,
            }}
          >
            <span
              ref={previewRef}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: FONT_SIZES.large,
              }}
            />
            <span style={{ fontSize: FONT_SIZES.normal, color: UI_COLORS.textNormal }}>
              {value}
            </span>
            <button
              onClick={() => onChange('')}
              style={{
                marginLeft: 'auto',
                padding: '2px 8px',
                background: 'transparent',
                border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                borderRadius: BORDER_RADIUS.small,
                color: UI_COLORS.textMuted,
                cursor: 'pointer',
                fontSize: FONT_SIZES.small,
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Search input */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: SPACING.padding.input,
            background: UI_COLORS.backgroundSecondary,
            border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            borderRadius: BORDER_RADIUS.normal,
            color: UI_COLORS.textNormal,
            fontSize: FONT_SIZES.normal,
            fontFamily: UI_COLORS.fontInterface,
          }}
        />

        {/* Icon count and info */}
        {!isOpen && (
          <div
            style={{
              marginTop: SPACING.small,
              fontSize: FONT_SIZES.extraSmall,
              color: UI_COLORS.textFaint,
            }}
          >
            {totalIconCount} icons available • Click to browse or search
          </div>
        )}

        {/* Icon grid dropdown */}
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
            />

            {/* Icon grid container */}
            <div
              style={{
                position: 'relative',
                zIndex: 1000,
                marginTop: SPACING.small,
                background: UI_COLORS.backgroundPrimary,
                border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                borderRadius: BORDER_RADIUS.normal,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {/* Result count */}
              <div
                style={{
                  padding: `${SPACING.small} ${SPACING.padding.panel}`,
                  fontSize: FONT_SIZES.extraSmall,
                  color: UI_COLORS.textMuted,
                  borderBottom: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
                }}
              >
                Showing {Math.min(displayLimit, filteredIcons.length)} of {filteredIcons.length} icons
                {displayLimit < filteredIcons.length && ' • Scroll for more'}
              </div>

              {/* Icon grid */}
              {filteredIcons.length > 0 ? (
                <div
                  ref={gridRef}
                  onScroll={handleScroll}
                  style={{
                    padding: SPACING.padding.panel,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                    gap: SPACING.small,
                  }}
                >
                  {filteredIcons.slice(0, displayLimit).map((iconId) => (
                    <IconButton
                      key={iconId}
                      iconId={iconId}
                      isSelected={value === iconId}
                      onClick={() => {
                        onChange(iconId);
                        setIsOpen(false);
                        setSearch('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: SPACING.padding.panel,
                    textAlign: 'center',
                    color: UI_COLORS.textMuted,
                    fontSize: FONT_SIZES.small,
                  }}
                >
                  No icons found for "{search}"
                </div>
              )}
            </div>
          </>
        )}

      </div>
    );
  }
);

/**
 * IconButton - Individual icon button in the grid
 * Separated for better React rendering performance
 */
interface IconButtonProps {
  iconId: string;
  isSelected: boolean;
  onClick: () => void;
}

const IconButton: React.FC<IconButtonProps> = React.memo(({ iconId, isSelected, onClick }) => {
  const iconRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (iconRef.current) {
      iconRef.current.innerHTML = '';
      setIcon(iconRef.current, iconId);
    }
  }, [iconId]);

  return (
    <button
      ref={iconRef}
      onClick={onClick}
      title={iconId}
      style={{
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isSelected ? UI_COLORS.interactiveAccent : UI_COLORS.backgroundSecondary,
        border: 'none',
        borderRadius: BORDER_RADIUS.small,
        cursor: 'pointer',
        color: isSelected ? '#fff' : UI_COLORS.textNormal,
        fontSize: FONT_SIZES.large,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = UI_COLORS.backgroundSecondary;
        }
      }}
    />
  );
});
