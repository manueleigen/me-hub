"use client";

import { SettingsProvider } from "@/lib/settings-context";
import { DashboardUserProvider } from "@/lib/dashboard-user-context";

/** Instant fallback while layout auth/settings load (no DB). */
export function DashboardAuthBootstrapFallback({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DashboardUserProvider user={null}>
			<SettingsProvider initialSettings={null}>{children}</SettingsProvider>
		</DashboardUserProvider>
	);
}
