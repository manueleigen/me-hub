"use client";

import { useCallback, useEffect, useRef } from "react";

/** Returns a stable callback that debounces invocations by `delayMs`. */
export function useDebouncedCallback<T extends unknown[]>(
	fn: (...args: T) => void,
	delayMs: number,
) {
	const fnRef = useRef(fn);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		fnRef.current = fn;
	}, [fn]);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	return useCallback(
		(...args: T) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				fnRef.current(...args);
			}, delayMs);
		},
		[delayMs],
	);
}
