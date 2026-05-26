import { getVaultSyncTick } from "@/app/actions/vault-sync";
import { VaultSyncProvider } from "@/lib/vault/sync-ui-context";
import { AppStatusIndicator } from "@/components/layout/app-status-indicator";

/**
 * Re-renders on every client navigation (unlike layout.tsx).
 * Vault mirror sync + unified status indicator (needs fresh sync tick).
 */
export default async function DashboardTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	const syncTick = await getVaultSyncTick();

	return (
		<VaultSyncProvider baseline={syncTick}>
			{children}
			<AppStatusIndicator />
		</VaultSyncProvider>
	);
}
