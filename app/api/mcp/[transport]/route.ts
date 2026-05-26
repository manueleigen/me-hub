import { createMcpHandler, withMcpAuth } from "mcp-handler";
import {
	resolveWorkspaceForMcpTool,
	verifyMcpBearerToken,
} from "@/lib/mcp/auth";
import { checkRateLimit, rateLimitClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function mcpAuthError(message: string) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
		isError: true,
	};
}

const mcpHandler = createMcpHandler(
	(server) => {
		server.registerTool(
			"get_workspace_info",
			{
				title: "Get workspace info",
				description:
					"Returns the MeHub workspace bound to the API key (id, name, slug). Only works when MCP is enabled for that workspace.",
				inputSchema: {},
			},
			async (_args, extra) => {
				const workspace = await resolveWorkspaceForMcpTool(extra.authInfo);
				if (!workspace) return mcpAuthError("Invalid, disabled, or expired MCP credentials.");

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									id: workspace.workspaceId,
									name: workspace.workspaceName,
									slug: workspace.workspaceSlug,
								},
								null,
								2,
							),
						},
					],
				};
			},
		);

		server.registerTool(
			"ping",
			{
				title: "Ping",
				description:
					"Health check for the workspace MCP connection. Requires a valid workspace API key.",
				inputSchema: {},
			},
			async (_args, extra) => {
				const workspace = await resolveWorkspaceForMcpTool(extra.authInfo);
				if (!workspace) return mcpAuthError("Invalid, disabled, or expired MCP credentials.");

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								pong: true,
								workspaceId: workspace.workspaceId,
								workspace: workspace.workspaceSlug,
							}),
						},
					],
				};
			},
		);
	},
	{
		serverInfo: {
			name: "mehub",
			version: "0.2.0",
		},
	},
	{
		basePath: "/api/mcp",
		streamableHttpEndpoint: "/mcp",
		sseEndpoint: "/sse",
		verboseLogs: process.env.NODE_ENV === "development",
	},
);

const authHandler = withMcpAuth(mcpHandler, verifyMcpBearerToken, {
	required: true,
	requiredScopes: ["workspace:read"],
	resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

const MCP_TRANSPORT_RATE = { limit: 180, windowMs: 60_000 };

async function rateLimitThen(
	request: Request,
	next: (req: Request) => Promise<Response>,
): Promise<Response> {
	const key = rateLimitClientKey(request, "mcp-transport");
	const limited = checkRateLimit(key, MCP_TRANSPORT_RATE);
	if (!limited.ok) {
		return new Response(JSON.stringify({ error: "Too many requests" }), {
			status: 429,
			headers: {
				"Content-Type": "application/json",
				"Retry-After": String(limited.retryAfterSec),
			},
		});
	}
	return next(request);
}

/** Claude Code probes GET without Authorization; 405 skips SSE and uses POST with Bearer. */
async function GET(request: Request) {
	if (!request.headers.get("authorization")) {
		return new Response(null, { status: 405 });
	}
	return rateLimitThen(request, authHandler);
}

async function POST(request: Request) {
	return rateLimitThen(request, authHandler);
}

async function DELETE(request: Request) {
	return rateLimitThen(request, authHandler);
}

export { GET, POST, DELETE };
