"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { vaultEntryDisplayName } from "@/lib/vault/display-name";
import { vaultItemHref } from "@/hooks/use-vault-base-path";
import { useVaultItemActions, type VaultItemTarget } from "@/hooks/use-vault-item-actions";
import { useVaultFolderMenu } from "@/hooks/use-vault-folder-menu";
import { useVaultShell } from "@/components/vault/vault-shell-context";
import {
	VaultItemMenuItems,
	VaultFolderMenuItems,
} from "@/components/vault/vault-item-menu";
import { VaultPointerMenu } from "@/components/vault/vault-pointer-menu";
import type { VaultFile } from "@/types/vault";

interface VaultDirectoryItemProps {
	item: VaultFile;
	vaultBase: string;
	layout: "grid" | "list";
	className?: string;
	children?: React.ReactNode;
	onStartCreate?: (type: "file" | "folder", parentPath: string) => void;
	vaultWriteEnabled?: boolean;
	createDisabled?: boolean;
}

export function VaultDirectoryItem({
	item,
	vaultBase,
	layout,
	className,
	children,
	onStartCreate,
	vaultWriteEnabled = true,
	createDisabled = false,
}: VaultDirectoryItemProps) {
	const { gitHubBase } = useVaultShell();
	const isFolder = item.type === "directory";

	const fileActions = useVaultItemActions(
		{
			path: item.path,
			name: item.name,
			type: item.type,
		} satisfies VaultItemTarget,
		gitHubBase,
	);

	const folderMenu = useVaultFolderMenu(
		{ path: item.path, name: item.name, children: item.children },
		gitHubBase,
		{
			childNodes: item.children,
			onStartCreate,
			vaultWriteEnabled,
			createDisabled,
		},
	);

	const menuActions = isFolder ? null : fileActions.menuActions;
	const folderMenuActions = isFolder ? folderMenu.folderMenuActions : null;
	const isRenaming = isFolder ? folderMenu.isRenaming : fileActions.isRenaming;
	const renameValue = isFolder ? folderMenu.renameValue : fileActions.renameValue;
	const setRenameValue = isFolder
		? folderMenu.setRenameValue
		: fileActions.setRenameValue;
	const setIsRenaming = isFolder
		? folderMenu.setIsRenaming
		: fileActions.setIsRenaming;
	const handleRename = isFolder ? folderMenu.handleRename : fileActions.handleRename;
	const renameRef = isFolder ? folderMenu.renameRef : fileActions.renameRef;

	const [pointerMenu, setPointerMenu] = React.useState<{
		x: number;
		y: number;
	} | null>(null);

	const href = vaultItemHref(vaultBase, item.path);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setPointerMenu({ x: e.clientX, y: e.clientY });
	};

	const menu = (
		<VaultPointerMenu
			open={!!pointerMenu}
			x={pointerMenu?.x ?? 0}
			y={pointerMenu?.y ?? 0}
			onOpenChange={(open) => {
				if (!open) setPointerMenu(null);
			}}
		>
			{isFolder && folderMenuActions ? (
				<VaultFolderMenuItems
					actions={folderMenuActions}
					Item={DropdownMenuItem}
					Separator={DropdownMenuSeparator}
				/>
			) : menuActions ? (
				<VaultItemMenuItems
					actions={menuActions}
					Item={DropdownMenuItem}
					Separator={DropdownMenuSeparator}
				/>
			) : null}
		</VaultPointerMenu>
	);

	if (isRenaming) {
		return (
			<div
				data-vault-directory-item
				data-vault-folder-item={isFolder ? true : undefined}
				className={cn("rounded-lg border p-3", className)}
			>
				<Input
					ref={renameRef}
					value={renameValue}
					onChange={(e) => setRenameValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") void handleRename();
						if (e.key === "Escape") {
							setIsRenaming(false);
							setRenameValue(item.name);
						}
					}}
					onBlur={() => void handleRename()}
					className="h-8 text-sm"
				/>
			</div>
		);
	}

	if (layout === "grid") {
		return (
			<div
				data-vault-directory-item
				data-vault-folder-item={isFolder ? true : undefined}
				className={cn("relative", className)}
				onContextMenu={handleContextMenu}
			>
				<Link
					href={href}
					className="group flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all hover:border-primary/30 hover:bg-muted/60"
				>
					<div className="flex size-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
						{item.type === "directory" ? (
							<Folder className="size-6 text-primary" />
						) : (
							<FileText className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
						)}
					</div>
					<span className="w-full truncate text-xs leading-tight font-medium">
						{vaultEntryDisplayName(item.name, item.title)}
					</span>
					{item.type === "directory" && (
						<span className="text-xs text-muted-foreground">
							{item.children?.length ?? 0} Einträge
						</span>
					)}
				</Link>
				{menu}
			</div>
		);
	}

	return (
		<div
			data-vault-directory-item
			data-vault-folder-item={isFolder ? true : undefined}
			className={cn("relative", className)}
			onContextMenu={handleContextMenu}
		>
			<Link
				href={href}
				className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
			>
				{children}
			</Link>
			{menu}
		</div>
	);
}
