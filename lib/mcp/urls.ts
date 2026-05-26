/** Public MCP endpoint URL for workspace settings / Claude Code config. */
export function getMcpEndpointUrl(): string {
	const base =
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
		process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
		"http://localhost:3000";
	return `${base}/api/mcp/mcp`;
}
