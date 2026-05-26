import { getCachedActiveWorkspaceVault } from "@/lib/cache/server";
import { getGitHubTokenForWorkspace } from "@/lib/github/token";
import {
	isWorkspaceVaultLinked,
	VAULT_NOT_LINKED_ERROR,
} from "@/lib/vault/workspace-vault-status";

/** Throws when the active workspace has no GitHub vault configured. */
export async function requireActiveWorkspaceVaultLinked(): Promise<void> {
	const workspace = await getCachedActiveWorkspaceVault();
	if (!workspace || !isWorkspaceVaultLinked(workspace)) {
		throw new Error(VAULT_NOT_LINKED_ERROR);
	}

	const token = await getGitHubTokenForWorkspace(workspace.id);
	if (!token) {
		throw new Error(VAULT_NOT_LINKED_ERROR);
	}
}
