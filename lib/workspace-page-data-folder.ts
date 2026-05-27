import { getWorkspacePageTemplate } from "@/lib/workspace-page-templates";

/** Strip leading/trailing slashes — vault paths are never rooted with `/`. */
export function normalizeVaultFolder(folder: string): string {
	return folder.replace(/^\/+/, "").replace(/\/+$/, "");
}

/**
 * Resolved vault folder for a workspace page (from config or template default).
 * Returns empty string for vault root pages.
 */
export function getPageDataFolder(
	config: Record<string, unknown> | null | undefined,
	templateKey: string,
): string {
	const fromConfig =
		typeof config?.dataFolder === "string" ? config.dataFolder.trim() : "";
	if (fromConfig && fromConfig !== "/") {
		return normalizeVaultFolder(fromConfig);
	}
	const template = getWorkspacePageTemplate(templateKey);
	const fallback = template?.defaultDataFolder ?? "";
	if (!fallback || fallback === "/") return "";
	return normalizeVaultFolder(fallback);
}

/** Tasks module folder (e.g. `tasks` or `tasks/backlog`). */
export function getTasksFolderFromPage(
	config: Record<string, unknown> | null | undefined,
	templateKey: string,
): string {
	const folder = getPageDataFolder(config, templateKey);
	return folder || "tasks";
}
