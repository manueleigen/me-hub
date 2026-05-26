/** Registry of workspace page template kinds (module routes). */
export const WORKSPACE_PAGE_TEMPLATES = [
	{
		templateKey: "vault",
		defaultLabel: "Vault",
		defaultSlug: "vault",
		defaultIcon: "FolderOpen",
		defaultDataFolder: "/",
		navGroup: "main" as const,
	},
	{
		templateKey: "produkt-ideen",
		defaultLabel: "Produkt-Ideen",
		defaultSlug: "produkt-ideen",
		defaultIcon: "Lightbulb",
		defaultDataFolder: "product-ideas/",
		navGroup: "ideas" as const,
	},
	{
		templateKey: "aufgaben",
		defaultLabel: "Aufgaben",
		defaultSlug: "aufgaben",
		defaultIcon: "ListTodo",
		defaultDataFolder: "tasks/",
		navGroup: "ideas" as const,
	},
	{
		templateKey: "clients",
		defaultLabel: "Kunden",
		defaultSlug: "clients",
		defaultIcon: "Users",
		defaultDataFolder: "clients/",
		navGroup: "work" as const,
	},
	{
		templateKey: "projects",
		defaultLabel: "Projekte",
		defaultSlug: "projects",
		defaultIcon: "FolderKanban",
		defaultDataFolder: "projects/",
		navGroup: "work" as const,
	},
	{
		templateKey: "zeiterfassung",
		defaultLabel: "Zeiterfassung",
		defaultSlug: "zeiterfassung",
		defaultIcon: "Clock",
		defaultDataFolder: "time-tracking/",
		navGroup: "work" as const,
	},
] as const;

export type WorkspacePageTemplateKey = (typeof WORKSPACE_PAGE_TEMPLATES)[number]["templateKey"];
export type WorkspaceNavGroupKey = "main" | "ideas" | "work";

const TEMPLATE_BY_KEY = new Map(
	WORKSPACE_PAGE_TEMPLATES.map((t) => [t.templateKey, t]),
);

export function getWorkspacePageTemplate(templateKey: string) {
	return TEMPLATE_BY_KEY.get(templateKey as WorkspacePageTemplateKey);
}

export function isValidWorkspacePageTemplateKey(key: string): key is WorkspacePageTemplateKey {
	return TEMPLATE_BY_KEY.has(key as WorkspacePageTemplateKey);
}

/** Default sidebar sections for new workspaces (matches legacy hardcoded groups). */
export const DEFAULT_NAV_SECTIONS: {
	title: string | null;
	order: number;
	group: WorkspaceNavGroupKey;
}[] = [
	{ title: null, order: 0, group: "main" },
	{ title: "Ideen", order: 1, group: "ideas" },
	{ title: "Arbeit", order: 2, group: "work" },
];

export function navGroupForTemplateKey(templateKey: string): WorkspaceNavGroupKey {
	return getWorkspacePageTemplate(templateKey)?.navGroup ?? "main";
}

export const DEFAULT_WORKSPACE_PAGES = WORKSPACE_PAGE_TEMPLATES.map((t, order) => ({
	templateKey: t.templateKey,
	slug: t.defaultSlug,
	label: t.defaultLabel,
	icon: t.defaultIcon,
	order,
	isEnabled: true,
	config: { dataFolder: t.defaultDataFolder },
	navGroup: t.navGroup,
}));
