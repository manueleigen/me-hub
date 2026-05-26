import { SettingsProvider } from "@/lib/settings-context";
import { getAuthSession } from "@/lib/auth";
import { getCachedVaultUser } from "@/lib/cache/server";
import { canAccessPlatformAdmin } from "@/lib/platform-admin";
import {
	DashboardUserProvider,
	type DashboardUser,
} from "@/lib/dashboard-user-context";

/**
 * Async layout slice: session, settings, vault sync. Wrapped in Suspense so the shell renders first.
 */
export async function DashboardAuthBootstrap({
	children,
}: {
	children: React.ReactNode;
}) {
	let initialSettings = null;
	let dashboardUser: DashboardUser | null = null;

	try {
		const vaultUser = await getCachedVaultUser();
		if (vaultUser?.id) {
			initialSettings = {
				darkMode: vaultUser.darkMode,
				autoSave: vaultUser.autoSave,
			};
		}

		const session = await getAuthSession();
		if (session?.user?.id && session.user.email) {
			const role = (session.user as unknown as { role?: string | null }).role ?? null;
			const isPlatformAdmin = await canAccessPlatformAdmin(session.user.id);
			dashboardUser = {
				id: session.user.id,
				name: session.user.name ?? null,
				email: session.user.email,
				image: session.user.image,
				role,
				isPlatformAdmin,
			};
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			console.error("[dashboard] Session or vault sync failed:", error);
		} else {
			const msg = error instanceof Error ? error.message : "unknown error";
			console.error("[dashboard] Session or vault sync failed:", msg);
		}
	}

	return (
		<DashboardUserProvider user={dashboardUser}>
			<SettingsProvider initialSettings={initialSettings}>{children}</SettingsProvider>
		</DashboardUserProvider>
	);
}
