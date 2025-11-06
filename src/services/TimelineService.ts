/**
 * TimelineService - Timeline snapshot management
 *
 * Handles creation, deletion, switching, and management of timeline snapshots.
 * Each snapshot represents the diagram state at a specific point in time.
 *
 * @version 1.0.0
 * @see docs/v1.0.0-timeline-tracking-spec.md
 */

import { Node, Edge } from 'reactflow';
import {
  Timeline,
  TimelineSnapshot,
  Annotation,
  CreateSnapshotOptions,
  CreateSnapshotResult,
  SwitchSnapshotResult,
  DEFAULT_SNAPSHOT_LABEL,
  MAX_SNAPSHOTS,
} from '../types/timeline';

/**
 * Service for managing timeline snapshots
 */
export class TimelineService {
  /**
   * Generate a unique snapshot ID
   */
  private static generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new snapshot from current canvas state
   *
   * @param nodes - Current nodes on canvas
   * @param edges - Current edges on canvas
   * @param annotations - Current annotations on canvas
   * @param options - Snapshot options (label, timestamp, description)
   * @param currentTimeline - Existing timeline to add snapshot to
   * @returns Object with new snapshot and updated timeline
   * @throws Error if maximum snapshots reached
   */
  static createSnapshot(
    nodes: Node[],
    edges: Edge[],
    annotations: Annotation[],
    options: CreateSnapshotOptions,
    currentTimeline: Timeline
  ): CreateSnapshotResult {
    // Check max snapshots limit
    if (currentTimeline.snapshots.length >= MAX_SNAPSHOTS) {
      throw new Error(`Cannot create snapshot: Maximum of ${MAX_SNAPSHOTS} snapshots per diagram`);
    }

    // Generate new snapshot
    const snapshot: TimelineSnapshot = {
      id: this.generateSnapshotId(),
      label: options.label,
      timestamp: options.timestamp || null,
      description: options.description || '',
      createdAt: new Date().toISOString(),
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
      edges: JSON.parse(JSON.stringify(edges)), // Deep copy
      annotations: JSON.parse(JSON.stringify(annotations)), // Deep copy
    };

    // ✅ v2.5.1 FIX: AUTO-SWITCH to new snapshot (approved spec behavior)
    // User creates snapshot and immediately sees it
    const updatedTimeline: Timeline = {
      snapshots: [...currentTimeline.snapshots, snapshot],
      currentSnapshotId: snapshot.id, // ✅ Auto-switch to new snapshot
      snapshotOrder: [...currentTimeline.snapshotOrder, snapshot.id],
    };

    console.log(`BAC4: Created snapshot "${snapshot.label}" (${snapshot.id})`);

    return {
      snapshot,
      timeline: updatedTimeline,
    };
  }

  /**
   * Switch to a different snapshot
   *
   * @param snapshotId - ID of snapshot to switch to
   * @param timeline - Current timeline
   * @returns Nodes, edges, and annotations for the selected snapshot
   * @throws Error if snapshot not found
   */
  static switchSnapshot(snapshotId: string, timeline: Timeline): SwitchSnapshotResult {
    const snapshot = timeline.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    console.log(`BAC4: Switched to snapshot "${snapshot.label}" (${snapshot.id})`);

    // Return deep copies to prevent mutations
    return {
      nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
      edges: JSON.parse(JSON.stringify(snapshot.edges)),
      annotations: JSON.parse(JSON.stringify(snapshot.annotations)),
    };
  }

  /**
   * Delete a snapshot
   *
   * @param snapshotId - ID of snapshot to delete
   * @param timeline - Current timeline
   * @returns Updated timeline
   * @throws Error if trying to delete the last snapshot
   * @throws Error if snapshot not found
   */
  static deleteSnapshot(snapshotId: string, timeline: Timeline): Timeline {
    // Cannot delete the last snapshot
    if (timeline.snapshots.length === 1) {
      throw new Error('Cannot delete the last snapshot');
    }

    const snapshotIndex = timeline.snapshots.findIndex((s) => s.id === snapshotId);

    if (snapshotIndex === -1) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const snapshot = timeline.snapshots[snapshotIndex];
    console.log(`BAC4: Deleting snapshot "${snapshot.label}" (${snapshot.id})`);

    // Remove snapshot
    const updatedSnapshots = timeline.snapshots.filter((s) => s.id !== snapshotId);
    const updatedOrder = timeline.snapshotOrder.filter((id) => id !== snapshotId);

    // If deleting current snapshot, switch to previous or next
    let newCurrentId = timeline.currentSnapshotId;
    if (timeline.currentSnapshotId === snapshotId) {
      // Try to get previous snapshot
      const currentOrderIndex = timeline.snapshotOrder.indexOf(snapshotId);
      if (currentOrderIndex > 0) {
        newCurrentId = timeline.snapshotOrder[currentOrderIndex - 1];
      } else {
        // Use next snapshot
        newCurrentId = timeline.snapshotOrder[currentOrderIndex + 1];
      }
    }

    return {
      snapshots: updatedSnapshots,
      currentSnapshotId: newCurrentId,
      snapshotOrder: updatedOrder,
    };
  }

  /**
   * Rename a snapshot
   *
   * @param snapshotId - ID of snapshot to rename
   * @param newLabel - New label for snapshot
   * @param timeline - Current timeline
   * @returns Updated timeline
   * @throws Error if snapshot not found
   * @throws Error if new label is empty
   */
  static renameSnapshot(snapshotId: string, newLabel: string, timeline: Timeline): Timeline {
    if (!newLabel || newLabel.trim() === '') {
      throw new Error('Snapshot label cannot be empty');
    }

    const snapshotIndex = timeline.snapshots.findIndex((s) => s.id === snapshotId);

    if (snapshotIndex === -1) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    console.log(
      `BAC4: Renaming snapshot "${timeline.snapshots[snapshotIndex].label}" to "${newLabel}"`
    );

    // Create updated snapshots array with renamed snapshot
    const updatedSnapshots = [...timeline.snapshots];
    updatedSnapshots[snapshotIndex] = {
      ...updatedSnapshots[snapshotIndex],
      label: newLabel.trim(),
    };

    return {
      ...timeline,
      snapshots: updatedSnapshots,
    };
  }

  /**
   * Reorder snapshots
   *
   * @param newOrder - New order of snapshot IDs
   * @param timeline - Current timeline
   * @returns Updated timeline
   * @throws Error if newOrder doesn't match existing snapshot IDs
   */
  static reorderSnapshots(newOrder: string[], timeline: Timeline): Timeline {
    // Validate that newOrder contains exactly the same IDs
    const currentIds = new Set(timeline.snapshotOrder);
    const newIds = new Set(newOrder);

    if (currentIds.size !== newIds.size) {
      throw new Error('New order must contain all snapshot IDs');
    }

    for (const id of currentIds) {
      if (!newIds.has(id)) {
        throw new Error(`Missing snapshot ID in new order: ${id}`);
      }
    }

    console.log('BAC4: Reordered snapshots');

    return {
      ...timeline,
      snapshotOrder: newOrder,
    };
  }

  /**
   * Get the next snapshot in timeline order
   *
   * @param currentId - Current snapshot ID
   * @param timeline - Current timeline
   * @returns Next snapshot, or null if at end
   */
  static getNextSnapshot(currentId: string, timeline: Timeline): TimelineSnapshot | null {
    const currentIndex = timeline.snapshotOrder.indexOf(currentId);

    if (currentIndex === -1) {
      console.warn(`BAC4: Current snapshot not found in order: ${currentId}`);
      return null;
    }

    if (currentIndex === timeline.snapshotOrder.length - 1) {
      // Already at last snapshot
      return null;
    }

    const nextId = timeline.snapshotOrder[currentIndex + 1];
    const nextSnapshot = timeline.snapshots.find((s) => s.id === nextId);

    return nextSnapshot || null;
  }

  /**
   * Get the previous snapshot in timeline order
   *
   * @param currentId - Current snapshot ID
   * @param timeline - Current timeline
   * @returns Previous snapshot, or null if at start
   */
  static getPreviousSnapshot(currentId: string, timeline: Timeline): TimelineSnapshot | null {
    const currentIndex = timeline.snapshotOrder.indexOf(currentId);

    if (currentIndex === -1) {
      console.warn(`BAC4: Current snapshot not found in order: ${currentId}`);
      return null;
    }

    if (currentIndex === 0) {
      // Already at first snapshot
      return null;
    }

    const previousId = timeline.snapshotOrder[currentIndex - 1];
    const previousSnapshot = timeline.snapshots.find((s) => s.id === previousId);

    return previousSnapshot || null;
  }

  /**
   * Update snapshot metadata (timestamp, description)
   *
   * @param snapshotId - ID of snapshot to update
   * @param updates - Fields to update
   * @param timeline - Current timeline
   * @returns Updated timeline
   * @throws Error if snapshot not found
   */
  static updateSnapshotMetadata(
    snapshotId: string,
    updates: Partial<Pick<TimelineSnapshot, 'timestamp' | 'description'>>,
    timeline: Timeline
  ): Timeline {
    const snapshotIndex = timeline.snapshots.findIndex((s) => s.id === snapshotId);

    if (snapshotIndex === -1) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    console.log(`BAC4: Updating snapshot metadata (${snapshotId})`);

    const updatedSnapshots = [...timeline.snapshots];
    updatedSnapshots[snapshotIndex] = {
      ...updatedSnapshots[snapshotIndex],
      ...updates,
    };

    return {
      ...timeline,
      snapshots: updatedSnapshots,
    };
  }

  /**
   * Create initial timeline for new diagrams
   *
   * @param nodes - Initial nodes
   * @param edges - Initial edges
   * @param label - Label for initial snapshot (defaults to "Current")
   * @returns New timeline with single snapshot
   */
  static createInitialTimeline(
    nodes: Node[] = [],
    edges: Edge[] = [],
    label: string = DEFAULT_SNAPSHOT_LABEL
  ): Timeline {
    const snapshotId = this.generateSnapshotId();

    const snapshot: TimelineSnapshot = {
      id: snapshotId,
      label,
      timestamp: null,
      description: '',
      createdAt: new Date().toISOString(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      annotations: [],
    };

    console.log(`BAC4: Created initial timeline with snapshot "${label}"`);

    return {
      snapshots: [snapshot],
      currentSnapshotId: snapshotId,
      snapshotOrder: [snapshotId],
    };
  }

  /**
   * Get current snapshot from timeline
   *
   * @param timeline - Current timeline
   * @returns Current snapshot
   * @throws Error if current snapshot not found
   */
  static getCurrentSnapshot(timeline: Timeline): TimelineSnapshot {
    const snapshot = timeline.snapshots.find((s) => s.id === timeline.currentSnapshotId);

    if (!snapshot) {
      throw new Error(`Current snapshot not found: ${timeline.currentSnapshotId}`);
    }

    return snapshot;
  }

  /**
   * Check if snapshot is the first in order
   *
   * @param snapshotId - Snapshot ID to check
   * @param timeline - Current timeline
   * @returns True if this is the first snapshot
   */
  static isFirstSnapshot(snapshotId: string, timeline: Timeline): boolean {
    return timeline.snapshotOrder[0] === snapshotId;
  }

  /**
   * Check if snapshot is the last in order
   *
   * @param snapshotId - Snapshot ID to check
   * @param timeline - Current timeline
   * @returns True if this is the last snapshot
   */
  static isLastSnapshot(snapshotId: string, timeline: Timeline): boolean {
    return timeline.snapshotOrder[timeline.snapshotOrder.length - 1] === snapshotId;
  }

  /**
   * Get snapshot by ID
   *
   * @param snapshotId - Snapshot ID
   * @param timeline - Current timeline
   * @returns Snapshot, or null if not found
   */
  static getSnapshotById(snapshotId: string, timeline: Timeline): TimelineSnapshot | null {
    return timeline.snapshots.find((s) => s.id === snapshotId) || null;
  }

  /**
   * Get snapshots in display order
   *
   * @param timeline - Current timeline
   * @returns Snapshots ordered according to snapshotOrder
   */
  static getSnapshotsInOrder(timeline: Timeline): TimelineSnapshot[] {
    return timeline.snapshotOrder
      .map((id) => timeline.snapshots.find((s) => s.id === id))
      .filter((s): s is TimelineSnapshot => s !== undefined);
  }
}
