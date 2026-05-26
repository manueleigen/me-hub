import "dotenv/config";
import { prisma } from "../lib/prisma.ts";
import { parseMcpApiKey, hashMcpApiKey } from "../lib/mcp/api-key.ts";

const rows = await prisma.workspace.findMany({
	where: { mcpApiKeyHash: { not: null } },
	select: {
		id: true,
		slug: true,
		name: true,
		mcpEnabled: true,
		mcpApiKeyPrefix: true,
		mcpApiKeyHash: true,
	},
});

for (const w of rows) {
	console.log({
		slug: w.slug,
		name: w.name,
		mcpEnabled: w.mcpEnabled,
		prefix: w.mcpApiKeyPrefix,
		hashPrefix: w.mcpApiKeyHash?.slice(0, 12),
	});
}

const token = process.argv[2];
if (token) {
	const parsed = parseMcpApiKey(token);
	console.log("\nParsed:", parsed);
	if (parsed) {
		const w = rows.find((r) => r.id === parsed.workspaceId);
		console.log("Workspace row:", w);
		if (w?.mcpApiKeyHash) {
			console.log("Hash match:", hashMcpApiKey(token) === w.mcpApiKeyHash);
		}
	}
}

await prisma.$disconnect();
