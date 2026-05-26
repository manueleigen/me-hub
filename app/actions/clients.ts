"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter";
import { getListedFileFrontmatter } from "@/lib/vault/listed-file";
import { mapListedFileToClient } from "@/lib/clients/map-client";
import {
	CLIENTS_FOLDER,
	clientDisplayName,
	groupListedFilesByClient,
	resolveClientVaultPath,
} from "@/lib/clients/vault-paths";
import { listMarkdownUnderPrefix } from "@/lib/vault/list-markdown";
import type { Client, ClientFrontmatter } from "@/types/clients";

function parseClientFile(slug: string, content: string, sha: string): Client {
  const { data } = parseFrontmatter(content);
  return {
    slug,
    sha,
    name: (data.name as string) ?? slug,
    type: data.type as string | undefined,
    contact: data.contact as string | undefined,
    email: data.email as string | undefined,
    phone: data.phone as string | undefined,
    website: data.website as string | undefined,
    address: data.address as string | undefined,
    hourlyRate: data.hourlyRate as number | undefined,
    status: (data.status as Client["status"]) ?? "prospect",
    since: data.since as string | undefined,
    notes: data.notes as string | undefined,
  };
}

export async function listClients(): Promise<Client[]> {
  const files = await listMarkdownUnderPrefix(CLIENTS_FOLDER);
  const grouped = groupListedFilesByClient(files);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[clients] list paths=${files.length} clients=${grouped.size}`,
      [...grouped.keys()],
    );
  }

  return [...grouped.entries()]
    .map(([slug, file]) => mapListedFileToClient(slug, file))
    .sort((a, b) => a.name.localeCompare(b.name, "de", { sensitivity: "base" }));
}

export async function saveClient(
  slug: string,
  data: ClientFrontmatter,
  sha?: string,
): Promise<void> {
  const frontmatterData: Record<string, unknown> = {
    name: data.name,
    type: data.type ?? "",
    contact: data.contact ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    website: data.website ?? "",
    address: data.address ?? "",
    hourlyRate: data.hourlyRate ?? 0,
    status: data.status,
    since: data.since ?? new Date().toISOString().split("T")[0],
    notes: data.notes ?? "",
  };

  const body = `# ${data.name}\n\n## Kontakt\n\n## Notizen\n`;
  const content = serializeFrontmatter(frontmatterData, body);
  const path = `${CLIENTS_FOLDER}/${slug}.md`;
  await createOrUpdateGitHubFile(path, content, `${sha ? "Update" : "Create"} client: ${data.name}`, sha);
}

async function resolveClientPath(slug: string): Promise<string | null> {
  const files = await listMarkdownUnderPrefix(CLIENTS_FOLDER);
  return resolveClientVaultPath(
    files.map((f) => f.path),
    slug,
  );
}

export async function deleteClient(slug: string, sha: string): Promise<void> {
  const path = (await resolveClientPath(slug)) ?? `${CLIENTS_FOLDER}/${slug}.md`;
  await deleteGitHubFile(path, sha);
}

export async function getClientFileContent(slug: string): Promise<string | null> {
  const path = await resolveClientPath(slug);
  if (!path) return null;
  const file = await getGitHubItem(path);
  if (!file || Array.isArray(file) || !("content" in file)) return null;
  return file.content as string;
}

export async function saveClientRaw(slug: string, content: string, sha?: string): Promise<void> {
  const { data } = parseFrontmatter(content);
  const name = (data.name as string) ?? slug;
  const path = (await resolveClientPath(slug)) ?? `${CLIENTS_FOLDER}/${slug}.md`;
  await createOrUpdateGitHubFile(path, content, `Update client: ${name}`, sha);
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const path = await resolveClientPath(slug);
  if (!path) return null;
  const file = await getGitHubItem(path);
  if (!file || Array.isArray(file) || !("content" in file)) return null;
  const parsed = parseClientFile(slug, file.content as string, (file as { sha?: string }).sha ?? "");
  const { data } = parseFrontmatter(file.content as string);
  parsed.name = clientDisplayName(data, slug);
  return parsed;
}
