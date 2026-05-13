"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	Search,
	FolderPlus,
	FilePlus,
	Check,
	X,
	ChevronRight,
	FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VaultTree } from "./vault-tree";
import type { VaultTreeNode } from "@/types/vault";
import { createVaultFile, createVaultFolder } from "@/app/actions/vault";
import { useSync } from "@/lib/vault/sync-context";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ── Tree manipulation helpers ─────────────────────────────────────────────────

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
		if (node.path === parentPath && node.type === "directory") {
			return { ...node, children: [...(node.children ?? []), newNode] };
		}
		if (node.children) {
			return { ...node, children: addNode(node.children, parentPath, newNode) };
		}
		return node;
	});
}

function moveNode(nodes: VaultTreeNode[], sourcePath: string, targetDirPath: string): VaultTreeNode[] {
	const source = findNode(nodes, sourcePath);
	if (!source) return nodes;
	const newPath = targetDirPath ? `${targetDirPath}/${source.name}` : source.name;
	const moved = { ...source, path: newPath };
	return addNode(removeNode(nodes, sourcePath), targetDirPath, moved);
}

export function treeReducer(state: VaultTreeNode[], action: TreeAction): VaultTreeNode[] {
	switch (action.type) {
		case "add": return addNode(state, action.parentPath, action.node);
		case "delete": return removeNode(state, action.path);
		case "rename": return renameNode(state, action.oldPath, action.newName);
		case "move": return moveNode(state, action.sourcePath, action.targetDirPath);
	}
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_WIDTH = 180;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 256;
const LS_KEY = "vault-sidebar-width";

interface VaultSidebarProps {
	tree: VaultTreeNode[];
	gitHubBase?: string;
}

export function VaultSidebar({ tree, gitHubBase = "" }: VaultSidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { startSync, endSync } = useSync();
	const [, startTransition] = React.useTransition();
	const [realTree, setRealTree] = React.useState(tree);
	const [optimisticTree, treeDispatch] = React.useOptimistic(realTree, treeReducer);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [creating, setCreating] = React.useState<"file" | "folder" | null>(null);
	const [newName, setNewName] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Sync real tree when server delivers fresh props
	React.useEffect(() => {
		startTransition(() => setRealTree(tree));
	}, [tree]);

	// ── Resizable width ───────────────────────────────────────────────────
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

	// ── Focus input when create mode activates ────────────────────────────
	React.useEffect(() => {
		if (creating) requestAnimationFrame(() => inputRef.current?.focus());
	}, [creating]);

	// ── Filtered tree from optimistic state ───────────────────────────────
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

	const handleCreate = () => {
		const name = newName.trim();
		if (!name || !creating || isLoading) return;
		const type = creating;
		setCreating(null);
		setNewName("");

		const tempNode: VaultTreeNode = {
			path: name.includes(".") ? name : type === "file" ? `${name}.md` : name,
			name: type === "file" && !name.includes(".") ? `${name}.md` : name,
			type: type === "file" ? "file" : "directory",
			children: type === "folder" ? [] : undefined,
		};

		setIsLoading(true);
		startSync();
		startTransition(async () => {
			treeDispatch({ type: "add", parentPath: "", node: tempNode });
			try {
				await (type === "file" ? createVaultFile("", name) : createVaultFolder("", name));
				toast.success(type === "file" ? `Datei "${name}" erstellt` : `Ordner "${name}" erstellt`);
				startTransition(() => router.refresh());
			} catch {
				toast.error("Fehler beim Erstellen");
				startTransition(() => router.refresh());
			} finally {
				setIsLoading(false);
				endSync();
			}
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleCreate();
		if (e.key === "Escape") {
			setCreating(null);
			setNewName("");
		}
	};

	const isVaultRoot = pathname === "/vault";
	const [isVaultOpen, setIsVaultOpen] = React.useState(true);

	return (
		<div
			className="relative border-r flex flex-col bg-muted/30 shrink-0"
			style={{ width }}
		>
			{/* Header / search / create controls */}
			<div className="p-3 border-b space-y-3">
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder="Suchen..."
						className="pl-8 h-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="flex-1 h-8 text-xs"
						onClick={() => {
							setNewName("");
							setCreating("folder");
						}}
					>
						<FolderPlus className="size-3.5 mr-1" />
						Ordner
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="flex-1 h-8 text-xs"
						onClick={() => {
							setNewName("");
							setCreating("file");
						}}
					>
						<FilePlus className="size-3.5 mr-1" />
						Datei
					</Button>
				</div>

				{creating && (
					<div className="flex items-center gap-1">
						<Input
							ref={inputRef}
							placeholder={creating === "file" ? "dateiname.md" : "ordner-name"}
							className="h-8 text-xs flex-1"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={isLoading}
						/>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 shrink-0"
							onClick={handleCreate}
							disabled={!newName.trim() || isLoading}
						>
							<Check className="size-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 shrink-0"
							onClick={() => {
								setCreating(null);
								setNewName("");
							}}
							disabled={isLoading}
						>
							<X className="size-3.5" />
						</Button>
					</div>
				)}
			</div>

			{/* Tree */}
			<ScrollArea className="flex-1 " style={{ width: "250" }}>
				<div className="p-2 tree-view-content" style={{ width: "100%" }}>
					<Collapsible open={isVaultOpen} onOpenChange={setIsVaultOpen}>
						<div
							className={cn(
								"group flex items-center gap-2 rounded-md px-1 py-0.5 text-sm mb-1",
								isVaultRoot && "bg-muted",
							)}
						>
							<CollapsibleTrigger asChild>
								<button
									className="shrink-0 p-1.5 rounded hover:bg-muted"
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
								href="/vault"
								className={cn(
									"flex items-center gap-2 rounded-md py-1.5 pr-2 text-sm font-medium hover:bg-muted transition-colors min-w-0 flex-1",
									isVaultRoot && "font-semibold",
								)}
							>
								<FolderOpen className="size-4 text-primary shrink-0" />
								<span>Vault</span>
							</Link>
						</div>
						<CollapsibleContent>
							<div className="pl-2">
								<VaultTree items={filteredTree} gitHubBase={gitHubBase} treeDispatch={treeDispatch} />
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>
			</ScrollArea>

			{/* Resize handle */}
			<div
				className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors"
				onMouseDown={handleResizeMouseDown}
			/>
		</div>
	);
}
