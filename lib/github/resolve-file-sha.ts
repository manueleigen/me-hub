import { getCachedVaultConfig } from "@/lib/cache/server";
import { getOctokitClient } from "@/lib/github/octokit";
import { getGitHubTokenForWorkspace } from "@/lib/github/token";
import { getVaultConfig } from "@/lib/vault/config";

export const MIRROR_PLACEHOLDER_SHA = "mirror";

export function isMirrorPlaceholderSha(sha?: string | null): boolean {
	return !sha || sha === MIRROR_PLACEHOLDER_SHA;
}

/** Resolves a GitHub blob SHA for updates — fetches from remote when mirror uses a placeholder. */
export async function resolveFileSha(
	path: string,
	sha?: string,
): Promise<string | undefined> {
	if (!isMirrorPlaceholderSha(sha)) return sha;

	try {
		const { owner, repo, branch } = await getVaultConfig();
		const { workspaceId } = await getCachedVaultConfig();
		const token = workspaceId ? await getGitHubTokenForWorkspace(workspaceId) : null;
		const octokit = getOctokitClient(token ?? undefined);
		const { data } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path,
			ref: branch,
		});

		if (!Array.isArray(data) && "sha" in data && typeof data.sha === "string") {
			return data.sha;
		}
	} catch (error) {
		console.error(`[resolveFileSha] failed for ${path}:`, error);
	}

	return undefined;
}
