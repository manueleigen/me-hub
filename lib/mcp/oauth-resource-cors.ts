/**
 * When MCP_RESOURCE_CORS_ORIGINS is set (comma-separated), only those Origins
 * get Access-Control-Allow-Origin on the OAuth protected-resource metadata route.
 * Omit the env var to keep library defaults (permissive CORS for MCP remote).
 */
export function parseMcpResourceCorsOrigins(): string[] | null {
	const raw = process.env.MCP_RESOURCE_CORS_ORIGINS?.trim();
	if (!raw) return null;
	const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
	return list.length ? list : null;
}

export function applyMcpResourceCorsAllowlist(
	request: Request,
	response: Response,
): Response {
	const allowlist = parseMcpResourceCorsOrigins();
	if (!allowlist) return response;

	const origin = request.headers.get("origin");
	const headers = new Headers(response.headers);

	if (origin && allowlist.includes(origin)) {
		headers.set("Access-Control-Allow-Origin", origin);
		if (headers.has("Access-Control-Allow-Credentials")) {
			headers.set("Access-Control-Allow-Credentials", "true");
		}
		return new Response(response.body, { status: response.status, headers });
	}

	headers.delete("Access-Control-Allow-Origin");
	headers.delete("Access-Control-Allow-Credentials");
	return new Response(response.body, { status: response.status, headers });
}
