/**
 * Mirror CRUD operations scoped to a Workspace (WorkspaceFileMirror table).
 * Mirrors lib/mirror/repo-mirror.ts but uses workspaceId instead of userId.
 */

import { prisma } from "@/lib/prisma";
import { buildMirrorRowFields } from "@/lib/mirror/sync-fields";
import type { GitDirEntry, MirrorFile } from "./mirror-types";

export type { MirrorFile, GitDirEntry };
export { pathsToGitTreeShape } from "./mirror-types";

const PLACEHOLDER_SHA = "mirror";

export async function getWorkspaceMirrorFile(
	workspaceId: string,
	path: string,
): Promise<{ content: string; sha: string; path: string; name: string; type: "file" } | null> {
	const row = await prisma.workspaceFileMirror.findUnique({
		where: { workspaceId_path: { workspaceId, path } },
	});
	if (!row) return null;
	const name = path.split("/").pop() ?? path;
	return {
		content: row.content,
		sha: row.blobSha ?? PLACEHOLDER_SHA,
		path: row.path,
		name,
		type: "file",
	};
}

export async function listAllWorkspaceMirrorPaths(workspaceId: string): Promise<string[]> {
	const rows = await prisma.workspaceFileMirror.findMany({
		where: { workspaceId },
		select: { path: true },
	});
	return rows.map((r) => r.path);
}

export async function listWorkspaceMirrorPathsWithPrefix(
	workspaceId: string,
	prefix: string,
): Promise<string[]> {
	const normalized = prefix.replace(/\/$/, "");
	const rows = await prisma.workspaceFileMirror.findMany({
		where: normalized
			? { workspaceId, path: { startsWith: `${normalized}/` } }
			: { workspaceId },
		select: { path: true },
	});
	return rows.map((r) => r.path);
}

export async function upsertWorkspaceMirrorFile(
	workspaceId: string,
	path: string,
	content: string,
	blobSha?: string | null,
): Promise<void> {
	const fields = buildMirrorRowFields(content);
	await prisma.workspaceFileMirror.upsert({
		where: { workspaceId_path: { workspaceId, path } },
		create: {
			workspaceId,
			path,
			content: fields.content,
			frontmatterJson: fields.frontmatterJson,
			blobSha: blobSha ?? null,
		},
		update: {
			content: fields.content,
			frontmatterJson: fields.frontmatterJson,
			...(blobSha !== undefined ? { blobSha } : {}),
		},
	});
}

export async function deleteWorkspaceMirrorPath(workspaceId: string, path: string): Promise<void> {
	await prisma.workspaceFileMirror.deleteMany({ where: { workspaceId, path } });
}

export async function deleteWorkspaceMirrorPaths(workspaceId: string, paths: string[]): Promise<void> {
	if (paths.length === 0) return;
	await prisma.workspaceFileMirror.deleteMany({ where: { workspaceId, path: { in: paths } } });
}

export async function deleteAllWorkspaceMirror(workspaceId: string): Promise<void> {
	await prisma.workspaceFileMirror.deleteMany({ where: { workspaceId } });
}

export async function listWorkspaceImmediateChildren(
	workspaceId: string,
	dirPath: string,
): Promise<GitDirEntry[]> {
	const prefix = dirPath.replace(/\/$/, "");
	const allPaths = await listWorkspaceMirrorPathsWithPrefix(workspaceId, prefix || "");

	const childNames = new Map<string, "file" | "dir">();
	for (const filePath of allPaths) {
		const relative = prefix ? filePath.slice(prefix.length + 1) : filePath;
		if (!relative) continue;
		const slashIdx = relative.indexOf("/");
		if (slashIdx === -1) {
			childNames.set(relative, "file");
		} else {
			const dirName = relative.slice(0, slashIdx);
			if (!childNames.has(dirName) || childNames.get(dirName) === "dir") {
				childNames.set(dirName, "dir");
			}
		}
	}

	const parent = prefix;
	return Array.from(childNames.entries())
		.map(([name, type]) => ({
			name,
			path: parent ? `${parent}/${name}` : name,
			type: type === "dir" ? ("dir" as const) : ("file" as const),
			sha: PLACEHOLDER_SHA,
		}))
		.sort((a, b) => {
			if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
			return a.name.localeCompare(b.name, "de", { sensitivity: "base" });
		});
}

export async function getWorkspaceMirrorDirListing(
	workspaceId: string,
	dirPath: string,
): Promise<GitDirEntry[] | null> {
	const children = await listWorkspaceImmediateChildren(workspaceId, dirPath);
	if (children.length === 0 && dirPath !== "") {
		const hasFiles = await prisma.workspaceFileMirror.count({
			where: { workspaceId, path: dirPath },
		});
		if (hasFiles === 0) return null;
	}
	return children;
}
