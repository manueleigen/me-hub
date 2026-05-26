import { prisma } from "@/lib/prisma";
import { isInvitationExpired } from "@/lib/invitation-utils";

/**
 * Marks a platform app invitation as used (OAuth signup).
 * Lives in lib/ — do not expose as a public server action callable from the client.
 */
export async function acceptAppInvitationByToken(token: string) {
	const invitation = await prisma.appInvitation.findUnique({ where: { token } });
	if (!invitation || invitation.status !== "PENDING" || isInvitationExpired(invitation.expiresAt)) {
		return null;
	}

	await prisma.appInvitation.update({
		where: { id: invitation.id },
		data: { status: "ACCEPTED" },
	});
	return invitation;
}
