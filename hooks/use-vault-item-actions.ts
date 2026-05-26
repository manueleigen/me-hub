"use client";

import * as React from "react";
import { toast } from "sonner";
import {
	deleteVaultItem,
	renameVaultItem,
	duplicateVaultFile,
} from "@/app/actions/vault";
import { useRevalidatePage } from "@/hooks/use-revalidate-page";
import { useSync } from "@/lib/vault/sync-context";
import { vaultDuplicateFileName } from "@/lib/vault/display-name";
import type { VaultItemMenuActions } from "@/components/vault/vault-item-menu";

export interface VaultItemTarget {
	path: string;
	name: string;
	type: "file" | "directory";
}

export function useVaultItemActions(
	item: VaultItemTarget,
	gitHubBase: string,
) {
	const revalidate = useRevalidatePage();
	const { startSync, endSync } = useSync();
	const [isRenaming, setIsRenaming] = React.useState(false);
	const [renameValue, setRenameValue] = React.useState(item.name);
	const renameRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		setRenameValue(item.name);
	}, [item.name]);

	React.useEffect(() => {
		if (isRenaming) requestAnimationFrame(() => renameRef.current?.select());
	}, [isRenaming]);

	const gitHubUrl = gitHubBase
		? `${gitHubBase}/${item.type === "directory" ? "tree" : "blob"}/HEAD/${item.path}`
		: null;

	const handleDelete = () => {
		if (!window.confirm(`„${item.name}“ wirklich löschen?`)) return;
		startSync();
		React.startTransition(async () => {
			try {
				await deleteVaultItem(item.path, item.type);
				toast.success(`„${item.name}“ gelöscht`);
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Löschen");
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	const handleRename = async () => {
		const newName = renameValue.trim();
		if (!newName || newName === item.name) {
			setIsRenaming(false);
			setRenameValue(item.name);
			return;
		}
		setIsRenaming(false);
		startSync();
		React.startTransition(async () => {
			try {
				await renameVaultItem(item.path, newName, item.type);
				toast.success("Umbenannt");
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Umbenennen");
				setRenameValue(item.name);
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	const handleDuplicate = () => {
		if (item.type !== "file") return;
		startSync();
		React.startTransition(async () => {
			try {
				await duplicateVaultFile(item.path);
				toast.success("Datei dupliziert");
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Duplizieren");
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	const menuActions: VaultItemMenuActions = {
		multiSelected: false,
		showDuplicate: item.type === "file",
		gitHubUrl,
		onRename: () => {
			setRenameValue(item.name);
			setIsRenaming(true);
		},
		onDuplicate: handleDuplicate,
		onDelete: handleDelete,
	};

	return {
		menuActions,
		isRenaming,
		renameValue,
		setRenameValue,
		setIsRenaming,
		handleRename,
		renameRef,
	};
}
