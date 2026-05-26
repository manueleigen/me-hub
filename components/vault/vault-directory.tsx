"use client";

import * as React from "react";
import { FileText, Folder, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VaultFile } from "@/types/vault";
import { vaultEntryDisplayName } from "@/lib/vault/display-name";
import { useVaultBasePath } from "@/hooks/use-vault-base-path";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import { useRevalidatePage } from "@/hooks/use-revalidate-page";
import { useSync } from "@/lib/vault/sync-context";
import { createVaultFile, createVaultFolder } from "@/app/actions/vault";
import { VaultDirectoryItem } from "@/components/vault/vault-directory-item";
import { VaultPointerMenu } from "@/components/vault/vault-pointer-menu";
import { VaultTreeCreateMenuItems } from "@/components/vault/vault-tree";

interface VaultDirectoryProps {
	directory: VaultFile;
}

type ViewMode = "list" | "grid";

function VaultDirectoryCreateRow({
	type,
	onCommit,
	onCancel,
}: {
	type: "file" | "folder";
	onCommit: (name: string) => Promise<boolean>;
	onCancel: () => void;
}) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [value, setValue] = React.useState(
		type === "file" ? "untitled.md" : "Neuer Ordner",
	);
	const [hasError, setHasError] = React.useState(false);
	const isSubmittingRef = React.useRef(false);

	React.useEffect(() => {
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
	}, []);

	const commit = async () => {
		if (isSubmittingRef.current) return;
		const name = value.trim();
		if (!name) {
			onCancel();
			return;
		}
		isSubmittingRef.current = true;
		setHasError(false);
		const ok = await onCommit(name);
		isSubmittingRef.current = false;
		if (!ok) {
			setHasError(true);
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	};

	return (
		<div className="mb-4 flex max-w-md items-center gap-2 rounded-lg border bg-muted/30 p-2">
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
						onCancel();
					}
				}}
				onBlur={() => void commit()}
				className={hasError ? "border-destructive" : undefined}
				placeholder={type === "file" ? "dateiname.md" : "ordner-name"}
			/>
		</div>
	);
}

export function VaultDirectory({ directory }: VaultDirectoryProps) {
	const [view, setView] = React.useState<ViewMode>("grid");
	const vaultBase = useVaultBasePath();
	const vaultWriteEnabled = useVaultWriteEnabled();
	const revalidate = useRevalidatePage();
	const { startSync, endSync } = useSync();
	const [createMenu, setCreateMenu] = React.useState<{
		x: number;
		y: number;
	} | null>(null);
	const [pendingCreate, setPendingCreate] = React.useState<{
		type: "file" | "folder";
		parentPath: string;
	} | null>(null);
	const [isCreating, setIsCreating] = React.useState(false);

	const parentPath = directory.path;

	const handleBackgroundContextMenu = (e: React.MouseEvent) => {
		if (
			(e.target as Element).closest(
				"[data-vault-directory-item], [data-vault-folder-item]",
			)
		) {
			return;
		}
		if ((e.target as Element).closest("[data-vault-directory-create]")) return;
		e.preventDefault();
		setCreateMenu({ x: e.clientX, y: e.clientY });
	};

	const startInlineCreateAt = React.useCallback(
		(type: "file" | "folder", targetParentPath: string) => {
			if (pendingCreate || isCreating || !vaultWriteEnabled) return;
			setPendingCreate({ type, parentPath: targetParentPath });
		},
		[pendingCreate, isCreating, vaultWriteEnabled],
	);

	const handleCreateCommit = async (name: string): Promise<boolean> => {
		if (!pendingCreate || isCreating) return false;
		const { type, parentPath: createParentPath } = pendingCreate;
		setPendingCreate(null);
		setIsCreating(true);
		startSync();
		try {
			await (type === "file"
				? createVaultFile(createParentPath, name)
				: createVaultFolder(createParentPath, name));
			const fileName =
				type === "file" && !name.includes(".") ? `${name}.md` : name;
			toast.success(
				type === "file"
					? `Datei „${fileName}“ erstellt`
					: `Ordner „${name}“ erstellt`,
			);
			React.startTransition(() => revalidate());
			return true;
		} catch (err) {
			const message =
				err instanceof Error && err.message
					? err.message
					: "Fehler beim Erstellen";
			toast.error(message);
			setPendingCreate({ type, parentPath: createParentPath });
			return false;
		} finally {
			setIsCreating(false);
			endSync();
		}
	};

	const folders =
		directory.children?.filter((c) => c.type === "directory") ?? [];
	const files = directory.children?.filter((c) => c.type === "file") ?? [];
	const all = [...folders, ...files];
	const isEmpty = all.length === 0;

	return (
		<div
			data-vault-directory-scroll
			className="relative flex min-h-full flex-col p-6"
			onContextMenu={handleBackgroundContextMenu}
		>
			<div
				aria-hidden
				className="absolute inset-0 z-0"
				onContextMenu={handleBackgroundContextMenu}
			/>

			{createMenu && (
				<VaultPointerMenu
					open
					x={createMenu.x}
					y={createMenu.y}
					onOpenChange={(open) => {
						if (!open) setCreateMenu(null);
					}}
				>
					<VaultTreeCreateMenuItems
						parentPath={parentPath}
						disabled={!vaultWriteEnabled || !!pendingCreate || isCreating}
						onStartCreate={(type) => {
							setCreateMenu(null);
							startInlineCreateAt(type, parentPath);
						}}
					/>
				</VaultPointerMenu>
			)}

			<div className="relative z-10 flex min-h-full flex-1 flex-col">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-xl font-semibold">
							{directory.title || directory.name}
						</h1>
						<p className="text-sm text-muted-foreground">
							{isEmpty
								? "Leerer Ordner"
								: `${folders.length} Ordner, ${files.length} Dateien`}
						</p>
					</div>
					<div className="flex gap-1 rounded-md border p-0.5">
						<Button
							variant={view === "grid" ? "secondary" : "ghost"}
							size="icon"
							className="size-7"
							onClick={() => setView("grid")}
						>
							<LayoutGrid className="size-3.5" />
						</Button>
						<Button
							variant={view === "list" ? "secondary" : "ghost"}
							size="icon"
							className="size-7"
							onClick={() => setView("list")}
						>
							<List className="size-3.5" />
						</Button>
					</div>
				</div>

				{pendingCreate && (
					<div data-vault-directory-create>
						{pendingCreate.parentPath !== parentPath && (
							<p className="mb-2 text-xs text-muted-foreground">
								Neu in „
								{pendingCreate.parentPath.split("/").pop() ??
									pendingCreate.parentPath}
								“
							</p>
						)}
						<VaultDirectoryCreateRow
							type={pendingCreate.type}
							onCommit={handleCreateCommit}
							onCancel={() => setPendingCreate(null)}
						/>
					</div>
				)}

				{isEmpty && !pendingCreate ? (
					<div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
						<Folder className="mb-4 size-12 text-muted-foreground" />
						<h2 className="text-lg font-semibold">Leerer Ordner</h2>
						<p className="text-sm text-muted-foreground">
							Rechtsklick für neue Datei oder Ordner.
						</p>
					</div>
				) : view === "grid" ? (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
						{all.map((item) => (
							<VaultDirectoryItem
								key={item.path}
								item={item}
								vaultBase={vaultBase}
								layout="grid"
								onStartCreate={startInlineCreateAt}
								vaultWriteEnabled={vaultWriteEnabled}
								createDisabled={!!pendingCreate || isCreating}
							/>
						))}
					</div>
				) : (
					<div className="space-y-4">
						{folders.length > 0 && (
							<section>
								<h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Ordner
								</h2>
								<div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
									{folders.map((folder) => (
										<VaultDirectoryItem
											key={folder.path}
											item={folder}
											vaultBase={vaultBase}
											layout="list"
											onStartCreate={startInlineCreateAt}
											vaultWriteEnabled={vaultWriteEnabled}
											createDisabled={!!pendingCreate || isCreating}
										>
											<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
												<Folder className="size-4 text-primary" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">
													{folder.title || folder.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{folder.children?.length || 0} Einträge
												</p>
											</div>
										</VaultDirectoryItem>
									))}
								</div>
							</section>
						)}

						{files.length > 0 && (
							<section>
								<h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Dateien
								</h2>
								<div className="grid gap-2">
									{files.map((file) => (
										<VaultDirectoryItem
											key={file.path}
											item={file}
											vaultBase={vaultBase}
											layout="list"
											onStartCreate={startInlineCreateAt}
											vaultWriteEnabled={vaultWriteEnabled}
											createDisabled={!!pendingCreate || isCreating}
										>
											<div className="flex size-9 items-center justify-center rounded-lg bg-muted">
												<FileText className="size-4" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">
													{vaultEntryDisplayName(file.name, file.title)}
												</p>
												{file.frontmatter?.description && (
													<p className="truncate text-xs text-muted-foreground">
														{file.frontmatter.description}
													</p>
												)}
											</div>
											<div className="flex items-center gap-2">
												{file.frontmatter?.status && (
													<Badge variant="secondary" className="text-xs">
														{file.frontmatter.status}
													</Badge>
												)}
												{file.frontmatter?.tags &&
													file.frontmatter.tags.length > 0 && (
														<div className="hidden gap-1 sm:flex">
															{file.frontmatter.tags
																.slice(0, 2)
																.map((tag) => (
																	<Badge
																		key={tag}
																		variant="outline"
																		className="text-xs"
																	>
																		{tag}
																	</Badge>
																))}
														</div>
													)}
											</div>
										</VaultDirectoryItem>
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
