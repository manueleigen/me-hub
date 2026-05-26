import type { VaultEditorSavePhase } from "@/lib/vault/editor-guard-context";
import type { VaultSyncPhase } from "@/lib/vault/sync-ui-context";

export type AppStatusVariant =
	| "saving"
	| "checking"
	| "syncing"
	| "success"
	| "error";

export type ResolvedAppStatus = {
	visible: boolean;
	variant: AppStatusVariant;
	label: string;
	title?: string;
	showSpinner: boolean;
};

const VAULT_SYNC_LABELS: Record<Exclude<VaultSyncPhase, "idle">, string> = {
	checking: "Vault prüfen…",
	syncing: "Synchronisiere…",
	success: "Vault aktuell",
	error: "Sync-Fehler",
};

const VAULT_SYNC_TITLES: Record<Exclude<VaultSyncPhase, "idle">, string> = {
	checking: "Vergleicht Branch-Tip mit dem lokalen Mirror",
	syncing: "Importiert Änderungen von GitHub",
	success: "Remote und Mirror sind auf dem gleichen Stand",
	error: "Letzter Sync-Versuch fehlgeschlagen",
};

export function resolveAppStatus(input: {
	pendingSaves: number;
	savePhase: VaultEditorSavePhase;
	vaultSyncPhase: VaultSyncPhase;
	vaultSyncError: string | null;
	showSavedPulse: boolean;
}): ResolvedAppStatus {
	const { pendingSaves, savePhase, vaultSyncPhase, vaultSyncError, showSavedPulse } =
		input;

	const isSaving =
		pendingSaves > 0 ||
		savePhase === "saving-file" ||
		savePhase === "save-complete";

	if (vaultSyncPhase === "error") {
		return {
			visible: true,
			variant: "error",
			label: VAULT_SYNC_LABELS.error,
			title: vaultSyncError ?? VAULT_SYNC_TITLES.error,
			showSpinner: false,
		};
	}

	if (isSaving) {
		return {
			visible: true,
			variant: "saving",
			label:
				savePhase === "save-complete" && pendingSaves === 0
					? "Gespeichert"
					: "Speichern…",
			title: "Schreibt Änderungen nach GitHub",
			showSpinner: savePhase !== "save-complete",
		};
	}

	if (vaultSyncPhase === "syncing") {
		return {
			visible: true,
			variant: "syncing",
			label: VAULT_SYNC_LABELS.syncing,
			title: VAULT_SYNC_TITLES.syncing,
			showSpinner: true,
		};
	}

	if (vaultSyncPhase === "checking") {
		return {
			visible: true,
			variant: "checking",
			label: VAULT_SYNC_LABELS.checking,
			title: VAULT_SYNC_TITLES.checking,
			showSpinner: true,
		};
	}

	if (vaultSyncPhase === "success" || showSavedPulse) {
		return {
			visible: true,
			variant: "success",
			label:
				vaultSyncPhase === "success"
					? VAULT_SYNC_LABELS.success
					: "Gespeichert",
			title:
				vaultSyncPhase === "success"
					? VAULT_SYNC_TITLES.success
					: "Änderungen wurden gespeichert",
			showSpinner: false,
		};
	}

	return {
		visible: false,
		variant: "success",
		label: "",
		showSpinner: false,
	};
}
