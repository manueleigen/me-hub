import type { VaultTreeNode } from "@/types/vault";

export type TreeAction =
	| { type: "add"; parentPath: string; node: VaultTreeNode }
	| { type: "delete"; path: string }
	| { type: "rename"; oldPath: string; newName: string }
	| { type: "move"; sourcePath: string; targetDirPath: string };

function findNode(nodes: VaultTreeNode[], path: string): VaultTreeNode | null {
	for (const node of nodes) {
		if (node.path === path) return node;
		if (node.children) {
			const found = findNode(node.children, path);
			if (found) return found;
		}
	}
	return null;
}

function removeNode(nodes: VaultTreeNode[], path: string): VaultTreeNode[] {
	return nodes.reduce<VaultTreeNode[]>((acc, node) => {
		if (node.path === path) return acc;
		if (node.children) {
			acc.push({ ...node, children: removeNode(node.children, path) });
		} else {
			acc.push(node);
		}
		return acc;
	}, []);
}

function renameNode(nodes: VaultTreeNode[], oldPath: string, newName: string): VaultTreeNode[] {
	return nodes.map((node) => {
		if (node.path === oldPath) {
			const parentDir = oldPath.includes("/") ? oldPath.split("/").slice(0, -1).join("/") : "";
			const ext = node.type === "file" && !newName.includes(".") ? ".md" : "";
			const newFileName = `${newName}${ext}`;
			const newPath = parentDir ? `${parentDir}/${newFileName}` : newFileName;
			return { ...node, name: newFileName, path: newPath };
		}
		if (node.children) {
			return { ...node, children: renameNode(node.children, oldPath, newName) };
		}
		return node;
	});
}

function addNode(nodes: VaultTreeNode[], parentPath: string, newNode: VaultTreeNode): VaultTreeNode[] {
	if (!parentPath) return [...nodes, newNode];
	return nodes.map((node) => {
		if (node.path === parentPath) {
			return { ...node, children: [...(node.children ?? []), newNode] };
		}
		if (node.children) {
			return { ...node, children: addNode(node.children, parentPath, newNode) };
		}
		return node;
	});
}

function moveNode(
	nodes: VaultTreeNode[],
	sourcePath: string,
	targetDirPath: string,
): VaultTreeNode[] {
	const node = findNode(nodes, sourcePath);
	if (!node) return nodes;
	const without = removeNode(nodes, sourcePath);
	return addNode(without, targetDirPath, node);
}

export function vaultTreeReducer(state: VaultTreeNode[], action: TreeAction): VaultTreeNode[] {
	switch (action.type) {
		case "add":
			return addNode(state, action.parentPath, action.node);
		case "delete":
			return removeNode(state, action.path);
		case "rename":
			return renameNode(state, action.oldPath, action.newName);
		case "move":
			return moveNode(state, action.sourcePath, action.targetDirPath);
	}
}
