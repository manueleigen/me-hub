"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard, type KanbanColumn } from "@/components/kanban-board";
import { SortableTable, type ColumnConfig } from "@/components/sortable-table";
import { TaskDetailView } from "@/components/aufgaben/task-detail-view";
import { createDraftTask } from "@/components/aufgaben/task-detail/constants";
import { TaskKanbanCard } from "@/components/aufgaben/task-kanban-card";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import { saveTask, deleteTask, updateTaskStatus } from "@/app/actions/aufgaben";
import { composeTaskBody } from "@/lib/aufgaben/task-file";
import { useVaultSync } from "@/lib/vault/sync-ui-context";
import { useSync } from "@/lib/vault/sync-context";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/aufgaben";
import type {
	Task,
	TaskComment,
	TaskFrontmatter,
	TaskStatus,
	TaskPriority,
} from "@/types/aufgaben";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";
import { useWorkspace } from "@/lib/workspace-context";
import { resolveTasksPageSlug, taskDetailPath } from "@/lib/workspace-paths";
import { cn } from "@/lib/utils";

const kanbanColumns: KanbanColumn[] = (
	Object.entries(STATUS_CONFIG) as [
		TaskStatus,
		{ label: string; color: string },
	][]
).map(([key, { label, color }]) => ({ key, label, color }));

const taskTableColumns: ColumnConfig<Task>[] = [
	{
		key: "title",
		label: "Titel",
		sortable: true,
		filterType: "text",
		getValue: (t) => t.title,
		render: (t) => (
			<div>
				<div className="font-medium">{t.title}</div>
				{t.description && (
					<div className="text-sm text-muted-foreground line-clamp-1">
						{t.description}
					</div>
				)}
			</div>
		),
	},
	{
		key: "status",
		label: "Status",
		sortable: true,
		filterType: "select",
		filterOptions: (Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => ({
			value: s,
			label: STATUS_CONFIG[s].label,
		})),
		getValue: (t) => t.status,
		render: (t) => (
			<Badge className={cn("text-white", STATUS_CONFIG[t.status]?.color)}>
				{STATUS_CONFIG[t.status]?.label}
			</Badge>
		),
	},
	{
		key: "priority",
		label: "Priorität",
		sortable: true,
		filterType: "select",
		filterOptions: (Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(
			(p) => ({
				value: p,
				label: PRIORITY_CONFIG[p].label,
			}),
		),
		getValue: (t) => t.priority,
		render: (t) => (
			<span className={cn("font-medium", PRIORITY_CONFIG[t.priority]?.color)}>
				{PRIORITY_CONFIG[t.priority]?.label}
			</span>
		),
	},
	{
		key: "dueDate",
		label: "Fällig",
		sortable: true,
		filterType: "none",
		getValue: (t) => t.dueDate ?? "",
		render: (t) =>
			t.dueDate ? (
				<span className="text-sm">
					{new Date(t.dueDate + "T00:00:00").toLocaleDateString("de-DE")}
				</span>
			) : (
				<span className="text-muted-foreground">–</span>
			),
	},
];

type ProjectTasksSectionProps = {
	projectKey: string;
	tasks: Task[];
	setTasks: Dispatch<SetStateAction<Task[]>>;
	members?: WorkspaceMemberSummary[];
	/** Kanban uses full content width; list can stay constrained. */
	kanbanFullWidth?: boolean;
	listMaxWidthClass?: string;
};

export function ProjectTasksSection({
	projectKey,
	tasks,
	setTasks,
	members = [],
	kanbanFullWidth = false,
	listMaxWidthClass,
}: ProjectTasksSectionProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const workspace = useWorkspace();
	const workspaceSlug = workspace?.workspace.slug;
	const tasksPageSlug = resolveTasksPageSlug(workspace?.workspace.pages);
	const router = useRouter();
	const { requestSyncAfterWrite } = useVaultSync();
	const { startSync, endSync } = useSync();
	const [view, setView] = useState<"kanban" | "list">("kanban");
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailTarget, setDetailTarget] = useState<Task | undefined>();

	const syncDetailTarget = (next: Task) => {
		setDetailTarget((current) =>
			!current || current.slug === next.slug || isDraftSlug(current.slug)
				? next
				: current,
		);
	};

	const openCreate = () => {
		setDetailTarget({ ...createDraftTask(), project: projectKey });
		setDetailOpen(true);
	};

	const openDetail = (task: Task) => {
		router.push(taskDetailPath(workspaceSlug, tasksPageSlug, task.slug));
	};

	const handleSave = async (
		slug: string,
		data: TaskFrontmatter,
		sha?: string,
		comments: TaskComment[] = [],
	) => {
		const body = composeTaskBody(data.title, data.description ?? "");
		const taskData: TaskFrontmatter = {
			...data,
			project: data.project?.trim() || projectKey,
		};
		const optimisticTask: Task = {
			...taskData,
			slug,
			sha,
			body,
			comments,
			tags: taskData.tags ?? [],
		};
		const isUpdate = Boolean(sha) || tasks.some((t) => t.slug === slug);
		const previousTask = tasks.find((t) => t.slug === slug);

		setTasks((prev) =>
			isUpdate
				? prev.map((t) => (t.slug === slug ? optimisticTask : t))
				: [...prev, optimisticTask],
		);
		syncDetailTarget(optimisticTask);

		startSync();
		try {
			const newSha = await saveTask(slug, taskData, sha, comments);
			const savedTask = newSha
				? { ...optimisticTask, sha: newSha }
				: optimisticTask;
			setTasks((prev) => prev.map((t) => (t.slug === slug ? savedTask : t)));
			syncDetailTarget(savedTask);
			void requestSyncAfterWrite();
		} catch {
			if (previousTask) {
				setTasks((prev) =>
					prev.map((t) => (t.slug === slug ? previousTask : t)),
				);
				syncDetailTarget(previousTask);
			} else {
				setTasks((prev) => prev.filter((t) => t.slug !== slug));
			}
			toast.error("Fehler beim Speichern");
			throw new Error("save failed");
		} finally {
			endSync();
		}
	};

	const handleDelete = (task: Task) => {
		if (!task.sha) return;
		if (!confirm("Aufgabe wirklich löschen?")) return;
		const previousTasks = tasks;

		setTasks((prev) => prev.filter((t) => t.slug !== task.slug));

		void (async () => {
			try {
				await deleteTask(task.slug, task.sha!);
				void requestSyncAfterWrite();
			} catch {
				setTasks(previousTasks);
				toast.error("Fehler beim Löschen");
			}
		})();
	};

	const handleStatusChange = async (task: Task, newStatus: string) => {
		if (!task.sha) return;
		const optimisticTask: Task = {
			...task,
			status: newStatus as TaskStatus,
			comments: task.comments ?? [],
		};

		setTasks((prev) =>
			prev.map((t) => (t.slug === task.slug ? optimisticTask : t)),
		);
		syncDetailTarget(optimisticTask);

		try {
			await updateTaskStatus(task.slug, task.sha, newStatus as TaskStatus);
			void requestSyncAfterWrite();
		} catch {
			setTasks((prev) => prev.map((t) => (t.slug === task.slug ? task : t)));
			syncDetailTarget(task);
			toast.error("Fehler beim Verschieben");
			throw new Error("status update failed");
		}
	};

	const headerClass = kanbanFullWidth
		? cn("flex items-start justify-start gap-[100px]")
		: "flex items-center justify-between gap-4";

	return (
		<section className="space-y-4 h-full flex flex-col min-h-0">
			<div className={headerClass}>
				<div>
					<h2 className="text-lg font-semibold">Aufgaben</h2>
					<p className="text-sm text-muted-foreground">
						{tasks.length} {tasks.length === 1 ? "Aufgabe" : "Aufgaben"} in
						diesem Projekt
					</p>
				</div>
				<Button onClick={openCreate} disabled={!vaultWriteEnabled} size="sm">
					<Plus className="mr-2 size-4" />
					Neue Aufgabe
				</Button>
			</div>

			{tasks.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed">
					<CheckSquare className="size-10 text-muted-foreground mb-3" />
					<h3 className="font-medium">Keine Aufgaben</h3>
					<p className="text-sm text-muted-foreground mt-1">
						Für dieses Projekt sind noch keine Aufgaben angelegt.
					</p>
					<Button
						className="mt-4"
						onClick={openCreate}
						disabled={!vaultWriteEnabled}
						size="sm"
					>
						<Plus className="size-4 mr-2" />
						Erste Aufgabe anlegen
					</Button>
				</div>
			) : (
				<Tabs
					value={view}
					onValueChange={(v) => setView(v as "kanban" | "list")}
					className={cn(
						"space-y-4 flex-1 flex flex-col min-h-0",
						kanbanFullWidth && view === "kanban" && "flex-1",
					)}
				>
					<TabsList className={cn(kanbanFullWidth && listMaxWidthClass)}>
						<TabsTrigger value="kanban">Kanban</TabsTrigger>
						<TabsTrigger value="list">Liste</TabsTrigger>
					</TabsList>

					<TabsContent
						value="kanban"
						className={cn(
							"mt-0 flex-1 min-h-0",
							kanbanFullWidth && "data-[state=inactive]:hidden",
						)}
					>
						<KanbanBoard
							columns={kanbanColumns}
							items={tasks}
							getItemKey={(task) => task.slug}
							getItemStatus={(task) => task.status}
							onStatusChange={handleStatusChange}
							renderCard={(task, onMoveToColumn) => (
								<TaskKanbanCard
									task={task}
									columns={kanbanColumns}
									onOpen={() => openDetail(task)}
									onDelete={() => handleDelete(task)}
									onMoveToColumn={onMoveToColumn}
								/>
							)}
						/>
					</TabsContent>

					<TabsContent value="list" className={cn("mt-0", listMaxWidthClass)}>
						<SortableTable
							columns={taskTableColumns}
							data={tasks}
							getRowKey={(task) => task.slug}
							onRowClick={openDetail}
							emptyMessage="Keine Aufgaben"
						/>
					</TabsContent>
				</Tabs>
			)}

			<TaskDetailView
				open={detailOpen}
				onOpenChange={setDetailOpen}
				task={
					detailTarget
						? (tasks.find((t) => t.slug === detailTarget.slug) ?? detailTarget)
						: undefined
				}
				members={members}
				onSave={handleSave}
				onDelete={(task) => {
					setDetailOpen(false);
					handleDelete(task);
				}}
			/>
		</section>
	);
}
