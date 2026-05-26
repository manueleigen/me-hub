import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "v1";

function getEncryptionKey(): Buffer {
	const secret =
		process.env.GITHUB_TOKEN_ENCRYPTION_KEY?.trim() ||
		process.env.BETTER_AUTH_SECRET?.trim();
	if (!secret) {
		throw new Error(
			"BETTER_AUTH_SECRET (or GITHUB_TOKEN_ENCRYPTION_KEY) is required to store workspace GitHub tokens.",
		);
	}
	return createHash("sha256").update(secret).digest();
}

export function encryptGithubToken(plain: string): string {
	const trimmed = plain.trim();
	if (!trimmed) throw new Error("Token is empty");

	if (
		process.env.NODE_ENV === "production" &&
		!process.env.GITHUB_TOKEN_ENCRYPTION_KEY?.trim()
	) {
		throw new Error(
			"In Production ist GITHUB_TOKEN_ENCRYPTION_KEY erforderlich, um Workspace-GitHub-Tokens zu speichern (getrennt von BETTER_AUTH_SECRET).",
		);
	}

	const key = getEncryptionKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();

	return [
		PREFIX,
		iv.toString("base64url"),
		tag.toString("base64url"),
		encrypted.toString("base64url"),
	].join(":");
}

export function decryptGithubToken(stored: string | null | undefined): string | null {
	if (!stored?.trim()) return null;

	const parts = stored.split(":");
	if (parts.length !== 4 || parts[0] !== PREFIX) return null;

	try {
		const iv = Buffer.from(parts[1], "base64url");
		const tag = Buffer.from(parts[2], "base64url");
		const data = Buffer.from(parts[3], "base64url");
		const key = getEncryptionKey();
		const decipher = createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(tag);
		const plain = Buffer.concat([decipher.update(data), decipher.final()]);
		const token = plain.toString("utf8").trim();
		return token || null;
	} catch {
		return null;
	}
}
