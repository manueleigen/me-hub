import type { InvitationStatus } from "@/app/generated/prisma";

export function isInvitationExpired(expiresAt: Date): boolean {
	return expiresAt < new Date();
}

export function invitationStatusError(status: InvitationStatus): string | null {
	if (status === "ACCEPTED") return "Einladung bereits verwendet.";
	if (status === "DECLINED") return "Einladung widerrufen.";
	if (status === "EXPIRED") return "Einladung abgelaufen.";
	return null;
}
