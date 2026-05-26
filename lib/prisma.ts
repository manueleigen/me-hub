import { Prisma, PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function assertWorkspaceSchemaCurrent() {
	if (process.env.NODE_ENV === "production") return;

	const workspaceFields =
		Prisma.dmmf.datamodel.models.find((m) => m.name === "Workspace")?.fields ?? [];

	const missing: string[] = [];
	if (!workspaceFields.some((f) => f.name === "vaultGithubToken")) {
		missing.push("vaultGithubToken");
	}
	if (!workspaceFields.some((f) => f.name === "mcpEnabled")) {
		missing.push("mcpEnabled");
	}

	if (missing.length > 0) {
		throw new Error(
			`[prisma] Veralteter Prisma Client (fehlt Workspace.${missing.join(", Workspace.")}). ` +
				"Bitte ausführen: npx prisma generate && npm run dev:fresh",
		);
	}
}

const prismaClientSingleton = () => {
	assertWorkspaceSchemaCurrent();
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
};

/** Bump when schema changes to drop a stale dev singleton (missing model delegates). */
const PRISMA_CLIENT_BUILD_ID = "workspace-mcp-scoped-v2-20260524";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaBuildId?: string;
};

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaBuildId !== PRISMA_CLIENT_BUILD_ID
) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaBuildId = PRISMA_CLIENT_BUILD_ID;
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
