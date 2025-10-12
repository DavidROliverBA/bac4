/**
 * Export Hook
 *
 * Custom React hook for exporting React Flow diagrams to various image formats.
 * Handles PNG, JPEG, and SVG export with proper configuration and error handling.
 *
 * @module useExport
 */

import * as React from 'react';
import { useReactFlow } from 'reactflow';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { EXPORT_DELAY_MS, getExportOptions, getExportExtension } from '../../../../constants';
import { ErrorHandler } from '../../../../utils/error-handling';

export interface UseExportOptions {
  diagramName?: string;
}

export interface ExportHandlers {
  handleExport: (format: 'png' | 'jpeg' | 'svg') => void;
  isExporting: boolean;
}

/**
 * Get the React Flow viewport element for export
 *
 * @returns The viewport HTML element or null if not found
 */
function getExportElement(): HTMLElement | null {
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (viewport) {
    return viewport;
  }
  return document.querySelector('.react-flow') as HTMLElement;
}

/**
 * Custom hook for diagram export functionality
 *
 * Provides a handler function for exporting the current diagram to various image formats.
 * Includes validation, error handling, and proper file download.
 *
 * @param options - Export configuration options
 * @returns Object containing export handler and loading state
 *
 * @example
 * ```tsx
 * const { handleExport, isExporting } = useExport({ diagramName: 'my-diagram' });
 *
 * <button onClick={() => handleExport('png')} disabled={isExporting}>
 *   Export PNG
 * </button>
 * ```
 */
export function useExport(options: UseExportOptions = {}): ExportHandlers {
  const { diagramName = 'diagram' } = options;
  const { getNodes } = useReactFlow();
  const [isExporting, setIsExporting] = React.useState(false);

  /**
   * Handle diagram export to specified format
   *
   * @param format - Image format (png, jpeg, or svg)
   */
  const handleExport = React.useCallback(
    (format: 'png' | 'jpeg' | 'svg') => {
      // Validation: Check if diagram has nodes
      const nodes = getNodes();
      if (nodes.length === 0) {
        ErrorHandler.showInfo('No nodes to export');
        return;
      }

      // Validation: Find export element
      const element = getExportElement();
      if (!element) {
        console.error('Could not find React Flow viewport');
        ErrorHandler.handleError(
          new Error('Export element not found'),
          'Failed to find diagram container'
        );
        return;
      }

      console.log(`BAC4: Exporting ${format.toUpperCase()} from viewport`);
      setIsExporting(true);

      // Small delay to allow UI to update before export
      setTimeout(() => {
        const exportOptions = getExportOptions(format);

        // Select appropriate export function based on format
        let exportPromise: Promise<string>;
        switch (format) {
          case 'png':
            exportPromise = toPng(element, exportOptions);
            break;
          case 'jpeg':
            exportPromise = toJpeg(element, exportOptions);
            break;
          case 'svg':
            exportPromise = toSvg(element, exportOptions);
            break;
        }

        exportPromise
          .then((dataUrl) => {
            // Create download link and trigger download
            const link = document.createElement('a');
            link.download = `${diagramName}.${getExportExtension(format)}`;
            link.href = dataUrl;
            link.click();
            console.log(`BAC4: ✅ ${format.toUpperCase()} export successful`);
          })
          .catch((error) => {
            console.error(`BAC4: ❌ Error exporting ${format.toUpperCase()}:`, error);
            ErrorHandler.handleError(
              error,
              `Failed to export diagram as ${format.toUpperCase()}. Check console for details.`
            );
          })
          .finally(() => {
            setIsExporting(false);
          });
      }, EXPORT_DELAY_MS);
    },
    [getNodes, diagramName]
  );

  return {
    handleExport,
    isExporting,
  };
}
