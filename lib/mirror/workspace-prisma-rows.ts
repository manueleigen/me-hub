import { buildMirrorRowFields } from "@/lib/mirror/sync-fields";

type BlobLike = { path: string; text: string; oid?: string | null };

export function buildWorkspaceMirrorCreateRow(workspaceId: string, blob: BlobLike) {
	const fields = buildMirrorRowFields(blob.text);
	return {
		workspaceId,
		path: blob.path,
		content: fields.content,
		blobSha: blob.oid ?? null,
		frontmatterJson: fields.frontmatterJson,
	};
}

export function buildWorkspaceMirrorUpsertArgs(workspaceId: string, blob: BlobLike) {
	const fields = buildMirrorRowFields(blob.text);
	const data = {
		content: fields.content,
		blobSha: blob.oid ?? null,
		frontmatterJson: fields.frontmatterJson,
	};
	return {
		where: { workspaceId_path: { workspaceId, path: blob.path } },
		create: { workspaceId, path: blob.path, ...data },
		update: data,
	};
}
