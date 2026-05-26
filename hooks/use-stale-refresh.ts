"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UseStaleRefreshOptions = {
	/** Refresh when tab becomes visible again after being hidden. Default true. */
	refreshOnFocus?: boolean;
};

/** Avoid setState when inline object props share the same nested references. */
function shouldApplyInitial<T>(prev: T, next: T): boolean {
	if (Object.is(prev, next)) return false;

	if (
		prev &&
		next &&
		typeof prev === "object" &&
		typeof next === "object" &&
		!Array.isArray(prev) &&
		!Array.isArray(next)
	) {
		const a = prev as Record<string, unknown>;
		const b = next as Record<string, unknown>;
		const keys = Object.keys(b);
		if (
			keys.length === Object.keys(a).length &&
			keys.every((key) => Object.is(a[key], b[key]))
		) {
			return false;
		}
	}

	return true;
}

/**
 * Shows server-rendered data immediately. Revalidates via router.refresh() only on
 * tab focus (after hidden) — not on a timer — to avoid doubling RSC work per visit.
 */
export function useStaleRefresh<T>(
	initial: T,
	options?: UseStaleRefreshOptions,
): {
	data: T;
	setData: React.Dispatch<React.SetStateAction<T>>;
	isRefreshing: boolean;
	refresh: () => void;
} {
	const refreshOnFocus = options?.refreshOnFocus ?? true;
	const router = useRouter();
	const [data, setData] = useState(initial);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const refreshPending = useRef(false);
	const wasHidden = useRef(false);

	useEffect(() => {
		setData((prev) => (shouldApplyInitial(prev, initial) ? initial : prev));
		if (refreshPending.current) {
			refreshPending.current = false;
			setIsRefreshing(false);
		}
	}, [initial]);

	const refresh = useCallback(() => {
		refreshPending.current = true;
		setIsRefreshing(true);
		router.refresh();
	}, [router]);

	useEffect(() => {
		if (!refreshOnFocus) return;

		const onVisibility = () => {
			if (document.visibilityState === "hidden") {
				wasHidden.current = true;
				return;
			}
			if (document.visibilityState === "visible" && wasHidden.current) {
				wasHidden.current = false;
				refresh();
			}
		};

		document.addEventListener("visibilitychange", onVisibility);
		return () => document.removeEventListener("visibilitychange", onVisibility);
	}, [refreshOnFocus, refresh]);

	return { data, setData, isRefreshing, refresh };
}
