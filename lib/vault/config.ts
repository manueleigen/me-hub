import { getCachedVaultConfig } from "@/lib/cache/server";

/** @deprecated Prefer getCachedVaultConfig — kept for existing imports. */
export async function getVaultConfig() {
	return getCachedVaultConfig();
}
