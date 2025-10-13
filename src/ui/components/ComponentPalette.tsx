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

  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          right: SPACING.container,
          top: SPACING.container,
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
        right: SPACING.container,
        top: SPACING.container,
        width: '280px',
        maxHeight: 'calc(100vh - 100px)',
        background: UI_COLORS.backgroundPrimary,
        border: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
        borderRadius: BORDER_RADIUS.large,
        boxShadow: SHADOWS.strong,
        display: 'flex',
        flexDirection: 'column',
        zIndex: Z_INDEX.panel,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: SPACING.padding.panel,
          borderBottom: `1px solid ${UI_COLORS.backgroundModifierBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: FONT_SIZES.large, fontWeight: 600 }}>Components</h3>
        <button
          onClick={() => setIsCollapsed(true)}
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
    </div>
  );
};
