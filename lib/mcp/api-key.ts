import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_PREFIX = "mhub_";

/** Workspace id is embedded in the key so lookup cannot return another workspace. */
export function generateMcpApiKey(workspaceId: string): {
	plaintext: string;
	hash: string;
	prefix: string;
} {
	const secret = randomBytes(24).toString("base64url");
	const plaintext = `${KEY_PREFIX}${workspaceId}_${secret}`;
	return {
		plaintext,
		hash: hashMcpApiKey(plaintext),
		prefix: `${plaintext.slice(0, 20)}…`,
	};
}

export function parseMcpApiKey(token: string): { workspaceId: string } | null {
	const trimmed = token.trim();
	if (!trimmed.startsWith(KEY_PREFIX)) return null;

	const rest = trimmed.slice(KEY_PREFIX.length);
	const separator = rest.indexOf("_");
	if (separator <= 0) return null;

	const workspaceId = rest.slice(0, separator);
	const secret = rest.slice(separator + 1);
	if (!/^[a-z0-9]+$/.test(workspaceId) || secret.length < 16) return null;

	return { workspaceId };
}

export function hashMcpApiKey(key: string): string {
	return createHash("sha256").update(key.trim()).digest("hex");
}

export function verifyMcpApiKey(key: string, storedHash: string | null | undefined): boolean {
	if (!storedHash?.trim()) return false;
	const computed = hashMcpApiKey(key);
	const a = Buffer.from(computed, "utf8");
	const b = Buffer.from(storedHash, "utf8");
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export function normalizeBearerToken(header: string | null | undefined): string | null {
	if (!header?.trim()) return null;
	const trimmed = header.trim();
	if (/^bearer\s+/i.test(trimmed)) {
		return trimmed.replace(/^bearer\s+/i, "").trim() || null;
	}
	return trimmed;
}

export function isMcpApiKeyFormat(token: string): boolean {
	return parseMcpApiKey(token) !== null;
}
