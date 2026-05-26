import { prisma } from "@/lib/prisma";
import { isFrontmatterMirrorSchemaError } from "@/lib/mirror/prisma-capabilities";
import { Prisma } from "@/app/generated/prisma/client";
import { shouldMirrorVaultFilePath } from "@/lib/vault/mirrorable-text-files";
import type { MirrorFile } from "./mirror-types";

const mirrorSupportsFrontmatterJson =
	"frontmatterJson" in Prisma.WorkspaceFileMirrorScalarFieldEnum;

function normalizePrefix(prefix: string): string {
	return prefix.replace(/\/$/, "");
}

export type MirrorListFile = {
	path: string;
	blobSha: string | null;
	frontmatterJson: string | null;
	content?: string;
};

const listSelect = mirrorSupportsFrontmatterJson
	? ({ path: true, blobSha: true, frontmatterJson: true } as const)
	: ({ path: true, blobSha: true } as const);

const fullSelect = mirrorSupportsFrontmatterJson
	? ({ path: true, content: true, blobSha: true, frontmatterJson: true } as const)
	: ({ path: true, content: true, blobSha: true } as const);

function mapListRows(
	rows: {
		path: string;
		blobSha: string | null;
		frontmatterJson: string | null;
		content?: string;
	}[],
): MirrorListFile[] {
	return rows
		.filter((r) => shouldMirrorVaultFilePath(r.path))
		.map((r) => ({
			path: r.path,
			blobSha: r.blobSha,
			frontmatterJson: r.frontmatterJson,
			...(r.content !== undefined ? { content: r.content } : {}),
		}));
}

async function findMirrorListRows(
	workspaceId: string,
	where: {
		workspaceId: string;
		path?: { startsWith: string };
		OR?: { path: { startsWith: string } }[];
	},
): Promise<MirrorListFile[]> {
	try {
		const rows = await prisma.workspaceFileMirror.findMany({ where, select: listSelect });
		return mapListRows(
			rows.map((r) => ({
				...r,
				frontmatterJson:
					"frontmatterJson" in r ? (r.frontmatterJson as string | null) : null,
			})),
		);
	} catch (error) {
		if (!isFrontmatterMirrorSchemaError(error)) throw error;
		const rows = await prisma.workspaceFileMirror.findMany({
			where,
			select: { path: true, blobSha: true },
		});
		return mapListRows(rows.map((r) => ({ ...r, frontmatterJson: null })));
	}
}

export async function getMirrorMarkdownListFiles(
	workspaceId: string,
	prefix: string,
): Promise<MirrorListFile[]> {
	const normalized = normalizePrefix(prefix);
	return findMirrorListRows(
		workspaceId,
		normalized
			? { workspaceId, path: { startsWith: `${normalized}/` } }
			: { workspaceId },
	);
}

export async function getMirrorMarkdownListFilesByPrefixes(
	workspaceId: string,
	prefixes: string[],
): Promise<MirrorListFile[]> {
	const normalized = prefixes.map(normalizePrefix).filter(Boolean);
	if (normalized.length === 0) return [];

	return findMirrorListRows(workspaceId, {
		workspaceId,
		OR: normalized.map((p) => ({ path: { startsWith: `${p}/` } })),
	});
}

export async function getMirrorMarkdownFiles(
	workspaceId: string,
	prefix: string,
): Promise<MirrorFile[]> {
	const normalized = normalizePrefix(prefix);
	let rows: {
		path: string;
		content: string;
		blobSha: string | null;
		frontmatterJson?: string | null;
	}[];

	try {
		rows = await prisma.workspaceFileMirror.findMany({
			where: normalized
				? { workspaceId, path: { startsWith: `${normalized}/` } }
				: { workspaceId },
			select: fullSelect,
		});
	} catch (error) {
		if (!isFrontmatterMirrorSchemaError(error)) throw error;
		rows = await prisma.workspaceFileMirror.findMany({
			where: normalized
				? { workspaceId, path: { startsWith: `${normalized}/` } }
				: { workspaceId },
			select: { path: true, content: true, blobSha: true },
		});
	}

	return rows
		.filter((r) => shouldMirrorVaultFilePath(r.path))
		.map((r) => ({
			path: r.path,
			content: r.content,
			blobSha: r.blobSha,
		}));
}
