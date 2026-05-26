import { revalidateWorkspaceVaultCache } from "@/lib/cache/vault-tags";
import { getOctokitClient } from "@/lib/github/octokit";
import { getWorkspaceVaultRepoConfig } from "@/lib/github/workspace-mirror-context";
import { getGitHubTokenForWorkspace } from "@/lib/github/token";
import { deleteAllWorkspaceMirror } from "@/lib/mirror/workspace-mirror";
import { prisma } from "@/lib/prisma";
import { getBranchTipWithTree } from "./branch-tip";
import { listMirrorablePathsFromTreeSha } from "./markdown-tree-paths";
import { runWorkspaceFullImport } from "./workspace-full-import";
import { applyWorkspaceIncrementalSync } from "./workspace-incremental";
import { reconcileWorkspaceMirrorOrphans } from "./workspace-reconcile-orphans";
import {
	logSyncCheck,
	logSyncComplete,
	logSyncIncrementalDelta,
	logSyncOrphanReconcile,
	logSyncStart,
} from "./sync-log";
import type { SyncResult, SyncVaultOptions } from "./types";

export type { SyncResult, SyncVaultOptions } from "./types";

const LOCK_MINUTES = 5;

function finishSync(workspaceId: string, result: SyncResult, startedAt: number): SyncResult {
	logSyncComplete(workspaceId, result, Date.now() - startedAt);
	return result;
}

async function tryAcquireWorkspaceLock(workspaceId: string): Promise<boolean> {
	const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
	const result = await prisma.workspace.updateMany({
		where: {
			id: workspaceId,
			OR: [{ syncLockedUntil: null }, { syncLockedUntil: { lt: new Date() } }],
		},
		data: { syncLockedUntil: until },
	});
	return result.count > 0;
}

async function releaseWorkspaceLock(workspaceId: string): Promise<void> {
	await prisma.workspace.update({
		where: { id: workspaceId },
		data: { syncLockedUntil: null },
	});
}

export async function syncVaultForWorkspace(
	workspaceId: string,
	options?: SyncVaultOptions,
): Promise<SyncResult> {
	const reconcileOrphans = options?.reconcileOrphans ?? false;
	const startedAt = Date.now();

	const config = await getWorkspaceVaultRepoConfig(workspaceId);
	if (!config?.githubSync) {
		console.info(`[vault-sync] check workspace=${workspaceId.slice(0, 8)}… → skip-not-configured`);
		return finishSync(workspaceId, { status: "not-configured" }, startedAt);
	}

	const { owner, repo, branch } = config;
	const token = await getGitHubTokenForWorkspace(workspaceId);
	if (!token) {
		console.info(
			`[vault-sync] check workspace=${workspaceId.slice(0, 8)}… repo=${owner}/${repo} → skip-no-token`,
		);
		return finishSync(workspaceId, { status: "no-token" }, startedAt);
	}

	const locked = !(await tryAcquireWorkspaceLock(workspaceId));
	if (locked) {
		console.info(
			`[vault-sync] check workspace=${workspaceId.slice(0, 8)}… repo=${owner}/${repo}@${branch} → skip-locked`,
		);
		return finishSync(workspaceId, { status: "skipped-locked" }, startedAt);
	}

	const octokit = getOctokitClient(token);

	try {
		const { commitSha: latestSha, treeSha: latestTreeSha } = await getBranchTipWithTree(
			octokit,
			owner,
			repo,
			branch,
		);

		const workspace = await prisma.workspace.findUnique({
			where: { id: workspaceId },
			select: { lastSyncedSha: true, initialSyncCompleted: true },
		});

		const initialSyncCompleted = workspace?.initialSyncCompleted ?? false;
		const lastSyncedSha = workspace?.lastSyncedSha ?? null;

		if (initialSyncCompleted && lastSyncedSha === latestSha) {
			if (!reconcileOrphans) {
				logSyncCheck(workspaceId, {
					owner,
					repo,
					branch,
					lastSyncedSha,
					latestSha,
					initialSyncCompleted,
					decision: "up-to-date",
				});
				return finishSync(workspaceId, { status: "up-to-date" }, startedAt);
			}

			logSyncCheck(workspaceId, {
				owner,
				repo,
				branch,
				lastSyncedSha,
				latestSha,
				initialSyncCompleted,
				decision: "reconcile-only",
			});
			logSyncStart(workspaceId, "reconcile-orphans", { owner, repo, branch, headSha: latestSha });

			const remotePaths = await listMirrorablePathsFromTreeSha(
				octokit,
				owner,
				repo,
				latestTreeSha,
			);
			const orphanDeletes = await reconcileWorkspaceMirrorOrphans(workspaceId, remotePaths);

			if (orphanDeletes.length > 0) {
				logSyncOrphanReconcile(workspaceId, orphanDeletes.length, orphanDeletes);
				await prisma.workspace.update({
					where: { id: workspaceId },
					data: { lastSyncAt: new Date(), lastSyncError: null },
				});
				revalidateWorkspaceVaultCache(workspaceId);
				return finishSync(
					workspaceId,
					{ status: "synced", filesUpdated: 0, filesDeleted: orphanDeletes.length },
					startedAt,
				);
			}

			logSyncCheck(workspaceId, {
				owner,
				repo,
				branch,
				lastSyncedSha,
				latestSha,
				initialSyncCompleted,
				decision: "up-to-date",
			});
			return finishSync(workspaceId, { status: "up-to-date" }, startedAt);
		}

		if (!initialSyncCompleted || !lastSyncedSha) {
			logSyncCheck(workspaceId, {
				owner,
				repo,
				branch,
				lastSyncedSha,
				latestSha,
				initialSyncCompleted,
				decision: "full-import",
			});
			logSyncStart(workspaceId, "full-import", { owner, repo, branch, headSha: latestSha });

			const { imported } = await runWorkspaceFullImport(
				workspaceId,
				octokit,
				owner,
				repo,
				branch,
				latestSha,
			);
			revalidateWorkspaceVaultCache(workspaceId);
			return finishSync(workspaceId, { status: "full-import", imported }, startedAt);
		}

		logSyncCheck(workspaceId, {
			owner,
			repo,
			branch,
			lastSyncedSha,
			latestSha,
			initialSyncCompleted,
			decision: "incremental",
		});

		try {
			logSyncStart(workspaceId, "incremental", {
				owner,
				repo,
				branch,
				baseSha: lastSyncedSha,
				headSha: latestSha,
			});

			const { toDelete, toFetch, compareDeletes, compareFetched, orphanDeletes } =
				await applyWorkspaceIncrementalSync(
					workspaceId,
					octokit,
					owner,
					repo,
					latestSha,
					latestTreeSha,
					lastSyncedSha,
					{ reconcileOrphans },
				);

			logSyncIncrementalDelta(workspaceId, {
				compareDeleted: compareDeletes.length,
				compareFetched: compareFetched.length,
				orphanDeleted: orphanDeletes.length,
				deletedPaths: toDelete,
				fetchedPaths: toFetch,
			});

			if (toFetch.length > 0 || toDelete.length > 0) {
				revalidateWorkspaceVaultCache(workspaceId);
			}
			return finishSync(
				workspaceId,
				{ status: "synced", filesUpdated: toFetch.length, filesDeleted: toDelete.length },
				startedAt,
			);
		} catch (compareError) {
			console.warn("[vault-sync] compare failed, running full re-import:", compareError);
			logSyncCheck(workspaceId, {
				owner,
				repo,
				branch,
				lastSyncedSha,
				latestSha,
				initialSyncCompleted,
				decision: "full-import-recovery",
			});
			logSyncStart(workspaceId, "full-import", { owner, repo, branch, headSha: latestSha });

			await deleteAllWorkspaceMirror(workspaceId);
			await prisma.workspace.update({
				where: { id: workspaceId },
				data: { lastSyncedSha: null, initialSyncCompleted: false },
			});
			const { imported } = await runWorkspaceFullImport(
				workspaceId,
				octokit,
				owner,
				repo,
				branch,
				latestSha,
			);
			revalidateWorkspaceVaultCache(workspaceId);
			return finishSync(workspaceId, { status: "full-import", imported }, startedAt);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await prisma.workspace.update({
			where: { id: workspaceId },
			data: { lastSyncError: message },
		});
		return finishSync(workspaceId, { status: "error", message }, startedAt);
	} finally {
		await releaseWorkspaceLock(workspaceId);
	}
}

export async function forceFullWorkspaceVaultResync(workspaceId: string): Promise<SyncResult> {
	console.info(`[vault-sync] force-resync requested workspace=${workspaceId.slice(0, 8)}…`);
	await deleteAllWorkspaceMirror(workspaceId);
	await prisma.workspace.update({
		where: { id: workspaceId },
		data: {
			lastSyncedSha: null,
			initialSyncCompleted: false,
			lastSyncError: null,
			lastSyncAt: null,
			syncLockedUntil: null,
		},
	});
	revalidateWorkspaceVaultCache(workspaceId);
	return syncVaultForWorkspace(workspaceId, { reconcileOrphans: true });
}
