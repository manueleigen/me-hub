"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface SyncContextValue {
	pending: number;
	lastSavedAt: number | null;
	startSync: () => void;
	endSync: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
	const [pending, setPending] = useState(0);
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

	const startSync = useCallback(() => setPending((n) => n + 1), []);
	const endSync = useCallback(() => {
		setPending((n) => Math.max(0, n - 1));
		setLastSavedAt(Date.now());
	}, []);

	// Prevent tab close while saves are in flight
	useEffect(() => {
		if (pending === 0) return;
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [pending]);

	return (
		<SyncContext.Provider value={{ pending, lastSavedAt, startSync, endSync }}>
			{children}
		</SyncContext.Provider>
	);
}

export function useSync() {
	const ctx = useContext(SyncContext);
	if (!ctx) {
		return {
			pending: 0,
			lastSavedAt: null,
			startSync: () => {},
			endSync: () => {},
		};
	}
	return ctx;
}
