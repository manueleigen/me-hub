import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import {
	ensurePlatformRoles,
	getUserPermissionContext,
	userHasPermission,
} from "@/lib/platform-roles";
import type { PlatformPermission } from "@/lib/platform-permissions";

export async function requirePlatformPermission(permission: PlatformPermission) {
	const session = await getAuthSession();
	if (!session?.user?.id) throw new Error("Not authenticated");

	await ensurePlatformRoles();

	const allowed = await userHasPermission(session.user.id, permission);
	if (!allowed) throw new Error("Insufficient permissions");

	return session.user.id;
}

export async function requirePlatformAdmin() {
	return requirePlatformPermission("platform.admin");
}

/** For admin pages — redirects non-admins to home. */
export async function assertPlatformAdminPage() {
	const session = await getAuthSession();
	if (!session?.user?.id) redirect("/login");

	await ensurePlatformRoles();

	const allowed = await userHasPermission(session.user.id, "platform.admin");
	if (!allowed) redirect("/");

	return session.user.id;
}

export async function canAccessPlatformAdmin(userId: string): Promise<boolean> {
	await ensurePlatformRoles();
	return userHasPermission(userId, "platform.admin");
}

export { getUserPermissionContext };
