import { FolderOpen } from "lucide-react";
import type { CatalogFilterTab, CatalogListLabels } from "@/lib/entity/types";
import type { Project } from "@/types/projects";

export const projectListLabels: CatalogListLabels = {
	breadcrumb: "Projekte",
	title: "Projekte",
	countLabel: (count) =>
		`${count} ${count === 1 ? "Projekt" : "Projekte"}`,
	createButton: "Neues Projekt",
	searchPlaceholder: "Projekte durchsuchen…",
	emptyIcon: FolderOpen,
	emptyTitle: "Keine Projekte",
	emptyDescriptionFiltered: "Keine Projekte gefunden. Filter anpassen?",
	emptyDescription: "Erstelle dein erstes Projekt.",
	emptyCreateButton: "Erstes Projekt anlegen",
	deleteConfirm: "Projekt wirklich löschen?",
};

export const projectFilterTabs: CatalogFilterTab[] = [
	{ value: "all", label: "Alle" },
	{ value: "freelance", label: "Freelance" },
	{ value: "job", label: "Job" },
	{ value: "personal", label: "Persönlich" },
];

export function projectMatchesFilter(project: Project, filter: string): boolean {
	return filter === "all" || project.type === filter;
}

export function projectMatchesSearch(project: Project, query: string): boolean {
	if (!query) return true;
	const q = query.toLowerCase();
	return (
		project.title.toLowerCase().includes(q) ||
		(project.clientName?.toLowerCase().includes(q) ?? false) ||
		project.category.some((c) => c.toLowerCase().includes(q)) ||
		project.tools.some((t) => t.toLowerCase().includes(q))
	);
}

const CLOSED_PROJECT_STATUSES = new Set(["completed"]);

/** Active portfolio entries (excludes completed). */
export function isOpenProject(project: Project): boolean {
	const status = project.status?.trim();
	if (!status) return true;
	return !CLOSED_PROJECT_STATUSES.has(status);
}

export function sortProjectsByDateDesc(a: Project, b: Project): number {
	if (!a.date && !b.date) return a.title.localeCompare(b.title, "de");
	if (!a.date) return 1;
	if (!b.date) return -1;
	return b.date.localeCompare(a.date);
}
