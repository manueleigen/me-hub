import type { Octokit } from "octokit";
import { buildWorkspaceMirrorCreateRow } from "@/lib/mirror/workspace-prisma-rows";
import { deleteAllWorkspaceMirror } from "@/lib/mirror/workspace-mirror";
import { prisma } from "@/lib/prisma";
import { fetchBlobTextsAtCommit } from "./graphql-blobs";
import { listMarkdownPathsFromBranchTree } from "./markdown-tree-paths";

export async function runWorkspaceFullImport(
	workspaceId: string,
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
	commitSha: string,
): Promise<{ imported: number }> {
	const paths = await listMarkdownPathsFromBranchTree(octokit, owner, repo, branch);
	const blobs = await fetchBlobTextsAtCommit(octokit, owner, repo, commitSha, paths);

	await deleteAllWorkspaceMirror(workspaceId);

	await prisma.$transaction([
		prisma.workspaceFileMirror.createMany({
			data: blobs.map((blob) => buildWorkspaceMirrorCreateRow(workspaceId, blob)),
		}),
		prisma.workspace.update({
			where: { id: workspaceId },
			data: {
				lastSyncedSha: commitSha,
				initialSyncCompleted: true,
				lastSyncAt: new Date(),
				lastSyncError: null,
			},
		}),
	]);

	return { imported: blobs.length };
}
