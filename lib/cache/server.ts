import { cache } from "react";
import { getAuthSession } from "@/lib/auth";
import { resolveActiveWorkspaceForUser } from "@/app/actions/workspaces";
import { prisma } from "@/lib/prisma";
import {
	mapSessionUserToVaultRow,
	sessionUserHasVaultFields,
	type VaultSessionUser,
} from "@/types/vault-session-user";

/** @deprecated Use getAuthSession — same cached function. */
export const getCachedAuthSession = getAuthSession;

export type VaultUserRow = VaultSessionUser;

export type ActiveWorkspaceVault = {
	id: string;
	githubSync: boolean;
	vaultGithubOwner: string | null;
	vaultGithubRepo: string | null;
	vaultGithubBranch: string | null;
	initialSyncCompleted: boolean;
};

export type MirrorReadContext = {
	workspaceId: string;
	useMirror: boolean;
};

async function fetchVaultUserFromDb(userId: string): Promise<VaultUserRow | null> {
	return prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			darkMode: true,
			autoSave: true,
		},
	});
}

export const getCachedVaultUser = cache(async (): Promise<VaultUserRow | null> => {
	const session = await getAuthSession();
	const raw = session?.user;
	if (!raw?.id) return null;

	const record = raw as Record<string, unknown> & { id: string };

	if (sessionUserHasVaultFields(record)) {
		return mapSessionUserToVaultRow(record);
	}

	if (process.env.NODE_ENV === "development") {
		console.warn(
			"[vault] session.user missing preference fields; falling back to prisma.user.findUnique",
		);
	}

	return fetchVaultUserFromDb(raw.id);
});

export type VaultUserSettings = {
	darkMode: boolean;
	autoSave: boolean;
};

export const getCachedUserSettings = cache(async (): Promise<VaultUserSettings | null> => {
	const user = await getCachedVaultUser();
	if (!user) return null;

	return {
		darkMode: user.darkMode,
		autoSave: user.autoSave,
	};
});

export const getCachedActiveWorkspaceVault = cache(
	async (): Promise<ActiveWorkspaceVault | null> => {
		const resolved = await resolveActiveWorkspaceForUser();
		if (!resolved) return null;

		const { workspace } = resolved;
		return {
			id: workspace.id,
			githubSync: workspace.githubSync,
			vaultGithubOwner: workspace.vaultGithubOwner,
			vaultGithubRepo: workspace.vaultGithubRepo,
			vaultGithubBranch: workspace.vaultGithubBranch,
			initialSyncCompleted: workspace.initialSyncCompleted,
		};
	},
);

export const getCachedMirrorReadContext = cache(
	async (): Promise<MirrorReadContext | null> => {
		const workspace = await getCachedActiveWorkspaceVault();
		if (!workspace?.githubSync) return null;

		const owner = (workspace.vaultGithubOwner ?? "").trim();
		const repo = (workspace.vaultGithubRepo ?? "").trim();
		if (!owner || !repo) return null;

		return {
			workspaceId: workspace.id,
			useMirror: workspace.initialSyncCompleted,
		};
	},
);

/** Repo config from the active workspace. */
export const getCachedVaultConfig = cache(async () => {
	const workspace = await getCachedActiveWorkspaceVault();
	const owner = (workspace?.vaultGithubOwner ?? "").trim();
	const repo = (workspace?.vaultGithubRepo ?? "").trim();
	const branch = (workspace?.vaultGithubBranch ?? "main").trim() || "main";
	return { owner, repo, branch, workspaceId: workspace?.id ?? null };
});
