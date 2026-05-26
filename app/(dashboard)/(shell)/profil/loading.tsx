import { PageLoadingShell } from "@/components/loading/page-loading-shell";

export default function ProfilLoading() {
	return (
		<PageLoadingShell
			breadcrumbs={[{ label: "Profil" }]}
			title="Profil"
			variant="detail"
		/>
	);
}
