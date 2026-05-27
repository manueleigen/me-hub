"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	checkVaultRemote,
	executeVaultSync,
	getVaultSyncSnapshot,
	getVaultSyncTick,
	type VaultSyncTick,
} from "@/app/actions/vault-sync";
import type { SyncResult, VaultRemoteCheckResult } from "@/lib/sync/types";

export type VaultSyncPhase = "idle" | "checking" | "syncing" | "success" | "error";

type VaultSyncContextValue = {
	phase: VaultSyncPhase;
	errorMessage: string | null;
	/** After GitHub write — full mirror pull, then resolves when done. */
	requestSyncAfterWrite: () => Promise<void>;
};

const VaultSyncContext = createContext<VaultSyncContextValue | null>(null);

const WEBHOOK_POLL_MS = 12_000;
const NO_WEBHOOK_POLL_MS = 30_000;
const PULL_COOLDOWN_MS = 60_000;
const SUCCESS_HIDE_MS = 2200;
const ERROR_HIDE_MS = 5000;
const CHECKING_MIN_MS = 280;
const NAV_DEBOUNCE_MS = 50;
const POLL_LOCK_MS = 500;
const MAX_LOCK_POLLS = 40;

const webhookPollEnabled =
	process.env.NEXT_PUBLIC_VAULT_WEBHOOK_ENABLED !== "false";
const EXTERNAL_SYNC_POLL_MS = webhookPollEnabled
	? WEBHOOK_POLL_MS
	: NO_WEBHOOK_POLL_MS;

function ticksEqual(a: VaultSyncTick, b: VaultSyncTick): boolean {
	return (
		a.lastSyncAt === b.lastSyncAt &&
		a.lastSyncedSha === b.lastSyncedSha &&
		a.initialSyncCompleted === b.initialSyncCompleted
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function resultToPhase(result: SyncResult): VaultSyncPhase {
	if (result.status === "error") return "error";
	if (result.status === "not-configured" || result.status === "no-token") {
		return "idle";
	}
	return "success";
}

function checkNeedsPull(check: VaultRemoteCheckResult): boolean {
	return check.status === "needs-sync";
}

type VaultSyncProviderProps = {
	baseline: VaultSyncTick | null;
	children: ReactNode;
};

export function VaultSyncProvider({ baseline, children }: VaultSyncProviderProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [phase, setPhase] = useState<VaultSyncPhase>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const enabled = baseline !== null;
	const baselineRef = useRef(baseline);
	const inFlightRef = useRef(false);
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wasHiddenRef = useRef(false);
	const lastKnownErrorRef = useRef<string | null>(null);
	const lastPullAtRef = useRef(0);
	const isFirstNavRef = useRef(true);

	const clearHideTimer = useCallback(() => {
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
	}, []);

	const scheduleHide = useCallback(
		(nextPhase: "success" | "idle", delayMs: number) => {
			clearHideTimer();
			hideTimerRef.current = setTimeout(() => {
				setPhase(nextPhase);
				if (nextPhase === "idle") setErrorMessage(null);
			}, delayMs);
		},
		[clearHideTimer],
	);

	const refreshIfTickChanged = useCallback(async (): Promise<boolean> => {
		if (!enabled || !baselineRef.current) return false;
		const current = await getVaultSyncTick();
		if (!current || ticksEqual(baselineRef.current, current)) return false;
		baselineRef.current = current;
		router.refresh();
		return true;
	}, [enabled, router]);

	const applyExternalTickUpdate = useCallback(
		(current: VaultSyncTick, source: string) => {
			if (!baselineRef.current || ticksEqual(baselineRef.current, current)) {
				return false;
			}
			baselineRef.current = current;
			if (process.env.NODE_ENV === "development") {
				console.info(`[vault-sync] ui-external-update source=${source}`);
			}
			router.refresh();
			clearHideTimer();
			setPhase("success");
			scheduleHide("idle", SUCCESS_HIDE_MS);
			return true;
		},
		[router, clearHideTimer, scheduleHide],
	);

	const waitForLockRelease = useCallback(async (): Promise<void> => {
		for (let i = 0; i < MAX_LOCK_POLLS; i += 1) {
			const snapshot = await getVaultSyncSnapshot();
			if (!snapshot?.status.inProgress) return;
			await sleep(POLL_LOCK_MS);
		}
	}, []);

	const canRunPull = useCallback((bypassCooldown: boolean): boolean => {
		if (bypassCooldown) return true;
		return Date.now() - lastPullAtRef.current >= PULL_COOLDOWN_MS;
	}, []);

	const runPull = useCallback(
		async (reason: string, options?: { bypassCooldown?: boolean }) => {
			if (!enabled || inFlightRef.current) return;

			const bypassCooldown = options?.bypassCooldown ?? false;
			if (!canRunPull(bypassCooldown)) {
				if (process.env.NODE_ENV === "development") {
					console.info(`[vault-sync] ui-pull skipped reason=${reason} (cooldown)`);
				}
				return;
			}

			inFlightRef.current = true;
			clearHideTimer();
			setErrorMessage(null);
			setPhase("syncing");

			const syncingStarted = Date.now();

			try {
				if (process.env.NODE_ENV === "development") {
					console.info(`[vault-sync] ui-pull reason=${reason}`);
				}

				let result = await executeVaultSync();

				if (result?.status === "skipped-locked") {
					await waitForLockRelease();
					result = await executeVaultSync();
				}

				lastPullAtRef.current = Date.now();

				const syncingElapsed = Date.now() - syncingStarted;
				if (syncingElapsed < CHECKING_MIN_MS) {
					await sleep(CHECKING_MIN_MS - syncingElapsed);
				}

				if (!result) {
					setPhase("idle");
					return;
				}

				if (result.status === "error") {
					setErrorMessage(result.message);
					setPhase("error");
					scheduleHide("idle", ERROR_HIDE_MS);
					return;
				}

				const nextPhase = resultToPhase(result);
				if (nextPhase === "idle") {
					setPhase("idle");
					return;
				}

				if (
					result.status === "synced" ||
					result.status === "full-import" ||
					result.status === "up-to-date"
				) {
					await refreshIfTickChanged();
				}

				setPhase("success");
				scheduleHide("idle", SUCCESS_HIDE_MS);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				setErrorMessage(message);
				setPhase("error");
				scheduleHide("idle", ERROR_HIDE_MS);
			} finally {
				inFlightRef.current = false;
			}
		},
		[
			enabled,
			canRunPull,
			clearHideTimer,
			waitForLockRelease,
			refreshIfTickChanged,
			scheduleHide,
		],
	);

	const runFocusCheck = useCallback(async () => {
		if (!enabled || inFlightRef.current) return;

		inFlightRef.current = true;
		clearHideTimer();
		setErrorMessage(null);
		setPhase("checking");

		const checkingStarted = Date.now();

		try {
			if (process.env.NODE_ENV === "development") {
				console.info("[vault-sync] ui-check reason=focus");
			}

			const check = await checkVaultRemote();

			const checkingElapsed = Date.now() - checkingStarted;
			if (checkingElapsed < CHECKING_MIN_MS) {
				await sleep(CHECKING_MIN_MS - checkingElapsed);
			}

			if (!check) {
				setPhase("idle");
				return;
			}

			if (check.status === "error") {
				setErrorMessage(check.message);
				setPhase("error");
				scheduleHide("idle", ERROR_HIDE_MS);
				return;
			}

			if (check.status === "not-configured" || check.status === "no-token") {
				setPhase("idle");
				return;
			}

			if (check.status === "up-to-date") {
				setPhase("success");
				scheduleHide("idle", SUCCESS_HIDE_MS);
				return;
			}

			if (check.status === "in-progress") {
				setPhase("syncing");
				return;
			}

			if (checkNeedsPull(check)) {
				inFlightRef.current = false;
				await runPull("focus");
				return;
			}

			setPhase("idle");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			setErrorMessage(message);
			setPhase("error");
			scheduleHide("idle", ERROR_HIDE_MS);
		} finally {
			inFlightRef.current = false;
		}
	}, [enabled, clearHideTimer, scheduleHide, runPull]);

	const requestSyncAfterWrite = useCallback(() => {
		return runPull("write", { bypassCooldown: true });
	}, [runPull]);

	useEffect(() => {
		baselineRef.current = baseline;
	}, [baseline]);

	// Navigation: RSC refresh only (mirror already in Postgres)
	useEffect(() => {
		if (!enabled) return;
		if (isFirstNavRef.current) {
			isFirstNavRef.current = false;
			return;
		}
		if (navTimerRef.current) clearTimeout(navTimerRef.current);
		navTimerRef.current = setTimeout(() => {
			router.refresh();
		}, NAV_DEBOUNCE_MS);
		return () => {
			if (navTimerRef.current) clearTimeout(navTimerRef.current);
		};
	}, [pathname, enabled, router]);

	// Tab visible again after hidden — check branch tip, pull only if needed
	useEffect(() => {
		if (!enabled) return;

		const onVisibility = () => {
			if (document.visibilityState === "hidden") {
				wasHiddenRef.current = true;
				return;
			}
			if (document.visibilityState === "visible" && wasHiddenRef.current) {
				wasHiddenRef.current = false;
				void runFocusCheck();
			}
		};

		document.addEventListener("visibilitychange", onVisibility);
		return () => document.removeEventListener("visibilitychange", onVisibility);
	}, [enabled, runFocusCheck]);

	// Webhook / smee: detect background sync via DB snapshot (no client pull)
	useEffect(() => {
		if (!enabled) return;

		const pollExternalSync = async () => {
			if (document.visibilityState !== "visible") return;
			if (inFlightRef.current) return;
			if (
				Date.now() - lastPullAtRef.current < PULL_COOLDOWN_MS &&
				lastPullAtRef.current > 0
			) {
				return;
			}
			if (!baselineRef.current) return;

			const snapshot = await getVaultSyncSnapshot();
			if (!snapshot) return;

			const { status, tick } = snapshot;

			if (status.lastSyncError && status.lastSyncError !== lastKnownErrorRef.current) {
				lastKnownErrorRef.current = status.lastSyncError;
				clearHideTimer();
				setErrorMessage(status.lastSyncError);
				setPhase("error");
				scheduleHide("idle", ERROR_HIDE_MS);
				return;
			}

			if (!status.lastSyncError) {
				lastKnownErrorRef.current = null;
			}

			if (status.inProgress) {
				clearHideTimer();
				setPhase("syncing");
				return;
			}

			applyExternalTickUpdate(tick, "webhook-poll");
		};

		const intervalId = window.setInterval(() => {
			void pollExternalSync();
		}, EXTERNAL_SYNC_POLL_MS);

		const immediateId = window.setTimeout(() => {
			void pollExternalSync();
		}, 600);

		return () => {
			window.clearInterval(intervalId);
			window.clearTimeout(immediateId);
		};
	}, [enabled, applyExternalTickUpdate, clearHideTimer, scheduleHide]);

	useEffect(() => () => clearHideTimer(), [clearHideTimer]);

	const value: VaultSyncContextValue = {
		phase,
		errorMessage,
		requestSyncAfterWrite,
	};

	return (
		<VaultSyncContext.Provider value={value}>{children}</VaultSyncContext.Provider>
	);
}

export function useVaultSync(): VaultSyncContextValue {
	const ctx = useContext(VaultSyncContext);
	if (!ctx) {
		return {
			phase: "idle",
			errorMessage: null,
			requestSyncAfterWrite: async () => {},
		};
	}
	return ctx;
}
