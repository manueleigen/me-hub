import { toast } from "sonner";

export type BackgroundSaveOptions = {
	/** Omit for indicator-only feedback (preferred). */
	successMessage?: string;
	errorMessage?: string;
};

/**
 * Low-level fire-and-forget save. Prefer `useBackgroundSave()` in React components
 * so the global status indicator (`AppStatusIndicator`) updates via `SyncProvider`.
 *
 * Rules:
 * - Capture form/editor state synchronously before navigation or close.
 * - The `save` fn may call server actions; avoid `setState` after unmount.
 * - Success: rely on top-right indicator unless `successMessage` is set.
 */
export function runBackgroundSave(
	save: () => Promise<void>,
	options?: BackgroundSaveOptions,
): void {
	void (async () => {
		try {
			await save();
			if (options?.successMessage) {
				toast.success(options.successMessage);
			}
		} catch {
			toast.error(
				options?.errorMessage ?? "Speichern fehlgeschlagen – bitte erneut versuchen",
			);
		}
	})();
}
