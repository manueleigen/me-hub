import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { taskDetailPath } from "@/lib/workspace-paths";

/** Legacy `/w/.../aufgaben/[slug]` → canonical page slug from workspace config. */
export default async function LegacyWorkspaceTaskDetailPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
	const { workspaceSlug, slug } = await params;

	const session = await getAuthSession();
	if (!session?.user?.id) return null;

	const page =
		(await prisma.workspacePage.findFirst({
			where: {
				workspace: { slug: workspaceSlug },
				templateKey: "aufgaben",
				isEnabled: true,
				slug: "aufgaben",
			},
			select: { slug: true },
		})) ??
		(await prisma.workspacePage.findFirst({
			where: {
				workspace: { slug: workspaceSlug },
				templateKey: "aufgaben",
				isEnabled: true,
			},
			orderBy: { order: "asc" },
			select: { slug: true },
		}));

	const pageSlug = page?.slug ?? "aufgaben";
	redirect(taskDetailPath(workspaceSlug, pageSlug, slug));
}
