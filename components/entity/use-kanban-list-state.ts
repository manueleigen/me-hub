"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import { useStaleRefresh } from "@/hooks/use-stale-refresh";
import { useVaultSync } from "@/lib/vault/sync-ui-context";
import { useSync } from "@/lib/vault/sync-context";

export type KanbanPersistenceContext<T> = {
	previous?: T;
	oldKey?: string | null;
};

export type UseKanbanListStateConfig<T> = {
	initialItems: T[];
	getItemKey: (item: T) => string;
	getItemSha: (item: T) => string | undefined;
	isDraftItem: (item: T) => boolean;
	shouldSyncDetailTarget: (
		current: T | undefined,
		next: T,
	) => boolean;
	upsertItems: (
		items: T[],
		optimistic: T,
		context: KanbanPersistenceContext<T>,
	) => T[];
	findPreviousItem: (
		items: T[],
		optimistic: T,
		context: KanbanPersistenceContext<T>,
	) => T | undefined;
	persistItem: (
		optimistic: T,
		context: KanbanPersistenceContext<T>,
	) => Promise<T | void>;
	deleteItem: (item: T) => Promise<void>;
	updateItemStatus: (item: T, status: string) => Promise<void>;
	applyStatus: (item: T, status: string) => T;
	deleteConfirmMessage?: string;
};

export function useKanbanListState<T>({
	initialItems,
	getItemKey,
	getItemSha,
	isDraftItem,
	shouldSyncDetailTarget,
	upsertItems,
	findPreviousItem,
	persistItem,
	deleteItem,
	updateItemStatus,
	applyStatus,
	deleteConfirmMessage = "Eintrag wirklich löschen?",
}: UseKanbanListStateConfig<T>) {
	const { requestSyncAfterWrite } = useVaultSync();
	const { startSync, endSync } = useSync();
	const { data: items, setData: setItems, isRefreshing } =
		useStaleRefresh(initialItems);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailTarget, setDetailTarget] = useState<T | undefined>();

	const syncDetailTarget = (next: T) => {
		setDetailTarget((current) =>
			shouldSyncDetailTarget(current, next) ? next : current,
		);
	};

	const resolveDetailItem = (target: T | undefined) => {
		if (!target) return undefined;
		return items.find((i) => getItemKey(i) === getItemKey(target)) ?? target;
	};

	const handleDelete = (item: T) => {
		if (!getItemSha(item)) return;
		if (!confirm(deleteConfirmMessage)) return;
		const previousItems = items;
		const key = getItemKey(item);

		setItems((prev) => prev.filter((i) => getItemKey(i) !== key));

		void (async () => {
			try {
				await deleteItem(item);
				void requestSyncAfterWrite();
			} catch {
				setItems(previousItems);
				toast.error("Fehler beim Löschen");
			}
		})();
	};

	const handleStatusChange = async (item: T, newStatus: string) => {
		if (!getItemSha(item)) return;
		const optimistic = applyStatus(item, newStatus);

		setItems((prev) =>
			prev.map((i) => (getItemKey(i) === getItemKey(item) ? optimistic : i)),
		);
		syncDetailTarget(optimistic);

		try {
			await updateItemStatus(item, newStatus);
			void requestSyncAfterWrite();
		} catch {
			setItems((prev) =>
				prev.map((i) => (getItemKey(i) === getItemKey(item) ? item : i)),
			);
			syncDetailTarget(item);
			toast.error("Fehler beim Verschieben");
			throw new Error("status update failed");
		}
	};

	const persistWithOptimistic = async (
		optimistic: T,
		context: KanbanPersistenceContext<T> = {},
	) => {
		const key = getItemKey(optimistic);
		const previous =
			context.previous ??
			findPreviousItem(items, optimistic, context);

		setItems((prev) => upsertItems(prev, optimistic, context));
		syncDetailTarget(optimistic);

		startSync();
		try {
			const saved = await persistItem(optimistic, { ...context, previous });
			if (saved) {
				setItems((prev) =>
					prev.map((i) => (getItemKey(i) === key ? saved : i)),
				);
				syncDetailTarget(saved);
			}
			void requestSyncAfterWrite();
		} catch {
			if (previous) {
				setItems((prev) => upsertItems(prev, previous, context));
				syncDetailTarget(previous);
			} else {
				setItems((prev) => prev.filter((i) => getItemKey(i) !== key));
			}
			toast.error("Fehler beim Speichern");
			throw new Error("save failed");
		} finally {
			endSync();
		}
	};

	return {
		items,
		isRefreshing,
		detailOpen,
		setDetailOpen,
		detailTarget,
		setDetailTarget,
		syncDetailTarget,
		resolveDetailItem,
		persistWithOptimistic,
		handleDelete,
		handleStatusChange,
		isDraftItem,
		isDraftSlug,
	};
}
