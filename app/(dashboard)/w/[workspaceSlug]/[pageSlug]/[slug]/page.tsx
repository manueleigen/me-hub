import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { generateTaskDetailMetadata } from "@/lib/page-metadata";
import { TaskDetailContent } from "@/app/(dashboard)/aufgaben/[slug]/task-detail-content";
import { getTasksFolderFromPage } from "@/lib/workspace-page-data-folder";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ workspaceSlug: string; pageSlug: string; slug: string }>;
}): Promise<Metadata> {
	const { slug, pageSlug, workspaceSlug } = await params;

	const session = await getAuthSession();
	if (!session?.user?.id) return {};

	const workspacePage = await prisma.workspacePage.findFirst({
		where: {
			slug: pageSlug,
			templateKey: "aufgaben",
			isEnabled: true,
			workspace: { slug: workspaceSlug },
		},
		select: { config: true, templateKey: true },
	});

	if (!workspacePage) return {};

	const tasksFolder = getTasksFolderFromPage(
		workspacePage.config as Record<string, unknown> | null,
		workspacePage.templateKey,
	);

	return generateTaskDetailMetadata(slug, tasksFolder);
}

export default async function WorkspacePageTaskDetailPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; pageSlug: string; slug: string }>;
}) {
	const { workspaceSlug, pageSlug, slug } = await params;

	const session = await getAuthSession();
	if (!session?.user?.id) notFound();

	const workspacePage = await prisma.workspacePage.findFirst({
		where: {
			slug: pageSlug,
			templateKey: "aufgaben",
			isEnabled: true,
			workspace: { slug: workspaceSlug },
		},
		select: {
			label: true,
			config: true,
			templateKey: true,
			workspaceId: true,
		},
	});

	if (!workspacePage) notFound();

	const member = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId: workspacePage.workspaceId,
				userId: session.user.id,
			},
		},
	});
	if (!member) notFound();

	const tasksFolder = getTasksFolderFromPage(
		workspacePage.config as Record<string, unknown> | null,
		workspacePage.templateKey,
	);

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[
						{ label: workspacePage.label },
						{ label: slug },
					]}
					title={slug}
					variant="detail"
				/>
			}
		>
			<TaskDetailContent
				slug={slug}
				tasksFolder={tasksFolder}
				pageSlug={pageSlug}
				pageLabel={workspacePage.label}
			/>
		</Suspense>
	);
}
