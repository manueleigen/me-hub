import { prisma } from "@/lib/prisma";

/** Generates a unique workspace slug from a display name or email, retrying with numeric suffix on collision. */
export async function generateWorkspaceSlug(base: string): Promise<string> {
	const baseSlug =
		base
			.toLowerCase()
			.replace(/@.*$/, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 32) || "workspace";

	let slug = baseSlug;
	let counter = 0;
	while (await prisma.workspace.findUnique({ where: { slug } })) {
		counter++;
		slug = `${baseSlug}-${counter}`;
	}
	return slug;
}
