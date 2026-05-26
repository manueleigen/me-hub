"use client";

import * as React from "react";
import { toast } from "sonner";
import { deleteVaultItem, renameVaultItem } from "@/app/actions/vault";
import { useRevalidatePage } from "@/hooks/use-revalidate-page";
import { useSync } from "@/lib/vault/sync-context";
import { flattenVaultTreeNodes } from "@/lib/vault/tree-utils";
import type { VaultFolderMenuActions } from "@/components/vault/vault-item-menu";
import type { VaultTreeNode } from "@/types/vault";
import type { TreeAction } from "@/components/vault/vault-tree-actions";

export interface VaultFolderTarget {
	path: string;
	name: string;
	children?: VaultTreeNode[];
}

function sortNodesForDeletion(nodes: VaultTreeNode[]): VaultTreeNode[] {
	const files = nodes.filter((n) => n.type === "file");
	const dirs = nodes
		.filter((n) => n.type === "directory")
		.sort((a, b) => b.path.length - a.path.length);
	return [...files, ...dirs];
}

export function useVaultFolderMenu(
	folder: VaultFolderTarget,
	gitHubBase: string,
	options: {
		isVaultRoot?: boolean;
		childNodes?: VaultTreeNode[];
		onStartCreate?: (type: "file" | "folder", parentPath: string) => void;
		vaultWriteEnabled?: boolean;
		createDisabled?: boolean;
		treeDispatch?: (action: TreeAction) => void;
	},
) {
	const {
		isVaultRoot = false,
		childNodes = folder.children ?? [],
		onStartCreate,
		vaultWriteEnabled = true,
		createDisabled = false,
		treeDispatch,
	} = options;

	const revalidate = useRevalidatePage();
	const { startSync, endSync } = useSync();
	const [isRenaming, setIsRenaming] = React.useState(false);
	const [renameValue, setRenameValue] = React.useState(folder.name);
	const renameRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		setRenameValue(folder.name);
	}, [folder.name]);

	React.useEffect(() => {
		if (isRenaming) requestAnimationFrame(() => renameRef.current?.select());
	}, [isRenaming]);

	const gitHubUrl = gitHubBase
		? isVaultRoot
			? `${gitHubBase}/tree/HEAD/`
			: `${gitHubBase}/tree/HEAD/${folder.path}`
		: null;

	const handleDeleteFolder = () => {
		if (isVaultRoot) return;
		if (!window.confirm(`Ordner „${folder.name}“ wirklich löschen?`)) return;
		startSync();
		React.startTransition(async () => {
			treeDispatch?.({ type: "delete", path: folder.path });
			try {
				await deleteVaultItem(folder.path, "directory");
				toast.success(`Ordner „${folder.name}“ gelöscht`);
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Löschen");
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	const handleDeleteAll = () => {
		const toDelete = isVaultRoot
			? flattenVaultTreeNodes(childNodes)
			: flattenVaultTreeNodes(childNodes);
		if (toDelete.length === 0) {
			toast.info("Keine Einträge zum Löschen");
			return;
		}
		const label = isVaultRoot ? "Vault" : folder.name;
		if (
			!window.confirm(
				`Alle ${toDelete.length} Einträge in „${label}“ wirklich löschen?`,
			)
		) {
			return;
		}
		startSync();
		React.startTransition(async () => {
			let ok = 0;
			for (const node of sortNodesForDeletion(toDelete)) {
				treeDispatch?.({ type: "delete", path: node.path });
				try {
					await deleteVaultItem(node.path, node.type);
					ok++;
				} catch {
					/* continue */
				}
			}
			if (ok > 0) {
				toast.success(`${ok} Einträge gelöscht`);
				React.startTransition(() => revalidate());
			} else {
				toast.error("Fehler beim Löschen");
			}
			endSync();
		});
	};

	const handleRename = async () => {
		if (isVaultRoot) {
			toast.info("Der Vault-Root kann nicht umbenannt werden.");
			setIsRenaming(false);
			return;
		}
		const newName = renameValue.trim();
		if (!newName || newName === folder.name) {
			setIsRenaming(false);
			setRenameValue(folder.name);
			return;
		}
		setIsRenaming(false);
		startSync();
		React.startTransition(async () => {
			treeDispatch?.({ type: "rename", oldPath: folder.path, newName });
			try {
				await renameVaultItem(folder.path, newName, "directory");
				toast.success("Ordner umbenannt");
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Umbenennen");
				setRenameValue(folder.name);
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	const folderMenuActions: VaultFolderMenuActions = {
		parentPath: folder.path,
		createDisabled: createDisabled || !vaultWriteEnabled,
		onCreateFile: () => onStartCreate?.("file", folder.path),
		onCreateFolder: () => onStartCreate?.("folder", folder.path),
		isVaultRoot,
		gitHubUrl,
		onRename: () => {
			setRenameValue(folder.name);
			setIsRenaming(true);
		},
		onDeleteAll: handleDeleteAll,
		onDeleteFolder: handleDeleteFolder,
		showRename: true,
		showDeleteFolder: !isVaultRoot,
	};

	return {
		folderMenuActions,
		isRenaming,
		renameValue,
		setRenameValue,
		setIsRenaming,
		handleRename,
		renameRef,
	};
}
