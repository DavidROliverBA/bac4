/**
 * Timing Constants for BAC4 Plugin
 *
 * Centralized timing values for debouncing, delays, and timeouts.
 * All time values are in milliseconds.
 *
 * @remarks
 * Adjust these values to tune application responsiveness and performance.
 */

/**
 * Auto-save debounce time in milliseconds
 *
 * Time to wait after last change before triggering auto-save.
 * Higher values reduce save frequency but increase risk of data loss.
 * Lower values save more frequently but may impact performance.
 *
 * @default 1000ms (1 second)
 */
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

/**
 * Export delay in milliseconds
 *
 * Small delay before triggering export to ensure rendering is complete.
 *
 * @default 100ms
 */
export const EXPORT_DELAY_MS = 100;

/**
 * Duplicate tab detection delay in milliseconds
 *
 * Time to wait before checking for duplicate tabs.
 * Allows views to fully initialize before comparison.
 *
 * @default 50ms
 */
export const DUPLICATE_TAB_CHECK_DELAY_MS = 50;

/**
 * Auto-create child diagram delay in milliseconds
 *
 * Delay after node creation before auto-creating child diagram.
 * Allows node to be added to state before attempting to create child.
 *
 * @default 500ms
 */
export const AUTO_CREATE_CHILD_DELAY_MS = 500;

/**
 * Common timeout durations
 */
export const TIMEOUTS = {
  /** Short timeout for UI updates */
  short: 100,
  /** Medium timeout for network requests */
  medium: 1000,
  /** Long timeout for heavy operations */
  long: 5000,
} as const;

/**
 * Debounce durations for different operations
 */
export const DEBOUNCE = {
  /** Fast debounce for frequent events (typing, scrolling) */
  fast: 150,
  /** Normal debounce for standard operations */
  normal: 300,
  /** Slow debounce for expensive operations */
  slow: 500,
  /** Save operations */
  save: AUTO_SAVE_DEBOUNCE_MS,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /** Quick animations (fade in/out) */
  quick: 150,
  /** Normal animations (transitions) */
  normal: 200,
  /** Slow animations (complex transitions) */
  slow: 300,
} as const;
