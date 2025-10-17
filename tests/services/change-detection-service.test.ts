/**
 * Tests for ChangeDetectionService
 */

import { Node, Edge } from 'reactflow';
import { ChangeDetectionService } from '../../src/services/ChangeDetectionService';
import {
	TimelineSnapshot,
	ChangeSet,
	NodeDataWithTimeline,
	EdgeDataWithTimeline,
} from '../../src/types/timeline';

// Mock console.log/warn to avoid noise in test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe('ChangeDetectionService', () => {
	beforeEach(() => {
		consoleLogSpy.mockClear();
		jest.clearAllMocks();
	});

	// Helper function to create a sample snapshot
	const createSnapshot = (
		label: string,
		nodes: Node[],
		edges: Edge[]
	): TimelineSnapshot => ({
		id: `snapshot-${label}`,
		label,
		timestamp: null,
		description: '',
		createdAt: new Date().toISOString(),
		nodes: JSON.parse(JSON.stringify(nodes)),
		edges: JSON.parse(JSON.stringify(edges)),
		annotations: [],
	});

	describe('compareSnapshots', () => {
		it('should detect added nodes', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const afterNodes: Node[] = [
				...beforeNodes,
				{
					id: 'node-2',
					type: 'system',
					position: { x: 200, y: 200 },
					data: { label: 'System B' },
				},
			];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.addedNodes).toHaveLength(1);
			expect(changes.addedNodes[0]).toBe('node-2');
		});

		it('should detect removed nodes', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
				{
					id: 'node-2',
					type: 'system',
					position: { x: 200, y: 200 },
					data: { label: 'System B' },
				},
			];

			const afterNodes: Node[] = [beforeNodes[0]];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.removedNodes).toHaveLength(1);
			expect(changes.removedNodes[0]).toBe('node-2');
		});

		it('should detect modified nodes (label change)', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'Original Label' },
				},
			];

			const afterNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'Modified Label' },
				},
			];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.modifiedNodes).toHaveLength(1);
			expect(changes.modifiedNodes[0]).toBe('node-1');
		});

		it('should detect modified nodes (color change)', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A', color: '#FF0000' },
				},
			];

			const afterNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A', color: '#00FF00' },
				},
			];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.modifiedNodes).toHaveLength(1);
		});

		it('should NOT detect position changes as modifications', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const afterNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 200, y: 250 }, // Moved >50px
					data: { label: 'System A' },
				},
			];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			// Position changes are tracked but NOT considered modifications
			expect(changes.modifiedNodes).toHaveLength(0);
		});

		it('should NOT detect minor position changes (<50px)', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const afterNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 130, y: 120 }, // Only moved 30px
					data: { label: 'System A' },
				},
			];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.modifiedNodes).toHaveLength(0);
		});

		it('should detect added edges', () => {
			const beforeEdges: Edge[] = [];

			const afterEdges: Edge[] = [
				{
					id: 'edge-1',
					source: 'node-1',
					target: 'node-2',
					data: { label: 'uses' },
				},
			];

			const before = createSnapshot('Before', [], beforeEdges);
			const after = createSnapshot('After', [], afterEdges);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.addedEdges).toHaveLength(1);
			expect(changes.addedEdges[0]).toBe('edge-1');
		});

		it('should detect removed edges', () => {
			const beforeEdges: Edge[] = [
				{
					id: 'edge-1',
					source: 'node-1',
					target: 'node-2',
					data: { label: 'uses' },
				},
			];

			const afterEdges: Edge[] = [];

			const before = createSnapshot('Before', [], beforeEdges);
			const after = createSnapshot('After', [], afterEdges);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.removedEdges).toHaveLength(1);
			expect(changes.removedEdges[0]).toBe('edge-1');
		});

		it('should detect no changes when snapshots are identical', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const before = createSnapshot('Before', nodes, []);
			const after = createSnapshot('After', nodes, []);

			const changes = ChangeDetectionService.compareSnapshots(before, after);

			expect(changes.addedNodes).toHaveLength(0);
			expect(changes.modifiedNodes).toHaveLength(0);
			expect(changes.removedNodes).toHaveLength(0);
			expect(changes.addedEdges).toHaveLength(0);
			expect(changes.removedEdges).toHaveLength(0);
		});
	});

	describe('applyNodeChangeIndicators', () => {
		it('should apply "new" indicator to added nodes', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const changeSet: ChangeSet = {
				addedNodes: ['node-1'],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const updated = ChangeDetectionService.applyNodeChangeIndicators(nodes, changeSet);

			expect((updated[0].data as NodeDataWithTimeline).changeIndicator).toBe('new');
		});

		it('should apply "modified" indicator to modified nodes', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: ['node-1'],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const updated = ChangeDetectionService.applyNodeChangeIndicators(nodes, changeSet);

			expect((updated[0].data as NodeDataWithTimeline).changeIndicator).toBe('modified');
		});

		it('should apply "removed" indicator to removed nodes', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: ['node-1'],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const updated = ChangeDetectionService.applyNodeChangeIndicators(nodes, changeSet);

			expect((updated[0].data as NodeDataWithTimeline).changeIndicator).toBe('removed');
		});

		it('should not modify nodes without changes', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const updated = ChangeDetectionService.applyNodeChangeIndicators(nodes, changeSet);

			expect((updated[0].data as NodeDataWithTimeline).changeIndicator).toBeUndefined();
		});
	});

	describe('applyEdgeChangeIndicators', () => {
		it('should apply "new" indicator to added edges', () => {
			const edges: Edge[] = [
				{
					id: 'edge-1',
					source: 'node-1',
					target: 'node-2',
					data: { label: 'uses' },
				},
			];

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: ['edge-1'],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const updated = ChangeDetectionService.applyEdgeChangeIndicators(edges, changeSet);

			expect((updated[0].data as EdgeDataWithTimeline).changeIndicator).toBe('new');
		});

		it('should apply "removed" indicator to removed edges', () => {
			const edges: Edge[] = [
				{
					id: 'edge-1',
					source: 'node-1',
					target: 'node-2',
					data: { label: 'uses' },
				},
			];

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: ['edge-1'],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const updated = ChangeDetectionService.applyEdgeChangeIndicators(edges, changeSet);

			expect((updated[0].data as EdgeDataWithTimeline).changeIndicator).toBe('removed');
		});
	});

	describe('generateChangeSummary', () => {
		it('should generate summary with all change types', () => {
			const before = createSnapshot('Before', [], []);
			const after = createSnapshot('After', [], []);

			const changeSet: ChangeSet = {
				addedNodes: ['node-1', 'node-2'],
				modifiedNodes: ['node-3'],
				removedNodes: ['node-4'],
				addedEdges: ['edge-1'],
				removedEdges: ['edge-2'],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const summary = ChangeDetectionService.generateChangeSummary(
				changeSet,
				before,
				after
			);

			expect(summary).toContain('Before');
			expect(summary).toContain('After');
			expect(summary).toContain('Added 2 node(s)');
			expect(summary).toContain('Modified 1 node(s)');
			expect(summary).toContain('Removed 1 node(s)');
			expect(summary).toContain('Added 1 edge(s)');
			expect(summary).toContain('Removed 1 edge(s)');
		});

		it('should generate summary with no changes', () => {
			const before = createSnapshot('Before', [], []);
			const after = createSnapshot('After', [], []);

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const summary = ChangeDetectionService.generateChangeSummary(
				changeSet,
				before,
				after
			);

			expect(summary).toContain('No changes detected');
		});
	});

	describe('generateDetailedChangeSummary', () => {
		it('should include node labels in summary', () => {
			const beforeNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
			];

			const afterNodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
				{
					id: 'node-2',
					type: 'system',
					position: { x: 200, y: 200 },
					data: { label: 'System B' },
				},
			];

			const before = createSnapshot('Before', beforeNodes, []);
			const after = createSnapshot('After', afterNodes, []);

			const changeSet: ChangeSet = {
				addedNodes: ['node-2'],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const summary = ChangeDetectionService.generateDetailedChangeSummary(
				changeSet,
				before,
				after
			);

			expect(summary).toContain('System B');
			expect(summary).toContain('Added Nodes');
		});

		it('should include edge descriptions', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A' },
				},
				{
					id: 'node-2',
					type: 'system',
					position: { x: 200, y: 200 },
					data: { label: 'System B' },
				},
			];

			const beforeEdges: Edge[] = [];

			const afterEdges: Edge[] = [
				{
					id: 'edge-1',
					source: 'node-1',
					target: 'node-2',
					data: { label: 'uses' },
				},
			];

			const before = createSnapshot('Before', nodes, beforeEdges);
			const after = createSnapshot('After', nodes, afterEdges);

			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: ['edge-1'],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const summary = ChangeDetectionService.generateDetailedChangeSummary(
				changeSet,
				before,
				after
			);

			expect(summary).toContain('System A uses System B');
			expect(summary).toContain('Added Relationships');
		});
	});

	describe('clearNodeChangeIndicators', () => {
		it('should clear change indicators from nodes', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: {
						label: 'System A',
						changeIndicator: 'new',
						changeNote: 'Added in Phase 2',
					} as NodeDataWithTimeline,
				},
			];

			const cleared = ChangeDetectionService.clearNodeChangeIndicators(nodes);

			expect((cleared[0].data as NodeDataWithTimeline).changeIndicator).toBeNull();
			expect((cleared[0].data as NodeDataWithTimeline).changeNote).toBeUndefined();
		});
	});

	describe('clearEdgeChangeIndicators', () => {
		it('should clear change indicators from edges', () => {
			const edges: Edge[] = [
				{
					id: 'edge-1',
					source: 'node-1',
					target: 'node-2',
					data: { label: 'uses', changeIndicator: 'new' } as EdgeDataWithTimeline,
				},
			];

			const cleared = ChangeDetectionService.clearEdgeChangeIndicators(edges);

			expect((cleared[0].data as EdgeDataWithTimeline).changeIndicator).toBeNull();
		});
	});

	describe('getNodesWithIndicator', () => {
		it('should filter nodes by indicator', () => {
			const nodes: Node[] = [
				{
					id: 'node-1',
					type: 'system',
					position: { x: 100, y: 100 },
					data: { label: 'System A', changeIndicator: 'new' } as NodeDataWithTimeline,
				},
				{
					id: 'node-2',
					type: 'system',
					position: { x: 200, y: 200 },
					data: {
						label: 'System B',
						changeIndicator: 'modified',
					} as NodeDataWithTimeline,
				},
				{
					id: 'node-3',
					type: 'system',
					position: { x: 300, y: 300 },
					data: { label: 'System C', changeIndicator: 'new' } as NodeDataWithTimeline,
				},
			];

			const newNodes = ChangeDetectionService.getNodesWithIndicator(nodes, 'new');

			expect(newNodes).toHaveLength(2);
			expect(newNodes[0].id).toBe('node-1');
			expect(newNodes[1].id).toBe('node-3');
		});
	});

	describe('countChanges', () => {
		it('should count total changes', () => {
			const changeSet: ChangeSet = {
				addedNodes: ['node-1', 'node-2'],
				modifiedNodes: ['node-3'],
				removedNodes: [],
				addedEdges: ['edge-1'],
				removedEdges: ['edge-2', 'edge-3'],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const count = ChangeDetectionService.countChanges(changeSet);

			expect(count).toBe(6); // 2 + 1 + 0 + 1 + 2
		});

		it('should return zero for no changes', () => {
			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			const count = ChangeDetectionService.countChanges(changeSet);

			expect(count).toBe(0);
		});
	});

	describe('hasChanges', () => {
		it('should return true if changes exist', () => {
			const changeSet: ChangeSet = {
				addedNodes: ['node-1'],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			expect(ChangeDetectionService.hasChanges(changeSet)).toBe(true);
		});

		it('should return false if no changes', () => {
			const changeSet: ChangeSet = {
				addedNodes: [],
				modifiedNodes: [],
				removedNodes: [],
				addedEdges: [],
				removedEdges: [],
				unchangedNodes: [],
				unchangedEdges: [],
			};

			expect(ChangeDetectionService.hasChanges(changeSet)).toBe(false);
		});
	});

	describe('setNodeChangeIndicator', () => {
		it('should set change indicator and note', () => {
			const node: Node = {
				id: 'node-1',
				type: 'system',
				position: { x: 100, y: 100 },
				data: { label: 'System A' },
			};

			const updated = ChangeDetectionService.setNodeChangeIndicator(
				node,
				'modified',
				'Replaced old service'
			);

			expect((updated.data as NodeDataWithTimeline).changeIndicator).toBe('modified');
			expect((updated.data as NodeDataWithTimeline).changeNote).toBe(
				'Replaced old service'
			);
		});

		it('should clear indicator when set to null', () => {
			const node: Node = {
				id: 'node-1',
				type: 'system',
				position: { x: 100, y: 100 },
				data: {
					label: 'System A',
					changeIndicator: 'new',
				} as NodeDataWithTimeline,
			};

			const updated = ChangeDetectionService.setNodeChangeIndicator(node, null);

			expect((updated.data as NodeDataWithTimeline).changeIndicator).toBeNull();
		});
	});

	describe('setEdgeChangeIndicator', () => {
		it('should set change indicator', () => {
			const edge: Edge = {
				id: 'edge-1',
				source: 'node-1',
				target: 'node-2',
				data: { label: 'uses' },
			};

			const updated = ChangeDetectionService.setEdgeChangeIndicator(edge, 'new');

			expect((updated.data as EdgeDataWithTimeline).changeIndicator).toBe('new');
		});
	});
});
