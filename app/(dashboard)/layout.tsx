import type { Metadata } from "next";
import { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimerProvider } from "@/lib/timer-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardWorkspaceBoundary } from "@/components/layout/dashboard-workspace-boundary";
import { DashboardAuthBootstrap } from "@/components/layout/dashboard-auth-bootstrap";
import { DashboardAuthBootstrapFallback } from "@/components/layout/dashboard-auth-bootstrap-fallback";
import { createDashboardLayoutMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
	return createDashboardLayoutMetadata();
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const shell = (
		<TooltipProvider>
			<TimerProvider>
				<DashboardWorkspaceBoundary>
					<DashboardShell>{children}</DashboardShell>
				</DashboardWorkspaceBoundary>
			</TimerProvider>
		</TooltipProvider>
	);

	return (
		<Suspense fallback={<DashboardAuthBootstrapFallback>{shell}</DashboardAuthBootstrapFallback>}>
			<DashboardAuthBootstrap>{shell}</DashboardAuthBootstrap>
		</Suspense>
	);
}
