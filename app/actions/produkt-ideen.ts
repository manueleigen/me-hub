"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { parseFrontmatter, serializeFrontmatter, slugify } from "@/lib/frontmatter";
import type { ProductIdea, ProductIdeaFrontmatter, IdeaStatus } from "@/types/produkt-ideen";

const IDEAS_FOLDER = "product-ideas";

export async function listProductIdeas(): Promise<ProductIdea[]> {
  const dir = await getGitHubItem(IDEAS_FOLDER);
  if (!dir || !Array.isArray(dir)) return [];

  const categoryDirs = (
    dir as { name: string; path: string; sha: string; type: string }[]
  ).filter((f) => f.type === "dir");

  const allIdeas = await Promise.all(
    categoryDirs.map(async (catDir) => {
      const catContents = await getGitHubItem(catDir.path);
      if (!catContents || !Array.isArray(catContents)) return [];

      const mdFiles = (
        catContents as { name: string; path: string; sha: string; type: string }[]
      ).filter((f) => f.type === "file" && f.name.endsWith(".md") && !f.name.startsWith("_"));

      const ideas = await Promise.all(
        mdFiles.map(async (f) => {
          const file = await getGitHubItem(f.path);
          if (!file || Array.isArray(file) || !("content" in file)) return null;
          const { data, content } = parseFrontmatter(file.content as string);
          const slug = f.name.replace(/\.md$/, "");
          const idea: ProductIdea = {
            slug,
            categorySlug: catDir.name,
            sha: (file as { sha?: string }).sha,
            body: content,
            title: (data.title as string) ?? slug,
            description: (data.description as string) ?? "",
            category: (data.category as string) ?? catDir.name,
            status: (data.status as IdeaStatus) ?? "idea",
            priority: (data.priority as ProductIdea["priority"]) ?? "medium",
            targetAudience: data.targetAudience as string | undefined,
            potentialRevenue: data.potentialRevenue as string | undefined,
            effortEstimate: data.effortEstimate as string | undefined,
            tags: (data.tags as string[]) ?? [],
            notes: data.notes as string | undefined,
          };
          return idea;
        }),
      );

      return ideas.filter((i): i is ProductIdea => i !== null);
    }),
  );

  return allIdeas.flat();
}

export async function saveProductIdea(
  categorySlug: string,
  slug: string,
  data: ProductIdeaFrontmatter,
  body: string,
  sha?: string,
  oldCategorySlug?: string,
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
  };
  const content = serializeFrontmatter(frontmatterData, body);
  const newPath = `${IDEAS_FOLDER}/${categorySlug}/${slug}.md`;

  if (oldCategorySlug && oldCategorySlug !== categorySlug && sha) {
    // Category changed: create in new folder (no sha), delete from old folder
    await createOrUpdateGitHubFile(newPath, content, `Move idea to ${categorySlug}: ${data.title}`);
    await deleteGitHubFile(`${IDEAS_FOLDER}/${oldCategorySlug}/${slug}.md`, sha);
  } else {
    await createOrUpdateGitHubFile(
      newPath,
      content,
      `${sha ? "Update" : "Create"} idea: ${data.title}`,
      sha,
    );
  }
}

export async function deleteProductIdea(
  categorySlug: string,
  slug: string,
  sha: string,
): Promise<void> {
  await deleteGitHubFile(`${IDEAS_FOLDER}/${categorySlug}/${slug}.md`, sha);
}

export async function updateIdeaStatus(
  categorySlug: string,
  slug: string,
  sha: string,
  newStatus: IdeaStatus,
): Promise<void> {
  const path = `${IDEAS_FOLDER}/${categorySlug}/${slug}.md`;
  const file = await getGitHubItem(path);
  if (!file || Array.isArray(file) || !("content" in file)) return;

  const { data, content } = parseFrontmatter(file.content as string);
  const frontmatterData: Record<string, unknown> = {
    ...data,
    status: newStatus,
  };
  const newContent = serializeFrontmatter(frontmatterData, content);
  await createOrUpdateGitHubFile(path, newContent, `Update idea status: ${slug} → ${newStatus}`, sha);
}
