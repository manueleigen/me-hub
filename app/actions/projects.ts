"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { parseFrontmatter, serializeFrontmatter, slugify } from "@/lib/frontmatter";
import type { Project, ProjectFrontmatter } from "@/types/projects";

const PROJECTS_FOLDER = "projects";

const SKILL_FOLDER_MAP: Record<string, string> = {
  category: "profile/skills/category",
  skills: "profile/skills/skill",
  tools: "profile/skills/tools-software",
  area: "profile/skills/area",
};

export async function listProjects(): Promise<Project[]> {
  const dir = await getGitHubItem(PROJECTS_FOLDER);
  if (!dir || !Array.isArray(dir)) return [];

  const mdFiles = (dir as { name: string; path: string; sha: string; type: string }[]).filter(
    (f) => f.type === "file" && f.name.endsWith(".md") && !f.name.startsWith("_"),
  );

  const projects = await Promise.all(
    mdFiles.map(async (f) => {
      const file = await getGitHubItem(f.path);
      if (!file || Array.isArray(file) || !("content" in file)) return null;
      const { data, content } = parseFrontmatter(file.content as string);
      const slug = f.name.replace(/\.md$/, "");
      const project: Project = {
        slug,
        sha: (file as { sha?: string }).sha,
        body: content,
        type: (data.type as Project["type"]) ?? "personal",
        title: (data.title as string) ?? slug,
        client: data.client as string | undefined,
        clientName: data.clientName as string | undefined,
        category: (data.category as string[]) ?? [],
        skills: (data.skills as string[]) ?? [],
        tools: (data.tools as string[]) ?? [],
        area: (data.area as string[]) ?? [],
        status: data.status as string | undefined,
        date: data.date as string | undefined,
      };
      return project;
    }),
  );

  return projects.filter((p): p is Project => p !== null);
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
