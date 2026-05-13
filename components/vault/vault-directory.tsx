"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Folder, LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VaultFile } from "@/types/vault";

interface VaultDirectoryProps {
	directory: VaultFile;
}

type ViewMode = "list" | "grid";

export function VaultDirectory({ directory }: VaultDirectoryProps) {
	const [view, setView] = React.useState<ViewMode>("grid");

	if (!directory.children || directory.children.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-6">
				<Folder className="size-12 text-muted-foreground mb-4" />
				<h2 className="text-lg font-semibold">Leerer Ordner</h2>
				<p className="text-sm text-muted-foreground">
					Dieser Ordner enthält keine Dateien.
				</p>
			</div>
		);
	}

	const folders = directory.children.filter((c) => c.type === "directory");
	const files = directory.children.filter((c) => c.type === "file");
	const all = [...folders, ...files];

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-semibold">{directory.title}</h1>
					<p className="text-sm text-muted-foreground">
						{folders.length} Ordner, {files.length} Dateien
					</p>
				</div>
				<div className="flex gap-1 border rounded-md p-0.5">
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

			{/* Grid / Icon View */}
			{view === "grid" && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
					{all.map((item) => (
						<Link
							key={item.path}
							href={`/vault/${item.path}`}
							className="group flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-muted/60 hover:border-primary/30 transition-all text-center"
						>
							<div className="flex size-12 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
								{item.type === "directory" ? (
									<Folder className="size-6 text-primary" />
								) : (
									<FileText className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
								)}
							</div>
							<span className="text-xs font-medium leading-tight truncate w-full">
								{item.title?.replace(/\.md$/, "") ?? item.name.replace(/\.md$/, "")}
							</span>
							{item.type === "directory" && (
								<span className="text-xs text-muted-foreground">
									{item.children?.length ?? 0} Einträge
								</span>
							)}
						</Link>
					))}
				</div>
			)}

			{/* List View */}
			{view === "list" && (
				<div className="space-y-4">
					{folders.length > 0 && (
						<section>
							<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
								Ordner
							</h2>
							<div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
								{folders.map((folder) => (
									<Link
										key={folder.path}
										href={`/vault/${folder.path}`}
										className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
											<Folder className="size-4 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm truncate">{folder.title}</p>
											<p className="text-xs text-muted-foreground">
												{folder.children?.length || 0} Einträge
											</p>
										</div>
									</Link>
								))}
							</div>
						</section>
					)}

					{files.length > 0 && (
						<section>
							<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
								Dateien
							</h2>
							<div className="grid gap-2">
								{files.map((file) => (
									<Link
										key={file.path}
										href={`/vault/${file.path}`}
										className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="flex size-9 items-center justify-center rounded-lg bg-muted">
											<FileText className="size-4" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm truncate">
												{file.title?.replace(/\.md$/, "") ?? file.name.replace(/\.md$/, "")}
											</p>
											{file.frontmatter?.description && (
												<p className="text-xs text-muted-foreground truncate">
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
											{file.frontmatter?.tags && file.frontmatter.tags.length > 0 && (
												<div className="hidden sm:flex gap-1">
													{file.frontmatter.tags.slice(0, 2).map((tag) => (
														<Badge key={tag} variant="outline" className="text-xs">
															{tag}
														</Badge>
													))}
												</div>
											)}
										</div>
									</Link>
								))}
							</div>
						</section>
					)}
				</div>
			)}
		</div>
	);
}
