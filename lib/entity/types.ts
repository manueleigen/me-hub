import type { ComponentType } from "react";
import type { KanbanColumn } from "@/components/kanban-board";
import type { StatCard } from "@/components/stats-grid";

export type FieldConfig = { label: string; color?: string };

export type StatusConfigMap = Record<string, FieldConfig & { color: string }>;
export type PriorityConfigMap = Record<string, FieldConfig>;

export function kanbanColumnsFromStatus(
	statusConfig: StatusConfigMap,
): KanbanColumn[] {
	return Object.entries(statusConfig).map(([key, { label, color }]) => ({
		key,
		label,
		color,
	}));
}

/** Kanban list pages (tasks, ideas) */
export type KanbanListLabels = {
	breadcrumb: string;
	title: string;
	subtitle: string;
	createButton: string;
	emptyIcon: ComponentType<{ className?: string }>;
	emptyTitle: string;
	emptyDescription: string;
	emptyCreateButton: string;
	statsTotalSub: string;
	statsOpenSub: string;
	statsInProgressSub: string;
	statsDoneSub: string;
	groupTabLabel: string;
	listEmptyMessage: string;
	deleteConfirm: string;
};

export type KanbanListStats = {
	total: number;
	open: number;
	inProgress: number;
	done: number;
};

export function defaultKanbanStatsCards(
	stats: KanbanListStats,
	labels: Pick<
		KanbanListLabels,
		"statsTotalSub" | "statsOpenSub" | "statsInProgressSub" | "statsDoneSub"
	>,
): StatCard[] {
	return [
		{ label: "Gesamt", value: stats.total, sub: labels.statsTotalSub },
		{ label: "Offen", value: stats.open, sub: labels.statsOpenSub },
		{
			label: "In Arbeit",
			value: stats.inProgress,
			sub: labels.statsInProgressSub,
			valueClassName: "text-blue-500",
		},
		{
			label: "Erledigt",
			value: stats.done,
			sub: labels.statsDoneSub,
			valueClassName: "text-green-500",
		},
	];
}

/** Card-grid catalog pages (clients, projects) */
export type CatalogListLabels = {
	breadcrumb: string;
	title: string;
	countLabel: (count: number) => string;
	createButton: string;
	searchPlaceholder: string;
	emptyIcon: ComponentType<{ className?: string }>;
	emptyTitle: string;
	emptyDescriptionFiltered: string;
	emptyDescription: string;
	emptyCreateButton: string;
	deleteConfirm: string;
};

export type CatalogFilterTab = { value: string; label: string };
