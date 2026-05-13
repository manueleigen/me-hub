"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function getUserSettings() {
	const session = await getAuthSession();
	if (!session?.user) return null;
	return prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			darkMode: true,
			githubSync: true,
			autoSave: true,
			vaultGithubOwner: true,
			vaultGithubRepo: true,
			vaultGithubBranch: true,
		},
	});
}

export async function updateUserSettings(settings: {
	darkMode?: boolean;
	githubSync?: boolean;
	autoSave?: boolean;
	vaultGithubOwner?: string;
	vaultGithubRepo?: string;
	vaultGithubBranch?: string;
}) {
	const session = await getAuthSession();
	if (!session?.user) throw new Error("Not authenticated");
	await prisma.user.update({
		where: { id: session.user.id },
		data: settings,
	});
}
