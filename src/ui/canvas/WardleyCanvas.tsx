/**
 * Wardley Canvas Component
 *
 * Specialized canvas wrapper for Wardley Maps that:
 * - Renders X/Y axes with evolution stage labels
 * - Provides grid snapping to 0-1 scale
 * - Handles coordinate mapping between Wardley (0-1) and Canvas (pixels)
 * - Manages Wardley-specific canvas configuration
 *
 * This component overlays on top of the React Flow canvas and provides
 * the visual framework for Wardley Mapping.
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { WardleyAxes } from './WardleyAxes';
import { wardleyToCanvas, canvasToWardley } from '../../types/bac4-v2-types';

interface WardleyCanvasProps {
  /**
   * Whether to show the Wardley axes
   */
  showAxes?: boolean;

  /**
   * Canvas dimensions (auto-detected if not provided)
   */
  dimensions?: {
    width: number;
    height: number;
  };

  /**
   * Axes opacity (0-1)
   */
  axesOpacity?: number;

  /**
   * Whether to show grid
   */
  showGrid?: boolean;

  /**
   * Grid snap enabled
   */
  snapToGrid?: boolean;

  /**
   * Grid size for snapping (in 0-1 scale)
   * Default: 0.05 (20x20 grid)
   */
  gridSize?: number;

  /**
   * Background image URL (v2.5.0)
   * Use a data URL or external URL to display a reference image
   */
  backgroundImage?: string;

  /**
   * Background image opacity (v2.5.0)
   * Default: 0.3
   */
  backgroundOpacity?: number;
}

/**
 * Margins for axes (must match WardleyAxes component)
 */
const AXIS_MARGINS = {
  left: 60,
  right: 20,
  top: 20,
  bottom: 60,
};

/**
 * WardleyCanvas component
 *
 * Provides the visual framework and utilities for Wardley Mapping.
 * Should be rendered as an overlay on top of the React Flow canvas.
 */
export const WardleyCanvas: React.FC<WardleyCanvasProps> = ({
  showAxes = true,
  dimensions,
  axesOpacity = 0.6,
  showGrid = false,
  snapToGrid = false,
  gridSize = 0.05,
  backgroundImage,
  backgroundOpacity = 0.3,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = React.useState(
    dimensions || { width: 1200, height: 800 }
  );

  /**
   * Auto-detect canvas dimensions from parent container
   */
  React.useEffect(() => {
    if (dimensions) {
      setCanvasDimensions(dimensions);
      return;
    }

    const updateDimensions = () => {
      if (containerRef.current && containerRef.current.parentElement) {
        const parent = containerRef.current.parentElement;
        setCanvasDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [dimensions]);

  /**
   * Calculate usable canvas area (excluding axes margins)
   */
  const usableArea = React.useMemo(() => {
    return {
      left: AXIS_MARGINS.left,
      top: AXIS_MARGINS.top,
      width: canvasDimensions.width - AXIS_MARGINS.left - AXIS_MARGINS.right,
      height: canvasDimensions.height - AXIS_MARGINS.top - AXIS_MARGINS.bottom,
    };
  }, [canvasDimensions]);

  /**
   * Convert Wardley coordinates (0-1) to canvas pixels
   *
   * @param visibility - Visibility value (0-1, where 1 = most visible)
   * @param evolution - Evolution value (0-1, where 1 = most evolved)
   * @returns Canvas position in pixels
   */
  const wardleyToPx = React.useCallback(
    (visibility: number, evolution: number) => {
      return wardleyToCanvas(
        visibility,
        evolution,
        canvasDimensions.width,
        canvasDimensions.height
      );
    },
    [canvasDimensions]
  );

  /**
   * Convert canvas pixels to Wardley coordinates (0-1)
   *
   * @param x - Canvas X position (pixels)
   * @param y - Canvas Y position (pixels)
   * @returns Wardley coordinates { visibility, evolution }
   */
  const pxToWardley = React.useCallback(
    (x: number, y: number) => {
      return canvasToWardley(x, y, canvasDimensions.width, canvasDimensions.height);
    },
    [canvasDimensions]
  );

  /**
   * Snap Wardley coordinates to grid
   *
   * @param visibility - Visibility value (0-1)
   * @param evolution - Evolution value (0-1)
   * @returns Snapped coordinates
   */
  const snapWardleyToGrid = React.useCallback(
    (visibility: number, evolution: number) => {
      if (!snapToGrid) {
        return { visibility, evolution };
      }

      return {
        visibility: Math.round(visibility / gridSize) * gridSize,
        evolution: Math.round(evolution / gridSize) * gridSize,
      };
    },
    [snapToGrid, gridSize]
  );

  /**
   * Get evolution stage from evolution value
   *
   * @param evolution - Evolution value (0-1)
   * @returns Evolution stage name
   */
  const getEvolutionStageFromValue = React.useCallback((evolution: number) => {
    if (evolution < 0.25) return 'genesis';
    if (evolution < 0.5) return 'custom';
    if (evolution < 0.75) return 'product';
    return 'commodity';
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Don't block canvas interactions
      }}
      data-wardley-canvas="true"
      data-usable-area={JSON.stringify(usableArea)}
    >
      {/* Background Image (v2.5.0) - Behind everything else */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${backgroundImage}")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundOpacity,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Wardley Axes Overlay */}
      {showAxes && (
        <WardleyAxes
          visible={showAxes}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
          opacity={axesOpacity}
        />
      )}

      {/* Grid Overlay (optional) */}
      {showGrid && (
        <div
          style={{
            position: 'absolute',
            top: AXIS_MARGINS.top,
            left: AXIS_MARGINS.left,
            width: usableArea.width,
            height: usableArea.height,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${usableArea.width * gridSize}px ${usableArea.height * gridSize}px`,
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
      )}

      {/* Helper Functions Context (exposed via data attributes for debugging) */}
      <div
        style={{ display: 'none' }}
        data-wardley-helpers={JSON.stringify({
          wardleyToPx: 'available',
          pxToWardley: 'available',
          snapWardleyToGrid: 'available',
          getEvolutionStageFromValue: 'available',
        })}
      />
    </div>
  );
};

/**
 * Hook to access Wardley Canvas utilities
 *
 * Provides coordinate conversion and grid snapping utilities
 * for Wardley Map components.
 *
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param gridSize - Grid size for snapping (0-1 scale)
 * @param snapToGrid - Whether to enable grid snapping
 */
export function useWardleyCanvas(
  canvasWidth: number,
  canvasHeight: number,
  gridSize = 0.05,
  snapToGrid = false
) {
  const wardleyToPx = React.useCallback(
    (visibility: number, evolution: number) => {
      return wardleyToCanvas(visibility, evolution, canvasWidth, canvasHeight);
    },
    [canvasWidth, canvasHeight]
  );

  const pxToWardley = React.useCallback(
    (x: number, y: number) => {
      return canvasToWardley(x, y, canvasWidth, canvasHeight);
    },
    [canvasWidth, canvasHeight]
  );

  const snapWardley = React.useCallback(
    (visibility: number, evolution: number) => {
      if (!snapToGrid) {
        return { visibility, evolution };
      }

      return {
        visibility: Math.round(visibility / gridSize) * gridSize,
        evolution: Math.round(evolution / gridSize) * gridSize,
      };
    },
    [snapToGrid, gridSize]
  );

  const getStage = React.useCallback((evolution: number) => {
    if (evolution < 0.25) return 'genesis';
    if (evolution < 0.5) return 'custom';
    if (evolution < 0.75) return 'product';
    return 'commodity';
  }, []);

  return {
    wardleyToPx,
    pxToWardley,
    snapWardley,
    getStage,
  };
}

/**
 * Export AXIS_MARGINS for use by other components
 */
export { AXIS_MARGINS };
