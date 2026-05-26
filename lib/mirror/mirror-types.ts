export type MirrorFile = {
	path: string;
	content: string;
	blobSha: string | null;
};

export type GitTreeEntry = {
	path: string;
	type: "blob" | "tree";
	sha: string;
};

export type GitDirEntry = {
	name: string;
	path: string;
	type: "file" | "dir";
	sha: string;
};

const PLACEHOLDER_SHA = "mirror";

export function pathsToGitTreeShape(paths: string[]): GitTreeEntry[] {
	const treePaths = new Set<string>();

	for (const filePath of paths) {
		const parts = filePath.split("/");
		for (let i = 1; i < parts.length; i++) {
			treePaths.add(parts.slice(0, i).join("/"));
		}
	}

	const entries: GitTreeEntry[] = [];
	for (const p of treePaths) {
		entries.push({ path: p, type: "tree", sha: PLACEHOLDER_SHA });
	}
	for (const p of paths) {
		entries.push({ path: p, type: "blob", sha: PLACEHOLDER_SHA });
	}

	return entries.sort((a, b) => a.path.localeCompare(b.path));
}
