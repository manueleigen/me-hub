import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { generateIdeaDetailMetadata } from "@/lib/page-metadata";
import { IdeaDetailContent } from "@/app/(dashboard)/produkt-ideen/[categorySlug]/[slug]/idea-detail-content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ categorySlug: string; slug: string }>;
}): Promise<Metadata> {
	const { categorySlug, slug } = await params;
	return generateIdeaDetailMetadata(categorySlug, slug);
}

export default async function WorkspaceIdeaDetailPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; categorySlug: string; slug: string }>;
}) {
	const { categorySlug, slug } = await params;

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[{ label: "Produkt-Ideen" }, { label: slug }]}
					title={slug}
					variant="detail"
				/>
			}
		>
			<IdeaDetailContent categorySlug={categorySlug} slug={slug} />
		</Suspense>
	);
}
