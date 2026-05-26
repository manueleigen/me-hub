"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDetailShell } from "@/components/entity-detail/entity-detail-shell";
import { TaskCommentsSection } from "@/components/aufgaben/task-detail/task-comments-section";
import { EntityDeleteDialog } from "@/components/entity/entity-delete-dialog";
import { useDashboardUser } from "@/lib/dashboard-user-context";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import type { TaskComment } from "@/types/aufgaben";

export type EntityDetailPageLayoutProps = {
	listLabel: string;
	listHref: string;
	title: string;
	badges?: ReactNode;
	sha?: string;
	comments?: TaskComment[];
	onCommentsChange?: (comments: TaskComment[]) => void;
	onAddComment?: (comment: TaskComment) => Promise<void>;
	details: ReactNode;
	/** Narrow column (max-w 700px): timer, comments, related lists */
	narrowContent?: ReactNode;
	/** Full-width area below header/details (e.g. project task kanban) */
	fullWidthContent?: ReactNode;
	deleteDialogTitle: string;
	editAriaLabel: string;
	deleteAriaLabel: string;
	onDelete: () => Promise<void>;
	renderEditDrawer: (props: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => ReactNode;
	contentClassName?: string;
	maxWidthClass?: string;
};

export function EntityDetailPageLayout({
	listLabel,
	listHref,
	title,
	badges,
	sha,
	comments = [],
	onCommentsChange,
	onAddComment,
	details,
	narrowContent,
	fullWidthContent,
	deleteDialogTitle,
	editAriaLabel,
	deleteAriaLabel,
	onDelete,
	renderEditDrawer,
	contentClassName = "pb-6",
	maxWidthClass,
}: EntityDetailPageLayoutProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const currentUser = useDashboardUser();
	const [isPending, startTransition] = useTransition();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [newComment, setNewComment] = useState("");

	const showComments = Boolean(onCommentsChange && onAddComment);

	const handleAddComment = async (comment: TaskComment) => {
		if (!onCommentsChange || !onAddComment) return;
		const previous = comments;
		const next = [...comments, comment];
		onCommentsChange(next);
		setNewComment("");
		try {
			await onAddComment(comment);
		} catch {
			onCommentsChange(previous);
		}
	};

	const handleDelete = () => {
		startTransition(async () => {
			try {
				await onDelete();
			} catch {
				// Caller shows toast
			}
		});
	};

	const narrowBody = (
		<div className="space-y-6 max-w-[700px]">
			{narrowContent}
			{showComments && (
				<TaskCommentsSection
					comments={comments}
					newComment={newComment}
					writeEnabled={vaultWriteEnabled}
					canAddComment={Boolean(currentUser)}
					onNewCommentChange={setNewComment}
					onAddComment={handleAddComment}
					currentUser={currentUser}
				/>
			)}
		</div>
	);

	const shellChildren =
		narrowContent || showComments || fullWidthContent ? (
			<>
				{(narrowContent || showComments) && narrowBody}
				{fullWidthContent}
			</>
		) : null;

	return (
		<>
			<EntityDetailShell
				breadcrumbs={[
					{ label: listLabel, href: listHref },
					{ label: title },
				]}
				backHref={listHref}
				title={title}
				badges={badges}
				actions={
					<>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setDrawerOpen(true)}
							disabled={!vaultWriteEnabled}
							aria-label={editAriaLabel}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-destructive hover:text-destructive"
							onClick={() => setConfirmDelete(true)}
							disabled={!vaultWriteEnabled || !sha}
							aria-label={deleteAriaLabel}
						>
							<Trash2 className="size-4" />
						</Button>
					</>
				}
				details={details}
				contentClassName={contentClassName}
				maxWidthClass={maxWidthClass}
			>
				{shellChildren}
			</EntityDetailShell>

			{renderEditDrawer({ open: drawerOpen, onOpenChange: setDrawerOpen })}

			<EntityDeleteDialog
				open={confirmDelete}
				onOpenChange={setConfirmDelete}
				title={deleteDialogTitle}
				entityTitle={title}
				onConfirm={handleDelete}
				isPending={isPending}
			/>
		</>
	);
}
