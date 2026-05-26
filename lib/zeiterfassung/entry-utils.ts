import { getListedFileFrontmatter } from "@/lib/vault/listed-file";
import { vaultModuleEntrySlugFromBasename } from "@/lib/vault/mirrorable-text-files";
import type { ListedMarkdownFile } from "@/lib/vault/list-markdown";
import type {
	VaultTimeEntry,
	TrackingSessionStatus,
	TimeEntryFolder,
} from "@/types/zeiterfassung";

export const OPEN_FOLDER = "time-tracking/open";
export const PAID_FOLDER = "time-tracking/paid";
export const SESSIONS_FOLDER = "time-tracking/sessions";

/** Prefer sessions copy when the same slug exists in open + sessions (stale duplicate). */
export function mergeOpenTimeEntries(
	openEntries: VaultTimeEntry[],
	sessionEntries: VaultTimeEntry[],
): VaultTimeEntry[] {
	const bySlug = new Map<string, VaultTimeEntry>();
	for (const entry of openEntries) bySlug.set(entry.slug, entry);
	for (const entry of sessionEntries) bySlug.set(entry.slug, entry);
	return Array.from(bySlug.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/** Open-folder copies whose slug also exists under sessions/ (stale after tracker edit). */
export function findOrphanedOpenTimeEntryDuplicates(
	openEntries: VaultTimeEntry[],
	sessionEntries: VaultTimeEntry[],
): VaultTimeEntry[] {
	const sessionSlugs = new Set(sessionEntries.map((e) => e.slug));
	return openEntries.filter((e) => sessionSlugs.has(e.slug));
}

export function mapTimeEntries(
	files: ListedMarkdownFile[],
	status: "open" | "paid",
	folder: TimeEntryFolder,
	defaultTrackingStatus?: TrackingSessionStatus,
): VaultTimeEntry[] {
	return files
		.map((f) => {
			if (f.name.startsWith("_")) return null;
			const data = getListedFileFrontmatter(f);
			const slug = vaultModuleEntrySlugFromBasename(f.name);
			const entry: VaultTimeEntry = {
				slug,
				sha: f.sha,
				folder,
				status,
				projectSlug: (data.projectSlug as string) ?? "",
				projectName: (data.projectName as string) ?? "",
				clientSlug: data.clientSlug as string | undefined,
				clientName: data.clientName as string | undefined,
				date: (data.date as string) ?? "",
				hours: (data.hours as number) ?? 0,
				description: (data.description as string) ?? "",
				rate: (data.rate as number) ?? 0,
				billable: (data.billable as boolean) ?? false,
				trackingStatus:
					(data.trackingStatus as TrackingSessionStatus | undefined) ??
					defaultTrackingStatus,
				goalHours: data.goalHours as number | undefined,
				segmentsJson: data.segmentsJson as string | undefined,
			};
			return entry;
		})
		.filter((e): e is VaultTimeEntry => e !== null)
		.sort((a, b) => b.date.localeCompare(a.date));
}
