import { prisma } from "@/lib/prisma";
import { invitationStatusError, isInvitationExpired } from "@/lib/invitation-utils";

export type FulfillWorkspaceInvitationResult = {
	success: boolean;
	workspaceSlug?: string;
	workspaceId?: string;
	error?: string;
};

/**
 * Adds a user to a workspace from an invite token and marks the invite accepted.
 * Server-only helper — not a server action (must not accept arbitrary userId from clients).
 */
export async function fulfillWorkspaceInvitationForUser(
	token: string,
	userId: string,
): Promise<FulfillWorkspaceInvitationResult> {
	const invitation = await prisma.workspaceInvitation.findUnique({
		where: { token },
		include: { workspace: { select: { id: true, slug: true, name: true } } },
	});

	if (!invitation) return { success: false, error: "Einladung nicht gefunden." };

	const existing = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
		},
	});

	if (existing) {
		return {
			success: true,
			workspaceSlug: invitation.workspace.slug,
			workspaceId: invitation.workspace.id,
		};
	}

	const statusError = invitationStatusError(invitation.status);
	if (statusError) return { success: false, error: statusError };

	if (isInvitationExpired(invitation.expiresAt)) {
		await prisma.workspaceInvitation.update({
			where: { id: invitation.id },
			data: { status: "EXPIRED" },
		});
		return { success: false, error: "Einladung abgelaufen." };
	}

	await prisma.workspaceMember.create({
		data: {
			workspaceId: invitation.workspaceId,
			userId,
			role: invitation.role,
		},
	});

	await prisma.workspaceInvitation.update({
		where: { id: invitation.id },
		data: { status: "ACCEPTED" },
	});

	if (prisma.userWorkspacePreference) {
		await prisma.userWorkspacePreference.upsert({
			where: { userId },
			update: { activeWorkspaceId: invitation.workspaceId },
			create: { userId, activeWorkspaceId: invitation.workspaceId },
		});
	}

	return {
		success: true,
		workspaceSlug: invitation.workspace.slug,
		workspaceId: invitation.workspace.id,
	};
}
