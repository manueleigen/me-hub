"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformPermission } from "@/lib/platform-admin";
import {
	PLATFORM_PERMISSION_KEYS,
	type PlatformPermission,
} from "@/lib/platform-permissions";
import { ensurePlatformRoles, syncBetterAuthRoleForUser } from "@/lib/platform-roles";

export type AdminRoleRow = {
	id: string;
	key: string;
	label: string;
	description: string | null;
	permissions: string[];
	isSystem: boolean;
	userCount: number;
};

function slugifyKey(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

function validatePermissions(permissions: string[]): string[] {
	const allowed = new Set<string>(PLATFORM_PERMISSION_KEYS);
	return [...new Set(permissions.filter((p) => allowed.has(p as PlatformPermission)))];
}

export async function listAdminRoles(): Promise<AdminRoleRow[]> {
	await requirePlatformPermission("role.manage");
	await ensurePlatformRoles();

	const roles = await prisma.appRole.findMany({
		orderBy: [{ isSystem: "desc" }, { label: "asc" }],
		include: { _count: { select: { users: true } } },
	});

	return roles.map((r) => ({
		id: r.id,
		key: r.key,
		label: r.label,
		description: r.description,
		permissions: r.permissions,
		isSystem: r.isSystem,
		userCount: r._count.users,
	}));
}

export async function createAppRole(input: {
	label: string;
	key?: string;
	description?: string;
	permissions: string[];
}) {
	await requirePlatformPermission("role.manage");
	await ensurePlatformRoles();

	const label = input.label.trim();
	if (label.length < 2) throw new Error("Name der Rolle ist zu kurz.");

	let key = input.key?.trim() ? slugifyKey(input.key) : slugifyKey(label);
	if (!key) throw new Error("Ungültiger Rollen-Schlüssel.");

	const existing = await prisma.appRole.findUnique({ where: { key } });
	if (existing) {
		key = `${key}-${Date.now().toString(36).slice(-4)}`;
	}

	const role = await prisma.appRole.create({
		data: {
			key,
			label,
			description: input.description?.trim() || null,
			permissions: validatePermissions(input.permissions),
			isSystem: false,
		},
	});

	revalidatePath("/admin/roles");
	return role.id;
}

export async function updateAppRole(
	roleId: string,
	input: {
		label: string;
		description?: string;
		permissions: string[];
	},
) {
	await requirePlatformPermission("role.manage");

	const role = await prisma.appRole.findUnique({ where: { id: roleId } });
	if (!role) throw new Error("Rolle nicht gefunden.");

	const label = input.label.trim();
	if (label.length < 2) throw new Error("Name der Rolle ist zu kurz.");

	const permissions = validatePermissions(input.permissions);

	// System admin role must keep platform.admin
	if (role.key === "admin" && !permissions.includes("platform.admin")) {
		throw new Error("Die Administrator-Rolle muss „Plattform-Admin“ behalten.");
	}

	await prisma.appRole.update({
		where: { id: roleId },
		data: {
			label,
			description: input.description?.trim() || null,
			permissions,
		},
	});

	const users = await prisma.user.findMany({
		where: { appRoleId: roleId },
		select: { id: true },
	});
	for (const u of users) {
		await syncBetterAuthRoleForUser(u.id);
	}

	revalidatePath("/admin/roles");
	revalidatePath("/admin/users");
}

export async function deleteAppRole(roleId: string) {
	await requirePlatformPermission("role.manage");
	await ensurePlatformRoles();

	const role = await prisma.appRole.findUnique({
		where: { id: roleId },
		include: { _count: { select: { users: true } } },
	});
	if (!role) throw new Error("Rolle nicht gefunden.");
	if (role.isSystem) throw new Error("Systemrollen können nicht gelöscht werden.");
	if (role._count.users > 0) {
		throw new Error("Rolle wird noch von Nutzern verwendet. Zuerst Nutzer umzuweisen.");
	}

	await prisma.appRole.delete({ where: { id: roleId } });
	revalidatePath("/admin/roles");
}
