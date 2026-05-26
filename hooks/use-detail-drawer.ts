"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBackgroundSave } from "@/hooks/use-background-save";

export type UseDetailDrawerOptions<TSnapshot> = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** When this changes while open, baseline resets (e.g. record slug). */
	resetDep: unknown;
	getSnapshot: () => TSnapshot;
	buildInitialSnapshot: () => TSnapshot;
	isDirtyCompare: (current: TSnapshot, baseline: TSnapshot) => boolean;
	validate?: () => string | null;
	onSave: (snapshot: TSnapshot) => Promise<void>;
	saveEnabled?: boolean;
	/** Called after explicit “Speichern” completed (dirty save only). */
	afterSuccessfulPersistStay?: () => void;
};

export function useDetailDrawer<TSnapshot>({
	open,
	onOpenChange,
	resetDep,
	getSnapshot,
	buildInitialSnapshot,
	isDirtyCompare,
	validate,
	onSave,
	saveEnabled = true,
	afterSuccessfulPersistStay,
}: UseDetailDrawerOptions<TSnapshot>) {
	const runBackgroundSave = useBackgroundSave();
	const baselineRef = useRef<TSnapshot | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		baselineRef.current = buildInitialSnapshot();
	}, [open, resetDep, buildInitialSnapshot]);

	const isDirty = useCallback(() => {
		const baseline = baselineRef.current;
		if (!baseline) return false;
		return isDirtyCompare(getSnapshot(), baseline);
	}, [getSnapshot, isDirtyCompare]);

	const applySavedBaseline = useCallback(() => {
		baselineRef.current = getSnapshot();
	}, [getSnapshot]);

	const persistAndStay = useCallback(async (): Promise<boolean> => {
		if (!saveEnabled) {
			toast.error("Speichern nicht möglich");
			return false;
		}
		const validationError = validate?.();
		if (validationError) {
			toast.error(validationError);
			return false;
		}
		if (!isDirty()) return true;

		setSaving(true);
		try {
			await onSave(getSnapshot());
			applySavedBaseline();
			afterSuccessfulPersistStay?.();
			return true;
		} catch {
			return false;
		} finally {
			setSaving(false);
		}
	}, [
		saveEnabled,
		validate,
		isDirty,
		onSave,
		getSnapshot,
		applySavedBaseline,
		afterSuccessfulPersistStay,
	]);

	const closeAndSaveInBackground = useCallback(() => {
		const validationError = validate?.();
		if (isDirty() && saveEnabled && validationError) {
			toast.error(validationError);
		}

		onOpenChange(false);

		if (!saveEnabled || !isDirty() || validationError) return;

		const snapshot = getSnapshot();
		runBackgroundSave(() => onSave(snapshot));
	}, [
		validate,
		isDirty,
		saveEnabled,
		onOpenChange,
		getSnapshot,
		runBackgroundSave,
		onSave,
	]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (nextOpen) {
				onOpenChange(true);
				return;
			}
			if (open) closeAndSaveInBackground();
		},
		[open, onOpenChange, closeAndSaveInBackground],
	);

	return {
		saving,
		isDirty,
		persistAndStay,
		closeAndSaveInBackground,
		handleOpenChange,
		applySavedBaseline,
	};
}
