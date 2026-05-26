"use server";

import { prisma } from "@/lib/prisma";
import { getWorkspaceVaultRepoConfig } from "@/lib/github/workspace-mirror-context";
import {
	forceFullWorkspaceVaultResync,
	type SyncResult,
} from "@/lib/sync/sync-vault-for-workspace";
import { requireWorkspaceAdmin } from "@/app/actions/workspace-settings";
import { logSecurityAuditEvent } from "@/lib/security-audit";

export type WorkspaceVaultMirrorStats = {
	fileCount: number;
	initialSyncCompleted: boolean;
	lastSyncAt: string | null;
	lastSyncedSha: string | null;
	lastSyncError: string | null;
};

export async function getWorkspaceVaultMirrorStats(
	workspaceId: string,
): Promise<WorkspaceVaultMirrorStats | null> {
	try {
		await requireWorkspaceAdmin(workspaceId);
	} catch {
		return null;
	}

	try {
		const [fileCount, row] = await Promise.all([
			prisma.workspaceFileMirror.count({ where: { workspaceId } }),
			prisma.workspace.findUnique({
				where: { id: workspaceId },
				select: {
					initialSyncCompleted: true,
					lastSyncAt: true,
					lastSyncedSha: true,
					lastSyncError: true,
				},
			}),
		]);

		return {
			fileCount,
			initialSyncCompleted: row?.initialSyncCompleted ?? false,
			lastSyncAt: row?.lastSyncAt?.toISOString() ?? null,
			lastSyncedSha: row?.lastSyncedSha ?? null,
			lastSyncError: row?.lastSyncError ?? null,
		};
	} catch {
		return {
			fileCount: 0,
			initialSyncCompleted: false,
			lastSyncAt: null,
			lastSyncedSha: null,
			lastSyncError: null,
		};
	}
}

function syncResultMessage(result: SyncResult): string {
	switch (result.status) {
		case "full-import":
			return `${result.imported} Dateien von GitHub importiert.`;
		case "synced":
			return `Aktualisiert: ${result.filesUpdated} geändert, ${result.filesDeleted} gelöscht.`;
		case "up-to-date":
			return "Vault ist bereits auf dem neuesten Stand.";
		case "not-configured":
			return "GitHub Vault ist nicht konfiguriert (Owner/Repo oder Sync aus).";
		case "no-token":
			return "Kein GitHub-Token verfügbar. PAT in den Workspace-GitHub-Einstellungen hinterlegen.";
		case "skipped-locked":
			return "Sync läuft bereits. Bitte kurz warten und erneut versuchen.";
		case "error":
			return result.message;
	}
}

export type ResetWorkspaceVaultMirrorResult =
	| { ok: true; deletedCount: number; message: string }
	| { ok: false; error: string };

export async function resetWorkspaceVaultMirrorAndRefetch(
	workspaceId: string,
): Promise<ResetWorkspaceVaultMirrorResult> {
	let actorUserId: string;
	try {
		const a = await requireWorkspaceAdmin(workspaceId);
		actorUserId = a.userId;
	} catch {
		return { ok: false, error: "Keine Berechtigung für diese Aktion." };
	}

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { githubSync: true },
	});
	if (!workspace?.githubSync) {
		return { ok: false, error: "GitHub Sync ist deaktiviert." };
	}

	const config = await getWorkspaceVaultRepoConfig(workspaceId);
	if (!config) {
		return {
			ok: false,
			error: "Vault-Repository fehlt (Owner oder Repo in den Workspace-Einstellungen).",
		};
	}

	let deletedCount = 0;
	try {
		deletedCount = await prisma.workspaceFileMirror.count({
			where: { workspaceId },
		});
	} catch {
		deletedCount = 0;
	}

	const result = await forceFullWorkspaceVaultResync(workspaceId);

	if (result.status === "error") {
		return { ok: false, error: result.message };
	}

	if (result.status === "not-configured" || result.status === "no-token") {
		return { ok: false, error: syncResultMessage(result) };
	}

	if (result.status === "skipped-locked") {
		return { ok: false, error: syncResultMessage(result) };
	}

	logSecurityAuditEvent({
		action: "workspace_vault_mirror_full_reset",
		actorUserId,
		workspaceId,
		meta: {
			deletedMirrorRows: deletedCount,
			syncStatus: result.status,
		},
	});

	return {
		ok: true,
		deletedCount,
		message: syncResultMessage(result),
	};
}
