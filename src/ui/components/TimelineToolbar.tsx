/**
 * TimelineToolbar - Timeline navigation controls
 *
 * Displays timeline navigation UI when diagram has 2+ snapshots.
 * Includes Previous/Next buttons, snapshot dropdown, and Add Snapshot button.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { Timeline } from '../../types/timeline';
import { TimelineService } from '../../services/TimelineService';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../constants/ui-constants';

interface TimelineToolbarProps {
	/** Current timeline data */
	timeline: Timeline;
	/** Callback when switching snapshots */
	onSnapshotSwitch: (snapshotId: string) => void;
	/** Callback to open Add Snapshot modal */
	onAddSnapshot: () => void;
	/** Callback to open Snapshot Manager modal */
	onManageSnapshots: () => void;
	/** Whether change indicators are shown */
	showChanges?: boolean;
	/** Callback to toggle change indicators */
	onToggleChanges?: () => void;
}

/**
 * TimelineToolbar component
 *
 * Shows timeline navigation only when 2+ snapshots exist.
 */
export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
	timeline,
	onSnapshotSwitch,
	onAddSnapshot,
	onManageSnapshots,
	showChanges = false,
	onToggleChanges,
}) => {
	// Don't show toolbar if only 1 snapshot
	if (timeline.snapshots.length < 2) {
		return null;
	}

	const currentSnapshot = TimelineService.getCurrentSnapshot(timeline);
	const orderedSnapshots = TimelineService.getSnapshotsInOrder(timeline);

	const isFirst = TimelineService.isFirstSnapshot(currentSnapshot.id, timeline);
	const isLast = TimelineService.isLastSnapshot(currentSnapshot.id, timeline);

	const handlePrevious = () => {
		const previous = TimelineService.getPreviousSnapshot(currentSnapshot.id, timeline);
		if (previous) {
			onSnapshotSwitch(previous.id);
		}
	};

	const handleNext = () => {
		const next = TimelineService.getNextSnapshot(currentSnapshot.id, timeline);
		if (next) {
			onSnapshotSwitch(next.id);
		}
	};

	const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onSnapshotSwitch(e.target.value);
	};

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: SPACING.gap.normal,
				padding: SPACING.padding.section,
				backgroundColor: UI_COLORS.backgroundSecondary,
				borderBottom: `1px solid ${UI_COLORS.border}`,
				flexWrap: 'wrap',
			}}
		>
			{/* Timeline Label */}
			<div
				style={{
					fontSize: FONT_SIZES.small,
					fontWeight: 600,
					color: UI_COLORS.textMuted,
					textTransform: 'uppercase',
					letterSpacing: '0.5px',
				}}
			>
				Timeline
			</div>

			{/* Previous Button */}
			<button
				onClick={handlePrevious}
				disabled={isFirst}
				title="Previous snapshot (Cmd+[)"
				style={{
					padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
					fontSize: FONT_SIZES.small,
					borderRadius: BORDER_RADIUS.normal,
					border: `1px solid ${UI_COLORS.border}`,
					backgroundColor: isFirst
						? UI_COLORS.backgroundSecondary
						: UI_COLORS.backgroundPrimary,
					color: isFirst ? UI_COLORS.textMuted : UI_COLORS.textNormal,
					cursor: isFirst ? 'not-allowed' : 'pointer',
					opacity: isFirst ? 0.5 : 1,
				}}
			>
				← Previous
			</button>

			{/* Snapshot Dropdown */}
			<select
				value={currentSnapshot.id}
				onChange={handleDropdownChange}
				title="Select snapshot to edit (all snapshots are editable)"
				style={{
					padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
					fontSize: FONT_SIZES.small,
					borderRadius: BORDER_RADIUS.normal,
					border: `1px solid ${UI_COLORS.border}`,
					backgroundColor: UI_COLORS.backgroundPrimary,
					color: UI_COLORS.textNormal,
					cursor: 'pointer',
					minWidth: '150px',
					maxWidth: '250px',
				}}
			>
				{orderedSnapshots.map((snapshot) => {
					// Show pencil icon ONLY on currently selected snapshot (all are editable)
					const isCurrentlyEditing = snapshot.id === currentSnapshot.id;
					const icon = isCurrentlyEditing ? '✏️ ' : '';
					return (
						<option key={snapshot.id} value={snapshot.id}>
							{icon}{snapshot.label}
							{snapshot.timestamp ? ` (${snapshot.timestamp})` : ''}
						</option>
					);
				})}
			</select>

			{/* Next Button */}
			<button
				onClick={handleNext}
				disabled={isLast}
				title="Next snapshot (Cmd+])"
				style={{
					padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
					fontSize: FONT_SIZES.small,
					borderRadius: BORDER_RADIUS.normal,
					border: `1px solid ${UI_COLORS.border}`,
					backgroundColor: isLast
						? UI_COLORS.backgroundSecondary
						: UI_COLORS.backgroundPrimary,
					color: isLast ? UI_COLORS.textMuted : UI_COLORS.textNormal,
					cursor: isLast ? 'not-allowed' : 'pointer',
					opacity: isLast ? 0.5 : 1,
				}}
			>
				Next →
			</button>

			{/* Divider */}
			<div
				style={{
					width: '1px',
					height: '24px',
					backgroundColor: UI_COLORS.border,
				}}
			/>

			{/* Add Snapshot Button */}
			<button
				onClick={onAddSnapshot}
				title="Add new snapshot"
				style={{
					padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
					fontSize: FONT_SIZES.small,
					borderRadius: BORDER_RADIUS.normal,
					border: `1px solid ${UI_COLORS.border}`,
					backgroundColor: UI_COLORS.interactiveAccent,
					color: '#FFFFFF',
					cursor: 'pointer',
					fontWeight: 600,
				}}
			>
				+ Add Snapshot
			</button>

			{/* Manage Snapshots Button */}
			<button
				onClick={onManageSnapshots}
				title="Manage snapshots (rename, delete, reorder)"
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
				⚙️ Manage
			</button>

			{/* Show Changes Toggle */}
			{onToggleChanges && (
				<button
					onClick={onToggleChanges}
					title={showChanges ? 'Hide change indicators' : 'Show change indicators'}
					style={{
						padding: `${SPACING.padding.compact} ${SPACING.padding.button}`,
						fontSize: FONT_SIZES.small,
						borderRadius: BORDER_RADIUS.normal,
						border: `1px solid ${UI_COLORS.border}`,
						backgroundColor: showChanges ? UI_COLORS.interactiveAccent : UI_COLORS.backgroundPrimary,
						color: showChanges ? '#FFFFFF' : UI_COLORS.textNormal,
						cursor: 'pointer',
						fontWeight: showChanges ? 600 : 'normal',
					}}
				>
					{showChanges ? '🔍 Showing Changes' : '🔍 Show Changes'}
				</button>
			)}

			{/* Snapshot Counter */}
			<div
				style={{
					marginLeft: 'auto',
					fontSize: FONT_SIZES.small,
					color: UI_COLORS.textMuted,
				}}
			>
				{orderedSnapshots.findIndex((s) => s.id === currentSnapshot.id) + 1} of{' '}
				{orderedSnapshots.length}
			</div>
		</div>
	);
};
