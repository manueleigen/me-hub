import { features } from "@/lib/config";
import type { VaultFile, VaultTreeNode } from "@/types/vault";
import { getVaultBreadcrumbs } from "@/lib/vault/tree-utils";
import {
	getGitHubItem,
	getGitHubTree,
	createOrUpdateGitHubFile,
	deleteGitHubFile,
} from "@/app/actions/github";
import { VaultPathExistsError, isGithubPathExistsError } from "@/lib/vault/errors";

function normalizeGitTree(gitData: unknown): any[] {
	if (!gitData || !Array.isArray(gitData)) return [];
	return gitData;
}

export function createVaultService(opts: { githubSync?: boolean } = {}) {
	const useGithubSync = opts.githubSync ?? features.githubSync;

	return {
		async getTree(): Promise<VaultTreeNode[]> {
			if (useGithubSync) {
				const gitData = normalizeGitTree(await getGitHubTree());
				if (gitData.length === 0) return [];
				const filtered = gitData.filter(
					(item: any) =>
						!item.path.endsWith("/.gitkeep") && item.path !== ".gitkeep",
				);
				return convertGitTreeToNestedNodes(filtered);
			}
			return [];
		},

		async getFile(path: string): Promise<VaultFile | null> {
			if (useGithubSync) {
				const data = await getGitHubItem(path);
				if (!data || Array.isArray(data) || data.type !== "file") return null;
				return {
					sha: data.sha,
					path: data.path,
					name: data.name,
					title: data.name,
					content: data.content,
					type: "file",
				};
			}
			return null;
		},

		async getFolderContents(path: string): Promise<VaultFile[]> {
			if (useGithubSync) {
				const data = await getGitHubItem(path);
				if (!data || !Array.isArray(data)) return [];
				const filtered = (data as any[]).filter(
					(item: any) =>
						!item.path.endsWith("/.gitkeep") && item.name !== ".gitkeep",
				);
				return sortVaultNodes(filtered.map((item: any) => ({
					path: item.path,
					name: item.name,
					title: item.name,
					type: item.type === "dir" ? "directory" : "file",
					isExpanded: false,
					...(item.type === "dir" ? { children: [] } : {}),
				})));
			}
			return [];
		},

		async search(_query: string): Promise<VaultFile[]> {
			return [];
		},

		async getRecentFiles(_limit = 5): Promise<VaultFile[]> {
			return [];
		},

		async saveFile(path: string, content: string): Promise<boolean> {
			if (!features.editing) throw new Error("Editing is disabled");

			if (useGithubSync) {
				const current = await getGitHubItem(path);
				const sha =
					current && !Array.isArray(current) && "sha" in current
						? (current.sha as string)
						: undefined;
				await createOrUpdateGitHubFile(path, content, `Update ${path}`, sha);
				return true;
			}

			console.log(`[Vault] Saving file: ${path}`);
			return true;
		},

		async createFile(parentPath: string, name: string): Promise<VaultFile> {
			if (!features.editing) throw new Error("Editing is disabled");

			const fileName = name.endsWith(".md") ? name : `${name}.md`;
			const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;
			const content = `# ${fileName.replace(/\.md$/i, "")}\n`;

			if (useGithubSync) {
				const existing = await getGitHubItem(filePath);
				if (existing && !Array.isArray(existing)) {
					throw new VaultPathExistsError(fileName, "file");
				}
				try {
					await createOrUpdateGitHubFile(
						filePath,
						content,
						`Create ${fileName}`,
					);
				} catch (err) {
					if (isGithubPathExistsError(err)) {
						throw new VaultPathExistsError(fileName, "file");
					}
					throw err;
				}
			}

			return { path: filePath, name: fileName, title: fileName, content, type: "file" };
		},

		async createFolder(parentPath: string, name: string): Promise<boolean> {
			if (!features.editing) throw new Error("Editing is disabled");

			const folderPath = parentPath ? `${parentPath}/${name}` : name;

			if (useGithubSync) {
				const existing = await getGitHubItem(folderPath);
				if (existing) {
					throw new VaultPathExistsError(name, "folder");
				}
				try {
					await createOrUpdateGitHubFile(
						`${folderPath}/.gitkeep`,
						"",
						`Create folder ${name}`,
					);
				} catch (err) {
					if (isGithubPathExistsError(err)) {
						throw new VaultPathExistsError(name, "folder");
					}
					throw err;
				}
			}

			return true;
		},

		async deleteFile(path: string): Promise<boolean> {
			if (!features.editing) throw new Error("Editing is disabled");

			if (useGithubSync) {
				const item = await getGitHubItem(path);
				if (!item || Array.isArray(item)) throw new Error("File not found");
				await deleteGitHubFile(path, (item as any).sha);
			}

			return true;
		},

		async deleteFolder(path: string): Promise<boolean> {
			if (!features.editing) throw new Error("Editing is disabled");

			if (useGithubSync) {
				const treeData = normalizeGitTree(await getGitHubTree());
				const blobs = treeData.filter(
					(item: any) =>
						item.type === "blob" && item.path.startsWith(path + "/"),
				);
				for (const blob of blobs) {
					await deleteGitHubFile(blob.path, blob.sha);
				}
			}

			return true;
		},

		async renameFile(oldPath: string, newName: string): Promise<VaultFile> {
			if (!features.editing) throw new Error("Editing is disabled");

			const parts = oldPath.split("/");
			parts.pop();
			const parentPath = parts.join("/");
			const fileName = newName.endsWith(".md") ? newName : `${newName}.md`;
			const newPath = parentPath ? `${parentPath}/${fileName}` : fileName;

			if (useGithubSync) {
				const item = await getGitHubItem(oldPath);
				if (!item || Array.isArray(item)) throw new Error("File not found");
				await createOrUpdateGitHubFile(
					newPath,
					(item as any).content,
					`Rename ${oldPath} to ${newPath}`,
				);
				await deleteGitHubFile(oldPath, (item as any).sha);
			}

			return { path: newPath, name: fileName, title: fileName, type: "file" };
		},

		async renameFolder(oldPath: string, newName: string): Promise<boolean> {
			if (!features.editing) throw new Error("Editing is disabled");

			const parts = oldPath.split("/");
			parts.pop();
			const parentPath = parts.join("/");
			const newPath = parentPath ? `${parentPath}/${newName}` : newName;

			if (useGithubSync) {
				const treeData = normalizeGitTree(await getGitHubTree());
				const blobs = treeData.filter(
					(item: any) =>
						item.type === "blob" && item.path.startsWith(oldPath + "/"),
				);
				for (const blob of blobs) {
					const file = await getGitHubItem(blob.path);
					if (file && !Array.isArray(file) && "content" in file) {
						const relPath = blob.path.slice(oldPath.length + 1);
						const newFilePath = `${newPath}/${relPath}`;
						await createOrUpdateGitHubFile(
							newFilePath,
							(file as any).content,
							`Move to ${newFilePath}`,
						);
						await deleteGitHubFile(blob.path, blob.sha);
					}
				}
			}

			return true;
		},

		async moveFile(
			sourcePath: string,
			targetFolderPath: string,
		): Promise<boolean> {
			if (!features.editing) throw new Error("Editing is disabled");

			const fileName = sourcePath.split("/").pop()!;
			const newPath = targetFolderPath
				? `${targetFolderPath}/${fileName}`
				: fileName;

			if (useGithubSync) {
				const item = await getGitHubItem(sourcePath);
				if (!item || Array.isArray(item)) throw new Error("File not found");
				await createOrUpdateGitHubFile(
					newPath,
					(item as any).content,
					`Move ${sourcePath} to ${newPath}`,
				);
				await deleteGitHubFile(sourcePath, (item as any).sha);
			}

			return true;
		},

		async duplicateFile(path: string): Promise<VaultFile> {
			if (!features.editing) throw new Error("Editing is disabled");

			const parts = path.split("/");
			const fileName = parts.pop()!;
			const parentPath = parts.join("/");
			const dot = fileName.lastIndexOf(".");
			const newFileName =
				dot > 0
					? `${fileName.slice(0, dot)}-kopie${fileName.slice(dot)}`
					: `${fileName}-kopie.md`;
			const newPath = parentPath ? `${parentPath}/${newFileName}` : newFileName;

			if (useGithubSync) {
				const item = await getGitHubItem(path);
				if (!item || Array.isArray(item)) throw new Error("File not found");
				await createOrUpdateGitHubFile(
					newPath,
					(item as any).content,
					`Duplicate ${path}`,
				);
			}

			return { path: newPath, name: newFileName, title: newFileName, type: "file" };
		},

		getBreadcrumbs(path: string) {
			return getVaultBreadcrumbs(path);
		},
	};
}

export const vaultService = createVaultService();

function sortVaultNodes<T extends { type: "file" | "directory"; name: string }>(
	nodes: T[],
): T[] {
	const collator = new Intl.Collator("de", { sensitivity: "base" });
	const rank = (node: T): number => {
		if (node.type === "directory") return 0;
		return node.name.startsWith(".") ? 2 : 1;
	};

	return [...nodes].sort((a, b) => {
		const rankDiff = rank(a) - rank(b);
		if (rankDiff !== 0) return rankDiff;
		return collator.compare(a.name, b.name);
	});
}

export function convertGitTreeToNestedNodes(gitData: any[]): VaultTreeNode[] {
	const root: VaultTreeNode[] = [];
	const lookup: Record<string, VaultTreeNode> = {};

	const sortedData = [...gitData].sort((a, b) => a.path.length - b.path.length);

	for (const item of sortedData) {
		const parts = item.path.split("/");
		const name = parts[parts.length - 1];
		const parentPath = parts.slice(0, -1).join("/");

		const newNode: VaultTreeNode = {
			path: item.path,
			name: name,
			type: item.type === "tree" ? "directory" : "file",
			isExpanded: false,
			...(item.type === "tree" ? { children: [] } : {}),
		};

		lookup[item.path] = newNode;

		if (parentPath === "") {
			root.push(newNode);
		} else {
			const parent = lookup[parentPath];
			if (parent && parent.children) {
				parent.children.push(newNode);
			} else {
				root.push(newNode);
			}
		}
	}

	const sortRecursively = (nodes: VaultTreeNode[]): VaultTreeNode[] =>
		sortVaultNodes(nodes).map((node) =>
			node.children
				? { ...node, children: sortRecursively(node.children) }
				: node,
		);

	return sortRecursively(root);
}

export { findVaultFile, getVaultBreadcrumbs, flattenVaultTree } from "@/lib/vault/tree-utils";
export type { VaultFile, VaultTreeNode };
