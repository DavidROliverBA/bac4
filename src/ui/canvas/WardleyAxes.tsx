/**
 * Wardley Axes Component
 *
 * Renders the X and Y axes for Wardley Maps:
 * - X-axis: Evolution stages (Genesis → Custom → Product → Commodity)
 * - Y-axis: Visibility (Invisible → Visible)
 * - Stage boundary markers at 0.25, 0.50, 0.75
 *
 * This component overlays on top of the React Flow canvas and provides
 * visual guides for positioning components according to Wardley Mapping principles.
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { UI_COLORS, FONT_SIZES } from '../../constants';

interface WardleyAxesProps {
  /**
   * Whether to show the axes
   */
  visible?: boolean;

  /**
   * Width of the canvas (pixels)
   */
  canvasWidth?: number;

  /**
   * Height of the canvas (pixels)
   */
  canvasHeight?: number;

  /**
   * Opacity of the axes (0-1)
   */
  opacity?: number;
}

export const WardleyAxes: React.FC<WardleyAxesProps> = ({
  visible = true,
  canvasWidth = 1200,
  canvasHeight = 800,
  opacity = 0.6,
}) => {
  if (!visible) return null;

  // Evolution stage boundaries (X-axis)
  const evolutionStages = [
    { label: 'Genesis', start: 0, end: 0.25, color: '#ef4444' },
    { label: 'Custom', start: 0.25, end: 0.5, color: '#f59e0b' },
    { label: 'Product', start: 0.5, end: 0.75, color: '#3b82f6' },
    { label: 'Commodity', start: 0.75, end: 1.0, color: '#10b981' },
  ];

  // Margins for axes
  const marginLeft = 60; // Space for Y-axis labels
  const marginBottom = 60; // Space for X-axis labels
  const marginTop = 20;
  const marginRight = 20;

  // Usable canvas area
  const usableWidth = canvasWidth - marginLeft - marginRight;
  const usableHeight = canvasHeight - marginTop - marginBottom;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Don't block interactions with canvas
        zIndex: 5, // Below controls (10) but above canvas background
        opacity,
      }}
    >
      {/* SVG for axes lines and markers */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* Y-axis line (Visibility) */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={canvasHeight - marginBottom}
          stroke={UI_COLORS.textMuted}
          strokeWidth="2"
          strokeDasharray="none"
        />

        {/* X-axis line (Evolution) */}
        <line
          x1={marginLeft}
          y1={canvasHeight - marginBottom}
          x2={canvasWidth - marginRight}
          y2={canvasHeight - marginBottom}
          stroke={UI_COLORS.textMuted}
          strokeWidth="2"
          strokeDasharray="none"
        />

        {/* Evolution stage boundaries (vertical lines) */}
        {evolutionStages.map((stage, index) => {
          // Don't draw line at start (0) - that's the Y-axis
          if (stage.start === 0) return null;

          const x = marginLeft + stage.start * usableWidth;

          return (
            <line
              key={`boundary-${index}`}
              x1={x}
              y1={marginTop}
              x2={x}
              y2={canvasHeight - marginBottom}
              stroke={stage.color}
              strokeWidth="1.5"
              strokeDasharray="8,4"
              opacity={0.4}
            />
          );
        })}

        {/* Visibility markers (horizontal lines at 0.25, 0.5, 0.75) */}
        {[0.25, 0.5, 0.75].map((visibility) => {
          // Y is inverted: high visibility = top of canvas
          const y = canvasHeight - marginBottom - visibility * usableHeight;

          return (
            <line
              key={`visibility-${visibility}`}
              x1={marginLeft}
              y1={y}
              x2={canvasWidth - marginRight}
              y2={y}
              stroke={UI_COLORS.textFaint}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity={0.3}
            />
          );
        })}

        {/* Arrowheads */}
        <defs>
          <marker
            id="arrowhead-x"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill={UI_COLORS.textMuted}
            />
          </marker>
          <marker
            id="arrowhead-y"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill={UI_COLORS.textMuted}
            />
          </marker>
        </defs>

        {/* Arrow at end of X-axis */}
        <line
          x1={canvasWidth - marginRight - 20}
          y1={canvasHeight - marginBottom}
          x2={canvasWidth - marginRight}
          y2={canvasHeight - marginBottom}
          stroke={UI_COLORS.textMuted}
          strokeWidth="2"
          markerEnd="url(#arrowhead-x)"
        />

        {/* Arrow at top of Y-axis */}
        <line
          x1={marginLeft}
          y1={marginTop + 20}
          x2={marginLeft}
          y2={marginTop}
          stroke={UI_COLORS.textMuted}
          strokeWidth="2"
          markerEnd="url(#arrowhead-y)"
        />
      </svg>

      {/* HTML labels (better text rendering than SVG) */}

      {/* Y-axis label (Visibility) */}
      <div
        style={{
          position: 'absolute',
          top: marginTop,
          left: 10,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: FONT_SIZES.small,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          fontFamily: UI_COLORS.fontInterface,
          userSelect: 'none',
        }}
      >
        Visibility (User Need)
      </div>

      {/* Y-axis value labels */}
      <div
        style={{
          position: 'absolute',
          top: marginTop - 5,
          left: marginLeft - 45,
          fontSize: FONT_SIZES.tiny,
          fontWeight: 500,
          color: UI_COLORS.textMuted,
          fontFamily: UI_COLORS.fontInterface,
          userSelect: 'none',
        }}
      >
        Visible
      </div>
      <div
        style={{
          position: 'absolute',
          top: canvasHeight - marginBottom - 5,
          left: marginLeft - 55,
          fontSize: FONT_SIZES.tiny,
          fontWeight: 500,
          color: UI_COLORS.textMuted,
          fontFamily: UI_COLORS.fontInterface,
          userSelect: 'none',
        }}
      >
        Invisible
      </div>

      {/* X-axis label (Evolution) */}
      <div
        style={{
          position: 'absolute',
          bottom: marginBottom - 25,
          left: marginLeft + usableWidth / 2 - 60,
          fontSize: FONT_SIZES.small,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          fontFamily: UI_COLORS.fontInterface,
          userSelect: 'none',
        }}
      >
        Evolution (Maturity)
      </div>

      {/* Evolution stage labels */}
      {evolutionStages.map((stage, index) => {
        const centerX = marginLeft + (stage.start + stage.end) / 2 * usableWidth;

        return (
          <div
            key={`label-${index}`}
            style={{
              position: 'absolute',
              bottom: marginBottom - 50,
              left: centerX - 40, // Center the label (approximate)
              width: '80px',
              textAlign: 'center',
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              color: stage.color,
              fontFamily: UI_COLORS.fontInterface,
              userSelect: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {stage.label}
          </div>
        );
      })}

      {/* Stage value markers */}
      {evolutionStages.map((stage, index) => {
        // Skip 0 at start, show at boundaries
        if (stage.end === 1.0) {
          const x = marginLeft + stage.end * usableWidth;
          return (
            <div
              key={`value-end-${index}`}
              style={{
                position: 'absolute',
                bottom: marginBottom - 15,
                left: x - 10,
                fontSize: FONT_SIZES.tiny,
                fontWeight: 500,
                color: UI_COLORS.textFaint,
                fontFamily: UI_COLORS.fontInterface,
                userSelect: 'none',
              }}
            >
              1.0
            </div>
          );
        }

        if (stage.start > 0) {
          const x = marginLeft + stage.start * usableWidth;
          return (
            <div
              key={`value-${index}`}
              style={{
                position: 'absolute',
                bottom: marginBottom - 15,
                left: x - 15,
                fontSize: FONT_SIZES.tiny,
                fontWeight: 500,
                color: UI_COLORS.textFaint,
                fontFamily: UI_COLORS.fontInterface,
                userSelect: 'none',
              }}
            >
              {stage.start.toFixed(2)}
            </div>
          );
        }

        return null;
      })}

      {/* 0.0 marker at origin */}
      <div
        style={{
          position: 'absolute',
          bottom: marginBottom - 15,
          left: marginLeft - 10,
          fontSize: FONT_SIZES.tiny,
          fontWeight: 500,
          color: UI_COLORS.textFaint,
          fontFamily: UI_COLORS.fontInterface,
          userSelect: 'none',
        }}
      >
        0.0
      </div>

      {/* Info badge */}
      <div
        style={{
          position: 'absolute',
          top: marginTop,
          right: marginRight,
          padding: '6px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '6px',
          fontSize: FONT_SIZES.tiny,
          color: '#fff',
          fontFamily: UI_COLORS.fontInterface,
          userSelect: 'none',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        Wardley Map
      </div>
    </div>
  );
};
