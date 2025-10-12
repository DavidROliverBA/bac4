/**
 * Unified Horizontal Toolbar
 * Combines diagram type selector, node creation buttons, breadcrumbs, and diagram actions
 */

import * as React from 'react';
import { Node, useReactFlow } from 'reactflow';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import {
  FONT_SIZES,
  SPACING,
  UI_COLORS,
  BORDER_RADIUS,
  SHADOWS,
  TRANSITIONS,
  Z_INDEX,
  EXPORT_DELAY_MS,
  getExportOptions,
  getExportExtension,
} from '../../constants';

interface UnifiedToolbarProps {
  // Diagram type switcher
  currentType: 'context' | 'container' | 'component';
  onTypeChange: (newType: 'context' | 'container' | 'component') => void;

  // Node creation
  onAddNode: (nodeType: string, nodeData: any) => void;

  // Breadcrumbs
  breadcrumbs: Array<{ label: string; path: string; type: string }>;
  currentPath: string;
  onNavigate: (path: string) => void;

  // Diagram actions
  selectedNode: Node | null;
  onDeleteNode: () => void;
  onRenameDiagram?: () => void;
  diagramName?: string;
}

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  currentType,
  onTypeChange,
  onAddNode,
  breadcrumbs,
  currentPath,
  onNavigate,
  selectedNode,
  onDeleteNode,
  onRenameDiagram,
  diagramName = 'diagram',
}) => {
  const { getNodes } = useReactFlow();
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as globalThis.Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as 'context' | 'container' | 'component';
    onTypeChange(newType);
  };

  // Get the viewport element for export
  const getExportElement = (): HTMLElement | null => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      return viewport;
    }
    return document.querySelector('.react-flow') as HTMLElement;
  };

  // Export handler
  const handleExport = React.useCallback((format: 'png' | 'jpeg' | 'svg') => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      alert('No nodes to export');
      return;
    }

    const element = getExportElement();
    if (!element) {
      console.error('Could not find React Flow viewport');
      alert('Failed to find diagram container');
      return;
    }

    console.log(`BAC4: Exporting ${format.toUpperCase()} from viewport`);
    setShowExportMenu(false);

    setTimeout(() => {
      const exportOptions = getExportOptions(format);

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
          const link = document.createElement('a');
          link.download = `${diagramName}.${getExportExtension(format)}`;
          link.href = dataUrl;
          link.click();
          console.log(`BAC4: ✅ ${format.toUpperCase()} export successful`);
        })
        .catch((error) => {
          console.error(`BAC4: ❌ Error exporting ${format.toUpperCase()}:`, error);
          alert(`Failed to export diagram as ${format.toUpperCase()}. Check console for details.`);
        });
    }, EXPORT_DELAY_MS);
  }, [getNodes, diagramName]);

  // Get tools for current diagram type
  const getTools = () => {
    switch (currentType) {
      case 'context':
        return [
          { type: 'system', label: '+ System', data: { label: 'New System', external: false } },
          { type: 'person', label: '+ Person', data: { label: 'New User' } },
          { type: 'system', label: '+ External', data: { label: 'External System', external: true } },
        ];
      case 'container':
        return [
          { type: 'container', label: '🌐 Web', data: { label: 'Web Application', containerType: 'webapp' } },
          { type: 'container', label: '📱 Mobile', data: { label: 'Mobile App', containerType: 'mobileapp' } },
          { type: 'container', label: '🔌 API', data: { label: 'API Service', containerType: 'api' } },
          { type: 'container', label: '🗄️ DB', data: { label: 'Database', containerType: 'database' } },
          { type: 'container', label: '📮 Queue', data: { label: 'Message Queue', containerType: 'queue' } },
        ];
      case 'component':
        return [
          { type: 'c4', label: '+ Component', data: { label: 'New Component', type: 'component' } },
        ];
    }
  };

  const tools = getTools();

  const onDragStart = (event: React.DragEvent, tool: typeof tools[0]) => {
    event.dataTransfer.setData(
      'application/bac4node',
      JSON.stringify({ type: tool.type, data: tool.data })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.gap.wide,
        padding: SPACING.padding.section,
        background: UI_COLORS.backgroundSecondary,
        borderBottom: `1px solid ${UI_COLORS.border}`,
        flexWrap: 'wrap',
      }}
    >
      {/* Diagram Type Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.normal }}>
        <label
          style={{
            fontSize: FONT_SIZES.small,
            fontWeight: 600,
            color: UI_COLORS.textMuted,
            textTransform: 'uppercase',
          }}
        >
          Type:
        </label>
        <select
          value={currentType}
          onChange={handleTypeChange}
          style={{
            padding: SPACING.padding.button,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            background: UI_COLORS.backgroundPrimary,
            color: UI_COLORS.textNormal,
            fontSize: FONT_SIZES.small,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-interface)',
          }}
        >
          <option value="context">Context</option>
          <option value="container">Container</option>
          <option value="component">Component</option>
        </select>
      </div>

      {/* Vertical Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          background: UI_COLORS.border,
        }}
      />

      {/* Node Creation Buttons */}
      <div style={{ display: 'flex', gap: SPACING.gap.tight, flexWrap: 'wrap' }}>
        {tools.map((tool) => (
          <button
            key={tool.label}
            draggable
            onDragStart={(e) => onDragStart(e, tool)}
            onClick={() => onAddNode(tool.type, tool.data)}
            title={`Add ${tool.label}`}
            style={{
              padding: SPACING.padding.button,
              background: UI_COLORS.interactiveNormal,
              border: `1px solid ${UI_COLORS.border}`,
              borderRadius: BORDER_RADIUS.normal,
              color: UI_COLORS.textNormal,
              cursor: 'grab',
              fontSize: FONT_SIZES.small,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: `all ${TRANSITIONS.fast} ease`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = UI_COLORS.interactiveHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = UI_COLORS.interactiveNormal;
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Breadcrumbs (if present) */}
      {breadcrumbs.length > 0 && (
        <>
          <div
            style={{
              width: '1px',
              height: '24px',
              background: UI_COLORS.border,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.tight, flex: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && (
                  <span style={{ color: UI_COLORS.textMuted, fontSize: FONT_SIZES.small }}>→</span>
                )}
                <button
                  onClick={() => crumb.path !== currentPath && onNavigate(crumb.path)}
                  disabled={crumb.path === currentPath}
                  style={{
                    padding: SPACING.padding.button,
                    background: crumb.path === currentPath ? UI_COLORS.backgroundPrimaryAlt : 'transparent',
                    border: 'none',
                    borderRadius: BORDER_RADIUS.normal,
                    color: crumb.path === currentPath ? UI_COLORS.textNormal : UI_COLORS.textAccent,
                    cursor: crumb.path === currentPath ? 'default' : 'pointer',
                    fontSize: FONT_SIZES.small,
                    fontWeight: crumb.path === currentPath ? 600 : 500,
                    textDecoration: crumb.path === currentPath ? 'none' : 'underline',
                  }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      {/* Spacer to push actions to the right */}
      {breadcrumbs.length === 0 && <div style={{ flex: 1 }} />}

      {/* Diagram Actions - Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.gap.tight }}>
        {/* Rename Diagram */}
        {onRenameDiagram && (
          <button
            onClick={onRenameDiagram}
            title="Rename this diagram"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.gap.tiny,
              padding: SPACING.padding.button,
              background: UI_COLORS.interactiveNormal,
              border: `1px solid ${UI_COLORS.border}`,
              borderRadius: BORDER_RADIUS.normal,
              color: UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: `all ${TRANSITIONS.fast} ease`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = UI_COLORS.interactiveHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = UI_COLORS.interactiveNormal;
            }}
          >
            <span>✏️</span>
            <span>Rename</span>
          </button>
        )}

        {/* Export Menu */}
        <div ref={exportMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export diagram"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.gap.tiny,
              padding: SPACING.padding.button,
              background: UI_COLORS.interactiveNormal,
              border: `1px solid ${UI_COLORS.border}`,
              borderRadius: BORDER_RADIUS.normal,
              color: UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: `all ${TRANSITIONS.fast} ease`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = UI_COLORS.interactiveHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = UI_COLORS.interactiveNormal;
            }}
          >
            <span>💾</span>
            <span>Export</span>
            <span style={{ fontSize: FONT_SIZES.tiny }}>{showExportMenu ? '▲' : '▼'}</span>
          </button>

          {/* Export Format Dropdown */}
          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: SPACING.gap.tiny,
                background: UI_COLORS.backgroundPrimary,
                border: `1px solid ${UI_COLORS.border}`,
                borderRadius: BORDER_RADIUS.normal,
                boxShadow: SHADOWS.normal,
                zIndex: Z_INDEX.dropdown,
                overflow: 'hidden',
                minWidth: '180px',
              }}
            >
              <button
                onClick={() => handleExport('png')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: SPACING.padding.input,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${UI_COLORS.border}`,
                  color: UI_COLORS.textNormal,
                  cursor: 'pointer',
                  fontSize: FONT_SIZES.small,
                  textAlign: 'left',
                  transition: `background ${TRANSITIONS.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                PNG (High Quality)
              </button>
              <button
                onClick={() => handleExport('jpeg')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: SPACING.padding.input,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${UI_COLORS.border}`,
                  color: UI_COLORS.textNormal,
                  cursor: 'pointer',
                  fontSize: FONT_SIZES.small,
                  textAlign: 'left',
                  transition: `background ${TRANSITIONS.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                JPEG (Smaller Size)
              </button>
              <button
                onClick={() => handleExport('svg')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: SPACING.padding.input,
                  background: 'transparent',
                  border: 'none',
                  color: UI_COLORS.textNormal,
                  cursor: 'pointer',
                  fontSize: FONT_SIZES.small,
                  textAlign: 'left',
                  transition: `background ${TRANSITIONS.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = UI_COLORS.backgroundModifierHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                SVG (Vector)
              </button>
            </div>
          )}
        </div>

        {/* Delete Node */}
        <button
          onClick={onDeleteNode}
          disabled={!selectedNode}
          title={selectedNode ? `Delete node: ${selectedNode.data.label}` : 'Select a node to delete'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.gap.tiny,
            padding: SPACING.padding.button,
            background: selectedNode ? UI_COLORS.dangerBackground : UI_COLORS.backgroundSecondary,
            border: selectedNode ? `1px solid ${UI_COLORS.dangerBorder}` : `1px solid ${UI_COLORS.border}`,
            borderRadius: BORDER_RADIUS.normal,
            color: selectedNode ? UI_COLORS.dangerText : UI_COLORS.textMuted,
            cursor: selectedNode ? 'pointer' : 'not-allowed',
            fontSize: FONT_SIZES.small,
            fontWeight: 500,
            opacity: selectedNode ? 1 : 0.5,
            whiteSpace: 'nowrap',
            transition: `all ${TRANSITIONS.fast} ease`,
          }}
          onMouseEnter={(e) => {
            if (selectedNode) {
              e.currentTarget.style.background = UI_COLORS.dangerBackgroundHover;
            }
          }}
          onMouseLeave={(e) => {
            if (selectedNode) {
              e.currentTarget.style.background = UI_COLORS.dangerBackground;
            }
          }}
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
