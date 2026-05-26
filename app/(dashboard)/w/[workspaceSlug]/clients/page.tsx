import type { Metadata } from "next";
import { Suspense } from "react";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Kunden");
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { ClientsPageContent } from "@/app/(dashboard)/clients/clients-page-content";

export default function WorkspaceClientsPage() {
	return (
		<Suspense
			fallback={
				<PageLoadingShell breadcrumbs={[{ label: "Kunden" }]} title="Kunden" variant="grid" />
			}
		>
			<ClientsPageContent />
		</Suspense>
	);
}
