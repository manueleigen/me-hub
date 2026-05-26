import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { VaultSetupBanner } from "@/components/layout/vault-setup-banner";
import { DashboardOperationProviders } from "@/components/layout/dashboard-operation-providers";

/** Shared dashboard chrome: sidebar + main inset for all (dashboard) routes. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
	return (
		<DashboardOperationProviders>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<VaultSetupBanner />
					{children}
				</SidebarInset>
			</SidebarProvider>
		</DashboardOperationProviders>
	);
}
