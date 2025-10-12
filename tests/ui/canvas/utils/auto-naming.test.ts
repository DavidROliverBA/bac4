/**
 * Tests for Auto-Naming Utilities
 */

import { getAutoName, initializeNodeCounter } from '../../../../src/ui/canvas/utils/auto-naming';
import type { Node } from 'reactflow';
import type { CanvasNodeData } from '../../../../src/types/canvas-types';

describe('auto-naming', () => {
  describe('getAutoName', () => {
    it('should generate "System 1" for first system node', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('system', nodes);

      expect(name).toBe('System 1');
    });

    it('should generate sequential system names', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-1', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
        { id: 'node-2', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 2' } },
      ];

      const name = getAutoName('system', nodes);

      expect(name).toBe('System 3');
    });

    it('should generate "Container 1" for first container node', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('container', nodes);

      expect(name).toBe('Container 1');
    });

    it('should generate sequential container names', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-1', type: 'container', position: { x: 0, y: 0 }, data: { label: 'Container 1' } },
      ];

      const name = getAutoName('container', nodes);

      expect(name).toBe('Container 2');
    });

    it('should generate "Person 1" for first person node', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('person', nodes);

      expect(name).toBe('Person 1');
    });

    it('should generate sequential person names', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-1', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 1' } },
        { id: 'node-2', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 2' } },
        { id: 'node-3', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 3' } },
      ];

      const name = getAutoName('person', nodes);

      expect(name).toBe('Person 4');
    });

    it('should generate "Component 1" for first c4 node', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('c4', nodes);

      expect(name).toBe('Component 1');
    });

    it('should generate "Cloud Component 1" for first cloudComponent node', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('cloudComponent', nodes);

      expect(name).toBe('Cloud Component 1');
    });

    it('should generate "Node 1" for unknown node type', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('unknown', nodes);

      expect(name).toBe('Node 1');
    });

    it('should only count nodes of the same type', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-1', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
        { id: 'node-2', type: 'container', position: { x: 0, y: 0 }, data: { label: 'Container 1' } },
        { id: 'node-3', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 1' } },
        { id: 'node-4', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 2' } },
      ];

      const systemName = getAutoName('system', nodes);
      const containerName = getAutoName('container', nodes);
      const personName = getAutoName('person', nodes);

      expect(systemName).toBe('System 3');
      expect(containerName).toBe('Container 2');
      expect(personName).toBe('Person 2');
    });

    it('should handle empty nodes array', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const name = getAutoName('system', nodes);

      expect(name).toBe('System 1');
    });
  });

  describe('initializeNodeCounter', () => {
    it('should return 0 for empty nodes array', () => {
      const nodes: Node<CanvasNodeData>[] = [];

      const counter = initializeNodeCounter(nodes);

      expect(counter).toBe(0);
    });

    it('should find maximum node number from single node', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-5', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
      ];

      const counter = initializeNodeCounter(nodes);

      expect(counter).toBe(5);
    });

    it('should find maximum node number from multiple nodes', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-1', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
        { id: 'node-5', type: 'container', position: { x: 0, y: 0 }, data: { label: 'Container 1' } },
        { id: 'node-3', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 1' } },
        { id: 'node-10', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 2' } },
      ];

      const counter = initializeNodeCounter(nodes);

      expect(counter).toBe(10);
    });

    it('should ignore nodes with non-matching ID format', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-5', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
        { id: 'custom-id', type: 'container', position: { x: 0, y: 0 }, data: { label: 'Container 1' } },
        { id: 'system-1', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 1' } },
        { id: 'node-3', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 2' } },
      ];

      const counter = initializeNodeCounter(nodes);

      expect(counter).toBe(5);
    });

    it('should handle large node numbers', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'node-1', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
        { id: 'node-100', type: 'container', position: { x: 0, y: 0 }, data: { label: 'Container 1' } },
        { id: 'node-999', type: 'person', position: { x: 0, y: 0 }, data: { label: 'Person 1' } },
      ];

      const counter = initializeNodeCounter(nodes);

      expect(counter).toBe(999);
    });

    it('should return 0 if no nodes match node-N pattern', () => {
      const nodes: Node<CanvasNodeData>[] = [
        { id: 'custom-1', type: 'system', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
        { id: 'system-2', type: 'container', position: { x: 0, y: 0 }, data: { label: 'Container 1' } },
      ];

      const counter = initializeNodeCounter(nodes);

      expect(counter).toBe(0);
    });
  });
});
