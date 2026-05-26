"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
	getWorkspaceVaultMirrorStats,
	resetWorkspaceVaultMirrorAndRefetch,
	type WorkspaceVaultMirrorStats,
} from "@/app/actions/workspace-vault-sync";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function formatSyncTime(iso: string | null): string {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleString("de-DE", {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

export function WorkspaceVaultResyncCard({
	workspaceId,
	canEdit,
}: {
	workspaceId: string;
	canEdit: boolean;
}) {
	const router = useRouter();
	const [stats, setStats] = useState<WorkspaceVaultMirrorStats | null>(null);
	const [loadingStats, setLoadingStats] = useState(true);
	const [isPending, startTransition] = useTransition();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const loadStats = useCallback(async () => {
		setLoadingStats(true);
		try {
			const data = await getWorkspaceVaultMirrorStats(workspaceId);
			setStats(data);
		} catch {
			setStats(null);
		} finally {
			setLoadingStats(false);
		}
	}, [workspaceId]);

	useEffect(() => {
		void loadStats();
	}, [loadStats]);

	const handleReset = () => {
		setConfirmOpen(false);
		startTransition(async () => {
			const result = await resetWorkspaceVaultMirrorAndRefetch(workspaceId);
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			toast.success(result.message);
			await loadStats();
			router.refresh();
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Database className="size-5" />
					Vault-Daten (Cache)
				</CardTitle>
				<CardDescription>
					Lokale Kopie der Vault-Dateien aus GitHub für diesen Workspace. Bei
					fehlenden oder veralteten Einträgen Cache leeren und neu laden.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<dl className="grid gap-2 text-sm sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground">Gespiegelte Dateien</dt>
						<dd className="font-medium tabular-nums">
							{loadingStats ? "…" : (stats?.fileCount ?? 0)}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Initial-Sync</dt>
						<dd className="font-medium">
							{loadingStats
								? "…"
								: stats?.initialSyncCompleted
									? "Abgeschlossen"
									: "Ausstehend"}
						</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-muted-foreground">Letzter Sync</dt>
						<dd className="font-medium">{formatSyncTime(stats?.lastSyncAt ?? null)}</dd>
					</div>
					{stats?.lastSyncError ? (
						<div className="sm:col-span-2">
							<dt className="text-muted-foreground">Letzter Fehler</dt>
							<dd className="font-medium text-destructive">{stats.lastSyncError}</dd>
						</div>
					) : null}
				</dl>

				{canEdit ? (
					<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								className="gap-2"
								disabled={isPending || loadingStats}
							>
								{isPending ? (
									<RefreshCw className="size-4 animate-spin" />
								) : (
									<Trash2 className="size-4" />
								)}
								{isPending ? "Lädt neu…" : "Cache leeren & Vault neu laden"}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Vault-Cache zurücksetzen?</AlertDialogTitle>
								<AlertDialogDescription>
									Alle {stats?.fileCount ?? 0} gespiegelten Dateien werden aus der
									Datenbank gelöscht. Anschließend wird der komplette Vault erneut von
									GitHub importiert. Die App zeigt danach frische Daten — das kann je nach
									Repository-Größe etwas dauern.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									disabled={isPending}
									onClick={(e) => {
										e.preventDefault();
										handleReset();
									}}
								>
									{isPending ? "Import läuft…" : "Ja, neu laden"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				) : (
					<p className="text-sm text-muted-foreground">
						Nur Workspace-Admins können den Cache zurücksetzen.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
