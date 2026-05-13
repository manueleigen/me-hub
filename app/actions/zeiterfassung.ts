"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter";
import type { VaultTimeEntry, VaultTimeEntryFrontmatter } from "@/types/zeiterfassung";

const OPEN_FOLDER = "time-tracking/open";
const PAID_FOLDER = "time-tracking/paid";

async function listEntriesFromFolder(
  folder: string,
  status: "open" | "paid",
): Promise<VaultTimeEntry[]> {
  const dir = await getGitHubItem(folder);
  if (!dir || !Array.isArray(dir)) return [];

  const mdFiles = (
    dir as { name: string; path: string; sha: string; type: string }[]
  ).filter((f) => f.type === "file" && f.name.endsWith(".md") && !f.name.startsWith("_"));

  const entries = await Promise.all(
    mdFiles.map(async (f) => {
      const file = await getGitHubItem(f.path);
      if (!file || Array.isArray(file) || !("content" in file)) return null;
      const { data } = parseFrontmatter(file.content as string);
      const slug = f.name.replace(/\.md$/, "");
      const entry: VaultTimeEntry = {
        slug,
        sha: (file as { sha?: string }).sha,
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
      };
      return entry;
    }),
  );

  return entries
    .filter((e): e is VaultTimeEntry => e !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function listOpenEntries(): Promise<VaultTimeEntry[]> {
  return listEntriesFromFolder(OPEN_FOLDER, "open");
}

export async function listPaidEntries(): Promise<VaultTimeEntry[]> {
  return listEntriesFromFolder(PAID_FOLDER, "paid");
}

export async function saveTimeEntry(
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
  };
  const body = `# ${data.projectName} – ${data.date}\n\n${data.description}`;
  const content = serializeFrontmatter(frontmatterData, body);
  const path = `${OPEN_FOLDER}/${slug}.md`;
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
      await deleteGitHubFile(`${OPEN_FOLDER}/${entry.slug}.md`, entry.sha);
    }),
  );
}

export async function deleteVaultTimeEntry(
  slug: string,
  status: "open" | "paid",
  sha: string,
): Promise<void> {
  const folder = status === "open" ? OPEN_FOLDER : PAID_FOLDER;
  await deleteGitHubFile(`${folder}/${slug}.md`, sha);
}
