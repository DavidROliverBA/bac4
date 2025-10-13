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
 * Get the React Flow container element for export
 *
 * We export the main .react-flow container, not the .react-flow__viewport,
 * because the viewport can be transformed/scaled and may have zero dimensions.
 * The container always has the full visible dimensions.
 *
 * @returns The React Flow HTML element or null if not found
 */
function getExportElement(): HTMLElement | null {
  // First, try to get the main React Flow container
  const reactFlow = document.querySelector('.react-flow') as HTMLElement;
  if (reactFlow) {
    const rect = reactFlow.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return reactFlow;
    }
  }

  // Fallback: try viewport (though this usually has issues)
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (viewport) {
    return viewport;
  }

  return null;
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
        console.error('BAC4: ❌ Could not find React Flow container');
        console.error('BAC4: Available elements:', {
          reactFlow: document.querySelectorAll('.react-flow').length,
          viewport: document.querySelectorAll('.react-flow__viewport').length,
        });
        ErrorHandler.handleError(
          new Error('Export element not found'),
          'Failed to find diagram container. Make sure the diagram is fully loaded.'
        );
        return;
      }

      // Log element dimensions for debugging
      const rect = element.getBoundingClientRect();
      console.log(`BAC4: Exporting ${format.toUpperCase()} from element`, {
        elementClass: element.className,
        width: rect.width,
        height: rect.height,
        nodes: nodes.length,
      });

      // Additional validation: Check if element has valid dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.error('BAC4: ❌ Export element has zero dimensions', {
          width: rect.width,
          height: rect.height,
        });
        ErrorHandler.handleError(
          new Error('Export element has zero dimensions'),
          'Cannot export: diagram container has no size. Try waiting for the diagram to fully render.'
        );
        return;
      }

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
            // Validate dataUrl is not empty
            if (!dataUrl || dataUrl.length < 100) {
              console.error('BAC4: ❌ Export produced empty or invalid data URL');
              ErrorHandler.handleError(
                new Error('Empty export result'),
                `Export failed: Generated ${format.toUpperCase()} appears to be empty. Try again or use a different format.`
              );
              return;
            }

            // Create download link and trigger download
            const link = document.createElement('a');
            link.download = `${diagramName}.${getExportExtension(format)}`;
            link.href = dataUrl;
            link.click();
            console.log(`BAC4: ✅ ${format.toUpperCase()} export successful (${dataUrl.length} bytes)`);
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
