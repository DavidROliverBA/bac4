/**
 * DiagramLinking Component
 * Dropdown for selecting linked child diagrams + Open button
 *
 * <AI_MODIFIABLE>
 * This component handles linking nodes to child diagrams:
 * - Dropdown with available diagrams
 * - "[NEW]" option to create new diagram
 * - "[NONE]" option to unlink
 * - "Open" button when linked
 * Extracted from PropertyPanel.tsx lines 764-823 and 959-1018
 * </AI_MODIFIABLE>
 */

import * as React from 'react';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../../constants';
import { DiagramNode } from '../../../types/canvas-types';

interface DiagramLinkingProps {
  label: string;
  linkedDiagram: DiagramNode | null;
  availableDiagrams: DiagramNode[];
  diagramType: 'container' | 'component';
  loading: boolean;
  onChange: (selectedPath: string) => void;
  onOpenDiagram?: (path: string) => void;
}

/**
 * DiagramLinking - Dropdown for diagram selection + Open button
 *
 * @example
 * ```tsx
 * <DiagramLinking
 *   label="Linked Container Diagram"
 *   linkedDiagram={linkedDiagram}
 *   availableDiagrams={availableDiagrams}
 *   diagramType="container"
 *   loading={loading}
 *   onChange={handleLinkChange}
 *   onOpenDiagram={onOpenDiagram}
 * />
 * ```
 */
export const DiagramLinking: React.FC<DiagramLinkingProps> = ({
  label,
  linkedDiagram,
  availableDiagrams,
  diagramType,
  loading,
  onChange,
  onOpenDiagram,
}) => {
  const displayType = diagramType === 'container' ? 'Container' : 'Component';

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

      {/* Dropdown */}
      <select
        value={linkedDiagram?.filePath || '[NONE]'}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
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
      >
        <option value="[NONE]">{loading ? 'Loading...' : '-- No Link --'}</option>
        {availableDiagrams.map((diagram) => (
          <option key={diagram.id} value={diagram.filePath}>
            {diagram.displayName} [{displayType} Diagram]
          </option>
        ))}
        <option value="[NEW]">+ Create New {displayType} Diagram</option>
      </select>

      {/* Open Linked Diagram Button */}
      {linkedDiagram && onOpenDiagram && (
        <button
          onClick={() => onOpenDiagram(linkedDiagram.filePath)}
          style={{
            width: '100%',
            marginTop: SPACING.large,
            padding: SPACING.padding.input,
            background: UI_COLORS.interactiveAccent,
            border: 'none',
            borderRadius: BORDER_RADIUS.normal,
            color: UI_COLORS.textOnAccent,
            cursor: 'pointer',
            fontSize: FONT_SIZES.normal,
            fontWeight: 500,
            fontFamily: UI_COLORS.fontInterface,
          }}
        >
          → Open {linkedDiagram.displayName}
        </button>
      )}
    </div>
  );
};
