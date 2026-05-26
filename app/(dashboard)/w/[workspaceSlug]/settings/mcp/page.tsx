import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceMcpSettingsCard } from "@/components/workspace/workspace-mcp-settings-card";
import { resolveWorkspaceForUser } from "@/app/actions/workspaces";
import { getWorkspaceMcpSettingsView } from "@/app/actions/workspace-settings";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Einstellungen", "MCP-Konfiguration"]);

export default async function WorkspaceMcpSettingsPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	const resolved = await resolveWorkspaceForUser(workspaceSlug);
	if (!resolved) notFound();

	const { workspace, membership } = resolved;
	const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";
	if (!canEdit) redirect(`/w/${workspace.slug}/settings/general`);

	const mcpSettings = await getWorkspaceMcpSettingsView(workspace.id);
	if (!mcpSettings) notFound();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">MCP-Konfiguration</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					API-Schlüssel und Claude-Desktop-Anbindung für diesen Workspace.
				</p>
			</div>
			<WorkspaceMcpSettingsCard
				workspaceId={workspace.id}
				settings={mcpSettings}
				canManage={canEdit}
			/>
		</div>
	);
}
