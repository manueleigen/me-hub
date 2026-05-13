"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useUser } from "@/hooks/user";
import { useSettings } from "@/lib/settings-context";
import * as React from "react";

export default function ProfilPage() {
	const user = useUser();
	const { settings, updateSetting, isLoading } = useSettings();
	const [vaultConfig, setVaultConfig] = React.useState({
		owner: "",
		repo: "",
		branch: "",
	});
	const [isSavingVault, setIsSavingVault] = React.useState(false);

	React.useEffect(() => {
		if (!isLoading) {
			setVaultConfig({
				owner: settings.vaultGithubOwner,
				repo: settings.vaultGithubRepo,
				branch: settings.vaultGithubBranch,
			});
		}
	}, [isLoading, settings.vaultGithubOwner, settings.vaultGithubRepo, settings.vaultGithubBranch]);

	const saveVaultConfig = async () => {
		setIsSavingVault(true);
		await updateSetting("vaultGithubOwner", vaultConfig.owner);
		await updateSetting("vaultGithubRepo", vaultConfig.repo);
		await updateSetting("vaultGithubBranch", vaultConfig.branch);
		setIsSavingVault(false);
	};

	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	return (
		<>
			<div className="flex min-h-screen flex-col bg-muted p-4 sm:p-6 lg:p-12 dark:bg-background">
				<div className="grid gap-4 ">
					<div className="flex flex-col gap-4">
						<div className="mb-6">
							<h1 className="text-2xl font-bold tracking-tight">Profil</h1>
							<p className="text-muted-foreground">
								Dein Konto und App-Einstellungen.
							</p>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Profilbild</CardTitle>
							</CardHeader>
							<CardContent className="flex items-center gap-4">
								<Avatar className="size-20">
									<AvatarImage src={user?.image ?? undefined} />
									<AvatarFallback>
										{user?.image ? null : <User className="size-8" />}
										{!user?.image && initials}
									</AvatarFallback>
								</Avatar>
								<CardContent className="space-y-4 ">
									<div className="grid gap-1.5">
										<p className="text-sm font-medium">{user?.name || "—"}</p>
										<p className="text-sm font-medium">{user?.email || "—"}</p>
										<p className="text-sm font-medium capitalize">
											Rolle: <b>{(user as { role?: string })?.role || "—"}</b>
										</p>
									</div>
								</CardContent>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Erscheinungsbild</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="dark-mode">Dunkler Modus</Label>
										<p className="text-sm text-muted-foreground">
											Aktiviere den dunklen Modus für die App.
										</p>
									</div>
									<Switch
									id="dark-mode"
									checked={settings.darkMode}
									disabled={isLoading}
									onCheckedChange={(v) => updateSetting("darkMode", v)}
								/>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Vault</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="github-sync">GitHub Sync</Label>
										<p className="text-sm text-muted-foreground">
											Synchronisiere Vault-Dateien mit GitHub.
										</p>
									</div>
									<Switch
										id="github-sync"
										checked={settings.githubSync}
										disabled={isLoading}
										onCheckedChange={(v) => updateSetting("githubSync", v)}
									/>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="auto-save">Auto-Save</Label>
										<p className="text-sm text-muted-foreground">
											Speichere Änderungen automatisch.
										</p>
									</div>
									<Switch
										id="auto-save"
										checked={settings.autoSave}
										disabled={isLoading}
										onCheckedChange={(v) => updateSetting("autoSave", v)}
									/>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>GitHub Vault Konfiguration</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-1.5">
									<Label htmlFor="vault-owner">GitHub Owner</Label>
									<Input
										id="vault-owner"
										placeholder="z.B. manueleigen"
										value={vaultConfig.owner}
										disabled={isLoading}
										onChange={(e) =>
											setVaultConfig((v) => ({ ...v, owner: e.target.value }))
										}
									/>
								</div>
								<div className="grid gap-1.5">
									<Label htmlFor="vault-repo">Repository</Label>
									<Input
										id="vault-repo"
										placeholder="z.B. me-hub"
										value={vaultConfig.repo}
										disabled={isLoading}
										onChange={(e) =>
											setVaultConfig((v) => ({ ...v, repo: e.target.value }))
										}
									/>
								</div>
								<div className="grid gap-1.5">
									<Label htmlFor="vault-branch">Branch</Label>
									<Input
										id="vault-branch"
										placeholder="z.B. main"
										value={vaultConfig.branch}
										disabled={isLoading}
										onChange={(e) =>
											setVaultConfig((v) => ({ ...v, branch: e.target.value }))
										}
									/>
								</div>
								<Button
									onClick={saveVaultConfig}
									disabled={isLoading || isSavingVault}
								>
									{isSavingVault ? "Speichern…" : "Speichern"}
								</Button>
							</CardContent>
						</Card>
						{/* Muss überarbeitet werden - file generierung funktioniert auf Vercel nicht.
						<Card>
							<CardHeader>
								<CardTitle>Vault Templates</CardTitle>
								<CardDescription>
									Erstelle _template.md Dateien in jedem Vault-Ordner als
									Formatreferenz. Diese werden im Listing ignoriert.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<CreateTemplatesButton />
							</CardContent>
						</Card> 
						*/}
					</div>
				</div>
			</div>
		</>
	);
}
