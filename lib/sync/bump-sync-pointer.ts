import { prisma } from "@/lib/prisma";

export async function bumpWorkspaceLastSyncedSha(
	workspaceId: string,
	commitSha: string,
): Promise<void> {
	if (!commitSha.trim()) return;
	await prisma.workspace.update({
		where: { id: workspaceId },
		data: {
			lastSyncedSha: commitSha,
			lastSyncAt: new Date(),
			lastSyncError: null,
		},
	});
}
