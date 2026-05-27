"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVaultSync } from "@/lib/vault/sync-ui-context";

/** Re-run the current route's server components after a mutation. */
export function useRevalidatePage() {
	const router = useRouter();
	const { requestSyncAfterWrite } = useVaultSync();

	return useCallback(() => {
		router.refresh();
		void requestSyncAfterWrite();
	}, [router, requestSyncAfterWrite]);
}
