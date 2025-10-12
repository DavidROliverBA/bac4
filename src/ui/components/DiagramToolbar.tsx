/**
 * Diagram Toolbar
 * Context-aware toolbar that shows appropriate node types for each C4 level
 */

import * as React from 'react';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  TRANSITIONS,
  SHADOWS,
} from '../../constants';

interface DiagramToolbarProps {
  diagramType: 'context' | 'container' | 'component';
  onAddNode: (nodeType: string, nodeData: any) => void;
}

export const DiagramToolbar: React.FC<DiagramToolbarProps> = ({
  diagramType,
  onAddNode,
}) => {
  // Context Diagram Tools (C4 Level 1)
  const contextTools = [
    {
      type: 'system',
      label: '+ System',
      color: '#4A90E2',
      data: { label: 'New System', external: false },
    },
    {
      type: 'person',
      label: '+ Person',
      color: '#7ED321',
      data: { label: 'New User' },
    },
    {
      type: 'system',
      label: '+ External',
      color: '#666',
      data: { label: 'External System', external: true },
    },
  ];

  // Container Diagram Tools (C4 Level 2)
  const containerTools = [
    {
      type: 'container',
      label: '🌐 Web App',
      color: '#4A90E2',
      data: { label: 'Web Application', containerType: 'webapp' },
    },
    {
      type: 'container',
      label: '📱 Mobile',
      color: '#9B59B6',
      data: { label: 'Mobile App', containerType: 'mobileapp' },
    },
    {
      type: 'container',
      label: '🔌 API',
      color: '#E67E22',
      data: { label: 'API Service', containerType: 'api' },
    },
    {
      type: 'container',
      label: '🗄️ Database',
      color: '#16A085',
      data: { label: 'Database', containerType: 'database' },
    },
    {
      type: 'container',
      label: '📮 Queue',
      color: '#F39C12',
      data: { label: 'Message Queue', containerType: 'queue' },
    },
  ];

  // Component Diagram Tools (C4 Level 3)
  const componentTools = [
    {
      type: 'c4',
      label: '+ Component',
      color: '#F5A623',
      data: { label: 'New Component', type: 'component' },
    },
  ];

  const tools =
    diagramType === 'context'
      ? contextTools
      : diagramType === 'container'
      ? containerTools
      : componentTools;

  const onDragStart = (event: React.DragEvent, tool: typeof tools[0]) => {
    event.dataTransfer.setData(
      'application/bac4node',
      JSON.stringify({ type: tool.type, data: tool.data })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  // Get diagram type color
  const getDiagramTypeColor = () => {
    switch (diagramType) {
      case 'context':
        return { bg: '#4A90E2', label: 'Context Diagram' };
      case 'container':
        return { bg: '#7ED321', label: 'Container Diagram' };
      case 'component':
        return { bg: '#F5A623', label: 'Component Diagram' };
    }
  };

  const typeColor = getDiagramTypeColor();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.medium,
        padding: SPACING.padding.card,
        background: UI_COLORS.backgroundPrimary,
        border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        borderRadius: BORDER_RADIUS.large,
        minWidth: '200px',
        maxWidth: '250px',
        boxShadow: SHADOWS.normal,
      }}
    >
      {/* Diagram Type Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.large,
          padding: SPACING.padding.input,
          background: `linear-gradient(135deg, ${typeColor.bg}15, ${typeColor.bg}05)`,
          border: `2px solid ${typeColor.bg}`,
          borderRadius: BORDER_RADIUS.large,
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: typeColor.bg,
            boxShadow: `0 0 8px ${typeColor.bg}`,
          }}
        />
        <span
          style={{
            fontSize: FONT_SIZES.medium,
            fontWeight: 600,
            color: UI_COLORS.textNormal,
            letterSpacing: '0.5px',
          }}
        >
          {typeColor.label}
        </span>
      </div>

      {/* Tool Buttons - Vertical Stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.medium,
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.label}
            draggable
            onDragStart={(e) => onDragStart(e, tool)}
            onClick={() => onAddNode(tool.type, tool.data)}
            style={{
              padding: SPACING.padding.input,
              background: `linear-gradient(135deg, ${tool.color}25, ${tool.color}10)`,
              border: `2px solid ${tool.color}`,
              borderRadius: BORDER_RADIUS.large,
              color: UI_COLORS.textNormal,
              cursor: 'grab',
              fontSize: FONT_SIZES.medium,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: `all ${TRANSITIONS.normal} ${TRANSITIONS.easing}`,
              boxShadow: `0 2px 4px ${tool.color}20`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 8px ${tool.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 2px 4px ${tool.color}20`;
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
};
