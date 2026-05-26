import { PageLoadingShell } from "@/components/loading/page-loading-shell";

export default function DashboardHomeLoading() {
	return (
		<PageLoadingShell
			breadcrumbs={[{ label: "Dashboard" }]}
			title="Dashboard"
			variant="stats"
		/>
	);
}
