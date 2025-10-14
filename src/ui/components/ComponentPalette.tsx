/**
 * Component Palette
 * Shows available cloud components that can be dragged onto the canvas
 */

import * as React from 'react';
import { ComponentDefinition, CloudProvider } from '../../../component-library/types';
import { ComponentLibraryService } from '../../services/component-library-service';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS, SHADOWS, Z_INDEX } from '../../constants';

interface ComponentPaletteProps {
  service: ComponentLibraryService;
  onDragStart: (event: React.DragEvent, component: ComponentDefinition) => void;
  onAddComponent: (component: ComponentDefinition) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  service,
  onDragStart,
  onAddComponent,
}) => {
  const [selectedProvider, setSelectedProvider] = React.useState<CloudProvider | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Position and size state
  const [position, setPosition] = React.useState({ x: 16, y: 16 });
  const [size, setSize] = React.useState({ width: 280, height: 600 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const providers = service.getProviders();

  const filteredComponents = React.useMemo(() => {
    let components = service.getAllComponents();

    if (selectedProvider !== 'all') {
      components = components.filter((c) => c.provider === selectedProvider);
    }

    if (searchQuery) {
      components = service.searchComponents(searchQuery);
    }

    return components;
  }, [selectedProvider, searchQuery, service]);

  const groupedComponents = React.useMemo(() => {
    const groups = new Map<string, ComponentDefinition[]>();
    filteredComponents.forEach((comp) => {
      const category = comp.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(comp);
    });
    return groups;
  }, [filteredComponents]);

  // Dragging handlers
  const handleDragMouseDown = React.useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  }, [position]);

  const handleResizeMouseDown = React.useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setDragStart({ x: e.clientX - size.width, y: e.clientY - size.height });
    e.preventDefault();
    e.stopPropagation();
  }, [size]);

  // Global mouse move and up handlers
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      } else if (isResizing) {
        const newWidth = Math.max(200, e.clientX - dragStart.x);
        const newHeight = Math.max(300, e.clientY - dragStart.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: Z_INDEX.panel,
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          style={{
            padding: SPACING.padding.panel,
            background: UI_COLORS.backgroundPrimary,
            border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            borderRadius: BORDER_RADIUS.normal,
            color: UI_COLORS.textNormal,
            cursor: 'pointer',
            fontSize: FONT_SIZES.medium,
          }}
        >
          Show Components
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: UI_COLORS.backgroundPrimary,
        border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        borderRadius: BORDER_RADIUS.large,
        boxShadow: SHADOWS.strong,
        display: 'flex',
        flexDirection: 'column',
        zIndex: Z_INDEX.panel,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Draggable */}
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          padding: SPACING.padding.panel,
          borderBottom: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <h3 style={{ margin: 0, fontSize: FONT_SIZES.large, fontWeight: 600 }}>
          Components
        </h3>
        <button
          onClick={() => setIsCollapsed(true)}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            color: UI_COLORS.textMuted,
            cursor: 'pointer',
            fontSize: FONT_SIZES.extraLarge,
            padding: '0',
          }}
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: SPACING.padding.card }}>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: SPACING.padding.input,
            background: UI_COLORS.backgroundSecondary,
            border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            borderRadius: BORDER_RADIUS.normal,
            color: UI_COLORS.textNormal,
            fontSize: FONT_SIZES.medium,
          }}
        />
      </div>

      {/* Provider filter */}
      <div
        style={{
          padding: `0 ${SPACING.padding.panel} ${SPACING.large} ${SPACING.padding.panel}`,
          display: 'flex',
          gap: SPACING.small,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setSelectedProvider('all')}
          style={{
            padding: SPACING.padding.button,
            background:
              selectedProvider === 'all'
                ? UI_COLORS.interactiveAccent
                : UI_COLORS.backgroundSecondary,
            border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
            borderRadius: BORDER_RADIUS.small,
            color: selectedProvider === 'all' ? '#fff' : UI_COLORS.textNormal,
            cursor: 'pointer',
            fontSize: FONT_SIZES.small,
          }}
        >
          All
        </button>
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => setSelectedProvider(provider)}
            style={{
              padding: SPACING.padding.button,
              background:
                selectedProvider === provider
                  ? UI_COLORS.interactiveAccent
                  : UI_COLORS.backgroundSecondary,
              border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
              borderRadius: BORDER_RADIUS.small,
              color: selectedProvider === provider ? '#fff' : UI_COLORS.textNormal,
              cursor: 'pointer',
              fontSize: FONT_SIZES.small,
              textTransform: 'uppercase',
            }}
          >
            {provider}
          </button>
        ))}
      </div>

      {/* Components list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `0 ${SPACING.padding.panel} ${SPACING.padding.panel} ${SPACING.padding.panel}`,
        }}
      >
        {Array.from(groupedComponents.entries()).map(([category, components]) => (
          <div key={category} style={{ marginBottom: SPACING.container }}>
            <div
              style={{
                fontSize: FONT_SIZES.small,
                fontWeight: 600,
                color: UI_COLORS.textMuted,
                marginBottom: SPACING.medium,
                textTransform: 'uppercase',
              }}
            >
              {category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.small }}>
              {components.map((component) => (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, component)}
                  onClick={() => onAddComponent(component)}
                  style={{
                    padding: SPACING.padding.card,
                    background: UI_COLORS.backgroundSecondary,
                    border: `1px solid ${component.color}`,
                    borderRadius: BORDER_RADIUS.normal,
                    cursor: 'grab',
                    fontSize: FONT_SIZES.medium,
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.large,
                  }}
                  title={component.description}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: component.color,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{component.name}</div>
                    <div
                      style={{
                        fontSize: FONT_SIZES.extraSmall,
                        color: UI_COLORS.textFaint,
                        marginTop: SPACING.tiny,
                      }}
                    >
                      {component.description.slice(0, 40)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '20px',
          height: '20px',
          cursor: 'nwse-resize',
          borderBottomRightRadius: BORDER_RADIUS.large,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '2px',
          color: UI_COLORS.textFaint,
          fontSize: FONT_SIZES.small,
        }}
        title="Drag to resize"
      >
        ⌟
      </div>
    </div>
  );
};
