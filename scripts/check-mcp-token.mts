import "dotenv/config";
import { resolveWorkspaceFromMcpToken } from "../lib/mcp/auth.ts";

const token = process.argv[2];
if (!token) {
	console.error("Usage: npx tsx scripts/check-mcp-token.mts <mhub_...>");
	process.exit(1);
}

const workspace = await resolveWorkspaceFromMcpToken(token);
console.log(workspace ?? "INVALID (disabled, wrong key, or bad format)");
