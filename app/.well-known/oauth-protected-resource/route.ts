import {
	metadataCorsOptionsRequestHandler,
	protectedResourceHandler,
} from "mcp-handler";
import { getMcpEndpointUrl } from "@/lib/mcp/urls";
import { applyMcpResourceCorsAllowlist } from "@/lib/mcp/oauth-resource-cors";

/** API-key MCP — no OAuth; stops mcp-remote from parsing the login page as JSON. */
const innerGet = protectedResourceHandler({
	authServerUrls: [],
	resourceUrl: getMcpEndpointUrl(),
});

const innerOptions = metadataCorsOptionsRequestHandler();

export async function GET(request: Request) {
	const res = await innerGet(request);
	return applyMcpResourceCorsAllowlist(request, res);
}

export async function OPTIONS(request: Request) {
	const res = innerOptions();
	return applyMcpResourceCorsAllowlist(request, res);
}
