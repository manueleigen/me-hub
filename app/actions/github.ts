"use server";

import { getOctokitClient } from "@/lib/github/octokit";
import { assertSafeVaultContentPath } from "@/lib/github/vault-content-path";
import { getCachedVaultConfig } from "@/lib/cache/server";
import { getGitHubTokenForWorkspace } from "@/lib/github/token";
import {
	ensureVaultGitHubWriteToken,
	formatGitHubVaultWriteError,
} from "@/lib/github/ensure-vault-write-token";
import { resolveFileSha } from "@/lib/github/resolve-file-sha";
import { requireActiveWorkspaceVaultLinked } from "@/lib/vault/require-vault-linked";
import { getMirrorReadContext } from "@/lib/github/mirror-context";
import {
	getWorkspaceMirrorFile,
	getWorkspaceMirrorDirListing,
	listAllWorkspaceMirrorPaths,
	pathsToGitTreeShape,
	upsertWorkspaceMirrorFile,
	deleteWorkspaceMirrorPath,
} from "@/lib/mirror/workspace-mirror";
import { bumpWorkspaceLastSyncedSha } from "@/lib/sync/bump-sync-pointer";
import { getVaultConfig } from "@/lib/vault/config";

async function getOctokit() {
	const { workspaceId } = await getCachedVaultConfig();
	const token = workspaceId ? await getGitHubTokenForWorkspace(workspaceId) : null;
	return getOctokitClient(token ?? undefined);
}

export async function getGitHubTree() {
	try {
		await requireActiveWorkspaceVaultLinked();
		const mirror = await getMirrorReadContext();
		if (mirror?.useMirror) {
			const paths = await listAllWorkspaceMirrorPaths(mirror.workspaceId);
			return pathsToGitTreeShape(paths);
		}

		const { owner, repo, branch } = await getVaultConfig();
		const octokit = await getOctokit();
		const { data } = await octokit.rest.git.getTree({
			owner,
			repo,
			tree_sha: branch,
			recursive: "true",
		});

		const treeArray = data.tree;
		if (Array.isArray(treeArray)) {
			return treeArray;
		}
		return [treeArray];
	} catch (error) {
		console.error("Failed to list repo files:", error);
		return null;
	}
}

export async function getGitHubDir(path: string = "") {
	try {
		await requireActiveWorkspaceVaultLinked();
		const safePath = assertSafeVaultContentPath(path);
		const mirror = await getMirrorReadContext();
		if (mirror?.useMirror) {
			const children = await getWorkspaceMirrorDirListing(mirror.workspaceId, safePath);
			if (!children) return null;
			return children.map((c) => ({
				name: c.name,
				path: c.path,
				type: c.type === "dir" ? "dir" : "file",
				sha: c.sha,
			}));
		}

		const { owner, repo, branch } = await getVaultConfig();
		const octokit = await getOctokit();
		const { data } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path: safePath || "",
			ref: branch,
		});

		if (Array.isArray(data)) {
			return data;
		}
		return [data];
	} catch (error) {
		console.error("Failed to list repo files:", error);
		return null;
	}
}

export async function deleteGitHubFile(path: string, sha: string) {
	const safePath = assertSafeVaultContentPath(path);
	await requireActiveWorkspaceVaultLinked();
	const { owner, repo, branch, workspaceId } = await getCachedVaultConfig();
	if (!workspaceId) throw new Error("No active workspace for vault delete");

	const resolvedSha = await resolveFileSha(safePath, sha);
	const mirror = await getMirrorReadContext();

	if (!resolvedSha) {
		if (mirror) {
			await deleteWorkspaceMirrorPath(mirror.workspaceId, safePath);
		}
		return;
	}

	try {
		const token = await ensureVaultGitHubWriteToken(workspaceId);
		const octokit = getOctokitClient(token);
		const { data } = await octokit.rest.repos.deleteFile({
			owner,
			repo,
			path: safePath,
			message: `Delete ${safePath}`,
			sha: resolvedSha,
			branch,
		});

		if (mirror) {
			await deleteWorkspaceMirrorPath(mirror.workspaceId, safePath);
			const commitSha = data.commit?.sha;
			if (commitSha) {
				await bumpWorkspaceLastSyncedSha(mirror.workspaceId, commitSha);
			}
		}
	} catch (error) {
		throw formatGitHubVaultWriteError(error);
	}
}

export async function createOrUpdateGitHubFile(
	path: string,
	content: string,
	message: string,
	sha?: string,
) {
	const safePath = assertSafeVaultContentPath(path);
	await requireActiveWorkspaceVaultLinked();
	const { owner, repo, branch, workspaceId } = await getCachedVaultConfig();
	if (!workspaceId) throw new Error("No active workspace for vault write");

	const contentBase64 = Buffer.from(content, "utf-8").toString("base64");
	const resolvedSha = sha ? await resolveFileSha(safePath, sha) : undefined;

	try {
		const token = await ensureVaultGitHubWriteToken(workspaceId);
		const octokit = getOctokitClient(token);
		const { data } = await octokit.rest.repos.createOrUpdateFileContents({
			owner,
			repo,
			path: safePath,
			message,
			content: contentBase64,
			branch,
			...(resolvedSha ? { sha: resolvedSha } : {}),
		});

		const mirror = await getMirrorReadContext();
		if (mirror) {
			const newSha = data.content?.sha ?? undefined;
			await upsertWorkspaceMirrorFile(mirror.workspaceId, safePath, content, newSha);
			const commitSha = data.commit?.sha;
			if (commitSha) {
				await bumpWorkspaceLastSyncedSha(mirror.workspaceId, commitSha);
			}
		}

		return data;
	} catch (error) {
		throw formatGitHubVaultWriteError(error);
	}
}

export async function getGitHubItem(path: string = "") {
	try {
		await requireActiveWorkspaceVaultLinked();
		const safePath = assertSafeVaultContentPath(path);
		const mirror = await getMirrorReadContext();
		if (mirror?.useMirror) {
			if (!safePath) {
				const children = await getWorkspaceMirrorDirListing(mirror.workspaceId, "");
				if (!children) return [];
				return children.map((c) => ({
					name: c.name,
					path: c.path,
					type: c.type === "dir" ? "dir" : "file",
					sha: c.sha,
				}));
			}

			const file = await getWorkspaceMirrorFile(mirror.workspaceId, safePath);
			if (file) return file;

			const children = await getWorkspaceMirrorDirListing(mirror.workspaceId, safePath);
			if (children) {
				return children.map((c) => ({
					name: c.name,
					path: c.path,
					type: c.type === "dir" ? "dir" : "file",
					sha: c.sha,
				}));
			}
			return null;
		}

		const { owner, repo, branch } = await getVaultConfig();
		const octokit = await getOctokit();
		const { data } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path: safePath,
			ref: branch,
		});

		if (!Array.isArray(data) && "content" in data) {
			const content = Buffer.from(data.content, "base64").toString("utf-8");
			return { ...data, content };
		}

		return data;
	} catch (error) {
		console.error("Failed to fetch from GitHub:", error);
		return null;
	}
}
