import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeVaultBranch } from "@/lib/sync/branch-tip";
import { syncVaultForWorkspace } from "@/lib/sync/sync-vault-for-workspace";
import type { SyncResult } from "@/lib/sync/types";
import { prisma } from "@/lib/prisma";

export type GitHubPushPayload = {
	ref: string;
	repository: {
		name: string;
		full_name: string;
		owner: { login: string };
	};
};

export function verifyGitHubWebhookSignature(
	rawBody: string,
	signatureHeader: string | null,
	secret: string,
): boolean {
	if (!signatureHeader?.startsWith("sha256=") || !secret) return false;

	const expected =
		"sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

	try {
		return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
	} catch {
		return false;
	}
}

export function parsePushBranch(ref: string): string | null {
	if (!ref.startsWith("refs/heads/")) return null;
	return ref.slice("refs/heads/".length);
}

export function parseGitHubPushPayload(body: unknown): GitHubPushPayload | null {
	if (!body || typeof body !== "object") return null;
	const payload = body as GitHubPushPayload;
	if (
		typeof payload.ref !== "string" ||
		!payload.repository?.owner?.login ||
		!payload.repository?.name
	) {
		return null;
	}
	return payload;
}

export type RepoSyncOutcome = {
	owner: string;
	repo: string;
	branch: string;
	workspaceIds: string[];
	results: { workspaceId: string; result: SyncResult }[];
};

/** Syncs all workspaces whose vault config matches the pushed repo + branch. */
export async function syncVaultMirrorForGitHubPush(
	owner: string,
	repo: string,
	branch: string,
): Promise<RepoSyncOutcome> {
	const normalizedBranch = normalizeVaultBranch(branch) || "main";

	const workspaces = await prisma.workspace.findMany({
		where: {
			githubSync: true,
			vaultGithubOwner: owner,
			vaultGithubRepo: repo,
		},
		select: { id: true, vaultGithubBranch: true },
	});

	const matching = workspaces.filter((ws) => {
		const wsBranch = normalizeVaultBranch(ws.vaultGithubBranch ?? "main") || "main";
		return wsBranch === normalizedBranch;
	});

	const results: { workspaceId: string; result: SyncResult }[] = [];

	for (const ws of matching) {
		const result = await syncVaultForWorkspace(ws.id);
		results.push({ workspaceId: ws.id, result });
	}

	return {
		owner,
		repo,
		branch: normalizedBranch,
		workspaceIds: matching.map((ws) => ws.id),
		results,
	};
}
