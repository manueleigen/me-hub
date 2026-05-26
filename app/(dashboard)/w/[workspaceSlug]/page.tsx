import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Dashboard");

export default async function WorkspaceHomePage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Dashboard" }]} />
			<div className="flex-1 overflow-auto">
				<DashboardContent workspaceSlug={workspaceSlug} />
			</div>
		</>
	);
}
