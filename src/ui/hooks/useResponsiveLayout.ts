/**
 * Responsive Layout Hook
 *
 * Detects viewport size and provides responsive layout values.
 * Adjusts UI dimensions for laptop screens vs large monitors.
 *
 * @module useResponsiveLayout
 */

import * as React from 'react';
import { BREAKPOINTS, DIMENSIONS, SPACING, FONT_SIZES } from '../../constants';

interface ResponsiveLayout {
  /** Current screen width */
  screenWidth: number;
  /** Whether the screen is compact (< 1440px) */
  isCompact: boolean;
  /** Whether the screen is small (< 1024px) */
  isSmall: boolean;
  /** Property panel width */
  propertyPanelWidth: string;
  /** Property panel max height */
  propertyPanelMaxHeight: string;
  /** Panel padding */
  panelPadding: string;
  /** Base font size */
  baseFontSize: string;
}

/**
 * Hook to get responsive layout values based on viewport size
 *
 * @returns Responsive layout configuration
 *
 * @example
 * ```tsx
 * const layout = useResponsiveLayout();
 *
 * <div style={{
 *   width: layout.propertyPanelWidth,
 *   padding: layout.panelPadding
 * }}>
 *   ...
 * </div>
 * ```
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth);

  // Listen to window resize
  React.useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine compact mode (laptop screens)
  const isCompact = screenWidth < BREAKPOINTS.md; // < 1440px
  const isSmall = screenWidth < BREAKPOINTS.sm;   // < 1024px

  return {
    screenWidth,
    isCompact,
    isSmall,
    // Use compact dimensions for laptops
    propertyPanelWidth: isCompact
      ? DIMENSIONS.propertyPanelWidthCompact
      : DIMENSIONS.propertyPanelWidth,
    propertyPanelMaxHeight: isCompact
      ? DIMENSIONS.propertyPanelMaxHeightCompact
      : DIMENSIONS.propertyPanelMaxHeight,
    // Reduce padding on smaller screens
    panelPadding: isCompact ? '8px' : SPACING.padding.panel,
    // Slightly smaller font on compact screens
    baseFontSize: isCompact ? FONT_SIZES.small : FONT_SIZES.normal,
  };
}
