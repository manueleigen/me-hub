/**
 * One-time migration: bootstraps Workspace, WorkspaceMember, WorkspacePage,
 * WorkspaceFileMirror, and UserWorkspacePreference rows for every existing User
 * that doesn't yet have a personal workspace.
 *
 * Run with: npx tsx scripts/migrate-to-workspaces.ts
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULT_WORKSPACE_PAGES = [
	{ templateKey: "vault",          slug: "vault",          label: "Vault",          icon: "FolderOpen",   order: 0, isEnabled: true, config: { dataFolder: "/" } },
	{ templateKey: "produkt-ideen",  slug: "produkt-ideen",  label: "Produkt-Ideen",  icon: "Lightbulb",    order: 1, isEnabled: true, config: { dataFolder: "product-ideas/" } },
	{ templateKey: "aufgaben",       slug: "aufgaben",       label: "Aufgaben",        icon: "ListTodo",     order: 2, isEnabled: true, config: { dataFolder: "tasks/" } },
	{ templateKey: "clients",        slug: "clients",        label: "Kunden",          icon: "Users",        order: 3, isEnabled: true, config: { dataFolder: "clients/" } },
	{ templateKey: "projects",       slug: "projects",       label: "Projekte",        icon: "FolderKanban", order: 4, isEnabled: true, config: { dataFolder: "projects/" } },
	{ templateKey: "zeiterfassung",  slug: "zeiterfassung",  label: "Zeiterfassung",   icon: "Clock",        order: 5, isEnabled: true, config: { dataFolder: "time-tracking/" } },
];

async function generateSlug(base: string): Promise<string> {
	const baseSlug = base
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

async function main() {
	console.log("Starting workspace migration...");

	const users = await prisma.user.findMany({
		include: { workspacePreference: true },
	});

	console.log(`Found ${users.length} user(s) to process.`);

	for (const user of users) {
		if (user.workspacePreference) {
			console.log(`  ✓ ${user.email} — already has a workspace preference, skipping.`);
			continue;
		}

		console.log(`  → ${user.email} — creating personal workspace...`);

		const slug = await generateSlug(user.name ?? user.email ?? user.id);

		const workspace = await prisma.workspace.create({
			data: {
				slug,
				name: user.name ? `${user.name}s Space` : "My Space",
				type: "PERSONAL",
				ownerId: user.id,
				githubSync: false,
				vaultGithubBranch: "main",
				pages: {
					createMany: { data: DEFAULT_WORKSPACE_PAGES.map((p) => ({ ...p })) },
				},
				members: {
					create: { userId: user.id, role: "OWNER" },
				},
			},
		});

		await prisma.userWorkspacePreference.create({
			data: { userId: user.id, activeWorkspaceId: workspace.id },
		});

		console.log(`     ✓ Created workspace "${workspace.name}" (slug: ${workspace.slug})`);
	}

	console.log("Migration complete.");
}

main()
	.catch((e) => {
		console.error("Migration failed:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
