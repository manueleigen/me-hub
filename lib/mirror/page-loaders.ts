import { cache } from "react";
import { unstable_cache } from "next/cache";
import { listClients } from "@/app/actions/clients";
import { listProjects, getProjectBySlug } from "@/app/actions/projects";
import { listTasks } from "@/app/actions/aufgaben";
import { listProductIdeas } from "@/app/actions/produkt-ideen";
import { listOpenEntries } from "@/app/actions/zeiterfassung";
import {
	loadAllTimeEntries,
	mapTimeEntries,
	OPEN_FOLDER,
} from "@/lib/zeiterfassung/entries";
import { VAULT_CACHE_TAG } from "@/lib/cache/vault-tags";
import { getCachedMirrorReadContext } from "@/lib/cache/server";
import { getWorkspaceMirrorFile } from "@/lib/mirror/workspace-mirror";
import { coerceStringArray, parseFrontmatter } from "@/lib/frontmatter";
import { mapListedFileToClient } from "@/lib/clients/map-client";
import {
	CLIENTS_FOLDER,
	groupListedFilesByClient,
	resolveClientVaultPath,
} from "@/lib/clients/vault-paths";
import { vaultModuleEntrySlugFromBasename } from "@/lib/vault/mirrorable-text-files";
import {
	listMarkdownUnderPrefixesForWorkspace,
	type ListedMarkdownFile,
} from "@/lib/vault/list-markdown";
import {
	getListedFileBody,
	getListedFileFrontmatter,
} from "@/lib/vault/listed-file";
import type { Client } from "@/types/clients";
import type { Project } from "@/types/projects";
import type { VaultTimeEntry } from "@/types/zeiterfassung";
import {
	findProjectForTask,
	taskMatchesProject,
} from "@/lib/projects/task-match";

const PROJECTS_FOLDER = "projects";

function filesUnderPrefix(files: ListedMarkdownFile[], prefix: string): ListedMarkdownFile[] {
	const normalized = prefix.replace(/\/$/, "");
	return files.filter(
		(f) => f.path === normalized || f.path.startsWith(`${normalized}/`),
	);
}

function mapProjectsFromFiles(files: ListedMarkdownFile[]): Project[] {
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

function mapClientsFromFiles(files: ListedMarkdownFile[]): Client[] {
	return [...groupListedFilesByClient(files).entries()]
		.map(([slug, file]) => mapListedFileToClient(slug, file))
		.sort((a, b) => a.name.localeCompare(b.name, "de", { sensitivity: "base" }));
}

async function loadZeiterfassungShellUncached(workspaceId: string) {
	const all = await listMarkdownUnderPrefixesForWorkspace(workspaceId, [
		PROJECTS_FOLDER,
		CLIENTS_FOLDER,
	]);
	return {
		projects: mapProjectsFromFiles(filesUnderPrefix(all, PROJECTS_FOLDER)),
		clients: mapClientsFromFiles(filesUnderPrefix(all, CLIENTS_FOLDER)),
	};
}

export const loadZeiterfassungEntriesData = cache(async () => {
	const { open, paid } = await loadAllTimeEntries();
	return { openEntries: open, paidEntries: paid };
});

export const loadZeiterfassungShellData = cache(async () => {
	const ctx = await getCachedMirrorReadContext();
	if (!ctx?.useMirror) {
		const [projects, clients] = await Promise.all([listProjects(), listClients()]);
		return { projects, clients };
	}

	return unstable_cache(
		() => loadZeiterfassungShellUncached(ctx.workspaceId),
		["zeiterfassung-shell", ctx.workspaceId],
		{
			tags: [VAULT_CACHE_TAG, `${VAULT_CACHE_TAG}-ws-${ctx.workspaceId}`],
			revalidate: 30,
		},
	)();
});

/** @deprecated Use loadZeiterfassungShellData + fetchTimeEntriesPage */
export const loadZeiterfassungPageData = cache(async () => {
	const [entries, shell] = await Promise.all([
		loadZeiterfassungEntriesData(),
		loadZeiterfassungShellData(),
	]);
	return { ...entries, ...shell };
});

async function loadProjectsPageUncached(workspaceId: string) {
	const all = await listMarkdownUnderPrefixesForWorkspace(workspaceId, [
		PROJECTS_FOLDER,
		CLIENTS_FOLDER,
	]);
	return {
		projects: mapProjectsFromFiles(filesUnderPrefix(all, PROJECTS_FOLDER)),
		clients: mapClientsFromFiles(filesUnderPrefix(all, CLIENTS_FOLDER)),
	};
}

export const loadProjectsPageData = cache(async () => {
	const ctx = await getCachedMirrorReadContext();
	if (!ctx?.useMirror) {
		const [projects, clients] = await Promise.all([listProjects(), listClients()]);
		return { projects, clients };
	}

	return unstable_cache(
		() => loadProjectsPageUncached(ctx.workspaceId),
		["projects-page", ctx.workspaceId],
		{
			tags: [VAULT_CACHE_TAG, `${VAULT_CACHE_TAG}-ws-${ctx.workspaceId}`],
			revalidate: 30,
		},
	)();
});

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

async function hydrateProjectBody(project: Project): Promise<Project> {
	const path = `${PROJECTS_FOLDER}/${project.slug}.md`;
	const ctx = await getCachedMirrorReadContext();

	if (ctx?.useMirror) {
		const row = await getWorkspaceMirrorFile(ctx.workspaceId, path);
		if (!row) return project;
		const { content } = parseFrontmatter(row.content);
		return { ...project, body: content, sha: row.sha };
	}

	const { getGitHubItem } = await import("@/app/actions/github");
	const file = await getGitHubItem(path);
	if (!file || Array.isArray(file) || !("content" in file)) return project;
	const { content } = parseFrontmatter(file.content as string);
	return {
		...project,
		body: content,
		sha: (file as { sha?: string }).sha ?? project.sha,
	};
}

export const loadProjectDetailPageData = cache(async (slug: string) => {
	const ctx = await getCachedMirrorReadContext();

	if (ctx?.useMirror) {
		const all = await listMarkdownUnderPrefixesForWorkspace(ctx.workspaceId, [
			PROJECTS_FOLDER,
			CLIENTS_FOLDER,
		]);
		const listed = mapProjectsFromFiles(filesUnderPrefix(all, PROJECTS_FOLDER)).find(
			(p) => p.slug === slug,
		);
		if (!listed) return null;

		const project = await hydrateProjectBody(listed);
		const clients = mapClientsFromFiles(filesUnderPrefix(all, CLIENTS_FOLDER));
		const client = project.client
			? clients.find((c) => c.slug === project.client) ?? null
			: null;
		const tasks = (await listTasks()).filter((t) => taskMatchesProject(t, project));

		return { project, client, clients, tasks };
	}

	const [listed, allClients, allTasks] = await Promise.all([
		getProjectBySlug(slug),
		listClients(),
		listTasks(),
	]);
	if (!listed) return null;

	const project = await hydrateProjectBody(listed);
	const client = project.client
		? allClients.find((c) => c.slug === project.client) ?? null
		: null;
	const tasks = allTasks.filter((t) => taskMatchesProject(t, project));

	return { project, client, clients: allClients, tasks };
});

export const loadClientDetailPageData = cache(async (slug: string) => {
	const ctx = await getCachedMirrorReadContext();

	if (ctx?.useMirror) {
		const [clientFiles, related] = await Promise.all([
			listMarkdownUnderPrefixesForWorkspace(ctx.workspaceId, [CLIENTS_FOLDER]),
			listMarkdownUnderPrefixesForWorkspace(ctx.workspaceId, [
				PROJECTS_FOLDER,
				OPEN_FOLDER,
			]),
		]);
		const clientPath = resolveClientVaultPath(
			clientFiles.map((f) => f.path),
			slug,
		);
		if (!clientPath) return null;

		const clientRow = await getWorkspaceMirrorFile(ctx.workspaceId, clientPath);
		if (!clientRow) return null;

		const client = parseClientFile(slug, clientRow.content, clientRow.sha);
		const projects = mapProjectsFromFiles(filesUnderPrefix(related, PROJECTS_FOLDER)).filter(
			(p) => p.client === slug,
		);
		const timeEntries = mapTimeEntries(
			filesUnderPrefix(related, OPEN_FOLDER),
			"open",
			OPEN_FOLDER,
			"tracked",
		).filter((e) => e.clientSlug === slug);

		return {
			client,
			rawContent: clientRow.content,
			projects,
			timeEntries,
		};
	}

	const { getClientBySlug, getClientFileContent } = await import("@/app/actions/clients");
	const [client, rawContent, allProjects, allOpenEntries] = await Promise.all([
		getClientBySlug(slug),
		getClientFileContent(slug),
		listProjects(),
		listOpenEntries(),
	]);

	if (!client) return null;

	return {
		client,
		rawContent: rawContent ?? "",
		projects: allProjects.filter((p) => p.client === slug),
		timeEntries: allOpenEntries.filter((e) => e.clientSlug === slug),
	};
});

export const loadTaskDetailPageData = cache(async (slug: string, tasksFolder?: string) => {
	const [tasks, projects, clients] = await Promise.all([
		listTasks(tasksFolder),
		listProjects(),
		listClients(),
	]);

	const task = tasks.find((t) => t.slug === slug);
	if (!task) return null;

	const project = findProjectForTask(task, projects);
	const relatedTasks = project
		? tasks.filter(
				(t) => t.slug !== task.slug && taskMatchesProject(t, project),
			)
		: [];

	return { task, project, projects, clients, relatedTasks };
});

export const loadIdeaDetailPageData = cache(
	async (categorySlug: string, slug: string) => {
		const ideas = await listProductIdeas();
		const idea = ideas.find(
			(i) => i.categorySlug === categorySlug && i.slug === slug,
		);
		if (!idea) return null;

		const relatedIdeas = ideas.filter(
			(i) =>
				i.categorySlug === idea.categorySlug &&
				!(i.categorySlug === idea.categorySlug && i.slug === idea.slug),
		);

		return { idea, relatedIdeas };
	},
);
