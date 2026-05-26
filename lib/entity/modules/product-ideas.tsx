import { Lightbulb } from "lucide-react";
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
	IDEA_CATEGORIES,
	PRIORITY_CONFIG,
	STATUS_CONFIG,
	type IdeaPriority,
	type IdeaStatus,
	type ProductIdea,
} from "@/types/produkt-ideen";

export const ideaListLabels: KanbanListLabels = {
	breadcrumb: "Produkt-Ideen",
	title: "Produkt-Ideen",
	subtitle: "Sammle und entwickle deine Produktideen.",
	createButton: "Neue Idee",
	emptyIcon: Lightbulb,
	emptyTitle: "Keine Ideen",
	emptyDescription: "Halte deine erste Produktidee fest.",
	emptyCreateButton: "Erste Idee anlegen",
	statsTotalSub: "Ideen",
	statsOpenSub: "Noch zu entwickeln",
	statsInProgressSub: "In Bearbeitung",
	statsDoneSub: "Live",
	groupTabLabel: "Kategorien",
	listEmptyMessage: "Keine Ideen",
	deleteConfirm: "Idee wirklich löschen?",
};

export const ideaKanbanColumns = kanbanColumnsFromStatus(STATUS_CONFIG);

export function ideaKey(idea: ProductIdea) {
	return `${idea.categorySlug}/${idea.slug}`;
}

export const ideaTableColumns: ColumnConfig<ProductIdea>[] = [
	buildTitleColumn<ProductIdea>(),
	buildStatusColumn<ProductIdea>(
		STATUS_CONFIG,
		Object.keys(STATUS_CONFIG) as IdeaStatus[],
	),
	buildPriorityColumn<ProductIdea>(
		PRIORITY_CONFIG,
		Object.keys(PRIORITY_CONFIG) as IdeaPriority[],
	),
	{
		key: "category",
		label: "Kategorie",
		sortable: true,
		filterType: "select",
		filterOptions: IDEA_CATEGORIES.map((c) => ({ value: c, label: c })),
		getValue: (i) => i.category,
		render: (i) => (
			<span className="text-muted-foreground">{i.category || "–"}</span>
		),
	},
	{
		key: "effortEstimate",
		label: "Aufwand",
		sortable: true,
		filterType: "none",
		getValue: (i) => i.effortEstimate ?? "",
		render: (i) =>
			i.effortEstimate ? (
				<span className="text-sm">{i.effortEstimate}</span>
			) : (
				<span className="text-muted-foreground">–</span>
			),
	},
];

export function ideaListStats(ideas: ProductIdea[]): KanbanListStats {
	return {
		total: ideas.length,
		open: ideas.filter((i) => i.status === "idea").length,
		inProgress: ideas.filter(
			(i) => i.status === "validating" || i.status === "building",
		).length,
		done: ideas.filter((i) => i.status === "launched").length,
	};
}

export function ideasByCategory(ideas: ProductIdea[]): Record<string, ProductIdea[]> {
	return ideas.reduce<Record<string, ProductIdea[]>>((acc, idea) => {
		const key = idea.category || "Ohne Kategorie";
		acc[key] = [...(acc[key] ?? []), idea];
		return acc;
	}, {});
}

export const ideaGroupIcon = (
	<Lightbulb className="size-4 text-muted-foreground" />
);
