"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDashboardUser } from "@/lib/dashboard-user-context";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import { useDetailDrawer } from "@/hooks/use-detail-drawer";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import { slugify } from "@/lib/frontmatter";
import { DetailDrawer } from "@/components/detail-drawer/detail-drawer";
import { DetailDrawerFooter } from "@/components/detail-drawer/detail-drawer-footer";
import { TaskDetailHeader } from "@/components/aufgaben/task-detail/task-detail-header";
import { TaskDetailFields } from "@/components/aufgaben/task-detail/task-detail-fields";
import { TaskCommentsSection } from "@/components/aufgaben/task-detail/task-comments-section";
import {
	snapshotsEqual,
	taskToSnapshot,
	textField,
	type TaskFormSnapshot,
} from "@/components/aufgaben/task-detail/utils";
import type {
	Task,
	TaskComment,
	TaskFrontmatter,
} from "@/types/aufgaben";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";

interface TaskDetailViewProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task?: Task;
	members: WorkspaceMemberSummary[];
	onSave: (
		slug: string,
		data: TaskFrontmatter,
		sha?: string,
		comments?: TaskComment[],
	) => Promise<void>;
	onDelete?: (task: Task) => void;
}

export function TaskDetailView({
	open,
	onOpenChange,
	task,
	members,
	onSave,
	onDelete,
}: TaskDetailViewProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const currentUser = useDashboardUser();
	const taskRef = useRef(task);
	const isCreate = task ? isDraftSlug(task.slug) : false;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState<Task["status"]>("todo");
	const [priority, setPriority] = useState<Task["priority"]>("medium");
	const [project, setProject] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [assignee, setAssignee] = useState("");
	const [comments, setComments] = useState<TaskComment[]>([]);
	const [newComment, setNewComment] = useState("");

	useEffect(() => {
		taskRef.current = task;
	}, [task]);

	const resetForm = useCallback(() => {
		if (!task) return;
		setTitle(task.title);
		setDescription(task.description ?? "");
		setStatus(task.status);
		setPriority(task.priority);
		setProject(textField(task.project));
		setDueDate(task.dueDate ?? "");
		setTags(Array.isArray(task.tags) ? task.tags : []);
		setAssignee(task.assignee ?? "");
		setComments(task.comments ?? []);
		setNewComment("");
	}, [task]);

	useEffect(() => {
		if (!open || !task) return;
		resetForm();
	}, [open, task?.slug, resetForm]);

	const resolveComments = useCallback((): TaskComment[] => {
		const text = newComment.trim();
		if (!text || !currentUser) return comments;
		return [
			...comments,
			{
				id: `c-${Date.now().toString(36)}`,
				authorId: currentUser.id,
				authorName: currentUser.name?.trim() || currentUser.email,
				text,
				createdAt: new Date().toISOString(),
			},
		];
	}, [comments, newComment, currentUser]);

	const getSnapshot = useCallback((): TaskFormSnapshot => {
		return {
			title: title.trim(),
			description: description.trim(),
			status,
			priority,
			project: textField(project).trim(),
			dueDate,
			tags,
			assignee,
			comments: resolveComments(),
		};
	}, [
		title,
		description,
		status,
		priority,
		project,
		dueDate,
		tags,
		assignee,
		resolveComments,
	]);

	const buildInitialSnapshot = useCallback((): TaskFormSnapshot => {
		return task ? taskToSnapshot(task) : getSnapshot();
	}, [task, getSnapshot]);

	const persistSnapshot = useCallback(
		async (snapshot: TaskFormSnapshot) => {
			const activeTask = taskRef.current;
			if (!activeTask) return;

			const slug = isDraftSlug(activeTask.slug)
				? slugify(snapshot.title)
				: activeTask.slug;

			await onSave(
				slug,
				{
					title: snapshot.title,
					description: snapshot.description || undefined,
					status: snapshot.status,
					priority: snapshot.priority,
					project: snapshot.project || undefined,
					dueDate: snapshot.dueDate || undefined,
					tags: snapshot.tags,
					assignee: snapshot.assignee || undefined,
					createdAt: activeTask.createdAt,
				},
				isDraftSlug(activeTask.slug) ? undefined : activeTask.sha,
				snapshot.comments,
			);

			if (newComment.trim()) {
				setComments(snapshot.comments);
				setNewComment("");
			}
		},
		[onSave, newComment],
	);

	const drawer = useDetailDrawer({
		open,
		onOpenChange,
		resetDep: task?.slug,
		getSnapshot,
		buildInitialSnapshot,
		isDirtyCompare: (a, b) => !snapshotsEqual(a, b),
		validate: () => {
			if (!title.trim()) return "Titel darf nicht leer sein";
			return null;
		},
		onSave: persistSnapshot,
		saveEnabled: vaultWriteEnabled,
	});

	if (!task) return null;

	const editorKey = isCreate ? "new-task" : task.slug;
	const srTitle = isCreate
		? "Neue Aufgabe"
		: title.trim() || "Aufgabe bearbeiten";

	return (
		<DetailDrawer
			open={open}
			onOpenChange={drawer.handleOpenChange}
			srTitle={srTitle}
			onClose={drawer.closeAndSaveInBackground}
			header={
				<TaskDetailHeader
					title={title}
					project={project}
					dueDate={dueDate}
					disabled={!vaultWriteEnabled}
					onTitleChange={setTitle}
				/>
			}
			footer={
				<DetailDrawerFooter
					onClose={drawer.closeAndSaveInBackground}
					onSave={drawer.persistAndStay}
					onDelete={
						onDelete && !isCreate && task.sha
							? () => onDelete(task)
							: undefined
					}
					saving={drawer.saving}
					isDirty={drawer.isDirty()}
					writeEnabled={vaultWriteEnabled}
				/>
			}
		>
			<div className="space-y-6">
				<TaskDetailFields
					editorKey={editorKey}
					title={title}
					description={description}
					status={status}
					priority={priority}
					project={project}
					dueDate={dueDate}
					tags={tags}
					assignee={assignee}
					members={members}
					disabled={!vaultWriteEnabled}
					onStatusChange={setStatus}
					onPriorityChange={setPriority}
					onProjectChange={setProject}
					onDueDateChange={setDueDate}
					onTagsChange={setTags}
					onAssigneeChange={setAssignee}
					onDescriptionChange={setDescription}
				/>

				{!isCreate ? (
					<TaskCommentsSection
						comments={comments}
						newComment={newComment}
						writeEnabled={vaultWriteEnabled}
						canAddComment={Boolean(currentUser)}
						onNewCommentChange={setNewComment}
						onAddComment={(comment) => setComments((prev) => [...prev, comment])}
						currentUser={currentUser}
					/>
				) : null}
			</div>
		</DetailDrawer>
	);
}
