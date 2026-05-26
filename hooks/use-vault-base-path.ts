"use client";

import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-context";
import { vaultListPath, WORKSPACES_FALLBACK } from "@/lib/workspace-paths";

/** Base path for vault routes, e.g. `/w/my-hub/vault`. */
export function useVaultBasePath(): string {
	const pathname = usePathname();
	const ctx = useWorkspace();

	const fromPath = pathname.match(/^(\/w\/[^/]+\/vault)/)?.[1];
	if (fromPath) return fromPath;

	if (ctx) return vaultListPath(ctx.workspace.slug);

	return WORKSPACES_FALLBACK;
}

export function vaultItemHref(base: string, itemPath: string): string {
	return itemPath ? `${base}/${itemPath}` : base;
}
