import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspacePagesManager } from "@/components/workspace/workspace-pages-manager";
import { resolveWorkspaceForUser } from "@/app/actions/workspaces";
import { prisma } from "@/lib/prisma";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Einstellungen", "Seiten"]);

export default async function WorkspacePagesSettingsPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	const resolved = await resolveWorkspaceForUser(workspaceSlug);
	if (!resolved) notFound();

	const { workspace, membership } = resolved;
	const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";

	const [allPages, navSections] = await Promise.all([
		prisma.workspacePage.findMany({
			where: { workspaceId: workspace.id },
			orderBy: { order: "asc" },
		}),
		prisma.workspaceNavSection.findMany({
			where: { workspaceId: workspace.id },
			orderBy: { order: "asc" },
		}),
	]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Seiten</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Sidebar-Bereiche, Seitenarten und Datenordner verwalten. Eine Seitenart kann mehrfach
					verwendet werden.
				</p>
			</div>
			<WorkspacePagesManager
				workspaceId={workspace.id}
				workspaceSlug={workspace.slug}
				sections={navSections.map((s) => ({
					id: s.id,
					title: s.title,
					order: s.order,
				}))}
				pages={allPages.map((p) => ({
					id: p.id,
					templateKey: p.templateKey,
					slug: p.slug,
					label: p.label,
					icon: p.icon,
					order: p.order,
					isEnabled: p.isEnabled,
					navSectionId: p.navSectionId,
					config: (p.config as Record<string, unknown> | null) ?? null,
				}))}
				canEdit={canEdit}
			/>
		</div>
	);
}
