import type { VaultFile, VaultTreeNode } from "@/types/vault";

export function flattenVaultTree(files: VaultFile[]): VaultFile[] {
	const result: VaultFile[] = [];
	function traverse(items: VaultFile[]) {
		for (const item of items) {
			result.push(item);
			if (item.children) traverse(item.children);
		}
	}
	traverse(files);
	return result;
}

export function flattenVaultTreeNodes(nodes: VaultTreeNode[]): VaultTreeNode[] {
	const result: VaultTreeNode[] = [];
	function traverse(items: VaultTreeNode[]) {
		for (const item of items) {
			result.push(item);
			if (item.children) traverse(item.children);
		}
	}
	traverse(nodes);
	return result;
}

export function findVaultFile(path: string, roots: VaultFile[]): VaultFile | null {
	const segments = path.split("/").filter(Boolean);
	let current = roots;
	let found: VaultFile | null = null;

	for (let i = 0; i < segments.length; i++) {
		const targetPath = segments.slice(0, i + 1).join("/");
		found = current.find((f) => f.path === targetPath) || null;
		if (!found) return null;
		if (found.type === "directory" && found.children) {
			current = found.children;
		}
	}

	return found;
}

export function getVaultBreadcrumbs(
	path: string,
): Array<{ name: string; path: string }> {
	const segments = path.split("/").filter(Boolean);
	return segments.map((segment, i) => ({
		name: segment,
		path: segments.slice(0, i + 1).join("/"),
	}));
}
