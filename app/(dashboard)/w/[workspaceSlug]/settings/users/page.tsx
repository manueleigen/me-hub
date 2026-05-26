import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceMembersManager } from "@/components/workspace/workspace-members-manager";
import { resolveWorkspaceForUser } from "@/app/actions/workspaces";
import { getWorkspaceInviteCapabilities } from "@/app/actions/workspace-settings";
import { prisma } from "@/lib/prisma";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Einstellungen", "Nutzer"]);

export default async function WorkspaceUsersSettingsPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	const resolved = await resolveWorkspaceForUser(workspaceSlug);
	if (!resolved) notFound();

	const { workspace, membership } = resolved;
	const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";

	const [members, pendingInvitations, inviteCapabilities] = await Promise.all([
		prisma.workspaceMember.findMany({
			where: { workspaceId: workspace.id },
			include: { user: { select: { id: true, name: true, email: true, image: true } } },
			orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
		}),
		canEdit
			? prisma.workspaceInvitation.findMany({
					where: {
						workspaceId: workspace.id,
						status: "PENDING",
						expiresAt: { gt: new Date() },
					},
					orderBy: { createdAt: "desc" },
					include: {
						invitedBy: { select: { name: true, email: true } },
					},
				})
			: Promise.resolve([]),
		canEdit
			? getWorkspaceInviteCapabilities(workspace.id)
			: Promise.resolve({
					canCreateMemberLink: false,
					canCreateSignupLink: false,
				}),
	]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Nutzer</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					{canEdit
						? "Übersicht aller Nutzer mit Zugriff. Lade weitere per Einladungslink ein."
						: "Alle Nutzer mit Zugriff auf diesen Workspace."}
				</p>
			</div>
			<WorkspaceMembersManager
				workspaceId={workspace.id}
				workspaceSlug={workspace.slug}
				members={members.map((m) => ({
					userId: m.userId,
					name: m.user.name,
					email: m.user.email,
					image: m.user.image,
					role: m.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
					joinedAt: m.joinedAt.toISOString(),
				}))}
				currentUserRole={membership.role}
				canManage={canEdit}
				pendingInvitations={pendingInvitations.map((inv) => ({
					id: inv.id,
					token: inv.token,
					role: inv.role,
					allowsSignup: inv.allowsSignup,
					email: inv.email,
					expiresAt: inv.expiresAt.toISOString(),
					createdAt: inv.createdAt.toISOString(),
					invitedBy: inv.invitedBy.name ?? inv.invitedBy.email ?? "Unbekannt",
				}))}
				canCreateMemberLink={inviteCapabilities.canCreateMemberLink}
				canCreateSignupLink={inviteCapabilities.canCreateSignupLink}
			/>
		</div>
	);
}
