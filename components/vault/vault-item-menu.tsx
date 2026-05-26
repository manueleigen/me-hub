"use client";

import * as React from "react";
import {
	Copy,
	ExternalLink,
	FilePlus,
	FolderPlus,
	Pencil,
	Trash2,
} from "lucide-react";
import type { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type VaultMenuItemProps = React.ComponentProps<typeof DropdownMenuItem>;

export interface VaultItemMenuActions {
	multiSelected: boolean;
	showDuplicate: boolean;
	gitHubUrl: string | null;
	onRename: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
}

export interface VaultFolderMenuActions {
	parentPath: string;
	createDisabled: boolean;
	onCreateFile: () => void;
	onCreateFolder: () => void;
	isVaultRoot: boolean;
	gitHubUrl: string | null;
	onRename: () => void;
	onDeleteAll: () => void;
	onDeleteFolder: () => void;
	showRename: boolean;
	showDeleteFolder: boolean;
}

export function VaultFolderMenuItems({
	actions,
	Item,
	Separator,
}: {
	actions: VaultFolderMenuActions;
	Item: React.ComponentType<VaultMenuItemProps>;
	Separator: React.ComponentType<{ className?: string }>;
}) {
	return (
		<>
			<Item
				disabled={actions.createDisabled}
				onSelect={actions.onCreateFile}
			>
				<FilePlus className="size-3.5 mr-2" />
				Neue Datei
			</Item>
			<Item
				disabled={actions.createDisabled}
				onSelect={actions.onCreateFolder}
			>
				<FolderPlus className="size-3.5 mr-2" />
				Neuer Ordner
			</Item>
			<Separator />
			{actions.showRename && (
				<Item onSelect={actions.onRename}>
					<Pencil className="size-3.5 mr-2" />
					Umbenennen
				</Item>
			)}
			{actions.gitHubUrl && (
				<Item onSelect={() => window.open(actions.gitHubUrl!, "_blank")}>
					<ExternalLink className="size-3.5 mr-2" />
					In Git öffnen
				</Item>
			)}
			{actions.isVaultRoot && (
				<>
					<Separator />
					<Item variant="destructive" onSelect={actions.onDeleteAll}>
						<Trash2 className="size-3.5 mr-2" />
						Alle löschen
					</Item>
				</>
			)}
			{actions.showDeleteFolder && (
				<Item variant="destructive" onSelect={actions.onDeleteFolder}>
					<Trash2 className="size-3.5 mr-2" />
					Ordner löschen
				</Item>
			)}
		</>
	);
}

export function VaultItemMenuItems({
	actions,
	Item,
	Separator,
}: {
	actions: VaultItemMenuActions;
	Item: React.ComponentType<VaultMenuItemProps>;
	Separator: React.ComponentType<{ className?: string }>;
}) {
	return (
		<>
			<Item disabled={actions.multiSelected} onSelect={actions.onRename}>
				<Pencil className="size-3.5 mr-2" />
				Umbenennen
			</Item>
			{actions.showDuplicate && (
				<Item onSelect={actions.onDuplicate}>
					<Copy className="size-3.5 mr-2" />
					{actions.multiSelected ? "Auswahl duplizieren" : "Duplizieren"}
				</Item>
			)}
			{actions.gitHubUrl && (
				<Item onSelect={() => window.open(actions.gitHubUrl!, "_blank")}>
					<ExternalLink className="size-3.5 mr-2" />
					In Git öffnen
				</Item>
			)}
			<Separator />
			<Item variant="destructive" onSelect={actions.onDelete}>
				<Trash2 className="size-3.5 mr-2" />
				{actions.multiSelected ? "Auswahl löschen" : "Löschen"}
			</Item>
		</>
	);
}
