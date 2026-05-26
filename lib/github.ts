import { getOctokitClient } from "@/lib/github/octokit";

export const octokit = getOctokitClient();

export const getRepoContents = async (
	owner: string,
	repo: string,
	path: string = "",
) => {
	try {
		const response = await octokit.rest.repos.getContent({
			owner,
			repo,
			path,
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching repo contents:", error);
		return null;
	}
};
