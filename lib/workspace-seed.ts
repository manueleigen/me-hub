import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma";
import { DEFAULT_NAV_SECTIONS, DEFAULT_WORKSPACE_PAGES } from "@/lib/workspace-page-templates";

type DbClient = Prisma.TransactionClient | typeof prisma;

/** Creates default nav sections and pages for a new workspace. */
export async function seedWorkspaceNavAndPages(
	workspaceId: string,
	client: DbClient = prisma,
) {
	const sections = await Promise.all(
		DEFAULT_NAV_SECTIONS.map((s) =>
			client.workspaceNavSection.create({
				data: {
					workspaceId,
					title: s.title,
					order: s.order,
				},
			}),
		),
	);

	const sectionByGroup = new Map(
		DEFAULT_NAV_SECTIONS.map((s, i) => [s.group, sections[i]!.id]),
	);

	for (const page of DEFAULT_WORKSPACE_PAGES) {
		await client.workspacePage.create({
			data: {
				workspaceId,
				templateKey: page.templateKey,
				slug: page.slug,
				label: page.label,
				icon: page.icon,
				order: page.order,
				isEnabled: page.isEnabled,
				config: page.config,
				navSectionId: sectionByGroup.get(page.navGroup) ?? null,
			},
		});
	}
}
