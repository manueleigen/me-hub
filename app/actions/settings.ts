"use server";

import { prisma } from "@/lib/prisma";
import { getCachedUserSettings, getCachedVaultUser } from "@/lib/cache/server";

export async function getUserSettings() {
	return getCachedUserSettings();
}

export async function updateUserSettings(settings: {
	darkMode?: boolean;
	autoSave?: boolean;
}) {
	const user = await getCachedVaultUser();
	if (!user) throw new Error("Not authenticated");
	await prisma.user.update({
		where: { id: user.id },
		data: settings,
	});
}
