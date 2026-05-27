import { prisma } from "@/lib/prisma";
import { decryptGithubToken } from "@/lib/github/encrypt-token";

/** Whether the workspace has a dedicated PAT stored (not OAuth). */
export async function workspaceHasStoredGithubToken(workspaceId: string): Promise<boolean> {
	const row = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { vaultGithubToken: true },
	});
	return Boolean(row?.vaultGithubToken && decryptGithubToken(row.vaultGithubToken));
}

/**
 * Fine-grained (or classic) PAT for vault sync and GitHub Contents API.
 * OAuth login tokens are never used for repository access.
 */
export async function getGitHubTokenForWorkspace(workspaceId: string): Promise<string | null> {
	const row = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { vaultGithubToken: true },
	});
	if (!row) return null;

	return decryptGithubToken(row.vaultGithubToken);
}
