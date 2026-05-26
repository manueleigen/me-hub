"use client";

import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KanbanEntityCard } from "@/components/entity/kanban-entity-card";
import { KanbanListPage } from "@/components/entity/kanban-list-page";
import { useKanbanListState } from "@/components/entity/use-kanban-list-state";
import { TaskDetailView } from "@/components/aufgaben/task-detail-view";
import { createDraftTask } from "@/components/aufgaben/task-detail/constants";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import {
	saveTask,
	deleteTask,
	updateTaskStatus,
} from "@/app/actions/aufgaben";
import { composeTaskBody } from "@/lib/aufgaben/task-file";
import {
	taskGroupIcon,
	taskKanbanColumns,
	taskListLabels,
	taskListStats,
	taskTableColumns,
	tasksByProject,
} from "@/lib/entity/modules/tasks";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/types/aufgaben";
import type {
	Task,
	TaskComment,
	TaskFrontmatter,
	TaskStatus,
} from "@/types/aufgaben";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";
import { useWorkspace } from "@/lib/workspace-context";
import { taskDetailPath } from "@/lib/workspace-paths";

export function AufgabenView({
	tasks: initialTasks,
	members = [],
}: {
	tasks: Task[];
	members?: WorkspaceMemberSummary[];
}) {
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const router = useRouter();

	const listState = useKanbanListState<Task>({
		initialItems: initialTasks,
		getItemKey: (t) => t.slug,
		getItemSha: (t) => t.sha,
		isDraftItem: (t) => isDraftSlug(t.slug),
		shouldSyncDetailTarget: (current, next) =>
			!current || current.slug === next.slug || isDraftSlug(current.slug),
		upsertItems: (items, optimistic) => {
			const slug = optimistic.slug;
			const isUpdate = items.some((t) => t.slug === slug);
			return isUpdate
				? items.map((t) => (t.slug === slug ? optimistic : t))
				: [...items, optimistic];
		},
		findPreviousItem: (items, optimistic) =>
			items.find((t) => t.slug === optimistic.slug),
		persistItem: async (optimistic, { previous }) => {
			const data: TaskFrontmatter = {
				title: optimistic.title,
				description: optimistic.description,
				status: optimistic.status,
				priority: optimistic.priority,
				project: optimistic.project,
				dueDate: optimistic.dueDate,
				tags: optimistic.tags,
				assignee: optimistic.assignee,
				createdAt: optimistic.createdAt,
			};
			const newSha = await saveTask(
				optimistic.slug,
				data,
				previous?.sha ?? optimistic.sha,
				optimistic.comments ?? [],
			);
			return newSha ? { ...optimistic, sha: newSha } : optimistic;
		},
		deleteItem: (task) => deleteTask(task.slug, task.sha!),
		updateItemStatus: (task, status) =>
			updateTaskStatus(task.slug, task.sha!, status as TaskStatus),
		applyStatus: (task, status) => ({
			...task,
			status: status as TaskStatus,
			comments: task.comments ?? [],
		}),
		deleteConfirmMessage: taskListLabels.deleteConfirm,
	});

	const handleSave = async (
		slug: string,
		data: TaskFrontmatter,
		sha?: string,
		comments: TaskComment[] = [],
	) => {
		const body = composeTaskBody(data.title, data.description ?? "");
		const optimistic: Task = {
			...data,
			slug,
			sha,
			body,
			comments,
			tags: data.tags ?? [],
		};
		await listState.persistWithOptimistic(optimistic, {
			previous: listState.items.find((t) => t.slug === slug),
		});
	};

	return (
		<KanbanListPage
			labels={taskListLabels}
			items={listState.items}
			isRefreshing={listState.isRefreshing}
			stats={taskListStats(listState.items)}
			kanbanColumns={taskKanbanColumns}
			statusConfig={STATUS_CONFIG}
			priorityConfig={PRIORITY_CONFIG}
			tableColumns={taskTableColumns}
			groups={tasksByProject(listState.items)}
			emptyGroupLabel="Ohne Projekt"
			groupIcon={taskGroupIcon}
			getItemKey={(t) => t.slug}
			getItemStatus={(t) => t.status}
			getTitle={(t) => t.title}
			getPriority={(t) => t.priority}
			onCreate={() => {
				listState.setDetailTarget(createDraftTask());
				listState.setDetailOpen(true);
			}}
			onOpenDetail={(task) =>
				router.push(taskDetailPath(workspaceSlug, task.slug))
			}
			onDelete={listState.handleDelete}
			onStatusChange={listState.handleStatusChange}
			detailOpen={listState.detailOpen}
			onDetailOpenChange={listState.setDetailOpen}
			detailItem={listState.resolveDetailItem(listState.detailTarget)}
			renderKanbanCard={(task, actions, onMoveToColumn) => (
				<KanbanEntityCard
					title={task.title}
					description={task.description}
					status={task.status}
					columns={taskKanbanColumns}
					priorityLabel={PRIORITY_CONFIG[task.priority]?.label}
					priorityClassName={PRIORITY_CONFIG[task.priority]?.color}
					meta={
						task.project ? (
							<Badge variant="outline" className="text-xs">
								{task.project}
							</Badge>
						) : undefined
					}
					onOpen={actions.onOpen}
					onDelete={actions.onDelete}
					onMoveToColumn={onMoveToColumn}
				/>
			)}
			renderGroupedTrailing={(task) =>
				task.dueDate ? (
					<span className="text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
						<Calendar className="size-3" />
						{new Date(task.dueDate + "T00:00:00").toLocaleDateString("de-DE", {
							day: "2-digit",
							month: "2-digit",
						})}
					</span>
				) : null
			}
			renderEditDrawer={({ open, onOpenChange, item }) => (
				<TaskDetailView
					open={open}
					onOpenChange={onOpenChange}
					task={item}
					members={members}
					onSave={handleSave}
					onDelete={(task) => {
						onOpenChange(false);
						listState.handleDelete(task);
					}}
				/>
			)}
		/>
	);
}
