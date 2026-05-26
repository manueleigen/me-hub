import { prisma } from "@/lib/prisma";
import { isInvitationExpired } from "@/lib/invitation-utils";

/** Used by auth hook — token from OAuth callbackURL or email-bound invite. */
export async function resolveAppInvitationForNewUser(
	email: string | null | undefined,
	inviteToken?: string,
) {
	if (inviteToken) {
		const byToken = await prisma.appInvitation.findUnique({ where: { token: inviteToken } });
		if (
			byToken &&
			byToken.status === "PENDING" &&
			!isInvitationExpired(byToken.expiresAt)
		) {
			return byToken;
		}
	}

	if (!email?.trim()) return null;

	return prisma.appInvitation.findFirst({
		where: {
			email: { equals: email.trim(), mode: "insensitive" },
			status: "PENDING",
			expiresAt: { gt: new Date() },
		},
	});
}

/** Used by auth hook — only signup-enabled workspace invites may register new users. */
export async function resolveWorkspaceInvitationForNewUser(token: string) {
	const invitation = await prisma.workspaceInvitation.findUnique({ where: { token } });
	if (!invitation) return null;
	if (!invitation.allowsSignup) return null;
	if (invitation.status !== "PENDING") return null;
	if (isInvitationExpired(invitation.expiresAt)) {
		await prisma.workspaceInvitation.update({
			where: { id: invitation.id },
			data: { status: "EXPIRED" },
		});
		return null;
	}
	return invitation;
}
