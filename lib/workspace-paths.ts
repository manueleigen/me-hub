const WORKSPACES_FALLBACK = "/workspaces";

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

export function taskDetailPath(workspaceSlug: string | undefined, taskSlug: string) {
	return workspaceModulePath(workspaceSlug, "aufgaben", taskSlug);
}

export function tasksListPath(workspaceSlug: string | undefined) {
	return workspaceModulePath(workspaceSlug, "aufgaben");
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
