import type { SyncResult } from "./types";

const PREFIX = "[vault-sync]";

function shortUserId(userId: string): string {
	return userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;
}

function repoLabel(owner: string, repo: string, branch: string): string {
	return `${owner}/${repo}@${branch}`;
}

function shortSha(sha: string | null | undefined): string {
	if (!sha) return "—";
	return sha.length > 7 ? sha.slice(0, 7) : sha;
}

function pathSample(paths: string[], max = 5): string {
	if (paths.length === 0) return "[]";
	const sample = paths.slice(0, max);
	const suffix = paths.length > max ? `, +${paths.length - max} more` : "";
	return `[${sample.join(", ")}${suffix}]`;
}

/** Verbose path lists and sync progress; off in production unless SYNC_LOG_VERBOSE=1. */
export function isSyncLogVerbose(): boolean {
	return (
		process.env.NODE_ENV === "development" || process.env.SYNC_LOG_VERBOSE === "1"
	);
}

function formatResult(result: SyncResult): string {
	switch (result.status) {
		case "synced":
			return `status=synced updated=${result.filesUpdated} deleted=${result.filesDeleted}`;
		case "full-import":
			return `status=full-import imported=${result.imported}`;
		case "up-to-date":
			return "status=up-to-date";
		case "skipped-locked":
			return "status=skipped-locked";
		case "not-configured":
			return "status=not-configured";
		case "no-token":
			return "status=no-token";
		case "error":
			return `status=error message=${JSON.stringify(result.message)}`;
	}
}

export function logSyncTriggered(
	userId: string,
	opts: {
		initialSyncCompleted: boolean;
		owner: string;
		repo: string;
	},
): void {
	if (!isSyncLogVerbose()) return;
	console.info(
		`${PREFIX} triggered user=${shortUserId(userId)} repo=${opts.owner}/${opts.repo} initialSyncCompleted=${opts.initialSyncCompleted}`,
	);
}

export function logSyncCheck(
	userId: string,
	opts: {
		owner: string;
		repo: string;
		branch: string;
		lastSyncedSha: string | null;
		latestSha: string;
		initialSyncCompleted: boolean;
		decision:
			| "skip-not-configured"
			| "skip-no-token"
			| "skip-locked"
			| "reconcile-only"
			| "up-to-date"
			| "full-import"
			| "incremental"
			| "full-import-recovery";
	},
): void {
	const shaMatch =
		opts.initialSyncCompleted && opts.lastSyncedSha === opts.latestSha;
	if (!isSyncLogVerbose()) return;
	console.info(
		`${PREFIX} check user=${shortUserId(userId)} repo=${repoLabel(opts.owner, opts.repo, opts.branch)} lastSynced=${shortSha(opts.lastSyncedSha)} latest=${shortSha(opts.latestSha)} shaMatch=${shaMatch} initialSyncCompleted=${opts.initialSyncCompleted} → ${opts.decision}`,
	);
}

export function logSyncStart(
	userId: string,
	mode: "full-import" | "incremental" | "reconcile-orphans",
	opts: {
		owner: string;
		repo: string;
		branch: string;
		baseSha?: string | null;
		headSha?: string;
	},
): void {
	const range =
		mode === "incremental" && opts.baseSha && opts.headSha
			? ` ${shortSha(opts.baseSha)}..${shortSha(opts.headSha)}`
			: opts.headSha
				? ` @${shortSha(opts.headSha)}`
				: "";
	if (!isSyncLogVerbose()) return;
	console.info(
		`${PREFIX} start user=${shortUserId(userId)} mode=${mode} repo=${repoLabel(opts.owner, opts.repo, opts.branch)}${range}`,
	);
}

export function logSyncIncrementalDelta(
	userId: string,
	opts: {
		compareDeleted: number;
		compareFetched: number;
		orphanDeleted: number;
		deletedPaths?: string[];
		fetchedPaths?: string[];
	},
): void {
	const verbose = isSyncLogVerbose();
	if (verbose) {
		console.info(
			`${PREFIX} incremental-delta user=${shortUserId(userId)} compareDeleted=${opts.compareDeleted} compareFetched=${opts.compareFetched} orphanDeleted=${opts.orphanDeleted} totalDeleted=${opts.compareDeleted + opts.orphanDeleted}`,
		);
	}
	if (verbose && opts.deletedPaths?.length) {
		console.info(`${PREFIX} deleted-paths ${pathSample(opts.deletedPaths)}`);
	}
	if (verbose && opts.fetchedPaths?.length) {
		console.info(`${PREFIX} fetched-paths ${pathSample(opts.fetchedPaths)}`);
	}
}

export function logSyncOrphanReconcile(
	userId: string,
	orphanCount: number,
	paths?: string[],
): void {
	if (!isSyncLogVerbose()) return;
	console.info(
		`${PREFIX} orphan-reconcile user=${shortUserId(userId)} removed=${orphanCount}`,
	);
	if (paths?.length) {
		console.info(`${PREFIX} orphan-paths ${pathSample(paths)}`);
	}
}

export function logSyncComplete(
	userId: string,
	result: SyncResult,
	durationMs: number,
): void {
	if (!isSyncLogVerbose()) return;
	console.info(
		`${PREFIX} complete user=${shortUserId(userId)} ${formatResult(result)} durationMs=${durationMs}`,
	);
}

export function logSyncFailed(userId: string, error: unknown, durationMs: number): void {
	const message = error instanceof Error ? error.message : String(error);
	const dev = process.env.NODE_ENV === "development";
	const line = `${PREFIX} failed user=${shortUserId(userId)} durationMs=${durationMs} error=${message}`;
	if (dev) {
		console.error(line, error instanceof Error ? error : undefined);
	} else {
		console.error(line);
	}
}
