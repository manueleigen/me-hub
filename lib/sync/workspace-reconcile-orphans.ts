import {
	listAllWorkspaceMirrorPaths,
	deleteWorkspaceMirrorPaths,
} from "@/lib/mirror/workspace-mirror";
import { shouldMirrorVaultFilePath } from "@/lib/vault/mirrorable-text-files";

export async function reconcileWorkspaceMirrorOrphans(
	workspaceId: string,
	remotePaths: string[],
): Promise<string[]> {
	const remoteSet = new Set(remotePaths);
	const mirrorPaths = await listAllWorkspaceMirrorPaths(workspaceId);
	const orphans = mirrorPaths.filter(
		(path) => shouldMirrorVaultFilePath(path) && !remoteSet.has(path),
	);

	if (orphans.length > 0) {
		await deleteWorkspaceMirrorPaths(workspaceId, orphans);
	}

	return orphans;
}
