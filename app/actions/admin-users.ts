"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformPermission } from "@/lib/platform-admin";
import {
	ensurePlatformRoles,
	getAdminRoleId,
	syncBetterAuthRoleForUser,
} from "@/lib/platform-roles";

export type AdminUserRow = {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	banned: boolean;
	banReason: string | null;
	createdAt: string;
	appRoleId: string | null;
	appRoleKey: string | null;
	appRoleLabel: string | null;
	workspaceCount: number;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
	await requirePlatformPermission("user.manage");

	const users = await prisma.user.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			banned: true,
			banReason: true,
			createdAt: true,
			appRoleId: true,
			appRole: { select: { key: true, label: true } },
			_count: { select: { workspaceMemberships: true } },
		},
	});

	return users.map((u) => ({
		id: u.id,
		name: u.name,
		email: u.email,
		image: u.image,
		banned: u.banned ?? false,
		banReason: u.banReason,
		createdAt: u.createdAt.toISOString(),
		appRoleId: u.appRoleId,
		appRoleKey: u.appRole?.key ?? null,
		appRoleLabel: u.appRole?.label ?? null,
		workspaceCount: u._count.workspaceMemberships,
	}));
}

export async function updateUserAppRole(targetUserId: string, appRoleId: string) {
	const actorId = await requirePlatformPermission("user.manage");

	if (targetUserId === actorId) {
		throw new Error("Eigene Rolle kann hier nicht geändert werden.");
	}

	await ensurePlatformRoles();

	const role = await prisma.appRole.findUnique({ where: { id: appRoleId } });
	if (!role) throw new Error("Rolle nicht gefunden.");

	await prisma.user.update({
		where: { id: targetUserId },
		data: { appRoleId },
	});

	await syncBetterAuthRoleForUser(targetUserId);

	revalidatePath("/admin/users");
	revalidatePath("/admin/roles");
}

export async function setUserBanned(targetUserId: string, banned: boolean, reason?: string) {
	const actorId = await requirePlatformPermission("user.manage");

	if (targetUserId === actorId) {
		throw new Error("Du kannst dich nicht selbst sperren.");
	}

	const adminRoleId = await getAdminRoleId();
	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: { appRoleId: true },
	});

	if (target?.appRoleId === adminRoleId && banned) {
		const adminCount = await prisma.user.count({
			where: { appRoleId: adminRoleId, banned: { not: true } },
		});
		if (adminCount <= 1) {
			throw new Error("Der letzte aktive Administrator kann nicht gesperrt werden.");
		}
	}

	await prisma.user.update({
		where: { id: targetUserId },
		data: {
			banned,
			banReason: banned ? reason?.trim() || "Gesperrt durch Administrator" : null,
			banExpires: null,
		},
	});

	revalidatePath("/admin/users");
}

export async function deletePlatformUser(targetUserId: string) {
	const actorId = await requirePlatformPermission("user.manage");

	if (targetUserId === actorId) {
		throw new Error("Du kannst dein eigenes Konto nicht hier löschen.");
	}

	const adminRoleId = await getAdminRoleId();
	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: { appRoleId: true },
	});

	if (target?.appRoleId === adminRoleId) {
		const adminCount = await prisma.user.count({ where: { appRoleId: adminRoleId } });
		if (adminCount <= 1) {
			throw new Error("Der letzte Administrator kann nicht gelöscht werden.");
		}
	}

	await prisma.user.delete({ where: { id: targetUserId } });

	revalidatePath("/admin/users");
}
