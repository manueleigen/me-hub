import { CheckSquare, FolderKanban } from "lucide-react";
import type { ColumnConfig } from "@/components/sortable-table";
import {
	buildPriorityColumn,
	buildStatusColumn,
	buildTitleColumn,
} from "@/components/entity/table-columns";
import {
	kanbanColumnsFromStatus,
	type KanbanListLabels,
	type KanbanListStats,
} from "@/lib/entity/types";
import {
	PRIORITY_CONFIG,
	STATUS_CONFIG,
	type Task,
	type TaskPriority,
	type TaskStatus,
} from "@/types/aufgaben";

export const taskListLabels: KanbanListLabels = {
	breadcrumb: "Aufgaben",
	title: "Aufgaben",
	subtitle: "Verwalte und verfolge deine Aufgaben.",
	createButton: "Neue Aufgabe",
	emptyIcon: CheckSquare,
	emptyTitle: "Keine Aufgaben",
	emptyDescription: "Lege deine erste Aufgabe an.",
	emptyCreateButton: "Erste Aufgabe anlegen",
	statsTotalSub: "Aufgaben",
	statsOpenSub: "Noch zu erledigen",
	statsInProgressSub: "In Bearbeitung",
	statsDoneSub: "Abgeschlossen",
	groupTabLabel: "Projekte",
	listEmptyMessage: "Keine Aufgaben",
	deleteConfirm: "Aufgabe wirklich löschen?",
};

export const taskKanbanColumns = kanbanColumnsFromStatus(STATUS_CONFIG);

export const taskTableColumns: ColumnConfig<Task>[] = [
	buildTitleColumn<Task>(),
	buildStatusColumn<Task>(
		STATUS_CONFIG,
		Object.keys(STATUS_CONFIG) as TaskStatus[],
	),
	buildPriorityColumn<Task>(
		PRIORITY_CONFIG,
		Object.keys(PRIORITY_CONFIG) as TaskPriority[],
	),
	{
		key: "project",
		label: "Projekt",
		sortable: true,
		filterType: "text",
		getValue: (t) => t.project ?? "",
		render: (t) => (
			<span className="text-muted-foreground">{t.project || "–"}</span>
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

export function taskListStats(tasks: Task[]): KanbanListStats {
	return {
		total: tasks.length,
		open: tasks.filter((t) => t.status === "todo").length,
		inProgress: tasks.filter((t) => t.status === "in-progress").length,
		done: tasks.filter((t) => t.status === "done").length,
	};
}

export function tasksByProject(tasks: Task[]): Record<string, Task[]> {
	return tasks.reduce<Record<string, Task[]>>((acc, task) => {
		const key = task.project || "Ohne Projekt";
		acc[key] = [...(acc[key] ?? []), task];
		return acc;
	}, {});
}

export const taskGroupIcon = (
	<FolderKanban className="size-4 text-muted-foreground" />
);
