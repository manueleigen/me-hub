import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { generateClientDetailMetadata } from "@/lib/page-metadata";
import { ClientDetailContent } from "@/app/(dashboard)/clients/[slug]/client-detail-content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	return generateClientDetailMetadata(slug);
}

export default async function WorkspaceClientDetailPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
	const { slug } = await params;

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[{ label: "Kunden" }, { label: slug }]}
					title={slug}
					variant="stats"
				/>
			}
		>
			<ClientDetailContent slug={slug} />
		</Suspense>
	);
}
