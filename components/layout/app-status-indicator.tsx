"use client";

import * as React from "react";
import { AlertCircle, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAppStatus } from "@/lib/app-status/resolve-status";
import { useSync } from "@/lib/vault/sync-context";
import { useVaultEditorGuard } from "@/lib/vault/editor-guard-context";
import { useVaultSync } from "@/lib/vault/sync-ui-context";

const VARIANT_STYLES = {
	saving: "bg-background text-foreground ring-foreground/10",
	checking: "bg-yellow-400 text-yellow-950 ring-yellow-500/30",
	syncing: "bg-violet-600 text-white ring-violet-400/40",
	success: "bg-green-600 text-white ring-green-400/40",
	error: "bg-red-600 text-white ring-red-400/40",
} as const;

/** Single top-right status for saves, vault mirror sync, and post-sync refresh. */
export function AppStatusIndicator() {
	const { pending, lastSavedAt } = useSync();
	const { savePhase } = useVaultEditorGuard();
	const { phase: vaultSyncPhase, errorMessage } = useVaultSync();
	const [showSavedPulse, setShowSavedPulse] = React.useState(false);

	React.useEffect(() => {
		if (lastSavedAt === null || pending > 0) return;
		if (savePhase !== "idle" || vaultSyncPhase !== "idle") return;
		setShowSavedPulse(true);
		const t = window.setTimeout(() => setShowSavedPulse(false), 2500);
		return () => window.clearTimeout(t);
	}, [lastSavedAt, pending, savePhase, vaultSyncPhase]);

	const status = resolveAppStatus({
		pendingSaves: pending,
		savePhase,
		vaultSyncPhase,
		vaultSyncError: errorMessage,
		showSavedPulse,
	});

	return (
		<div
			role="status"
			aria-live="polite"
			title={status.title}
			className={cn(
				"fixed top-3 right-3 z-[200] flex max-w-[min(100vw-1.5rem,20rem)] items-center gap-2 rounded-full px-3 py-1.5 text-sm shadow-lg ring-1 transition-all duration-300 animate-in fade-in slide-in-from-top-2",
				VARIANT_STYLES[status.variant],
				status.visible
					? "opacity-100 pointer-events-auto"
					: "pointer-events-none opacity-0",
			)}
		>
			{status.showSpinner ? (
				<Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
			) : status.variant === "error" ? (
				<AlertCircle className="size-3.5 shrink-0" aria-hidden />
			) : status.variant === "checking" ? (
				<Search className="size-3.5 shrink-0 animate-pulse" aria-hidden />
			) : (
				<Check className="size-3.5 shrink-0" aria-hidden />
			)}
			<span className="truncate">{status.label}</span>
		</div>
	);
}
