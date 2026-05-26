import { getGitHubItem } from "@/app/actions/github";
import { getCachedMirrorReadContext } from "@/lib/cache/server";
import {
	getMirrorMarkdownFiles,
	getMirrorMarkdownListFiles,
	getMirrorMarkdownListFilesByPrefixes,
	type MirrorListFile,
} from "@/lib/mirror/bulk-read";
import {
	isVaultModuleEntryFile,
	shouldMirrorVaultFilePath,
} from "@/lib/vault/mirrorable-text-files";

const PLACEHOLDER_SHA = "mirror";
const GITHUB_CONCURRENCY = 6;

export type ListedMarkdownFile = {
	path: string;
	content: string;
	sha: string;
	name: string;
	/** Parsed at sync time — avoids loading full markdown body on list pages. */
	frontmatter?: Record<string, unknown>;
};

function isListableTextFile(name: string, path: string): boolean {
	return shouldMirrorVaultFilePath(path);
}

function mirrorListToListed(files: MirrorListFile[]): ListedMarkdownFile[] {
	return files.map((f) => {
		let frontmatter: Record<string, unknown> | undefined;
		if (f.frontmatterJson) {
			try {
				frontmatter = JSON.parse(f.frontmatterJson) as Record<string, unknown>;
			} catch {
				frontmatter = undefined;
			}
		}
		return {
			path: f.path,
			content: f.content ?? "",
			sha: f.blobSha ?? PLACEHOLDER_SHA,
			name: f.path.split("/").pop() ?? f.path,
			...(frontmatter ? { frontmatter } : {}),
		};
	});
}

function logListPath(prefix: string, useMirror: boolean, count: number) {
	if (process.env.NODE_ENV !== "development") return;
	console.info(
		`[vault-list] prefix=${prefix} mirror=${useMirror} files=${count}`,
	);
}

async function mapPool<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let nextIndex = 0;

	async function worker(): Promise<void> {
		while (true) {
			const i = nextIndex++;
			if (i >= items.length) return;
			results[i] = await fn(items[i]);
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () =>
			worker(),
		),
	);
	return results;
}

async function listMarkdownViaGitHubRecursive(
	prefix: string,
): Promise<ListedMarkdownFile[]> {
	const dir = await getGitHubItem(prefix);
	if (!dir || !Array.isArray(dir)) return [];

	const results: ListedMarkdownFile[] = [];
	const entries = dir as {
		name: string;
		path: string;
		sha: string;
		type: string;
	}[];

	const files = entries.filter(
		(e) =>
			e.type === "file" &&
			isListableTextFile(e.name, e.path) &&
			isVaultModuleEntryFile(e.path),
	);
	const dirs = entries.filter((e) => e.type === "dir");

	const fileResults = await mapPool(files, GITHUB_CONCURRENCY, async (entry) => {
		const file = await getGitHubItem(entry.path);
		if (!file || Array.isArray(file) || !("content" in file)) return null;
		return {
			path: entry.path,
			content: file.content as string,
			sha: (file as { sha?: string }).sha ?? "",
			name: entry.name,
		} satisfies ListedMarkdownFile;
	});

	for (const f of fileResults) {
		if (f) results.push(f);
	}

	const nested = await mapPool(dirs, GITHUB_CONCURRENCY, (entry) =>
		listMarkdownViaGitHubRecursive(entry.path),
	);
	for (const batch of nested) {
		results.push(...batch);
	}

	return results;
}

/**
 * Lists all markdown files under a vault prefix (one DB query when mirror is ready).
 */
export async function listMarkdownUnderPrefix(
	prefix: string,
): Promise<ListedMarkdownFile[]> {
	const ctx = await getCachedMirrorReadContext();
	if (ctx?.useMirror) {
		const files = await getMirrorMarkdownListFiles(ctx.workspaceId, prefix);
		const listed = mirrorListToListed(files).filter((f) =>
			isVaultModuleEntryFile(f.path),
		);
		logListPath(prefix, true, listed.length);
		return listed;
	}

	const listed = await listMarkdownViaGitHubRecursive(prefix);
	logListPath(prefix, false, listed.length);
	return listed;
}

/** Mirror-only multi-prefix list (for unstable_cache loaders). */
export async function listMarkdownUnderPrefixesForWorkspace(
	workspaceId: string,
	prefixes: string[],
): Promise<ListedMarkdownFile[]> {
	const files = await getMirrorMarkdownListFilesByPrefixes(workspaceId, prefixes);
	return mirrorListToListed(files).filter((f) => isVaultModuleEntryFile(f.path));
}

/**
 * Lists markdown under multiple prefixes in a single mirror query.
 */
export async function listMarkdownUnderPrefixes(
	prefixes: string[],
): Promise<ListedMarkdownFile[]> {
	const ctx = await getCachedMirrorReadContext();
	if (ctx?.useMirror) {
		const listed = await listMarkdownUnderPrefixesForWorkspace(ctx.workspaceId, prefixes);
		if (process.env.NODE_ENV === "development") {
			console.info(
				`[vault-list] prefixes=${prefixes.join(",")} mirror=true files=${listed.length}`,
			);
		}
		return listed;
	}

	const batches = await Promise.all(
		prefixes.map((p) => listMarkdownViaGitHubRecursive(p)),
	);
	return batches.flat();
}

/** Full bodies — for code paths that need markdown content from mirror. */
export async function listMarkdownUnderPrefixWithContent(
	prefix: string,
): Promise<ListedMarkdownFile[]> {
	const ctx = await getCachedMirrorReadContext();
	if (ctx?.useMirror) {
		const files = await getMirrorMarkdownFiles(ctx.workspaceId, prefix);
		return files.map((f) => ({
			path: f.path,
			content: f.content,
			sha: f.blobSha ?? PLACEHOLDER_SHA,
			name: f.path.split("/").pop() ?? f.path,
		}));
	}
	return listMarkdownViaGitHubRecursive(prefix);
}
