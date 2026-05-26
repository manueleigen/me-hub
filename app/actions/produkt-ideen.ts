"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { resolveFileSha } from "@/lib/github/resolve-file-sha";
import { parseCommentsValue } from "@/lib/aufgaben/task-file";
import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter";
import {
	getListedFileBody,
	getListedFileFrontmatter,
} from "@/lib/vault/listed-file";
import { listMarkdownUnderPrefix } from "@/lib/vault/list-markdown";
import { vaultModuleEntrySlugFromBasename } from "@/lib/vault/mirrorable-text-files";
import type { TaskComment } from "@/types/aufgaben";
import type { ProductIdea, ProductIdeaFrontmatter, IdeaStatus } from "@/types/produkt-ideen";

const IDEAS_FOLDER = "product-ideas";

export async function listProductIdeas(): Promise<ProductIdea[]> {
  const files = await listMarkdownUnderPrefix(IDEAS_FOLDER);

  return files
    .map((f) => {
      const parts = f.path.split("/");
      if (parts.length < 3) return null;
      const categorySlug = parts[1];
      const slug = vaultModuleEntrySlugFromBasename(f.name);
      const data = getListedFileFrontmatter(f);
      const content = getListedFileBody(f);
      const idea: ProductIdea = {
        slug,
        categorySlug,
        sha: f.sha,
        body: content,
        title: (data.title as string) ?? slug,
        description: (data.description as string) ?? "",
        category: (data.category as string) ?? categorySlug,
        status: (data.status as IdeaStatus) ?? "idea",
        priority: (data.priority as ProductIdea["priority"]) ?? "medium",
        targetAudience: data.targetAudience as string | undefined,
        potentialRevenue: data.potentialRevenue as string | undefined,
        effortEstimate: data.effortEstimate as string | undefined,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        notes: data.notes as string | undefined,
        comments: parseCommentsValue(data.comments),
      };
      return idea;
    })
    .filter((i): i is ProductIdea => i !== null);
}

export async function saveProductIdea(
  categorySlug: string,
  slug: string,
  data: ProductIdeaFrontmatter,
  body: string,
  sha?: string,
  oldCategorySlug?: string,
  comments: TaskComment[] = [],
): Promise<void> {
  const frontmatterData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    category: data.category,
    status: data.status,
    priority: data.priority,
    targetAudience: data.targetAudience ?? "",
    potentialRevenue: data.potentialRevenue ?? "",
    effortEstimate: data.effortEstimate ?? "",
    tags: data.tags,
    notes: data.notes ?? "",
    comments: JSON.stringify(comments),
  };
  const content = serializeFrontmatter(frontmatterData, body);
  const newPath = `${IDEAS_FOLDER}/${categorySlug}/${slug}.md`;

  if (oldCategorySlug && oldCategorySlug !== categorySlug && sha) {
    const oldPath = `${IDEAS_FOLDER}/${oldCategorySlug}/${slug}.md`;
    const resolvedSha = await resolveFileSha(oldPath, sha);
    await createOrUpdateGitHubFile(newPath, content, `Move idea to ${categorySlug}: ${data.title}`);
    if (resolvedSha) {
      await deleteGitHubFile(oldPath, resolvedSha);
    }
  } else {
    const resolvedSha = sha ? await resolveFileSha(newPath, sha) : undefined;
    await createOrUpdateGitHubFile(
      newPath,
      content,
      `${sha ? "Update" : "Create"} idea: ${data.title}`,
      resolvedSha,
    );
  }
}

export async function deleteProductIdea(
  categorySlug: string,
  slug: string,
  sha: string,
): Promise<void> {
  const path = `${IDEAS_FOLDER}/${categorySlug}/${slug}.md`;
  const resolvedSha = await resolveFileSha(path, sha);
  if (!resolvedSha) {
    throw new Error(`Idea not found: ${slug}`);
  }
  await deleteGitHubFile(path, resolvedSha);
}

export async function updateIdeaStatus(
  categorySlug: string,
  slug: string,
  sha: string,
  newStatus: IdeaStatus,
): Promise<void> {
  const path = `${IDEAS_FOLDER}/${categorySlug}/${slug}.md`;
  const file = await getGitHubItem(path);
  if (!file || Array.isArray(file) || !("content" in file)) {
    throw new Error(`Idea not found: ${slug}`);
  }

  const resolvedSha = await resolveFileSha(path, sha);
  if (!resolvedSha) {
    throw new Error(`Could not resolve file SHA for idea: ${slug}`);
  }

  const { data, content } = parseFrontmatter(file.content as string);
  const frontmatterData: Record<string, unknown> = {
    ...data,
    status: newStatus,
  };
  const newContent = serializeFrontmatter(frontmatterData, content);
  await createOrUpdateGitHubFile(
    path,
    newContent,
    `Update idea status: ${slug} → ${newStatus}`,
    resolvedSha,
  );
}
