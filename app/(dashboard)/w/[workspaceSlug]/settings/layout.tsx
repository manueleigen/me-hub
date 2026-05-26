import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { WorkspaceSettingsNav } from "@/components/workspace/settings/workspace-settings-nav";
import { resolveWorkspaceForUser } from "@/app/actions/workspaces";

export default async function WorkspaceSettingsLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	const resolved = await resolveWorkspaceForUser(workspaceSlug);

	if (!resolved) notFound();

	const { workspace, membership } = resolved;
	const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";

	return (
		<>
			<AppHeader
				breadcrumbs={[
					{ label: workspace.name, href: `/w/${workspace.slug}` },
					{ label: "Einstellungen" },
				]}
			/>
			<div className="flex flex-1 min-h-0 overflow-hidden">
				<div className="flex flex-1 min-h-0 overflow-auto p-6 gap-6">
					<WorkspaceSettingsNav workspaceSlug={workspace.slug} canEdit={canEdit} />
					<div className="flex-1 min-w-0 max-w-3xl">{children}</div>
				</div>
			</div>
		</>
	);
}
