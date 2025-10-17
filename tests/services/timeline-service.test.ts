/**
 * Tests for TimelineService
 */

import { Node, Edge } from 'reactflow';
import { TimelineService } from '../../src/services/TimelineService';
import {
	Annotation,
	CreateSnapshotOptions,
	MAX_SNAPSHOTS,
} from '../../src/types/timeline';

// Mock console.log to avoid noise in test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('TimelineService', () => {
	beforeEach(() => {
		consoleLogSpy.mockClear();
		consoleWarnSpy.mockClear();
		jest.clearAllMocks();
	});

	// Helper function to create sample nodes
	const createSampleNodes = (): Node[] => [
		{
			id: 'node-1',
			type: 'system',
			position: { x: 100, y: 100 },
			data: { label: 'System A' },
		},
		{
			id: 'node-2',
			type: 'person',
			position: { x: 300, y: 100 },
			data: { label: 'User' },
		},
	];

	// Helper function to create sample edges
	const createSampleEdges = (): Edge[] => [
		{
			id: 'edge-1',
			source: 'node-2',
			target: 'node-1',
			data: { label: 'uses' },
		},
	];

	// Helper function to create sample annotations
	const createSampleAnnotations = (): Annotation[] => [
		{
			id: 'annotation-1',
			type: 'text-box',
			position: { x: 200, y: 200 },
			data: {
				text: 'Note',
				color: '#4A90E2',
				fontSize: 12,
				linkedNodeId: null,
			},
		},
	];

	describe('createInitialTimeline', () => {
		it('should create timeline with single snapshot and default label', () => {
			const nodes = createSampleNodes();
			const edges = createSampleEdges();

			const timeline = TimelineService.createInitialTimeline(nodes, edges);

			expect(timeline.snapshots).toHaveLength(1);
			expect(timeline.snapshots[0].label).toBe('Current');
			expect(timeline.snapshots[0].nodes).toHaveLength(2);
			expect(timeline.snapshots[0].edges).toHaveLength(1);
			expect(timeline.snapshots[0].annotations).toHaveLength(0);
			expect(timeline.currentSnapshotId).toBe(timeline.snapshots[0].id);
			expect(timeline.snapshotOrder).toHaveLength(1);
		});

		it('should create timeline with custom label', () => {
			const timeline = TimelineService.createInitialTimeline([], [], 'Before');

			expect(timeline.snapshots[0].label).toBe('Before');
		});

		it('should create timeline with empty nodes and edges', () => {
			const timeline = TimelineService.createInitialTimeline();

			expect(timeline.snapshots[0].nodes).toHaveLength(0);
			expect(timeline.snapshots[0].edges).toHaveLength(0);
		});

		it('should deep copy nodes and edges', () => {
			const nodes = createSampleNodes();
			const edges = createSampleEdges();

			const timeline = TimelineService.createInitialTimeline(nodes, edges);

			// Modify originals
			nodes[0].data.label = 'Modified';
			edges[0].data.label = 'Modified';

			// Timeline should be unaffected
			expect(timeline.snapshots[0].nodes[0].data.label).toBe('System A');
			expect(timeline.snapshots[0].edges[0].data.label).toBe('uses');
		});
	});

	describe('createSnapshot', () => {
		it('should create new snapshot from canvas state', () => {
			const timeline = TimelineService.createInitialTimeline();
			const nodes = createSampleNodes();
			const edges = createSampleEdges();
			const annotations = createSampleAnnotations();

			const options: CreateSnapshotOptions = {
				label: 'Phase 2',
				description: 'After migration',
			};

			const result = TimelineService.createSnapshot(
				nodes,
				edges,
				annotations,
				options,
				timeline
			);

			expect(result.snapshot.label).toBe('Phase 2');
			expect(result.snapshot.description).toBe('After migration');
			expect(result.snapshot.nodes).toHaveLength(2);
			expect(result.snapshot.edges).toHaveLength(1);
			expect(result.snapshot.annotations).toHaveLength(1);
			expect(result.timeline.snapshots).toHaveLength(2);
			expect(result.timeline.currentSnapshotId).toBe(result.snapshot.id);
		});

		it('should add timestamp if provided', () => {
			const timeline = TimelineService.createInitialTimeline();
			const options: CreateSnapshotOptions = {
				label: 'Q2 2025',
				timestamp: '2025-04-01T00:00:00Z',
			};

			const result = TimelineService.createSnapshot([], [], [], options, timeline);

			expect(result.snapshot.timestamp).toBe('2025-04-01T00:00:00Z');
		});

		it('should have null timestamp if not provided', () => {
			const timeline = TimelineService.createInitialTimeline();
			const options: CreateSnapshotOptions = { label: 'Test' };

			const result = TimelineService.createSnapshot([], [], [], options, timeline);

			expect(result.snapshot.timestamp).toBeNull();
		});

		it('should throw error when max snapshots reached', () => {
			// Create timeline with MAX_SNAPSHOTS
			let timeline = TimelineService.createInitialTimeline();
			for (let i = 1; i < MAX_SNAPSHOTS; i++) {
				const result = TimelineService.createSnapshot(
					[],
					[],
					[],
					{ label: `Snapshot ${i + 1}` },
					timeline
				);
				timeline = result.timeline;
			}

			expect(timeline.snapshots).toHaveLength(MAX_SNAPSHOTS);

			// Try to add one more
			expect(() => {
				TimelineService.createSnapshot(
					[],
					[],
					[],
					{ label: 'Too many' },
					timeline
				);
			}).toThrow(`Cannot create snapshot: Maximum of ${MAX_SNAPSHOTS} snapshots per diagram`);
		});

		it('should deep copy nodes/edges/annotations', () => {
			const timeline = TimelineService.createInitialTimeline();
			const nodes = createSampleNodes();
			const edges = createSampleEdges();
			const annotations = createSampleAnnotations();

			const result = TimelineService.createSnapshot(
				nodes,
				edges,
				annotations,
				{ label: 'Test' },
				timeline
			);

			// Modify originals
			nodes[0].data.label = 'Modified';
			edges[0].data.label = 'Modified';
			annotations[0].data.text = 'Modified';

			// Snapshot should be unaffected
			expect(result.snapshot.nodes[0].data.label).toBe('System A');
			expect(result.snapshot.edges[0].data.label).toBe('uses');
			expect(result.snapshot.annotations[0].data.text).toBe('Note');
		});
	});

	describe('switchSnapshot', () => {
		it('should return nodes/edges/annotations for selected snapshot', () => {
			let timeline = TimelineService.createInitialTimeline([], []);
			const nodes = createSampleNodes();
			const edges = createSampleEdges();
			const annotations = createSampleAnnotations();

			// Create second snapshot
			const result = TimelineService.createSnapshot(
				nodes,
				edges,
				annotations,
				{ label: 'After' },
				timeline
			);
			timeline = result.timeline;

			// Switch to first snapshot (empty)
			const firstSnapshotId = timeline.snapshotOrder[0];
			const switched = TimelineService.switchSnapshot(firstSnapshotId, timeline);

			expect(switched.nodes).toHaveLength(0);
			expect(switched.edges).toHaveLength(0);
			expect(switched.annotations).toHaveLength(0);
		});

		it('should throw error if snapshot not found', () => {
			const timeline = TimelineService.createInitialTimeline();

			expect(() => {
				TimelineService.switchSnapshot('invalid-id', timeline);
			}).toThrow('Snapshot not found: invalid-id');
		});

		it('should return deep copies to prevent mutations', () => {
			const timeline = TimelineService.createInitialTimeline(createSampleNodes(), []);

			const snapshotId = timeline.snapshots[0].id;
			const switched = TimelineService.switchSnapshot(snapshotId, timeline);

			// Modify returned data
			switched.nodes[0].data.label = 'Modified';

			// Original timeline should be unaffected
			expect(timeline.snapshots[0].nodes[0].data.label).toBe('System A');
		});
	});

	describe('deleteSnapshot', () => {
		it('should delete snapshot and update order', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result1 = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result1.timeline;
			const result2 = TimelineService.createSnapshot([], [], [], { label: 'S3' }, timeline);
			timeline = result2.timeline;

			expect(timeline.snapshots).toHaveLength(3);

			// Delete middle snapshot
			const middleId = timeline.snapshotOrder[1];
			const updated = TimelineService.deleteSnapshot(middleId, timeline);

			expect(updated.snapshots).toHaveLength(2);
			expect(updated.snapshotOrder).toHaveLength(2);
			expect(updated.snapshotOrder.includes(middleId)).toBe(false);
		});

		it('should throw error when deleting last snapshot', () => {
			const timeline = TimelineService.createInitialTimeline();

			expect(() => {
				TimelineService.deleteSnapshot(timeline.snapshots[0].id, timeline);
			}).toThrow('Cannot delete the last snapshot');
		});

		it('should throw error if snapshot not found', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			expect(() => {
				TimelineService.deleteSnapshot('invalid-id', timeline);
			}).toThrow('Snapshot not found: invalid-id');
		});

		it('should switch to previous snapshot when deleting current', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const currentId = timeline.currentSnapshotId;
			const updated = TimelineService.deleteSnapshot(currentId, timeline);

			// Should switch to the first snapshot
			expect(updated.currentSnapshotId).toBe(timeline.snapshotOrder[0]);
		});

		it('should switch to next snapshot when deleting first', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const firstId = timeline.snapshotOrder[0];
			const updated = TimelineService.deleteSnapshot(firstId, timeline);

			// Should switch to what was the second snapshot
			expect(updated.currentSnapshotId).toBe(timeline.snapshotOrder[1]);
		});
	});

	describe('renameSnapshot', () => {
		it('should rename snapshot', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			const updated = TimelineService.renameSnapshot(
				snapshotId,
				'New Name',
				timeline
			);

			expect(updated.snapshots[0].label).toBe('New Name');
		});

		it('should trim whitespace from label', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			const updated = TimelineService.renameSnapshot(
				snapshotId,
				'  Trimmed  ',
				timeline
			);

			expect(updated.snapshots[0].label).toBe('Trimmed');
		});

		it('should throw error if label is empty', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			expect(() => {
				TimelineService.renameSnapshot(snapshotId, '', timeline);
			}).toThrow('Snapshot label cannot be empty');
		});

		it('should throw error if label is whitespace only', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			expect(() => {
				TimelineService.renameSnapshot(snapshotId, '   ', timeline);
			}).toThrow('Snapshot label cannot be empty');
		});

		it('should throw error if snapshot not found', () => {
			const timeline = TimelineService.createInitialTimeline();

			expect(() => {
				TimelineService.renameSnapshot('invalid-id', 'New Name', timeline);
			}).toThrow('Snapshot not found: invalid-id');
		});
	});

	describe('reorderSnapshots', () => {
		it('should reorder snapshots', () => {
			let timeline = TimelineService.createInitialTimeline();
			const r1 = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = r1.timeline;
			const r2 = TimelineService.createSnapshot([], [], [], { label: 'S3' }, timeline);
			timeline = r2.timeline;

			const [id1, id2, id3] = timeline.snapshotOrder;

			// Reverse order
			const updated = TimelineService.reorderSnapshots([id3, id2, id1], timeline);

			expect(updated.snapshotOrder).toEqual([id3, id2, id1]);
		});

		it('should throw error if newOrder has different IDs', () => {
			const timeline = TimelineService.createInitialTimeline();

			expect(() => {
				TimelineService.reorderSnapshots(['wrong-id'], timeline);
			}).toThrow('Missing snapshot ID in new order');
		});

		it('should throw error if newOrder has missing IDs', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const [id1] = timeline.snapshotOrder;

			expect(() => {
				TimelineService.reorderSnapshots([id1], timeline);
			}).toThrow('New order must contain all snapshot IDs');
		});
	});

	describe('getNextSnapshot', () => {
		it('should return next snapshot in order', () => {
			let timeline = TimelineService.createInitialTimeline();
			const r1 = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = r1.timeline;

			const firstId = timeline.snapshotOrder[0];
			const next = TimelineService.getNextSnapshot(firstId, timeline);

			expect(next).not.toBeNull();
			expect(next?.id).toBe(timeline.snapshotOrder[1]);
		});

		it('should return null if at last snapshot', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const lastId = timeline.snapshotOrder[timeline.snapshotOrder.length - 1];
			const next = TimelineService.getNextSnapshot(lastId, timeline);

			expect(next).toBeNull();
		});

		it('should return null if snapshot not found', () => {
			const timeline = TimelineService.createInitialTimeline();

			const next = TimelineService.getNextSnapshot('invalid-id', timeline);

			expect(next).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalled();
		});
	});

	describe('getPreviousSnapshot', () => {
		it('should return previous snapshot in order', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const secondId = timeline.snapshotOrder[1];
			const previous = TimelineService.getPreviousSnapshot(secondId, timeline);

			expect(previous).not.toBeNull();
			expect(previous?.id).toBe(timeline.snapshotOrder[0]);
		});

		it('should return null if at first snapshot', () => {
			const timeline = TimelineService.createInitialTimeline();

			const firstId = timeline.snapshotOrder[0];
			const previous = TimelineService.getPreviousSnapshot(firstId, timeline);

			expect(previous).toBeNull();
		});

		it('should return null if snapshot not found', () => {
			const timeline = TimelineService.createInitialTimeline();

			const previous = TimelineService.getPreviousSnapshot('invalid-id', timeline);

			expect(previous).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalled();
		});
	});

	describe('updateSnapshotMetadata', () => {
		it('should update timestamp', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			const updated = TimelineService.updateSnapshotMetadata(
				snapshotId,
				{ timestamp: 'Q2 2025' },
				timeline
			);

			expect(updated.snapshots[0].timestamp).toBe('Q2 2025');
		});

		it('should update description', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			const updated = TimelineService.updateSnapshotMetadata(
				snapshotId,
				{ description: 'New description' },
				timeline
			);

			expect(updated.snapshots[0].description).toBe('New description');
		});

		it('should update both timestamp and description', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			const updated = TimelineService.updateSnapshotMetadata(
				snapshotId,
				{ timestamp: 'Q2 2025', description: 'Test desc' },
				timeline
			);

			expect(updated.snapshots[0].timestamp).toBe('Q2 2025');
			expect(updated.snapshots[0].description).toBe('Test desc');
		});

		it('should throw error if snapshot not found', () => {
			const timeline = TimelineService.createInitialTimeline();

			expect(() => {
				TimelineService.updateSnapshotMetadata(
					'invalid-id',
					{ timestamp: 'Q2 2025' },
					timeline
				);
			}).toThrow('Snapshot not found: invalid-id');
		});
	});

	describe('getCurrentSnapshot', () => {
		it('should return current snapshot', () => {
			const timeline = TimelineService.createInitialTimeline();

			const current = TimelineService.getCurrentSnapshot(timeline);

			expect(current.id).toBe(timeline.currentSnapshotId);
		});

		it('should throw error if current snapshot not found', () => {
			const timeline = TimelineService.createInitialTimeline();
			timeline.currentSnapshotId = 'invalid-id';

			expect(() => {
				TimelineService.getCurrentSnapshot(timeline);
			}).toThrow('Current snapshot not found: invalid-id');
		});
	});

	describe('isFirstSnapshot', () => {
		it('should return true for first snapshot', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const firstId = timeline.snapshotOrder[0];

			expect(TimelineService.isFirstSnapshot(firstId, timeline)).toBe(true);
		});

		it('should return false for non-first snapshot', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const secondId = timeline.snapshotOrder[1];

			expect(TimelineService.isFirstSnapshot(secondId, timeline)).toBe(false);
		});
	});

	describe('isLastSnapshot', () => {
		it('should return true for last snapshot', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const lastId = timeline.snapshotOrder[timeline.snapshotOrder.length - 1];

			expect(TimelineService.isLastSnapshot(lastId, timeline)).toBe(true);
		});

		it('should return false for non-last snapshot', () => {
			let timeline = TimelineService.createInitialTimeline();
			const result = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = result.timeline;

			const firstId = timeline.snapshotOrder[0];

			expect(TimelineService.isLastSnapshot(firstId, timeline)).toBe(false);
		});
	});

	describe('getSnapshotById', () => {
		it('should return snapshot by ID', () => {
			const timeline = TimelineService.createInitialTimeline();
			const snapshotId = timeline.snapshots[0].id;

			const snapshot = TimelineService.getSnapshotById(snapshotId, timeline);

			expect(snapshot).not.toBeNull();
			expect(snapshot?.id).toBe(snapshotId);
		});

		it('should return null if not found', () => {
			const timeline = TimelineService.createInitialTimeline();

			const snapshot = TimelineService.getSnapshotById('invalid-id', timeline);

			expect(snapshot).toBeNull();
		});
	});

	describe('getSnapshotsInOrder', () => {
		it('should return snapshots in order', () => {
			let timeline = TimelineService.createInitialTimeline();
			const r1 = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = r1.timeline;
			const r2 = TimelineService.createSnapshot([], [], [], { label: 'S3' }, timeline);
			timeline = r2.timeline;

			const ordered = TimelineService.getSnapshotsInOrder(timeline);

			expect(ordered).toHaveLength(3);
			expect(ordered[0].label).toBe('Current');
			expect(ordered[1].label).toBe('S2');
			expect(ordered[2].label).toBe('S3');
		});

		it('should respect custom ordering', () => {
			let timeline = TimelineService.createInitialTimeline();
			const r1 = TimelineService.createSnapshot([], [], [], { label: 'S2' }, timeline);
			timeline = r1.timeline;

			const [id1, id2] = timeline.snapshotOrder;

			// Reverse order
			timeline = TimelineService.reorderSnapshots([id2, id1], timeline);

			const ordered = TimelineService.getSnapshotsInOrder(timeline);

			expect(ordered[0].label).toBe('S2');
			expect(ordered[1].label).toBe('Current');
		});
	});
});
