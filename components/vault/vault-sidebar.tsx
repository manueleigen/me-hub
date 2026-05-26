"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Search,
	FolderPlus,
	FilePlus,
	ChevronRight,
	FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	VaultTree,
	VaultTreeCreateMenuItems,
	type VaultPendingCreate,
} from "./vault-tree";
import { VaultPointerMenu } from "./vault-pointer-menu";
import { VaultFolderContextMenu } from "./vault-folder-context-menu";
import type { VaultTreeNode } from "@/types/vault";
import { createVaultFile, createVaultFolder } from "@/app/actions/vault";
import { useSync } from "@/lib/vault/sync-context";
import { vaultTreeReducer } from "./vault-tree-actions";
import {
	useVaultTreeSelection,
	resolveCreateParentPath,
	resolveCreateParentFromClick,
} from "./vault-tree-selection";
import { useRevalidatePage } from "@/hooks/use-revalidate-page";
import { useVaultBasePath } from "@/hooks/use-vault-base-path";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

const MIN_WIDTH = 180;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 256;
const LS_KEY = "vault-sidebar-width";

interface VaultSidebarProps {
	tree: VaultTreeNode[];
	gitHubBase?: string;
}

export function VaultSidebar({ tree, gitHubBase = "" }: VaultSidebarProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const pathname = usePathname();
	const vaultBase = useVaultBasePath();
	const revalidate = useRevalidatePage();
	const { startSync, endSync } = useSync();
	const [, startTransition] = React.useTransition();
	const [realTree, setRealTree] = React.useState(tree);
	const [optimisticTree, treeDispatch] = React.useOptimistic(realTree, vaultTreeReducer);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [pendingCreate, setPendingCreate] =
		React.useState<VaultPendingCreate | null>(null);
	const [isCreating, setIsCreating] = React.useState(false);

	React.useEffect(() => {
		startTransition(() => setRealTree(tree));
	}, [tree]);

	const [width, setWidth] = React.useState(DEFAULT_WIDTH);
	const widthRef = React.useRef(DEFAULT_WIDTH);

	React.useEffect(() => {
		const saved = localStorage.getItem(LS_KEY);
		if (saved) {
			const n = parseInt(saved, 10);
			if (!isNaN(n)) {
				setWidth(n);
				widthRef.current = n;
			}
		}
	}, []);

	const handleResizeMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		const startX = e.clientX;
		const startWidth = widthRef.current;

		const onMove = (ev: MouseEvent) => {
			const next = Math.max(
				MIN_WIDTH,
				Math.min(MAX_WIDTH, startWidth + ev.clientX - startX),
			);
			widthRef.current = next;
			setWidth(next);
		};
		const onUp = () => {
			localStorage.setItem(LS_KEY, String(widthRef.current));
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
		};
		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
	};

	const filteredTree = React.useMemo(() => {
		if (!searchQuery.trim()) return optimisticTree;
		const filterNodes = (nodes: VaultTreeNode[]): VaultTreeNode[] =>
			nodes.reduce<VaultTreeNode[]>((acc, node) => {
				const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
				if (node.children) {
					const filtered = filterNodes(node.children);
					if (filtered.length > 0 || matches) {
						acc.push({
							...node,
							children: filtered.length > 0 ? filtered : node.children,
						});
					}
				} else if (matches) {
					acc.push(node);
				}
				return acc;
			}, []);
		return filterNodes(optimisticTree);
	}, [optimisticTree, searchQuery]);

	const treeSelection = useVaultTreeSelection(filteredTree);
	const isVaultRoot = pathname === vaultBase || pathname === `${vaultBase}/`;
	const [isVaultOpen, setIsVaultOpen] = React.useState(true);
	const [scrollCreateMenu, setScrollCreateMenu] = React.useState<{
		parentPath: string;
		x: number;
		y: number;
	} | null>(null);

	const selectionParentPath = React.useMemo(
		() =>
			resolveCreateParentPath(
				treeSelection.selectedPaths,
				treeSelection.anchorPath,
				optimisticTree,
			),
		[
			treeSelection.selectedPaths,
			treeSelection.anchorPath,
			optimisticTree,
		],
	);

	const handleScrollViewportContextMenu = (
		e: React.MouseEvent<HTMLDivElement>,
	) => {
		if (
			(e.target as Element).closest(
				"[data-vault-tree-item], [data-vault-folder-item]",
			)
		) {
			return;
		}
		e.preventDefault();
		const parent =
			resolveCreateParentFromClick(e.target, selectionParentPath) ??
			selectionParentPath;
		setScrollCreateMenu({
			parentPath: parent,
			x: e.clientX,
			y: e.clientY,
		});
	};

	const startInlineCreateAt = React.useCallback(
		(type: "file" | "folder", parentPath: string) => {
			if (pendingCreate || isCreating || !vaultWriteEnabled) return;
			setPendingCreate({ type, parentPath });
			setIsVaultOpen(true);
		},
		[pendingCreate, isCreating, vaultWriteEnabled],
	);

	const startInlineCreate = (type: "file" | "folder") => {
		startInlineCreateAt(
			type,
			resolveCreateParentPath(
				treeSelection.selectedPaths,
				treeSelection.anchorPath,
				optimisticTree,
			),
		);
	};

	const handleCreateCommit = async (name: string): Promise<boolean> => {
		if (!pendingCreate || isCreating) return false;
		const type = pendingCreate.type;
		const parentPath = pendingCreate.parentPath;

		const fileName =
			type === "file" && !name.includes(".") ? `${name}.md` : name;
		const nodeName = type === "file" ? fileName : name;
		const nodePath = parentPath ? `${parentPath}/${nodeName}` : nodeName;

		const tempNode: VaultTreeNode = {
			path: nodePath,
			name: nodeName,
			type: type === "file" ? "file" : "directory",
			children: type === "folder" ? [] : undefined,
		};

		setIsCreating(true);
		startSync();
		try {
			await (type === "file"
				? createVaultFile(parentPath, name)
				: createVaultFolder(parentPath, name));
			setPendingCreate(null);
			startTransition(() => {
				treeDispatch({ type: "add", parentPath, node: tempNode });
			});
			toast.success(
				type === "file"
					? `Datei „${nodeName}“ erstellt`
					: `Ordner „${nodeName}“ erstellt`,
			);
			treeSelection.selectOnly(nodePath);
			startTransition(() => revalidate());
			return true;
		} catch (err) {
			const message =
				err instanceof Error && err.message
					? err.message
					: "Fehler beim Erstellen. Bitte erneut versuchen.";
			toast.error(message);
			return false;
		} finally {
			setIsCreating(false);
			endSync();
		}
	};

	const handleCreateCancel = () => {
		if (isCreating) return;
		setPendingCreate(null);
	};

	return (
		<div
			className="relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r bg-muted/30"
			style={{ width }}
		>
			<div className="space-y-3 border-b p-3">
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder="Suchen..."
						className="h-9 pl-8"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 flex-1 text-xs"
						disabled={!vaultWriteEnabled || !!pendingCreate}
						onClick={() => startInlineCreate("folder")}
					>
						<FolderPlus className="mr-1 size-3.5" />
						Ordner
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 flex-1 text-xs"
						disabled={!vaultWriteEnabled || !!pendingCreate}
						onClick={() => startInlineCreate("file")}
					>
						<FilePlus className="mr-1 size-3.5" />
						Datei
					</Button>
				</div>
			</div>

			{scrollCreateMenu && (
				<VaultPointerMenu
					open
					x={scrollCreateMenu.x}
					y={scrollCreateMenu.y}
					onOpenChange={(open) => {
						if (!open) setScrollCreateMenu(null);
					}}
				>
					<VaultTreeCreateMenuItems
						parentPath={scrollCreateMenu.parentPath}
						disabled={!vaultWriteEnabled || !!pendingCreate}
						onStartCreate={(type, parentPath) => {
							setScrollCreateMenu(null);
							startInlineCreateAt(type, parentPath);
						}}
					/>
				</VaultPointerMenu>
			)}

			<ScrollArea
				className="min-h-0 flex-1"
				contentMinFullHeight
				onViewportContextMenu={handleScrollViewportContextMenu}
			>
				<div
					data-vault-tree-scroll
					className="tree-view-content relative flex min-h-full w-full flex-col p-2"
					onContextMenu={handleScrollViewportContextMenu}
				>
					<div
						aria-hidden
						className="absolute inset-0 z-0"
						onContextMenu={handleScrollViewportContextMenu}
					/>
					<div className="relative z-10 min-h-0 flex-1">
					<Collapsible open={isVaultOpen} onOpenChange={setIsVaultOpen}>
						<VaultFolderContextMenu
							folder={{ path: "", name: "Vault", children: optimisticTree }}
							gitHubBase={gitHubBase}
							isVaultRoot
							childNodes={optimisticTree}
							onStartCreate={startInlineCreateAt}
							vaultWriteEnabled={vaultWriteEnabled}
							createDisabled={!!pendingCreate || isCreating}
							treeDispatch={treeDispatch}
							className={cn(
								"group mb-1 flex items-center gap-2 rounded-md px-1 py-0.5 text-sm",
								isVaultRoot && "bg-muted",
							)}
						>
							<CollapsibleTrigger asChild>
								<button
									type="button"
									className="shrink-0 rounded p-1.5 hover:bg-muted"
									onClick={(e) => e.stopPropagation()}
								>
									<ChevronRight
										className={cn(
											"size-4 text-muted-foreground transition-transform",
											isVaultOpen && "rotate-90",
										)}
									/>
								</button>
							</CollapsibleTrigger>
							<Link
								href={vaultBase}
								className={cn(
									"flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-2 text-sm font-medium transition-colors hover:bg-muted",
									isVaultRoot && "font-semibold",
								)}
							>
								<FolderOpen className="size-4 shrink-0 text-primary" />
								<span>Vault</span>
							</Link>
						</VaultFolderContextMenu>
						<CollapsibleContent>
							<div className="pl-2">
								<VaultTree
									items={filteredTree}
									gitHubBase={gitHubBase}
									vaultBase={vaultBase}
									treeDispatch={treeDispatch}
									selection={treeSelection}
									pendingCreate={pendingCreate}
									onCreateCommit={handleCreateCommit}
									onCreateCancel={handleCreateCancel}
									onStartCreate={startInlineCreateAt}
									vaultWriteEnabled={vaultWriteEnabled}
								/>
							</div>
						</CollapsibleContent>
					</Collapsible>
					</div>
				</div>
			</ScrollArea>

			<div
				className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary/60"
				onMouseDown={handleResizeMouseDown}
			/>
		</div>
	);
}
