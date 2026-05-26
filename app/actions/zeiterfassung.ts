"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter";
import { revalidateTag } from "next/cache";
import { revalidateWorkspaceVaultCache, VAULT_CACHE_TAG } from "@/lib/cache/vault-tags";
import { getCachedMirrorReadContext } from "@/lib/cache/server";
import { buildZeiterfassungStats, type ZeiterfassungStatsPayload } from "@/lib/zeiterfassung/stats";
import {
  findOrphanedOpenTimeEntryDuplicates,
  getTimeEntriesPage,
  loadAllTimeEntries,
  mapTimeEntries,
  mergeOpenTimeEntries,
  OPEN_FOLDER,
  PAID_FOLDER,
  SESSIONS_FOLDER,
  type TimeEntriesPageParams,
  type TimeEntriesPageResult,
} from "@/lib/zeiterfassung/entries";
import { getListedFileFrontmatter } from "@/lib/vault/listed-file";
import { listMarkdownUnderPrefix } from "@/lib/vault/list-markdown";
import { resolveFileSha } from "@/lib/github/resolve-file-sha";
import { vaultModuleEntrySlugFromBasename } from "@/lib/vault/mirrorable-text-files";
import type {
  VaultTimeEntry,
  VaultTimeEntryFrontmatter,
  TrackingSessionStatus,
  TimeEntryFolder,
} from "@/types/zeiterfassung";

async function listEntriesFromFolder(
  folder: TimeEntryFolder,
  status: "open" | "paid",
  defaultTrackingStatus?: TrackingSessionStatus,
): Promise<VaultTimeEntry[]> {
  const files = await listMarkdownUnderPrefix(folder);

  return files
    .map((f) => {
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
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function listOpenEntries(): Promise<VaultTimeEntry[]> {
  const [open, sessions] = await Promise.all([
    listEntriesFromFolder(OPEN_FOLDER, "open", "tracked"),
    listEntriesFromFolder(SESSIONS_FOLDER, "open", "tracked"),
  ]);
  return mergeOpenTimeEntries(open, sessions);
}

export async function listPaidEntries(): Promise<VaultTimeEntry[]> {
  return listEntriesFromFolder(PAID_FOLDER, "paid", "paid");
}

/** Removes stale open/ copies when the same slug already exists under sessions/. */
export async function cleanupOrphanedOpenTimeEntryDuplicates(): Promise<string[]> {
  const [openFiles, sessionFiles] = await Promise.all([
    listMarkdownUnderPrefix(OPEN_FOLDER),
    listMarkdownUnderPrefix(SESSIONS_FOLDER),
  ]);

  const openEntries = mapTimeEntries(openFiles, "open", OPEN_FOLDER, "tracked");
  const sessionEntries = mapTimeEntries(sessionFiles, "open", SESSIONS_FOLDER, "tracked");
  const orphaned = findOrphanedOpenTimeEntryDuplicates(openEntries, sessionEntries);

  if (orphaned.length === 0) return [];

  const removed: string[] = [];

  for (const entry of orphaned) {
    const path = `${OPEN_FOLDER}/${entry.slug}.md`;
    const sha = await resolveFileSha(path, entry.sha);
    if (!sha) continue;

    try {
      await deleteGitHubFile(path, sha);
      removed.push(entry.slug);
    } catch (error) {
      console.error(`[zeiterfassung] failed to remove duplicate open entry ${entry.slug}`, error);
    }
  }

  if (removed.length > 0) {
    const ctx = await getCachedMirrorReadContext();
    if (ctx?.workspaceId) revalidateWorkspaceVaultCache(ctx.workspaceId);
    else {
      try {
        revalidateTag(VAULT_CACHE_TAG, "max");
      } catch {
        // Outside a Next.js request context.
      }
    }
  }

  return removed;
}

export async function fetchTimeEntriesPage(
  params: TimeEntriesPageParams,
): Promise<TimeEntriesPageResult> {
  const cleanedDuplicateSlugs = await cleanupOrphanedOpenTimeEntryDuplicates();
  const result = await getTimeEntriesPage(params);
  if (cleanedDuplicateSlugs.length === 0) return result;
  return { ...result, cleanedDuplicateSlugs };
}

export async function fetchZeiterfassungStats(): Promise<ZeiterfassungStatsPayload> {
  await cleanupOrphanedOpenTimeEntryDuplicates();
  const { open, paid } = await loadAllTimeEntries();
  return buildZeiterfassungStats([...open, ...paid]);
}

export async function listTrackerSessions(): Promise<VaultTimeEntry[]> {
  return listEntriesFromFolder(SESSIONS_FOLDER, "open");
}

export async function saveTimeEntry(
  slug: string,
  data: VaultTimeEntryFrontmatter,
  sha?: string,
  folder: TimeEntryFolder = OPEN_FOLDER,
): Promise<void> {
  const frontmatterData: Record<string, unknown> = {
    projectSlug: data.projectSlug,
    projectName: data.projectName,
    clientSlug: data.clientSlug ?? "",
    clientName: data.clientName ?? "",
    date: data.date,
    hours: data.hours,
    description: data.description,
    rate: data.rate,
    billable: data.billable,
  };
  const body = `# ${data.projectName} – ${data.date}\n\n${data.description}`;
  const content = serializeFrontmatter(frontmatterData, body);
  const path = `${folder}/${slug}.md`;
  await createOrUpdateGitHubFile(
    path,
    content,
    `${sha ? "Update" : "Add"} time entry: ${data.projectName} ${data.date}`,
    sha,
  );
}

export async function markEntriesAsPaid(entries: VaultTimeEntry[]): Promise<void> {
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.sha) return;
      const frontmatterData: Record<string, unknown> = {
        projectSlug: entry.projectSlug,
        projectName: entry.projectName,
        clientSlug: entry.clientSlug ?? "",
        clientName: entry.clientName ?? "",
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
        rate: entry.rate,
        billable: entry.billable,
      };
      const body = `# ${entry.projectName} – ${entry.date}\n\n${entry.description}`;
      const content = serializeFrontmatter(frontmatterData, body);
      await createOrUpdateGitHubFile(
        `${PAID_FOLDER}/${entry.slug}.md`,
        content,
        `Mark as paid: ${entry.projectName} ${entry.date}`,
      );
      if (entry.status === "open" && entry.sha) {
        await deleteGitHubFile(`${entry.folder}/${entry.slug}.md`, entry.sha);
      }
    }),
  );
}

export async function deleteVaultTimeEntry(
  slug: string,
  folder: TimeEntryFolder,
  sha: string,
): Promise<void> {
  await deleteGitHubFile(`${folder}/${slug}.md`, sha);
}

export async function saveTrackerSession(
  slug: string,
  data: VaultTimeEntryFrontmatter,
  sha?: string,
): Promise<void> {
  const frontmatterData: Record<string, unknown> = {
    projectSlug: data.projectSlug,
    projectName: data.projectName,
    clientSlug: data.clientSlug ?? "",
    clientName: data.clientName ?? "",
    date: data.date,
    hours: data.hours,
    description: data.description,
    rate: data.rate,
    billable: data.billable,
    trackingStatus: data.trackingStatus ?? "tracked",
    goalHours: data.goalHours ?? 8,
    segmentsJson: data.segmentsJson ?? "[]",
  };
  const body = `# ${data.projectName} – ${data.date}\n\n${data.description}`;
  const content = serializeFrontmatter(frontmatterData, body);
  const path = `${SESSIONS_FOLDER}/${slug}.md`;
  await createOrUpdateGitHubFile(
    path,
    content,
    `${sha ? "Update" : "Track"} session: ${data.projectName} ${data.date}`,
    sha,
  );
}

export async function updateSessionStatus(
  slug: string,
  folder: string,
  newStatus: TrackingSessionStatus,
  sha: string,
): Promise<void> {
  const path = `${folder}/${slug}.md`;
  const file = await getGitHubItem(path);
  if (!file || Array.isArray(file) || !("content" in file)) {
    throw new Error(`Session not found: ${slug}`);
  }
  const resolvedSha = await resolveFileSha(path, sha);
  if (!resolvedSha) {
    throw new Error(`Could not resolve file SHA for session: ${slug}`);
  }
  const { data, content: body } = parseFrontmatter(file.content as string);
  const frontmatterData: Record<string, unknown> = { ...data, trackingStatus: newStatus };
  const content = serializeFrontmatter(frontmatterData, body ?? "");
  await createOrUpdateGitHubFile(
    path,
    content,
    `Update status: ${slug} → ${newStatus}`,
    resolvedSha,
  );
}
