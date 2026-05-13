import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/lib/settings-context";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SettingsProvider>
			<TooltipProvider>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>{children}</SidebarInset>
				</SidebarProvider>
			</TooltipProvider>
		</SettingsProvider>
	);
}
