"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { getAuthSession } from "@/lib/auth";
import { encryptGithubToken } from "@/lib/github/encrypt-token";
import { generateMcpApiKey } from "@/lib/mcp/api-key";
import { getMcpEndpointUrl } from "@/lib/mcp/urls";
import { workspaceHasStoredGithubToken, getGitHubTokenForWorkspace } from "@/lib/github/token";
import { validateGithubPatForVaultRepo } from "@/lib/github/validate-pat-for-repo";
import { logSecurityAuditEvent } from "@/lib/security-audit";
import { userHasPermission } from "@/lib/platform-roles";
import {
	getWorkspacePageTemplate,
	isValidWorkspacePageTemplateKey,
} from "@/lib/workspace-page-templates";

async function revalidateWorkspaceSettings(slug: string) {
	revalidatePath(`/w/${slug}/settings`);
	revalidatePath(`/w/${slug}/settings/general`);
	revalidatePath(`/w/${slug}/settings/users`);
	revalidatePath(`/w/${slug}/settings/pages`);
	revalidatePath(`/w/${slug}/settings/github`);
	revalidatePath(`/w/${slug}/settings/mcp`);
	revalidatePath(`/w/${slug}`, "layout");
}

export type WorkspaceInvitationLinkType = "member" | "member_with_signup";

export async function requireWorkspaceAdmin(workspaceId: string) {
	const session = await getAuthSession();
	if (!session?.user?.id) throw new Error("Not authenticated");

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
	});

	if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
		throw new Error("Insufficient permissions");
	}

	return { userId: session.user.id, role: member.role };
}

// ── Workspace general settings ────────────────────────────────────────────────

export async function updateWorkspaceSettings(
	workspaceId: string,
	data: {
		name?: string;
	},
) {
	await requireWorkspaceAdmin(workspaceId);

	const workspace = await prisma.workspace.update({
		where: { id: workspaceId },
		data,
		select: { slug: true },
	});

	await revalidateWorkspaceSettings(workspace.slug);
}

export type WorkspaceGithubSettingsView = {
	githubSync: boolean;
	vaultGithubOwner: string | null;
	vaultGithubRepo: string | null;
	vaultGithubBranch: string | null;
	hasGithubToken: boolean;
};

export async function getWorkspaceGithubSettingsView(
	workspaceId: string,
): Promise<WorkspaceGithubSettingsView | null> {
	const session = await getAuthSession();
	if (!session?.user?.id) return null;

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
	});
	if (!member) return null;

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: {
			githubSync: true,
			vaultGithubOwner: true,
			vaultGithubRepo: true,
			vaultGithubBranch: true,
		},
	});
	if (!workspace) return null;

	const hasGithubToken = await workspaceHasStoredGithubToken(workspaceId);

	return {
		...workspace,
		hasGithubToken,
	};
}

export type WorkspaceVaultLinkStatus = {
	vaultLinked: boolean;
	settingsHref: string;
};

/** Fresh vault link status for client refresh after settings save (no React cache). */
export async function getWorkspaceVaultLinkStatus(
	workspaceId: string,
): Promise<WorkspaceVaultLinkStatus | null> {
	const session = await getAuthSession();
	if (!session?.user?.id) return null;

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
	});
	if (!member) return null;

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: {
			slug: true,
			githubSync: true,
			vaultGithubOwner: true,
			vaultGithubRepo: true,
		},
	});
	if (!workspace) return null;

	const settingsHref = `/w/${workspace.slug}/settings/github`;
	if (
		!workspace.githubSync ||
		!workspace.vaultGithubOwner?.trim() ||
		!workspace.vaultGithubRepo?.trim()
	) {
		return { vaultLinked: false, settingsHref };
	}

	const token = await getGitHubTokenForWorkspace(workspaceId);
	return { vaultLinked: Boolean(token), settingsHref };
}

// ── Workspace MCP ─────────────────────────────────────────────────────────────

export type WorkspaceMcpSettingsView = {
	mcpEnabled: boolean;
	hasApiKey: boolean;
	apiKeyPrefix: string | null;
	mcpLastUsedAt: string | null;
	endpointUrl: string;
};

export async function getWorkspaceMcpSettingsView(
	workspaceId: string,
): Promise<WorkspaceMcpSettingsView | null> {
	const session = await getAuthSession();
	if (!session?.user?.id) return null;

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
	});
	if (!member) return null;

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: {
			mcpEnabled: true,
			mcpApiKeyHash: true,
			mcpApiKeyPrefix: true,
			mcpLastUsedAt: true,
		},
	});
	if (!workspace) return null;

	return {
		mcpEnabled: workspace.mcpEnabled,
		hasApiKey: Boolean(workspace.mcpApiKeyHash),
		apiKeyPrefix: workspace.mcpApiKeyPrefix,
		mcpLastUsedAt: workspace.mcpLastUsedAt?.toISOString() ?? null,
		endpointUrl: getMcpEndpointUrl(),
	};
}

export async function updateWorkspaceMcpSettings(
	workspaceId: string,
	data: { mcpEnabled?: boolean },
): Promise<void> {
	await requireWorkspaceAdmin(workspaceId);

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { mcpApiKeyHash: true },
	});
	if (!workspace) throw new Error("Workspace not found");

	if (data.mcpEnabled === true && !workspace.mcpApiKeyHash) {
		throw new Error("Erst einen API-Schlüssel erzeugen, bevor MCP aktiviert wird.");
	}

	const updated = await prisma.workspace.update({
		where: { id: workspaceId },
		data: { mcpEnabled: data.mcpEnabled },
		select: { slug: true },
	});

	revalidatePath(`/w/${updated.slug}/settings`);
}

/** Generates a new MCP API key. Plaintext is returned once — store it in Claude Code / Cursor. */
export async function regenerateWorkspaceMcpApiKey(
	workspaceId: string,
): Promise<{ apiKey: string; prefix: string }> {
	const { userId } = await requireWorkspaceAdmin(workspaceId);

	const { plaintext, hash, prefix } = generateMcpApiKey(workspaceId);
	const workspace = await prisma.workspace.update({
		where: { id: workspaceId },
		data: {
			mcpApiKeyHash: hash,
			mcpApiKeyPrefix: prefix,
			// MCP stays off until admin explicitly enables it
			mcpEnabled: false,
		},
		select: { slug: true },
	});

	logSecurityAuditEvent({
		action: "workspace_mcp_api_key_regenerated",
		actorUserId: userId,
		workspaceId,
		meta: { keyPrefix: prefix },
	});

	revalidatePath(`/w/${workspace.slug}/settings`);
	return { apiKey: plaintext, prefix };
}

export async function revokeWorkspaceMcpApiKey(workspaceId: string): Promise<void> {
	const { userId } = await requireWorkspaceAdmin(workspaceId);

	const workspace = await prisma.workspace.update({
		where: { id: workspaceId },
		data: {
			mcpEnabled: false,
			mcpApiKeyHash: null,
			mcpApiKeyPrefix: null,
			mcpLastUsedAt: null,
		},
		select: { slug: true },
	});

	logSecurityAuditEvent({
		action: "workspace_mcp_api_key_revoked",
		actorUserId: userId,
		workspaceId,
	});

	revalidatePath(`/w/${workspace.slug}/settings`);
}

export async function updateWorkspaceGithubSettings(
	workspaceId: string,
	data: {
		githubSync?: boolean;
		vaultGithubOwner?: string;
		vaultGithubRepo?: string;
		vaultGithubBranch?: string;
		/** New PAT; omit to keep existing */
		githubToken?: string;
		/** Remove stored PAT */
		clearGithubToken?: boolean;
	},
) {
	const { userId } = await requireWorkspaceAdmin(workspaceId);

	const existing = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: {
			vaultGithubOwner: true,
			vaultGithubRepo: true,
			vaultGithubToken: true,
		},
	});
	if (!existing) throw new Error("Workspace not found");

	const effectiveOwner = (data.vaultGithubOwner ?? existing.vaultGithubOwner ?? "").trim();
	const effectiveRepo = (data.vaultGithubRepo ?? existing.vaultGithubRepo ?? "").trim();

	if (data.githubToken?.trim()) {
		const validation = await validateGithubPatForVaultRepo(
			data.githubToken,
			effectiveOwner,
			effectiveRepo,
		);
		if (!validation.ok) {
			throw new Error(validation.message);
		}
	}

	const updateData: Prisma.WorkspaceUpdateInput = {
		githubSync: data.githubSync,
		vaultGithubOwner: data.vaultGithubOwner,
		vaultGithubRepo: data.vaultGithubRepo,
		vaultGithubBranch: data.vaultGithubBranch,
	};

	if (data.clearGithubToken) {
		updateData.vaultGithubToken = null;
		logSecurityAuditEvent({
			action: "workspace_github_pat_cleared",
			actorUserId: userId,
			workspaceId,
		});
	} else if (data.githubToken?.trim()) {
		updateData.vaultGithubToken = encryptGithubToken(data.githubToken);
		logSecurityAuditEvent({
			action: "workspace_github_pat_stored",
			actorUserId: userId,
			workspaceId,
			meta: { replaced: Boolean(existing.vaultGithubToken) },
		});
	}

	const workspace = await prisma.workspace.update({
		where: { id: workspaceId },
		data: updateData,
		select: { slug: true },
	});

	await revalidateWorkspaceSettings(workspace.slug);
	revalidatePath("/", "layout");
}

export async function deleteWorkspace(workspaceId: string): Promise<{ error?: string }> {
	const session = await getAuthSession();
	if (!session?.user?.id) return { error: "Not authenticated" };

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
	});
	if (!member || member.role !== "OWNER") return { error: "Only the workspace owner can delete it" };

	// Prevent deleting the last workspace
	const count = await prisma.workspaceMember.count({ where: { userId: session.user.id } });
	if (count <= 1) return { error: "Du kannst deinen letzten Workspace nicht löschen." };

	await prisma.workspace.delete({ where: { id: workspaceId } });
	revalidatePath("/workspaces");
	return {};
}

// ── Nav sections ──────────────────────────────────────────────────────────────

export type WorkspaceNavSectionData = {
	id: string;
	title: string | null;
	order: number;
};

export async function addWorkspaceNavSection(
	workspaceId: string,
	data: { title?: string | null },
) {
	await requireWorkspaceAdmin(workspaceId);

	const last = await prisma.workspaceNavSection.findFirst({
		where: { workspaceId },
		orderBy: { order: "desc" },
		select: { order: true },
	});

	await prisma.workspaceNavSection.create({
		data: {
			workspaceId,
			title: data.title ?? null,
			order: (last?.order ?? -1) + 1,
		},
	});

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

export async function updateWorkspaceNavSection(
	workspaceId: string,
	sectionId: string,
	data: { title?: string | null; order?: number },
) {
	await requireWorkspaceAdmin(workspaceId);

	await prisma.workspaceNavSection.update({
		where: { id: sectionId, workspaceId },
		data: {
			...(data.title !== undefined ? { title: data.title } : {}),
			...(data.order !== undefined ? { order: data.order } : {}),
		},
	});

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

export async function deleteWorkspaceNavSection(workspaceId: string, sectionId: string) {
	await requireWorkspaceAdmin(workspaceId);

	await prisma.$transaction([
		// Explizit nach „Ohne Bereich“ (FK würde via onDelete: SetNull ebenfalls nullen)
		prisma.workspacePage.updateMany({
			where: { workspaceId, navSectionId: sectionId },
			data: { navSectionId: null },
		}),
		prisma.workspaceNavSection.delete({
			where: { id: sectionId, workspaceId },
		}),
	]);

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

export async function reorderWorkspaceNavSections(workspaceId: string, orderedIds: string[]) {
	await requireWorkspaceAdmin(workspaceId);

	await prisma.$transaction(
		orderedIds.map((id, index) =>
			prisma.workspaceNavSection.update({
				where: { id, workspaceId },
				data: { order: index },
			}),
		),
	);

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

// ── Workspace pages ───────────────────────────────────────────────────────────

export async function addWorkspacePage(
	workspaceId: string,
	page: {
		templateKey: string;
		slug: string;
		label: string;
		icon?: string;
		order?: number;
		navSectionId?: string | null;
	},
) {
	await requireWorkspaceAdmin(workspaceId);

	if (!isValidWorkspacePageTemplateKey(page.templateKey)) {
		throw new Error("Ungültige Seitenart");
	}

	const template = getWorkspacePageTemplate(page.templateKey)!;

	let navSectionId = page.navSectionId;
	if (navSectionId === undefined) {
		const lastSection = await prisma.workspaceNavSection.findFirst({
			where: { workspaceId },
			orderBy: { order: "desc" },
			select: { id: true },
		});
		navSectionId = lastSection?.id ?? null;
	}

	const last = await prisma.workspacePage.findFirst({
		where: { workspaceId },
		orderBy: { order: "desc" },
		select: { order: true },
	});

	let slug = page.slug;
	let counter = 1;
	while (await prisma.workspacePage.findUnique({ where: { workspaceId_slug: { workspaceId, slug } } })) {
		counter++;
		slug = `${page.slug}-${counter}`;
	}

	await prisma.workspacePage.create({
		data: {
			workspaceId,
			templateKey: page.templateKey,
			slug,
			label: page.label,
			icon: page.icon ?? template.defaultIcon,
			order: page.order ?? (last?.order ?? -1) + 1,
			isEnabled: true,
			navSectionId,
			config: { dataFolder: template.defaultDataFolder },
		},
	});

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

export async function removeWorkspacePage(workspaceId: string, pageId: string) {
	await requireWorkspaceAdmin(workspaceId);
	await prisma.workspacePage.delete({ where: { id: pageId, workspaceId } });

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

export async function updateWorkspacePage(
	workspaceId: string,
	pageId: string,
	data: {
		label?: string;
		slug?: string;
		icon?: string;
		isEnabled?: boolean;
		templateKey?: string;
		navSectionId?: string | null;
		order?: number;
		config?: Record<string, unknown> | null;
	},
) {
	await requireWorkspaceAdmin(workspaceId);

	if (data.templateKey !== undefined && !isValidWorkspacePageTemplateKey(data.templateKey)) {
		throw new Error("Ungültige Seitenart");
	}

	const { config, ...rest } = data;
	await prisma.workspacePage.update({
		where: { id: pageId, workspaceId },
		data: {
			...rest,
			...(config !== undefined
				? { config: config === null ? Prisma.JsonNull : (config as Prisma.InputJsonValue) }
				: {}),
		},
	});

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

export async function reorderWorkspacePages(workspaceId: string, orderedIds: string[]) {
	await requireWorkspaceAdmin(workspaceId);

	await prisma.$transaction(
		orderedIds.map((id, index) =>
			prisma.workspacePage.update({
				where: { id, workspaceId },
				data: { order: index },
			}),
		),
	);

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	if (ws) await revalidateWorkspaceSettings(ws.slug);
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function updateWorkspaceMemberRole(
	workspaceId: string,
	targetUserId: string,
	newRole: "ADMIN" | "MEMBER" | "VIEWER",
) {
	const { userId, role } = await requireWorkspaceAdmin(workspaceId);

	// Only OWNER can change ADMIN role; ADMIN can only change MEMBER/VIEWER
	const target = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
	});
	if (!target) throw new Error("Member not found");
	if (target.role === "OWNER") throw new Error("Cannot change OWNER role");
	if (role === "ADMIN" && target.role === "ADMIN") throw new Error("Insufficient permissions");
	if (userId === targetUserId) throw new Error("Cannot change your own role");

	await prisma.workspaceMember.update({
		where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
		data: { role: newRole },
	});

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	revalidatePath(`/w/${ws?.slug}/settings`);
}

export async function removeWorkspaceMember(workspaceId: string, targetUserId: string) {
	const { userId, role } = await requireWorkspaceAdmin(workspaceId);

	const target = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
	});
	if (!target) throw new Error("Member not found");
	if (target.role === "OWNER") throw new Error("Cannot remove OWNER");
	if (role === "ADMIN" && (target.role === "ADMIN")) throw new Error("Insufficient permissions");
	if (userId === targetUserId) throw new Error("Cannot remove yourself");

	await prisma.workspaceMember.delete({
		where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
	});

	const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { slug: true } });
	revalidatePath(`/w/${ws?.slug}/settings`);
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function createWorkspaceInvitation(
	workspaceId: string,
	options: {
		role?: "ADMIN" | "MEMBER" | "VIEWER";
		email?: string;
		linkType: WorkspaceInvitationLinkType;
	},
) {
	const { userId } = await requireWorkspaceAdmin(workspaceId);
	const role = options.role ?? "MEMBER";
	const allowsSignup = options.linkType === "member_with_signup";

	if (allowsSignup) {
		const canSignupInvite = await userHasPermission(userId, "invitation.create");
		if (!canSignupInvite) {
			throw new Error(
				"Keine Berechtigung für Einladungslinks mit Registrierung. Nur Plattform-Einladungen oder Workspace-Links für bestehende Nutzer.",
			);
		}
	} else {
		const canMemberInvite = await userHasPermission(userId, "workspace.invite");
		if (!canMemberInvite) {
			throw new Error(
				"Keine Berechtigung, Nutzer in Workspaces einzuladen.",
			);
		}
	}

	const invitation = await prisma.workspaceInvitation.create({
		data: {
			workspaceId,
			invitedById: userId,
			role,
			email: options.email?.trim() || null,
			allowsSignup,
			status: "PENDING",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		},
		select: { token: true, allowsSignup: true },
	});

	const ws = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { slug: true },
	});
	if (ws) revalidatePath(`/w/${ws.slug}/settings`);

	return invitation;
}

/** Whether the current user may create each workspace invite link type. */
export async function getWorkspaceInviteCapabilities(workspaceId: string): Promise<{
	canCreateMemberLink: boolean;
	canCreateSignupLink: boolean;
}> {
	const session = await getAuthSession();
	if (!session?.user?.id) {
		return { canCreateMemberLink: false, canCreateSignupLink: false };
	}

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
	});
	if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
		return { canCreateMemberLink: false, canCreateSignupLink: false };
	}

	const [canCreateMemberLink, canCreateSignupLink] = await Promise.all([
		userHasPermission(session.user.id, "workspace.invite"),
		userHasPermission(session.user.id, "invitation.create"),
	]);

	return { canCreateMemberLink, canCreateSignupLink };
}

export async function revokeWorkspaceInvitation(workspaceId: string, invitationId: string) {
	await requireWorkspaceAdmin(workspaceId);

	const invitation = await prisma.workspaceInvitation.findFirst({
		where: { id: invitationId, workspaceId },
	});

	if (!invitation) throw new Error("Einladung nicht gefunden.");
	if (invitation.status !== "PENDING") throw new Error("Einladung ist nicht mehr aktiv.");

	await prisma.workspaceInvitation.update({
		where: { id: invitationId },
		data: { status: "DECLINED" },
	});

	const ws = await prisma.workspace.findUnique({
		where: { id: workspaceId },
		select: { slug: true },
	});
	if (ws) revalidatePath(`/w/${ws.slug}/settings`);
}
