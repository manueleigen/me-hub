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
import { User } from "lucide-react";
import { useDashboardUser } from "@/lib/dashboard-user-context";
import { useSettings } from "@/lib/settings-context";

export default function ProfilPage() {
	const dashboardUser = useDashboardUser();
	const user = dashboardUser
		? {
				name: dashboardUser.name,
				email: dashboardUser.email,
				image: dashboardUser.image,
			}
		: null;
	const { settings, updateSetting, isLoading } = useSettings();

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
								Dein Konto und persönliche App-Einstellungen.
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
								<CardTitle>Editor</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="auto-save">Auto-Save</Label>
										<p className="text-sm text-muted-foreground">
											Speichere Änderungen im Vault-Editor automatisch.
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
					</div>
				</div>
			</div>
		</>
	);
}
