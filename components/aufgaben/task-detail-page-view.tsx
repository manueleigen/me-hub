"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, FolderKanban } from "lucide-react";
import { DetailField } from "@/components/entity-detail/detail-field";
import { EntityDetailPageLayout } from "@/components/entity/entity-detail-page-layout";
import {
	DetailFieldsGrid,
	StatusPriorityBadges,
	StatusPriorityDetailFields,
	TagsDetailField,
	TextDetailField,
} from "@/components/entity/detail-fields";
import { RelatedLinksSection } from "@/components/entity/linked-section-card";
import { TaskDetailView } from "@/components/aufgaben/task-detail-view";
import { TaskTimeTrackerWidget } from "@/components/aufgaben/task-time-tracker-widget";
import { saveTask, deleteTask } from "@/app/actions/aufgaben";
import { composeTaskBody } from "@/lib/aufgaben/task-file";
import { useWorkspace } from "@/lib/workspace-context";
import {
	projectDetailPath,
	tasksListPath,
	taskDetailPath,
} from "@/lib/workspace-paths";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/aufgaben";
import type {
	Task,
	TaskComment,
	TaskFrontmatter,
} from "@/types/aufgaben";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";

type TaskDetailPageViewProps = {
	task: Task;
	project: Project | null;
	relatedTasks: Task[];
	projects: Project[];
	clients: Client[];
	members?: WorkspaceMemberSummary[];
	pageSlug?: string;
	tasksFolder?: string;
	pageLabel?: string;
};

export function TaskDetailPageView({
	task: initialTask,
	project,
	relatedTasks,
	projects,
	clients,
	members = [],
	pageSlug = "aufgaben",
	tasksFolder = "tasks",
	pageLabel = "Aufgaben",
}: TaskDetailPageViewProps) {
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const router = useRouter();

	const [task, setTask] = useState(initialTask);
	const [comments, setComments] = useState(initialTask.comments ?? []);

	useEffect(() => {
		setTask(initialTask);
		setComments(initialTask.comments ?? []);
	}, [initialTask]);

	const assigneeLabel = members.find((m) => m.userId === task.assignee);

	const handleSave = async (
		slug: string,
		data: TaskFrontmatter,
		sha?: string,
		nextComments: TaskComment[] = comments,
	) => {
		await saveTask(slug, data, sha ?? task.sha, nextComments, tasksFolder);
		const saved: Task = {
			...data,
			slug,
			sha: task.sha,
			body: composeTaskBody(data.title, data.description ?? ""),
			comments: nextComments,
			tags: data.tags ?? [],
		};
		setTask(saved);
		setComments(nextComments);
		if (slug !== task.slug) {
			router.replace(taskDetailPath(workspaceSlug, pageSlug, slug));
		}
	};

	const handleAddComment = async (comment: TaskComment) => {
		await handleSave(
			task.slug,
			{
				title: task.title,
				description: task.description,
				status: task.status,
				priority: task.priority,
				project: task.project,
				dueDate: task.dueDate,
				tags: task.tags,
				assignee: task.assignee,
				createdAt: task.createdAt,
			},
			task.sha,
			[...comments, comment],
		);
	};

	const handleDelete = async () => {
		if (!task.sha) return;
		await deleteTask(task.slug, task.sha, tasksFolder);
		toast.success("Aufgabe gelöscht");
		router.push(tasksListPath(workspaceSlug, pageSlug));
	};

	return (
		<EntityDetailPageLayout
			listLabel={pageLabel}
			listHref={tasksListPath(workspaceSlug, pageSlug)}
			title={task.title}
			badges={
				<StatusPriorityBadges
					status={task.status}
					priority={task.priority}
					statusConfig={STATUS_CONFIG}
					priorityConfig={PRIORITY_CONFIG}
				/>
			}
			sha={task.sha}
			comments={comments}
			onCommentsChange={setComments}
			onAddComment={handleAddComment}
			deleteDialogTitle="Aufgabe löschen?"
			editAriaLabel="Aufgabe bearbeiten"
			deleteAriaLabel="Aufgabe löschen"
			onDelete={handleDelete}
			details={
				<DetailFieldsGrid>
					<StatusPriorityDetailFields
						status={task.status}
						priority={task.priority}
						statusConfig={STATUS_CONFIG}
						priorityConfig={PRIORITY_CONFIG}
					/>
					{task.project ? (
						<DetailField label="Projekt">
							{project ? (
								<Link
									href={projectDetailPath(workspaceSlug, project.slug)}
									className="font-medium hover:underline inline-flex items-center gap-1"
								>
									{project.title}
									<ExternalLink className="size-3" />
								</Link>
							) : (
								<span>{task.project}</span>
							)}
						</DetailField>
					) : null}
					{task.dueDate ? (
						<TextDetailField
							label="Fällig"
							value={new Date(task.dueDate + "T00:00:00").toLocaleDateString(
								"de-DE",
							)}
						/>
					) : null}
					{assigneeLabel ? (
						<TextDetailField
							label="Zugewiesen"
							value={assigneeLabel.name ?? assigneeLabel.email}
						/>
					) : null}
					<TagsDetailField tags={task.tags} />
					<TextDetailField
						label="Beschreibung"
						value={task.description}
						className="sm:col-span-2"
						prose
					/>
				</DetailFieldsGrid>
			}
			narrowContent={
				<>
					<TaskTimeTrackerWidget
						task={task}
						projects={projects}
						clients={clients}
					/>
					{project ? (
						<RelatedLinksSection
							title="Weitere Aufgaben im Projekt"
							linkHref={projectDetailPath(workspaceSlug, project.slug)}
							linkLabel="Projekt öffnen"
							emptyMessage="Keine weiteren Aufgaben in diesem Projekt."
							icon={<FolderKanban className="size-4" />}
							items={relatedTasks}
							getItemKey={(t) => t.slug}
							getHref={(t) => taskDetailPath(workspaceSlug, pageSlug, t.slug)}
							getTitle={(t) => t.title}
							getStatus={(t) => t.status}
							statusConfig={STATUS_CONFIG}
						/>
					) : null}
				</>
			}
			renderEditDrawer={({ open, onOpenChange }) => (
				<TaskDetailView
					open={open}
					onOpenChange={onOpenChange}
					task={task}
					members={members}
					onSave={handleSave}
					onDelete={() => void handleDelete()}
				/>
			)}
		/>
	);
}
