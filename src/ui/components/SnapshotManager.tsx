/**
 * SnapshotManager - Modal for managing timeline snapshots
 *
 * Allows users to:
 * - View all snapshots
 * - Rename snapshots
 * - Delete snapshots (except last one)
 * - Update snapshot metadata (timestamp, description)
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { Modal, App, Notice, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { Timeline, TimelineSnapshot } from '../../types/timeline';
import { TimelineService } from '../../services/TimelineService';
import { ADRService } from '../../services/ADRService';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../constants/ui-constants';

interface SnapshotManagerProps {
	app: App;
	timeline: Timeline;
	onTimelineUpdate: (updatedTimeline: Timeline) => void;
	onClose: () => void;
}

/**
 * SnapshotManager React Component
 */
const SnapshotManagerContent: React.FC<SnapshotManagerProps> = ({
	app,
	timeline,
	onTimelineUpdate,
	onClose,
}) => {
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editLabel, setEditLabel] = React.useState('');
	const [editTimestamp, setEditTimestamp] = React.useState('');
	const [editDescription, setEditDescription] = React.useState('');

	const orderedSnapshots = TimelineService.getSnapshotsInOrder(timeline);
	const adrService = React.useMemo(() => new ADRService(app), [app]);

	const handleStartEdit = (snapshot: TimelineSnapshot) => {
		setEditingId(snapshot.id);
		setEditLabel(snapshot.label);
		setEditTimestamp(snapshot.timestamp || '');
		setEditDescription(snapshot.description || '');
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditLabel('');
		setEditTimestamp('');
		setEditDescription('');
	};

	const handleSaveEdit = (snapshotId: string) => {
		try {
			// Rename if label changed
			let updatedTimeline = timeline;
			if (editLabel.trim() !== '') {
				updatedTimeline = TimelineService.renameSnapshot(
					snapshotId,
					editLabel,
					updatedTimeline
				);
			}

			// Update metadata if timestamp or description changed
			const snapshot = TimelineService.getSnapshotById(snapshotId, updatedTimeline);
			if (
				snapshot &&
				(editTimestamp !== (snapshot.timestamp || '') ||
					editDescription !== (snapshot.description || ''))
			) {
				updatedTimeline = TimelineService.updateSnapshotMetadata(
					snapshotId,
					{
						timestamp: editTimestamp || null,
						description: editDescription,
					},
					updatedTimeline
				);
			}

			onTimelineUpdate(updatedTimeline);
			handleCancelEdit();
			new Notice('Snapshot updated');
		} catch (error) {
			console.error('Failed to update snapshot:', error);
			new Notice(`Failed to update snapshot: ${(error instanceof Error ? error.message : 'Unknown error')}`);
		}
	};

	const handleDelete = (snapshotId: string, snapshotLabel: string) => {
		if (timeline.snapshots.length === 1) {
			new Notice('Cannot delete the last snapshot');
			return;
		}

		// Confirm deletion
		const confirmed = confirm(
			`Delete snapshot "${snapshotLabel}"?\n\nThis action cannot be undone.`
		);

		if (!confirmed) {
			return;
		}

		try {
			const updatedTimeline = TimelineService.deleteSnapshot(snapshotId, timeline);
			onTimelineUpdate(updatedTimeline);
			new Notice(`Deleted snapshot "${snapshotLabel}"`);
		} catch (error) {
			console.error('Failed to delete snapshot:', error);
			new Notice(`Failed to delete snapshot: ${(error instanceof Error ? error.message : 'Unknown error')}`);
		}
	};

	/**
	 * Create new ADR for snapshot
	 */
	const handleCreateADR = async (snapshot: TimelineSnapshot) => {
		const title = prompt('Enter ADR title:', snapshot.label);
		if (!title) return;

		try {
			const adrPath = await adrService.createADR({
				title,
				diagramPath: 'current-diagram.bac4', // TODO: Pass actual diagram path
				snapshot,
				previousSnapshot: null, // TODO: Get previous snapshot if available
			});

			const updatedTimeline = adrService.linkADRToSnapshot(
				snapshot.id,
				adrPath,
				timeline
			);
			onTimelineUpdate(updatedTimeline);

			new Notice(`ADR created: ${adrPath}`);
		} catch (error) {
			console.error('Failed to create ADR:', error);
			new Notice(`Failed to create ADR: ${(error instanceof Error ? error.message : 'Unknown error')}`);
		}
	};

	/**
	 * Link existing ADR to snapshot
	 */
	const handleLinkADR = async (snapshot: TimelineSnapshot) => {
		// Simple file picker (just ask for path)
		const adrPath = prompt(
			'Enter path to ADR markdown file:',
			'ADRs/0001-example-decision.md'
		);

		if (!adrPath) return;

		// Verify file exists
		const file = app.vault.getAbstractFileByPath(adrPath);
		if (!file || !(file instanceof TFile)) {
			new Notice(`File not found: ${adrPath}`);
			return;
		}

		try {
			const updatedTimeline = adrService.linkADRToSnapshot(
				snapshot.id,
				adrPath,
				timeline
			);
			onTimelineUpdate(updatedTimeline);

			new Notice(`Linked ADR: ${adrPath}`);
		} catch (error) {
			console.error('Failed to link ADR:', error);
			new Notice(`Failed to link ADR: ${(error instanceof Error ? error.message : 'Unknown error')}`);
		}
	};

	/**
	 * Unlink ADR from snapshot
	 */
	const handleUnlinkADR = (snapshot: TimelineSnapshot) => {
		const confirmed = confirm(`Unlink ADR from snapshot "${snapshot.label}"?`);
		if (!confirmed) return;

		try {
			const updatedTimeline = adrService.unlinkADRFromSnapshot(
				snapshot.id,
				timeline
			);
			onTimelineUpdate(updatedTimeline);

			new Notice('ADR unlinked');
		} catch (error) {
			console.error('Failed to unlink ADR:', error);
			new Notice(`Failed to unlink ADR: ${(error instanceof Error ? error.message : 'Unknown error')}`);
		}
	};

	/**
	 * Open linked ADR
	 */
	const handleOpenADR = async (snapshot: TimelineSnapshot) => {
		try {
			const opened = await adrService.openADR(snapshot);
			if (!opened) {
				new Notice('ADR file not found');
			}
		} catch (error) {
			console.error('Failed to open ADR:', error);
			new Notice(`Failed to open ADR: ${(error instanceof Error ? error.message : 'Unknown error')}`);
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
				Manage Timeline Snapshots
			</h2>

			<div
				style={{
					marginBottom: SPACING.gap.wide,
					fontSize: FONT_SIZES.small,
					color: UI_COLORS.textMuted,
				}}
			>
				{timeline.snapshots.length} snapshot{timeline.snapshots.length !== 1 ? 's' : ''} in
				timeline
			</div>

			{/* Snapshot List */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.gap.normal }}>
				{orderedSnapshots.map((snapshot, index) => {
					const isEditing = editingId === snapshot.id;
					const isCurrent = snapshot.id === timeline.currentSnapshotId;
					// All snapshots are editable, show icon only for currently selected
					const icon = isCurrent ? '✏️ ' : '';
					const editHint = isCurrent ? 'Currently editing this snapshot' : 'Click to edit this snapshot';

					return (
						<div
							key={snapshot.id}
							style={{
								padding: SPACING.padding.card,
								border: `2px solid ${isCurrent ? UI_COLORS.interactiveAccent : UI_COLORS.border}`,
								borderRadius: BORDER_RADIUS.normal,
								backgroundColor: isCurrent
									? `${UI_COLORS.interactiveAccent}15`
									: UI_COLORS.backgroundSecondary,
							}}
						>
							{isEditing ? (
								// Edit Mode
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: SPACING.gap.normal,
									}}
								>
									{/* Label Input */}
									<div>
										<label
											style={{
												display: 'block',
												fontSize: FONT_SIZES.small,
												fontWeight: 600,
												color: UI_COLORS.textMuted,
												marginBottom: SPACING.gap.tiny,
											}}
										>
											Label
										</label>
										<input
											type="text"
											value={editLabel}
											onChange={(e) => setEditLabel(e.target.value)}
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

									{/* Timestamp Input */}
									<div>
										<label
											style={{
												display: 'block',
												fontSize: FONT_SIZES.small,
												fontWeight: 600,
												color: UI_COLORS.textMuted,
												marginBottom: SPACING.gap.tiny,
											}}
										>
											Timestamp (optional)
										</label>
										<input
											type="text"
											value={editTimestamp}
											onChange={(e) => setEditTimestamp(e.target.value)}
											placeholder="e.g., Q2 2025, 2025-04-01"
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

									{/* Description Input */}
									<div>
										<label
											style={{
												display: 'block',
												fontSize: FONT_SIZES.small,
												fontWeight: 600,
												color: UI_COLORS.textMuted,
												marginBottom: SPACING.gap.tiny,
											}}
										>
											Description (optional)
										</label>
										<textarea
											value={editDescription}
											onChange={(e) => setEditDescription(e.target.value)}
											placeholder="Describe what changed in this snapshot..."
											rows={3}
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

									{/* Action Buttons */}
									<div
										style={{ display: 'flex', gap: SPACING.gap.normal, justifyContent: 'flex-end' }}
									>
										<button
											onClick={handleCancelEdit}
											style={{
												padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
												fontSize: FONT_SIZES.small,
												borderRadius: BORDER_RADIUS.normal,
												border: `1px solid ${UI_COLORS.border}`,
												backgroundColor: UI_COLORS.backgroundPrimary,
												color: UI_COLORS.textNormal,
												cursor: 'pointer',
											}}
										>
											Cancel
										</button>
										<button
											onClick={() => handleSaveEdit(snapshot.id)}
											style={{
												padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
												fontSize: FONT_SIZES.small,
												borderRadius: BORDER_RADIUS.normal,
												border: 'none',
												backgroundColor: UI_COLORS.interactiveAccent,
												color: '#FFFFFF',
												cursor: 'pointer',
												fontWeight: 600,
											}}
										>
											Save
										</button>
									</div>
								</div>
							) : (
								// View Mode
								<div>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											marginBottom: SPACING.gap.tiny,
										}}
									>
										<div
											style={{
												fontSize: FONT_SIZES.normal,
												fontWeight: 600,
												color: UI_COLORS.textNormal,
												flex: 1,
											}}
											title={editHint}
										>
											{icon}{index + 1}. {snapshot.label}
											{isCurrent && (
												<span
													style={{
														marginLeft: SPACING.gap.normal,
														fontSize: FONT_SIZES.small,
														color: UI_COLORS.interactiveAccent,
														fontWeight: 'normal',
													}}
												>
													(editing)
												</span>
											)}
										</div>
									</div>

									{snapshot.timestamp && (
										<div
											style={{
												fontSize: FONT_SIZES.small,
												color: UI_COLORS.textMuted,
												marginBottom: SPACING.gap.tiny,
											}}
										>
											📅 {snapshot.timestamp}
										</div>
									)}

									{snapshot.description && (
										<div
											style={{
												fontSize: FONT_SIZES.small,
												color: UI_COLORS.textMuted,
												marginBottom: SPACING.gap.normal,
											}}
										>
											{snapshot.description}
										</div>
									)}

									<div
										style={{
											fontSize: FONT_SIZES.small,
											color: UI_COLORS.textMuted,
											marginBottom: SPACING.gap.normal,
										}}
									>
										Created: {new Date(snapshot.createdAt).toLocaleString()}
									</div>

									{/* ADR Section */}
									{snapshot.adrPath ? (
										<div
											style={{
												padding: SPACING.padding.card,
												backgroundColor: `${UI_COLORS.interactiveAccent}10`,
												border: `1px solid ${UI_COLORS.interactiveAccent}40`,
												borderRadius: BORDER_RADIUS.small,
												marginBottom: SPACING.gap.normal,
												fontSize: FONT_SIZES.small,
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: SPACING.gap.tiny,
													marginBottom: SPACING.gap.tiny,
												}}
											>
												<span style={{ fontSize: FONT_SIZES.normal }}>📄</span>
												<span style={{ color: UI_COLORS.textNormal, fontWeight: 600 }}>
													ADR Linked
												</span>
											</div>
											<div style={{ color: UI_COLORS.textMuted, marginBottom: SPACING.gap.tiny }}>
												{snapshot.adrPath}
											</div>
											<div style={{ display: 'flex', gap: SPACING.gap.tiny }}>
												<button
													onClick={() => handleOpenADR(snapshot)}
													style={{
														padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
														fontSize: FONT_SIZES.tiny,
														borderRadius: BORDER_RADIUS.small,
														border: 'none',
														backgroundColor: UI_COLORS.interactiveAccent,
														color: '#FFFFFF',
														cursor: 'pointer',
													}}
												>
													Open
												</button>
												<button
													onClick={() => handleUnlinkADR(snapshot)}
													style={{
														padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
														fontSize: FONT_SIZES.tiny,
														borderRadius: BORDER_RADIUS.small,
														border: `1px solid ${UI_COLORS.border}`,
														backgroundColor: UI_COLORS.backgroundPrimary,
														color: UI_COLORS.textMuted,
														cursor: 'pointer',
													}}
												>
													Unlink
												</button>
											</div>
										</div>
									) : (
										<div
											style={{
												padding: SPACING.padding.card,
												backgroundColor: UI_COLORS.backgroundSecondary,
												border: `1px solid ${UI_COLORS.border}`,
												borderRadius: BORDER_RADIUS.small,
												marginBottom: SPACING.gap.normal,
												fontSize: FONT_SIZES.small,
												color: UI_COLORS.textMuted,
											}}
										>
											<div style={{ marginBottom: SPACING.gap.tiny }}>
												💡 Link an Architecture Decision Record (ADR) to document why this snapshot exists.
											</div>
											<div style={{ display: 'flex', gap: SPACING.gap.tiny }}>
												<button
													onClick={() => handleCreateADR(snapshot)}
													style={{
														padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
														fontSize: FONT_SIZES.tiny,
														borderRadius: BORDER_RADIUS.small,
														border: 'none',
														backgroundColor: UI_COLORS.interactiveAccent,
														color: '#FFFFFF',
														cursor: 'pointer',
													}}
												>
													+ Create ADR
												</button>
												<button
													onClick={() => handleLinkADR(snapshot)}
													style={{
														padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
														fontSize: FONT_SIZES.tiny,
														borderRadius: BORDER_RADIUS.small,
														border: `1px solid ${UI_COLORS.border}`,
														backgroundColor: UI_COLORS.backgroundPrimary,
														color: UI_COLORS.textNormal,
														cursor: 'pointer',
													}}
												>
													Link Existing
												</button>
											</div>
										</div>
									)}

									{/* Action Buttons */}
									<div style={{ display: 'flex', gap: SPACING.gap.normal }}>
										<button
											onClick={() => handleStartEdit(snapshot)}
											style={{
												padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
												fontSize: FONT_SIZES.small,
												borderRadius: BORDER_RADIUS.normal,
												border: `1px solid ${UI_COLORS.border}`,
												backgroundColor: UI_COLORS.backgroundPrimary,
												color: UI_COLORS.textNormal,
												cursor: 'pointer',
											}}
										>
											✏️ Edit
										</button>
										<button
											onClick={() => handleDelete(snapshot.id, snapshot.label)}
											disabled={timeline.snapshots.length === 1}
											style={{
												padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
												fontSize: FONT_SIZES.small,
												borderRadius: BORDER_RADIUS.normal,
												border: `1px solid ${UI_COLORS.border}`,
												backgroundColor:
													timeline.snapshots.length === 1
														? UI_COLORS.backgroundSecondary
														: UI_COLORS.backgroundPrimary,
												color:
													timeline.snapshots.length === 1
														? UI_COLORS.textMuted
														: '#FF6B6B',
												cursor:
													timeline.snapshots.length === 1 ? 'not-allowed' : 'pointer',
												opacity: timeline.snapshots.length === 1 ? 0.5 : 1,
											}}
										>
											🗑️ Delete
										</button>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Close Button */}
			<div style={{ marginTop: SPACING.gap.wide, textAlign: 'right' }}>
				<button
					onClick={onClose}
					style={{
						padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
						fontSize: FONT_SIZES.normal,
						borderRadius: BORDER_RADIUS.normal,
						border: `1px solid ${UI_COLORS.border}`,
						backgroundColor: UI_COLORS.backgroundPrimary,
						color: UI_COLORS.textNormal,
						cursor: 'pointer',
					}}
				>
					Close
				</button>
			</div>
		</div>
	);
};

/**
 * SnapshotManager Modal Class
 */
export class SnapshotManagerModal extends Modal {
	private root: Root | null = null;
	private timeline: Timeline;
	private onTimelineUpdate: (updatedTimeline: Timeline) => void;

	constructor(app: App, timeline: Timeline, onTimelineUpdate: (updatedTimeline: Timeline) => void) {
		super(app);
		this.timeline = timeline;
		this.onTimelineUpdate = onTimelineUpdate;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Create React root and render
		this.root = createRoot(contentEl);
		this.root.render(
			<SnapshotManagerContent
				app={this.app}
				timeline={this.timeline}
				onTimelineUpdate={(updatedTimeline) => {
					this.timeline = updatedTimeline;
					this.onTimelineUpdate(updatedTimeline);
				}}
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
