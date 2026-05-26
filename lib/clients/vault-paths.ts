import type { ListedMarkdownFile } from "@/lib/vault/list-markdown";
import {
	isVaultModuleEntryFile,
	vaultModuleEntrySlugFromBasename,
} from "@/lib/vault/mirrorable-text-files";

export const CLIENTS_FOLDER = "clients";

/** Flat `clients/{slug}`, `clients/{slug}.md`, `clients/{slug}.txt` (preference order). */
export function flatClientPathCandidates(slug: string): string[] {
	return [
		`${CLIENTS_FOLDER}/${slug}.md`,
		`${CLIENTS_FOLDER}/${slug}.txt`,
		`${CLIENTS_FOLDER}/${slug}`,
	];
}

function isFlatClientPath(path: string, slug: string): boolean {
	return flatClientPathCandidates(slug).includes(path);
}

/**
 * Vault layout (AGENTS.md): `clients/[Name]/[slug].md` or flat `clients/[slug].md`
 * Also accepts `.txt` and extensionless entry files.
 */
export function clientSlugFromVaultPath(path: string): string | null {
	const prefix = `${CLIENTS_FOLDER}/`;
	if (!path.startsWith(prefix) || !isVaultModuleEntryFile(path)) return null;

	const name = path.split("/").pop() ?? "";
	if (name.startsWith("_")) return null;

	const relative = path.slice(prefix.length);
	const parts = relative.split("/").filter(Boolean);

	if (parts.length === 1) {
		return vaultModuleEntrySlugFromBasename(parts[0]);
	}

	if (parts.length >= 2) {
		return parts[0];
	}

	return null;
}

export function clientDisplayName(
	data: Record<string, unknown>,
	slug: string,
): string {
	const name = data.name ?? data.client;
	if (typeof name === "string" && name.trim()) return name.trim();
	return slug;
}

function nestedClientEntryPaths(paths: string[], slug: string): string[] {
	const prefix = `${CLIENTS_FOLDER}/${slug}/`;
	return paths.filter(
		(p) =>
			p.startsWith(prefix) &&
			isVaultModuleEntryFile(p) &&
			!p.split("/").pop()!.startsWith("_"),
	);
}

export function resolveClientVaultPath(paths: string[], slug: string): string | null {
	for (const flat of flatClientPathCandidates(slug)) {
		if (paths.includes(flat)) return flat;
	}

	const nested = nestedClientEntryPaths(paths, slug);
	if (nested.length === 0) return null;

	const preferred = [
		`${CLIENTS_FOLDER}/${slug}/${slug}.md`,
		`${CLIENTS_FOLDER}/${slug}/${slug}.txt`,
		`${CLIENTS_FOLDER}/${slug}/${slug}`,
		...nested.filter((p) => /\/overview\.(md|txt)$/i.test(p) || p.endsWith("/overview")),
		...nested.filter((p) => /\/index\.(md|txt)$/i.test(p) || p.endsWith("/index")),
		...nested.sort((a, b) => a.localeCompare(b, "de")),
	];

	return preferred.find((p) => nested.includes(p)) ?? nested[0];
}

/** One row per client (folder name or flat slug), not per project file. */
export function groupListedFilesByClient(
	files: ListedMarkdownFile[],
): Map<string, ListedMarkdownFile> {
	const bySlug = new Map<string, ListedMarkdownFile>();
	const flatPriority = (path: string, slug: string) =>
		flatClientPathCandidates(slug).indexOf(path);

	for (const file of files) {
		const slug = clientSlugFromVaultPath(file.path);
		if (!slug) continue;

		const existing = bySlug.get(slug);
		if (!existing) {
			bySlug.set(slug, file);
			continue;
		}

		const fileFlat = isFlatClientPath(file.path, slug);
		const existingFlat = isFlatClientPath(existing.path, slug);

		if (fileFlat && !existingFlat) {
			bySlug.set(slug, file);
			continue;
		}

		if (fileFlat && existingFlat) {
			if (flatPriority(file.path, slug) < flatPriority(existing.path, slug)) {
				bySlug.set(slug, file);
			}
		}
	}

	return bySlug;
}
