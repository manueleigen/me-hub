/**
 * Backfill WorkspaceNavSection for workspaces created before nav sections.
 * Run: npx tsx scripts/backfill-nav-sections.ts
 */
import { prisma } from "../lib/prisma";
import {
	DEFAULT_NAV_SECTIONS,
	navGroupForTemplateKey,
} from "../lib/workspace-page-templates";

async function main() {
	const workspaces = await prisma.workspace.findMany({
		select: { id: true },
	});

	for (const { id: workspaceId } of workspaces) {
		const existing = await prisma.workspaceNavSection.count({ where: { workspaceId } });
		if (existing > 0) continue;

		const sections = await Promise.all(
			DEFAULT_NAV_SECTIONS.map((s) =>
				prisma.workspaceNavSection.create({
					data: { workspaceId, title: s.title, order: s.order },
				}),
			),
		);

		const sectionByGroup = new Map(
			DEFAULT_NAV_SECTIONS.map((s, i) => [s.group, sections[i]!.id]),
		);

		const pages = await prisma.workspacePage.findMany({
			where: { workspaceId },
			select: { id: true, templateKey: true },
		});

		for (const page of pages) {
			const group = navGroupForTemplateKey(page.templateKey);
			await prisma.workspacePage.update({
				where: { id: page.id },
				data: { navSectionId: sectionByGroup.get(group) ?? null },
			});
		}

		console.log(`Backfilled workspace ${workspaceId}`);
	}
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
