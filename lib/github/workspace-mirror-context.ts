import { normalizeVaultBranch } from "@/lib/sync/branch-tip";
import { prisma } from "@/lib/prisma";

export type WorkspaceMirrorReadContext = {
	workspaceId: string;
	ownerId: string;
	useMirror: boolean;
};

export async function getWorkspaceVaultRepoConfig(workspaceId: string) {
	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: {
			id: true,
			ownerId: true,
			vaultGithubOwner: true,
			vaultGithubRepo: true,
			vaultGithubBranch: true,
			githubSync: true,
			lastSyncedSha: true,
			initialSyncCompleted: true,
			syncLockedUntil: true,
		},
	});
	if (!workspace) return null;

	const owner = (workspace.vaultGithubOwner ?? "").trim();
	const repo = (workspace.vaultGithubRepo ?? "").trim();
	const branch = normalizeVaultBranch(workspace.vaultGithubBranch ?? "main") || "main";
	if (!owner || !repo) return null;

	return { ...workspace, owner, repo, branch };
}
