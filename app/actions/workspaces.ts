"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { userHasPermission } from "@/lib/platform-roles";
import { generateWorkspaceSlug } from "@/lib/workspace-defaults";
import { seedWorkspaceNavAndPages } from "@/lib/workspace-seed";
import type { WorkspaceData, WorkspaceSummary, WorkspaceMembership } from "@/lib/workspace-context";

export type ResolvedWorkspace = {
	workspace: WorkspaceData;
	membership: WorkspaceMembership;
	allWorkspaces: WorkspaceSummary[];
};

export type WorkspaceMemberSummary = {
	userId: string;
	name: string | null;
	email: string;
	image: string | null;
};

/** Lists members of a workspace the current user belongs to. */
export async function listWorkspaceMembers(
	workspaceId: string,
): Promise<WorkspaceMemberSummary[]> {
	const session = await getAuthSession();
	if (!session?.user?.id) return [];

	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: session.user.id,
			},
		},
	});

	if (!membership) return [];

	const members = await prisma.workspaceMember.findMany({
		where: { workspaceId },
		include: {
			user: { select: { id: true, name: true, email: true, image: true } },
		},
		orderBy: { joinedAt: "asc" },
	});

	return members.map((m) => ({
		userId: m.user.id,
		name: m.user.name,
		email: m.user.email,
		image: m.user.image,
	}));
}

/**
 * Resolves a workspace by slug for the current user.
 * Returns null if the user is not a member, or if the workspace doesn't exist.
 */
export async function resolveWorkspaceForUser(slug: string): Promise<ResolvedWorkspace | null> {
	const session = await getAuthSession();
	if (!session?.user?.id) return null;

	const userId = session.user.id;

	const workspace = await prisma.workspace.findUnique({
		where: { slug },
		include: {
			members: { where: { userId } },
			navSections: { orderBy: { order: "asc" } },
			pages: {
				where: { isEnabled: true },
				orderBy: { order: "asc" },
			},
		},
	});

	if (!workspace || workspace.members.length === 0) return null;

	const member = workspace.members[0];

	// All workspaces this user is a member of (for the selector)
	const memberships = await prisma.workspaceMember.findMany({
		where: { userId },
		include: { workspace: { select: { id: true, slug: true, name: true, type: true } } },
		orderBy: { workspace: { createdAt: "asc" } },
	});

	const allWorkspaces: WorkspaceSummary[] = memberships.map((m) => ({
		id: m.workspace.id,
		slug: m.workspace.slug,
		name: m.workspace.name,
		type: m.workspace.type as "PERSONAL" | "TEAM",
	}));

	const workspaceData: WorkspaceData = {
		id: workspace.id,
		slug: workspace.slug,
		name: workspace.name,
		type: workspace.type as "PERSONAL" | "TEAM",
		githubSync: workspace.githubSync,
		vaultGithubOwner: workspace.vaultGithubOwner,
		vaultGithubRepo: workspace.vaultGithubRepo,
		vaultGithubBranch: workspace.vaultGithubBranch,
		initialSyncCompleted: workspace.initialSyncCompleted,
		navSections: workspace.navSections.map((s) => ({
			id: s.id,
			title: s.title,
			order: s.order,
		})),
		pages: workspace.pages.map((p) => ({
			id: p.id,
			templateKey: p.templateKey,
			slug: p.slug,
			label: p.label,
			icon: p.icon,
			order: p.order,
			isEnabled: p.isEnabled,
			navSectionId: p.navSectionId,
			config: (p.config as Record<string, unknown> | null) ?? null,
		})),
	};

	return {
		workspace: workspaceData,
		membership: { role: member.role as WorkspaceMembership["role"] },
		allWorkspaces,
	};
}

/**
 * Returns the active workspace slug for the current user (from UserWorkspacePreference),
 * falling back to the first personal workspace.
 */
/** Active workspace with pages and selector list (for sidebar on non-/w/ routes). */
export async function resolveActiveWorkspaceForUser(): Promise<ResolvedWorkspace | null> {
	const slug = await getActiveWorkspaceSlug();
	if (!slug) return null;
	return resolveWorkspaceForUser(slug);
}

export async function getActiveWorkspaceSlug(): Promise<string | null> {
	const session = await getAuthSession();
	if (!session?.user?.id) return null;

	const userId = session.user.id;

	// Stale dev singletons may lack newer delegates — skip pref lookup and use membership fallback.
	const pref = prisma.userWorkspacePreference
		? await prisma.userWorkspacePreference.findUnique({
				where: { userId },
				select: { activeWorkspaceId: true },
			})
		: null;

	if (pref?.activeWorkspaceId) {
		const ws = await prisma.workspace.findUnique({
			where: { id: pref.activeWorkspaceId },
			select: { slug: true },
		});
		if (ws) return ws.slug;
	}

	// Fallback: first workspace the user owns or is a member of
	const membership = await prisma.workspaceMember.findFirst({
		where: { userId },
		orderBy: { joinedAt: "asc" },
		include: { workspace: { select: { slug: true } } },
	});

	return membership?.workspace.slug ?? null;
}

/** Whether the current user may create additional workspaces (beyond signup default). */
export async function canUserCreateWorkspaces(): Promise<boolean> {
	const session = await getAuthSession();
	if (!session?.user?.id) return false;
	return userHasPermission(session.user.id, "workspace.create");
}

/** Creates a new personal workspace for the current user and redirects to it. */
export async function createWorkspace(formData: FormData): Promise<void> {
	const session = await getAuthSession();
	if (!session?.user?.id) redirect("/login");

	const allowed = await userHasPermission(session.user.id, "workspace.create");
	if (!allowed) {
		throw new Error("Keine Berechtigung, weitere Workspaces zu erstellen.");
	}

	const name = (formData.get("name") as string | null)?.trim();
	if (!name || name.length < 1) return;

	const userId = session.user.id;
	const slug = await generateWorkspaceSlug(name);

	const workspace = await prisma.$transaction(async (tx) => {
		const ws = await tx.workspace.create({
			data: {
				slug,
				name,
				type: "PERSONAL",
				ownerId: userId,
				members: { create: { userId, role: "OWNER" } },
			},
		});
		await seedWorkspaceNavAndPages(ws.id, tx);
		return ws;
	});

	await prisma.userWorkspacePreference.upsert({
		where: { userId },
		update: { activeWorkspaceId: workspace.id },
		create: { userId, activeWorkspaceId: workspace.id },
	});

	redirect(`/w/${workspace.slug}`);
}

/** Updates the user's active workspace preference. */
export async function setActiveWorkspace(workspaceId: string): Promise<void> {
	const session = await getAuthSession();
	if (!session?.user?.id) return;

	if (!prisma.userWorkspacePreference) return;

	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: { workspaceId, userId: session.user.id },
		},
	});
	if (!membership) return;

	await prisma.userWorkspacePreference.upsert({
		where: { userId: session.user.id },
		update: { activeWorkspaceId: workspaceId },
		create: { userId: session.user.id, activeWorkspaceId: workspaceId },
	});
}
