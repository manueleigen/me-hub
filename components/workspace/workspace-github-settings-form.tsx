"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	updateWorkspaceGithubSettings,
	type WorkspaceGithubSettingsView,
} from "@/app/actions/workspace-settings";
import { useVaultLink } from "@/lib/vault-link-context";
import { Loader2 } from "lucide-react";
function TokenStatusBadge({ settings }: { settings: WorkspaceGithubSettingsView }) {
	if (settings.hasGithubToken) {
		return (
			<Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
				Token gespeichert
			</Badge>
		);
	}
	return <Badge variant="outline">Kein Token</Badge>;
}

function TokenStatusDescription({ settings }: { settings: WorkspaceGithubSettingsView }) {
	if (settings.hasGithubToken) {
		return (
			<p className="text-xs text-muted-foreground">
				Ein verschlüsselter Personal Access Token ist für diesen Workspace hinterlegt. Alle
				Mitglieder nutzen ihn für Vault-Zugriff.
			</p>
		);
	}
	return (
		<p className="text-xs text-muted-foreground">
			Kein PAT hinterlegt — Vault-Sync und Schreibzugriff sind deaktiviert, bis ein Admin ein
			fein abgestuftes PAT speichert. GitHub-Login dient nur der Anmeldung.
		</p>
	);
}

export function WorkspaceGithubSettingsForm({
	workspaceId,
	settings,
	canManage,
}: {
	workspaceId: string;
	settings: WorkspaceGithubSettingsView;
	canManage: boolean;
}) {
	const router = useRouter();
	const { refreshVaultLink } = useVaultLink();
	const [isPending, startTransition] = useTransition();
	const [isRemovingToken, setIsRemovingToken] = useState(false);

	const [githubSync, setGithubSync] = useState(settings.githubSync);
	const [owner, setOwner] = useState(settings.vaultGithubOwner ?? "");
	const [repo, setRepo] = useState(settings.vaultGithubRepo ?? "");
	const [branch, setBranch] = useState(settings.vaultGithubBranch ?? "main");
	const [githubToken, setGithubToken] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canManage) return;

		startTransition(async () => {
			try {
				await updateWorkspaceGithubSettings(workspaceId, {
					githubSync,
					vaultGithubOwner: owner || undefined,
					vaultGithubRepo: repo || undefined,
					vaultGithubBranch: branch || "main",
					...(githubToken.trim() ? { githubToken: githubToken.trim() } : {}),
				});
				setGithubToken("");
				await refreshVaultLink();
				toast.success("GitHub-Einstellungen gespeichert.");
				router.refresh();
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Fehler beim Speichern der GitHub-Einstellungen.",
				);
			}
		});
	};

	const handleRemoveToken = () => {
		if (!canManage || !settings.hasGithubToken) return;
		if (!confirm("Gespeicherten Access Token wirklich entfernen? Vault-Zugriff kann danach ausfallen.")) {
			return;
		}
		setIsRemovingToken(true);
		startTransition(async () => {
			try {
				await updateWorkspaceGithubSettings(workspaceId, { clearGithubToken: true });
				setGithubToken("");
				await refreshVaultLink();
				toast.success("Token entfernt.");
				router.refresh();
			} catch {
				toast.error("Token konnte nicht entfernt werden.");
			} finally {
				setIsRemovingToken(false);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit}>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">GitHub Vault</CardTitle>
					<CardDescription>
						Gilt für alle Mitglieder dieses Workspaces. Nur Workspace-Admins können die
						Verbindung ändern.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between gap-4">
						<div>
							<Label htmlFor="github-sync">GitHub Sync aktivieren</Label>
							<p className="text-xs text-muted-foreground mt-0.5">
								Synchronisiert Vault-Dateien mit einem GitHub-Repository.
							</p>
						</div>
						<Switch
							id="github-sync"
							checked={githubSync}
							onCheckedChange={setGithubSync}
							disabled={!canManage}
						/>
					</div>

					{(githubSync || !canManage) && (
						<>
							<div className="space-y-2">
								<Label htmlFor="gh-owner">GitHub Owner</Label>
								<Input
									id="gh-owner"
									placeholder="username oder organisation"
									value={owner}
									onChange={(e) => setOwner(e.target.value)}
									disabled={!canManage}
									readOnly={!canManage}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="gh-repo">Repository</Label>
								<Input
									id="gh-repo"
									placeholder="repo-name"
									value={repo}
									onChange={(e) => setRepo(e.target.value)}
									disabled={!canManage}
									readOnly={!canManage}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="gh-branch">Branch</Label>
								<Input
									id="gh-branch"
									placeholder="main"
									value={branch}
									onChange={(e) => setBranch(e.target.value)}
									disabled={!canManage}
									readOnly={!canManage}
								/>
							</div>

							<div className="space-y-3 border-t pt-4">
								<div className="flex flex-wrap items-center gap-2">
									<Label className="mb-0">Access Token (PAT)</Label>
									<TokenStatusBadge settings={settings} />
								</div>
								<TokenStatusDescription settings={settings} />
								{canManage ? (
									<>
										<Input
											id="gh-token"
											type="password"
											autoComplete="off"
											placeholder="Neuen Token eingeben (ghp_…)"
											value={githubToken}
											onChange={(e) => setGithubToken(e.target.value)}
										/>
										<p className="text-xs text-muted-foreground">
											Beim Speichern wird ein eingegebener Token immer überschrieben. Leeres Feld
											ändert den gespeicherten Token nicht. Der Token wird gegen das oben
											eingestellte Repository geprüft; in Production wird{" "}
											<code className="text-[11px]">GITHUB_TOKEN_ENCRYPTION_KEY</code> zur
											Verschlüsselung benötigt. Empfohlen: fein abgestuftes PAT nur mit Zugriff auf
											diese Repo-Inhalte.
										</p>
										{settings.hasGithubToken && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="text-destructive hover:text-destructive"
												disabled={isPending || isRemovingToken}
												onClick={handleRemoveToken}
											>
												{isRemovingToken && (
													<Loader2 className="size-3.5 mr-1.5 animate-spin" />
												)}
												Token entfernen
											</Button>
										)}
									</>
								) : null}
							</div>
						</>
					)}

					{canManage && (
						<Button type="submit" disabled={isPending || isRemovingToken}>
							{isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
							GitHub-Einstellungen speichern
						</Button>
					)}
				</CardContent>
			</Card>
		</form>
	);
}
