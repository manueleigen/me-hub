"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
	runBackgroundSave,
	type BackgroundSaveOptions,
} from "@/lib/background-save";
import { useSync } from "@/lib/vault/sync-context";

/**
 * Fire-and-forget save with global status indicator (no success toast by default).
 * Call from close handlers / navigation — safe after unmount if `save` has no setState.
 */
export function useBackgroundSave() {
	const { startSync, endSync } = useSync();

	return useCallback(
		(save: () => Promise<void>, options?: BackgroundSaveOptions) => {
			startSync();
			runBackgroundSave(
				async () => {
					try {
						await save();
					} finally {
						endSync();
					}
				},
				{
					...options,
					successMessage: options?.successMessage,
					errorMessage:
						options?.errorMessage ??
						"Speichern fehlgeschlagen – bitte erneut versuchen",
				},
			);
		},
		[startSync, endSync],
	);
}
