/**
 * Component Palette
 * Shows available cloud components that can be dragged onto the canvas
 */

import * as React from 'react';
import { ComponentDefinition, CloudProvider } from '../../../component-library/types';
import { ComponentLibraryService } from '../../services/component-library-service';

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
          right: '16px',
          top: '16px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          style={{
            padding: '8px 12px',
            background: 'var(--background-primary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
            color: 'var(--text-normal)',
            cursor: 'pointer',
            fontSize: '12px',
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
        right: '16px',
        top: '16px',
        width: '280px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'var(--background-primary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--background-modifier-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Components</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
          }}
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px' }}>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: 'var(--background-secondary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
            color: 'var(--text-normal)',
            fontSize: '12px',
          }}
        />
      </div>

      {/* Provider filter */}
      <div
        style={{
          padding: '0 12px 8px 12px',
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setSelectedProvider('all')}
          style={{
            padding: '4px 8px',
            background: selectedProvider === 'all' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '3px',
            color: selectedProvider === 'all' ? '#fff' : 'var(--text-normal)',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          All
        </button>
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => setSelectedProvider(provider)}
            style={{
              padding: '4px 8px',
              background: selectedProvider === provider ? 'var(--interactive-accent)' : 'var(--background-secondary)',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '3px',
              color: selectedProvider === provider ? '#fff' : 'var(--text-normal)',
              cursor: 'pointer',
              fontSize: '11px',
              textTransform: 'uppercase',
            }}
          >
            {provider}
          </button>
        ))}
      </div>

      {/* Components list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px' }}>
        {Array.from(groupedComponents.entries()).map(([category, components]) => (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              {category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {components.map((component) => (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, component)}
                  onClick={() => onAddComponent(component)}
                  style={{
                    padding: '8px',
                    background: 'var(--background-secondary)',
                    border: `1px solid ${component.color}`,
                    borderRadius: '4px',
                    cursor: 'grab',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
                        fontSize: '10px',
                        color: 'var(--text-faint)',
                        marginTop: '2px',
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
