"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter";
import type { Client, ClientFrontmatter } from "@/types/clients";

const CLIENTS_FOLDER = "clients";

export async function listClients(): Promise<Client[]> {
  const dir = await getGitHubItem(CLIENTS_FOLDER);
  if (!dir || !Array.isArray(dir)) return [];

  const mdFiles = (dir as { name: string; path: string; sha: string; type: string }[]).filter(
    (f) => f.type === "file" && f.name.endsWith(".md") && !f.name.startsWith("_"),
  );

  const clients = await Promise.all(
    mdFiles.map(async (f) => {
      const file = await getGitHubItem(f.path);
      if (!file || Array.isArray(file) || !("content" in file)) return null;
      const { data } = parseFrontmatter(file.content as string);
      const slug = f.name.replace(/\.md$/, "");
      const client: Client = {
        slug,
        sha: (file as { sha?: string }).sha,
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
      return client;
    }),
  );

  return clients.filter((c): c is Client => c !== null);
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

export async function deleteClient(slug: string, sha: string): Promise<void> {
  await deleteGitHubFile(`${CLIENTS_FOLDER}/${slug}.md`, sha);
}
