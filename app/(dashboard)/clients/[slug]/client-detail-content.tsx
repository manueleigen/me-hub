import { notFound } from "next/navigation";
import { loadClientDetailPageData } from "@/lib/mirror/page-loaders";
import { ClientDetailView } from "@/components/clients/client-detail-view";

export async function ClientDetailContent({
	slug,
}: {
	slug: string;
}) {
	const data = await loadClientDetailPageData(slug);
	if (!data) notFound();

	return (
		<ClientDetailView
			client={data.client}
			projects={data.projects}
			timeEntries={data.timeEntries}
		/>
	);
}
