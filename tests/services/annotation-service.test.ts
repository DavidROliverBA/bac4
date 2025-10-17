/**
 * Tests for AnnotationService
 */

import { AnnotationService } from '../../src/services/AnnotationService';
import {
	Annotation,
	CreateAnnotationOptions,
	BADGE_COLORS,
	DEFAULT_ANNOTATION_PROPERTIES,
} from '../../src/types/timeline';

// Mock console.log/warn to avoid noise in test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('AnnotationService', () => {
	beforeEach(() => {
		consoleLogSpy.mockClear();
		consoleWarnSpy.mockClear();
		jest.clearAllMocks();
	});

	describe('createAnnotation', () => {
		it('should create text-box annotation with defaults', () => {
			const options: CreateAnnotationOptions = {
				type: 'text-box',
				position: { x: 100, y: 100 },
				snapshotId: 'snapshot-1',
			};

			const annotation = AnnotationService.createAnnotation(options);

			expect(annotation.type).toBe('text-box');
			expect(annotation.position).toEqual({ x: 100, y: 100 });
			expect(annotation.data.text).toBe('Add note here...');
			expect(annotation.data.color).toBe('#4A90E2');
			expect(annotation.data.fontSize).toBe(12);
			expect(annotation.id).toMatch(/^annotation-/);
		});

		it('should create callout annotation with defaults', () => {
			const options: CreateAnnotationOptions = {
				type: 'callout',
				position: { x: 200, y: 200 },
				snapshotId: 'snapshot-1',
			};

			const annotation = AnnotationService.createAnnotation(options);

			expect(annotation.type).toBe('callout');
			expect(annotation.data.text).toBe('Add explanation here...');
			expect(annotation.data.fontSize).toBe(11);
		});

		it('should create badge-new annotation with defaults', () => {
			const options: CreateAnnotationOptions = {
				type: 'badge-new',
				position: { x: 300, y: 300 },
				snapshotId: 'snapshot-1',
			};

			const annotation = AnnotationService.createAnnotation(options);

			expect(annotation.type).toBe('badge-new');
			expect(annotation.data.text).toBe('New');
			expect(annotation.data.color).toBe(BADGE_COLORS.new);
			expect(annotation.data.fontSize).toBe(10);
		});

		it('should create badge-modified annotation with defaults', () => {
			const annotation = AnnotationService.createAnnotation({
				type: 'badge-modified',
				position: { x: 0, y: 0 },
				snapshotId: 'snapshot-1',
			});

			expect(annotation.data.text).toBe('Modified');
			expect(annotation.data.color).toBe(BADGE_COLORS.modified);
		});

		it('should create badge-deprecated annotation with defaults', () => {
			const annotation = AnnotationService.createAnnotation({
				type: 'badge-deprecated',
				position: { x: 0, y: 0 },
				snapshotId: 'snapshot-1',
			});

			expect(annotation.data.text).toBe('Deprecated');
			expect(annotation.data.color).toBe(BADGE_COLORS.deprecated);
		});

		it('should create badge-remove annotation with defaults', () => {
			const annotation = AnnotationService.createAnnotation({
				type: 'badge-remove',
				position: { x: 0, y: 0 },
				snapshotId: 'snapshot-1',
			});

			expect(annotation.data.text).toBe('To Remove');
			expect(annotation.data.color).toBe(BADGE_COLORS.remove);
		});

		it('should create highlight-circle annotation with defaults', () => {
			const annotation = AnnotationService.createAnnotation({
				type: 'highlight-circle',
				position: { x: 0, y: 0 },
				snapshotId: 'snapshot-1',
			});

			expect(annotation.data.color).toBe('#FFD93D');
			expect(annotation.data.width).toBe(150);
			expect(annotation.data.height).toBe(150);
		});

		it('should create highlight-rect annotation with defaults', () => {
			const annotation = AnnotationService.createAnnotation({
				type: 'highlight-rect',
				position: { x: 0, y: 0 },
				snapshotId: 'snapshot-1',
			});

			expect(annotation.data.color).toBe('#FFD93D');
			expect(annotation.data.width).toBe(200);
			expect(annotation.data.height).toBe(100);
		});

		it('should override defaults with custom properties', () => {
			const options: CreateAnnotationOptions = {
				type: 'text-box',
				position: { x: 100, y: 100 },
				snapshotId: 'snapshot-1',
				properties: {
					text: 'Custom text',
					color: '#FF0000',
					fontSize: 16,
				},
			};

			const annotation = AnnotationService.createAnnotation(options);

			expect(annotation.data.text).toBe('Custom text');
			expect(annotation.data.color).toBe('#FF0000');
			expect(annotation.data.fontSize).toBe(16);
		});
	});

	describe('updateAnnotation', () => {
		it('should update annotation properties', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 100 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, text: 'Original' },
			};

			const updated = AnnotationService.updateAnnotation(annotation, {
				text: 'Updated',
				color: '#00FF00',
			});

			expect(updated.data.text).toBe('Updated');
			expect(updated.data.color).toBe('#00FF00');
			expect(updated.id).toBe('annotation-1');
		});

		it('should not mutate original annotation', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 100 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, text: 'Original' },
			};

			AnnotationService.updateAnnotation(annotation, { text: 'Updated' });

			expect(annotation.data.text).toBe('Original');
		});
	});

	describe('moveAnnotation', () => {
		it('should move annotation to new position', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 100 },
				data: DEFAULT_ANNOTATION_PROPERTIES,
			};

			const moved = AnnotationService.moveAnnotation(annotation, { x: 200, y: 300 });

			expect(moved.position).toEqual({ x: 200, y: 300 });
			expect(moved.id).toBe('annotation-1');
		});

		it('should not mutate original annotation', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 100 },
				data: DEFAULT_ANNOTATION_PROPERTIES,
			};

			AnnotationService.moveAnnotation(annotation, { x: 200, y: 300 });

			expect(annotation.position).toEqual({ x: 100, y: 100 });
		});
	});

	describe('linkAnnotationToNode', () => {
		it('should link annotation to node', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'callout',
				position: { x: 100, y: 100 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: null },
			};

			const linked = AnnotationService.linkAnnotationToNode(annotation, 'node-123');

			expect(linked.data.linkedNodeId).toBe('node-123');
		});
	});

	describe('unlinkAnnotationFromNode', () => {
		it('should unlink annotation from node', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'callout',
				position: { x: 100, y: 100 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-123' },
			};

			const unlinked = AnnotationService.unlinkAnnotationFromNode(annotation);

			expect(unlinked.data.linkedNodeId).toBeNull();
		});
	});

	describe('deleteAnnotation', () => {
		it('should delete annotation by ID', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
				{
					id: 'annotation-2',
					type: 'callout',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
			];

			const updated = AnnotationService.deleteAnnotation('annotation-1', annotations);

			expect(updated).toHaveLength(1);
			expect(updated[0].id).toBe('annotation-2');
		});

		it('should return same array if ID not found', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
			];

			const updated = AnnotationService.deleteAnnotation('invalid-id', annotations);

			expect(updated).toHaveLength(1);
		});
	});

	describe('getAnnotationById', () => {
		it('should find annotation by ID', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
			];

			const found = AnnotationService.getAnnotationById('annotation-1', annotations);

			expect(found).not.toBeNull();
			expect(found?.id).toBe('annotation-1');
		});

		it('should return null if not found', () => {
			const annotations: Annotation[] = [];

			const found = AnnotationService.getAnnotationById('invalid-id', annotations);

			expect(found).toBeNull();
		});
	});

	describe('getAnnotationsForNode', () => {
		it('should return annotations linked to node', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'callout',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-1' },
				},
				{
					id: 'annotation-2',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: null },
				},
				{
					id: 'annotation-3',
					type: 'badge-new',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-1' },
				},
			];

			const nodeAnnotations = AnnotationService.getAnnotationsForNode('node-1', annotations);

			expect(nodeAnnotations).toHaveLength(2);
			expect(nodeAnnotations[0].id).toBe('annotation-1');
			expect(nodeAnnotations[1].id).toBe('annotation-3');
		});

		it('should return empty array if no annotations linked', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: null },
				},
			];

			const nodeAnnotations = AnnotationService.getAnnotationsForNode('node-1', annotations);

			expect(nodeAnnotations).toHaveLength(0);
		});
	});

	describe('updateLinkedAnnotationPositions', () => {
		it('should move annotations linked to node', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'callout',
					position: { x: 100, y: 100 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-1' },
				},
				{
					id: 'annotation-2',
					type: 'text-box',
					position: { x: 200, y: 200 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: null },
				},
			];

			const updated = AnnotationService.updateLinkedAnnotationPositions(
				'node-1',
				50,
				-30,
				annotations
			);

			expect(updated[0].position).toEqual({ x: 150, y: 70 });
			expect(updated[1].position).toEqual({ x: 200, y: 200 }); // Unlinked, unchanged
		});

		it('should not mutate original annotations', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'callout',
					position: { x: 100, y: 100 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-1' },
				},
			];

			AnnotationService.updateLinkedAnnotationPositions('node-1', 50, 50, annotations);

			expect(annotations[0].position).toEqual({ x: 100, y: 100 });
		});
	});

	describe('validateAnnotationProperties', () => {
		it('should validate valid properties', () => {
			const valid = AnnotationService.validateAnnotationProperties({
				color: '#FF0000',
				fontSize: 14,
				width: 200,
				height: 100,
			});

			expect(valid).toBe(true);
		});

		it('should reject invalid color format', () => {
			const invalid = AnnotationService.validateAnnotationProperties({
				color: 'red',
			});

			expect(invalid).toBe(false);
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid color format')
			);
		});

		it('should reject negative font size', () => {
			const invalid = AnnotationService.validateAnnotationProperties({
				fontSize: -5,
			});

			expect(invalid).toBe(false);
		});

		it('should reject zero font size', () => {
			const invalid = AnnotationService.validateAnnotationProperties({
				fontSize: 0,
			});

			expect(invalid).toBe(false);
		});

		it('should reject negative width', () => {
			const invalid = AnnotationService.validateAnnotationProperties({
				width: -100,
			});

			expect(invalid).toBe(false);
		});

		it('should reject negative height', () => {
			const invalid = AnnotationService.validateAnnotationProperties({
				height: -50,
			});

			expect(invalid).toBe(false);
		});
	});

	describe('cloneAnnotation', () => {
		it('should clone annotation with offset', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 100 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, text: 'Original' },
			};

			const clone = AnnotationService.cloneAnnotation(annotation, 20, 30);

			expect(clone.id).not.toBe('annotation-1');
			expect(clone.position).toEqual({ x: 120, y: 130 });
			expect(clone.data.text).toBe('Original');
		});

		it('should use default offset if not provided', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 100 },
				data: DEFAULT_ANNOTATION_PROPERTIES,
			};

			const clone = AnnotationService.cloneAnnotation(annotation);

			expect(clone.position).toEqual({ x: 120, y: 120 }); // Default +20, +20
		});
	});

	describe('getAnnotationSummary', () => {
		it('should generate summary for annotation', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'text-box',
				position: { x: 100, y: 200 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, text: 'Test note' },
			};

			const summary = AnnotationService.getAnnotationSummary(annotation);

			expect(summary).toContain('text-box');
			expect(summary).toContain('(100, 200)');
			expect(summary).toContain('Test note');
		});

		it('should include linked node ID in summary', () => {
			const annotation: Annotation = {
				id: 'annotation-1',
				type: 'callout',
				position: { x: 0, y: 0 },
				data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-123' },
			};

			const summary = AnnotationService.getAnnotationSummary(annotation);

			expect(summary).toContain('linked to node-123');
		});
	});

	describe('bulkCreateAnnotations', () => {
		it('should create multiple annotations', () => {
			const optionsList: CreateAnnotationOptions[] = [
				{ type: 'text-box', position: { x: 0, y: 0 }, snapshotId: 's1' },
				{ type: 'callout', position: { x: 100, y: 100 }, snapshotId: 's1' },
				{ type: 'badge-new', position: { x: 200, y: 200 }, snapshotId: 's1' },
			];

			const annotations = AnnotationService.bulkCreateAnnotations(optionsList);

			expect(annotations).toHaveLength(3);
			expect(annotations[0].type).toBe('text-box');
			expect(annotations[1].type).toBe('callout');
			expect(annotations[2].type).toBe('badge-new');
		});
	});

	describe('bulkDeleteAnnotations', () => {
		it('should delete multiple annotations', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
				{
					id: 'annotation-2',
					type: 'callout',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
				{
					id: 'annotation-3',
					type: 'badge-new',
					position: { x: 0, y: 0 },
					data: DEFAULT_ANNOTATION_PROPERTIES,
				},
			];

			const updated = AnnotationService.bulkDeleteAnnotations(
				['annotation-1', 'annotation-3'],
				annotations
			);

			expect(updated).toHaveLength(1);
			expect(updated[0].id).toBe('annotation-2');
		});
	});

	describe('clearNodeAnnotations', () => {
		it('should clear all annotations for node', () => {
			const annotations: Annotation[] = [
				{
					id: 'annotation-1',
					type: 'callout',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-1' },
				},
				{
					id: 'annotation-2',
					type: 'text-box',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: null },
				},
				{
					id: 'annotation-3',
					type: 'badge-new',
					position: { x: 0, y: 0 },
					data: { ...DEFAULT_ANNOTATION_PROPERTIES, linkedNodeId: 'node-1' },
				},
			];

			const updated = AnnotationService.clearNodeAnnotations('node-1', annotations);

			expect(updated).toHaveLength(1);
			expect(updated[0].id).toBe('annotation-2');
		});
	});
});
