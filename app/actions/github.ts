"use server";

import { Octokit } from "octokit";
import { getVaultConfig } from "@/lib/vault/config";

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

export async function getGitHubTree() {
	try {
		const { owner, repo, branch } = await getVaultConfig();
		const { data } = await octokit.rest.git.getTree({
			owner,
			repo,
			tree_sha: branch,
			recursive: "true",
		});

		const treeArray = data.tree;
		if (Array.isArray(treeArray)) {
			return treeArray;
		}
		return [treeArray];
	} catch (error) {
		console.error("Failed to list repo files:", error);
		return null;
	}
}

export async function getGitHubDir(path: string = "") {
	try {
		const { owner, repo, branch } = await getVaultConfig();
		const { data } = await octokit.rest.git.getTree({
			owner,
			repo,
			path,
			ref: branch,
			tree_sha: branch,
			recursive: "true",
		});

		if (Array.isArray(data)) {
			return data;
		}
		return [data];
	} catch (error) {
		console.error("Failed to list repo files:", error);
		return null;
	}
}

export async function deleteGitHubFile(path: string, sha: string) {
	const { owner, repo, branch } = await getVaultConfig();
	await octokit.rest.repos.deleteFile({
		owner,
		repo,
		path,
		message: `Delete ${path}`,
		sha,
		branch,
	});
}

export async function createOrUpdateGitHubFile(
	path: string,
	content: string,
	message: string,
	sha?: string,
) {
	const { owner, repo, branch } = await getVaultConfig();
	const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

	const { data } = await octokit.rest.repos.createOrUpdateFileContents({
		owner,
		repo,
		path,
		message,
		content: contentBase64,
		branch,
		...(sha ? { sha } : {}),
	});

	return data;
}

export async function getGitHubItem(path: string = "") {
	try {
		const { owner, repo, branch } = await getVaultConfig();
		const { data } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path,
			ref: branch,
		});

		if (!Array.isArray(data) && "content" in data) {
			const content = Buffer.from(data.content, "base64").toString("utf-8");
			return { ...data, content };
		}

		return data;
	} catch (error) {
		console.error("Failed to fetch from GitHub:", error);
		return null;
	}
}
