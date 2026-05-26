"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import { useStaleRefresh } from "@/hooks/use-stale-refresh";
import { useVaultSync } from "@/lib/vault/sync-ui-context";
import { useSync } from "@/lib/vault/sync-context";

export type UseCatalogListStateConfig<T> = {
	initialItems: T[];
	getItemKey: (item: T) => string;
	getItemSha: (item: T) => string | undefined;
	shouldSyncDetailTarget: (
		current: T | undefined,
		next: T,
	) => boolean;
	upsertItems: (items: T[], optimistic: T, isUpdate: boolean) => T[];
	findPreviousItem: (items: T[], key: string) => T | undefined;
	persistItem: (optimistic: T, sha?: string) => Promise<void>;
	deleteItem: (item: T) => Promise<void>;
	deleteConfirmMessage?: string;
};

export function useCatalogListState<T>({
	initialItems,
	getItemKey,
	getItemSha,
	shouldSyncDetailTarget,
	upsertItems,
	findPreviousItem,
	persistItem,
	deleteItem,
	deleteConfirmMessage = "Eintrag wirklich löschen?",
}: UseCatalogListStateConfig<T>) {
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

	const persistWithOptimistic = async (optimistic: T, sha?: string) => {
		const key = getItemKey(optimistic);
		const isUpdate = Boolean(sha) || items.some((i) => getItemKey(i) === key);
		const previous = findPreviousItem(items, key);

		setItems((prev) => upsertItems(prev, optimistic, isUpdate));
		syncDetailTarget(optimistic);

		startSync();
		try {
			await persistItem(optimistic, sha);
			void requestSyncAfterWrite();
		} catch {
			if (previous) {
				setItems((prev) => upsertItems(prev, previous, true));
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

	return {
		items,
		isRefreshing,
		detailOpen,
		setDetailOpen,
		detailTarget,
		setDetailTarget,
		resolveDetailItem,
		persistWithOptimistic,
		handleDelete,
	};
}
