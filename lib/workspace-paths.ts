import type { WorkspacePageData } from "@/lib/workspace-context";

const WORKSPACES_FALLBACK = "/workspaces";

/** Slug of the workspace page used for task links (first enabled Aufgaben page). */
export function resolveTasksPageSlug(
	pages: WorkspacePageData[] | undefined,
	preferredPageSlug?: string,
): string {
	if (preferredPageSlug?.trim()) return preferredPageSlug.trim();
	const match = pages?.find((p) => p.templateKey === "aufgaben" && p.isEnabled);
	return match?.slug ?? "aufgaben";
}

function resolveWorkspaceSlug(workspaceSlug: string | undefined): string {
	if (workspaceSlug?.trim()) return workspaceSlug.trim();
	return WORKSPACES_FALLBACK;
}

/** Build a dashboard module path under `/w/[workspaceSlug]/…`. */
export function workspaceModulePath(
	workspaceSlug: string | undefined,
	moduleSlug: string,
	...segments: string[]
): string {
	if (!workspaceSlug?.trim()) return WORKSPACES_FALLBACK;

	const tail = segments.filter(Boolean).join("/");
	const suffix = tail ? `/${tail}` : "";
	return `/w/${workspaceSlug}/${moduleSlug}${suffix}`;
}

export function projectDetailPath(workspaceSlug: string | undefined, projectSlug: string) {
	return workspaceModulePath(workspaceSlug, "projects", projectSlug);
}

export function projectsListPath(workspaceSlug: string | undefined) {
	return workspaceModulePath(workspaceSlug, "projects");
}

export function taskDetailPath(
	workspaceSlug: string | undefined,
	pageSlug: string,
	taskSlug: string,
) {
	return workspaceModulePath(workspaceSlug, pageSlug, taskSlug);
}

export function tasksListPath(workspaceSlug: string | undefined, pageSlug: string) {
	return workspaceModulePath(workspaceSlug, pageSlug);
}

export function ideaDetailPath(
	workspaceSlug: string | undefined,
	categorySlug: string,
	ideaSlug: string,
) {
	return workspaceModulePath(workspaceSlug, "produkt-ideen", categorySlug, ideaSlug);
}

export function ideasListPath(workspaceSlug: string | undefined) {
	return workspaceModulePath(workspaceSlug, "produkt-ideen");
}

export function clientDetailPath(workspaceSlug: string | undefined, clientSlug: string) {
	return workspaceModulePath(workspaceSlug, "clients", clientSlug);
}

export function clientsListPath(workspaceSlug: string | undefined) {
	return workspaceModulePath(workspaceSlug, "clients");
}

export function zeiterfassungPath(workspaceSlug: string | undefined) {
	return workspaceModulePath(workspaceSlug, "zeiterfassung");
}

export function vaultListPath(workspaceSlug: string | undefined) {
	return workspaceModulePath(workspaceSlug, "vault");
}

export function vaultItemPath(workspaceSlug: string | undefined, itemPath: string) {
	const base = vaultListPath(workspaceSlug);
	if (!itemPath) return base;
	return `${base}/${itemPath}`;
}

export { WORKSPACES_FALLBACK };
