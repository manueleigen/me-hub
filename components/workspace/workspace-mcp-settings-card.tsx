"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	regenerateWorkspaceMcpApiKey,
	revokeWorkspaceMcpApiKey,
	updateWorkspaceMcpSettings,
	type WorkspaceMcpSettingsView,
} from "@/app/actions/workspace-settings";

function buildClaudeDesktopSnippet(endpointUrl: string, apiKeyPlaceholder = "DEIN_SCHLÜSSEL") {
	return JSON.stringify(
		{
			mcpServers: {
				mehub: {
					command: "npx",
					args: [
						"-y",
						"mcp-remote",
						endpointUrl,
						"--header",
						"Authorization:${MEHUB_MCP_AUTH}",
					],
					env: {
						MEHUB_MCP_AUTH: `Bearer ${apiKeyPlaceholder}`,
					},
				},
			},
		},
		null,
		2,
	);
}

export function WorkspaceMcpSettingsCard({
	workspaceId,
	settings,
	canManage,
}: {
	workspaceId: string;
	settings: WorkspaceMcpSettingsView;
	canManage: boolean;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [mcpEnabled, setMcpEnabled] = useState(settings.mcpEnabled);
	const [revealedKey, setRevealedKey] = useState<string | null>(null);
	const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);

	const copy = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`${label} kopiert.`);
		} catch {
			toast.error("Kopieren fehlgeschlagen.");
		}
	};

	const handleToggle = (checked: boolean) => {
		if (!canManage) return;
		setMcpEnabled(checked);
		startTransition(async () => {
			try {
				await updateWorkspaceMcpSettings(workspaceId, { mcpEnabled: checked });
				toast.success(checked ? "MCP aktiviert." : "MCP deaktiviert.");
				router.refresh();
			} catch (err) {
				setMcpEnabled(!checked);
				toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
			}
		});
	};

	const runRegenerateKey = () => {
		if (!canManage) return;
		startTransition(async () => {
			try {
				const { apiKey } = await regenerateWorkspaceMcpApiKey(workspaceId);
				setRevealedKey(apiKey);
				setMcpEnabled(false);
				setConfirmRegenerateOpen(false);
				toast.success(
					"Neuer Schlüssel erzeugt. MCP bleibt aus — erst aktivieren und Schlüssel nur an einem sicheren Ort eintragen.",
				);
				router.refresh();
			} catch {
				toast.error("Schlüssel konnte nicht erzeugt werden.");
			}
		});
	};

	const handleRevoke = () => {
		if (!canManage) return;
		if (
			!confirm(
				"MCP-Schlüssel widerrufen? Claude Desktop und andere Clients verlieren sofort den Zugriff.",
			)
		) {
			return;
		}
		startTransition(async () => {
			try {
				await revokeWorkspaceMcpApiKey(workspaceId);
				setRevealedKey(null);
				setMcpEnabled(false);
				toast.success("MCP-Zugang widerrufen.");
				router.refresh();
			} catch {
				toast.error("Widerruf fehlgeschlagen.");
			}
		});
	};

	const desktopConfigSnippet = buildClaudeDesktopSnippet(
		settings.endpointUrl,
		revealedKey ?? "mhub_…",
	);

	return (
		<>
			<AlertDialog open={confirmRegenerateOpen} onOpenChange={setConfirmRegenerateOpen}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Neuen MCP-Schlüssel erzeugen?</AlertDialogTitle>
						<AlertDialogDescription className="space-y-2">
							<span className="block">
								Der Klartext-Schlüssel wird genau einmal angezeigt. Bitte keine Bildschirmfreigabe oder
								Extensions mit Seitenzugriff während du ihn kopierst.
							</span>
							<span className="block text-amber-600 dark:text-amber-400">
								Bestehende MCP-Clients funktionieren nach der Rotation erst wieder mit dem neuen
								Schlüssel; MCP wird dabei deaktiviert, bis du es wieder aktivierst.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
						<Button
							type="button"
							disabled={isPending}
							onClick={runRegenerateKey}
							className="w-full sm:w-auto"
						>
							{isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
							Schlüssel erzeugen
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Card>
				<CardHeader>
				<CardTitle className="text-base">MCP (Claude Desktop)</CardTitle>
				<CardDescription>
					Pro Workspace ein eigener API-Schlüssel. MCP ist standardmäßig aus — erst Schlüssel erzeugen,
					dann aktivieren.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between gap-4">
					<div>
						<Label htmlFor="mcp-enabled">MCP-Zugang aktiv</Label>
						<p className="text-xs text-muted-foreground mt-0.5">
							Nur mit gültigem API-Schlüssel. Deaktivieren blockiert alle Clients.
						</p>
					</div>
					<Switch
						id="mcp-enabled"
						checked={mcpEnabled}
						onCheckedChange={handleToggle}
						disabled={!canManage || isPending || !settings.hasApiKey}
					/>
				</div>

				<div className="space-y-2">
					<Label>API-Schlüssel</Label>
					{settings.hasApiKey ? (
						<p className="text-sm font-mono text-muted-foreground">
							{settings.apiKeyPrefix ?? "mhub_…"}
							{settings.mcpLastUsedAt && (
								<span className="font-sans text-xs block mt-1">
									Zuletzt genutzt:{" "}
									{new Date(settings.mcpLastUsedAt).toLocaleString("de-DE")}
								</span>
							)}
						</p>
					) : (
						<p className="text-sm text-muted-foreground">Noch kein Schlüssel erzeugt.</p>
					)}

					{revealedKey && (
						<div className="rounded-lg border bg-muted/40 p-3 space-y-2">
							<p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
								Schlüssel nur einmal sichtbar — jetzt kopieren und an einem sicheren Ort einfügen (keine
								Screenshare, keine Logs).
							</p>
							<code className="block text-xs break-all font-mono">{revealedKey}</code>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => copy(revealedKey, "API-Schlüssel")}
							>
								<Copy className="size-3.5 mr-1.5" />
								Schlüssel kopieren
							</Button>
						</div>
					)}

					{canManage && (
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={isPending}
								onClick={() => setConfirmRegenerateOpen(true)}
							>
								{settings.hasApiKey ? "Schlüssel rotieren" : "Schlüssel erzeugen"}
							</Button>
							{settings.hasApiKey && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={isPending}
									onClick={handleRevoke}
								>
									Widerrufen
								</Button>
							)}
						</div>
					)}
				</div>

				<div className="space-y-2">
					<Label>Endpunkt</Label>
					<div className="flex gap-2">
						<code className="flex-1 text-xs break-all rounded-md bg-muted px-2 py-1.5 font-mono">
							{settings.endpointUrl}
						</code>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="shrink-0"
							onClick={() => copy(settings.endpointUrl, "Endpunkt-URL")}
						>
							<Copy className="size-4" />
						</Button>
					</div>
				</div>

				<div className="space-y-2">
					<Label>
						Claude Desktop — <code className="text-xs">claude_desktop_config.json</code>
					</Label>
					<p className="text-xs text-muted-foreground">
						Desktop unterstützt kein <code className="text-[11px]">type: http</code> — nutzt{" "}
						<code className="text-[11px]">mcp-remote</code> als Brücke. Datei liegt typischerweise unter{" "}
						<code className="text-[11px]">~/Library/Application Support/Claude/</code> (macOS).
					</p>
					<pre className="text-xs overflow-x-auto rounded-lg bg-muted p-3 font-mono max-h-56">
						{desktopConfigSnippet}
					</pre>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => copy(desktopConfigSnippet, "Desktop-MCP-Konfiguration")}
					>
						<Copy className="size-3.5 mr-1.5" />
						Konfiguration kopieren
					</Button>
				</div>
			</CardContent>
		</Card>
		</>
	);
}
