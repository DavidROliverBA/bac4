/**
 * AddSnapshotModal - Modal for creating new timeline snapshots
 *
 * Allows users to create a new snapshot with:
 * - Label (required)
 * - Timestamp (optional)
 * - Description (optional)
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { Modal, App, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { Node, Edge } from 'reactflow';
import { Timeline, Annotation, CreateSnapshotOptions } from '../../types/timeline';
import { TimelineService } from '../../services/TimelineService';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../constants/ui-constants';

interface AddSnapshotModalProps {
  nodes: Node[];
  edges: Edge[];
  annotations: Annotation[];
  currentTimeline: Timeline;
  onSnapshotCreated: (updatedTimeline: Timeline, snapshotId: string) => void;
  onClose: () => void;
}

/**
 * AddSnapshotModal React Component
 */
const AddSnapshotModalContent: React.FC<AddSnapshotModalProps> = ({
  nodes,
  edges,
  annotations,
  currentTimeline,
  onSnapshotCreated,
  onClose,
}) => {
  const [label, setLabel] = React.useState('');
  const [timestamp, setTimestamp] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!label.trim()) {
      new Notice('Snapshot label is required');
      return;
    }

    setIsCreating(true);

    try {
      const options: CreateSnapshotOptions = {
        label: label.trim(),
        timestamp: timestamp.trim() || undefined,
        description: description.trim() || undefined,
      };

      const result = TimelineService.createSnapshot(
        nodes,
        edges,
        annotations,
        options,
        currentTimeline
      );

      new Notice(`Created snapshot "${result.snapshot.label}"`);
      onSnapshotCreated(result.timeline, result.snapshot.id);
      onClose();
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      new Notice(`Failed to create snapshot: ${errorMessage}`);
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCreate();
    }
  };

  return (
    <div style={{ padding: SPACING.padding.panel }}>
      <h2
        style={{
          marginTop: 0,
          marginBottom: SPACING.gap.wide,
          fontSize: FONT_SIZES.large,
          color: UI_COLORS.textNormal,
        }}
      >
        Add Timeline Snapshot
      </h2>

      <div
        style={{
          marginBottom: SPACING.gap.wide,
          fontSize: FONT_SIZES.small,
          color: UI_COLORS.textMuted,
        }}
      >
        Capture the current state of your diagram as a new snapshot.
      </div>

      {/* Label Input (Required) */}
      <div style={{ marginBottom: SPACING.gap.normal }}>
        <label
          style={{
            display: 'block',
            fontSize: FONT_SIZES.small,
            fontWeight: 600,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.gap.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Label *
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Before Migration, Phase 2, Current State"
          autoFocus
          style={{
            width: '100%',
            padding: SPACING.padding.input,
            fontSize: FONT_SIZES.normal,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            backgroundColor: UI_COLORS.backgroundPrimary,
            color: UI_COLORS.textNormal,
          }}
        />
      </div>

      {/* Timestamp Input (Optional) */}
      <div style={{ marginBottom: SPACING.gap.normal }}>
        <label
          style={{
            display: 'block',
            fontSize: FONT_SIZES.small,
            fontWeight: 600,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.gap.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Timestamp (optional)
        </label>
        <input
          type="text"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Q2 2025, 2025-04-01, April 2025"
          style={{
            width: '100%',
            padding: SPACING.padding.input,
            fontSize: FONT_SIZES.normal,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            backgroundColor: UI_COLORS.backgroundPrimary,
            color: UI_COLORS.textNormal,
          }}
        />
      </div>

      {/* Description Input (Optional) */}
      <div style={{ marginBottom: SPACING.gap.wide }}>
        <label
          style={{
            display: 'block',
            fontSize: FONT_SIZES.small,
            fontWeight: 600,
            color: UI_COLORS.textMuted,
            marginBottom: SPACING.gap.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what changed in this snapshot..."
          rows={4}
          style={{
            width: '100%',
            padding: SPACING.padding.input,
            fontSize: FONT_SIZES.normal,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            backgroundColor: UI_COLORS.backgroundPrimary,
            color: UI_COLORS.textNormal,
            resize: 'vertical',
          }}
        />
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: SPACING.padding.card,
          backgroundColor: `${UI_COLORS.interactiveAccent}15`,
          border: `1px solid ${UI_COLORS.interactiveAccent}40`,
          borderRadius: BORDER_RADIUS.normal,
          marginBottom: SPACING.gap.wide,
          fontSize: FONT_SIZES.small,
          color: UI_COLORS.textMuted,
        }}
      >
        💡 <strong>Tip:</strong> Snapshots capture the entire diagram state (nodes, edges, and
        annotations). You can switch between snapshots to see how your architecture evolves over
        time.
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: SPACING.gap.normal,
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onClose}
          disabled={isCreating}
          style={{
            padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
            fontSize: FONT_SIZES.normal,
            borderRadius: BORDER_RADIUS.normal,
            border: `1px solid ${UI_COLORS.border}`,
            backgroundColor: UI_COLORS.backgroundPrimary,
            color: UI_COLORS.textNormal,
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating || !label.trim()}
          style={{
            padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
            fontSize: FONT_SIZES.normal,
            borderRadius: BORDER_RADIUS.normal,
            border: 'none',
            backgroundColor:
              isCreating || !label.trim()
                ? UI_COLORS.backgroundSecondary
                : UI_COLORS.interactiveAccent,
            color: isCreating || !label.trim() ? UI_COLORS.textMuted : '#FFFFFF',
            cursor: isCreating || !label.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isCreating ? 'Creating...' : 'Create Snapshot'}
        </button>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div
        style={{
          marginTop: SPACING.gap.normal,
          fontSize: FONT_SIZES.small,
          color: UI_COLORS.textMuted,
          textAlign: 'right',
        }}
      >
        Press <kbd>Cmd+Enter</kbd> to create
      </div>
    </div>
  );
};

/**
 * AddSnapshotModal Modal Class
 */
export class AddSnapshotModal extends Modal {
  private root: Root | null = null;
  private nodes: Node[];
  private edges: Edge[];
  private annotations: Annotation[];
  private currentTimeline: Timeline;
  private onSnapshotCreated: (updatedTimeline: Timeline, snapshotId: string) => void;

  constructor(
    app: App,
    nodes: Node[],
    edges: Edge[],
    annotations: Annotation[],
    currentTimeline: Timeline,
    onSnapshotCreated: (updatedTimeline: Timeline, snapshotId: string) => void
  ) {
    super(app);
    this.nodes = nodes;
    this.edges = edges;
    this.annotations = annotations;
    this.currentTimeline = currentTimeline;
    this.onSnapshotCreated = onSnapshotCreated;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Set modal width
    this.modalEl.style.width = '600px';

    // Create React root and render
    this.root = createRoot(contentEl);
    this.root.render(
      <AddSnapshotModalContent
        nodes={this.nodes}
        edges={this.edges}
        annotations={this.annotations}
        currentTimeline={this.currentTimeline}
        onSnapshotCreated={this.onSnapshotCreated}
        onClose={() => this.close()}
      />
    );
  }

  onClose() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
