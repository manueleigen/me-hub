import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { generateProjectDetailMetadata } from "@/lib/page-metadata";
import { ProjectDetailContent } from "@/app/(dashboard)/projects/[slug]/project-detail-content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	return generateProjectDetailMetadata(slug);
}

export default async function WorkspaceProjectDetailPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
	const { slug } = await params;

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[{ label: "Projekte" }, { label: slug }]}
					title={slug}
					variant="detail"
				/>
			}
		>
			<ProjectDetailContent slug={slug} />
		</Suspense>
	);
}
