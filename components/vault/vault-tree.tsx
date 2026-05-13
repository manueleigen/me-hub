"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	ChevronRight,
	FileText,
	Folder,
	FolderOpen,
	MoreHorizontal,
	Pencil,
	Copy,
	Trash2,
	ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { VaultTreeNode } from "@/types/vault";
import type { TreeAction } from "./vault-sidebar";
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
import { Input } from "@/components/ui/input";
import { useSync } from "@/lib/vault/sync-context";
import {
	deleteVaultItem,
	renameVaultItem,
	moveVaultFile,
	duplicateVaultFile,
} from "@/app/actions/vault";

// ── Context ────────────────────────────────────────────────────────────────

interface TreeCtxValue {
	dragging: { path: string; type: string } | null;
	setDragging: (v: TreeCtxValue["dragging"]) => void;
	gitHubBase: string;
	dispatch: (action: TreeAction) => void;
}

const TreeCtx = React.createContext<TreeCtxValue>({
	dragging: null,
	setDragging: () => {},
	gitHubBase: "",
	dispatch: () => {},
});

// ── VaultTree ──────────────────────────────────────────────────────────────

interface VaultTreeProps {
	items: VaultTreeNode[];
	level?: number;
	gitHubBase?: string;
	treeDispatch?: (action: TreeAction) => void;
}

export function VaultTree({
	items,
	level = 0,
	gitHubBase = "",
	treeDispatch,
}: VaultTreeProps) {
	const [dragging, setDragging] =
		React.useState<TreeCtxValue["dragging"]>(null);

	const list = (
		<div
			className={cn(
				"space-y-0.5",
				level > 0 && "ml-3 pl-3 border-l border-border",
			)}
		>
			{items.map((item) => (
				<VaultTreeItem key={item.path} item={item} level={level} />
			))}
		</div>
	);

	if (level > 0) return list;

	return (
		<TreeCtx.Provider value={{ dragging, setDragging, gitHubBase, dispatch: treeDispatch ?? (() => {}) }}>
			{list}
		</TreeCtx.Provider>
	);
}

// ── VaultTreeItem ──────────────────────────────────────────────────────────

interface VaultTreeItemProps {
	item: VaultTreeNode;
	level: number;
}

function VaultTreeItem({ item, level }: VaultTreeItemProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { dragging, setDragging, gitHubBase, dispatch } = React.useContext(TreeCtx);
	const { startSync, endSync } = useSync();

	const [isOpen, setIsOpen] = React.useState(false);
	const [isDragOver, setIsDragOver] = React.useState(false);
	const [isRenaming, setIsRenaming] = React.useState(false);
	const [renameValue, setRenameValue] = React.useState(
		item.name.replace(/\.md$/, ""),
	);
	const renameRef = React.useRef<HTMLInputElement>(null);

	const isActive = pathname === `/vault/${item.path}`;
	const isParentActive = pathname.startsWith(`/vault/${item.path}/`);

	React.useEffect(() => {
		if (isRenaming) requestAnimationFrame(() => renameRef.current?.select());
	}, [isRenaming]);

	// ── Actions ──────────────────────────────────────────────────────────

	const handleDelete = () => {
		if (!window.confirm(`"${item.name}" wirklich löschen?`)) return;
		startSync();
		React.startTransition(async () => {
			dispatch({ type: "delete", path: item.path });
			try {
				await deleteVaultItem(item.path, item.type);
				toast.success(`"${item.name}" gelöscht`);
				React.startTransition(() => router.refresh());
			} catch {
				toast.error("Fehler beim Löschen");
				React.startTransition(() => router.refresh());
			} finally {
				endSync();
			}
		});
	};

	const handleRename = async () => {
		const newName = renameValue.trim();
		if (!newName || newName === item.name.replace(/\.md$/, "")) {
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
				React.startTransition(() => router.refresh());
			} catch {
				toast.error("Fehler beim Umbenennen");
				React.startTransition(() => router.refresh());
			} finally {
				endSync();
			}
		});
	};

	const handleDuplicate = () => {
		const baseName = item.name.replace(/\.md$/, "");
		const dupName = `${baseName}-copy.md`;
		const parentDir = item.path.includes("/") ? item.path.split("/").slice(0, -1).join("/") : "";
		const dupPath = parentDir ? `${parentDir}/${dupName}` : dupName;
		const dupNode: VaultTreeNode = { path: dupPath, name: dupName, type: "file" };
		startSync();
		React.startTransition(async () => {
			dispatch({ type: "add", parentPath: parentDir, node: dupNode });
			try {
				await duplicateVaultFile(item.path);
				toast.success("Datei dupliziert");
				React.startTransition(() => router.refresh());
			} catch {
				toast.error("Fehler beim Duplizieren");
				React.startTransition(() => router.refresh());
			} finally {
				endSync();
			}
		});
	};

	const gitHubUrl = gitHubBase
		? `${gitHubBase}/${item.type === "directory" ? "tree" : "blob"}/HEAD/${item.path}`
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
				React.startTransition(() => router.refresh());
			} catch {
				toast.error("Fehler beim Verschieben");
				React.startTransition(() => router.refresh());
			} finally {
				endSync();
			}
		});
	};

	// ── Context Menu ──────────────────────────────────────────────────────

	const contextMenu = (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted focus:opacity-100 focus:outline-none transition-opacity"
					onClick={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.preventDefault()}
				>
					<MoreHorizontal className="size-3.5 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="right" className="w-44">
				<DropdownMenuItem
					onClick={() => {
						setRenameValue(item.name.replace(/\.md$/, ""));
						setIsRenaming(true);
					}}
				>
					<Pencil className="size-3.5 mr-2" />
					Umbenennen
				</DropdownMenuItem>
				{item.type === "file" && (
					<DropdownMenuItem onClick={handleDuplicate}>
						<Copy className="size-3.5 mr-2" />
						Duplizieren
					</DropdownMenuItem>
				)}
				{gitHubUrl && (
					<DropdownMenuItem onClick={() => window.open(gitHubUrl, "_blank")}>
						<ExternalLink className="size-3.5 mr-2" />
						In Git öffnen
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onClick={handleDelete}
				>
					<Trash2 className="size-3.5 mr-2" />
					Löschen
				</DropdownMenuItem>
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
							setRenameValue(item.name.replace(/\.md$/, ""));
						}
					}}
					onBlur={handleRename}
					className="h-7 text-xs"
				/>
			</div>
		);
	}

	// ── Directory ─────────────────────────────────────────────────────────

	if (item.type === "directory" && item.children) {
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
				<Collapsible open={isOpen || isParentActive} onOpenChange={setIsOpen}>
					<div
						className="group relative"
						draggable
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<div
							className={cn(
								"flex w-full items-center rounded-md pr-7 text-sm hover:bg-muted transition-colors mb-1",
								(isActive || isParentActive) && "bg-muted",
							)}
						>
							{/* Chevron toggles expand only */}
							<CollapsibleTrigger asChild>
								<button
									className="shrink-0 p-1.5 rounded"
									onClick={(e) => e.stopPropagation()}
								>
									<ChevronRight
										className={cn(
											"size-4 text-muted-foreground transition-transform",
											(isOpen || isParentActive) && "rotate-90",
										)}
									/>
								</button>
							</CollapsibleTrigger>
							{/* Folder icon + name navigates to the directory */}
							<Link
								href={`/vault/${item.path}`}
								className={cn(
									"flex flex-1 items-center gap-2 py-1.5 min-w-0",
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
						{contextMenu}
					</div>
					<CollapsibleContent>
						<VaultTree items={item.children} level={level + 1} />
					</CollapsibleContent>
				</Collapsible>
			</div>
		);
	}

	// ── File ──────────────────────────────────────────────────────────────

	return (
		<div
			className="group relative"
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<Link
				href={`/vault/${item.path}`}
				className={cn(
					"flex items-center gap-2 rounded-md px-2 py-1.5 pr-7 text-sm hover:bg-muted transition-colors",
					isActive && "bg-muted font-medium",
				)}
			>
				<span className="size-4 shrink-0" />
				<FileText
					className={cn(
						"size-4 shrink-0",
						isActive ? "text-primary" : "text-muted-foreground",
					)}
				/>
				<span className="truncate">{item.name.replace(/\.md$/, "")}</span>
			</Link>
			{contextMenu}
		</div>
	);
}
