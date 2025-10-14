/**
 * UI Constants for BAC4 Plugin
 *
 * Centralized UI values for consistent styling across the application.
 * All CSS variable references and common UI dimensions are defined here.
 *
 * @remarks
 * These constants map to Obsidian's CSS variables for theme compatibility.
 * Changes here will affect all components using these values.
 */

/**
 * Font sizes used throughout the UI
 */
export const FONT_SIZES = {
  /** 9px - Used for small indicators, badges */
  tiny: '9px',
  /** 10px - Used for metadata, footnotes */
  extraSmall: '10px',
  /** 11px - Used for toolbar buttons, labels */
  small: '11px',
  /** 12px - Used for secondary text */
  medium: '12px',
  /** 13px - Used for primary text, inputs */
  normal: '13px',
  /** 14px - Used for headings */
  large: '14px',
  /** 16px - Used for titles */
  extraLarge: '16px',
  /** 20px - Used for large icons, arrows */
  icon: '20px',
} as const;

/**
 * Spacing values for padding, margins, gaps
 */
export const SPACING = {
  /** No spacing */
  none: '0',
  /** 2px - Minimal spacing */
  tiny: '2px',
  /** 4px - Small gaps between related items */
  small: '4px',
  /** 6px - Medium gaps */
  medium: '6px',
  /** 8px - Standard gaps between sections */
  large: '8px',
  /** 12px - Large gaps, section padding */
  extraLarge: '12px',
  /** 16px - Container padding */
  container: '16px',

  /** Common padding combinations */
  padding: {
    /** 4px 6px - Compact padding */
    compact: '4px 6px',
    /** 4px 8px - Button padding */
    button: '4px 8px',
    /** 4px 10px - Toolbar button padding */
    toolbarButton: '4px 10px',
    /** 6px 8px - Input padding */
    input: '6px 8px',
    /** 6px 12px - Menu item padding */
    menuItem: '6px 12px',
    /** 8px - Card padding */
    card: '8px',
    /** 12px - Panel padding */
    panel: '12px',
    /** 8px 16px - Section padding */
    section: '8px 16px',
    /** 12px 16px - Node padding */
    node: '12px 16px',
  },

  /** Common gap sizes */
  gap: {
    /** 2px - Tiny gap */
    tiny: '2px',
    /** 4px - Tight grouping */
    tight: '4px',
    /** 6px - Normal spacing */
    normal: '6px',
    /** 8px - Comfortable spacing */
    comfortable: '8px',
    /** 16px - Section spacing */
    section: '16px',
    /** 16px - Wide spacing */
    wide: '16px',
  },
} as const;

/**
 * Obsidian theme colors
 * These map to CSS variables for automatic theme support
 */
export const UI_COLORS = {
  // Background colors
  backgroundPrimary: 'var(--background-primary)',
  backgroundSecondary: 'var(--background-secondary)',
  backgroundPrimaryAlt: 'var(--background-primary-alt)',
  backgroundModifierBorder: 'var(--background-modifier-border)',
  backgroundModifierHover: 'var(--background-modifier-hover)',

  // Text colors
  textNormal: 'var(--text-normal)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  textAccent: 'var(--text-accent)',
  textOnAccent: 'var(--text-on-accent)',

  // Interactive colors
  interactiveNormal: 'var(--interactive-normal)',
  interactiveHover: 'var(--interactive-hover)',
  interactiveAccent: 'var(--interactive-accent)',
  interactiveAccentHover: 'var(--interactive-accent-hover)',

  // Border colors
  border: 'var(--background-modifier-border)',

  // Danger colors (for delete/warning actions)
  dangerBackground: 'rgba(220, 38, 38, 0.1)',
  dangerBackgroundHover: 'rgba(220, 38, 38, 0.15)',
  dangerBorder: 'rgba(220, 38, 38, 0.3)',
  dangerText: 'rgb(220, 38, 38)',

  // Font
  fontInterface: 'var(--font-interface)',
} as const;

/**
 * Common border radius values
 */
export const BORDER_RADIUS = {
  /** 3px - Small elements */
  small: '3px',
  /** 4px - Standard elements */
  normal: '4px',
  /** 8px - Cards, panels */
  large: '8px',
} as const;

/**
 * Common dimensions
 */
export const DIMENSIONS = {
  /** Toolbar height */
  toolbarHeight: '40px',
  /** Separator line height */
  separatorHeight: '24px',
  /** Separator line width */
  separatorWidth: '1px',
  /** Minimum button width */
  buttonMinWidth: '140px',
  /** Maximum button width */
  buttonMaxWidth: '160px',
  /** Property panel width */
  propertyPanelWidth: '260px',
  /** Property panel max height */
  propertyPanelMaxHeight: '550px',
} as const;

/**
 * Node dimensions (min/max width for diagram nodes)
 */
export const NODE_DIMENSIONS = {
  /** Minimum node width */
  minWidth: '75px',
  /** Maximum node width */
  maxWidth: '125px',
} as const;

/**
 * Common box shadow values
 */
export const SHADOWS = {
  /** Subtle shadow for slight elevation */
  subtle: '0 2px 8px rgba(0,0,0,0.1)',
  /** Normal shadow for modals, dropdowns */
  normal: '0 2px 8px rgba(0,0,0,0.15)',
  /** Strong shadow for floating panels */
  strong: '0 4px 12px rgba(0,0,0,0.15)',
} as const;

// <AI_MODIFIABLE>
/**
 * Color presets for node customization
 * Add new color presets here to appear in ColorPicker component
 */
export const COLOR_PRESETS = [
  { name: 'Blue', value: '#4A90E2' },
  { name: 'Green', value: '#7ED321' },
  { name: 'Orange', value: '#F5A623' },
  { name: 'Purple', value: '#9B59B6' },
  { name: 'Red', value: '#E74C3C' },
  { name: 'Teal', value: '#16A085' },
  { name: 'Gray', value: '#95A5A6' },
  { name: 'Pink', value: '#E91E63' },
] as const;
// </AI_MODIFIABLE>

/**
 * Default node color
 */
export const DEFAULT_NODE_COLOR = '#4A90E2';

/**
 * C4 diagram type colors
 * Used for C4Node component to color by diagram type
 */
export const C4_TYPE_COLORS = {
  context: '#4A90E2',
  container: '#7ED321',
  component: '#F5A623',
} as const;

/**
 * Delete button colors (danger state)
 */
export const DANGER_COLORS = {
  background: 'rgba(220, 38, 38, 0.1)',
  backgroundHover: 'rgba(220, 38, 38, 0.15)',
  border: 'rgba(220, 38, 38, 0.3)',
  text: 'rgb(220, 38, 38)',
} as const;

/**
 * Transition durations
 */
export const TRANSITIONS = {
  /** Fast transition for hover effects */
  fast: '0.15s',
  /** Normal transition for state changes */
  normal: '0.2s',
  /** Slow transition for animations */
  slow: '0.3s',

  /** Common easing function */
  easing: 'ease',
} as const;

/**
 * Z-index layers for stacking context
 */
export const Z_INDEX = {
  /** Background layer */
  background: 0,
  /** Canvas content */
  canvas: 1,
  /** UI panels */
  panel: 10,
  /** Dropdown menus */
  dropdown: 1000,
  /** Modals */
  modal: 2000,
  /** Tooltips */
  tooltip: 3000,
} as const;
