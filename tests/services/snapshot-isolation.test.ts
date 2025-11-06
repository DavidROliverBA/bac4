/**
 * Snapshot Isolation Tests (v2.5.1)
 *
 * Tests that verify snapshots maintain independent node properties (color, label, etc.)
 * This test suite validates the fix for the snapshot data contamination bug.
 *
 * Bug: When editing one snapshot, changes would contaminate other snapshots on file reload.
 * Fix: Store snapshot-specific properties in Snapshot.nodeProperties instead of shared nodeFile.
 */

import { describe, it, expect } from '@jest/globals';
import type { BAC4FileV2, BAC4GraphFileV2 } from '../../src/types/bac4-v2-types';
import { splitNodesAndEdges, mergeNodesAndLayout } from '../../src/services/file-io-service';
import type { Node, Edge } from 'reactflow';

/**
 * Helper: Create mock node
 */
function createMockNode(id: string, label: string, color: string, x: number, y: number): Node {
  return {
    id,
    type: 'market',
    position: { x, y },
    width: 250,
    height: 100,
    data: {
      label,
      description: `Description of ${label}`,
      color,
      technology: 'TypeScript',
      team: 'Team A',
      status: 'active',
    },
  };
}

/**
 * Helper: Create mock BAC4FileV2
 */
function createMockNodeFile(): BAC4FileV2 {
  return {
    version: '2.5.1',
    metadata: {
      id: 'test-diagram-123',
      title: 'Test Diagram',
      description: 'Test',
      layer: 'market',
      diagramType: 'market',
      created: '2025-01-01T00:00:00Z',
      updated: '2025-01-01T00:00:00Z',
      status: 'draft',
    },
    nodes: {
      'node-1': {
        id: 'node-1',
        type: 'market',
        properties: {
          label: 'Original Label',
          description: 'Original Description',
          technology: 'TypeScript',
          team: 'Team A',
          status: 'active',
        },
        knowledge: { notes: [], urls: [], attachments: [] },
        metrics: {},
        links: {
          parent: null,
          children: [],
          linkedDiagrams: [],
          externalSystems: [],
          dependencies: [],
        },
        style: {
          color: '#ff0000',
          icon: 'square',
          shape: 'rectangle',
        },
      },
      'node-2': {
        id: 'node-2',
        type: 'market',
        properties: {
          label: 'Node 2',
          description: 'Description 2',
          technology: 'JavaScript',
          team: 'Team B',
          status: 'inactive',
        },
        knowledge: { notes: [], urls: [], attachments: [] },
        metrics: {},
        links: {
          parent: null,
          children: [],
          linkedDiagrams: [],
          externalSystems: [],
          dependencies: [],
        },
        style: {
          color: '#00ff00',
          icon: 'circle',
          shape: 'circle',
        },
      },
    },
  };
}

/**
 * Helper: Create mock BAC4GraphFileV2
 */
function createMockGraphFile(): BAC4GraphFileV2 {
  return {
    version: '2.5.1',
    metadata: {
      nodeFile: 'test.bac4',
      graphId: 'graph-123',
      title: 'Test Graph',
      viewType: 'c4-context',
      created: '2025-01-01T00:00:00Z',
      updated: '2025-01-01T00:00:00Z',
    },
    timeline: {
      snapshots: [
        {
          id: 'current',
          label: 'Current',
          timestamp: null,
          description: '',
          created: '2025-01-01T00:00:00Z',
          layout: {
            'node-1': { x: 100, y: 100, width: 250, height: 100, locked: false },
            'node-2': { x: 400, y: 100, width: 250, height: 100, locked: false },
          },
          edges: [],
          groups: [],
          annotations: [],
          nodeProperties: {
            'node-1': {
              properties: {
                label: 'Green Node 1',
                description: 'Green description',
                technology: 'TypeScript',
                team: 'Team A',
                status: 'active',
              },
              style: {
                color: '#00ff00',
                icon: 'square',
                shape: 'rectangle',
              },
            },
            'node-2': {
              properties: {
                label: 'Green Node 2',
                description: 'Green description 2',
                technology: 'JavaScript',
                team: 'Team B',
                status: 'inactive',
              },
              style: {
                color: '#00ff00',
                icon: 'circle',
                shape: 'circle',
              },
            },
          },
        },
      ],
      currentSnapshotId: 'current',
      snapshotOrder: ['current'],
    },
    config: {
      gridEnabled: true,
      gridSize: 20,
      snapToGrid: false,
      showMinimap: true,
      layoutAlgorithm: 'manual',
    },
  };
}

describe('Snapshot Isolation (v2.5.1 Fix)', () => {
  describe('splitNodesAndEdges', () => {
    it('should store node properties in snapshot.nodeProperties', () => {
      const nodes = [
        createMockNode('node-1', 'Blue Node', '#0000ff', 100, 100),
        createMockNode('node-2', 'Red Node', '#ff0000', 400, 100),
      ];
      const edges: Edge[] = [];

      const nodeFile = createMockNodeFile();
      const graphFile = createMockGraphFile();

      const result = splitNodesAndEdges(nodes, edges, nodeFile, graphFile);

      // Check that snapshot has nodeProperties
      const snapshot = result.graphFile.timeline.snapshots[0];
      expect(snapshot.nodeProperties).toBeDefined();
      expect(snapshot.nodeProperties!['node-1']).toBeDefined();
      expect(snapshot.nodeProperties!['node-2']).toBeDefined();

      // Verify node 1 properties
      expect(snapshot.nodeProperties!['node-1'].properties.label).toBe('Blue Node');
      expect(snapshot.nodeProperties!['node-1'].style.color).toBe('#0000ff');

      // Verify node 2 properties
      expect(snapshot.nodeProperties!['node-2'].properties.label).toBe('Red Node');
      expect(snapshot.nodeProperties!['node-2'].style.color).toBe('#ff0000');
    });

    it('should preserve all snapshot-varying properties', () => {
      const nodes = [
        createMockNode('node-1', 'Test Label', '#123456', 100, 100),
      ];
      nodes[0].data.technology = 'Rust';
      nodes[0].data.team = 'Backend Team';
      nodes[0].data.status = 'deprecated';
      nodes[0].data.icon = 'database';
      nodes[0].data.shape = 'hexagon';

      const edges: Edge[] = [];
      const nodeFile = createMockNodeFile();
      const graphFile = createMockGraphFile();

      const result = splitNodesAndEdges(nodes, edges, nodeFile, graphFile);
      const nodeProps = result.graphFile.timeline.snapshots[0].nodeProperties!['node-1'];

      expect(nodeProps.properties.label).toBe('Test Label');
      expect(nodeProps.properties.technology).toBe('Rust');
      expect(nodeProps.properties.team).toBe('Backend Team');
      expect(nodeProps.properties.status).toBe('deprecated');
      expect(nodeProps.style.color).toBe('#123456');
      expect(nodeProps.style.icon).toBe('database');
      expect(nodeProps.style.shape).toBe('hexagon');
    });
  });

  describe('mergeNodesAndLayout', () => {
    it('should use snapshot-specific properties when available', () => {
      const nodeFile = createMockNodeFile();
      const graphFile = createMockGraphFile();

      // Snapshot has green nodes, nodeFile has red/green
      const nodes = mergeNodesAndLayout(nodeFile, graphFile);

      expect(nodes.length).toBe(2);

      // Should use snapshot properties (green), not node file properties (red)
      expect(nodes[0].data.label).toBe('Green Node 1');
      expect(nodes[0].data.color).toBe('#00ff00');

      expect(nodes[1].data.label).toBe('Green Node 2');
      expect(nodes[1].data.color).toBe('#00ff00');
    });

    it('should fall back to node file when snapshot has no nodeProperties (backward compat)', () => {
      const nodeFile = createMockNodeFile();
      const graphFile = createMockGraphFile();

      // Remove nodeProperties to simulate v2.5.0 file
      delete graphFile.timeline.snapshots[0].nodeProperties;

      const nodes = mergeNodesAndLayout(nodeFile, graphFile);

      expect(nodes.length).toBe(2);

      // Should fall back to nodeFile properties
      expect(nodes[0].data.label).toBe('Original Label');
      expect(nodes[0].data.color).toBe('#ff0000');

      expect(nodes[1].data.label).toBe('Node 2');
      expect(nodes[1].data.color).toBe('#00ff00');
    });

    it('should only load nodes present in snapshot layout (prevents contamination)', () => {
      const nodeFile = createMockNodeFile();
      const graphFile = createMockGraphFile();

      // Add a third node to nodeFile that's NOT in snapshot layout
      nodeFile.nodes['node-3'] = {
        id: 'node-3',
        type: 'market',
        properties: {
          label: 'Should Not Appear',
          description: 'This node should not be loaded',
        },
        knowledge: { notes: [], urls: [], attachments: [] },
        metrics: {},
        links: {
          parent: null,
          children: [],
          linkedDiagrams: [],
          externalSystems: [],
          dependencies: [],
        },
        style: {
          color: '#ffffff',
        },
      };

      const nodes = mergeNodesAndLayout(nodeFile, graphFile);

      // Should only have 2 nodes (from snapshot layout), not 3
      expect(nodes.length).toBe(2);
      expect(nodes.find(n => n.id === 'node-3')).toBeUndefined();
    });
  });

  describe('Round-trip test (simulates bug scenario)', () => {
    it('should maintain snapshot independence through save/load cycle', () => {
      // SCENARIO: Create two snapshots with different node colors

      // Initial state: 2 green nodes
      const greenNodes = [
        createMockNode('node-1', 'Green Node 1', '#00ff00', 100, 100),
        createMockNode('node-2', 'Green Node 2', '#00ff00', 400, 100),
      ];

      const nodeFile1 = createMockNodeFile();
      const graphFile1 = createMockGraphFile();

      // Save "Current" snapshot (2 green nodes)
      const { nodeFile: savedNodeFile1, graphFile: savedGraphFile1 } = splitNodesAndEdges(
        greenNodes,
        [],
        nodeFile1,
        graphFile1
      );

      // Create "Phase 1" snapshot with 3 blue nodes
      const blueNodes = [
        createMockNode('node-1', 'Blue 1', '#0000ff', 100, 100),
        createMockNode('node-2', 'Blue 2', '#0000ff', 400, 100),
        createMockNode('node-3', 'Blue 3', '#0000ff', 700, 100),
      ];

      // Add node-3 to node file
      savedNodeFile1.nodes['node-3'] = {
        id: 'node-3',
        type: 'market',
        properties: {
          label: 'Node 3',
          description: '',
        },
        knowledge: { notes: [], urls: [], attachments: [] },
        metrics: {},
        links: {
          parent: null,
          children: [],
          linkedDiagrams: [],
          externalSystems: [],
          dependencies: [],
        },
        style: {
          color: '#0000ff',
        },
      };

      // Add Phase 1 snapshot
      savedGraphFile1.timeline.snapshots.push({
        id: 'phase1',
        label: 'Phase 1',
        timestamp: null,
        description: '',
        created: '2025-01-02T00:00:00Z',
        layout: {
          'node-1': { x: 100, y: 100, width: 250, height: 100, locked: false },
          'node-2': { x: 400, y: 100, width: 250, height: 100, locked: false },
          'node-3': { x: 700, y: 100, width: 250, height: 100, locked: false },
        },
        edges: [],
        groups: [],
        annotations: [],
        nodeProperties: {
          'node-1': {
            properties: { label: 'Blue 1', description: '', technology: 'TypeScript', team: 'Team A', status: 'active' },
            style: { color: '#0000ff', icon: 'square', shape: 'rectangle' },
          },
          'node-2': {
            properties: { label: 'Blue 2', description: '', technology: 'JavaScript', team: 'Team B', status: 'inactive' },
            style: { color: '#0000ff', icon: 'circle', shape: 'circle' },
          },
          'node-3': {
            properties: { label: 'Blue 3', description: '', technology: 'TypeScript', team: 'Team A', status: 'active' },
            style: { color: '#0000ff', icon: 'square', shape: 'rectangle' },
          },
        },
      });
      savedGraphFile1.timeline.snapshotOrder.push('phase1');

      // Switch to Phase 1
      savedGraphFile1.timeline.currentSnapshotId = 'phase1';

      // Save Phase 1 (3 blue nodes)
      const { nodeFile: savedNodeFile2, graphFile: savedGraphFile2 } = splitNodesAndEdges(
        blueNodes,
        [],
        savedNodeFile1,
        savedGraphFile1
      );

      // ✅ CRITICAL TEST: Load "Current" snapshot - should have 2 GREEN nodes, NOT 3 blue
      savedGraphFile2.timeline.currentSnapshotId = 'current';
      const loadedCurrentNodes = mergeNodesAndLayout(savedNodeFile2, savedGraphFile2, 'current');

      expect(loadedCurrentNodes.length).toBe(2); // ✅ Only 2 nodes
      expect(loadedCurrentNodes[0].data.color).toBe('#00ff00'); // ✅ Green
      expect(loadedCurrentNodes[1].data.color).toBe('#00ff00'); // ✅ Green
      expect(loadedCurrentNodes[0].data.label).toBe('Green Node 1');
      expect(loadedCurrentNodes[1].data.label).toBe('Green Node 2');

      // ✅ Load "Phase 1" snapshot - should have 3 BLUE nodes
      const loadedPhase1Nodes = mergeNodesAndLayout(savedNodeFile2, savedGraphFile2, 'phase1');

      expect(loadedPhase1Nodes.length).toBe(3); // ✅ 3 nodes
      expect(loadedPhase1Nodes[0].data.color).toBe('#0000ff'); // ✅ Blue
      expect(loadedPhase1Nodes[1].data.color).toBe('#0000ff'); // ✅ Blue
      expect(loadedPhase1Nodes[2].data.color).toBe('#0000ff'); // ✅ Blue
      expect(loadedPhase1Nodes[0].data.label).toBe('Blue 1');
      expect(loadedPhase1Nodes[1].data.label).toBe('Blue 2');
      expect(loadedPhase1Nodes[2].data.label).toBe('Blue 3');

      console.log('✅ SNAPSHOT ISOLATION TEST PASSED');
      console.log('   Current snapshot: 2 green nodes');
      console.log('   Phase 1 snapshot: 3 blue nodes');
      console.log('   No data contamination detected!');
    });
  });
});
