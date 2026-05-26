"use client";

import * as React from "react";
import type { VaultTreeNode } from "@/types/vault";

export function flattenVaultTree(nodes: VaultTreeNode[]): VaultTreeNode[] {
	const result: VaultTreeNode[] = [];
	const walk = (list: VaultTreeNode[]) => {
		for (const node of list) {
			result.push(node);
			if (node.children) walk(node.children);
		}
	};
	walk(nodes);
	return result;
}

export function findVaultTreeNode(
	nodes: VaultTreeNode[],
	path: string,
): VaultTreeNode | null {
	for (const node of nodes) {
		if (node.path === path) return node;
		if (node.children) {
			const found = findVaultTreeNode(node.children, path);
			if (found) return found;
		}
	}
	return null;
}

export function parentVaultPath(path: string): string {
	if (!path.includes("/")) return "";
	return path.split("/").slice(0, -1).join("/");
}

/** Target directory for new file/folder from current selection. */
/** Parent path for create-from-context-menu based on click target (null = tree item). */
export function resolveCreateParentFromClick(
	target: EventTarget | null,
	selectionParentPath: string,
): string | null {
	if (!target || !(target instanceof Element)) return selectionParentPath;
	if (target.closest("[data-vault-tree-item]")) return null;

	const list = target.closest<HTMLElement>("[data-vault-tree-list]");
	if (list?.dataset.vaultParentPath !== undefined) {
		return list.dataset.vaultParentPath;
	}

	if (target.closest("[data-vault-tree-scroll]")) {
		return selectionParentPath;
	}

	return selectionParentPath;
}

export function resolveCreateParentPath(
	selectedPaths: Set<string>,
	anchorPath: string | null,
	nodes: VaultTreeNode[],
): string {
	if (selectedPaths.size === 0) return "";

	const paths = anchorPath
		? [
				anchorPath,
				...Array.from(selectedPaths).filter((p) => p !== anchorPath),
			]
		: Array.from(selectedPaths);

	for (let i = paths.length - 1; i >= 0; i--) {
		const node = findVaultTreeNode(nodes, paths[i]);
		if (node?.type === "directory") return paths[i];
	}

	const ref =
		anchorPath && selectedPaths.has(anchorPath)
			? anchorPath
			: paths[paths.length - 1];
	return parentVaultPath(ref);
}

export interface VaultTreeSelectionValue {
	selectedPaths: Set<string>;
	anchorPath: string | null;
	isSelected: (path: string) => boolean;
	handleItemClick: (path: string, e: React.MouseEvent) => void;
	selectOnly: (path: string) => void;
	clearSelection: () => void;
	getActionTargets: (path: string) => VaultTreeNode[];
}

export function useVaultTreeSelection(
	tree: VaultTreeNode[],
): VaultTreeSelectionValue {
	const [selectedPaths, setSelectedPaths] = React.useState<Set<string>>(
		() => new Set(),
	);
	const [anchorPath, setAnchorPath] = React.useState<string | null>(null);
	const flatNodes = React.useMemo(() => flattenVaultTree(tree), [tree]);

	const selectOnly = React.useCallback((path: string) => {
		setSelectedPaths(new Set([path]));
		setAnchorPath(path);
	}, []);

	const clearSelection = React.useCallback(() => {
		setSelectedPaths(new Set());
		setAnchorPath(null);
	}, []);

	const handleItemClick = React.useCallback(
		(path: string, e: React.MouseEvent) => {
			const isRange = e.shiftKey;
			const isToggle = e.metaKey || e.ctrlKey;

			if (isRange && anchorPath) {
				const a = flatNodes.findIndex((n) => n.path === anchorPath);
				const b = flatNodes.findIndex((n) => n.path === path);
				if (a !== -1 && b !== -1) {
					const lo = Math.min(a, b);
					const hi = Math.max(a, b);
					const range = new Set(
						flatNodes.slice(lo, hi + 1).map((n) => n.path),
					);
					setSelectedPaths(range);
					return;
				}
			}

			if (isToggle) {
				setSelectedPaths((prev) => {
					const next = new Set(prev);
					if (next.has(path)) next.delete(path);
					else next.add(path);
					return next;
				});
				setAnchorPath(path);
				return;
			}

			selectOnly(path);
		},
		[anchorPath, flatNodes, selectOnly],
	);

	const isSelected = React.useCallback(
		(path: string) => selectedPaths.has(path),
		[selectedPaths],
	);

	const getActionTargets = React.useCallback(
		(path: string): VaultTreeNode[] => {
			if (!selectedPaths.has(path) || selectedPaths.size <= 1) {
				const node = findVaultTreeNode(tree, path);
				return node ? [node] : [];
			}
			return Array.from(selectedPaths)
				.map((p) => findVaultTreeNode(tree, p))
				.filter((n): n is VaultTreeNode => n !== null);
		},
		[selectedPaths, tree],
	);

	return {
		selectedPaths,
		anchorPath,
		isSelected,
		handleItemClick,
		selectOnly,
		clearSelection,
		getActionTargets,
	};
}

const VaultTreeSelectionCtx = React.createContext<VaultTreeSelectionValue | null>(
	null,
);

export function VaultTreeSelectionProvider({
	value,
	children,
}: {
	value: VaultTreeSelectionValue;
	children: React.ReactNode;
}) {
	return (
		<VaultTreeSelectionCtx.Provider value={value}>
			{children}
		</VaultTreeSelectionCtx.Provider>
	);
}

export function useVaultTreeSelectionCtx(): VaultTreeSelectionValue {
	const ctx = React.useContext(VaultTreeSelectionCtx);
	if (!ctx) {
		throw new Error(
			"useVaultTreeSelectionCtx must be used within VaultTreeSelectionProvider",
		);
	}
	return ctx;
}

export function useOptionalVaultTreeSelectionCtx(): VaultTreeSelectionValue | null {
	return React.useContext(VaultTreeSelectionCtx);
}
