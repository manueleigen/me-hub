import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { prisma } from "@/lib/prisma";
import {
	hashMcpApiKey,
	normalizeBearerToken,
	parseMcpApiKey,
	verifyMcpApiKey,
} from "@/lib/mcp/api-key";

export type McpWorkspaceAuth = {
	workspaceId: string;
	workspaceSlug: string;
	workspaceName: string;
};

/**
 * Resolves exactly one workspace from a bearer token.
 * Fails closed: wrong format, disabled MCP, hash mismatch, or id mismatch → null.
 */
export async function resolveWorkspaceFromMcpToken(
	token: string,
): Promise<McpWorkspaceAuth | null> {
	const parsed = parseMcpApiKey(token);
	if (!parsed) return null;

	const workspace = await prisma.workspace.findUnique({
		where: { id: parsed.workspaceId },
		select: {
			id: true,
			slug: true,
			name: true,
			mcpEnabled: true,
			mcpApiKeyHash: true,
		},
	});

	if (!workspace?.mcpApiKeyHash) return null;
	if (!verifyMcpApiKey(token, workspace.mcpApiKeyHash)) return null;
	if (!workspace.mcpEnabled) {
		if (process.env.NODE_ENV === "development") {
			console.warn(
				`[mcp] Valid key for workspace "${workspace.slug}" but MCP is disabled — enable it in Workspace → Einstellungen → MCP`,
			);
		}
		return null;
	}

	// Belt-and-suspenders: stored hash must match this token's hash
	if (hashMcpApiKey(token) !== workspace.mcpApiKeyHash) return null;

	void prisma.workspace
		.update({
			where: { id: workspace.id },
			data: { mcpLastUsedAt: new Date() },
		})
		.catch(() => {});

	return {
		workspaceId: workspace.id,
		workspaceSlug: workspace.slug,
		workspaceName: workspace.name,
	};
}

export async function resolveWorkspaceFromMcpRequest(
	request: Request,
	bearerToken?: string,
): Promise<McpWorkspaceAuth | null> {
	const token =
		normalizeBearerToken(bearerToken) ??
		normalizeBearerToken(request.headers.get("authorization"));
	if (!token) return null;
	return resolveWorkspaceFromMcpToken(token);
}

/** Re-resolve from token on every tool call — never trust cached extra fields alone. */
export async function resolveWorkspaceForMcpTool(
	authInfo: AuthInfo | undefined,
): Promise<McpWorkspaceAuth | null> {
	const token = authInfo?.token;
	if (!token || typeof token !== "string") return null;
	return resolveWorkspaceFromMcpToken(token);
}

export async function verifyMcpBearerToken(
	request: Request,
	bearerToken?: string,
): Promise<AuthInfo | undefined> {
	// mcp-handler only passes the segment after the first space; read full header too
	const token =
		normalizeBearerToken(request.headers.get("authorization")) ??
		normalizeBearerToken(bearerToken);
	if (!token) return undefined;

	const workspace = await resolveWorkspaceFromMcpToken(token);
	if (!workspace) return undefined;

	return {
		token,
		clientId: workspace.workspaceId,
		scopes: ["workspace:read"],
		extra: workspace,
	};
}
