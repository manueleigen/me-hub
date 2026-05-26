import { getOctokitClient } from "@/lib/github/octokit";
import { getWorkspaceVaultRepoConfig } from "@/lib/github/workspace-mirror-context";
import { getGitHubTokenForWorkspace } from "@/lib/github/token";
import { prisma } from "@/lib/prisma";
import { getBranchTipSha } from "./branch-tip";
import type { VaultRemoteCheckResult } from "./types";

/**
 * Compares remote branch tip to lastSyncedSha without acquiring sync lock or mutating mirror.
 */
export async function checkVaultRemoteForWorkspace(
	workspaceId: string,
): Promise<VaultRemoteCheckResult> {
	const config = await getWorkspaceVaultRepoConfig(workspaceId);
	if (!config?.githubSync) {
		return { status: "not-configured" };
	}

	const { owner, repo, branch } = config;
	const token = await getGitHubTokenForWorkspace(workspaceId);
	if (!token) {
		return { status: "no-token" };
	}

	try {
		const row = await prisma.workspace.findUnique({
			where: { id: workspaceId },
			select: {
				lastSyncedSha: true,
				initialSyncCompleted: true,
				syncLockedUntil: true,
			},
		});

		if (row?.syncLockedUntil && row.syncLockedUntil.getTime() > Date.now()) {
			return { status: "in-progress" };
		}

		const octokit = getOctokitClient(token);
		const latestSha = await getBranchTipSha(octokit, owner, repo, branch);

		const initialSyncCompleted = row?.initialSyncCompleted ?? false;
		const lastSyncedSha = row?.lastSyncedSha ?? null;

		if (!initialSyncCompleted || !lastSyncedSha) {
			return { status: "needs-sync" };
		}

		if (lastSyncedSha === latestSha) {
			return { status: "up-to-date" };
		}

		return { status: "needs-sync" };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { status: "error", message };
	}
}
