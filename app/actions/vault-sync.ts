"use server";

import { resolveActiveWorkspaceForUser } from "@/app/actions/workspaces";
import { getCachedActiveWorkspaceVault } from "@/lib/cache/server";
import { prisma } from "@/lib/prisma";
import { checkVaultRemoteForWorkspace } from "@/lib/sync/check-vault-remote";
import {
	syncVaultForWorkspace,
	type SyncResult,
} from "@/lib/sync/sync-vault-for-workspace";
import type { VaultRemoteCheckResult } from "@/lib/sync/types";

async function resolveActiveWorkspaceId(): Promise<string | null> {
	const resolved = await resolveActiveWorkspaceForUser();
	if (!resolved?.workspace.githubSync) return null;
	return resolved.workspace.id;
}

export type VaultSyncStatus = {
	inProgress: boolean;
	lastSyncAt: string | null;
	lastSyncError: string | null;
};

export async function getVaultSyncStatus(): Promise<VaultSyncStatus | null> {
	const workspaceId = await resolveActiveWorkspaceId();
	if (!workspaceId) return null;

	try {
		const row = await prisma.workspace.findUnique({
			where: { id: workspaceId },
			select: {
				syncLockedUntil: true,
				lastSyncAt: true,
				lastSyncError: true,
			},
		});
		if (!row) return null;

		return {
			inProgress: Boolean(
				row.syncLockedUntil && row.syncLockedUntil.getTime() > Date.now(),
			),
			lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
			lastSyncError: row.lastSyncError,
		};
	} catch {
		return null;
	}
}

export async function executeVaultSync(): Promise<SyncResult | null> {
	const workspaceId = await resolveActiveWorkspaceId();
	if (!workspaceId) return null;
	return syncVaultForWorkspace(workspaceId, { reconcileOrphans: false });
}

export async function checkVaultRemote(): Promise<VaultRemoteCheckResult | null> {
	const workspaceId = await resolveActiveWorkspaceId();
	if (!workspaceId) return null;
	return checkVaultRemoteForWorkspace(workspaceId);
}

export type VaultSyncSnapshot = {
	status: VaultSyncStatus;
	tick: VaultSyncTick;
};

export async function getVaultSyncSnapshot(): Promise<VaultSyncSnapshot | null> {
	const [status, tick] = await Promise.all([getVaultSyncStatus(), getVaultSyncTick()]);
	if (!status || !tick) return null;
	return { status, tick };
}

export type VaultSyncTick = {
	lastSyncAt: string | null;
	lastSyncedSha: string | null;
	initialSyncCompleted: boolean;
};

export async function getVaultSyncTick(): Promise<VaultSyncTick | null> {
	const workspace = await getCachedActiveWorkspaceVault();
	if (!workspace?.githubSync) return null;

	try {
		const row = await prisma.workspace.findUnique({
			where: { id: workspace.id },
			select: {
				lastSyncAt: true,
				lastSyncedSha: true,
				initialSyncCompleted: true,
			},
		});
		if (!row) return null;

		return {
			lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
			lastSyncedSha: row.lastSyncedSha,
			initialSyncCompleted: row.initialSyncCompleted,
		};
	} catch {
		return null;
	}
}
