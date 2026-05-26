import { Octokit } from "octokit";

/** GitHub REST API version — avoids deprecation warnings on unversioned requests. */
const GITHUB_API_VERSION = "2026-03-10";

export function getOctokitClient(token?: string) {
	const octokit = new Octokit({
		auth: token ?? undefined,
	});

	octokit.hook.before("request", (options) => {
		options.headers = {
			...options.headers,
			"x-github-api-version": GITHUB_API_VERSION,
		};
	});

	return octokit;
}

export const fetchNoStore = (url: string, options: RequestInit) =>
	fetch(url, { ...options, cache: "no-store" });
