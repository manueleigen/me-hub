import { prisma } from "@/lib/prisma";

let canWriteFrontmatterJson: boolean | null = null;

export function isFrontmatterMirrorSchemaError(error: unknown): boolean {
	if (
		error &&
		typeof error === "object" &&
		"code" in error &&
		(error as { code: string }).code === "P2022"
	) {
		return true;
	}
	const message = error instanceof Error ? error.message : String(error);
	return (
		message.includes("frontmatterJson") || message.includes("Unknown argument")
	);
}

/**
 * Runtime probe — avoids stale Prisma WASM where TS types include frontmatterJson
 * but the query compiler does not (shows up as "Unknown argument" on deleteMany in $transaction).
 */
export async function canWriteMirrorFrontmatterJson(): Promise<boolean> {
	if (canWriteFrontmatterJson !== null) return canWriteFrontmatterJson;

	try {
		await prisma.workspaceFileMirror.findFirst({
			select: { id: true, frontmatterJson: true },
			take: 1,
		});
		canWriteFrontmatterJson = true;
	} catch (error) {
		if (isFrontmatterMirrorSchemaError(error)) {
			canWriteFrontmatterJson = false;
			if (process.env.NODE_ENV === "development") {
				console.warn(
					"[vault] Prisma client missing frontmatterJson — sync writes content only. Restart dev server after: npx prisma generate",
				);
			}
		} else {
			throw error;
		}
	}

	return canWriteFrontmatterJson;
}

/** Call after `prisma generate` in long-lived dev processes if needed. */
export function resetMirrorPrismaCapabilitiesCache(): void {
	canWriteFrontmatterJson = null;
}
