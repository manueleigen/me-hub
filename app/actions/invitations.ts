"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { requirePlatformPermission } from "@/lib/platform-admin";
import { invitationStatusError, isInvitationExpired } from "@/lib/invitation-utils";
import { fulfillWorkspaceInvitationForUser } from "@/lib/invitations/fulfill-workspace-invitation";

async function requireInvitationAdmin() {
	return requirePlatformPermission("invitation.create");
}

// ── App Invitations (admin-only) ───────────────────────────────────────────────

/** Platform invite — email optional; open links are single-use (first GitHub signup wins). */
export async function createAppInvitation(email?: string) {
	const userId = await requireInvitationAdmin();

	const invitation = await prisma.appInvitation.create({
		data: {
			email: email?.trim() || null,
			createdById: userId,
			status: "PENDING",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
	});

	revalidatePath("/admin/invitations");
	return invitation.token;
}

export async function revokeAppInvitation(id: string) {
	await requireInvitationAdmin();
	await prisma.appInvitation.update({
		where: { id },
		data: { status: "DECLINED" },
	});
	revalidatePath("/admin/invitations");
}

export async function listAppInvitations() {
	await requireInvitationAdmin();
	return prisma.appInvitation.findMany({
		orderBy: { createdAt: "desc" },
		include: { createdBy: { select: { name: true, email: true } } },
	});
}

export type AppInvitationValidation =
	| { valid: true; email: string | null; expiresAt: Date }
	| { valid: false; error: string };

export async function validateAppInvitationToken(
	token: string,
): Promise<AppInvitationValidation> {
	const invitation = await prisma.appInvitation.findUnique({ where: { token } });

	if (!invitation) {
		return { valid: false, error: "Einladung nicht gefunden." };
	}

	const statusError = invitationStatusError(invitation.status);
	if (statusError) return { valid: false, error: statusError };

	if (isInvitationExpired(invitation.expiresAt)) {
		await prisma.appInvitation.update({
			where: { id: invitation.id },
			data: { status: "EXPIRED" },
		});
		return { valid: false, error: "Einladung abgelaufen." };
	}

	return { valid: true, email: invitation.email, expiresAt: invitation.expiresAt };
}

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

// ── Workspace invitations ─────────────────────────────────────────────────────

export type WorkspaceInvitationValidation =
	| {
			valid: true;
			workspaceName: string;
			workspaceSlug: string;
			role: string;
			allowsSignup: boolean;
			expiresAt: Date;
	  }
	| { valid: false; error: string };

export async function validateWorkspaceInvitationToken(
	token: string,
): Promise<WorkspaceInvitationValidation> {
	const invitation = await prisma.workspaceInvitation.findUnique({
		where: { token },
		include: { workspace: { select: { name: true, slug: true } } },
	});

	if (!invitation) {
		return { valid: false, error: "Einladung nicht gefunden." };
	}

	const statusError = invitationStatusError(invitation.status);
	if (statusError) return { valid: false, error: statusError };

	if (isInvitationExpired(invitation.expiresAt)) {
		await prisma.workspaceInvitation.update({
			where: { id: invitation.id },
			data: { status: "EXPIRED" },
		});
		return { valid: false, error: "Einladung abgelaufen." };
	}

	return {
		valid: true,
		workspaceName: invitation.workspace.name,
		workspaceSlug: invitation.workspace.slug,
		role: invitation.role,
		allowsSignup: invitation.allowsSignup,
		expiresAt: invitation.expiresAt,
	};
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

/** Validates + accepts a workspace invitation for the current session user. */
export async function acceptWorkspaceInvitation(token: string): Promise<{
	success: boolean;
	workspaceSlug?: string;
	error?: string;
}> {
	const session = await getAuthSession();
	if (!session?.user?.id) return { success: false, error: "Not authenticated" };

	return fulfillWorkspaceInvitationForUser(token, session.user.id);
}
