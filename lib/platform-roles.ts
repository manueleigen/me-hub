import { prisma } from "@/lib/prisma";
import {
	hasPlatformPermission,
	type PlatformPermission,
	parsePermissions,
} from "@/lib/platform-permissions";

const DEFAULT_ROLES = [
	{
		id: "role_user",
		key: "user",
		label: "Nutzer",
		description:
			"Standardrolle: ein persönlicher Workspace bei Registrierung, Workspace-Einladungen für bestehende Nutzer.",
		permissions: ["workspace.invite"] as string[],
		isSystem: true,
	},
	{
		id: "role_admin",
		key: "admin",
		label: "Administrator",
		description: "Voller Zugriff auf Plattform-Verwaltung.",
		permissions: [
			"platform.admin",
			"workspace.create",
			"invitation.create",
			"workspace.invite",
			"user.manage",
			"role.manage",
		],
		isSystem: true,
	},
] as const;

/** Ensures system roles exist (idempotent). */
export async function ensurePlatformRoles() {
	for (const role of DEFAULT_ROLES) {
		await prisma.appRole.upsert({
			where: { key: role.key },
			create: {
				id: role.id,
				key: role.key,
				label: role.label,
				description: role.description,
				permissions: [...role.permissions],
				isSystem: role.isSystem,
			},
			update: {
				label: role.label,
				description: role.description,
				isSystem: role.isSystem,
			},
		});
	}
}

export async function getDefaultUserRoleId(): Promise<string> {
	await ensurePlatformRoles();
	const role = await prisma.appRole.findUnique({ where: { key: "user" } });
	if (!role) throw new Error("Default user role missing");
	return role.id;
}

export async function getAdminRoleId(): Promise<string> {
	await ensurePlatformRoles();
	const role = await prisma.appRole.findUnique({ where: { key: "admin" } });
	if (!role) throw new Error("Admin role missing");
	return role.id;
}

export type UserPermissionContext = {
	userId: string;
	permissions: string[];
	appRoleKey: string | null;
};

export async function getUserPermissionContext(
	userId: string,
): Promise<UserPermissionContext | null> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			appRole: { select: { key: true, permissions: true } },
		},
	});
	if (!user) return null;

	const permissions = parsePermissions(user.appRole?.permissions ?? []);
	return {
		userId: user.id,
		permissions,
		appRoleKey: user.appRole?.key ?? null,
	};
}

export async function userHasPermission(
	userId: string,
	permission: PlatformPermission,
): Promise<boolean> {
	const ctx = await getUserPermissionContext(userId);
	if (!ctx) return false;
	return hasPlatformPermission(ctx.permissions, permission);
}

/** Maps app role to Better Auth admin plugin role field. */
export function betterAuthRoleForPermissions(permissions: readonly string[]): string {
	return hasPlatformPermission(permissions, "platform.admin") ? "admin" : "user";
}

export async function syncBetterAuthRoleForUser(userId: string) {
	const ctx = await getUserPermissionContext(userId);
	if (!ctx) return;
	const role = betterAuthRoleForPermissions(ctx.permissions);
	await prisma.user.update({
		where: { id: userId },
		data: { role },
	});
}
