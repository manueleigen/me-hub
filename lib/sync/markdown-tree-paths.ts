import type { Octokit } from "octokit";
import { fetchNoStore } from "@/lib/github/octokit";
import { shouldMirrorVaultFilePath } from "@/lib/vault/mirrorable-text-files";
import { normalizeVaultBranch } from "./branch-tip";

export { shouldMirrorVaultFilePath, shouldMirrorMarkdownPath } from "@/lib/vault/mirrorable-text-files";

/** Lists mirrorable text blob paths from a known git tree SHA (one recursive tree call). */
export async function listMirrorablePathsFromTreeSha(
	octokit: Octokit,
	owner: string,
	repo: string,
	treeSha: string,
): Promise<string[]> {
	const { data: treeData } = await octokit.rest.git.getTree({
		owner,
		repo,
		tree_sha: treeSha,
		recursive: "true",
		request: { fetch: fetchNoStore },
	});

	return (
		treeData.tree
			?.filter(
				(item) =>
					item.type === "blob" &&
					item.path &&
					shouldMirrorVaultFilePath(item.path),
			)
			.map((item) => item.path as string) ?? []
	);
}

/**
 * Lists mirrorable text blob paths on the branch tip tree (getBranch + recursive git tree).
 */
export async function listMirrorablePathsFromBranchTree(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
): Promise<string[]> {
	const { data: branchData } = await octokit.rest.repos.getBranch({
		owner,
		repo,
		branch: normalizeVaultBranch(branch) || "main",
		request: { fetch: fetchNoStore },
	});
	return listMirrorablePathsFromTreeSha(
		octokit,
		owner,
		repo,
		branchData.commit.commit.tree.sha,
	);
}

/** @deprecated Use {@link listMirrorablePathsFromBranchTree} */
export const listMarkdownPathsFromBranchTree = listMirrorablePathsFromBranchTree;
