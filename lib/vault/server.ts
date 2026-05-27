import { cache } from "react";
import { getCachedActiveWorkspaceVault } from "@/lib/cache/server";
import { createVaultService } from "./index";
import type { VaultTreeNode } from "@/types/vault";

export const getUserVaultService = cache(async () => {
	const workspace = await getCachedActiveWorkspaceVault();
	const owner = (workspace?.vaultGithubOwner ?? "").trim();
	const repo = (workspace?.vaultGithubRepo ?? "").trim();
	const githubSync = Boolean(workspace?.githubSync && owner && repo);
	return createVaultService({ githubSync, workspaceId: workspace?.id ?? null });
});

/**
 * Deduped vault tree per request. With mirror active, reads Postgres directly.
 */
export const getCachedVaultTree = cache(async (): Promise<VaultTreeNode[]> => {
	const svc = await getUserVaultService();
	return svc.getTree();
});
