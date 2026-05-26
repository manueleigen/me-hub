"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRevalidatePage } from "@/hooks/use-revalidate-page";
import {
	ChevronRight,
	FileText,
	FilePlus,
	Folder,
	FolderOpen,
	FolderPlus,
	MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	vaultDuplicateFileName,
	vaultEntryDisplayName,
} from "@/lib/vault/display-name";
import type { VaultTreeNode } from "@/types/vault";
import type { TreeAction } from "./vault-tree-actions";
import {
	useOptionalVaultTreeSelectionCtx,
	VaultTreeSelectionProvider,
	type VaultTreeSelectionValue,
} from "./vault-tree-selection";
import { vaultItemHref } from "@/hooks/use-vault-base-path";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VaultPointerMenu } from "./vault-pointer-menu";
import {
	VaultItemMenuItems,
	VaultFolderMenuItems,
	type VaultItemMenuActions,
} from "./vault-item-menu";
import { useVaultFolderMenu } from "@/hooks/use-vault-folder-menu";
import { Input } from "@/components/ui/input";
import { useSync } from "@/lib/vault/sync-context";
import {
	deleteVaultItem,
	renameVaultItem,
	moveVaultFile,
	duplicateVaultFile,
} from "@/app/actions/vault";

// ── Context ────────────────────────────────────────────────────────────────

export interface VaultPendingCreate {
	type: "file" | "folder";
	parentPath: string;
}

interface TreeCtxValue {
	dragging: { path: string; type: string } | null;
	setDragging: (v: TreeCtxValue["dragging"]) => void;
	gitHubBase: string;
	vaultBase: string;
	dispatch: (action: TreeAction) => void;
	pendingCreate: VaultPendingCreate | null;
	onCreateCommit: (name: string) => Promise<boolean>;
	onCreateCancel: () => void;
	onStartCreate: (type: "file" | "folder", parentPath: string) => void;
	vaultWriteEnabled: boolean;
}

const TreeCtx = React.createContext<TreeCtxValue>({
	dragging: null,
	setDragging: () => {},
	gitHubBase: "",
	vaultBase: "/workspaces",
	dispatch: () => {},
	pendingCreate: null,
	onCreateCommit: async () => false,
	onCreateCancel: () => {},
	onStartCreate: () => {},
	vaultWriteEnabled: false,
});

export function VaultTreeCreateMenuItems({
	parentPath,
	disabled,
	onStartCreate,
}: {
	parentPath: string;
	disabled: boolean;
	onStartCreate: (type: "file" | "folder", parentPath: string) => void;
}) {
	return (
		<>
			<DropdownMenuItem
				disabled={disabled}
				onSelect={() => onStartCreate("file", parentPath)}
			>
				<FilePlus className="size-3.5 mr-2" />
				Neue Datei
			</DropdownMenuItem>
			<DropdownMenuItem
				disabled={disabled}
				onSelect={() => onStartCreate("folder", parentPath)}
			>
				<FolderPlus className="size-3.5 mr-2" />
				Neuer Ordner
			</DropdownMenuItem>
		</>
	);
}

// ── VaultTree ──────────────────────────────────────────────────────────────

interface VaultTreeProps {
	items: VaultTreeNode[];
	level?: number;
	parentPath?: string;
	gitHubBase?: string;
	vaultBase?: string;
	treeDispatch?: (action: TreeAction) => void;
	selection?: VaultTreeSelectionValue;
	pendingCreate?: VaultPendingCreate | null;
	onCreateCommit?: (name: string) => Promise<boolean>;
	onCreateCancel?: () => void;
	onStartCreate?: (type: "file" | "folder", parentPath: string) => void;
	vaultWriteEnabled?: boolean;
}

function VaultTreeCreateRow({
	type,
	level,
}: {
	type: "file" | "folder";
	level: number;
}) {
	const { onCreateCommit, onCreateCancel } = React.useContext(TreeCtx);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [value, setValue] = React.useState(
		type === "file" ? "untitled.md" : "Neuer Ordner",
	);
	const [hasError, setHasError] = React.useState(false);
	const committedRef = React.useRef(false);
	const isSubmittingRef = React.useRef(false);

	const focusInput = React.useCallback(() => {
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
	}, []);

	React.useEffect(() => {
		focusInput();
	}, [focusInput]);

	const commit = async () => {
		if (committedRef.current || isSubmittingRef.current) return;
		const name = value.trim();
		if (!name) {
			committedRef.current = true;
			onCreateCancel();
			return;
		}
		isSubmittingRef.current = true;
		setHasError(false);
		const ok = await onCreateCommit(name);
		isSubmittingRef.current = false;
		if (ok) {
			committedRef.current = true;
			return;
		}
		setHasError(true);
		focusInput();
	};

	const cancel = () => {
		if (committedRef.current || isSubmittingRef.current) return;
		committedRef.current = true;
		onCreateCancel();
	};

	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-md px-2 py-1",
				level > 0 && "ml-0",
			)}
		>
			<span className="size-4 shrink-0" />
			{type === "folder" ? (
				<Folder className="size-4 shrink-0 text-muted-foreground" />
			) : (
				<FileText className="size-4 shrink-0 text-muted-foreground" />
			)}
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
					if (hasError) setHasError(false);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						void commit();
					}
					if (e.key === "Escape") {
						e.preventDefault();
						cancel();
					}
				}}
				onBlur={() => void commit()}
				className={cn(
					"h-7 flex-1 text-xs",
					hasError && "border-destructive focus-visible:ring-destructive/30",
				)}
				placeholder={type === "file" ? "dateiname.md" : "ordner-name"}
				aria-invalid={hasError}
			/>
		</div>
	);
}

export function VaultTree({
	items,
	level = 0,
	parentPath = "",
	gitHubBase = "",
	vaultBase = "/workspaces",
	treeDispatch,
	selection,
	pendingCreate = null,
	onCreateCommit,
	onCreateCancel,
	onStartCreate,
	vaultWriteEnabled = false,
}: VaultTreeProps) {
	const [dragging, setDragging] =
		React.useState<TreeCtxValue["dragging"]>(null);
	const parentCtx = React.useContext(TreeCtx);
	const ctxPending = level > 0 ? parentCtx.pendingCreate : pendingCreate;
	const ctxOnCommit = level > 0 ? parentCtx.onCreateCommit : (onCreateCommit ?? (() => {}));
	const ctxOnCancel = level > 0 ? parentCtx.onCreateCancel : (onCreateCancel ?? (() => {}));
	const showCreateRow = ctxPending?.parentPath === parentPath;

	const list = (
		<div
			data-vault-tree-list
			data-vault-parent-path={parentPath}
			className={cn(
				"min-h-6 space-y-0.5",
				level > 0 && "ml-3 border-l border-border pl-3",
			)}
		>
			{items.map((item) => (
				<VaultTreeItem key={item.path} item={item} level={level} />
			))}
			{showCreateRow && ctxPending && (
				<VaultTreeCreateRow type={ctxPending.type} level={level} />
			)}
		</div>
	);

	if (level > 0) return list;

	const tree = (
		<TreeCtx.Provider
			value={{
				dragging,
				setDragging,
				gitHubBase,
				vaultBase,
				dispatch: treeDispatch ?? (() => {}),
				pendingCreate: pendingCreate ?? null,
				onCreateCommit: onCreateCommit ?? (async () => false),
				onCreateCancel: onCreateCancel ?? (() => {}),
				onStartCreate: onStartCreate ?? (() => {}),
				vaultWriteEnabled,
			}}
		>
			{list}
		</TreeCtx.Provider>
	);

	if (!selection) return tree;

	return (
		<VaultTreeSelectionProvider value={selection}>
			{tree}
		</VaultTreeSelectionProvider>
	);
}

// ── VaultTreeItem ──────────────────────────────────────────────────────────

interface VaultTreeItemProps {
	item: VaultTreeNode;
	level: number;
}

function VaultTreeItem({ item, level }: VaultTreeItemProps) {
	if (item.type === "directory") {
		return <VaultTreeFolderItem item={item} level={level} />;
	}

	const pathname = usePathname();
	const revalidate = useRevalidatePage();
	const { dragging, setDragging, gitHubBase, vaultBase, dispatch } = React.useContext(TreeCtx);
	const selectionCtx = useOptionalVaultTreeSelectionCtx();
	const { pendingCreate } = React.useContext(TreeCtx);
	const isCreateTarget = pendingCreate?.parentPath === item.path;
	const { startSync, endSync } = useSync();

	const [isOpen, setIsOpen] = React.useState(false);
	const [isDragOver, setIsDragOver] = React.useState(false);
	const [isRenaming, setIsRenaming] = React.useState(false);
	const [renameValue, setRenameValue] = React.useState(item.name);
	const renameRef = React.useRef<HTMLInputElement>(null);

	const itemHref = vaultItemHref(vaultBase, item.path);
	const isActive = pathname === itemHref;
	const isParentActive = pathname.startsWith(`${itemHref}/`);
	const isTreeSelected = selectionCtx?.isSelected(item.path) ?? false;
	const multiSelected =
		isTreeSelected && (selectionCtx?.selectedPaths.size ?? 0) > 1;

	const rowSelectClass =
		isTreeSelected &&
		"bg-primary/15 ring-1 ring-inset ring-primary/25";

	const handleTreeClick = (e: React.MouseEvent) => {
		if (!selectionCtx) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey) e.preventDefault();
		selectionCtx.handleItemClick(item.path, e);
	};

	React.useEffect(() => {
		if (isRenaming) requestAnimationFrame(() => renameRef.current?.select());
	}, [isRenaming]);

	// ── Actions ──────────────────────────────────────────────────────────

	const handleDelete = () => {
		const targets =
			selectionCtx?.getActionTargets(item.path) ?? [
				{ path: item.path, name: item.name, type: item.type },
			];
		const msg =
			targets.length > 1
				? `${targets.length} Elemente wirklich löschen?`
				: `"${item.name}" wirklich löschen?`;
		if (!window.confirm(msg)) return;
		startSync();
		React.startTransition(async () => {
			for (const target of targets) {
				dispatch({ type: "delete", path: target.path });
			}
			try {
				for (const target of targets) {
					await deleteVaultItem(target.path, target.type);
				}
				toast.success(
					targets.length > 1
						? `${targets.length} Elemente gelöscht`
						: `"${item.name}" gelöscht`,
				);
				selectionCtx?.clearSelection();
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
			return;
		}
		setIsRenaming(false);
		startSync();
		React.startTransition(async () => {
			dispatch({ type: "rename", oldPath: item.path, newName });
			try {
				await renameVaultItem(item.path, newName, item.type);
				toast.success("Umbenannt");
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Umbenennen");
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	const handleDuplicate = () => {
		const targets = (
			selectionCtx?.getActionTargets(item.path) ?? [
				{ path: item.path, name: item.name, type: item.type },
			]
		).filter((t) => t.type === "file");
		if (targets.length === 0) return;
		startSync();
		React.startTransition(async () => {
			let ok = 0;
			for (const target of targets) {
				const dupName = vaultDuplicateFileName(target.name);
				const parentDir = target.path.includes("/")
					? target.path.split("/").slice(0, -1).join("/")
					: "";
				const dupPath = parentDir ? `${parentDir}/${dupName}` : dupName;
				const dupNode: VaultTreeNode = {
					path: dupPath,
					name: dupName,
					type: "file",
				};
				dispatch({ type: "add", parentPath: parentDir, node: dupNode });
				try {
					await duplicateVaultFile(target.path);
					ok++;
				} catch {
					/* continue */
				}
			}
			try {
				if (ok > 0) {
					toast.success(
						ok > 1 ? `${ok} Dateien dupliziert` : "Datei dupliziert",
					);
					React.startTransition(() => revalidate());
				} else {
					toast.error("Fehler beim Duplizieren");
					React.startTransition(() => revalidate());
				}
			} finally {
				endSync();
			}
		});
	};

	const gitHubUrl = gitHubBase
		? `${gitHubBase}/blob/HEAD/${item.path}`
		: null;

	// ── Drag & Drop ───────────────────────────────────────────────────────

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("vault/path", item.path);
		e.dataTransfer.setData("vault/type", item.type);
		e.dataTransfer.effectAllowed = "move";
		setDragging({ path: item.path, type: item.type });
	};

	const handleDragEnd = () => setDragging(null);

	const handleDragOver = (e: React.DragEvent) => {
		if (item.type !== "directory") return;
		const src = dragging?.path ?? e.dataTransfer.getData("vault/path");
		if (!src || src === item.path || src.startsWith(item.path + "/")) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node))
			setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		if (item.type !== "directory") return;
		const sourcePath = e.dataTransfer.getData("vault/path");
		const sourceType = e.dataTransfer.getData("vault/type");
		if (!sourcePath || sourcePath === item.path) return;
		if (sourcePath.startsWith(item.path + "/")) return;
		if (sourceType !== "file") {
			toast.error("Ordner können nur per Umbenennen verschoben werden");
			return;
		}
		startSync();
		React.startTransition(async () => {
			dispatch({ type: "move", sourcePath, targetDirPath: item.path });
			try {
				await moveVaultFile(sourcePath, item.path);
				toast.success("Datei verschoben");
				React.startTransition(() => revalidate());
			} catch {
				toast.error("Fehler beim Verschieben");
				React.startTransition(() => revalidate());
			} finally {
				endSync();
			}
		});
	};

	// ── Context Menu ──────────────────────────────────────────────────────

	const showDuplicate =
		item.type === "file" ||
		(selectionCtx?.getActionTargets(item.path).some((t) => t.type === "file") ??
			false);

	const menuActions: VaultItemMenuActions = {
		multiSelected,
		showDuplicate,
		gitHubUrl,
		onRename: () => {
			setRenameValue(item.name);
			setIsRenaming(true);
		},
		onDuplicate: handleDuplicate,
		onDelete: handleDelete,
	};

	const [pointerMenu, setPointerMenu] = React.useState<{
		x: number;
		y: number;
	} | null>(null);

	const handleItemMenuOpen = (open: boolean) => {
		if (open && selectionCtx && !selectionCtx.isSelected(item.path)) {
			selectionCtx.selectOnly(item.path);
		}
		if (!open) setPointerMenu(null);
	};

	const handleItemContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		handleItemMenuOpen(true);
		setPointerMenu({ x: e.clientX, y: e.clientY });
	};

	const pointerMenuLayer = (
		<VaultPointerMenu
			open={!!pointerMenu}
			x={pointerMenu?.x ?? 0}
			y={pointerMenu?.y ?? 0}
			onOpenChange={handleItemMenuOpen}
		>
			<VaultItemMenuItems
				actions={menuActions}
				Item={DropdownMenuItem}
				Separator={DropdownMenuSeparator}
			/>
		</VaultPointerMenu>
	);

	const moreMenuButton = (
		<DropdownMenu onOpenChange={handleItemMenuOpen}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted focus:opacity-100 focus:outline-none transition-opacity"
					onClick={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.preventDefault()}
				>
					<MoreHorizontal className="size-3.5 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="right" className="w-44">
				<VaultItemMenuItems
					actions={menuActions}
					Item={DropdownMenuItem}
					Separator={DropdownMenuSeparator}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	// ── Rename Input ─────────────────────────────────────────────────────

	if (isRenaming) {
		return (
			<div className="px-2 py-1">
				<Input
					ref={renameRef}
					value={renameValue}
					onChange={(e) => setRenameValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleRename();
						if (e.key === "Escape") {
							setIsRenaming(false);
							setRenameValue(item.name);
						}
					}}
					onBlur={handleRename}
					className="h-7 text-xs"
				/>
			</div>
		);
	}

	// ── File ──────────────────────────────────────────────────────────────

	return (
		<div
			data-vault-tree-item
			data-vault-item-type="file"
			className="group relative"
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onContextMenu={handleItemContextMenu}
		>
			<Link
				href={itemHref}
				onClick={handleTreeClick}
				className={cn(
					"flex items-center gap-2 rounded-md px-2 py-1.5 pr-7 text-sm transition-colors hover:bg-muted",
					isActive && !isTreeSelected && "bg-muted font-medium",
					isTreeSelected && "font-medium",
					rowSelectClass,
				)}
			>
				<span className="size-4 shrink-0" />
				<FileText
					className={cn(
						"size-4 shrink-0",
						isActive ? "text-primary" : "text-muted-foreground",
					)}
				/>
				<span className="truncate">{vaultEntryDisplayName(item.name)}</span>
			</Link>
			{pointerMenuLayer}
			{moreMenuButton}
		</div>
	);
}

function VaultTreeFolderItem({ item, level }: VaultTreeItemProps) {
	const pathname = usePathname();
	const {
		dragging,
		setDragging,
		gitHubBase,
		vaultBase,
		dispatch,
		onStartCreate,
		vaultWriteEnabled,
		pendingCreate,
	} = React.useContext(TreeCtx);
	const selectionCtx = useOptionalVaultTreeSelectionCtx();
	const { startSync, endSync } = useSync();
	const isCreateTarget = pendingCreate?.parentPath === item.path;
	const children = item.children ?? [];

	const {
		folderMenuActions,
		isRenaming,
		renameValue,
		setRenameValue,
		setIsRenaming,
		handleRename,
		renameRef,
	} = useVaultFolderMenu(
		{ path: item.path, name: item.name, children },
		gitHubBase,
		{
			childNodes: children,
			onStartCreate,
			vaultWriteEnabled,
			createDisabled: !!pendingCreate,
			treeDispatch: dispatch,
		},
	);

	const [isOpen, setIsOpen] = React.useState(false);
	const [isDragOver, setIsDragOver] = React.useState(false);
	const [pointerMenu, setPointerMenu] = React.useState<{
		x: number;
		y: number;
	} | null>(null);

	const itemHref = vaultItemHref(vaultBase, item.path);
	const isActive = pathname === itemHref;
	const isParentActive = pathname.startsWith(`${itemHref}/`);
	const isTreeSelected = selectionCtx?.isSelected(item.path) ?? false;
	const rowSelectClass =
		isTreeSelected &&
		"bg-primary/15 ring-1 ring-inset ring-primary/25";

	const handleTreeClick = (e: React.MouseEvent) => {
		if (!selectionCtx) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey) e.preventDefault();
		selectionCtx.handleItemClick(item.path, e);
	};

	const handleItemContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (selectionCtx && !selectionCtx.isSelected(item.path)) {
			selectionCtx.selectOnly(item.path);
		}
		setPointerMenu({ x: e.clientX, y: e.clientY });
	};

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("vault/path", item.path);
		e.dataTransfer.setData("vault/type", item.type);
		e.dataTransfer.effectAllowed = "move";
		setDragging({ path: item.path, type: item.type });
	};

	const handleDragEnd = () => setDragging(null);

	const handleDragOver = (e: React.DragEvent) => {
		const src = dragging?.path ?? e.dataTransfer.getData("vault/path");
		if (!src || src === item.path || src.startsWith(item.path + "/")) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node))
			setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		const sourcePath = e.dataTransfer.getData("vault/path");
		const sourceType = e.dataTransfer.getData("vault/type");
		if (!sourcePath || sourcePath === item.path) return;
		if (sourcePath.startsWith(item.path + "/")) return;
		if (sourceType !== "file") {
			toast.error("Ordner können nur per Umbenennen verschoben werden");
			return;
		}
		startSync();
		React.startTransition(async () => {
			dispatch({ type: "move", sourcePath, targetDirPath: item.path });
			try {
				await moveVaultFile(sourcePath, item.path);
				toast.success("Datei verschoben");
			} catch {
				toast.error("Fehler beim Verschieben");
			} finally {
				endSync();
			}
		});
	};

	if (isRenaming) {
		return (
			<div className="px-2 py-1">
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
					className="h-7 text-xs"
				/>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"rounded-md transition-colors",
				isDragOver && "bg-primary/10 ring-1 ring-primary/30",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<Collapsible
				open={isOpen || isParentActive || isCreateTarget}
				onOpenChange={setIsOpen}
			>
				<div
					data-vault-tree-item
					data-vault-folder-item
					data-vault-item-type="directory"
					className="group relative"
					draggable
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onContextMenu={handleItemContextMenu}
				>
					<div
						className={cn(
							"mb-1 flex w-full items-center rounded-md pr-7 text-sm transition-colors hover:bg-muted",
							(isActive || isParentActive) && !isTreeSelected && "bg-muted",
							rowSelectClass,
						)}
					>
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="shrink-0 rounded p-1.5"
								onClick={(e) => e.stopPropagation()}
							>
								<ChevronRight
									className={cn(
										"size-4 text-muted-foreground transition-transform",
										(isOpen || isParentActive || isCreateTarget) &&
											"rotate-90",
									)}
								/>
							</button>
						</CollapsibleTrigger>
						<Link
							href={itemHref}
							onClick={handleTreeClick}
							className={cn(
								"flex min-w-0 flex-1 items-center gap-2 py-1.5",
								isActive && "font-medium",
							)}
						>
							{isOpen || isParentActive ? (
								<FolderOpen className="size-4 shrink-0 text-primary" />
							) : (
								<Folder className="size-4 shrink-0 text-muted-foreground" />
							)}
							<span className="truncate">{item.name}</span>
						</Link>
					</div>
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
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted focus:opacity-100 focus:outline-none"
								onClick={(e) => e.stopPropagation()}
								onMouseDown={(e) => e.preventDefault()}
							>
								<MoreHorizontal className="size-3.5 text-muted-foreground" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" side="right" className="w-44">
							<VaultFolderMenuItems
								actions={folderMenuActions}
								Item={DropdownMenuItem}
								Separator={DropdownMenuSeparator}
							/>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<CollapsibleContent>
					<VaultTree items={children} level={level + 1} parentPath={item.path} />
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
