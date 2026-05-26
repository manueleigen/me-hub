import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceGithubSettingsForm } from "@/components/workspace/workspace-github-settings-form";
import { WorkspaceVaultResyncCard } from "@/components/workspace/workspace-vault-resync-card";
import { resolveWorkspaceForUser } from "@/app/actions/workspaces";
import { getWorkspaceGithubSettingsView } from "@/app/actions/workspace-settings";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Einstellungen", "GitHub Sync"]);

export default async function WorkspaceGithubSettingsPage({
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

	const githubSettings = await getWorkspaceGithubSettingsView(workspace.id);
	if (!githubSettings) notFound();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">GitHub Sync</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Repository-Verbindung und Vault-Synchronisation für alle Mitglieder.
				</p>
			</div>
			<WorkspaceGithubSettingsForm
				workspaceId={workspace.id}
				settings={githubSettings}
				canManage={canEdit}
			/>
			<WorkspaceVaultResyncCard workspaceId={workspace.id} canEdit={canEdit} />
		</div>
	);
}
