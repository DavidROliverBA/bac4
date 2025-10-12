/**
 * Tests for Canvas Helper Utilities
 */

import {
  canDrillDown,
  getChildDiagramType,
  normalizeEdges,
  getDiagramName,
  shouldAutoCreateChild,
  getChildTypeLabel,
} from '../../../../src/ui/canvas/utils/canvas-utils';
import type { Edge } from 'reactflow';

describe('canvas-utils', () => {
  describe('canDrillDown', () => {
    it('should allow system node drill-down in context diagram', () => {
      expect(canDrillDown('system', 'context')).toBe(true);
    });

    it('should allow container node drill-down in container diagram', () => {
      expect(canDrillDown('container', 'container')).toBe(true);
    });

    it('should not allow person node drill-down in context diagram', () => {
      expect(canDrillDown('person', 'context')).toBe(false);
    });

    it('should not allow system node drill-down in container diagram', () => {
      expect(canDrillDown('system', 'container')).toBe(false);
    });

    it('should not allow system node drill-down in component diagram', () => {
      expect(canDrillDown('system', 'component')).toBe(false);
    });

    it('should not allow container node drill-down in context diagram', () => {
      expect(canDrillDown('container', 'context')).toBe(false);
    });

    it('should not allow container node drill-down in component diagram', () => {
      expect(canDrillDown('container', 'component')).toBe(false);
    });

    it('should not allow c4 node drill-down in any diagram', () => {
      expect(canDrillDown('c4', 'context')).toBe(false);
      expect(canDrillDown('c4', 'container')).toBe(false);
      expect(canDrillDown('c4', 'component')).toBe(false);
    });

    it('should not allow cloudComponent node drill-down in any diagram', () => {
      expect(canDrillDown('cloudComponent', 'context')).toBe(false);
      expect(canDrillDown('cloudComponent', 'container')).toBe(false);
      expect(canDrillDown('cloudComponent', 'component')).toBe(false);
    });
  });

  describe('getChildDiagramType', () => {
    it('should return "container" for system node', () => {
      expect(getChildDiagramType('system')).toBe('container');
    });

    it('should return "component" for container node', () => {
      expect(getChildDiagramType('container')).toBe('component');
    });

    it('should return null for person node', () => {
      expect(getChildDiagramType('person')).toBeNull();
    });

    it('should return null for c4 node', () => {
      expect(getChildDiagramType('c4')).toBeNull();
    });

    it('should return null for cloudComponent node', () => {
      expect(getChildDiagramType('cloudComponent')).toBeNull();
    });

    it('should return null for unknown node type', () => {
      expect(getChildDiagramType('unknown')).toBeNull();
    });
  });

  describe('normalizeEdges', () => {
    it('should add type "directional" to edge without type', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2' },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].type).toBe('directional');
    });

    it('should preserve existing type', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'custom' },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].type).toBe('custom');
    });

    it('should add default label "uses" when missing', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2' },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].data?.label).toBe('uses');
    });

    it('should preserve existing data.label', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2', data: { label: 'calls' } },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].data?.label).toBe('calls');
    });

    it('should use legacy label property as fallback', () => {
      const edges: any[] = [
        { id: 'e1', source: 'n1', target: 'n2', label: 'legacy' },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].data?.label).toBe('legacy');
    });

    it('should add default direction "right" when missing', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2' },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].data?.direction).toBe('right');
    });

    it('should preserve existing direction', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2', data: { label: 'uses', direction: 'left' } },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized[0].data?.direction).toBe('left');
    });

    it('should preserve other edge data properties', () => {
      const edges: Edge[] = [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          data: { label: 'uses', direction: 'both', custom: 'value' }
        },
      ];

      const normalized = normalizeEdges(edges);

      expect((normalized[0].data as any)?.custom).toBe('value');
    });

    it('should normalize multiple edges', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3', data: { label: 'calls' } },
        { id: 'e3', source: 'n3', target: 'n4', type: 'custom', data: { label: 'sends', direction: 'left' } },
      ];

      const normalized = normalizeEdges(edges);

      expect(normalized).toHaveLength(3);
      expect(normalized[0].data?.label).toBe('uses');
      expect(normalized[1].data?.label).toBe('calls');
      expect(normalized[2].data?.label).toBe('sends');
      expect(normalized[2].data?.direction).toBe('left');
    });

    it('should handle empty array', () => {
      const edges: Edge[] = [];

      const normalized = normalizeEdges(edges);

      expect(normalized).toHaveLength(0);
    });
  });

  describe('getDiagramName', () => {
    it('should extract name from simple path', () => {
      expect(getDiagramName('my-diagram.bac4')).toBe('my-diagram');
    });

    it('should extract name from path with directories', () => {
      expect(getDiagramName('diagrams/systems/my-system.bac4')).toBe('my-system');
    });

    it('should extract name from absolute path', () => {
      expect(getDiagramName('/path/to/diagrams/Context.bac4')).toBe('Context');
    });

    it('should handle path with multiple dots', () => {
      expect(getDiagramName('my.system.diagram.bac4')).toBe('my.system.diagram');
    });

    it('should use Unix-style path separator', () => {
      // Note: Obsidian uses Unix-style paths internally even on Windows
      expect(getDiagramName('C:\\Users\\docs\\diagram.bac4')).toBe('C:\\Users\\docs\\diagram');
    });

    it('should return "diagram" for empty path', () => {
      expect(getDiagramName('')).toBe('diagram');
    });

    it('should handle path without extension', () => {
      expect(getDiagramName('diagrams/my-diagram')).toBe('my-diagram');
    });
  });

  describe('shouldAutoCreateChild', () => {
    it('should return true for system node in context diagram', () => {
      expect(shouldAutoCreateChild('system', 'context')).toBe(true);
    });

    it('should return true for container node in container diagram', () => {
      expect(shouldAutoCreateChild('container', 'container')).toBe(true);
    });

    it('should return false for person node in context diagram', () => {
      expect(shouldAutoCreateChild('person', 'context')).toBe(false);
    });

    it('should return false for system node in container diagram', () => {
      expect(shouldAutoCreateChild('system', 'container')).toBe(false);
    });

    it('should return false for system node in component diagram', () => {
      expect(shouldAutoCreateChild('system', 'component')).toBe(false);
    });

    it('should return false for container node in context diagram', () => {
      expect(shouldAutoCreateChild('container', 'context')).toBe(false);
    });

    it('should return false for container node in component diagram', () => {
      expect(shouldAutoCreateChild('container', 'component')).toBe(false);
    });

    it('should return false for c4 node in any diagram', () => {
      expect(shouldAutoCreateChild('c4', 'context')).toBe(false);
      expect(shouldAutoCreateChild('c4', 'container')).toBe(false);
      expect(shouldAutoCreateChild('c4', 'component')).toBe(false);
    });
  });

  describe('getChildTypeLabel', () => {
    it('should return "Container" for system node', () => {
      expect(getChildTypeLabel('system')).toBe('Container');
    });

    it('should return "Component" for container node', () => {
      expect(getChildTypeLabel('container')).toBe('Component');
    });

    it('should return "Component" for any other node type', () => {
      expect(getChildTypeLabel('person')).toBe('Component');
      expect(getChildTypeLabel('c4')).toBe('Component');
      expect(getChildTypeLabel('cloudComponent')).toBe('Component');
      expect(getChildTypeLabel('unknown')).toBe('Component');
    });
  });
});
