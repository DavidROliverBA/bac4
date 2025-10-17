/**
 * ChangeDetectionService - Change detection between snapshots
 *
 * Handles comparison of timeline snapshots to identify changes (added, modified, removed).
 * Applies change indicators to nodes and edges for visual feedback.
 *
 * @version 1.0.0
 * @see docs/v1.0.0-timeline-tracking-spec.md
 */

import { Node, Edge } from 'reactflow';
import {
	ChangeSet,
	ChangeIndicator,
	NodeDataWithTimeline,
	EdgeDataWithTimeline,
	TimelineSnapshot,
} from '../types/timeline';

/**
 * Service for detecting changes between snapshots
 */
export class ChangeDetectionService {
	/**
	 * Compare two snapshots to generate a ChangeSet
	 *
	 * Identifies which nodes and edges were added, modified, or removed
	 * between the "before" snapshot and "after" snapshot.
	 *
	 * @param beforeSnapshot - Earlier snapshot (baseline)
	 * @param afterSnapshot - Later snapshot (comparison target)
	 * @returns ChangeSet with added/modified/removed items
	 *
	 * @example
	 * ```typescript
	 * const changes = ChangeDetectionService.compareSnapshots(snapshot1, snapshot2);
	 * console.log(`Added nodes: ${changes.addedNodes.length}`);
	 * console.log(`Modified nodes: ${changes.modifiedNodes.length}`);
	 * ```
	 */
	static compareSnapshots(
		beforeSnapshot: TimelineSnapshot,
		afterSnapshot: TimelineSnapshot
	): ChangeSet {
		const beforeNodeIds = new Set(beforeSnapshot.nodes.map((n) => n.id));
		const afterNodeIds = new Set(afterSnapshot.nodes.map((n) => n.id));

		const beforeEdgeIds = new Set(beforeSnapshot.edges.map((e) => e.id));
		const afterEdgeIds = new Set(afterSnapshot.edges.map((e) => e.id));

		// Nodes
		const addedNodes = afterSnapshot.nodes
			.filter((n) => !beforeNodeIds.has(n.id))
			.map((n) => n.id);

		const removedNodes = beforeSnapshot.nodes
			.filter((n) => !afterNodeIds.has(n.id))
			.map((n) => n.id);

		const modifiedNodes = this.detectModifiedNodes(
			beforeSnapshot.nodes,
			afterSnapshot.nodes
		);

		// Unchanged nodes = nodes that exist in both but weren't modified
		const unchangedNodes = afterSnapshot.nodes
			.filter((n) => beforeNodeIds.has(n.id) && !modifiedNodes.includes(n.id))
			.map((n) => n.id);

		// Edges
		const addedEdges = afterSnapshot.edges
			.filter((e) => !beforeEdgeIds.has(e.id))
			.map((e) => e.id);

		const removedEdges = beforeSnapshot.edges
			.filter((e) => !afterEdgeIds.has(e.id))
			.map((e) => e.id);

		// Unchanged edges = edges that exist in both snapshots
		const unchangedEdges = afterSnapshot.edges
			.filter((e) => beforeEdgeIds.has(e.id))
			.map((e) => e.id);

		const changeSet: ChangeSet = {
			addedNodes,
			modifiedNodes,
			removedNodes,
			unchangedNodes,
			addedEdges,
			removedEdges,
			unchangedEdges,
		};

		console.log(
			`BAC4: Detected changes - Added: ${addedNodes.length} nodes, ${addedEdges.length} edges | ` +
				`Modified: ${modifiedNodes.length} nodes | ` +
				`Removed: ${removedNodes.length} nodes, ${removedEdges.length} edges | ` +
				`Unchanged: ${unchangedNodes.length} nodes, ${unchangedEdges.length} edges`
		);

		return changeSet;
	}

	/**
	 * Detect modified nodes by comparing properties
	 *
	 * A node is considered "modified" if:
	 * - Label changed
	 * - Color changed
	 *
	 * NOTE: Position changes are tracked but NOT considered modifications
	 * (user doesn't want position changes highlighted)
	 *
	 * @param beforeNodes - Nodes from earlier snapshot
	 * @param afterNodes - Nodes from later snapshot
	 * @returns Array of modified node IDs
	 */
	private static detectModifiedNodes(beforeNodes: Node[], afterNodes: Node[]): string[] {
		const modifiedIds: string[] = [];

		const beforeMap = new Map(beforeNodes.map((n) => [n.id, n]));

		for (const afterNode of afterNodes) {
			const beforeNode = beforeMap.get(afterNode.id);

			if (!beforeNode) {
				// Not in before snapshot = added node, not modified
				continue;
			}

			// Check for changes (excluding position)
			const labelChanged = beforeNode.data?.label !== afterNode.data?.label;
			const colorChanged = beforeNode.data?.color !== afterNode.data?.color;
			// Position is still saved in snapshots but not considered a "modification"

			if (labelChanged || colorChanged) {
				modifiedIds.push(afterNode.id);
			}
		}

		return modifiedIds;
	}

	/**
	 * Check if node position changed significantly
	 *
	 * Ignores minor position adjustments (<50px) to avoid false positives
	 * from canvas panning or slight repositioning.
	 *
	 * @param before - Position in earlier snapshot
	 * @param after - Position in later snapshot
	 * @returns True if position changed by more than 50px in any direction
	 */
	private static hasPositionChangedSignificantly(
		before: { x: number; y: number },
		after: { x: number; y: number }
	): boolean {
		const POSITION_THRESHOLD = 50; // pixels
		const deltaX = Math.abs(after.x - before.x);
		const deltaY = Math.abs(after.y - before.y);

		return deltaX > POSITION_THRESHOLD || deltaY > POSITION_THRESHOLD;
	}

	/**
	 * Apply change indicators to nodes
	 *
	 * Adds visual change indicators (green, yellow, red badges) to nodes
	 * based on the provided ChangeSet.
	 *
	 * @param nodes - Current nodes
	 * @param changeSet - Changes detected from comparison
	 * @returns Updated nodes with change indicators
	 *
	 * @example
	 * ```typescript
	 * const changes = ChangeDetectionService.compareSnapshots(before, after);
	 * const updatedNodes = ChangeDetectionService.applyNodeChangeIndicators(
	 *   afterSnapshot.nodes,
	 *   changes
	 * );
	 * ```
	 */
	static applyNodeChangeIndicators(nodes: Node[], changeSet: ChangeSet): Node[] {
		return nodes.map((node) => {
			let changeIndicator: ChangeIndicator = null;

			if (changeSet.addedNodes.includes(node.id)) {
				changeIndicator = 'new';
			} else if (changeSet.modifiedNodes.includes(node.id)) {
				changeIndicator = 'modified';
			} else if (changeSet.removedNodes.includes(node.id)) {
				changeIndicator = 'removed';
			}

			// Only update if change detected
			if (changeIndicator) {
				return {
					...node,
					data: {
						...node.data,
						changeIndicator,
					} as NodeDataWithTimeline,
				};
			}

			return node;
		});
	}

	/**
	 * Apply change indicators to edges
	 *
	 * Adds visual change indicators to edges based on the provided ChangeSet.
	 *
	 * @param edges - Current edges
	 * @param changeSet - Changes detected from comparison
	 * @returns Updated edges with change indicators
	 */
	static applyEdgeChangeIndicators(edges: Edge[], changeSet: ChangeSet): Edge[] {
		return edges.map((edge) => {
			let changeIndicator: ChangeIndicator = null;

			if (changeSet.addedEdges.includes(edge.id)) {
				changeIndicator = 'new';
			} else if (changeSet.removedEdges.includes(edge.id)) {
				changeIndicator = 'removed';
			}

			// Only update if change detected
			if (changeIndicator) {
				return {
					...edge,
					data: {
						...edge.data,
						changeIndicator,
					} as EdgeDataWithTimeline,
				};
			}

			return edge;
		});
	}

	/**
	 * Generate human-readable change summary
	 *
	 * Creates a text summary of changes between two snapshots,
	 * useful for ADR generation or user feedback.
	 *
	 * @param changeSet - Changes detected from comparison
	 * @param beforeSnapshot - Earlier snapshot (for context)
	 * @param afterSnapshot - Later snapshot (for context)
	 * @returns Formatted change summary text
	 *
	 * @example
	 * ```typescript
	 * const summary = ChangeDetectionService.generateChangeSummary(
	 *   changes,
	 *   snapshot1,
	 *   snapshot2
	 * );
	 * console.log(summary);
	 * // Output:
	 * // "Changes from 'Before' to 'After':
	 * //  - Added 2 nodes
	 * //  - Modified 1 node
	 * //  - Added 3 edges"
	 * ```
	 */
	static generateChangeSummary(
		changeSet: ChangeSet,
		beforeSnapshot: TimelineSnapshot,
		afterSnapshot: TimelineSnapshot
	): string {
		const lines: string[] = [];

		lines.push(`Changes from "${beforeSnapshot.label}" to "${afterSnapshot.label}":`);
		lines.push('');

		// Node changes
		if (changeSet.addedNodes.length > 0) {
			lines.push(`- Added ${changeSet.addedNodes.length} node(s)`);
		}
		if (changeSet.modifiedNodes.length > 0) {
			lines.push(`- Modified ${changeSet.modifiedNodes.length} node(s)`);
		}
		if (changeSet.removedNodes.length > 0) {
			lines.push(`- Removed ${changeSet.removedNodes.length} node(s)`);
		}

		// Edge changes
		if (changeSet.addedEdges.length > 0) {
			lines.push(`- Added ${changeSet.addedEdges.length} edge(s)`);
		}
		if (changeSet.removedEdges.length > 0) {
			lines.push(`- Removed ${changeSet.removedEdges.length} edge(s)`);
		}

		// No changes
		if (
			changeSet.addedNodes.length === 0 &&
			changeSet.modifiedNodes.length === 0 &&
			changeSet.removedNodes.length === 0 &&
			changeSet.addedEdges.length === 0 &&
			changeSet.removedEdges.length === 0
		) {
			lines.push('- No changes detected');
		}

		return lines.join('\n');
	}

	/**
	 * Generate detailed change summary with node/edge names
	 *
	 * Creates a more detailed summary that includes the actual node labels
	 * and edge descriptions.
	 *
	 * @param changeSet - Changes detected from comparison
	 * @param beforeSnapshot - Earlier snapshot
	 * @param afterSnapshot - Later snapshot
	 * @returns Detailed formatted change summary
	 *
	 * @example
	 * ```typescript
	 * const summary = ChangeDetectionService.generateDetailedChangeSummary(
	 *   changes,
	 *   snapshot1,
	 *   snapshot2
	 * );
	 * // Output includes node names like "Payment System", "User Database", etc.
	 * ```
	 */
	static generateDetailedChangeSummary(
		changeSet: ChangeSet,
		beforeSnapshot: TimelineSnapshot,
		afterSnapshot: TimelineSnapshot
	): string {
		const lines: string[] = [];

		lines.push(`Detailed changes from "${beforeSnapshot.label}" to "${afterSnapshot.label}":`);
		lines.push('');

		// Added nodes
		if (changeSet.addedNodes.length > 0) {
			lines.push('**Added Nodes:**');
			for (const nodeId of changeSet.addedNodes) {
				const node = afterSnapshot.nodes.find((n) => n.id === nodeId);
				if (node) {
					lines.push(`- ${node.data?.label || nodeId}`);
				}
			}
			lines.push('');
		}

		// Modified nodes
		if (changeSet.modifiedNodes.length > 0) {
			lines.push('**Modified Nodes:**');
			for (const nodeId of changeSet.modifiedNodes) {
				const node = afterSnapshot.nodes.find((n) => n.id === nodeId);
				if (node) {
					lines.push(`- ${node.data?.label || nodeId}`);
				}
			}
			lines.push('');
		}

		// Removed nodes
		if (changeSet.removedNodes.length > 0) {
			lines.push('**Removed Nodes:**');
			for (const nodeId of changeSet.removedNodes) {
				const node = beforeSnapshot.nodes.find((n) => n.id === nodeId);
				if (node) {
					lines.push(`- ${node.data?.label || nodeId}`);
				}
			}
			lines.push('');
		}

		// Added edges
		if (changeSet.addedEdges.length > 0) {
			lines.push('**Added Relationships:**');
			for (const edgeId of changeSet.addedEdges) {
				const edge = afterSnapshot.edges.find((e) => e.id === edgeId);
				if (edge) {
					const sourceNode = afterSnapshot.nodes.find((n) => n.id === edge.source);
					const targetNode = afterSnapshot.nodes.find((n) => n.id === edge.target);
					const label = edge.data?.label || 'connected to';
					lines.push(
						`- ${sourceNode?.data?.label || edge.source} ${label} ${targetNode?.data?.label || edge.target}`
					);
				}
			}
			lines.push('');
		}

		// Removed edges
		if (changeSet.removedEdges.length > 0) {
			lines.push('**Removed Relationships:**');
			for (const edgeId of changeSet.removedEdges) {
				const edge = beforeSnapshot.edges.find((e) => e.id === edgeId);
				if (edge) {
					const sourceNode = beforeSnapshot.nodes.find((n) => n.id === edge.source);
					const targetNode = beforeSnapshot.nodes.find((n) => n.id === edge.target);
					const label = edge.data?.label || 'connected to';
					lines.push(
						`- ${sourceNode?.data?.label || edge.source} ${label} ${targetNode?.data?.label || edge.target}`
					);
				}
			}
			lines.push('');
		}

		// No changes
		if (
			changeSet.addedNodes.length === 0 &&
			changeSet.modifiedNodes.length === 0 &&
			changeSet.removedNodes.length === 0 &&
			changeSet.addedEdges.length === 0 &&
			changeSet.removedEdges.length === 0
		) {
			lines.push('No changes detected between snapshots.');
		}

		return lines.join('\n');
	}

	/**
	 * Clear change indicators from nodes
	 *
	 * Removes all change indicators from nodes. Useful when switching to
	 * a snapshot where you don't want to show change indicators.
	 *
	 * @param nodes - Nodes to clear indicators from
	 * @returns Nodes with change indicators removed
	 */
	static clearNodeChangeIndicators(nodes: Node[]): Node[] {
		return nodes.map((node) => ({
			...node,
			data: {
				...node.data,
				changeIndicator: null,
				changeNote: undefined,
			} as NodeDataWithTimeline,
		}));
	}

	/**
	 * Clear change indicators from edges
	 *
	 * Removes all change indicators from edges.
	 *
	 * @param edges - Edges to clear indicators from
	 * @returns Edges with change indicators removed
	 */
	static clearEdgeChangeIndicators(edges: Edge[]): Edge[] {
		return edges.map((edge) => ({
			...edge,
			data: {
				...edge.data,
				changeIndicator: null,
			} as EdgeDataWithTimeline,
		}));
	}

	/**
	 * Get nodes with specific change indicator
	 *
	 * Filters nodes to only those with a specific change type.
	 *
	 * @param nodes - All nodes
	 * @param indicator - Change indicator to filter by
	 * @returns Filtered nodes
	 *
	 * @example
	 * ```typescript
	 * // Get all new nodes
	 * const newNodes = ChangeDetectionService.getNodesWithIndicator(nodes, 'new');
	 * ```
	 */
	static getNodesWithIndicator(nodes: Node[], indicator: ChangeIndicator): Node[] {
		return nodes.filter(
			(node) => (node.data as NodeDataWithTimeline)?.changeIndicator === indicator
		);
	}

	/**
	 * Get edges with specific change indicator
	 *
	 * Filters edges to only those with a specific change type.
	 *
	 * @param edges - All edges
	 * @param indicator - Change indicator to filter by
	 * @returns Filtered edges
	 */
	static getEdgesWithIndicator(edges: Edge[], indicator: ChangeIndicator): Edge[] {
		return edges.filter(
			(edge) => (edge.data as EdgeDataWithTimeline)?.changeIndicator === indicator
		);
	}

	/**
	 * Count changes in ChangeSet
	 *
	 * Returns total count of all changes.
	 *
	 * @param changeSet - Changes to count
	 * @returns Total number of changes
	 */
	static countChanges(changeSet: ChangeSet): number {
		return (
			changeSet.addedNodes.length +
			changeSet.modifiedNodes.length +
			changeSet.removedNodes.length +
			changeSet.addedEdges.length +
			changeSet.removedEdges.length
		);
	}

	/**
	 * Check if any changes exist
	 *
	 * Quick check for whether there are any changes between snapshots.
	 *
	 * @param changeSet - Changes to check
	 * @returns True if any changes detected
	 */
	static hasChanges(changeSet: ChangeSet): boolean {
		return this.countChanges(changeSet) > 0;
	}

	/**
	 * Manually set change indicator on node
	 *
	 * Allows user to manually override automatic change detection.
	 *
	 * @param node - Node to update
	 * @param indicator - Change indicator to set (or null to clear)
	 * @param changeNote - Optional note explaining the change
	 * @returns Updated node
	 */
	static setNodeChangeIndicator(
		node: Node,
		indicator: ChangeIndicator,
		changeNote?: string
	): Node {
		return {
			...node,
			data: {
				...node.data,
				changeIndicator: indicator,
				changeNote: changeNote || undefined,
			} as NodeDataWithTimeline,
		};
	}

	/**
	 * Manually set change indicator on edge
	 *
	 * Allows user to manually override automatic change detection for edges.
	 *
	 * @param edge - Edge to update
	 * @param indicator - Change indicator to set (or null to clear)
	 * @returns Updated edge
	 */
	static setEdgeChangeIndicator(edge: Edge, indicator: ChangeIndicator): Edge {
		return {
			...edge,
			data: {
				...edge.data,
				changeIndicator: indicator,
			} as EdgeDataWithTimeline,
		};
	}
}
