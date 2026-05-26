"use client";

import { SyncProvider } from "@/lib/vault/sync-context";
import { VaultEditorGuardProvider } from "@/lib/vault/editor-guard-context";

/** GitHub write tracking + navigation background-save (wraps full dashboard chrome). */
export function DashboardOperationProviders({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SyncProvider>
			<VaultEditorGuardProvider>{children}</VaultEditorGuardProvider>
		</SyncProvider>
	);
}
