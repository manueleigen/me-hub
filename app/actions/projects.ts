"use server";

import {
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import {
  coerceStringArray,
  parseFrontmatter,
  serializeFrontmatter,
  slugify,
} from "@/lib/frontmatter";
import {
	getListedFileBody,
	getListedFileFrontmatter,
} from "@/lib/vault/listed-file";
import { listMarkdownUnderPrefix } from "@/lib/vault/list-markdown";
import { vaultModuleEntrySlugFromBasename } from "@/lib/vault/mirrorable-text-files";
import type { Project, ProjectFrontmatter } from "@/types/projects";

const PROJECTS_FOLDER = "projects";

const SKILL_FOLDER_MAP: Record<string, string> = {
  category: "profile/skills/category",
  skills: "profile/skills/skill",
  tools: "profile/skills/tools-software",
  area: "profile/skills/area",
};

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await listProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function listProjects(): Promise<Project[]> {
  const files = await listMarkdownUnderPrefix(PROJECTS_FOLDER);

  return files
    .map((f) => {
      const slug = vaultModuleEntrySlugFromBasename(f.name);
      const data = getListedFileFrontmatter(f);
      const content = getListedFileBody(f);
      const project: Project = {
        slug,
        sha: f.sha,
        body: content,
        type: (data.type as Project["type"]) ?? "personal",
        title: (data.title as string) ?? slug,
        client: data.client as string | undefined,
        clientName: data.clientName as string | undefined,
        category: coerceStringArray(data.category),
        skills: coerceStringArray(data.skills),
        tools: coerceStringArray(data.tools),
        area: coerceStringArray(data.area),
        status: data.status as string | undefined,
        date: data.date as string | undefined,
      };
      return project;
    })
    .filter((p): p is Project => p !== null);
}

export async function saveProject(
  slug: string,
  data: ProjectFrontmatter,
  body: string,
  sha?: string,
): Promise<void> {
  const frontmatterData: Record<string, unknown> = {
    type: data.type,
    title: data.title,
    client: data.client ?? "",
    clientName: data.clientName ?? "",
    category: data.category,
    skills: data.skills,
    tools: data.tools,
    area: data.area,
    status: data.status ?? "",
    date: data.date ?? new Date().toISOString().split("T")[0],
  };

  const content = serializeFrontmatter(frontmatterData, body);
  const path = `${PROJECTS_FOLDER}/${slug}.md`;
  await createOrUpdateGitHubFile(path, content, `${sha ? "Update" : "Create"} project: ${data.title}`, sha);
}

export async function deleteProject(slug: string, sha: string): Promise<void> {
  await deleteGitHubFile(`${PROJECTS_FOLDER}/${slug}.md`, sha);
}

export async function ensureSkillFiles(data: ProjectFrontmatter): Promise<void> {
  const entries: { folder: string; items: string[] }[] = [
    { folder: SKILL_FOLDER_MAP.category, items: data.category },
    { folder: SKILL_FOLDER_MAP.skills, items: data.skills },
    { folder: SKILL_FOLDER_MAP.tools, items: data.tools },
    { folder: SKILL_FOLDER_MAP.area, items: data.area },
  ];

  await Promise.all(
    entries.flatMap(({ folder, items }) =>
      items.map(async (item) => {
        const itemSlug = slugify(item);
        const path = `${folder}/${itemSlug}.md`;
        const typeLabel = folder.split("/").pop() ?? "skill";
        const content = serializeFrontmatter(
          { name: item, type: typeLabel },
          `# ${item}`,
        );
        try {
          await createOrUpdateGitHubFile(path, content, `Add skill: ${item}`);
        } catch {
          // file already exists — skip
        }
      }),
    ),
  );
}
