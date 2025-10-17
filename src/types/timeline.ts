/**
 * Timeline and Annotation Type Definitions for BAC4 v1.0.0
 *
 * This file defines the complete data model for timeline-based architecture
 * evolution tracking, including snapshots, annotations, and change detection.
 *
 * @version 1.0.0
 * @see docs/v1.0.0-timeline-tracking-spec.md
 */

import { Node, Edge, XYPosition } from 'reactflow';

// ============================================================================
// Annotation Types
// ============================================================================

/**
 * Types of annotations that can be added to diagrams
 */
export type AnnotationType =
	| 'sticky-note'      // Sticky note annotation (yellow note)
	| 'text-box'         // Free-form text annotation
	| 'rectangle'        // Rectangle shape
	| 'circle'           // Circle shape
	| 'arrow'            // Arrow annotation
	| 'callout'          // Arrow pointing to node with explanation
	| 'badge-new'        // "New" badge
	| 'badge-modified'   // "Modified" badge
	| 'badge-deprecated' // "Deprecated" badge
	| 'badge-remove'     // "To Remove" badge
	| 'highlight-circle' // Circular highlight
	| 'highlight-rect';  // Rectangular highlight

/**
 * Properties for an annotation
 */
export interface AnnotationProperties {
	/** Annotation text content */
	text: string;
	/** Color (hex code) */
	color: string;
	/** Font size (for text annotations) */
	fontSize?: number;
	/** Bold text formatting */
	bold?: boolean;
	/** Underline text formatting */
	underline?: boolean;
	/** Width (for highlights) */
	width?: number;
	/** Height (for highlights) */
	height?: number;
	/** Node ID this annotation is linked to (follows node movement) */
	linkedNodeId: string | null;
}

/**
 * Complete annotation object
 */
export interface Annotation {
	/** Unique annotation ID */
	id: string;
	/** Type of annotation */
	type: AnnotationType;
	/** Position on canvas */
	position: XYPosition;
	/** Annotation properties */
	data: AnnotationProperties;
}

// ============================================================================
// Timeline Snapshot Types
// ============================================================================

/**
 * A single timeline snapshot representing the diagram at a specific point in time
 */
export interface TimelineSnapshot {
	/** Unique snapshot ID */
	id: string;
	/** Human-readable label (e.g., "Before - Monolithic", "Q2 2025") */
	label: string;
	/** Optional timestamp (ISO 8601 string or relative like "Q2 2025") */
	timestamp: string | null;
	/** Optional description explaining this snapshot */
	description: string;
	/** When this snapshot was created (ISO 8601) */
	createdAt: string;
	/** Optional link to Architecture Decision Record (ADR) markdown file */
	adrPath?: string | null;
	/** Nodes in this snapshot */
	nodes: Node[];
	/** Edges in this snapshot */
	edges: Edge[];
	/** Annotations specific to this snapshot */
	annotations: Annotation[];
}

/**
 * Complete timeline structure containing all snapshots
 */
export interface Timeline {
	/** All snapshots in this timeline */
	snapshots: TimelineSnapshot[];
	/** ID of the currently active snapshot */
	currentSnapshotId: string;
	/** Order of snapshots (allows user reordering) */
	snapshotOrder: string[];
}

// ============================================================================
// Change Detection Types
// ============================================================================

/**
 * Change indicator for nodes/edges
 */
export type ChangeIndicator = 'new' | 'modified' | 'removed' | null;

/**
 * Set of changes between two snapshots
 */
export interface ChangeSet {
	/** Node IDs that were added */
	addedNodes: string[];
	/** Node IDs that were modified (label, color, etc changed - not position) */
	modifiedNodes: string[];
	/** Node IDs that were removed */
	removedNodes: string[];
	/** Node IDs that were unchanged */
	unchangedNodes: string[];
	/** Edge IDs that were added */
	addedEdges: string[];
	/** Edge IDs that were removed */
	removedEdges: string[];
	/** Edge IDs that were unchanged */
	unchangedEdges: string[];
}

// ============================================================================
// Node/Edge Data Extensions
// ============================================================================

/**
 * Extension to Node data for timeline features
 */
export interface NodeDataWithTimeline {
	/** Standard node data fields */
	label: string;
	color?: string;
	description?: string;
	linkedDiagramPath?: string | null;
	linkedMarkdownPath?: string | null;

	/** Timeline-specific fields */
	changeIndicator?: ChangeIndicator;
	changeNote?: string;
	adrLink?: string | null;
}

/**
 * Extension to Edge data for timeline features
 */
export interface EdgeDataWithTimeline {
	/** Standard edge data fields */
	label: string;
	direction: 'left' | 'right' | 'both';

	/** Timeline-specific fields */
	changeIndicator?: ChangeIndicator;
}

// ============================================================================
// File Format (v1.0.0)
// ============================================================================

/**
 * File metadata
 */
export interface BAC4Metadata {
	/** Diagram type */
	diagramType: 'context' | 'container' | 'component';
	/** When diagram was created (ISO 8601) */
	createdAt: string;
	/** Last update timestamp (ISO 8601) */
	updatedAt: string;
}

/**
 * Complete BAC4 v1.0.0 file format
 *
 * This is the only file format supported in v1.0.0 (no backward compatibility)
 */
export interface BAC4FileV1 {
	/** File format version */
	version: '1.0.0';
	/** Diagram metadata */
	metadata: BAC4Metadata;
	/** Timeline data (always present in v1.0.0) */
	timeline: Timeline;
}

// ============================================================================
// Service Method Types
// ============================================================================

/**
 * Options for creating a new snapshot
 */
export interface CreateSnapshotOptions {
	/** Snapshot label (required) */
	label: string;
	/** Optional timestamp */
	timestamp?: string;
	/** Optional description */
	description?: string;
}

/**
 * Result of creating a snapshot
 */
export interface CreateSnapshotResult {
	/** The newly created snapshot */
	snapshot: TimelineSnapshot;
	/** Updated timeline with new snapshot */
	timeline: Timeline;
}

/**
 * Result of switching snapshots
 */
export interface SwitchSnapshotResult {
	/** Nodes for the selected snapshot */
	nodes: Node[];
	/** Edges for the selected snapshot */
	edges: Edge[];
	/** Annotations for the selected snapshot */
	annotations: Annotation[];
}

/**
 * Options for creating an annotation
 */
export interface CreateAnnotationOptions {
	/** Annotation type */
	type: AnnotationType;
	/** Position on canvas */
	position: XYPosition;
	/** Snapshot ID this annotation belongs to */
	snapshotId: string;
	/** Optional initial properties */
	properties?: Partial<AnnotationProperties>;
}

/**
 * Options for updating an annotation
 */
export interface UpdateAnnotationOptions {
	/** Annotation ID */
	annotationId: string;
	/** Properties to update */
	updates: Partial<AnnotationProperties>;
}

// ============================================================================
// ADR Integration Types
// ============================================================================

/**
 * Options for creating an ADR from a diagram
 */
export interface CreateADROptions {
	/** Path where ADR should be created */
	adrPath: string;
	/** ADR title */
	title: string;
	/** Path to the diagram file */
	diagramPath: string;
	/** "Before" snapshot ID */
	beforeSnapshotId: string;
	/** "After" snapshot ID */
	afterSnapshotId: string;
}

/**
 * Result of exporting diagrams for ADR
 */
export interface ADRExportResult {
	/** Path to "Before" image */
	beforeImage: string;
	/** Path to "After" image */
	afterImage: string;
	/** Change summary text */
	changeSummary: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard to check if a node has timeline data
 */
export function isNodeWithTimeline(node: Node): node is Node<NodeDataWithTimeline> {
	return node.data !== undefined;
}

/**
 * Type guard to check if an edge has timeline data
 */
export function isEdgeWithTimeline(edge: Edge): edge is Edge<EdgeDataWithTimeline> {
	return edge.data !== undefined;
}

/**
 * Type guard to check if a value is a valid AnnotationType
 */
export function isAnnotationType(value: unknown): value is AnnotationType {
	const validTypes: AnnotationType[] = [
		'text-box',
		'callout',
		'badge-new',
		'badge-modified',
		'badge-deprecated',
		'badge-remove',
		'highlight-circle',
		'highlight-rect',
	];
	return typeof value === 'string' && validTypes.includes(value as AnnotationType);
}

/**
 * Type guard to check if a value is a valid ChangeIndicator
 */
export function isChangeIndicator(value: unknown): value is ChangeIndicator {
	return value === 'new' || value === 'modified' || value === 'removed' || value === null;
}

/**
 * Type guard to check if a file is v1.0.0 format
 */
export function isBAC4FileV1(data: unknown): data is BAC4FileV1 {
	if (typeof data !== 'object' || data === null) return false;
	const file = data as Record<string, unknown>;
	return (
		file.version === '1.0.0' &&
		typeof file.metadata === 'object' &&
		typeof file.timeline === 'object' &&
		Array.isArray((file.timeline as Record<string, unknown>).snapshots) &&
		typeof (file.timeline as Record<string, unknown>).currentSnapshotId === 'string' &&
		Array.isArray((file.timeline as Record<string, unknown>).snapshotOrder)
	);
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default annotation properties
 */
export const DEFAULT_ANNOTATION_PROPERTIES: AnnotationProperties = {
	text: '',
	color: '#4A90E2',
	fontSize: 12,
	linkedNodeId: null,
};

/**
 * Default badge colors
 */
export const BADGE_COLORS = {
	new: '#51CF66',        // Green
	modified: '#FFD93D',   // Yellow
	deprecated: '#FF6B6B', // Red
	remove: '#FF6B6B',     // Red
} as const;

/**
 * Maximum number of snapshots per diagram
 */
export const MAX_SNAPSHOTS = 10;

/**
 * Default snapshot label for new diagrams
 */
export const DEFAULT_SNAPSHOT_LABEL = 'Current';
