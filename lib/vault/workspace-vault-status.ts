import { getGitHubTokenForWorkspace } from "@/lib/github/token";
import type { ResolvedWorkspace } from "@/app/actions/workspaces";

export type WorkspaceVaultFields = {
	githubSync: boolean;
	vaultGithubOwner: string | null;
	vaultGithubRepo: string | null;
};

export const VAULT_NOT_LINKED_ERROR =
	"GitHub-Vault ist noch nicht verknüpft. Bitte in den Workspace-Einstellungen konfigurieren.";

export function isWorkspaceVaultLinked(workspace: WorkspaceVaultFields): boolean {
	return Boolean(
		workspace.githubSync &&
			workspace.vaultGithubOwner?.trim() &&
			workspace.vaultGithubRepo?.trim(),
	);
}

export function getWorkspaceVaultSettingsHref(slug: string): string {
	return `/w/${slug}/settings/github`;
}

export function resolveVaultLinkStatus(input: {
	workspace: WorkspaceVaultFields | null;
	workspaceSlug: string | null;
}): { vaultLinked: boolean; settingsHref: string } {
	if (input.workspace && input.workspaceSlug) {
		return {
			vaultLinked: isWorkspaceVaultLinked(input.workspace),
			settingsHref: getWorkspaceVaultSettingsHref(input.workspaceSlug),
		};
	}

	return { vaultLinked: false, settingsHref: "/workspaces" };
}

/** Server-side: repo configured and a GitHub token is available (PAT, OAuth, or env). */
export async function resolveActiveVaultLinkStatus(
	resolved: ResolvedWorkspace | null,
): Promise<{ vaultLinked: boolean; settingsHref: string }> {
	if (!resolved) {
		return { vaultLinked: false, settingsHref: "/workspaces" };
	}

	const settingsHref = getWorkspaceVaultSettingsHref(resolved.workspace.slug);
	if (!isWorkspaceVaultLinked(resolved.workspace)) {
		return { vaultLinked: false, settingsHref };
	}

	const token = await getGitHubTokenForWorkspace(resolved.workspace.id);
	return { vaultLinked: Boolean(token), settingsHref };
}
