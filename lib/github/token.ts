import { prisma } from "@/lib/prisma";
import { decryptGithubToken } from "@/lib/github/encrypt-token";

async function ownerOAuthToken(ownerId: string): Promise<string | null> {
	const account = await prisma.account.findFirst({
		where: { userId: ownerId, providerId: "github" },
		select: { accessToken: true },
	});
	return account?.accessToken?.trim() ?? null;
}

/** Whether the workspace has a dedicated PAT stored (not OAuth). */
export async function workspaceHasStoredGithubToken(workspaceId: string): Promise<boolean> {
	const row = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { vaultGithubToken: true },
	});
	return Boolean(row?.vaultGithubToken && decryptGithubToken(row.vaultGithubToken));
}

/**
 * Token for vault sync and GitHub API access for a workspace.
 * Priority: workspace PAT (encrypted in DB) → workspace owner GitHub OAuth token.
 */
export async function getGitHubTokenForWorkspace(workspaceId: string): Promise<string | null> {
	const row = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { vaultGithubToken: true, ownerId: true },
	});
	if (!row) return null;

	const decrypted = decryptGithubToken(row.vaultGithubToken);
	if (decrypted) return decrypted;

	return ownerOAuthToken(row.ownerId);
}
