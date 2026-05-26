import { buildMirrorRowFields } from "@/lib/mirror/sync-fields";

type BlobLike = { path: string; text: string; oid?: string | null };

export function buildMirrorCreateRow(
	userId: string,
	blob: BlobLike,
	includeFrontmatterJson: boolean,
) {
	const fields = buildMirrorRowFields(blob.text);
	const row = {
		userId,
		path: blob.path,
		content: fields.content,
		blobSha: blob.oid ?? null,
	};
	if (!includeFrontmatterJson) return row;
	return { ...row, frontmatterJson: fields.frontmatterJson };
}

export function buildMirrorUpsertArgs(
	userId: string,
	blob: BlobLike,
	includeFrontmatterJson: boolean,
) {
	const fields = buildMirrorRowFields(blob.text);
	const data = {
		content: fields.content,
		blobSha: blob.oid ?? null,
		...(includeFrontmatterJson
			? { frontmatterJson: fields.frontmatterJson }
			: {}),
	};
	return {
		where: { userId_path: { userId, path: blob.path } },
		create: {
			userId,
			path: blob.path,
			...data,
		},
		update: data,
	};
}
