import { cache } from "react";
import { unstable_cache } from "next/cache";
import { listMarkdownUnderPrefix } from "@/lib/vault/list-markdown";
import {
	listMarkdownUnderPrefixesForWorkspace,
	type ListedMarkdownFile,
} from "@/lib/vault/list-markdown";
import { getCachedMirrorReadContext } from "@/lib/cache/server";
import { VAULT_CACHE_TAG } from "@/lib/cache/vault-tags";
import type { VaultTimeEntry } from "@/types/zeiterfassung";
import {
	mergeOpenTimeEntries,
	mapTimeEntries,
	OPEN_FOLDER,
	PAID_FOLDER,
	SESSIONS_FOLDER,
} from "@/lib/zeiterfassung/entry-utils";

export {
	mergeOpenTimeEntries,
	findOrphanedOpenTimeEntryDuplicates,
	mapTimeEntries,
	OPEN_FOLDER,
	PAID_FOLDER,
	SESSIONS_FOLDER,
} from "@/lib/zeiterfassung/entry-utils";

function filesUnderPrefix(files: ListedMarkdownFile[], prefix: string): ListedMarkdownFile[] {
	const normalized = prefix.replace(/\/$/, "");
	return files.filter(
		(f) => f.path === normalized || f.path.startsWith(`${normalized}/`),
	);
}

async function listEntriesViaGitHub(): Promise<{ open: VaultTimeEntry[]; paid: VaultTimeEntry[] }> {
	const [openFiles, paidFiles, sessionFiles] = await Promise.all([
		listMarkdownUnderPrefix(OPEN_FOLDER),
		listMarkdownUnderPrefix(PAID_FOLDER),
		listMarkdownUnderPrefix(SESSIONS_FOLDER),
	]);

	const open = mergeOpenTimeEntries(
		mapTimeEntries(openFiles, "open", OPEN_FOLDER, "tracked"),
		mapTimeEntries(sessionFiles, "open", SESSIONS_FOLDER, "tracked"),
	);

	return {
		open,
		paid: mapTimeEntries(paidFiles, "paid", PAID_FOLDER, "paid"),
	};
}

async function loadEntriesMirrorUncached(workspaceId: string) {
	const all = await listMarkdownUnderPrefixesForWorkspace(workspaceId, [
		OPEN_FOLDER,
		PAID_FOLDER,
		SESSIONS_FOLDER,
	]);

	const open = mergeOpenTimeEntries(
		mapTimeEntries(filesUnderPrefix(all, OPEN_FOLDER), "open", OPEN_FOLDER, "tracked"),
		mapTimeEntries(
			filesUnderPrefix(all, SESSIONS_FOLDER),
			"open",
			SESSIONS_FOLDER,
			"tracked",
		),
	);

	return {
		openEntries: open,
		paidEntries: mapTimeEntries(
			filesUnderPrefix(all, PAID_FOLDER),
			"paid",
			PAID_FOLDER,
			"paid",
		),
	};
}

export const loadZeiterfassungEntriesMirror = cache(async (workspaceId: string) => {
	return unstable_cache(
		() => loadEntriesMirrorUncached(workspaceId),
		["zeiterfassung-entries", workspaceId],
		{
			tags: [VAULT_CACHE_TAG, `${VAULT_CACHE_TAG}-ws-${workspaceId}`],
			revalidate: 30,
		},
	)();
});

/** Loads all open + paid entries (for pagination slices and stats). */
export async function loadAllTimeEntries(): Promise<{
	open: VaultTimeEntry[];
	paid: VaultTimeEntry[];
}> {
	const ctx = await getCachedMirrorReadContext();
	if (ctx?.useMirror) {
		const data = await loadZeiterfassungEntriesMirror(ctx.workspaceId);
		return { open: data.openEntries, paid: data.paidEntries };
	}
	return listEntriesViaGitHub();
}

export type TimeEntriesPageParams = {
	status: "open" | "paid";
	page: number;
	pageSize: number;
};

export type TimeEntriesPageResult = {
	entries: VaultTimeEntry[];
	total: number;
	totalOpen: number;
	totalPaid: number;
	page: number;
	pageSize: number;
	/** Slugs removed from open/ because sessions/ already had them. */
	cleanedDuplicateSlugs?: string[];
};

export async function getTimeEntriesPage(
	params: TimeEntriesPageParams,
): Promise<TimeEntriesPageResult> {
	const { open, paid } = await loadAllTimeEntries();
	const pool = params.status === "open" ? open : paid;
	const page = Math.max(1, params.page);
	const pageSize = params.pageSize;
	const start = (page - 1) * pageSize;

	return {
		entries: pool.slice(start, start + pageSize),
		total: pool.length,
		totalOpen: open.length,
		totalPaid: paid.length,
		page,
		pageSize,
	};
}
