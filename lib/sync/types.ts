export type SyncResult =
	| { status: "not-configured" }
	| { status: "no-token" }
	| { status: "skipped-locked" }
	| { status: "up-to-date" }
	| { status: "full-import"; imported: number }
	| { status: "synced"; filesUpdated: number; filesDeleted: number }
	| { status: "error"; message: string };

/** Lightweight remote check (branch tip only, no mirror pull). */
export type VaultRemoteCheckResult =
	| { status: "not-configured" }
	| { status: "no-token" }
	| { status: "in-progress" }
	| { status: "up-to-date" }
	| { status: "needs-sync" }
	| { status: "error"; message: string };

export type SyncVaultOptions = {
	/** When false and SHAs match, skip orphan tree reconcile (check-only path). Default true. */
	reconcileOrphans?: boolean;
};
