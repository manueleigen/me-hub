import { revalidateTag } from "next/cache";

export const VAULT_CACHE_TAG = "vault";

export function revalidateVaultCache(userId: string): void {
	try {
		revalidateTag(VAULT_CACHE_TAG, "max");
		revalidateTag(`${VAULT_CACHE_TAG}-${userId}`, "max");
	} catch (error) {
		// Outside a Next.js request (scripts, tests) — import still succeeded.
		if (process.env.NODE_ENV === "development") {
			console.warn("[vault] revalidateTag skipped:", error);
		}
	}
}

export function revalidateWorkspaceVaultCache(workspaceId: string): void {
	try {
		revalidateTag(`${VAULT_CACHE_TAG}-ws-${workspaceId}`, "max");
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			console.warn("[vault] revalidateTag skipped:", error);
		}
	}
}
