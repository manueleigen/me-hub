"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { VaultFolderMenuItems } from "@/components/vault/vault-item-menu";
import { VaultPointerMenu } from "@/components/vault/vault-pointer-menu";
import { useVaultFolderMenu, type VaultFolderTarget } from "@/hooks/use-vault-folder-menu";
import type { VaultTreeNode } from "@/types/vault";
import type { TreeAction } from "@/components/vault/vault-tree-actions";

interface VaultFolderContextMenuProps {
	folder: VaultFolderTarget;
	gitHubBase: string;
	isVaultRoot?: boolean;
	childNodes?: VaultTreeNode[];
	onStartCreate?: (type: "file" | "folder", parentPath: string) => void;
	vaultWriteEnabled?: boolean;
	createDisabled?: boolean;
	treeDispatch?: (action: TreeAction) => void;
	children: React.ReactNode;
	className?: string;
}

export function VaultFolderContextMenu({
	folder,
	gitHubBase,
	isVaultRoot = false,
	childNodes,
	onStartCreate,
	vaultWriteEnabled = true,
	createDisabled = false,
	treeDispatch,
	children,
	className,
}: VaultFolderContextMenuProps) {
	const {
		folderMenuActions,
		isRenaming,
		renameValue,
		setRenameValue,
		setIsRenaming,
		handleRename,
		renameRef,
	} = useVaultFolderMenu(folder, gitHubBase, {
		isVaultRoot,
		childNodes,
		onStartCreate,
		vaultWriteEnabled,
		createDisabled,
		treeDispatch,
	});

	const [pointerMenu, setPointerMenu] = React.useState<{
		x: number;
		y: number;
	} | null>(null);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setPointerMenu({ x: e.clientX, y: e.clientY });
	};

	if (isRenaming) {
		return (
			<div className={className}>
				<Input
					ref={renameRef}
					value={renameValue}
					onChange={(e) => setRenameValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") void handleRename();
						if (e.key === "Escape") {
							setIsRenaming(false);
							setRenameValue(folder.name);
						}
					}}
					onBlur={() => void handleRename()}
					className="h-8 text-sm"
				/>
			</div>
		);
	}

	return (
		<div
			data-vault-folder-item
			data-vault-tree-item={isVaultRoot ? undefined : true}
			className={className}
			onContextMenu={handleContextMenu}
		>
			{children}
			<VaultPointerMenu
				open={!!pointerMenu}
				x={pointerMenu?.x ?? 0}
				y={pointerMenu?.y ?? 0}
				onOpenChange={(open) => {
					if (!open) setPointerMenu(null);
				}}
			>
				<VaultFolderMenuItems
					actions={folderMenuActions}
					Item={DropdownMenuItem}
					Separator={DropdownMenuSeparator}
				/>
			</VaultPointerMenu>
		</div>
	);
}
