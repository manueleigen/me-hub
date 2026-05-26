import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { generateTaskDetailMetadata } from "@/lib/page-metadata";
import { TaskDetailContent } from "@/app/(dashboard)/aufgaben/[slug]/task-detail-content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	return generateTaskDetailMetadata(slug);
}

export default async function WorkspaceTaskDetailPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
	const { slug } = await params;

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[{ label: "Aufgaben" }, { label: slug }]}
					title={slug}
					variant="detail"
				/>
			}
		>
			<TaskDetailContent slug={slug} />
		</Suspense>
	);
}
