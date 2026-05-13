import { AppHeader } from "@/components/layout/app-header";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import VaultList from "@/components/vault/vault-list";
import { getUserVaultService } from "@/lib/vault/server";
import { flattenVaultTree } from "@/lib/vault";
import { FileText, Folder, Search } from "lucide-react";
import Link from "next/link";

export default async function VaultPage() {
	const svc = await getUserVaultService();
	const tree = await svc.getTree();
	const allFiles = flattenVaultTree();
	const fileCount = allFiles.filter((f) => f.type === "file").length;
	const folderCount = allFiles.filter((f) => f.type === "directory").length;

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Vault" }]} />
			<div className="flex-1 overflow-auto p-6">
				{/* Stats */}
				<div className="grid gap-4 md:grid-cols-3 mb-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Dateien</CardTitle>
							<FileText className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{fileCount}</div>
							<p className="text-xs text-muted-foreground">Markdown-Dateien</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Ordner</CardTitle>
							<Folder className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{folderCount}</div>
							<p className="text-xs text-muted-foreground">Kategorien</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Suche</CardTitle>
							<Search className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Nutze die Suche links oder{" "}
								<kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">
									Ctrl+K
								</kbd>
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Access */}
				<Card>
					<CardHeader>
						<CardTitle>Schnellzugriff</CardTitle>
						<CardDescription>Hauptkategorien deines Vaults</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{tree.map((node) => (
								<Link
									key={node.path}
									href={`/vault/${node.path}`}
									className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
								>
									<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
										<Folder className="size-5 text-primary" />
									</div>
									<div>
										<p className="font-medium">{node.name}</p>
										<p className="text-xs text-muted-foreground">
											{node.children?.length || 0} Eintraege
										</p>
									</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
