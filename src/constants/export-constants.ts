/**
 * Export Constants for BAC4 Plugin
 *
 * Configuration for diagram export functionality (PNG, JPEG, SVG).
 * These values control export quality and resolution.
 */

/**
 * Default pixel ratio for high-DPI displays
 *
 * Higher values create larger, higher-resolution images.
 * Recommended: 2 for retina displays, 1 for standard displays.
 *
 * @default 2
 */
export const DEFAULT_PIXEL_RATIO = 2;

/**
 * JPEG quality setting (0-1)
 *
 * Higher values = better quality but larger file size.
 * Recommended: 0.90-0.95 for good balance.
 *
 * @default 0.95
 */
export const JPEG_QUALITY = 0.95;

/**
 * Background color for exports
 *
 * Used as background when exporting transparent diagrams.
 * White ensures good visibility in most contexts.
 *
 * @default '#ffffff'
 */
export const EXPORT_BACKGROUND_COLOR = '#ffffff';

/**
 * Cache busting for exports
 *
 * When true, adds timestamp to export to prevent caching issues.
 *
 * @default true
 */
export const EXPORT_CACHE_BUST = true;

/**
 * Export format configurations
 */
export const EXPORT_FORMATS = {
  png: {
    extension: 'png',
    label: 'PNG (High Quality)',
    mimeType: 'image/png',
    description: 'Lossless format, best for documentation',
  },
  jpeg: {
    extension: 'jpg',
    label: 'JPEG (Smaller Size)',
    mimeType: 'image/jpeg',
    description: 'Compressed format, smaller file size',
  },
  svg: {
    extension: 'svg',
    label: 'SVG (Vector)',
    mimeType: 'image/svg+xml',
    description: 'Scalable vector format',
  },
} as const;

/**
 * Export format type union
 */
export type ExportFormat = keyof typeof EXPORT_FORMATS;

/**
 * Export options interface
 */
export interface ExportOptions {
  backgroundColor: string;
  cacheBust: boolean;
  pixelRatio: number;
  quality?: number;
}

/**
 * Get export options for a specific format
 *
 * @param format - Export format (png, jpeg, svg)
 * @returns Export options object
 */
export function getExportOptions(format: ExportFormat): ExportOptions {
  const baseOptions: ExportOptions = {
    backgroundColor: EXPORT_BACKGROUND_COLOR,
    cacheBust: EXPORT_CACHE_BUST,
    pixelRatio: DEFAULT_PIXEL_RATIO,
  };

  if (format === 'jpeg') {
    return {
      ...baseOptions,
      quality: JPEG_QUALITY,
    };
  }

  return baseOptions;
}

/**
 * Get file extension for export format
 *
 * @param format - Export format
 * @returns File extension (e.g., 'png', 'jpg', 'svg')
 */
export function getExportExtension(format: ExportFormat): string {
  return EXPORT_FORMATS[format].extension;
}

/**
 * Get display label for export format
 *
 * @param format - Export format
 * @returns Human-readable label
 */
export function getExportLabel(format: ExportFormat): string {
  return EXPORT_FORMATS[format].label;
}
