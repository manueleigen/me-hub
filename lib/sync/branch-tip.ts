import { RequestError } from "@octokit/request-error";
import type { Octokit } from "octokit";
import { fetchNoStore } from "@/lib/github/octokit";

/** Strip accidental `refs/heads/` prefix from profile input. */
export function normalizeVaultBranch(branch: string): string {
	const trimmed = branch.trim();
	const prefix = "refs/heads/";
	return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;
}

async function describeBranchNotFound(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
): Promise<string> {
	try {
		const { data } = await octokit.rest.repos.get({
			owner,
			repo,
			request: { fetch: fetchNoStore },
		});
		const defaultBranch = data.default_branch;
		if (defaultBranch && defaultBranch !== branch) {
			return `Branch „${branch}“ existiert nicht in ${owner}/${repo}. Standard-Branch des Repos: „${defaultBranch}“ — unter Profil → GitHub Vault Konfiguration eintragen.`;
		}
		return `Branch „${branch}“ nicht gefunden in ${owner}/${repo}.`;
	} catch (repoError) {
		if (repoError instanceof RequestError && repoError.status === 404) {
			return `Repository ${owner}/${repo} nicht gefunden oder kein Zugriff. Workspace-PAT unter Einstellungen → GitHub Vault hinterlegen oder GitHub-OAuth des Owners mit repo-Berechtigung nutzen.`;
		}
		return `Branch „${branch}“ nicht gefunden in ${owner}/${repo}.`;
	}
}

function wrapGithubRequestError(
	error: unknown,
	owner: string,
	repo: string,
	branch: string,
	message: string,
): Error {
	if (error instanceof RequestError) {
		const wrapped = new Error(message);
		wrapped.cause = error;
		return wrapped;
	}
	if (error instanceof Error) {
		error.message = message;
		return error;
	}
	return new Error(message);
}

export type BranchTipInfo = {
	commitSha: string;
	treeSha: string;
};

async function fetchBranchTip(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
): Promise<BranchTipInfo> {
	const normalizedBranch = normalizeVaultBranch(branch) || "main";
	const { data } = await octokit.rest.repos.getBranch({
		owner,
		repo,
		branch: normalizedBranch,
		request: { fetch: fetchNoStore },
	});
	return {
		commitSha: data.commit.sha,
		treeSha: data.commit.commit.tree.sha,
	};
}

export async function getBranchTipWithTree(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
): Promise<BranchTipInfo> {
	const normalizedBranch = normalizeVaultBranch(branch) || "main";
	try {
		return await fetchBranchTip(octokit, owner, repo, branch);
	} catch (error) {
		if (error instanceof RequestError && error.status === 404) {
			const message = await describeBranchNotFound(
				octokit,
				owner,
				repo,
				normalizedBranch,
			);
			throw wrapGithubRequestError(error, owner, repo, normalizedBranch, message);
		}
		throw error;
	}
}

export async function getBranchTipSha(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
): Promise<string> {
	const normalizedBranch = normalizeVaultBranch(branch) || "main";
	try {
		const tip = await fetchBranchTip(octokit, owner, repo, branch);
		return tip.commitSha;
	} catch (error) {
		if (error instanceof RequestError && error.status === 404) {
			const message = await describeBranchNotFound(
				octokit,
				owner,
				repo,
				normalizedBranch,
			);
			throw wrapGithubRequestError(error, owner, repo, normalizedBranch, message);
		}
		throw error;
	}
}
