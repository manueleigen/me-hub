"use server";

import {
  getGitHubItem,
  createOrUpdateGitHubFile,
  deleteGitHubFile,
} from "@/app/actions/github";
import { resolveFileSha } from "@/lib/github/resolve-file-sha";
import { getCachedMirrorReadContext } from "@/lib/cache/server";
import { revalidateWorkspaceVaultCache } from "@/lib/cache/vault-tags";
import {
  composeTaskBody,
  parseTaskFile,
  serializeTaskFile,
} from "@/lib/aufgaben/task-file";
import { getListedFileRaw } from "@/lib/vault/listed-file";
import { listMarkdownUnderPrefixWithContent } from "@/lib/vault/list-markdown";
import { vaultModuleEntrySlugFromBasename } from "@/lib/vault/mirrorable-text-files";
import type { Task, TaskComment, TaskFrontmatter, TaskStatus } from "@/types/aufgaben";

const TASKS_FOLDER = "tasks";

async function revalidateTasksCache(): Promise<void> {
  const ctx = await getCachedMirrorReadContext();
  if (ctx?.workspaceId) {
    revalidateWorkspaceVaultCache(ctx.workspaceId);
  }
}

export async function listTasks(): Promise<Task[]> {
  const files = await listMarkdownUnderPrefixWithContent(TASKS_FOLDER);

  return files
    .map((f) => {
      const slug = vaultModuleEntrySlugFromBasename(f.name);
      const raw = getListedFileRaw(f);
      const parsed = parseTaskFile(raw, slug);

      const task: Task = {
        slug,
        sha: f.sha,
        body: composeTaskBody(parsed.title, parsed.description),
        title: parsed.title,
        description: parsed.description || undefined,
        status: parsed.status,
        priority: parsed.priority,
        project: parsed.project,
        dueDate: parsed.dueDate,
        tags: parsed.tags,
        assignee: parsed.assignee,
        comments: parsed.comments,
        createdAt: parsed.createdAt,
        updatedAt: parsed.updatedAt,
      };
      return task;
    })
    .filter((t): t is Task => t !== null);
}

export async function saveTask(
  slug: string,
  data: TaskFrontmatter,
  sha?: string,
  comments: TaskComment[] = [],
): Promise<string | undefined> {
  const now = new Date().toISOString().slice(0, 10);
  const content = serializeTaskFile({
    title: data.title,
    description: data.description ?? "",
    status: data.status,
    priority: data.priority,
    project: data.project,
    dueDate: data.dueDate,
    tags: data.tags,
    assignee: data.assignee,
    comments,
    createdAt: data.createdAt ?? (!sha ? now : undefined),
    updatedAt: now,
  });
  const path = `${TASKS_FOLDER}/${slug}.md`;
  const resolvedSha = sha ? await resolveFileSha(path, sha) : undefined;
  const result = await createOrUpdateGitHubFile(
    path,
    content,
    `${sha ? "Update" : "Create"} task: ${data.title}`,
    resolvedSha,
  );
  await revalidateTasksCache();
  return result.content?.sha ?? undefined;
}

export async function deleteTask(slug: string, sha: string): Promise<void> {
  const path = `${TASKS_FOLDER}/${slug}.md`;
  const resolvedSha = await resolveFileSha(path, sha);
  if (!resolvedSha) {
    throw new Error(`Task not found: ${slug}`);
  }
  await deleteGitHubFile(path, resolvedSha);
  await revalidateTasksCache();
}

export async function updateTaskStatus(
  slug: string,
  sha: string,
  newStatus: TaskStatus,
): Promise<void> {
  const path = `${TASKS_FOLDER}/${slug}.md`;
  const file = await getGitHubItem(path);
  if (!file || Array.isArray(file) || !("content" in file)) {
    throw new Error(`Task not found: ${slug}`);
  }

  const resolvedSha = await resolveFileSha(path, sha);
  if (!resolvedSha) {
    throw new Error(`Could not resolve file SHA for task: ${slug}`);
  }

  const parsed = parseTaskFile(file.content as string, slug);
  const content = serializeTaskFile({ ...parsed, status: newStatus });
  await createOrUpdateGitHubFile(
    path,
    content,
    `Update task status: ${slug} → ${newStatus}`,
    resolvedSha,
  );
  await revalidateTasksCache();
}
