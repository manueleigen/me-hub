import { Users } from "lucide-react";
import type { CatalogFilterTab, CatalogListLabels } from "@/lib/entity/types";
import type { ClientStatus } from "@/types/clients";

export const clientListLabels: CatalogListLabels = {
	breadcrumb: "Kunden",
	title: "Kunden",
	countLabel: (count) =>
		`${count} ${count === 1 ? "Klient" : "Klienten"}`,
	createButton: "Neuer Klient",
	searchPlaceholder: "Klienten durchsuchen…",
	emptyIcon: Users,
	emptyTitle: "Keine Klienten",
	emptyDescriptionFiltered: "Keine Klienten gefunden. Filter anpassen?",
	emptyDescription: "Lege deinen ersten Klienten an.",
	emptyCreateButton: "Ersten Klienten anlegen",
	deleteConfirm: "Klient wirklich löschen?",
};

export const clientFilterTabs: CatalogFilterTab[] = [
	{ value: "all", label: "Alle" },
	{ value: "active", label: "Aktiv" },
	{ value: "prospect", label: "Interessenten" },
	{ value: "inactive", label: "Inaktiv" },
];

export function clientMatchesFilter(
	status: ClientStatus,
	filter: string,
): boolean {
	return filter === "all" || status === filter;
}
