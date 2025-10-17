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
import type { Timeline } from '../../../../types/timeline';
import { TimelineService } from '../../../../services/TimelineService';

export interface UseExportOptions {
  diagramName?: string;
  timeline?: Timeline | null; // v1.0.0: Include timeline for watermark
}

export interface ExportHandlers {
  handleExport: (format: 'png' | 'jpeg' | 'svg') => void;
  isExporting: boolean;
}

/**
 * Get the canvas export container element
 *
 * We export the .bac4-canvas-export-container which includes both the React Flow
 * canvas AND the AnnotationOverlay, ensuring annotations are included in exports.
 *
 * @returns The canvas export container HTML element or null if not found
 */
function getExportElement(): HTMLElement | null {
  // Try to get the BAC4 canvas export container (includes ReactFlow + AnnotationOverlay)
  const exportContainer = document.querySelector('.bac4-canvas-export-container') as HTMLElement;
  if (exportContainer) {
    const rect = exportContainer.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return exportContainer;
    }
  }

  // Fallback: try the main React Flow container
  const reactFlow = document.querySelector('.react-flow') as HTMLElement;
  if (reactFlow) {
    const rect = reactFlow.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return reactFlow;
    }
  }

  return null;
}

/**
 * Hide UI controls during export
 *
 * Temporarily hides zoom controls, palette, property panel, and toolbars
 * so they don't appear in the exported image.
 *
 * @returns Array of hidden elements (to restore later)
 */
function hideUIControlsForExport(): HTMLElement[] {
  const hiddenElements: HTMLElement[] = [];

  // Hide zoom controls (canvas controls)
  const zoomControls = document.querySelectorAll('.bac4-canvas-export-container > div[style*="position: absolute"][style*="bottom: 16px"]');
  zoomControls.forEach((el) => {
    const element = el as HTMLElement;
    hiddenElements.push(element);
    element.style.display = 'none';
  });

  // Hide component palette
  const palette = document.querySelector('.bac4-canvas-export-container .component-palette') as HTMLElement;
  if (palette) {
    hiddenElements.push(palette);
    palette.style.display = 'none';
  }

  // Hide property panel
  const propertyPanel = document.querySelector('.property-panel') as HTMLElement;
  if (propertyPanel) {
    hiddenElements.push(propertyPanel);
    propertyPanel.style.display = 'none';
  }

  // Hide formatting toolbars (annotation toolbars)
  const toolbars = document.querySelectorAll('.bac4-canvas-export-container > div > div[style*="position: absolute"][style*="top"][style*="px"]');
  toolbars.forEach((el) => {
    const element = el as HTMLElement;
    if (element.style.zIndex === '101') { // Formatting toolbar has z-index 101
      hiddenElements.push(element);
      element.style.display = 'none';
    }
  });

  return hiddenElements;
}

/**
 * Restore UI controls after export
 *
 * @param elements - Array of elements that were hidden
 */
function restoreUIControls(elements: HTMLElement[]): void {
  elements.forEach((el) => {
    el.style.display = '';
  });
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
  const { diagramName = 'diagram', timeline } = options;
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

      // Hide UI controls before export
      const hiddenElements = hideUIControlsForExport();

      // Add watermark if timeline exists
      let watermarkElement: HTMLElement | null = null;
      if (timeline) {
        const currentSnapshot = TimelineService.getCurrentSnapshot(timeline);
        watermarkElement = document.createElement('div');
        watermarkElement.style.position = 'absolute';
        watermarkElement.style.bottom = '16px';
        watermarkElement.style.right = '16px';
        watermarkElement.style.padding = '8px 12px';
        watermarkElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        watermarkElement.style.color = 'white';
        watermarkElement.style.fontSize = '12px';
        watermarkElement.style.fontFamily = 'var(--font-text)';
        watermarkElement.style.borderRadius = '4px';
        watermarkElement.style.zIndex = '999';
        const timestampStr = currentSnapshot.timestamp
          ? new Date(currentSnapshot.timestamp).toLocaleString()
          : new Date(currentSnapshot.createdAt).toLocaleString();
        watermarkElement.innerHTML = `
          <div><strong>${currentSnapshot.label}</strong></div>
          <div style="font-size: 10px; opacity: 0.8;">${timestampStr}</div>
        `;
        element.appendChild(watermarkElement);
      }

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
            // Remove watermark after export
            if (watermarkElement && watermarkElement.parentNode) {
              watermarkElement.parentNode.removeChild(watermarkElement);
            }
            // Restore UI controls
            restoreUIControls(hiddenElements);
            setIsExporting(false);
          });
      }, EXPORT_DELAY_MS);
    },
    [getNodes, diagramName, timeline]
  );

  return {
    handleExport,
    isExporting,
  };
}
