import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { resolveWorkspaceForUser } from "@/app/actions/workspaces";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Einstellungen", "Allgemein"]);

export default async function WorkspaceGeneralSettingsPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	const resolved = await resolveWorkspaceForUser(workspaceSlug);
	if (!resolved) notFound();

	const { workspace, membership } = resolved;
	const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Allgemein</h1>
				<p className="text-muted-foreground mt-1 text-sm">Name und grundlegende Workspace-Einstellungen.</p>
			</div>
			<WorkspaceSettingsForm workspaceId={workspace.id} name={workspace.name} canEdit={canEdit} />
		</div>
	);
}
