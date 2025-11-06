/**
 * Code Node - For Code Diagrams (Layer 7)
 * Represents implementation artifacts, code files, and data models
 *
 * v2.0.0: New node type for enterprise architecture Layer 7
 * Features:
 * - GitHub URL integration for linking to repositories and files
 * - Programming language identification
 * - Code type classification (file, class, function, schema, table)
 * - Repository metadata (branch, path, authors, last commit)
 * - Links to parent Component diagrams (Layer 6)
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { setIcon } from 'obsidian';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import type { CodeNodeData } from '../../types/canvas-types';
import { NodeChangeBadge } from '../components/ChangeBadge';

// Default values
const DEFAULT_COLOR = '#2ECC71'; // Green for code layer
const DEFAULT_ICON = 'code-2';

// Icon mapping for code types
const CODE_TYPE_ICONS: Record<string, string> = {
  file: 'file-code',
  class: 'box',
  function: 'function-square',
  schema: 'database',
  table: 'table',
};

export const CodeNode: React.FC<NodeProps<CodeNodeData>> = ({ data, selected }) => {
  const color = data.color || DEFAULT_COLOR;
  const iconRef = React.useRef<HTMLSpanElement>(null);

  // Determine icon based on code type
  const icon = data.codeType ? CODE_TYPE_ICONS[data.codeType] || DEFAULT_ICON : DEFAULT_ICON;

  // Render Lucide icon using Obsidian API
  React.useEffect(() => {
    if (iconRef.current) {
      iconRef.current.innerHTML = ''; // Clear existing
      setIcon(iconRef.current, icon);
    }
  }, [icon]);

  // Convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: BORDER_RADIUS.normal,
        border: `1px solid ${color}`,
        minWidth: '180px',
        maxWidth: '280px',
        textAlign: 'left',
        backgroundColor: hexToRgba(color, 0.12),
        color: UI_COLORS.textNormal,
        fontFamily: UI_COLORS.fontInterface,
        fontSize: FONT_SIZES.small,
        boxShadow: selected
          ? `0 0 0 3px ${UI_COLORS.interactiveAccent}`
          : '0 1.5px 4px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      {/* Change badge (v1.0.0 timeline) */}
      {data.changeIndicator && <NodeChangeBadge changeType={data.changeIndicator} />}

      {/* Cross-reference badge - shows when node exists in multiple diagrams */}
      {data.isReference && data.crossReferences && data.crossReferences.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: UI_COLORS.interactiveAccent,
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
          title={`Shared across ${data.crossReferences.length + 1} diagrams:\n${data.crossReferences.map((path) => path.split('/').pop()?.replace('.bac4', '')).join('\n')}`}
        >
          {data.crossReferences.length + 1}
        </div>
      )}

      {/* Connection handles - all four sides */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: color, width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: color, width: '10px', height: '10px' }}
      />

      {/* Header: Icon, Label, and Type */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.small,
          marginBottom: SPACING.small,
        }}
      >
        {/* Code Type Icon */}
        <span
          ref={iconRef}
          style={{
            fontSize: FONT_SIZES.medium,
            display: 'inline-flex',
            alignItems: 'center',
            color: color,
          }}
        />
        {/* Label */}
        <div
          style={{
            fontWeight: 600,
            fontSize: FONT_SIZES.small,
            flex: 1,
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Language and Code Type */}
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          color: UI_COLORS.textMuted,
          marginBottom: SPACING.tiny,
          display: 'flex',
          gap: SPACING.small,
        }}
      >
        {data.language && (
          <span>
            <strong>Language:</strong> {data.language}
          </span>
        )}
        {data.codeType && (
          <span>
            <strong>Type:</strong> {data.codeType}
          </span>
        )}
      </div>

      {/* Repository Info */}
      {data.repo && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
          }}
        >
          <strong>Repo:</strong> {data.repo}
          {data.branch && ` (${data.branch})`}
        </div>
      )}

      {/* File Path */}
      {data.path && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.tiny,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {data.path}
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textMuted,
            marginTop: SPACING.small,
            marginBottom: SPACING.small,
            fontStyle: 'italic',
          }}
        >
          {data.description}
        </div>
      )}

      {/* GitHub URL Link */}
      {data.githubUrl && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            marginTop: SPACING.small,
            paddingTop: SPACING.small,
            borderTop: `1px solid ${hexToRgba(color, 0.3)}`,
          }}
        >
          <a
            href={data.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: UI_COLORS.interactiveAccent,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.tiny,
            }}
            onClick={(e) => {
              e.stopPropagation(); // Prevent node selection when clicking link
            }}
          >
            <span>View on GitHub →</span>
          </a>
        </div>
      )}

      {/* Last Commit / Authors */}
      {(data.lastCommit || (data.authors && data.authors.length > 0)) && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: UI_COLORS.textFaint,
            marginTop: SPACING.small,
            paddingTop: SPACING.small,
            borderTop: data.githubUrl ? 'none' : `1px solid ${hexToRgba(color, 0.3)}`,
          }}
        >
          {data.lastCommit && (
            <div style={{ marginBottom: SPACING.tiny }}>
              <strong>Last commit:</strong> {data.lastCommit.substring(0, 40)}
              {data.lastCommit.length > 40 && '...'}
            </div>
          )}
          {data.authors && data.authors.length > 0 && (
            <div>
              <strong>Authors:</strong> {data.authors.join(', ')}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: color, width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: color, width: '10px', height: '10px' }}
      />
    </div>
  );
};
