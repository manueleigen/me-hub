import type { Octokit } from "octokit";
import { fetchNoStore } from "@/lib/github/octokit";
import { buildWorkspaceMirrorUpsertArgs } from "@/lib/mirror/workspace-prisma-rows";
import { deleteWorkspaceMirrorPaths } from "@/lib/mirror/workspace-mirror";
import { prisma } from "@/lib/prisma";
import { fetchBlobTextsAtCommit } from "./graphql-blobs";
import { listMirrorablePathsFromTreeSha } from "./markdown-tree-paths";
import { reconcileWorkspaceMirrorOrphans } from "./workspace-reconcile-orphans";
import { classifyCompareFiles } from "./classify-compare-files";
import type { SyncVaultOptions } from "./types";

const COMPARE_FILES_LIMIT = 300;

export async function applyWorkspaceIncrementalSync(
	workspaceId: string,
	octokit: Octokit,
	owner: string,
	repo: string,
	headSha: string,
	headTreeSha: string,
	baseSha: string,
	options?: Pick<SyncVaultOptions, "reconcileOrphans">,
): Promise<{
	toDelete: string[];
	toFetch: string[];
	compareDeletes: string[];
	compareFetched: string[];
	orphanDeletes: string[];
}> {
	const reconcileOrphans = options?.reconcileOrphans ?? false;

	const { data: diff } = await octokit.rest.repos.compareCommits({
		owner,
		repo,
		base: baseSha,
		head: headSha,
		request: { fetch: fetchNoStore },
	});

	const compareFiles = diff.files ?? [];
	if (compareFiles.length >= COMPARE_FILES_LIMIT) {
		throw new Error(
			`compareCommits returned ${compareFiles.length} files (limit ${COMPARE_FILES_LIMIT}); full re-import required`,
		);
	}

	const { toDelete: compareDeletes, toFetch } = classifyCompareFiles(compareFiles);

	if (compareDeletes.length === 0 && toFetch.length === 0) {
		await prisma.workspace.update({
			where: { id: workspaceId },
			data: { lastSyncedSha: headSha, lastSyncAt: new Date(), lastSyncError: null },
		});
		return { toDelete: [], toFetch: [], compareDeletes: [], compareFetched: [], orphanDeletes: [] };
	}

	if (compareDeletes.length > 0) {
		await deleteWorkspaceMirrorPaths(workspaceId, compareDeletes);
	}

	if (toFetch.length > 0) {
		const blobs = await fetchBlobTextsAtCommit(octokit, owner, repo, headSha, toFetch);
		await prisma.$transaction(
			blobs.map((blob) =>
				prisma.workspaceFileMirror.upsert(buildWorkspaceMirrorUpsertArgs(workspaceId, blob)),
			),
		);
	}

	let orphanDeletes: string[] = [];
	if (reconcileOrphans) {
		const remotePaths = await listMirrorablePathsFromTreeSha(octokit, owner, repo, headTreeSha);
		orphanDeletes = await reconcileWorkspaceMirrorOrphans(workspaceId, remotePaths);
	}
	const toDelete = [...new Set([...compareDeletes, ...orphanDeletes])];

	await prisma.workspace.update({
		where: { id: workspaceId },
		data: { lastSyncedSha: headSha, lastSyncAt: new Date(), lastSyncError: null },
	});

	return { toDelete, toFetch, compareDeletes, compareFetched: toFetch, orphanDeletes };
}
